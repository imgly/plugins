#!/bin/bash
# Creates Angular 18 + Webpack 5 + CE.SDK + print-ready-pdfs test project
# This script generates a complete test project for verifying Webpack 5 compatibility

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_DIR="$PLUGIN_DIR/test/webpack5-angular-cesdk-project"
PROJECT_NAME="webpack5-angular-cesdk-project"

echo "=== Angular + Webpack 5 + CE.SDK Test Project Generator ==="
echo "Plugin directory: $PLUGIN_DIR"
echo "Project directory: $PROJECT_DIR"

# Check if project already exists
if [ -d "$PROJECT_DIR" ]; then
    echo "Project already exists at $PROJECT_DIR"
    echo "To recreate, delete the directory first: rm -rf $PROJECT_DIR"
    exit 0
fi

# Check for required tools
command -v node >/dev/null 2>&1 || { echo "Error: node is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "Error: npm is required but not installed."; exit 1; }

echo ""
echo "Step 1: Creating project directory..."
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

echo ""
echo "Step 2: Creating package.json..."
cat > package.json << 'PACKAGE_JSON'
{
  "name": "webpack5-angular-cesdk-project",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "serve": "npx http-server dist/webpack5-angular-cesdk-project -p 4299 --cors"
  },
  "dependencies": {
    "@angular/animations": "^18.0.0",
    "@angular/common": "^18.0.0",
    "@angular/compiler": "^18.0.0",
    "@angular/core": "^18.0.0",
    "@angular/forms": "^18.0.0",
    "@angular/platform-browser": "^18.0.0",
    "@angular/platform-browser-dynamic": "^18.0.0",
    "@cesdk/cesdk-js": "^1.66.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.14.0"
  },
  "devDependencies": {
    "@angular-builders/custom-webpack": "^18.0.0",
    "@angular-devkit/build-angular": "^18.0.0",
    "@angular/cli": "^18.0.0",
    "@angular/compiler-cli": "^18.0.0",
    "@types/node": "^20.0.0",
    "http-server": "^14.1.1",
    "typescript": "~5.4.0"
  }
}
PACKAGE_JSON

echo ""
echo "Step 3: Creating angular.json..."
cat > angular.json << 'ANGULAR_JSON'
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "webpack5-angular-cesdk-project": {
      "projectType": "application",
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-builders/custom-webpack:browser",
          "options": {
            "outputPath": "dist/webpack5-angular-cesdk-project",
            "index": "src/index.html",
            "main": "src/main.ts",
            "polyfills": ["zone.js"],
            "tsConfig": "tsconfig.app.json",
            "assets": [
              "src/favicon.ico",
              "src/assets",
              {
                "glob": "*.wasm",
                "input": "node_modules/@imgly/plugin-print-ready-pdfs-web/dist",
                "output": "/assets/print-ready-pdfs"
              },
              {
                "glob": "gs.js",
                "input": "node_modules/@imgly/plugin-print-ready-pdfs-web/dist",
                "output": "/assets/print-ready-pdfs"
              },
              {
                "glob": "*.icc",
                "input": "node_modules/@imgly/plugin-print-ready-pdfs-web/dist",
                "output": "/assets/print-ready-pdfs"
              }
            ],
            "styles": ["src/styles.css"],
            "scripts": [],
            "customWebpackConfig": {
              "path": "./webpack.config.js"
            }
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "500kb",
                  "maximumError": "5mb"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "2kb",
                  "maximumError": "4kb"
                }
              ],
              "outputHashing": "all"
            },
            "development": {
              "optimization": false,
              "extractLicenses": false,
              "sourceMap": true
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular-builders/custom-webpack:dev-server",
          "configurations": {
            "production": {
              "buildTarget": "webpack5-angular-cesdk-project:build:production"
            },
            "development": {
              "buildTarget": "webpack5-angular-cesdk-project:build:development"
            }
          },
          "defaultConfiguration": "development"
        }
      }
    }
  }
}
ANGULAR_JSON

