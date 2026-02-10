#!/bin/bash

# KubeGram Database Restore Script
# Interactive backup restoration with verification
# Version: 1.0.0

set -euo pipefail

# Source required libraries
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/lib"
BACKUP_DIR="$SCRIPT_DIR/backups"

source "$LIB_DIR/colors.sh"
source "$LIB_DIR/db-utils.sh"
source "$LIB_DIR/backup-manager.sh"
source "$LIB_DIR/ui.sh"

# Configuration
DEFAULT_DATABASE="kubegram"
CONTAINER_NAME="kubegram-server-postgres-1"
POSTGRES_USER="postgres"
DATABASE="$DEFAULT_DATABASE"
FORCE_MODE=false
DRY_RUN=false
VERBOSE=true

# Parse command line arguments
parse_arguments() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      --database)
        DATABASE="$2"
        shift 2
        ;;
      --backup)
        BACKUP_NAME="$2"
        shift 2
        ;;
      --force)
        FORCE_MODE=true
        shift
        ;;
      --dry-run)
        DRY_RUN=true
        shift
        ;;
      --quiet)
        VERBOSE=false
        shift
        ;;
      --help|-h)
        show_help
        exit 0
        ;;
      *)
        error "Unknown argument: $1"
        show_help
        exit 1
        ;;
    esac
  done
}

# Show help information
show_help() {
  cat << EOF
KubeGram Database Restore Script v1.0.0

USAGE:
  $0 [OPTIONS]

OPTIONS:
  --database <name>     Database to restore (default: kubegram)
  --backup <name>       Specific backup to restore
  --force              Skip confirmation prompts (DANGEROUS)
  --dry-run            Show what would be restored without executing
  --quiet              Suppress verbose output
  --help, -h           Show this help message

EXAMPLES:
  $0                                    # Interactive restore
  $0 --backup kubegram_backup_20260208_202847  # Restore specific backup
  $0 --dry-run --backup kubegram_backup_20260208_202847  # Preview restore

DATABASE MANAGEMENT:
  make restore-db                      # Interactive restore
  npm run db:restore                  # Interactive restore

WARNING: This script REPLACES all current database data. Always verify
backup integrity before proceeding with restoration.
EOF
}

# Main application flow
main() {
  parse_arguments "$@"
  
  # Initialize
  initialize_environment
  
  # Select backup if not specified
  if [[ -z "${BACKUP_NAME:-}" ]]; then
    select_backup_to_restore
  else
    restore_from_backup "$BACKUP_NAME"
  fi
}

# Initialize environment and validate prerequisites
initialize_environment() {
  log_info "🔄 Initializing KubeGram Database Restore Manager..."
  
  # Check dependencies
  if ! check_dependencies; then
    exit 1
  fi
  
  # Test database connectivity
  if ! test_database_connection; then
    error "❌ Database connection failed. Check if PostgreSQL container is running."
    exit 1
  fi
  
  log_verbose "✅ Environment initialized successfully"
}

# Show backup details and confirmation
show_backup_details() {
  local backup_name="$1"
  local backup_file="$BACKUP_DIR/$backup_name.sql"
  local metadata_file="${backup_file%.sql}.json"
  
  clear_screen
  show_header "Backup Details: $backup_name"
  
  if [[ ! -f "$backup_file" ]]; then
    log_error "❌ Backup file not found: $backup_file"
    return 1
  fi
  
  # Read metadata if available
  local timestamp="Unknown"
  local size_mb="Unknown"
  local records="Unknown"
  local checksum="Unknown"
  
  if [[ -f "$metadata_file" ]]; then
    timestamp=$(jq -r '.timestamp' "$metadata_file" 2>/dev/null || echo "Unknown")
    size_mb=$(jq -r '.total_size_mb' "$metadata_file" 2>/dev/null || echo "Unknown")
    records=$(jq -r '.total_records' "$metadata_file" 2>/dev/null || echo "Unknown")
    checksum=$(jq -r '.checksum' "$metadata_file" 2>/dev/null || echo "Unknown")
  fi
  
  # Format timestamp for display
  local formatted_time=$(date -d "$timestamp" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "$timestamp")
  
  echo "📋 Backup Information:"
  echo "   Name: $backup_name"
  echo "   Created: $formatted_time"
  echo "   Size: ${size_mb}MB"
  echo "   Records: $records"
  echo "   Checksum: ${checksum:0:16}..."
  echo ""
  
  echo "📊 Database Information:"
  echo "   Target Database: $DATABASE"
  echo "   Container: $CONTAINER_NAME"
  echo "   User: $POSTGRES_USER"
  echo ""
  
  # Show tables included in backup
  if [[ -f "${backup_file%.sql}_tables.txt" ]]; then
    echo "📋 Tables in Backup:"
    local tables_file="${backup_file%.sql}_tables.txt"
    local table_count=$(wc -l < "$tables_file")
    echo "   Total Tables: $table_count"
    
    # Show first few tables
    echo "   Sample Tables: $(head -3 "$tables_file" | tr '\n' ' ')"
    if [[ $table_count -gt 3 ]]; then
      echo "   ... and $((table_count - 3)) more"
    fi
    echo ""
  fi
  
  return 0
}

