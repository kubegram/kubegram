#!/bin/bash

# Interactive UI components and menu system
# Provides user interface elements, menus, and interaction handling

# Source required libraries
source "$LIB_DIR/colors.sh"

# Clear screen and show header
clear_screen() {
  clear
}

show_header() {
  local title="$1"
  echo "┌─────────────────────────────────────────────────────────────┐"
  echo "│              $title              │"
  echo "└─────────────────────────────────────────────────────────────┘"
  echo ""
}

# Show main menu
show_main_menu() {
  clear_screen
  show_header "KubeGram Database Manager"
  
  echo "🚀 KubeGram Database Manager v1.0.0"
  echo "Database: $DATABASE"
  echo "Environment: ${NODE_ENV:-development}"
  echo ""
  
  echo "📋 Main Menu:"
  echo ""
  echo "1. 🗃️  Clear Database          - Clear selected tables with safety checks"
  echo "2. 📦  Create Backup           - Create full database backup"
  echo "3. 🔄  Restore Database        - Restore from backup"
  echo "4. 📊  Database Status        - Show current database overview"
  echo "5. ❌  Exit                   - Exit the program"
  echo ""
  
  read -p "Select an option (1-5): " MENU_CHOICE
  
  # Validate input
  if [[ ! "$MENU_CHOICE" =~ ^[1-5]$ ]]; then
    log_error "❌ Invalid selection. Please choose 1-5."
    read -p "Press Enter to try again..."
    show_main_menu
  fi
}

