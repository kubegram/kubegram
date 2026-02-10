#!/bin/bash

# KubeGram Database Clearing Script
# Interactive table selection with comprehensive safety measures
# Version: 1.0.0

set -euo pipefail

# Source required libraries
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/lib"
BACKUP_DIR="$SCRIPT_DIR/backups"

source "$LIB_DIR/colors.sh"
source "$LIB_DIR/db-utils.sh"
source "$LIB_DIR/table-manager.sh"
source "$LIB_DIR/backup-manager.sh"
source "$LIB_DIR/ui.sh"
source "$LIB_DIR/timeout-confirm.sh"

# Configuration
DEFAULT_DATABASE="kubegram"
MAX_BACKUPS=2
CONTAINER_NAME="kubegram-server-postgres-1"
POSTGRES_USER="postgres"

# Global variables
DATABASE="$DEFAULT_DATABASE"
SELECTED_TABLES=()
FORCE_MODE=false
DRY_RUN=false
NO_BACKUP=false
VERBOSE=true
BACKUP_ONLY=false
STATUS_ONLY=false

# Initialize global arrays
ALL_TABLES=()
ALL_TABLES_TO_CLEAR=()
ALL_SEQUENCES=()
CURRENT_BACKUP_FILE=""

# Parse command line arguments
parse_arguments() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      --database)
        DATABASE="$2"
        shift 2
        ;;
      --tables)
        IFS=',' read -ra SELECTED_TABLES <<< "$2"
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
      --no-backup)
        NO_BACKUP=true
        shift
        ;;
      --quiet)
        VERBOSE=false
        shift
        ;;
      --backup-only)
        BACKUP_ONLY=true
        shift
        ;;
      --status-only)
        STATUS_ONLY=true
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
KubeGram Database Clearing Script v1.0.0

USAGE:
  $0 [OPTIONS]

OPTIONS:
  --database <name>     Database to manage (default: kubegram)
  --tables <list>       Comma-separated list of tables to clear
  --force              Skip all confirmation prompts (DANGEROUS)
  --dry-run            Show what would be done without executing
  --no-backup          Skip creating backup before clearing
  --quiet              Suppress verbose output
  --backup-only        Create backup without clearing tables
  --status-only        Show current database status only
  --help, -h           Show this help message

EXAMPLES:
  $0                                    # Interactive mode
  $0 --tables users,projects            # Clear specific tables
  $0 --dry-run --tables users           # Preview table clearing
  $0 --backup-only                     # Create backup only
  $0 --force --no-backup --all          # Force clear without backup

DATABASE MANAGEMENT:
  make clear-db                         # Interactive clearing
  npm run db:clear                     # Interactive clearing
  make db-status                        # Show database status
  make db-backup                        # Create backup

WARNING: This script permanently deletes database data. Always create backups
and review confirmation prompts before proceeding.
EOF
}

# Main application flow
main() {
  # Parse command line arguments
  parse_arguments "$@"
  
  # Initialize
  initialize_environment
  
  if [[ "$STATUS_ONLY" == "true" ]]; then
    show_database_status
    exit 0
  fi
  
  if [[ "$BACKUP_ONLY" == "true" ]]; then
    create_backup_operation
    exit 0
  fi
  
  # Interactive mode if no tables specified
  if [[ ${#SELECTED_TABLES[@]} -eq 0 ]]; then
    run_interactive_mode
  else
    run_cli_mode
  fi
}

# Initialize environment and validate prerequisites
initialize_environment() {
  log_info "🚀 Initializing KubeGram Database Manager..."
  
  # Validate environment
  if [[ "$VERBOSE" == "true" ]]; then
    log_verbose "🔍 Detecting environment: Docker-based development"
    log_verbose "📡 Testing database connectivity..."
  fi
  
  # Test database connectivity
  if ! test_database_connection; then
    error "❌ Database connection failed. Check if PostgreSQL container is running."
    exit 1
  fi
  
  # Create backup directory if it doesn't exist
  mkdir -p "$BACKUP_DIR"
  
  # Get list of all tables
  get_database_tables
  
  if [[ "$VERBOSE" == "true" ]]; then
    log_verbose "✅ Database connectivity established"
    log_verbose "📋 Found ${#ALL_TABLES[@]} tables in database '$DATABASE'"
  fi
}

# Interactive mode with checkbox selection
run_interactive_mode() {
  show_main_menu
  
  case $MENU_CHOICE in
    1) select_tables_interactive ;;
    2) create_backup_operation ;;
    3) run_restore_script ;;
    4) show_database_status ;;
    5) exit 0 ;;
    *) error "Invalid choice" && exit 1 ;;
  esac
}

