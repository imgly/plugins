/* eslint-disable import/extensions */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const testFile = fileURLToPath(import.meta.url);
const testDir = dirname(testFile);

describe('Silent Conversion Tests', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;

  const getTestPDF = (name: string): Blob => {
    const path = join(testDir, '../fixtures/pdfs', name);
    if (!existsSync(path)) {
      throw new Error(`Test PDF not found: ${path}. Export it from CE.SDK first.`);
    }
    return new Blob([readFileSync(path)], { type: 'application/pdf' });
  };

  beforeEach(() => {
    // Spy on all console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  test('should convert PDF without Ghostscript warnings about PDF 1.5 features', async () => {
    // Dynamic import to ensure console spies are set up first
    const { convertToPDFX3 } = await import('../../dist/index.mjs');

    const inputPDF = getTestPDF('test-minimal.pdf');

    const outputPDF = (await convertToPDFX3(inputPDF, {
      outputProfile: 'gracol',
      title: 'Silent Test',
    })) as Blob;

    // Verify PDF was created successfully
    expect(outputPDF).toBeInstanceOf(Blob);
    expect(outputPDF.size).toBeGreaterThan(1024); // At least 1KB

    // Verify it's a valid PDF
    const pdfBytes = new Uint8Array(await outputPDF.arrayBuffer());
    const pdfHeader = String.fromCharCode(...pdfBytes.slice(0, 5));
    expect(pdfHeader).toBe('%PDF-');

    // Check that no PDF 1.5 feature warnings were logged
    const allErrorCalls = consoleErrorSpy.mock.calls.flat().join(' ');
    expect(allErrorCalls).not.toContain('WriteObjStms');
    expect(allErrorCalls).not.toContain('WriteXRefStm');
    expect(allErrorCalls).not.toContain("Can't use Object streams");
    expect(allErrorCalls).not.toContain("Can't use an XRef stream");
  });

  test('should not produce any console.error output during normal conversion', async () => {
    const { convertToPDFX3 } = await import('../../dist/index.mjs');

    const inputPDF = getTestPDF('test-minimal.pdf');

    await convertToPDFX3(inputPDF, {
      outputProfile: 'fogra39',
      title: 'No Errors Test',
    });

    // No console.error calls should have been made
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  test('should not produce any console output during normal conversion (silent by default)', async () => {
    const { convertToPDFX3 } = await import('../../dist/index.mjs');

    const inputPDF = getTestPDF('test-minimal.pdf');

    await convertToPDFX3(inputPDF, {
      outputProfile: 'gracol',
      title: 'Silent Test',
    });

    // No console output should have been made (silent by default)
    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleDebugSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  test('should allow enabling all logs via Logger.setLogLevel("info")', async () => {
    const { convertToPDFX3, Logger } = await import('../../dist/index.mjs');

    // Enable info-level logging
    Logger.setLogLevel('info');

    const inputPDF = getTestPDF('test-minimal.pdf');

    await convertToPDFX3(inputPDF, {
      outputProfile: 'gracol',
      title: 'Verbose Test',
    });

    // Reset to default (warn) for other tests
    Logger.setLogLevel('warn');

    // INFO logs should have been produced
    expect(consoleInfoSpy).toHaveBeenCalled();

    // Verify some expected log messages (VirtualFileSystem logs on each conversion)
    const allInfoCalls = consoleInfoSpy.mock.calls.flat().join(' ');
    expect(allInfoCalls).toContain('VirtualFileSystem');
    expect(allInfoCalls).toContain('[INFO]');
  });

  test('should allow enabling warnings and errors only via Logger.setLogLevel("warn")', async () => {
    const { convertToPDFX3, Logger } = await import('../../dist/index.mjs');

    // Set to warn level (this is the default, but being explicit)
    Logger.setLogLevel('warn');

    const inputPDF = getTestPDF('test-minimal.pdf');

    await convertToPDFX3(inputPDF, {
      outputProfile: 'gracol',
      title: 'Warn Level Test',
    });

    // No INFO or DEBUG logs should have been produced
    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleDebugSpy).not.toHaveBeenCalled();

    // No warnings/errors expected during normal conversion
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
