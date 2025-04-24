#!/bin/bash

# Exit on any error
set -e

# Function to print section headers
print_header() {
  echo
  echo "=== $1 ==="
  echo
}

# Store the root directory path
ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)

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
  
  # Ask for confirmation
  read -p "Publish this package? (y/n): " confirm
  if [[ $confirm != [yY] ]]; then
    echo "Skipping $pkg_name"
    continue
  fi
  
  # Navigate to the package directory
  cd "$pkg_dir"
  
  # Run the publish script
  npm run publish:latest
  
  # Return to root directory for next iteration
  cd "$ROOT_DIR"
done

print_header "All AI plugins have been published successfully"