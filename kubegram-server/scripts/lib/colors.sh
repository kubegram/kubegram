#!/bin/bash

# Color definitions and formatting utilities
# Provides consistent colored output throughout the application

# Color definitions
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export PURPLE='\033[0;35m'
export CYAN='\033[0;36m'
export WHITE='\033[1;37m'
export GRAY='\033[0;90m'
export NC='\033[0m' # No Color

# Background colors
export BG_RED='\033[41m'
export BG_GREEN='\033[42m'
export BG_YELLOW='\033[43m'
export BG_BLUE='\033[44m'

# Symbols for UI elements
export CHECK='✅'
export CROSS='❌'
export WARNING='⚠️'
export INFO='ℹ️'
export ROCKET='🚀'
export DATABASE='🗃️'
export BACKUP='📦'
export RESTORE='🔄'
export STATUS='📊'
export USER='👤'
export TEAMS='👥'
export ORG='🏢'
export COMPANY='🏭'
export PROJECT='📊'
export AUTH='🔐'
export KEY='🔑'
export GENERATION='⚡'
export DIAGRAM='📈'
export TIMER='⏰'
export HEARTBEAT='💓'
export ARROW='→'
export BULLET='•'

# Logging functions
log_info() {
  echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

log_success() {
  echo -e "${GREEN}✅ SUCCESS:${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠️  WARNING:${NC} $1"
}

log_error() {
  echo -e "${RED}❌ ERROR:${NC} $1"
}

log_verbose() {
  if [[ "${VERBOSE:-false}" == "true" ]]; then
    echo -e "${GRAY}🔍 VERBOSE:${NC} $1"
  fi
}

log_debug() {
  if [[ "${DEBUG:-false}" == "true" ]]; then
    echo -e "${PURPLE}🐛 DEBUG:${NC} $1"
  fi
}

# Progress bar utilities
show_progress_bar() {
  local current="$1"
  local total="$2"
  local width=40
  local percentage=$((current * 100 / total))
  local filled=$((current * width / total))
  local empty=$((width - filled))
  
  printf "\r["
  printf "%*s" $filled | tr ' ' '█'
  printf "%*s" $empty | tr ' ' '░'
  printf "] %d%%" $percentage
}

# Box drawing utilities
draw_box() {
  local title="$1"
  local content="$2"
  local width=50
  
  echo "┌─ $title ─$(printf '─%.0s' $(seq 1 $((width - ${#title} - 5))))┐"
  
  while IFS= read -r line; do
    printf "│ %-$((${width} - 2))s │\n" "$line"
  done <<< "$content"
  
  printf "└$(printf '─%.0s' $(seq 1 $width))┘\n"
}

draw_horizontal_line() {
  local width="${1:-50}"
  printf '─%.0s' $(seq 1 $width)
  echo
}

# Table formatting
format_table() {
  local headers=("$@")
  local max_width=20
  
  # Draw header
  for header in "${headers[@]}"; do
    printf "| %-${max_width}s " "$header"
  done
  echo "|"
  draw_horizontal_line $((${#headers[@]} * (max_width + 3)))
}

# Status indicators
status_ok() {
  echo -e "${GREEN}✓${NC}"
}

status_error() {
  echo -e "${RED}✗${NC}"
}

status_warning() {
  echo -e "${YELLOW}⚠${NC}"
}

# Timestamp utilities
timestamp() {
  date '+%Y-%m-%d %H:%M:%S'
}

compact_timestamp() {
  date '+%Y%m%d_%H%M%S'
}