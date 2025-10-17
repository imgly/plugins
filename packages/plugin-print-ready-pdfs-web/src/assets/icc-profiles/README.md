# ICC Profiles for PDF/X-3 Conversion

This directory contains ICC color profiles required for PDF/X-3 conversion. The plugin supports three standard profiles plus custom profiles.

## Bundled Profiles

The following profiles are included in this directory:

### 1. GRACoL2013_CRPC6.icc
- **Use Case**: US Commercial Printing (Coated)
- **Size**: ~2.6MB
- **Source**: SWOP 2006 Coated (equivalent standard)
- **Provider**: Originally SWOP/IDEAlliance standard
- **License**: Free for use, embedding, and sharing
- **Standard**: SWOP 2006 (equivalent to GRACoL for US printing)
- **Description**: US commercial printing standard for coated papers

### 2. ISOcoated_v2_eci.icc  
- **Use Case**: EU Commercial Printing (Coated)
- **Size**: ~1.8MB
- **Source**: [ECI.org](http://www.eci.org/en/downloads) 
- **Provider**: European Color Initiative (ECI)
- **License**: Free for use in commercial and non-commercial applications
- **Standard**: FOGRA39 / ISO 12647-2:2004
- **Description**: ISO Coated v2 (ECI) - European commercial printing standard

### 3. sRGB_IEC61966-2-1.icc
- **Use Case**: Digital/Screen Output
- **Size**: ~3KB
- **Source**: [ICC Color Registry](https://www.color.org/srgbprofiles.xalter)
- **Provider**: International Color Consortium (ICC)
- **License**: Freely distributable
- **Standard**: sRGB IEC61966-2.1
- **Description**: Standard RGB color space for web and digital displays

## Files Included

The three essential ICC profiles are bundled (~4.7MB total):
- `GRACoL2013_CRPC6.icc` - US commercial printing (~2.6MB)
- `ISOcoated_v2_eci.icc` - European commercial printing (~1.8MB)
- `sRGB_IEC61966-2-1.icc` - Digital/web output (~3KB)

These cover the essential use cases while keeping bundle size reasonable. No additional downloads required.

## Custom Profiles

You can also use custom ICC profiles by providing a Blob:
```javascript
// Load sRGB 2014 ICC profile from ICC.org
const customProfile = await fetch(
  'https://color.org/profiles/sRGB2014.icc'
).then(r => r.blob());

// Use in conversion
{
  outputProfile: 'custom',
  customProfile: customProfile  // Blob containing ICC profile data
}
```

**Other Publicly Available Profiles:**
```javascript
// Alternative compact sRGB profile (smaller size)
const srgbCompact = await fetch(
  'https://github.com/saucecontrol/Compact-ICC-Profiles/raw/master/profiles/sRGB-v2-nano.icc'
).then(r => r.blob());

// Display P3 profile for wide gamut displays
const p3Profile = await fetch(
  'https://github.com/saucecontrol/Compact-ICC-Profiles/raw/master/profiles/DisplayP3-v4.icc'
).then(r => r.blob());
```

**Benefits of Blob-based approach:**
- Works with any data source (fetch, FileReader, imported files)
- No path resolution issues in browser environments
- User has full control over profile loading and caching
- Compatible with bundled assets and dynamic loading
- Can fetch from public repositories like GitHub (CC0 licensed)

## Legal Notice

All bundled ICC profiles are freely distributable under their respective licenses. The profiles included have been verified as legally redistributable.

## Verification

You can verify the bundled profiles:
```bash
# Check profile headers
file *.icc

# List all profiles
ls -la *.icc

# Verify ICC profile structure (if iccdump available)
iccdump profile.icc
```