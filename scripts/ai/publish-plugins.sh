#!/bin/bash

# Exit on any error
set -e

# Function to print section headers
print_header() {
  echo
  echo "=== $1 ==="
  echo
}

# Check for --force flag
FORCE_MODE=false
if [[ "$1" == "--force" ]]; then
  FORCE_MODE=true
  echo "Running in force mode - skipping all confirmations"
fi

# Store the root directory path
ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)

# Read and display CHANGELOG-AI.md
print_header "CHANGELOG-AI.md Content"
if [ -f "$ROOT_DIR/CHANGELOG-AI.md" ]; then
  cat "$ROOT_DIR/CHANGELOG-AI.md"
  echo
  if [ "$FORCE_MODE" = true ]; then
    copy_changelog="y"
    echo "Force mode: Automatically copying changelog to all packages"
  else
    read -p "Should this changelog be copied to all AI packages about to be published? (y/n): " copy_changelog
  fi
else
  echo "CHANGELOG-AI.md not found"
  copy_changelog="n"
fi

# Build all packages first
print_header "Building all packages"
cd "$ROOT_DIR"
pnpm run build

# Publish all AI plugins
print_header "Publishing AI plugins"
for pkg_dir in "$ROOT_DIR"/packages/plugin-ai-*/; do
  # Skip if not a directory
  [ -d "$pkg_dir" ] || continue
  
  pkg_name=$(basename "$pkg_dir")
  pkg_version=$(node -p "require('$pkg_dir/package.json').version")
  
  print_header "Publishing $pkg_name (version $pkg_version)"
  echo "Directory: $pkg_dir"
  
  # Copy changelog if user confirmed
  if [[ $copy_changelog == [yY] ]] && [ -f "$ROOT_DIR/CHANGELOG-AI.md" ]; then
    echo "Copying CHANGELOG-AI.md to $pkg_name"
    cp "$ROOT_DIR/CHANGELOG-AI.md" "$pkg_dir/CHANGELOG.md"
  fi
  
  # Ask for confirmation unless in force mode
  if [ "$FORCE_MODE" = true ]; then
    echo "Force mode: Publishing $pkg_name"
  else
    read -p "Publish this package? (y/n): " confirm
    if [[ $confirm != [yY] ]]; then
      echo "Skipping $pkg_name"
      continue
    fi
  fi
  
  # Navigate to the package directory
  cd "$pkg_dir"
  
  # Run the publish script
  npm run publish:latest
  
  # Return to root directory for next iteration
  cd "$ROOT_DIR"
done

print_header "All AI plugins have been published successfully"
