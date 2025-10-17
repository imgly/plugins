#!/usr/bin/env node
/**
 * Visual inspection test - exports PDFs with different profiles
 * for manual visual comparison
 */

import { convertToPDFX3 } from '../dist/index.mjs';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runVisualTest() {
  console.log('🎨 Visual Inspection Test\n');
  console.log('This test exports PDFs with different ICC profiles');
  console.log('for manual visual comparison.\n');

  // Test PDFs to convert
  const testFiles = [
    'test-minimal.pdf',
    'test-images.pdf',
    'test-text.pdf',
    'test-vectors.pdf',
    'test-complex.pdf',
  ];

  // Profiles to test
  const profiles = [
    { name: 'sRGB', profile: 'srgb' },
    { name: 'FOGRA39', profile: 'fogra39' },
    { name: 'GRACoL', profile: 'gracol' },
  ];

  const outputDir = join(__dirname, 'output');
  const fixturesDir = join(__dirname, 'fixtures/pdfs');

  for (const testFile of testFiles) {
    const inputPath = join(fixturesDir, testFile);

    if (!existsSync(inputPath)) {
      console.log(`⚠️  Skipping ${testFile} - not found`);
      continue;
    }

    console.log(`\n📄 Processing: ${testFile}`);
    const inputPDF = new Blob([readFileSync(inputPath)]);
    const baseName = testFile.replace('.pdf', '');

    // Save original for comparison
    const originalOutputPath = join(outputDir, `${baseName}_original.pdf`);
    writeFileSync(originalOutputPath, readFileSync(inputPath));
    console.log(`   ✓ Original saved: ${baseName}_original.pdf`);

    // Convert with each profile
    for (const { name, profile } of profiles) {
      try {
        console.log(`   Converting with ${name}...`);

        const outputPDF = await convertToPDFX3(inputPDF, {
          outputProfile: profile,
          title: `${baseName} - ${name}`,
        });

        const outputPath = join(outputDir, `${baseName}_${profile}.pdf`);
        const buffer = Buffer.from(await outputPDF.arrayBuffer());
        writeFileSync(outputPath, buffer);

        const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);
        console.log(`   ✓ ${name}: ${baseName}_${profile}.pdf (${sizeMB} MB)`);
      } catch (error) {
        console.error(`   ✗ ${name}: ${error.message}`);
      }
    }
  }

  console.log('\n✅ Visual test complete!');
  console.log(`\nOutput files are in: ${outputDir}`);
  console.log('\nTo inspect:');
  console.log('  1. Open the PDFs in a viewer that shows color spaces');
  console.log('  2. Compare original vs converted versions');
  console.log('  3. Check that:');
  console.log('     - Images look correct (no corruption)');
  console.log('     - Colors are accurate');
  console.log('     - Text is readable');
  console.log('     - Vectors are sharp (not rasterized)');
}

runVisualTest().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
