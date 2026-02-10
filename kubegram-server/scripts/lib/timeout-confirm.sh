#!/bin/bash

# Timeout-based confirmation system for safety-critical operations
# Provides secure confirmation with automatic timeout and heartbeat

# Source required libraries
source "$LIB_DIR/colors.sh"

# Global variables for timeout management
TIMEOUT_PID=""
TIMEOUT_END_TIME=""
CONFIRMATION_RECEIVED=false

# Timed confirmation with countdown and auto-cancel
timed_confirmation() {
  local message="$1"
  local required_text="$2"
  local timeout_seconds="$3"
  
  log_warning "⏰ Timed confirmation required (${timeout_seconds}s timeout)"
  echo ""
  
  # Calculate end time
  TIMEOUT_END_TIME=$(($(date +%s) + timeout_seconds))
  
  # Start timeout monitor in background
  start_timeout_monitor "$timeout_seconds" &
  TIMEOUT_PID=$!
  
  # Capture input with timeout
  local input=""
  local remaining_time=$timeout_seconds
  
  while [[ $remaining_time -gt 0 && "$CONFIRMATION_RECEIVED" != "true" ]]; do
    remaining_time=$((TIMEOUT_END_TIME - $(date +%s)))
    
    if [[ $remaining_time -le 0 ]]; then
      break
    fi
    
    printf "\rType '%s' to confirm: [%-${#required_text}s] %ds remaining" \
      "$required_text" "$input" "$remaining_time"
    
    # Read single character with 1-second timeout
    read -t1 -n1 char 2>/dev/null || true
    
    if [[ -n "$char" ]]; then
      if [[ "$char" == $'\x7f' || "$char" == $'\x08' ]]; then
        # Backspace
        input="${input%?}"
      elif [[ "$char" == $'\x0a' ]] || [[ "$char" == $'\x0d' ]]; then
        # Enter key
        break
      else
        input+="$char"
      fi
    fi
  done
  
  # Kill timeout monitor
  if [[ -n "$TIMEOUT_PID" ]]; then
    kill "$TIMEOUT_PID" 2>/dev/null || true
    wait "$TIMEOUT_PID" 2>/dev/null || true
  fi
  
  echo ""
  
  # Check result
  if [[ "$input" == "$required_text" ]]; then
    CONFIRMATION_RECEIVED=true
    log_success "✅ Confirmed!"
    return 0
  elif [[ $remaining_time -le 0 ]]; then
    log_error "🚨 TIMEOUT: Operation cancelled for safety"
    log_info "💡 Use --force flag to override timeout (not recommended)"
    return 1
  else
    log_warning "❌ Incorrect confirmation: '$input'"
    return 1
  fi
}

# Start timeout monitor in background
start_timeout_monitor() {
  local timeout="$1"
  
  (
    # Countdown with visual feedback
    for ((i=timeout; i>0; i--)); do
      sleep 1
      
      # Check if parent process is still running
      if ! kill -0 $$ 2>/dev/null; then
        break
      fi
    done
    
    # Timeout reached
    if [[ "$CONFIRMATION_RECEIVED" != "true" ]]; then
      printf "\r\033[K"  # Clear line
      log_error "🚨 TIMEOUT: Automatic safety cancellation triggered"
      kill $$ 2>/dev/null || true
    fi
  ) &
}

# Multi-level confirmation system for dangerous operations
multi_level_confirmation() {
  local operation="$1"
  local tables=("${@:2}")
  
  # Level 1: Selection Confirmation (60s timeout)
  if ! confirm_selection "$operation" "${tables[@]}"; then
    return 1
  fi
  
  # Level 2: Impact Confirmation (45s timeout)
  if ! confirm_impact "$operation" "${tables[@]}"; then
    return 1
  fi
  
  # Level 3: Final Confirmation (30s timeout)
  if ! confirm_final "$operation" "${tables[@]}"; then
    return 1
  fi
  
  return 0
}

# Level 1: Confirm table selection
confirm_selection() {
  local operation="$1"
  local tables=("${@:2}")
  
  clear_screen
  show_header "Selection Confirmation"
  
  echo "📋 Selected Operation: $operation"
  echo ""
  
  echo "Tables to be processed:"
  for table in "${tables[@]}"; do
    local count=$(get_table_record_count "$table")
    printf "• %-25s (%d records)\n" "$table" "$count"
  done
  
  echo ""
  echo "Total tables: ${#tables[@]}"
  echo ""
  
  if ! timed_confirmation "Confirm selection (type 'CONFIRM'):" "CONFIRM" 60; then
    return 1
  fi
  
  return 0
}

