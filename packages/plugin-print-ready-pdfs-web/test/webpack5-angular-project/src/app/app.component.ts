import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// @ts-ignore - local development build may not have .d.ts files
import { convertToPDFX3 } from '@imgly/plugin-print-ready-pdfs-web';

// Extend Window interface for test result exposure
declare global {
  interface Window {
    testResults: {
      importSuccess: boolean;
      initializationError: string | null;
      conversionAttempted: boolean;
      conversionError: string | null;
      conversionSuccess: boolean;
      testComplete: boolean;
    };
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div id="test-container">
      <h1>Webpack 5 + Angular Runtime Test</h1>

      <div id="status">
        <h2>Test Status</h2>
        <ul>
          <li id="import-status">
            Import: {{ importSuccess ? 'SUCCESS' : 'FAILED' }}
            <span *ngIf="importError">({{ importError }})</span>
          </li>
          <li id="conversion-status">
            Conversion: {{ conversionStatus }}
            <span *ngIf="conversionError">({{ conversionError }})</span>
          </li>
        </ul>
      </div>

      <div id="actions">
        <button (click)="testConversion()" [disabled]="testing">
          {{ testing ? 'Testing...' : 'Test PDF Conversion' }}
        </button>
      </div>

      <div id="results" *ngIf="testComplete">
        <h2>Results</h2>
        <pre>{{ results | json }}</pre>
      </div>
    </div>
  `,
  styles: [`
    #test-container {
      font-family: sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    #status li {
      margin: 10px 0;
    }
    button {
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    pre {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
    }
  `]
})
export class AppComponent implements OnInit {
  importSuccess = false;
  importError: string | null = null;
  conversionStatus = 'Not started';
  conversionError: string | null = null;
  testing = false;
  testComplete = false;
  results: any = null;

  ngOnInit() {
    // Initialize test results on window for Playwright to access
    window.testResults = {
      importSuccess: false,
      initializationError: null,
      conversionAttempted: false,
      conversionError: null,
      conversionSuccess: false,
      testComplete: false
    };

    // Test if import worked
    try {
      if (typeof convertToPDFX3 === 'function') {
        this.importSuccess = true;
        window.testResults.importSuccess = true;
        console.log('[TEST] Import SUCCESS: convertToPDFX3 is a function');
      } else {
        this.importError = `convertToPDFX3 is ${typeof convertToPDFX3}`;
        window.testResults.initializationError = this.importError;
        console.error('[TEST] Import FAILED:', this.importError);
      }
    } catch (error: any) {
      this.importError = error.message;
      window.testResults.initializationError = error.message;
      console.error('[TEST] Import ERROR:', error);
    }

    // Auto-run conversion test on load
    setTimeout(() => this.testConversion(), 1000);
  }

  async testConversion() {
    if (this.testing) return;

    this.testing = true;
    this.conversionStatus = 'Running...';
    window.testResults.conversionAttempted = true;

    try {
      // Create a minimal valid PDF for testing
      const minimalPDF = this.createMinimalPDF();
      const inputBlob = new Blob([minimalPDF], { type: 'application/pdf' });

      console.log('[TEST] Starting conversion with blob size:', inputBlob.size);

      // Attempt conversion - this is where the runtime error would occur
      // assetPath is required for Webpack 5 / Angular because import.meta.url
      // is transformed to a file:// URL that doesn't work in browsers
      const outputBlob = await convertToPDFX3(inputBlob, {
        outputProfile: 'srgb',
        title: 'Angular Webpack 5 Test',
        assetPath: '/assets/print-ready-pdfs/'
      });

      this.conversionStatus = 'SUCCESS';
      this.conversionError = null;
      window.testResults.conversionSuccess = true;

      this.results = {
        inputSize: inputBlob.size,
        outputSize: outputBlob.size,
        outputType: outputBlob.type
      };

      console.log('[TEST] Conversion SUCCESS:', this.results);
    } catch (error: any) {
      this.conversionStatus = 'FAILED';
      this.conversionError = error.message;
      window.testResults.conversionError = error.message;

      this.results = {
        error: error.message,
        stack: error.stack
      };

      console.error('[TEST] Conversion FAILED:', error);
    } finally {
      this.testing = false;
      this.testComplete = true;
      window.testResults.testComplete = true;
    }
  }

  private createMinimalPDF(): string {
    // Create a minimal valid PDF document
    return `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> >>
endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
trailer
<< /Size 4 /Root 1 0 R >>
startxref
210
%%EOF`;
  }
}
