import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

export interface FontInfo {
  name: string;
  type: string;
  embedded: boolean;
  subset: boolean;
}

export interface ImageInfo {
  page: number;
  type: string;
  width: number;
  height: number;
  colorSpace: string;
}

export interface PDFInfo {
  title: string;
  trapped: string | null;
  pdfVersion: string;
  pages: number;
  [key: string]: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * External PDF validation tools wrapper (requires poppler-utils, qpdf)
 * Install on macOS: brew install poppler qpdf
 */
export class ExternalValidators {
  /**
   * Validate font embedding using pdffonts
   */
  static async validateFonts(pdfBlob: Blob): Promise<FontInfo[]> {
    const tempPath = await this.blobToTempFile(pdfBlob, 'test.pdf');

    try {
      const { stdout } = await execAsync(`pdffonts "${tempPath}"`);
      return this.parsePdfFonts(stdout);
    } finally {
      unlinkSync(tempPath);
    }
  }

  /**
   * Check if all fonts are embedded
   */
  static async areAllFontsEmbedded(pdfBlob: Blob): Promise<boolean> {
    const fonts = await this.validateFonts(pdfBlob);
    return fonts.length > 0 && fonts.every(f => f.embedded);
  }

  /**
   * List images in PDF using pdfimages
   */
  static async listImages(pdfBlob: Blob): Promise<ImageInfo[]> {
    const tempPath = await this.blobToTempFile(pdfBlob, 'test.pdf');

    try {
      const { stdout } = await execAsync(`pdfimages -list "${tempPath}"`);
      return this.parsePdfImages(stdout);
    } finally {
      unlinkSync(tempPath);
    }
  }

  /**
   * Get basic PDF info using pdfinfo
   */
  static async getPdfInfo(pdfBlob: Blob): Promise<PDFInfo> {
    const tempPath = await this.blobToTempFile(pdfBlob, 'test.pdf');

    try {
      const { stdout } = await execAsync(`pdfinfo "${tempPath}"`);
      return this.parsePdfInfo(stdout);
    } finally {
      unlinkSync(tempPath);
    }
  }

  /**
   * Extract text from PDF using pdftotext
   */
  static async extractText(pdfBlob: Blob): Promise<string> {
    const tempPath = await this.blobToTempFile(pdfBlob, 'test.pdf');

    try {
      const { stdout } = await execAsync(`pdftotext "${tempPath}" -`);
      return stdout.trim();
    } finally {
      unlinkSync(tempPath);
    }
  }

  /**
   * Validate PDF structure using qpdf
   */
  static async validateStructure(pdfBlob: Blob): Promise<ValidationResult> {
    const tempPath = await this.blobToTempFile(pdfBlob, 'test.pdf');

    try {
      await execAsync(`qpdf --check "${tempPath}"`);
      return { valid: true, errors: [], warnings: [] };
    } catch (error: any) {
      const output = error.stderr || error.stdout || '';
      return {
        valid: false,
        errors: this.extractErrors(output),
        warnings: this.extractWarnings(output)
      };
    } finally {
      unlinkSync(tempPath);
    }
  }

  /**
   * Check if PDF/X conformance using Ghostscript validation
   */
  static async validatePDFX(pdfBlob: Blob): Promise<ValidationResult> {
    const tempPath = await this.blobToTempFile(pdfBlob, 'test.pdf');

    try {
      // Use Ghostscript to validate PDF/X
      const { stdout, stderr } = await execAsync(
        `gs -dPDFX -dNODISPLAY -dBATCH -dNOPAUSE "${tempPath}" 2>&1`
      );

      const output = stdout + stderr;
      const hasErrors = output.toLowerCase().includes('error');

      return {
        valid: !hasErrors,
        errors: hasErrors ? this.extractErrors(output) : [],
        warnings: this.extractWarnings(output)
      };
    } catch (error: any) {
      const output = error.stderr || error.stdout || '';
      return {
        valid: false,
        errors: this.extractErrors(output),
        warnings: this.extractWarnings(output)
      };
    } finally {
      unlinkSync(tempPath);
    }
  }

