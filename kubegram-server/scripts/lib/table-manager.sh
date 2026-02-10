#!/bin/bash

# Table management and dependency analysis utilities
# Provides table selection, dependency resolution, and relationship mapping

# Source required libraries
source "$LIB_DIR/colors.sh"
source "$LIB_DIR/db-utils.sh"

# Helper function to get dependencies for a table
get_table_dependencies() {
  case "$1" in
    "companies") echo "organizations company_certificates company_llm_tokens" ;;
    "organizations") echo "teams" ;;
    "teams") echo "users projects" ;;
    "users") echo "projects generation_jobs" ;;
    "projects") echo "generation_jobs" ;;
    "generation_jobs") echo "generation_job_artifacts" ;;
    "company_certificates") echo "company_llm_tokens" ;;
    "company_llm_tokens") echo "" ;;
    "generation_job_artifacts") echo "" ;;
    "openauth_sessions") echo "" ;;
    "openauth_codes") echo "" ;;
    "openauth_kv") echo "" ;;
    *) echo "" ;;
  esac
}

# Helper function to get category for a table
get_table_category() {
  case "$1" in
    "companies"|"organizations"|"teams"|"projects") echo "Business" ;;
    "users") echo "User Data" ;;
    "generation_jobs"|"generation_job_artifacts") echo "System" ;;
    "company_certificates"|"company_llm_tokens") echo "Security" ;;
    "openauth_sessions"|"openauth_codes"|"openauth_kv") echo "Authentication" ;;
    *) echo "Other" ;;
  esac
}

# Calculate the correct truncation order based on dependencies
calculate_clear_order() {
  local selected_tables=("$@")
  local ordered_tables=()
  
  # Simple order for now - can be made more sophisticated later
  for table in "openauth_kv" "openauth_codes" "openauth_sessions" "generation_job_artifacts" "generation_jobs" "projects" "users" "teams" "organizations" "company_llm_tokens" "company_certificates" "companies"; do
    # Check if table is in selected list
    for selected in "${selected_tables[@]}"; do
      if [[ "$selected" == "$table" ]]; then
        ordered_tables+=("$table")
        break
      fi
    done
  done
  
  ALL_TABLES_TO_CLEAR=("${ordered_tables[@]}")
  return 0
}

# Helper: check if a space-separated list contains a value
_list_contains() {
  local item
  for item in $1; do
    [[ "$item" == "$2" ]] && return 0
  done
  return 1
}

