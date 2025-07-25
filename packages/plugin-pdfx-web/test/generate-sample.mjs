#!/usr/bin/env node
import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple PDF content (minimal valid PDF with RGB colors)
const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length 170 >>
stream
BT
/F1 24 Tf
100 700 Td
(RGB Color Test PDF) Tj
ET
1 0 0 rg
100 600 200 100 re
f
0 1 0 rg
100 450 200 100 re
f
0 0 1 rg
100 300 200 100 re
f
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000229 00000 n
0000000328 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
547
%%EOF`;

async function main() {
  const outputPath = resolve(__dirname, 'sample.pdf');
  
  console.log('Generating sample PDF...');
  await writeFile(outputPath, pdfContent);
  console.log(`Sample PDF created at: ${outputPath}`);
  console.log('This PDF contains RGB colors (red, green, blue rectangles)');
}

main().catch(console.error);