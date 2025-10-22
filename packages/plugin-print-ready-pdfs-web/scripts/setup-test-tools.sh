#!/bin/bash
# Setup external PDF validation tools for testing
# This script installs qpdf, poppler-utils (pdfinfo, pdffonts), and ghostscript
# Required for comprehensive PDF validation in tests

set -e

echo "🔧 Setting up PDF validation tools..."

# Check if we're in CI (GitHub Actions sets CI=true)
if [ "$CI" = "true" ]; then
  echo "📦 CI environment detected - installing system packages..."

  # Update package list
  sudo apt-get update -qq

  # Install PDF validation tools
  # - qpdf: PDF structure validation and manipulation
  # - poppler-utils: pdfinfo, pdffonts, pdfimages, pdftotext
  # - ghostscript: PDF/X validation (gs command)
  sudo apt-get install -y -qq qpdf poppler-utils ghostscript

  echo "✅ Tools installed successfully"

  # Verify installations
  echo "🔍 Verifying installations..."
  qpdf --version
  pdfinfo -v
  gs --version

else
  echo "ℹ️  Not in CI environment - checking if tools are already installed..."

  # Check if tools are available
  if command -v qpdf &> /dev/null && \
     command -v pdfinfo &> /dev/null && \
     command -v gs &> /dev/null; then
    echo "✅ All tools already installed"
  else
    echo "⚠️  Some tools missing. Please install manually:"
    echo "   macOS:  brew install qpdf poppler ghostscript"
    echo "   Ubuntu: sudo apt-get install qpdf poppler-utils ghostscript"
    echo ""
    echo "   Tests will skip external validation checks for missing tools."
  fi
fi

echo "✨ Setup complete"
