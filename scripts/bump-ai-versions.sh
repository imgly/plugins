#!/bin/bash

# Read version from file
VERSION_FILE=".current-ai-plugin-version"
CHANGELOG_FILE="CHANGELOG-AI.md"

# Check if version file exists
if [ ! -f "$VERSION_FILE" ]; then
  echo "Error: Version file $VERSION_FILE not found"
  exit 1
fi

# Check if changelog file exists
if [ ! -f "$CHANGELOG_FILE" ]; then
  echo "Error: Changelog file $CHANGELOG_FILE not found"
  exit 1
fi

# Get new version from arguments or use the version file content
if [ $# -eq 1 ]; then
  NEW_VERSION=$1
else
  # Read current version from file
  CURRENT_VERSION=$(cat "$VERSION_FILE")
  
  echo "Current version from $VERSION_FILE: $CURRENT_VERSION"
  echo "Enter new version (or press Enter to cancel):"
  read -r NEW_VERSION
  
  if [ -z "$NEW_VERSION" ]; then
    echo "Operation cancelled."
    exit 0
  fi
fi

# Perform sanity check to ensure all AI plugins have the same version
echo "Performing version sanity check..."
VERSIONS=()

for pkg in packages/plugin-ai-*/package.json; do
  # Skip if file doesn't exist
  [ -f "$pkg" ] || continue
  
  # Extract version from package.json
  VERSION=$(grep -E '"version":[[:space:]]*"[^"]+"' "$pkg" | sed -E 's/.*"version":[[:space:]]*"([^"]+)".*/\1/')
  VERSIONS+=("$VERSION")
  echo "  $pkg: $VERSION"
done

# Check if all versions are the same
FIRST_VERSION="${VERSIONS[0]}"
VERSIONS_DIFFER=false

for version in "${VERSIONS[@]}"; do
  if [ "$version" != "$FIRST_VERSION" ]; then
    VERSIONS_DIFFER=true
    break
  fi
done

if [ "$VERSIONS_DIFFER" = true ]; then
  echo "Warning: Not all AI plugins have the same version!"
  echo "Do you want to proceed anyway? (y/n)"
  read -r CONFIRM
  
  if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Operation cancelled."
    exit 0
  fi
fi

# Update the changelog: convert [Unreleased] to the new version
DATE=$(date +%Y-%m-%d)
echo "Updating changelog: Converting [Unreleased] section to [$NEW_VERSION]"

# Create a temporary file for the new changelog content
TEMP_FILE=$(mktemp)

# Process the changelog file
awk -v new_version="$NEW_VERSION" -v date="$DATE" '
BEGIN { unreleased_found = 0; empty_line_after_unreleased = 0; }

# If we find the Unreleased header, replace it with new version and keep track
/^## \[Unreleased\]$/ {
  print "## [Unreleased]";
  print "";
  print "## [" new_version "] - " date;
  unreleased_found = 1;
  next;
}

# Print all other lines
{ print }

' "$CHANGELOG_FILE" > "$TEMP_FILE"

# If the [Unreleased] section was not found, show an error
if ! grep -q "## \[Unreleased\]" "$TEMP_FILE"; then
  echo "Error: Failed to process changelog. [Unreleased] section not found or not properly updated."
  rm "$TEMP_FILE"
  exit 1
fi

# Update the changelog file
mv "$TEMP_FILE" "$CHANGELOG_FILE"

# Update version in the version file
echo "$NEW_VERSION" > "$VERSION_FILE"
echo "Updated $VERSION_FILE to $NEW_VERSION"

# Find all AI plugin package.json files directly in packages directory
for pkg in packages/plugin-ai-*/package.json; do
  # Skip if file doesn't exist
  [ -f "$pkg" ] || continue
  
  echo "Updating $pkg to version $NEW_VERSION"
  
  # Use sed to precisely replace only the version field while preserving formatting
  sed -i.bak -E 's/("version":[[:space:]]*")[^"]+(")/\1'"$NEW_VERSION"'\2/' "$pkg"
  
  # Remove backup files
  rm -f "${pkg}.bak"
done

echo "All AI plugin versions updated to $NEW_VERSION"
echo "Changelog updated with new version $NEW_VERSION - $DATE"