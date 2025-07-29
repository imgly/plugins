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
    const { convertSingle, isSupported, getCapabilities } = await import('../dist/index.mjs');
    
    // Check browser/environment support
    console.log('🔍 Checking environment support...');
    const capabilities = getCapabilities();
    console.log('📊 Capabilities:', capabilities);
    
    if (!isSupported()) {
      console.log('⚠️  PDF/X conversion not supported in this environment');
      console.log('   This is expected in Node.js - browser testing required');
      return;
    }
    
    // Load test PDF
    const inputPath = process.argv[2] || join(__dirname, 'sample-rgb.pdf');
    const outputPath = process.argv[3] || join(__dirname, 'converted-pdfx3.pdf');
    
    if (!existsSync(inputPath)) {
      console.error(`❌ Input PDF not found: ${inputPath}`);
      console.log('💡 Run "pnpm run test:generate" first to create a sample PDF');
      process.exit(1);
    }
    
    console.log(`📄 Loading PDF: ${inputPath}`);
    const pdfData = readFileSync(inputPath);
    const pdfBlob = new Blob([pdfData], { type: 'application/pdf' });
    
    console.log(`📊 Input PDF size: ${pdfData.length} bytes`);
    
    // Test conversion
    console.log('🔄 Starting conversion...');
    const startTime = Date.now();
    
    const result = await convertSingle(
      pdfBlob,
      {
        version: 'PDF/X-3',
        colorSpace: 'CMYK',
        renderingIntent: 'perceptual',
        preserveBlack: true,
        title: 'Test PDF Conversion',
        creator: 'PDF/X Plugin Test Suite'
      },
      (progress) => {
        console.log(`   ${progress.stage}: ${progress.progress}% - ${progress.message}`);
      }
    );
    
    const duration = Date.now() - startTime;
    
    // Save result
    const resultBuffer = await result.blob.arrayBuffer();
    writeFileSync(outputPath, Buffer.from(resultBuffer));
    
    console.log('✅ Conversion completed successfully!');
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📄 Output: ${outputPath}`);
    console.log(`📊 Results:`);
    console.log(`   Original size: ${result.metadata.originalSize} bytes`);
    console.log(`   Converted size: ${result.metadata.convertedSize} bytes`);
    console.log(`   Compression ratio: ${result.metadata.compressionRatio.toFixed(2)}x`);
    console.log(`   PDF/X version: ${result.metadata.pdfxVersion}`);
    console.log(`   Output condition: ${result.metadata.outputCondition}`);
    console.log(`   Compliant: ${result.metadata.isCompliant ? '✅' : '❌'}`);
    
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
  
  global.performance = {
    now: () => Date.now()
  };
}

testConversion().catch(console.error);