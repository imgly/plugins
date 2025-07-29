#!/usr/bin/env node

/**
 * Generate Sample PDF Test Script
 * 
 * This script generates a test PDF with colored rectangles for testing
 * RGB to CMYK conversion functionality.
 */

import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple PDF content with colored rectangles
const generateTestPDF = () => {
  // This is a minimal PDF structure with colored rectangles
  // In a real implementation, you would use a PDF generation library
  const pdfContent = `%PDF-1.4
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

  return Buffer.from(pdfContent, 'utf8');
};

try {
  console.log('🔧 Generating sample PDF for testing...');
  
  const testPDF = generateTestPDF();
  const outputPath = join(__dirname, 'sample-rgb.pdf');
  
  writeFileSync(outputPath, testPDF);
  
  console.log('✅ Sample PDF generated successfully:', outputPath);
  console.log(`📄 Generated PDF size: ${testPDF.length} bytes`);
  console.log('📋 PDF contains:');
  console.log('   - Text element');
  console.log('   - Red rectangle (RGB: 1,0,0)');
  console.log('   - Green rectangle (RGB: 0,1,0)');
  console.log('   - Blue rectangle (RGB: 0,0,1)');
  
} catch (error) {
  console.error('❌ Failed to generate sample PDF:', error.message);
  process.exit(1);
}