  /**
   * Count objects in PDF (rough measure of complexity)
   */
  static async countPdfObjects(pdfBlob: Blob): Promise<number> {
    const tempPath = await this.blobToTempFile(pdfBlob, 'test.pdf');

    try {
      // Use qpdf to get the trailer which contains /Size (total object count)
      const { stdout } = await execAsync(
        `qpdf --show-object=trailer "${tempPath}" 2>/dev/null`
      );

      // Extract /Size value from trailer dictionary
      const sizeMatch = stdout.match(/\/Size\s+(\d+)/);
      if (sizeMatch) {
        return parseInt(sizeMatch[1]);
      }

      return 0;
    } catch {
      return 0;
    } finally {
      unlinkSync(tempPath);
    }
  }

  // ===== Helper methods =====

  private static async blobToTempFile(blob: Blob, filename: string): Promise<string> {
    const buffer = Buffer.from(await blob.arrayBuffer());
    const tempPath = join(tmpdir(), `pdfx-test-${Date.now()}-${filename}`);
    writeFileSync(tempPath, buffer);
    return tempPath;
  }

  private static parsePdfFonts(output: string): FontInfo[] {
    const lines = output.split('\n').slice(2); // Skip header lines
    const fonts: FontInfo[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      const parts = line.trim().split(/\s+/);
      if (parts.length < 6) continue;

      // Font type can be multi-word (e.g., "CID TrueType"), so combine parts[1] and parts[2]
      const type = `${parts[1]} ${parts[2]}`;

      fonts.push({
        name: parts[0],
        type: type,
        embedded: parts[4] === 'yes',
        subset: parts[5] === 'yes'
      });
    }

    return fonts;
  }

  private static parsePdfImages(output: string): ImageInfo[] {
    const lines = output.split('\n').slice(2); // Skip header lines
    const images: ImageInfo[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      const parts = line.trim().split(/\s+/);
      if (parts.length < 7) continue;

      images.push({
        page: parseInt(parts[0]),
        type: parts[2],
        width: parseInt(parts[3]),
        height: parseInt(parts[4]),
        colorSpace: parts[5]
      });
    }

    return images;
  }

  private static parsePdfInfo(output: string): PDFInfo {
    const info: PDFInfo = {
      title: '',
      trapped: null,
      pdfVersion: '',
      pages: 0
    };

    for (const line of output.split('\n')) {
      // Skip indented lines (metadata from nested structures like PDF subtype)
      if (line.startsWith('    ') || line.startsWith('\t')) {
        continue;
      }

      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();

      switch (key.trim()) {
        case 'Title':
          info.title = value;
          break;
        case 'Trapped':
          info.trapped = value;
          break;
        case 'PDF version':
          info.pdfVersion = value;
          break;
        case 'Pages':
          info.pages = parseInt(value);
          break;
        default:
          info[key.trim()] = value;
      }
    }

    return info;
  }

  private static extractErrors(output: string): string[] {
    const lines = output.split('\n');
    return lines
      .filter(line =>
        line.toLowerCase().includes('error') ||
        line.includes('**** Error')
      )
      .map(line => line.trim());
  }

  private static extractWarnings(output: string): string[] {
    const lines = output.split('\n');
    return lines
      .filter(line =>
        line.toLowerCase().includes('warning') ||
        line.includes('**** Warning')
      )
      .map(line => line.trim());
  }

  /**
   * Check if external tools are available
   */
  static async checkToolsAvailable(): Promise<Record<string, boolean>> {
    const tools = {
      pdffonts: 'pdffonts -v',
      pdfimages: 'pdfimages -v',
      pdfinfo: 'pdfinfo -v',
      pdftotext: 'pdftotext -v',
      qpdf: 'qpdf --version',
      gs: 'gs --version'
    };

    const available: Record<string, boolean> = {};

    for (const [name, cmd] of Object.entries(tools)) {
      try {
        await execAsync(cmd);
        available[name] = true;
      } catch {
        available[name] = false;
      }
    }

    return available;
  }
}