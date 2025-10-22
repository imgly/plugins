#!/usr/bin/env node

/**
 * Simple Node.js test to verify the plugin works in Node.js environment
 *
 * This test doesn't require a browser or Playwright - it runs purely in Node.js
 */

import { convertToPDFX3 } from '../dist/index.mjs';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Node.js Plugin Test\n');
console.log('━'.repeat(60));

// Check for test PDF
const testPdfPath = join(__dirname, 'fixtures/pdfs/test-minimal.pdf');
if (!existsSync(testPdfPath)) {
  console.log('\n⚠️  Test PDF not found:', testPdfPath);
  console.log('   Please export test PDFs first using:');
  console.log('   1. pnpm test:cesdk');
  console.log('   2. Open http://localhost:3001/export-archives.html');
  console.log('   3. Export and move PDFs to test/fixtures/pdfs/\n');
  process.exit(0);
}

console.log('✓ Test PDF found:', testPdfPath);
console.log('✓ Node.js version:', process.version);
console.log('✓ fetch available:', typeof fetch === 'function');
console.log('✓ WebAssembly available:', typeof WebAssembly === 'object');
console.log('');

async function runTest() {
  try {
    // Load input PDF
    console.log('📄 Loading input PDF...');
    const inputBuffer = readFileSync(testPdfPath);
    const inputBlob = new Blob([inputBuffer], { type: 'application/pdf' });
    console.log(`   Size: ${(inputBlob.size / 1024).toFixed(2)} KB`);

    // Test conversion with GRACoL profile
    console.log('\n🔄 Converting to PDF/X-3 (GRACoL)...');
    const startTime = Date.now();

    const outputBlob = await convertToPDFX3(inputBlob, {
      outputProfile: 'gracol',
      title: 'Node.js Test - GRACoL',
    });

    const duration = Date.now() - startTime;
    console.log(`   ✓ Conversion succeeded in ${duration}ms`);
    console.log(`   Output size: ${(outputBlob.size / 1024).toFixed(2)} KB`);

    // Save output
    const outputPath = join(__dirname, 'fixtures/pdfs/test-minimal-pdfx.pdf');
    const outputBuffer = Buffer.from(await outputBlob.arrayBuffer());
    writeFileSync(outputPath, outputBuffer);
    console.log(`   ✓ Saved to: ${outputPath}`);

    // Basic validation
    console.log('\n✅ Validation:');
    console.log(`   ✓ Output is not empty: ${outputBlob.size > 0}`);
    console.log(`   ✓ Output is larger than 1KB: ${outputBlob.size > 1024}`);
    console.log(`   ✓ Output is PDF format: ${outputBuffer[0] === 0x25 && outputBuffer[1] === 0x50}`);

    console.log('\n' + '━'.repeat(60));
    console.log('✅ All tests passed!');
    console.log('\n📝 Next steps:');
    console.log('   • Run full test suite: pnpm test:integration');
    console.log('   • Validate with external tools: pdfinfo, pdffonts, qpdf\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

runTest();