# Show database status overview
show_database_status() {
  clear_screen
  show_header "Database Status Overview"
  
  log_info "📊 Database: $DATABASE"
  log_info "📡 Container: $CONTAINER_NAME"
  echo ""
  
  # Test connectivity
  if test_database_connection; then
    log_success "✅ Database connection: Active"
  else
    log_error "❌ Database connection: Failed"
    return 1
  fi
  
  echo ""
  echo "📋 Table Overview:"
  echo ""
  
  # Get current tables
  get_database_tables
  
  # Display table information
  printf "%-25s %-10s %-15s %s\n" "Table" "Records" "Size" "Category"
  draw_horizontal_line 65
  
  local total_records=0
  
  # Check if ALL_TABLES is populated before using it
  if [[ ${#ALL_TABLES[@]} -gt 0 ]]; then
    for table in "${ALL_TABLES[@]}"; do
      local count=$(get_table_record_count "$table")
      local size=$(get_table_size "$table")
      local category=$(get_table_category "$table")

      printf "%-25s %-10s %-15s %s\n" "$table" "$count" "$size" "$category"

      total_records=$((total_records + count))
    done
  fi
  
  echo ""
  echo "📊 Summary:"
  echo "   Total Tables: ${#ALL_TABLES[@]}"
  echo "   Total Records: $total_records"
  echo ""
  
  # Show backup information
  echo "📦 Backup Status:"
  local backup_count=$(find "$BACKUP_DIR" -name "*.sql" 2>/dev/null | wc -l)
  echo "   Available Backups: $backup_count / $MAX_BACKUPS"
  echo "   Backup Directory: $BACKUP_DIR"
  echo ""
  
  wait_for_enter "Press Enter to return to main menu..."
}

# Wait for user to press Enter
wait_for_enter() {
  local message="${1:-Press Enter to continue...}"
  read -p "$message"
}

# Confirm table clearing operation
confirm_table_clearing() {
  local selected_tables=("$@")
  
  clear_screen
  show_header "Clear Database Confirmation"
  
  echo "⚠️  DANGEROUS OPERATION WARNING ⚠️"
  echo ""
  echo "This will PERMANENTLY DELETE data from the following tables:"
  echo ""
  
  for table in "${selected_tables[@]}"; do
    local count=$(get_table_record_count "$table")
    printf "• %-25s (%d records)\n" "$table" "$count"
  done
  
  echo ""
  echo "Total tables to clear: ${#selected_tables[@]}"
  
  if [[ "$NO_BACKUP" != "true" ]]; then
    echo ""
    log_info "💾 A backup will be created before clearing."
  fi
  
  echo ""
  echo "This operation CANNOT be undone!"
  echo ""
  
  # Use timed confirmation
  if ! timed_confirmation "Type 'DELETE ALL DATA' to confirm:" "DELETE ALL DATA" 60; then
    return 1
  fi
  
  return 0
}

# Show dependency diagram
show_dependency_diagram() {
  clear_screen
  show_header "Table Dependency Diagram"
  
  echo "📊 Visual Dependency Diagram for '$DATABASE'"
  echo ""
  
  # Main hierarchy
  echo "🏭 companies (root)"
  echo "└── 🏢 organizations"
  echo "    └── 👥 teams"
  echo "        ├── 👤 users"
  echo "        │   └── 📊 projects → ⚡ generation_jobs → 📁 generation_job_artifacts"
  echo "        └── 📊 projects → ⚡ generation_jobs → 📁 generation_job_artifacts"
  echo ""
  
  echo "🔐 company_certificates"
  echo "└── 🔑 company_llm_tokens"
  echo ""
  
  echo "🌐 Authentication: openauth_sessions, openauth_codes, openauth_kv"
  echo ""
  
  # Legend
  echo "📖 Legend:"
  echo "   → Arrow: Foreign key dependency"
  echo "   🏭 Business entities"
  echo "   👤 User management"
  echo "   🔐 Security/Certificates"
  echo "   🌐 Authentication system"
  echo "   ⚡ Generation/Processing"
  echo ""
  
  # Show dependency rules
  echo "📋 Dependency Rules:"
  echo "   • Child tables must be cleared before parent tables"
  echo "   • CASCADE DELETE automatically handles dependent rows"
  echo "   • Selecting a parent table automatically selects its children"
  echo ""
  
  wait_for_enter "Press Enter to continue..."
}

# Show operation progress
show_operation_progress() {
  local current="$1"
  local total="$2"
  local operation="$3"
  
  printf "\r%s %d/%d (%d%%)" "$operation" "$current" "$total" "$((current * 100 / total))"
}

# Complete operation with success message
complete_operation() {
  local operation="$1"
  local duration="$2"
  local details="$3"
  
  echo ""
  log_success "✅ $operation completed successfully!"
  echo "   Duration: ${duration}s"
  if [[ -n "$details" ]]; then
    echo "   Details: $details"
  fi
  echo ""
}

# Show error message and exit
show_error_and_exit() {
  local error_message="$1"
  local exit_code="${2:-1}"
  
  clear_screen
  show_header "Error"
  
  log_error "❌ $error_message"
  echo ""
  
  wait_for_enter "Press Enter to exit..."
  exit $exit_code
}

# Show success message
show_success() {
  local message="$1"
  
  clear_screen
  show_header "Success"
  
  log_success "✅ $message"
  echo ""
}

# Show loading spinner
show_spinner() {
  local pid=$1
  local message="${2:-Processing...}"
  local delay=0.1
  local spinstr='|/-\'
  
  echo -n "$message "
  
  while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
    local temp=${spinstr#?}
    printf " [%c]" "$spinstr"
    local spinstr=$temp${spinstr%"$temp"}
    sleep $delay
    printf "\b\b\b\b"
  done
  
  echo " ✓"
}

# Validate user input (numeric range)
validate_numeric_input() {
  local input="$1"
  local min="$2"
  local max="$3"
  
  if [[ ! "$input" =~ ^[0-9]+$ ]]; then
    return 1
  fi
  
  if [[ "$input" -lt $min || "$input" -gt $max ]]; then
    return 1
  fi
  
  return 0
}

# Error handling wrapper
with_error_handling() {
  local operation="$1"
  shift
  
  log_verbose "🔧 Executing: $operation"
  
  if ! "$@"; then
    log_error "❌ Failed to execute: $operation"
    return 1
  fi
  
  log_verbose "✅ Successfully executed: $operation"
  return 0
}

# Check for required dependencies
check_dependencies() {
  local missing_deps=()
  
  # Check for Docker
  if ! command -v docker &> /dev/null; then
    missing_deps+=("docker")
  fi
  
  # Check for jq (for JSON processing)
  if ! command -v jq &> /dev/null; then
    missing_deps+=("jq")
  fi
  
  # Check for bc (for math operations)
  if ! command -v bc &> /dev/null; then
    missing_deps+=("bc")
  fi
  
  if [[ ${#missing_deps[@]} -gt 0 ]]; then
    log_error "❌ Missing required dependencies: ${missing_deps[*]}"
    log_info "Please install the missing dependencies and try again."
    return 1
  fi
  
  return 0
}

# Run restore script
run_restore_script() {
  local restore_script="$SCRIPT_DIR/restore-database.sh"
  
  if [[ -f "$restore_script" ]]; then
    log_info "🔄 Launching restore script..."
    bash "$restore_script"
  else
    log_error "❌ Restore script not found: $restore_script"
    return 1
  fi
}