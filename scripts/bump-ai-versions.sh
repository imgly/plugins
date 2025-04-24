#!/bin/bash

# Check if version is provided
if [ $# -ne 1 ]; then
  echo "Usage: $0 <new-version>"
  echo "Example: $0 1.2.3"
  exit 1
fi

NEW_VERSION=$1

# Find all AI plugin package.json files directly in packages directory, excluding node_modules
for pkg in packages/plugin-ai-*/package.json; do
  # Skip if file doesn't exist (in case the glob doesn't match anything)
  [ -f "$pkg" ] || continue
  
  echo "Updating $pkg to version $NEW_VERSION"
  
  # Use sed to precisely replace only the version field while preserving formatting
  sed -i.bak -E 's/("version":[[:space:]]*")[^"]+(")/\1'"$NEW_VERSION"'\2/' "$pkg"
  
  # Remove backup files
  rm -f "${pkg}.bak"
done

echo "All AI plugin versions updated to $NEW_VERSION"