# Level 2: Confirm impact and dependencies
confirm_impact() {
  local operation="$1"
  local tables=("${@:2}")
  
  clear_screen
  show_header "Impact Confirmation"
  
  echo "📊 Impact Analysis:"
  echo ""
  
  # Calculate impact
  local total_records=0
  local total_size=0
  
  for table in "${tables[@]}"; do
    local count=$(get_table_record_count "$table")
    local size_bytes=$(get_table_size "$table" | awk '{print $2}' | head -1)
    
    ((total_records += count))
    ((total_size += size_bytes))
  done
  
  local size_mb=$(echo "scale=2; $total_size / 1024 / 1024" | bc -l)
  
  echo "📈 Database Impact:"
  printf "• Tables affected: %d\n" "${#tables[@]}"
  printf "• Records to delete: %d\n" "$total_records"
  printf "• Data size to clear: %.2f MB\n" "$size_mb"
  echo ""
  
  # Show dependency warnings
  echo "⚠️  Dependency Warnings:"
  show_dependency_warnings "${tables[@]}"
  echo ""
  
  echo "💾 Backup will be created before clearing."
  echo ""
  
  if ! timed_confirmation "Confirm impact understanding (type 'UNDERSTAND'):" "UNDERSTAND" 45; then
    return 1
  fi
  
  return 0
}

# Level 3: Final confirmation
confirm_final() {
  local operation="$1"
  local tables=("${@:2}")
  
  clear_screen
  show_header "Final Confirmation"
  
  echo "🚨 FINAL WARNING - IRREVERSIBLE OPERATION 🚨"
  echo ""
  echo "This will PERMANENTLY DELETE ALL DATA in:"
  echo ""
  
  for table in "${tables[@]}"; do
    printf "• %s\n" "$table"
  done
  
  echo ""
  echo "There is NO UNDO for this operation!"
  echo ""
  echo "💾 Backup location: $BACKUP_DIR"
  echo "⏰ This confirmation will timeout in 30 seconds for safety."
  echo ""
  
  if ! timed_confirmation "Type 'DELETE ALL DATA' to proceed:" 'DELETE ALL DATA' 30; then
    return 1
  fi
  
  return 0
}

# Show dependency warnings for selected tables
show_dependency_warnings() {
  local selected_tables=("$@")
  local warnings_found=false
  
  # Check each selected table for dependents
  for table in "${selected_tables[@]}"; do
    local dependents=""
    
    # Find tables that depend on this table
    for other_table in "${ALL_TABLES[@]}"; do
      if [[ " ${selected_tables[*]} " =~ " $other_table " ]]; then
        continue
      fi
      
      local deps="${TABLE_DEPENDENCIES[$other_table]:-}"
      if [[ " $deps " =~ " $table " ]]; then
        dependents+="$other_table "
      fi
    done
    
    if [[ -n "$dependents" ]]; then
      echo "• '$table' is referenced by: $dependents"
      warnings_found=true
    fi
  done
  
  if [[ "$warnings_found" == "false" ]]; then
    echo "• No dependency conflicts detected"
  fi
}

# Emergency safety override (use with caution)
emergency_override() {
  local override_code="$1"
  local expected_code="EMERGENCY_OVERRIDE_$(date +%Y%m%d)"
  
  if [[ "$override_code" == "$expected_code" ]]; then
    log_warning "⚠️  Emergency override activated!"
    log_warning "   All safety checks are being bypassed!"
    return 0
  else
    log_error "❌ Invalid emergency override code"
    return 1
  fi
}

# Heartbeat monitor for long operations
start_heartbeat_monitor() {
  local operation="$1"
  local interval="${2:-5}"
  
  (
    while kill -0 $$ 2>/dev/null; do
      printf "\r💓 $operation in progress... %s " "$(date '+%H:%M:%S')"
      sleep $interval
    done
  ) &
  
  echo "$!" > /tmp/heartbeat_pid
}

# Stop heartbeat monitor
stop_heartbeat_monitor() {
  if [[ -f /tmp/heartbeat_pid ]]; then
    local pid=$(cat /tmp/heartbeat_pid)
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
    rm -f /tmp/heartbeat_pid
    printf "\r\033[K"  # Clear line
  fi
}

# Safe prompt with input validation
safe_prompt() {
  local prompt="$1"
  local validation_regex="$2"
  local max_attempts="${3:-3}"
  local error_message="${4:-Invalid input}"
  
  local attempt=1
  
  while [[ $attempt -le $max_attempts ]]; do
    read -p "$prompt: " input
    
    if [[ "$input" =~ $validation_regex ]]; then
      echo "$input"
      return 0
    fi
    
    log_error "❌ $error_message (attempt $attempt/$max_attempts)"
    ((attempt++))
  done
  
  log_error "❌ Maximum attempts exceeded"
  return 1
}