#!/bin/bash

# Backup creation, restoration, and rotation management
# Provides comprehensive backup functionality with metadata tracking

# Source required libraries
source "$LIB_DIR/colors.sh"
source "$LIB_DIR/db-utils.sh"

# Create a full database backup with metadata
create_backup() {
  local backup_name="kubegram_backup_$(compact_timestamp)"
  local backup_file="$BACKUP_DIR/$backup_name.sql"
  local metadata_file="$BACKUP_DIR/$backup_name.json"
  local tables_file="$BACKUP_DIR/${backup_name}_tables.txt"
  
  log_info "💾 Creating database backup: $backup_name"
  
  # Create backup directory if it doesn't exist
  mkdir -p "$BACKUP_DIR"
  
  # Get table information before backup
  local table_info=()
  local total_records=0
  local total_size=0
  
  for table in "${ALL_TABLES[@]}"; do
    local count=$(get_table_record_count "$table")
    local size_bytes=$(get_table_size "$table" | awk '{print $2}' | head -1)
    
    table_info+=("{\"table\":\"$table\",\"records\":$count,\"size_bytes\":$size_bytes}")
    ((total_records += count))
    ((total_size += size_bytes))
  done
  
  # Create the SQL backup
  log_verbose "📦 Dumping database structure and data..."
  
  local backup_cmd="docker exec $CONTAINER_NAME pg_dump -U $POSTGRES_USER -d $DATABASE --no-owner --no-privileges"
  
  if [[ "$VERBOSE" == "true" ]]; then
    backup_cmd="$backup_cmd --verbose"
  fi
  
  # Show progress for large backups
  if [[ "$DRY_RUN" != "true" ]]; then
    start_backup_progress
    
    $backup_cmd > "$backup_file" 2>/dev/null
    local backup_result=$?
    
    stop_backup_progress
    
    if [[ $backup_result -ne 0 ]]; then
      log_error "❌ Backup creation failed"
      return 1
    fi
  else
    log_verbose "🔍 DRY RUN: Would create backup at $backup_file"
  fi
  
  # Create metadata file
  local metadata=$(cat << EOF
{
  "backup_id": "$backup_name",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "database": "$DATABASE",
  "container": "$CONTAINER_NAME",
  "tables_backed_up": [$(IFS=','; echo "${ALL_TABLES[*]}")],
  "table_details": [$(IFS=','; echo "${table_info[*]}")],
  "total_records": $total_records,
  "total_size_bytes": $total_size,
  "total_size_mb": $(echo "scale=2; $total_size / 1024 / 1024" | bc -l),
  "backup_file": "$backup_file",
  "created_by": "clear-database.sh v1.0.0",
  "environment": "${NODE_ENV:-development}"
}
EOF
)
  
  if [[ "$DRY_RUN" != "true" ]]; then
    echo "$metadata" > "$metadata_file"
    
    # Create table list file
    printf "%s\n" "${ALL_TABLES[@]}" > "$tables_file"
    
    # Generate checksum
    local checksum=$(shasum -a 256 "$backup_file" | awk '{print $1}')
    log_verbose "🔐 Backup checksum: $checksum"
    
    # Show backup summary
    local size_mb=$(echo "scale=2; $total_size / 1024 / 1024" | bc -l)
    log_success "✅ Backup created successfully!"
    echo "📁 Location: $backup_file"
    echo "💾 Size: ${size_mb}MB"
    echo "📊 Records: $total_records"
    echo "🔐 Checksum: $checksum"
  fi
  
  CURRENT_BACKUP_FILE="$backup_file"
  return 0
}

# Backup progress indicator
start_backup_progress() {
  echo -n "💾 Creating backup... "
  BACKUP_START_TIME=$(date +%s)
}

stop_backup_progress() {
  local duration=$(($(date +%s) - BACKUP_START_TIME))
  printf "✅ (%ds)\n" "$duration"
}