echo ""
echo "Step 4: Creating webpack.config.js..."
cat > webpack.config.js << 'WEBPACK_CONFIG'
// Custom Webpack 5 configuration for Angular + CE.SDK + print-ready-pdfs plugin
module.exports = {
  resolve: {
    fallback: {
      // Node.js polyfills - not needed in browser
      fs: false,
      path: false,
      crypto: false
    }
  },
  module: {
    rules: [
      // Handle .wasm files
      {
        test: /\.wasm$/,
        type: 'asset/resource'
      }
    ]
  },
  // Ignore Node.js specific modules that might be referenced
  externals: {
    'fs': 'commonjs fs',
    'path': 'commonjs path'
  }
};
WEBPACK_CONFIG

echo ""
echo "Step 5: Creating tsconfig.json..."
cat > tsconfig.json << 'TSCONFIG'
{
  "compileOnSave": false,
  "compilerOptions": {
    "outDir": "./dist/out-tsc",
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "sourceMap": true,
    "declaration": false,
    "experimentalDecorators": true,
    "moduleResolution": "bundler",
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022", "dom"],
    "useDefineForClassFields": false
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
TSCONFIG

echo ""
echo "Step 6: Creating tsconfig.app.json..."
cat > tsconfig.app.json << 'TSCONFIG_APP'
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "types": ["node"]
  },
  "files": ["src/main.ts"],
  "include": ["src/**/*.d.ts"]
}
TSCONFIG_APP

echo ""
echo "Step 7: Creating src directory structure..."
mkdir -p src/app
mkdir -p src/assets

echo ""
echo "Step 8: Creating src/index.html..."
cat > src/index.html << 'INDEX_HTML'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Angular + Webpack 5 + CE.SDK + PDF/X-3 Test</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <app-root></app-root>
</body>
</html>
INDEX_HTML

echo ""
echo "Step 9: Creating src/main.ts..."
cat > src/main.ts << 'MAIN_TS'
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent)
  .catch((err) => console.error(err));
MAIN_TS

echo ""
echo "Step 10: Creating src/styles.css..."
cat > src/styles.css << 'STYLES_CSS'
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background-color: #f5f5f5;
}
STYLES_CSS

echo ""
echo "Step 11: Creating src/app/app.component.ts..."
cat > src/app/app.component.ts << 'APP_COMPONENT_TS'
import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import { convertToPDFX3 } from '@imgly/plugin-print-ready-pdfs-web';

