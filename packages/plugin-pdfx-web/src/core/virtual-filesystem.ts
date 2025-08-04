import type { EmscriptenModule, EmscriptenFS } from '../types/ghostscript';
import { Logger } from '../utils/logger';
import { BlobUtils } from '../utils/blob-utils';

export interface FileEntry {
  path: string;
  data: Uint8Array;
  cleanup: boolean;
}

export class VirtualFileSystem {
  private readonly fs: EmscriptenFS;
  private readonly logger: Logger;
  private readonly managedFiles: Set<string> = new Set();
  private readonly workingDir: string;

  constructor(
    private readonly module: EmscriptenModule,
    workingDir = '/tmp/pdfx'
  ) {
    this.fs = module.FS;
    this.logger = new Logger('VirtualFileSystem');
    this.workingDir = workingDir;
    this.initialize();
  }

  private initialize(): void {
    try {
      // Create working directory structure (handle existing directories gracefully)
      this.createDirIfNotExists(this.workingDir);
      this.createDirIfNotExists(`${this.workingDir}/input`);
      this.createDirIfNotExists(`${this.workingDir}/output`);
      this.createDirIfNotExists(`${this.workingDir}/profiles`);
      this.createDirIfNotExists(`${this.workingDir}/temp`);

      this.logger.info('Virtual filesystem initialized', {
        workingDir: this.workingDir,
      });
    } catch (error) {
      this.logger.error('Failed to initialize virtual filesystem', { error });
      throw new Error(`VFS initialization failed: ${error}`);
    }
  }

  private createDirIfNotExists(path: string): void {
    try {
      this.fs.mkdir(path);
    } catch (error: any) {
      // Ignore "File exists" errors, re-throw others
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  async writeBlob(path: string, blob: Blob, managed = true): Promise<void> {
    try {
      const data = await BlobUtils.toUint8Array(blob);
      this.fs.writeFile(path, data);

      if (managed) {
        this.managedFiles.add(path);
      }

      this.logger.debug('File written', { path, size: data.length });
    } catch (error) {
      this.logger.error('Failed to write blob', { path, error });
      throw new Error(`Failed to write file ${path}: ${error}`);
    }
  }

  writeText(path: string, content: string, managed = true): void {
    try {
      this.fs.writeFile(path, content);

      if (managed) {
        this.managedFiles.add(path);
      }

      this.logger.debug('Text file written', { path, length: content.length });
    } catch (error) {
      this.logger.error('Failed to write text', { path, error });
      throw new Error(`Failed to write text file ${path}: ${error}`);
    }
  }

  readFile(path: string): Uint8Array {
    try {
      const data = this.fs.readFile(path) as Uint8Array;
      this.logger.debug('File read', { path, size: data.length });
      return data;
    } catch (error) {
      this.logger.error('Failed to read file', { path, error });
      throw new Error(`Failed to read file ${path}: ${error}`);
    }
  }

  readText(path: string): string {
    try {
      const data = this.fs.readFile(path, { encoding: 'utf8' });
      this.logger.debug('Text file read', {
        path,
        length: (data as string).length,
      });
      return data as string;
    } catch (error) {
      this.logger.error('Failed to read text file', { path, error });
      throw new Error(`Failed to read text file ${path}: ${error}`);
    }
  }

  exists(path: string): boolean {
    try {
      this.fs.stat(path);
      return true;
    } catch {
      return false;
    }
  }

  getFileSize(path: string): number {
    try {
      const stat = this.fs.stat(path);
      return stat.size;
    } catch (error) {
      this.logger.error('Failed to get file size', { path, error });
      return 0;
    }
  }

  generateTempPath(prefix: string, extension: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${this.workingDir}/temp/${prefix}_${timestamp}_${random}.${extension}`;
  }

  cleanup(): void {
    let cleanedCount = 0;

    for (const path of this.managedFiles) {
      try {
        this.fs.unlink(path);
        cleanedCount++;
      } catch (error) {
        this.logger.warn('Failed to cleanup file', { path, error });
      }
    }

    this.managedFiles.clear();
    this.logger.info('Filesystem cleanup completed', { cleanedCount });
  }

  getWorkingDir(): string {
    return this.workingDir;
  }
}