# Command line mode (non-interactive)
run_cli_mode() {
  log_info "🎯 CLI Mode: Clearing specified tables"
  
  # Validate selected tables
  validate_table_selection "${SELECTED_TABLES[@]}"
  
  # Show dependencies
  analyze_and_show_dependencies "${SELECTED_TABLES[@]}"
  
  # Confirm operation
  if [[ "$FORCE_MODE" != "true" ]]; then
    if ! confirm_table_clearing "${SELECTED_TABLES[@]}"; then
      log_info "❌ Operation cancelled"
      exit 0
    fi
  fi
  
  # Execute clearing
  execute_database_clearing "${ALL_TABLES_TO_CLEAR[@]}"
}

# Execute the actual database clearing operation
execute_database_clearing() {
  local tables_to_clear=("$@")
  
  log_info "🗑️  Starting database clearing operation..."
  
  local start_time=$(date +%s)
  local total_tables=${#tables_to_clear[@]}
  
  # Start heartbeat monitor
  start_heartbeat_monitor "Clearing database" 3
  
  # Step 1: Create backup (unless skipped)
  if [[ "$NO_BACKUP" != "true" ]]; then
    log_verbose "💾 Creating backup before clearing..."
    
    if ! create_backup; then
      log_error "❌ Backup creation failed, aborting operation"
      stop_heartbeat_monitor
      return 1
    fi
    
    # Manage backup rotation
    manage_backup_rotation
  fi
  
  # Step 2: Clear tables in dependency order
  log_verbose "🔧 Clearing tables in dependency order..."
  
  local cleared_count=0
  for table in "${tables_to_clear[@]}"; do
    ((cleared_count++))
    
    log_verbose "   Clearing $table ($cleared_count/$total_tables)..."
    
    if truncate_table "$table"; then
      log_verbose "   ✅ Cleared $table"
    else
      log_error "   ❌ Failed to clear $table"
      stop_heartbeat_monitor
      return 1
    fi
  done
  
  # Step 3: Reset sequences
  log_verbose "🔢 Resetting database sequences..."
  get_database_sequences
  
  local reset_count=0
  for sequence in "${ALL_SEQUENCES[@]}"; do
    ((reset_count++))
    
    if reset_sequence "$sequence"; then
      log_verbose "   ✅ Reset $sequence"
    else
      log_error "   ❌ Failed to reset $sequence"
    fi
  done
  
  # Stop heartbeat monitor
  stop_heartbeat_monitor
  
  # Step 4: Verify operation
  log_verbose "🔍 Verifying clearing operation..."
  if verify_database_integrity; then
    local duration=$(($(date +%s) - start_time))
    
    echo ""
    complete_operation "Database clearing" "$duration" \
      "Cleared $total_tables tables, reset $reset_count sequences"
    
    if [[ "$NO_BACKUP" != "true" ]]; then
      echo "📦 Backup created: $CURRENT_BACKUP_FILE"
    fi
    
    return 0
  else
    log_error "❌ Database verification failed after clearing"
    return 1
  fi
}

# Error handling function
error() {
  echo -e "${RED}ERROR: $1${NC}" >&2
  exit 1
}

# Entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi