#!/bin/bash
#
# Test: Verify @imgly/plugin-print-ready-pdfs-web works with Webpack 5
# Issue: https://github.com/imgly/ubq/issues/11471
#
# Exit 0 = PASS (plugin is Webpack 5 compatible)
# Exit 1 = FAIL (plugin has Webpack 5 compatibility issues)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"
TEST_PROJECT_DIR="${SCRIPT_DIR}/webpack5-angular-project"

echo "Testing Webpack 5 compatibility..."

# Build plugin if needed
if [ ! -f "${PACKAGE_DIR}/dist/index.mjs" ]; then
    echo "Building plugin..."
    cd "$PACKAGE_DIR"
    pnpm run build
fi

# Create test project if it doesn't exist
if [ ! -d "$TEST_PROJECT_DIR" ]; then
    mkdir -p "$TEST_PROJECT_DIR"
    cd "$TEST_PROJECT_DIR"

    cat > package.json << 'EOF'
{
  "name": "webpack5-test",
  "scripts": { "build": "webpack --mode production" },
  "devDependencies": {
    "webpack": "^5.90.0",
    "webpack-cli": "^5.1.4",
    "typescript": "^5.3.0",
    "ts-loader": "^9.5.0"
  }
}
EOF

    cat > tsconfig.json << 'EOF'
{ "compilerOptions": { "target": "ES2020", "module": "ESNext", "moduleResolution": "bundler", "strict": false, "skipLibCheck": true, "noImplicitAny": false } }
EOF

    cat > webpack.config.js << 'EOF'
const path = require('path');
module.exports = {
  entry: './src/index.ts',
  output: { path: path.resolve(__dirname, 'dist'), filename: 'bundle.js' },
  resolve: { extensions: ['.ts', '.js', '.mjs'] },
  module: { rules: [{ test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ }] }
};
EOF

    mkdir -p src
    cat > src/index.ts << 'EOF'
// @ts-ignore
import { convertToPDFX3 } from '@imgly/plugin-print-ready-pdfs-web';
console.log('Plugin loaded:', typeof convertToPDFX3);
EOF

    npm install --silent
fi

cd "$TEST_PROJECT_DIR"

# Link the local plugin
mkdir -p "node_modules/@imgly/plugin-print-ready-pdfs-web"
cp -r "${PACKAGE_DIR}/dist/"* "node_modules/@imgly/plugin-print-ready-pdfs-web/"
cp "${PACKAGE_DIR}/package.json" "node_modules/@imgly/plugin-print-ready-pdfs-web/"

# Run webpack build - should succeed if plugin is Webpack 5 compatible
echo "Running Webpack 5 build..."
npm run build --silent

echo "PASS: Plugin is Webpack 5 compatible"
