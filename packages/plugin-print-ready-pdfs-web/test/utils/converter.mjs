/**
 * Node.js wrapper for PDF/X conversion
 * Used by integration tests
 */
import { convertToPDFX3 } from '../../dist/index.mjs';
import { readFileSync, writeFileSync } from 'fs';

const [inputPath, outputPath, optionsJson] = process.argv.slice(2);

if (!inputPath || !outputPath || !optionsJson) {
  console.error('Usage: node converter.mjs <input.pdf> <output.pdf> <options-json>');
  process.exit(1);
}

const inputBlob = new Blob([readFileSync(inputPath)], { type: 'application/pdf' });
const options = JSON.parse(optionsJson);

convertToPDFX3(inputBlob, options)
  .then(async outputBlob => {
    const buffer = Buffer.from(await outputBlob.arrayBuffer());
    writeFileSync(outputPath, buffer);
    console.log('Conversion successful');
    process.exit(0);
  })
  .catch(err => {
    console.error('Conversion failed:', err.message);
    process.exit(1);
  });