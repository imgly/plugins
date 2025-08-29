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

    // Load test PDF
    const inputPath = process.argv[2] || join(__dirname, 'sample-rgb.pdf');
    const outputPath =
      process.argv[3] || join(__dirname, 'converted-pdfx3.pdf');
    const profileType = process.argv[4] || 'fogra39'; // Optional profile preset

    if (!existsSync(inputPath)) {
      console.error(`❌ Input PDF not found: ${inputPath}`);
      console.log(
        '💡 Run "pnpm run test:generate" first to create a sample PDF'
      );
      process.exit(1);
    }

    console.log(`📄 Loading PDF: ${inputPath}`);
    const pdfData = readFileSync(inputPath);
    const pdfBlob = new Blob([pdfData], { type: 'application/pdf' });

    console.log(`📊 Input PDF size: ${pdfData.length} bytes`);
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
    console.log(`   Original size: ${pdfData.length} bytes`);
    console.log(`   Converted size: ${resultBlob.size} bytes`);
    console.log(
      `   Compression ratio: ${(pdfData.length / resultBlob.size).toFixed(2)}x`
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
