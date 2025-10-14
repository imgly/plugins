import { Page } from '@playwright/test';
import { join } from 'path';

export interface ArchiveExportOptions {
  archivePath: string;
  exportOptions?: {
    quality?: number;
  };
}

/**
 * Helper to load CE.SDK archives and export to PDF in browser context
 * This runs in Playwright's browser, not Node.js
 */
export class SceneLoader {
  private page: Page;
  private licenseKey: string;
  private initialized: boolean = false;

  constructor(page: Page, licenseKey: string) {
    this.page = page;
    this.licenseKey = licenseKey;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Navigate to a blank page to initialize CE.SDK
    await this.page.goto('about:blank');

    // Inject CE.SDK and initialize
    await this.page.addScriptTag({
      url: 'https://cdn.img.ly/packages/imgly/cesdk-engine/1.59.0/index.js'
    });

    // Wait for CreativeEngine to be available
    await this.page.waitForFunction(() => typeof window.CreativeEngine !== 'undefined');

    // Initialize the engine
    await this.page.evaluate((license) => {
      return window.CreativeEngine.init({
        license,
        baseURL: 'https://cdn.img.ly/packages/imgly/cesdk-engine/1.59.0/assets'
      }).then(engine => {
        window.cesdk = engine;
      });
    }, this.licenseKey);

    this.initialized = true;
  }

  async loadAndExportArchive(archivePath: string): Promise<Blob> {
    if (!this.initialized) {
      throw new Error('Engine not initialized. Call initialize() first.');
    }

    // Read archive file from disk
    const archiveBuffer = await this.page.evaluate(async (path) => {
      const response = await fetch(`file://${path}`);
      const arrayBuffer = await response.arrayBuffer();
      return Array.from(new Uint8Array(arrayBuffer));
    }, archivePath);

    // Load archive and export to PDF in browser
    const pdfArrayBuffer = await this.page.evaluate(async (bufferArray) => {
      const engine = window.cesdk;

      // Create blob from archive data
      const archiveBlob = new Blob([new Uint8Array(bufferArray)], { type: 'application/zip' });
      const archiveUrl = URL.createObjectURL(archiveBlob);

      // Load archive
      await engine.scene.loadFromArchiveURL(archiveUrl);

      // Get pages
      const pages = engine.scene.getPages();
      if (pages.length === 0) {
        throw new Error('Archive has no pages');
      }

      // Export to PDF
      const pdfBlob = await engine.block.export(pages[0], 'application/pdf');

      // Convert to array buffer for returning
      const arrayBuffer = await pdfBlob.arrayBuffer();
      return Array.from(new Uint8Array(arrayBuffer));
    }, archiveBuffer);

    // Convert back to Blob in Node.js context
    return new Blob([new Uint8Array(pdfArrayBuffer)], { type: 'application/pdf' });
  }

  async exportArchiveToBlob(options: ArchiveExportOptions): Promise<Blob> {
    return this.loadAndExportArchive(options.archivePath);
  }

  async dispose(): Promise<void> {
    if (this.initialized) {
      await this.page.evaluate(() => {
        if (window.cesdk) {
          window.cesdk.dispose();
          delete window.cesdk;
        }
      });
      this.initialized = false;
    }
  }

  /**
   * Helper to get absolute path to archive fixture
   */
  static getArchivePath(archiveName: string): string {
    return join(__dirname, '../fixtures/archives', archiveName);
  }
}