// Extend Window interface for test results
declare global {
  interface Window {
    testResults: {
      cesdkReady: boolean;
      importSuccess: boolean;
      importError: string | null;
      conversionAttempted: boolean;
      conversionSuccess: boolean;
      conversionError: string | null;
      pdfSize: number | null;
      testComplete: boolean;
    };
    cesdk: any;
    triggerExport: () => Promise<void>;
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h1>Angular + Webpack 5 + CE.SDK + PDF/X-3 Test</h1>

      <div class="status-panel">
        <h3>Status</h3>
        <div class="status-item" [class.success]="importSuccess" [class.error]="importError">
          <span>Plugin Import:</span>
          <span>{{ importSuccess ? 'Success' : (importError || 'Pending...') }}</span>
        </div>
        <div class="status-item" [class.success]="cesdkReady">
          <span>CE.SDK:</span>
          <span>{{ cesdkReady ? 'Ready' : 'Loading...' }}</span>
        </div>
        <div class="status-item" [class.success]="conversionSuccess" [class.error]="conversionError">
          <span>PDF/X-3 Conversion:</span>
          <span>{{ conversionStatus }}</span>
        </div>
      </div>

      <div class="controls">
        <label>
          Output Profile:
          <select [(ngModel)]="selectedProfile">
            <option value="fogra39">FOGRA39 (Europe CMYK)</option>
            <option value="gracol">GRACoL (US CMYK)</option>
            <option value="srgb">sRGB (Web)</option>
          </select>
        </label>
        <button (click)="exportPDF()" [disabled]="!cesdkReady || isExporting">
          {{ isExporting ? 'Exporting...' : 'Export Print-Ready PDF' }}
        </button>
      </div>

      <div #cesdkContainer class="cesdk-container"></div>

      <div class="results" *ngIf="conversionSuccess || conversionError">
        <h3>Results</h3>
        <pre>{{ resultsJson }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }
    h1 {
      color: #333;
      margin-bottom: 20px;
    }
    .status-panel {
      background: white;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .status-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .status-item:last-child {
      border-bottom: none;
    }
    .status-item.success {
      color: #28a745;
    }
    .status-item.error {
      color: #dc3545;
    }
    .controls {
      display: flex;
      gap: 15px;
      align-items: center;
      margin-bottom: 20px;
    }
    select {
      padding: 8px 12px;
      border-radius: 4px;
      border: 1px solid #ccc;
    }
    button {
      padding: 10px 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    button:hover:not(:disabled) {
      background: #0056b3;
    }
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .cesdk-container {
      width: 100%;
      height: 600px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .results {
      margin-top: 20px;
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .results pre {
      background: #f8f9fa;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('cesdkContainer', { static: true }) cesdkContainer!: ElementRef;

  cesdk: any = null;
  cesdkReady = false;
  importSuccess = false;
  importError: string | null = null;
  conversionSuccess = false;
  conversionError: string | null = null;
  isExporting = false;
  selectedProfile = 'fogra39';
  pdfSize: number | null = null;

  get conversionStatus(): string {
    if (this.conversionError) return this.conversionError;
    if (this.conversionSuccess) return `Success (${this.pdfSize} bytes)`;
    if (this.isExporting) return 'Converting...';
    return 'Not started';
  }

  get resultsJson(): string {
    return JSON.stringify(window.testResults, null, 2);
  }

  // Test mode from query params (for Playwright tests)
  // - normal: Uses assetPath (default)
  // - testError: Omits assetPath to test error message
  // - custom: Uses custom assetPath from query param
  testMode: 'normal' | 'testError' | 'custom' = 'normal';
  customAssetPath: string | null = null;

  ngOnInit() {
    // Check for test mode via query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const customPath = urlParams.get('assetPath');

    if (customPath) {
      this.testMode = 'custom';
      this.customAssetPath = customPath;
      console.log('Test mode: custom assetPath:', customPath);
    } else if (urlParams.get('testError') === 'true') {
      this.testMode = 'testError';
      console.log('Test mode: testError (no assetPath, expecting error)');
    }

    // Initialize test results for Playwright
    window.testResults = {
      cesdkReady: false,
      importSuccess: false,
      importError: null,
      conversionAttempted: false,
      conversionSuccess: false,
      conversionError: null,
      pdfSize: null,
      testComplete: false
    };

    // Check import
    try {
      if (typeof convertToPDFX3 === 'function') {
        this.importSuccess = true;
        window.testResults.importSuccess = true;
        console.log('Plugin import successful');
      }
    } catch (error: any) {
      this.importError = error.message;
      window.testResults.importError = error.message;
      console.error('Plugin import failed:', error);
    }

    // Initialize CE.SDK
    this.initCESDK();

    // Expose export function for Playwright
    window.triggerExport = () => this.exportPDF();
  }

  ngOnDestroy() {
    if (this.cesdk) {
      this.cesdk.dispose();
    }
  }

  async initCESDK() {
    try {
      console.log('Initializing CE.SDK...');
      this.cesdk = await CreativeEditorSDK.create(this.cesdkContainer.nativeElement, {
        baseURL: 'https://cdn.img.ly/packages/imgly/cesdk-js/1.66.1/assets',
        callbacks: {
          onUpload: 'local'
        }
      });

      // Load default scene
      await this.cesdk.createDesignScene();

      this.cesdkReady = true;
      window.testResults.cesdkReady = true;
      window.cesdk = this.cesdk;
      console.log('CE.SDK initialized successfully');
    } catch (error: any) {
      console.error('CE.SDK initialization failed:', error);
      this.cesdkReady = false;
    }
  }

  async exportPDF() {
    if (!this.cesdk || this.isExporting) return;

    this.isExporting = true;
    this.conversionError = null;
    this.conversionSuccess = false;
    window.testResults.conversionAttempted = true;

    try {
      console.log('Starting PDF export...');

      // Get the current page
      const engine = this.cesdk.engine;
      const pages = engine.scene.getPages();
      if (pages.length === 0) {
        throw new Error('No pages in scene');
      }

      // Export as PDF
      console.log('Exporting PDF from CE.SDK...');
      const pdfBlob = await engine.block.export(pages[0], 'application/pdf');
      console.log(`PDF exported: ${pdfBlob.size} bytes`);

      // Convert to PDF/X-3
      // Note: assetPath is required for Webpack 5/Angular because import.meta.url
      // is transformed to a file:// URL that doesn't work in browsers
      console.log(`Converting to PDF/X-3 with profile: ${this.selectedProfile}...`);
      console.log(`Test mode: ${this.testMode}`);

      // Build options based on test mode
      const options: any = {
        outputProfile: this.selectedProfile as any,
        title: 'Angular Webpack5 Test Export',
      };

      if (this.testMode === 'custom' && this.customAssetPath) {
        options.assetPath = this.customAssetPath;
        console.log('Using custom assetPath:', this.customAssetPath);
      } else if (this.testMode === 'normal') {
        options.assetPath = '/assets/print-ready-pdfs/';
        console.log('Using default assetPath: /assets/print-ready-pdfs/');
      } else {
        console.log('No assetPath provided (testError mode)');
      }

      const pdfX3Blob = await convertToPDFX3(pdfBlob, options);

      this.pdfSize = pdfX3Blob.size;
      this.conversionSuccess = true;
      window.testResults.conversionSuccess = true;
      window.testResults.pdfSize = pdfX3Blob.size;
      window.testResults.testComplete = true;
      console.log(`PDF/X-3 conversion successful: ${pdfX3Blob.size} bytes`);

      // Download the file
      const url = URL.createObjectURL(pdfX3Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `print-ready-${this.selectedProfile}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error: any) {
      console.error('Export failed:', error);
      this.conversionError = error.message;
      window.testResults.conversionError = error.message;
      window.testResults.testComplete = true;
    } finally {
      this.isExporting = false;
    }
  }
}
APP_COMPONENT_TS

echo ""
echo "Step 12: Creating favicon.ico placeholder..."
# Create a minimal favicon (1x1 transparent PNG converted to ICO format)
touch src/favicon.ico

echo ""
echo "Step 12.5: Creating type declaration for plugin..."
cat > src/plugin.d.ts << 'PLUGIN_DTS'
// Type declaration for @imgly/plugin-print-ready-pdfs-web
// This provides types for the local symlinked plugin
declare module '@imgly/plugin-print-ready-pdfs-web' {
  export interface PDFX3Options {
    outputProfile: 'fogra39' | 'gracol' | 'srgb' | 'custom' | string;
    customProfile?: Blob;
    title?: string;
    flattenTransparency?: boolean;
    outputConditionIdentifier?: string;
    outputCondition?: string;
    /**
     * Base URL path where plugin assets (gs.js, gs.wasm, *.icc) are served from.
     * Required for bundled environments (Webpack 5, Angular).
     */
    assetPath?: string;
  }

  export function convertToPDFX3(
    input: Blob | Blob[],
    options: PDFX3Options
  ): Promise<Blob>;
}
PLUGIN_DTS

echo ""
echo "Step 13: Installing dependencies..."
npm install

echo ""
echo "Step 14: Linking local plugin..."
# Create symlink to local plugin ROOT (not dist) to mimic npm package structure
# When published, npm package has: package-root/dist/{gs.js,gs.wasm,*.icc,index.mjs}
# So integrators use: node_modules/@imgly/plugin-print-ready-pdfs-web/dist/
mkdir -p node_modules/@imgly
if [ -L "node_modules/@imgly/plugin-print-ready-pdfs-web" ]; then
    rm "node_modules/@imgly/plugin-print-ready-pdfs-web"
fi
ln -s "$PLUGIN_DIR" "node_modules/@imgly/plugin-print-ready-pdfs-web"

echo ""
echo "=== Project created successfully! ==="
echo ""
echo "To build and serve the project:"
echo "  cd $PROJECT_DIR"
echo "  npm run build"
echo "  npm run serve"
echo ""
echo "Then open http://localhost:4299 in your browser"
