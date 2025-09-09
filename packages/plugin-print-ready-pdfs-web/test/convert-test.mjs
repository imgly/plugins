#!/usr/bin/env node

/**
 * Conversion Test Script
 *
 * Tests the PDF/X conversion functionality with a generated or provided PDF
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testConversion() {
  try {
    console.log('🔧 Testing PDF/X conversion...');

    // Import the conversion function from the built module
    const { convertToPDFX3 } = await import('../dist/index.mjs');

    // Test PDF setup
    const inputPath = process.argv[2]; // Optional custom PDF path
    const outputPath =
      process.argv[3] || join(__dirname, 'converted-pdfx3.pdf');
    const profileType = process.argv[4] || 'fogra39'; // Optional profile preset

    let pdfBlob;
    
    if (inputPath && existsSync(inputPath)) {
      // Use provided PDF file
      console.log(`📄 Loading PDF: ${inputPath}`);
      const pdfData = readFileSync(inputPath);
      pdfBlob = new Blob([pdfData], { type: 'application/pdf' });
    } else {
      // Create a simple test PDF inline
      console.log('📄 Creating test PDF with colored rectangles...');
      const testPDFContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
  /ProcSet [/PDF]
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 24 Tf
100 700 Td
(Test PDF for RGB to CMYK Conversion) Tj
ET
1 0 0 rg
100 600 100 50 re
f
0 1 0 rg
220 600 100 50 re
f
0 0 1 rg
340 600 100 50 re
f
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
495
%%EOF`;
      
      pdfBlob = new Blob([testPDFContent], { type: 'application/pdf' });
    }

    console.log(`📊 Input PDF size: ${pdfBlob.size} bytes`);
    console.log(`🎨 Using profile: ${profileType}`);

    // Test conversion
    console.log('🔄 Starting conversion...');
    const startTime = Date.now();

    const resultBlob = await convertToPDFX3(pdfBlob, { 
      outputProfile: profileType,
      title: 'Test Conversion'
    });

    const duration = Date.now() - startTime;

    // Save result
    const resultBuffer = await resultBlob.arrayBuffer();
    writeFileSync(outputPath, Buffer.from(resultBuffer));

    console.log('✅ Conversion completed successfully!');
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📄 Output: ${outputPath}`);
    console.log(`📊 Results:`);
    console.log(`   Original size: ${pdfBlob.size} bytes`);
    console.log(`   Converted size: ${resultBlob.size} bytes`);
    console.log(
      `   Compression ratio: ${(pdfBlob.size / resultBlob.size).toFixed(2)}x`
    );
  } catch (error) {
    console.error('❌ Conversion test failed:', error.message);
    if (error.stack) {
      console.error('📋 Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Handle Node.js environment differences
if (typeof global !== 'undefined') {
  // Add minimal browser-like globals for Node.js testing
  global.Blob = class Blob {
    constructor(parts, options = {}) {
      this.parts = parts || [];
      this.type = options.type || '';
      this.size = parts
        ? parts.reduce(
            (acc, part) => acc + (part.byteLength || part.length || 0),
            0
          )
        : 0;
    }

    arrayBuffer() {
      const buffer = Buffer.concat(this.parts.map((p) => Buffer.from(p)));
      return Promise.resolve(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
    }
  };
}

testConversion().catch(console.error);