# List available backups with detailed information
list_backups() {
  log_info "📦 Available Backups (Maximum: $MAX_BACKUPS)"
  echo ""
  
  if [[ ! -d "$BACKUP_DIR" ]] || [[ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]]; then
    log_warning "⚠️  No backups found in $BACKUP_DIR"
    return 1
  fi
  
  # Find backup files
  local backup_files=("$BACKUP_DIR"/*.sql)
  backup_files=($(ls -t "${backup_files[@]}" 2>/dev/null))
  
  if [[ ${#backup_files[@]} -eq 0 ]]; then
    log_warning "⚠️  No backup files found"
    return 1
  fi
  
  # Display backup list
  printf "%-35s %-10s %-15s %-20s %s\n" "Backup Name" "Size" "Records" "Created" "Status"
  draw_horizontal_line 90
  
  local backup_index=0
  for backup_file in "${backup_files[@]}"; do
    local backup_name=$(basename "$backup_file" .sql)
    local metadata_file="${backup_file%.sql}.json"
    
    if [[ -f "$metadata_file" ]]; then
      # Read metadata
      local size_mb=$(jq -r '.total_size_mb' "$metadata_file" 2>/dev/null || echo "N/A")
      local records=$(jq -r '.total_records' "$metadata_file" 2>/dev/null || echo "N/A")
      local timestamp=$(jq -r '.timestamp' "$metadata_file" 2>/dev/null || echo "N/A")
      
      # Format timestamp for display
      local formatted_time=$(date -d "$timestamp" '+%Y-%m-%d %H:%M' 2>/dev/null || echo "$timestamp")
      
      # Determine status
      local status="✅ Valid"
      if [[ ! -f "$backup_file" ]]; then
        status="❌ Missing"
      elif [[ ! -f "$metadata_file" ]]; then
        status="⚠️  Incomplete"
      fi
      
      printf "%-35s %-10s %-15s %-20s %s\n" \
        "$backup_name" "${size_mb}MB" "$records" "$formatted_time" "$status"
    else
      printf "%-35s %-10s %-15s %-20s %s\n" \
        "$backup_name" "N/A" "N/A" "Unknown" "⚠️  No metadata"
    fi
    
    ((backup_index++))
    
    # Stop at MAX_BACKUPS + 1 to show what will be cleaned up
    if [[ $backup_index -gt $MAX_BACKUPS ]]; then
      break
    fi
  done
  
  # Show cleanup information
  if [[ ${#backup_files[@]} -gt $MAX_BACKUPS ]]; then
    echo ""
    log_warning "⚠️  ${#backup_files[@]} backups found, keeping $MAX_BACKUPS most recent"
    log_info "🗑️  $(( ${#backup_files[@]} - MAX_BACKUPS )) old backups will be cleaned up"
  fi
  
  echo ""
}

# Manage backup rotation (keep only MAX_BACKUPS most recent)
manage_backup_rotation() {
  log_verbose "🔄 Managing backup rotation (max: $MAX_BACKUPS)"
  
  # Find all backup files, sorted by modification time (newest first)
  local backup_files=("$BACKUP_DIR"/*.sql)
  backup_files=($(ls -t "${backup_files[@]}" 2>/dev/null))
  
  if [[ ${#backup_files[@]} -le $MAX_BACKUPS ]]; then
    log_verbose "✅ No cleanup needed (${#backup_files[@]} ≤ $MAX_BACKUPS)"
    return 0
  fi
  
  # Remove old backups
  local files_to_remove=${#backup_files[@]} - MAX_BACKUPS
  log_info "🗑️  Cleaning up $files_to_remove old backup(s)..."
  
  for ((i=$MAX_BACKUPS; i<${#backup_files[@]}; i++)); do
    local old_backup="${backup_files[$i]}"
    local backup_name=$(basename "$old_backup" .sql)
    local metadata_file="${old_backup%.sql}.json"
    local tables_file="${old_backup%.sql}_tables.txt"
    
    log_verbose "   Removing: $backup_name"
    
    # Remove backup file and associated metadata
    if [[ -f "$old_backup" ]]; then
      rm "$old_backup"
      log_verbose "     ✅ Removed SQL file"
    fi
    
    if [[ -f "$metadata_file" ]]; then
      rm "$metadata_file"
      log_verbose "     ✅ Removed metadata file"
    fi
    
    if [[ -f "$tables_file" ]]; then
      rm "$tables_file"
      log_verbose "     ✅ Removed tables list file"
    fi
  done
  
  log_success "✅ Backup rotation completed"
}

# Restore database from backup
restore_from_backup() {
  local backup_name="$1"
  local backup_file="$BACKUP_DIR/$backup_name.sql"
  local metadata_file="${backup_file%.sql}.json"
  
  log_info "🔄 Restoring database from backup: $backup_name"
  
  # Validate backup exists
  if [[ ! -f "$backup_file" ]]; then
    log_error "❌ Backup file not found: $backup_file"
    return 1
  fi
  
  if [[ ! -f "$metadata_file" ]]; then
    log_warning "⚠️  Metadata file not found, proceeding anyway"
  fi
  
  # Verify backup integrity if metadata exists
  if [[ -f "$metadata_file" ]]; then
    local stored_checksum=$(jq -r '.checksum // "unknown"' "$metadata_file" 2>/dev/null)
    if [[ "$stored_checksum" != "unknown" ]]; then
      local current_checksum=$(shasum -a 256 "$backup_file" | awk '{print $1}')
      if [[ "$current_checksum" != "$stored_checksum" ]]; then
        log_error "❌ Backup integrity check failed!"
        log_error "   Expected: $stored_checksum"
        log_error "   Actual:   $current_checksum"
        return 1
      fi
      log_success "✅ Backup integrity verified"
    fi
  fi
  
  # Perform restore
  log_verbose "📥 Restoring database..."
  
  local restore_cmd="docker exec -i $CONTAINER_NAME psql -U $POSTGRES_USER -d $DATABASE"
  
  if [[ "$DRY_RUN" != "true" ]]; then
    cat "$backup_file" | $restore_cmd
    
    if [[ $? -eq 0 ]]; then
      log_success "✅ Database restore completed successfully!"
    else
      log_error "❌ Database restore failed"
      return 1
    fi
  else
    log_verbose "🔍 DRY RUN: Would restore from $backup_file"
  fi
  
  # Verify restore
  log_verbose "🔍 Verifying restore..."
  if verify_database_integrity; then
    log_success "✅ Database verification passed"
    return 0
  else
    log_error "❌ Database verification failed"
    return 1
  fi
}

# Interactive backup selection and restoration
select_backup_to_restore() {
  list_backups
  
  # Get list of available backups
  local backup_files=("$BACKUP_DIR"/*.sql)
  backup_files=($(ls -t "${backup_files[@]}" 2>/dev/null))
  
  if [[ ${#backup_files[@]} -eq 0 ]]; then
    log_warning "⚠️  No backups available for restoration"
    return 1
  fi
  
  echo "🔄 Select backup to restore:"
  echo ""
  
  local backup_index=0
  for backup_file in "${backup_files[@]}"; do
    local backup_name=$(basename "$backup_file" .sql)
    local metadata_file="${backup_file%.sql}.json"
    
    local size_mb="N/A"
    local records="N/A"
    local created_time="Unknown"
    
    if [[ -f "$metadata_file" ]]; then
      size_mb=$(jq -r '.total_size_mb' "$metadata_file" 2>/dev/null || echo "N/A")
      records=$(jq -r '.total_records' "$metadata_file" 2>/dev/null || echo "N/A")
      local timestamp=$(jq -r '.timestamp' "$metadata_file" 2>/dev/null || echo "N/A")
      created_time=$(date -d "$timestamp" '+%Y-%m-%d %H:%M' 2>/dev/null || echo "$timestamp")
    fi
    
    printf "%d. %-35s (%sMB, %s records, %s)\n" \
      $((backup_index + 1)) "$backup_name" "$size_mb" "$records" "$created_time"
    
    ((backup_index++))
  done
  
  echo ""
  read -p "Enter backup number (or 0 to cancel): " selection
  
  if [[ "$selection" == "0" ]]; then
    log_info "❌ Restore cancelled"
    return 0
  fi
  
  if [[ "$selection" =~ ^[0-9]+$ ]] && [[ $selection -ge 1 ]] && [[ $selection -le ${#backup_files[@]} ]]; then
    local selected_file="${backup_files[$((selection - 1))]}"
    local selected_name=$(basename "$selected_file" .sql)
    
    echo ""
    echo "⚠️  WARNING: This will REPLACE all current data!"
    echo ""
    read -p "Type 'RESTORE' to confirm: " confirmation
    
    if [[ "$confirmation" == "RESTORE" ]]; then
      restore_from_backup "$selected_name"
    else
      log_info "❌ Restore cancelled"
    fi
  else
    log_error "❌ Invalid selection: $selection"
    return 1
  fi
}

# Create backup operation (standalone)
create_backup_operation() {
  log_info "💾 Creating database backup only"
  
  # Get current tables
  get_database_tables
  
  # Create backup
  if create_backup; then
    # Manage rotation
    manage_backup_rotation
    
    log_success "✅ Backup operation completed"
  else
    log_error "❌ Backup operation failed"
    return 1
  fi
}