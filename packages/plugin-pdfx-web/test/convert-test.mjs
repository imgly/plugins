#!/usr/bin/env node
import { readFile, writeFile } from 'fs/promises';
import { resolve, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the conversion function
import { convertToPDF } from '../dist/index.mjs';

async function main() {
  try {
    // Get input file from command line or use default
    const inputPath = process.argv[2] || resolve(__dirname, 'sample.pdf');
    const outputPath = process.argv[3] || resolve(__dirname, 'output-x3.pdf');
    
    console.log('PDF/X-3 Conversion Test');
    console.log('======================');
    console.log(`Input: ${inputPath}`);
    console.log(`Output: ${outputPath}`);
    
    // Read the input PDF
    const pdfBuffer = await readFile(inputPath);
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    
    // Create a mock ICC profile for testing
    const mockICCProfile = new Blob(['mock-icc-profile-data'], { type: 'application/octet-stream' });
    
    // Test conversion with options
    console.log('\nConverting to PDF/X-3...');
    const startTime = Date.now();
    
    const convertedBlobs = await convertToPDF([pdfBlob], {
      pdfx3: {
        iccProfile: mockICCProfile,
        renderingIntent: 'relative',
        preserveBlack: true,
        pdfxVersion: 'X-3',
        outputIntent: 'FOGRA39'
      }
    });
    
    const endTime = Date.now();
    console.log(`Conversion completed in ${endTime - startTime}ms`);
    
    // Save the converted PDF
    if (convertedBlobs.length > 0) {
      const outputBuffer = Buffer.from(await convertedBlobs[0].arrayBuffer());
      await writeFile(outputPath, outputBuffer);
      console.log(`\nSaved converted PDF to: ${outputPath}`);
      console.log(`Output size: ${(outputBuffer.length / 1024).toFixed(2)} KB`);
    } else {
      console.error('No output blob returned');
    }
    
  } catch (error) {
    console.error('Error during conversion:', error);
    process.exit(1);
  }
}

// Run the test
main();