#!/bin/bash

echo "🔧 Setting up PDF/X Test Environment"
echo ""

# Check for Homebrew
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew not found. Please install Homebrew first:"
    echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
fi

echo "✅ Homebrew found"
echo ""

# Install Poppler (provides pdffonts, pdfimages, pdfinfo, pdftotext)
echo "📦 Installing Poppler utilities..."
if command -v pdffonts &> /dev/null; then
    echo "   ✅ Poppler already installed"
else
    brew install poppler
    if [ $? -eq 0 ]; then
        echo "   ✅ Poppler installed successfully"
    else
        echo "   ❌ Failed to install Poppler"
        exit 1
    fi
fi

echo ""

# Install QPDF
echo "📦 Installing QPDF..."
if command -v qpdf &> /dev/null; then
    echo "   ✅ QPDF already installed"
else
    brew install qpdf
    if [ $? -eq 0 ]; then
        echo "   ✅ QPDF installed successfully"
    else
        echo "   ❌ Failed to install QPDF"
        exit 1
    fi
fi

echo ""

# Verify Ghostscript (should already be available from main plugin)
echo "📦 Checking Ghostscript..."
if command -v gs &> /dev/null; then
    echo "   ✅ Ghostscript found"
    gs --version | head -n 1
else
    echo "   ⚠️  Ghostscript not found. Installing..."
    brew install ghostscript
fi

echo ""
echo "✅ All tools installed successfully!"
echo ""
echo "Available commands:"
echo "  • pdffonts  - Check font embedding"
echo "  • pdfimages - List/extract images"
echo "  • pdfinfo   - Show PDF metadata"
echo "  • pdftotext - Extract text"
echo "  • qpdf      - Validate PDF structure"
echo "  • gs        - Ghostscript (PDF/X validation)"
echo ""
echo "Next steps:"
echo "  1. Add test scenes to test/fixtures/scenes/"
echo "  2. Run: pnpm test:integration"