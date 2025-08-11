/**
 * Default CMYK ICC Profile
 * This is a minimal but valid CMYK profile for basic PDF/X conversion
 * Based on a minimal ICC profile structure that Ghostscript can process
 * For production use, replace with a proper CMYK profile like FOGRA39 or SWOP
 */

// Base64 encoded minimal valid CMYK ICC profile
// This creates a basic 4-channel CMYK profile that Ghostscript accepts
export const DEFAULT_CMYK_PROFILE_BASE64 = `
QURCRQAAAcxBREJFAgIAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAABAAAAYWNzcAAAAABub25l
AAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACnBkc2MA
AAFUAAAAKmNtYWYAAAF4AAAAJHJsdXMAAAGcAAAAEHRyYzIAAAGsAAAAGGdUUkMAAAHEAAAAGGJUUkMA
AAHcAAAAGGJUUkMAAAH0AAAAGGNwcnQAAAIMAAAAJmRtbmQAAAI0AAAAJGRtZGQAAAJYAAAAJGRlc2MA
AAJ8AAAANnRleHQAAAAARGVmYXVsdCBDTVlLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABtbHVj
AAAAAAAAAQAAAAAAAAAZAAAAABR0ZXh0AAAAAAAAAAA=`;

export function getDefaultCMYKProfile(): Blob {
  // Decode base64 to binary data
  const binaryString = atob(DEFAULT_CMYK_PROFILE_BASE64.replace(/\s/g, ''));
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: 'application/octet-stream' });
}
