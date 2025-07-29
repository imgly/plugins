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
    const profilePath = process.argv[3] || join(__dirname, 'CoatedFOGRA39.icc');
    const outputPath = process.argv[4] || join(__dirname, 'converted-pdfx3.pdf');
    
    if (!existsSync(inputPath)) {
      console.error(`❌ Input PDF not found: ${inputPath}`);
      console.log('💡 Run "pnpm run test:generate" first to create a sample PDF');
      process.exit(1);
    }
    
    if (!existsSync(profilePath)) {
      console.error(`❌ ICC profile not found: ${profilePath}`);
      console.log('💡 Please provide a valid ICC profile file');
      process.exit(1);
    }
    
    console.log(`📄 Loading PDF: ${inputPath}`);
    const pdfData = readFileSync(inputPath);
    const pdfBlob = new Blob([pdfData], { type: 'application/pdf' });
    
    console.log(`🎨 Loading ICC profile: ${profilePath}`);
    const iccData = readFileSync(profilePath);
    const iccBlob = new Blob([iccData]);
    
    console.log(`📊 Input PDF size: ${pdfData.length} bytes`);
    console.log(`📊 ICC profile size: ${iccData.length} bytes`);
    
    // Test conversion
    console.log('🔄 Starting conversion...');
    const startTime = Date.now();
    
    const resultBlob = await convertToPDFX3(pdfBlob, { iccProfile: iccBlob });
    
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
    console.log(`   Compression ratio: ${(pdfData.length / resultBlob.size).toFixed(2)}x`);
    
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
      this.size = parts ? parts.reduce((acc, part) => acc + (part.byteLength || part.length || 0), 0) : 0;
    }
    
    arrayBuffer() {
      return Promise.resolve(Buffer.concat(this.parts.map(p => Buffer.from(p))).buffer);
    }
  };
}

testConversion().catch(console.error);