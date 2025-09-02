#!/bin/bash

# Script to update CESDK versions across the monorepo
# Usage: 
#   ./scripts/change-examples-cesdk-version.sh         # Interactive mode
#   ./scripts/change-examples-cesdk-version.sh 1.50.0  # Direct update
#   ./scripts/change-examples-cesdk-version.sh --list  # List recent versions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Function to get current version from package.json
get_current_version() {
    node -e "
        const fs = require('fs');
        const path = require('path');
        const pkg = JSON.parse(fs.readFileSync(path.join('$ROOT_DIR', 'package.json'), 'utf8'));
        if (pkg.pnpm && pkg.pnpm.overrides && pkg.pnpm.overrides['@cesdk/cesdk-js']) {
            console.log(pkg.pnpm.overrides['@cesdk/cesdk-js']);
        } else {
            console.log('unknown');
        }
    "
}

# Function to get latest version from npm
get_latest_version() {
    npm view @cesdk/cesdk-js version 2>/dev/null || echo "unknown"
}

# Function to check if version exists on npm
check_version_exists() {
    local version=$1
    npm view @cesdk/cesdk-js@$version version &>/dev/null
}

# Function to list recent versions
list_recent_versions() {
    echo -e "${CYAN}Recent @cesdk/cesdk-js versions:${NC}"
    echo "────────────────────────────────"
    
    # Get all versions and filter to show recent stable versions
    npm view @cesdk/cesdk-js versions --json 2>/dev/null | \
        grep -E '"[0-9]+\.[0-9]+\.[0-9]+"' | \
        grep -v -E 'alpha|beta|rc|nightly' | \
        tail -15 | \
        sed 's/[",]//g' | \
        sed 's/^[[:space:]]*/  /'
    
    echo ""
    echo -e "${BLUE}Latest:${NC} $(get_latest_version)"
}

# Handle command line arguments
if [ "$1" = "--list" ] || [ "$1" = "-l" ]; then
    # List versions mode
    list_recent_versions
    exit 0
elif [ -z "$1" ]; then
    # Interactive mode
    CURRENT_VERSION=$(get_current_version)
    LATEST_VERSION=$(get_latest_version)
    
    echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}     CESDK Version Management${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}Current version:${NC} ${GREEN}$CURRENT_VERSION${NC}"
    echo -e "${BLUE}Latest available:${NC} ${MAGENTA}$LATEST_VERSION${NC}"
    echo ""
    echo -e "${YELLOW}Would you like to update to a new version?${NC}"
    echo -e "Enter a version number or 'latest' for $LATEST_VERSION"
    echo -e "Type 'list' to see recent versions, or press Enter to exit:"
    echo -n "> "
    read -r NEW_VERSION
    
    if [ -z "$NEW_VERSION" ]; then
        echo ""
        echo -e "${YELLOW}No changes made. Current version remains: $CURRENT_VERSION${NC}"
        exit 0
    fi
    
    if [ "$NEW_VERSION" = "list" ]; then
        echo ""
        list_recent_versions
        echo ""
        echo -e "${YELLOW}Enter a version number to update to:${NC}"
        echo -n "> "
        read -r NEW_VERSION
        
        if [ -z "$NEW_VERSION" ]; then
            echo -e "${YELLOW}Update cancelled.${NC}"
            exit 0
        fi
    fi
    
    if [ "$NEW_VERSION" = "latest" ]; then
        VERSION=$LATEST_VERSION
        echo -e "${BLUE}Using latest version: $VERSION${NC}"
    else
        VERSION=$NEW_VERSION
    fi
    
    # Validate version exists
    echo -n "Checking if version $VERSION exists... "
    if check_version_exists "$VERSION"; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        echo -e "${RED}Error: Version $VERSION does not exist on npm registry${NC}"
        echo -e "Use 'pnpm cesdk:version --list' to see available versions"
        exit 1
    fi
    
    # Confirm the change
    echo ""
    echo -e "${YELLOW}Confirm update from $CURRENT_VERSION to $VERSION?${NC} (y/N)"
    echo -n "> "
    read -r CONFIRM
    
    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
        echo -e "${YELLOW}Update cancelled.${NC}"
        exit 0
    fi
else
    VERSION=$1
    
    # Validate version exists for direct mode too
    echo -n "Checking if version $VERSION exists... "
    if check_version_exists "$VERSION"; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        echo -e "${RED}Error: Version $VERSION does not exist on npm registry${NC}"
        echo -e "Use 'pnpm cesdk:version --list' to see available versions"
        exit 1
    fi
fi

echo -e "${YELLOW}Updating CESDK versions to $VERSION${NC}"
echo "----------------------------------------"

# Function to update YAML file
update_workspace_yaml() {
    local file="$ROOT_DIR/pnpm-workspace.yaml"
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}Error: pnpm-workspace.yaml not found${NC}"
        exit 1
    fi
    
    echo "Updating pnpm-workspace.yaml..."
    
    # Update @cesdk/cesdk-js version
    sed -i.bak "s/'@cesdk\/cesdk-js': '[^']*'/'@cesdk\/cesdk-js': '$VERSION'/" "$file"
    
    # Update @cesdk/engine version
    sed -i.bak "s/'@cesdk\/engine': '[^']*'/'@cesdk\/engine': '$VERSION'/" "$file"
    
    # Remove backup file
    rm -f "$file.bak"
    
    echo -e "${GREEN}✓ Updated catalog in pnpm-workspace.yaml${NC}"
}

# Function to update root package.json
update_root_package_json() {
    local file="$ROOT_DIR/package.json"
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}Error: package.json not found${NC}"
        exit 1
    fi
    
    echo "Updating root package.json..."
    
    # Create a temporary file with the updated content
    node -e "
        const fs = require('fs');
        const path = require('path');
        
        const packagePath = path.join('$ROOT_DIR', 'package.json');
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        if (!pkg.pnpm) {
            pkg.pnpm = {};
        }
        if (!pkg.pnpm.overrides) {
            pkg.pnpm.overrides = {};
        }
        
        pkg.pnpm.overrides['@cesdk/cesdk-js'] = '$VERSION';
        pkg.pnpm.overrides['@cesdk/engine'] = '$VERSION';
        
        fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\\n');
        
        console.log('Updated overrides in package.json');
    "
    
    echo -e "${GREEN}✓ Updated overrides in package.json${NC}"
}

# Main execution
cd "$ROOT_DIR"

# Update both files
update_workspace_yaml
update_root_package_json

echo ""
echo -e "${GREEN}Successfully updated CESDK versions to $VERSION${NC}"
echo ""
echo "Next steps:"
echo "1. Run 'pnpm install' to update dependencies"
echo "2. Run 'pnpm check:types' to verify type checking"
echo "3. Run your tests to ensure compatibility"
echo ""
echo -e "${YELLOW}Note: This updates the test/development versions only.${NC}"
echo "Plugin peerDependencies (minimum versions) remain unchanged."