# Get all tables that depend on selected tables (cascade effect)
get_affected_tables() {
  local selected_tables=("$@")
  local seen_list=""
  local queue=("${selected_tables[@]}")

  # Mark initial selections as seen
  for table in "${selected_tables[@]}"; do
    seen_list="$seen_list $table"
  done

  # BFS: follow dependencies to find all affected tables
  while [[ ${#queue[@]} -gt 0 ]]; do
    local current="${queue[0]}"
    queue=("${queue[@]:1}")

    local deps
    deps=$(get_table_dependencies "$current")
    local dep
    for dep in $deps; do
      if ! _list_contains "$seen_list" "$dep"; then
        seen_list="$seen_list $dep"
        queue+=("$dep")
      fi
    done
  done

  # Collect all affected tables
  ALL_TABLES_TO_CLEAR=()
  local table
  for table in $seen_list; do
    ALL_TABLES_TO_CLEAR+=("$table")
  done
}

# Validate that selected tables exist
validate_table_selection() {
  local selected_tables=("$@")
  local invalid_tables=()
  
  for table in "${selected_tables[@]}"; do
    local found=false
    for existing_table in "${ALL_TABLES[@]}"; do
      if [[ "$existing_table" == "$table" ]]; then
        found=true
        break
      fi
    done
    
    if [[ "$found" == "false" ]]; then
      invalid_tables+=("$table")
    fi
  done
  
  if [[ ${#invalid_tables[@]} -gt 0 ]]; then
    log_error "Invalid tables: ${invalid_tables[*]}"
    log_error "Available tables: ${ALL_TABLES[*]}"
    return 1
  fi
  
  return 0
}

# Analyze and show dependencies for selected tables
analyze_and_show_dependencies() {
  local selected_tables=("$@")
  
  # Get all affected tables
  get_affected_tables "${selected_tables[@]}"
  
  # Calculate safe order
  if ! calculate_clear_order "${ALL_TABLES_TO_CLEAR[@]}"; then
    return 1
  fi
  
  log_info "📊 Dependency Analysis Results"
  echo ""
  
  # Show selection summary
  echo "🎯 Selected tables: ${selected_tables[*]}"
  echo "📈 Affected tables: ${ALL_TABLES_TO_CLEAR[@]}"
  echo "📊 Total tables to clear: ${#ALL_TABLES_TO_CLEAR[@]}"
  echo ""
  
  # Show dependency chains if verbose
  if [[ "$VERBOSE" == "true" ]]; then
    show_dependency_details
  fi
}

# Show detailed dependency information
show_dependency_details() {
  echo "📈 Dependency Details:"
  echo ""
  
  for table in "${ALL_TABLES_TO_CLEAR[@]}"; do
    local category=$(get_table_category "$table")
    local deps=$(get_table_dependencies "$table")
    
    if [[ -z "$deps" ]]; then
      deps="None"
    fi
    
    printf "• %-20s (%-12s) → %s\n" "$table" "$category" "$deps"
  done
  echo ""
}

# Global indexed arrays (parallel to ALL_TABLES) for Bash 3.2 compatibility
_SELECTIONS=()
_CACHED_COUNTS=()
_CACHED_SIZES=()

# Interactive table selection with checkboxes
select_tables_interactive() {
  clear_screen
  show_header "Select Tables to Clear"

  log_info "🗂️  Select tables to clear in '$DATABASE' database"
  echo ""

  # Initialize selection state (indexed, parallel to ALL_TABLES)
  _SELECTIONS=()
  local i
  for i in "${!ALL_TABLES[@]}"; do
    _SELECTIONS[$i]="false"
  done

  # Cache table stats once before the interactive loop
  _CACHED_COUNTS=()
  _CACHED_SIZES=()
  for i in "${!ALL_TABLES[@]}"; do
    _CACHED_COUNTS[$i]=$(get_table_record_count "${ALL_TABLES[$i]}")
    _CACHED_SIZES[$i]=$(get_table_size "${ALL_TABLES[$i]}")
  done

  # Main selection loop
  local choice
  while true; do
    clear_screen
    show_header "Select Tables to Clear"

    # Show table information
    show_table_selection_overview_cached

    # Render checkboxes
    render_checkbox_menu

    echo ""
    echo "🎮 Controls:"
    echo "  [a] Select All    [n] Select None"
    echo "  [h] Select Auth   [u] Select User Data"
    echo "  [b] Select Business [s] Select System"
    echo "  [d] Show Dependencies Diagram"
    echo "  [Enter] Continue  [q] Quit"
    echo ""

    # Count selected tables for the prompt
    local selected_count=0
    for i in "${!ALL_TABLES[@]}"; do
      [[ "${_SELECTIONS[$i]}" == "true" ]] && selected_count=$((selected_count + 1))
    done

    # Handle input
    read -rp "Enter choice ($selected_count selected, Enter=continue): " choice
    case $choice in
      'a')
        for i in "${!ALL_TABLES[@]}"; do
          _SELECTIONS[$i]="true"
        done
        ;;
      'n')
        for i in "${!ALL_TABLES[@]}"; do
          _SELECTIONS[$i]="false"
        done
        ;;
      'h')
        select_by_category "Authentication"
        ;;
      'u')
        select_by_category "User Data"
        ;;
      'b')
        select_by_category "Business"
        ;;
      's')
        select_by_category "System"
        ;;
      'd')
        show_dependency_diagram
        ;;
      '')
        # Enter key - proceed
        extract_selected_tables
        if [[ ${#SELECTED_TABLES[@]} -eq 0 ]]; then
          log_error "No tables selected. Please select at least one table."
          sleep 1
          continue
        fi
        break
        ;;
      'q')
        log_info "👋 Exiting"
        exit 0
        ;;
      *[!0-9]*)
        # Non-numeric input, ignore
        ;;
      [0-9]*)
        handle_number_input "$choice"
        ;;
    esac
  done

  # Analyze dependencies and show warnings
  analyze_and_show_dependencies "${SELECTED_TABLES[@]}"

  # Show dependency diagram (already has wait_for_enter internally)
  if [[ "$FORCE_MODE" != "true" ]]; then
    show_dependency_diagram
  fi
}

# Extract selected tables from _SELECTIONS array
extract_selected_tables() {
  SELECTED_TABLES=()
  local i
  for i in "${!ALL_TABLES[@]}"; do
    if [[ "${_SELECTIONS[$i]}" == "true" ]]; then
      SELECTED_TABLES+=("${ALL_TABLES[$i]}")
    fi
  done
}

# Show table selection overview with counts (using pre-cached stats)
show_table_selection_overview_cached() {
  echo "📋 Current Database State:"
  echo ""

  printf "%-25s %-10s %-10s %s\n" "Table" "Records" "Size" "Category"
  draw_horizontal_line 60

  local i
  for i in "${!ALL_TABLES[@]}"; do
    local category
    category=$(get_table_category "${ALL_TABLES[$i]}")

    printf "%-25s %-10s %-10s %s\n" "${ALL_TABLES[$i]}" "${_CACHED_COUNTS[$i]}" "${_CACHED_SIZES[$i]}" "$category"
  done

  echo ""
}

# Render checkbox menu
render_checkbox_menu() {
  local i
  for i in "${!ALL_TABLES[@]}"; do
    local checkbox="[ ]"
    [[ "${_SELECTIONS[$i]}" == "true" ]] && checkbox="[x]"

    printf "%2d. %-25s %s\n" "$((i+1))" "${ALL_TABLES[$i]}" "$checkbox"
  done
}

# Select tables by category
select_by_category() {
  local target_category="$1"
  local i
  for i in "${!ALL_TABLES[@]}"; do
    if [[ "$(get_table_category "${ALL_TABLES[$i]}")" == "$target_category" ]]; then
      _SELECTIONS[$i]="true"
    fi
  done
}

# Handle number input for table selection
handle_number_input() {
  local input="$1"

  # Convert to array index (0-based)
  local index=$((input - 1))

  if [[ $index -ge 0 && $index -lt ${#ALL_TABLES[@]} ]]; then
    if [[ "${_SELECTIONS[$index]}" == "true" ]]; then
      _SELECTIONS[$index]="false"
    else
      _SELECTIONS[$index]="true"
    fi
  fi
}