# Confirm restore operation
confirm_restore() {
  local backup_name="$1"
  
  echo "⚠️  DANGEROUS OPERATION WARNING ⚠️"
  echo ""
  echo "This will REPLACE ALL CURRENT DATA in database '$DATABASE'"
  echo "with the data from backup '$backup_name'"
  echo ""
  echo "⚠️  This operation CANNOT be undone!"
  echo ""
  
  if [[ "$FORCE_MODE" != "true" ]]; then
    echo "Type 'RESTORE' to confirm the restore operation:"
    read -p "RESTORE: " confirmation
    
    if [[ "$confirmation" != "RESTORE" ]]; then
      log_info "❌ Restore cancelled by user"
      return 1
    fi
  fi
  
  return 0
}

# Restore from backup with progress tracking
restore_from_backup() {
  local backup_name="$1"
  local backup_file="$BACKUP_DIR/$backup_name.sql"
  
  log_info "🔄 Starting database restore from: $backup_name"
  
  # Show backup details
  if ! show_backup_details "$backup_name"; then
    return 1
  fi
  
  # Confirm operation
  if ! confirm_restore "$backup_name"; then
    return 1
  fi
  
  # Verify backup integrity
  log_verbose "🔍 Verifying backup integrity..."
  if ! verify_backup_integrity "$backup_name"; then
    return 1
  fi
  
  # Perform restore
  if [[ "$DRY_RUN" != "true" ]]; then
    log_info "📥 Restoring database..."
    
    # Start progress tracking
    local start_time=$(date +%s)
    
    # Execute restore
    local restore_cmd="docker exec -i $CONTAINER_NAME psql -U $POSTGRES_USER -d $DATABASE"
    
    if cat "$backup_file" | $restore_cmd; then
      local duration=$(($(date +%s) - start_time))
      log_success "✅ Database restore completed successfully! (${duration}s)"
    else
      log_error "❌ Database restore failed"
      return 1
    fi
  else
    log_info "🔍 DRY RUN: Would restore from $backup_file"
  fi
  
  # Verify restore
  log_verbose "🔍 Verifying restore integrity..."
  if verify_database_integrity; then
    log_success "✅ Database verification passed"
    
    # Show post-restore status
    show_post_restore_status
    return 0
  else
    log_error "❌ Database verification failed"
    return 1
  fi
}

# Verify backup integrity
verify_backup_integrity() {
  local backup_name="$1"
  local backup_file="$BACKUP_DIR/$backup_name.sql"
  local metadata_file="${backup_file%.sql}.json"
  
  # Check if backup file exists and is readable
  if [[ ! -f "$backup_file" ]]; then
    log_error "❌ Backup file not found: $backup_file"
    return 1
  fi
  
  if [[ ! -r "$backup_file" ]]; then
    log_error "❌ Backup file not readable: $backup_file"
    return 1
  fi
  
  # Verify metadata and checksum if available
  if [[ -f "$metadata_file" ]]; then
    local stored_checksum=$(jq -r '.checksum // "unknown"' "$metadata_file" 2>/dev/null)
    
    if [[ "$stored_checksum" != "unknown" ]]; then
      local current_checksum=$(shasum -a 256 "$backup_file" | awk '{print $1}')
      
      if [[ "$current_checksum" != "$stored_checksum" ]]; then
        log_error "❌ Backup integrity check failed!"
        log_error "   Expected checksum: $stored_checksum"
        log_error "   Actual checksum:   $current_checksum"
        return 1
      fi
      
      log_success "✅ Backup integrity verified"
    fi
  else
    log_warning "⚠️  No metadata file found, skipping integrity check"
  fi
  
  return 0
}

# Show post-restore status
show_post_restore_status() {
  echo ""
  echo "📊 Post-Restore Status:"
  echo ""
  
  # Get current database tables
  get_database_tables
  
  local total_records=0
  for table in "${ALL_TABLES[@]}"; do
    local count=$(get_table_record_count "$table")
    ((total_records += count))
  done
  
  echo "   Total Tables: ${#ALL_TABLES[@]}"
  echo "   Total Records: $total_records"
  echo ""
  
  # Show a few sample table records
  echo "📋 Sample Table Status:"
  for table in "${ALL_TABLES[@]:0:5}"; do
    local count=$(get_table_record_count "$table")
    printf "• %-20s: %d records\n" "$table" "$count"
  done
  
  if [[ ${#ALL_TABLES[@]} -gt 5 ]]; then
    echo "   ... and $(( ${#ALL_TABLES[@]} - 5 )) more tables"
  fi
  
  echo ""
  log_success "✅ Database restore completed successfully!"
}

# Entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi