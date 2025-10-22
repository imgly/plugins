#!/usr/bin/env node

/**
 * Test script for batch PDF conversion
 * Tests the convertToPDFX3 function with array input (function overload)
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { convertToPDFX3 } from '../dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const inputFile = process.argv[2] || join(__dirname, 'rgb-sample.pdf');
const outputProfile = process.argv[3] || 'fogra39';
const numCopies = parseInt(process.argv[4] || '3', 10);

console.log('\n🧪 Batch PDF/X-3 Conversion Test\n');
console.log('Configuration:');
console.log(`  Input PDF:      ${inputFile}`);
console.log(`  Output Profile: ${outputProfile}`);
console.log(`  Number of PDFs: ${numCopies}`);
console.log('');

async function runBatchTest() {
  try {
    // Read the input PDF
    const inputBuffer = readFileSync(inputFile);
    console.log(`✓ Loaded input PDF (${inputBuffer.length} bytes)`);

    // Create an array of the same PDF blob (simulating multiple exports)
    const inputBlobs = Array(numCopies)
      .fill(null)
      .map(() => new Blob([inputBuffer], { type: 'application/pdf' }));

    console.log(`✓ Created ${numCopies} input blobs`);
    console.log('\n⏳ Converting PDFs to PDF/X-3...');

    const startTime = Date.now();

    // Convert using the overloaded function with array input
    const outputBlobs = await convertToPDFX3(inputBlobs, {
      outputProfile,
      title: 'Batch Test Document',
    });

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(
      `✓ Batch conversion completed in ${duration.toFixed(2)}s (${(duration / numCopies).toFixed(2)}s per PDF)`
    );
    console.log(`✓ Received ${outputBlobs.length} output blobs`);

    // Save each output blob
    for (let i = 0; i < outputBlobs.length; i++) {
      const outputBuffer = Buffer.from(await outputBlobs[i].arrayBuffer());
      const outputPath = join(
        __dirname,
        `batch-output-${i + 1}-${outputProfile}.pdf`
      );
      writeFileSync(outputPath, outputBuffer);
      console.log(`✓ Saved: ${outputPath} (${outputBuffer.length} bytes)`);
    }

    console.log('\n✅ Batch test completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Batch test failed:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

runBatchTest();
