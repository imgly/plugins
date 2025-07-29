# @imgly/plugin-pdfx-web

PDFX plugin for CE.SDK - PDF conversion and export functionality.

## Important License Notice

This package includes Ghostscript WebAssembly binaries (`@privyid/ghostscript`) which are licensed under **AGPL-3.0-only**. 

### What this means:
- ✅ **Free to use** for open source projects
- ✅ **Free to use** for internal/private applications  
- ⚠️ **Commercial applications** that distribute this plugin may need to comply with AGPL terms
- ⚠️ **SaaS/web applications** using this plugin may need to provide source code access

### For Commercial Use:
- Contact IMG.LY support for commercial licensing guidance
- Consider if your application triggers AGPL distribution requirements
- Ensure your application's license is compatible with AGPL-3.0

### Technical Implementation:
- Plugin tries bundled Ghostscript first (production)
- Falls back to CDN loading for development/testing
- No external dependencies required in production builds
