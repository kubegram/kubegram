#!/bin/bash

# Database connection and SQL execution utilities
# Provides secure database operations and connection management

# Source colors for logging
source "$LIB_DIR/colors.sh"

# Test database connectivity
test_database_connection() {
  log_verbose "📡 Testing database connectivity..."
  
  local result
  result=$(docker exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d "$DATABASE" -t -c "SELECT 1;" 2>/dev/null | tr -d '[:space:]')
  
  if [[ "$result" == "1" ]]; then
    log_verbose "✅ Database connection established"
    return 0
  else
    log_error "❌ Database connection failed"
    return 1
  fi
}

# Execute SQL and return result
execute_sql() {
  local sql="$1"
  local description="${2:-Executing SQL}"
  
  log_verbose "🔧 $description"
  
  if [[ "$DRY_RUN" == "true" ]]; then
    log_verbose "🔍 DRY RUN SQL: $sql"
    return 0
  fi
  
  local result
  result=$(docker exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d "$DATABASE" -c "$sql" < /dev/null 2>&1)
  
  if [[ $? -eq 0 ]]; then
    log_verbose "✅ SQL executed successfully"
    echo "$result"
    return 0
  else
    log_error "❌ SQL execution failed: $result"
    return 1
  fi
}

# Get list of all tables in database
get_database_tables() {
  log_verbose "📋 Retrieving database tables..."
  
  # Fallback hardcoded table list if automatic detection fails
  local hardcoded_tables=(
    "companies" "company_certificates" "company_llm_tokens"
    "organizations" "teams" "users" "projects"
    "generation_jobs" "generation_job_artifacts"
    "openauth_sessions" "openauth_codes" "openauth_kv"
  )
  
  # Try automatic detection first
  local sql="
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  "
  
  local result
  result=$(execute_sql "$sql" "Getting table list" | tail -n +3)
  
  # Extract just the table names and filter valid ones
  local table_list=$(echo "$result" | grep -E '^[a-z_]+$' | tr -d '[:space:]' || true)
  
  # Store in global variable with proper bash syntax
  if [[ -n "$table_list" ]]; then
    ALL_TABLES=($(echo "$table_list"))
    log_verbose "📊 Automatic detection successful"
  else
    log_verbose "📊 Automatic detection failed, using fallback"
    ALL_TABLES=("${hardcoded_tables[@]}")
  fi
  
  local table_count=${#ALL_TABLES[@]}
  local table_list_str=${ALL_TABLES[*]}
  log_verbose "📊 Found $table_count tables: $table_list_str"
}

# Get record count for a table
get_table_record_count() {
  local table="$1"
  
  local sql="SELECT COUNT(*) FROM $table;"
  local count
  count=$(execute_sql "$sql" "Counting records in $table" | grep -E '^[[:space:]]*[0-9]' | head -1)
  
  echo "$count"
}

# Get table size information
get_table_size() {
  local table="$1"

  local sql="SELECT pg_size_pretty(pg_total_relation_size('$table'));"

  local result
  result=$(docker exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d "$DATABASE" -t -A -c "$sql" < /dev/null 2>/dev/null)

  if [[ -n "$result" ]]; then
    echo "$result"
  else
    echo "N/A"
  fi
}

# Check if table exists
table_exists() {
  local table="$1"
  
  local sql="
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = '$table'
    );
  "
  
  local result
  result=$(execute_sql "$sql" "Checking if table $table exists" | tail -n 1)
  
  [[ "$result" == "t" ]]
}

# Get foreign key dependencies for a table
get_table_dependencies() {
  local table="$1"
  
  local sql="
    SELECT 
      tc.table_name as dependent_table,
      kcu.column_name as foreign_key_column,
      ccu.table_name as references_table,
      ccu.column_name as references_column
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND ccu.table_name = '$table'
    ORDER BY tc.table_name;
  "
  
  local result
  result=$(execute_sql "$sql" "Getting dependencies for $table" | tail -n +3 | head -n -2)
  
  echo "$result"
}

# Get all sequences in database
get_database_sequences() {
  local sql="
    SELECT sequence_name 
    FROM information_schema.sequences 
    WHERE sequence_schema = 'public' 
    ORDER BY sequence_name;
  "
  
  local result
  result=$(execute_sql "$sql" "Getting database sequences" | tail -n +3 | head -n -2 | grep -v "^$")
  
  mapfile -t ALL_SEQUENCES <<< "$result"
  
  log_verbose "🔢 Found ${#ALL_SEQUENCES[@]} sequences: ${ALL_SEQUENCES[*]}"
}

# Reset sequence to start from 1
reset_sequence() {
  local sequence="$1"
  
  local sql="ALTER SEQUENCE $sequence RESTART WITH 1;"
  
  log_verbose "🔄 Resetting sequence: $sequence"
  execute_sql "$sql" "Resetting sequence $sequence"
}

# Truncate table with CASCADE to handle dependencies
truncate_table() {
  local table="$1"
  
  local sql="TRUNCATE TABLE $table RESTART IDENTITY CASCADE;"
  
  log_verbose "🗑️  Truncating table: $table"
  execute_sql "$sql" "Truncating table $table"
}

# Get database overview
get_database_overview() {
  echo "📊 Database Overview for '$DATABASE'"
  echo ""
  
  local sql="
    SELECT 
      schemaname,
      tablename,
      attname,
      n_distinct,
      n_tup_ins,
      n_tup_upd,
      n_tup_del
    FROM pg_stats 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
  "
  
  local result
  result=$(execute_sql "$sql" "Getting database statistics")
  
  echo "$result"
}

# Verify database integrity after operations
verify_database_integrity() {
  log_verbose "🔍 Verifying database integrity..."
  
  local errors=0
  
  # Check if all tables exist
  # Check if ALL_TABLES is populated
  if [[ ${#ALL_TABLES[@]} -gt 0 ]]; then
    for table in "${ALL_TABLES[@]}"; do
      local count=$(get_table_record_count "$table")
      local size=$(get_table_size "$table")
      local category=$(get_table_category "$table")
      
      printf "%-25s %-10s %-10s %s\n" "$table" "$count" "$size" "$category"
    done
  fi
  
  # Check if sequences are accessible
  get_database_sequences
  
  # Check foreign key constraints
  local fk_sql="
    SELECT COUNT(*) as constraint_count
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY';
  "
  
  local constraint_count
  constraint_count=$(execute_sql "$fk_sql" "Checking foreign key constraints" | tail -n 1)
  
  log_verbose "🔗 Found $constraint_count foreign key constraints"
  
  if [[ $errors -eq 0 ]]; then
    log_success "✅ Database integrity verified"
    return 0
  else
    log_error "❌ Database integrity check failed with $errors errors"
    return 1
  fi
}