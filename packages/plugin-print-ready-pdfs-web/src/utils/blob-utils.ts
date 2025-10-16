export class BlobUtils {
  static async toUint8Array(blob: Blob): Promise<Uint8Array> {
    if (blob.arrayBuffer) {
      const buffer = await blob.arrayBuffer();
      return new Uint8Array(buffer);
    }

    // Fallback for older browsers
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(new Uint8Array(reader.result));
        } else {
          reject(new Error('Failed to read blob as ArrayBuffer'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(blob);
    });
  }

  static async toArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    if (blob.arrayBuffer) {
      return blob.arrayBuffer();
    }

    // Fallback for older browsers
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read blob as ArrayBuffer'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(blob);
    });
  }

  static async toString(
    blob: Blob,
    encoding: string = 'utf-8'
  ): Promise<string> {
    if (blob.text) {
      return blob.text();
    }

    // Fallback for older browsers
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read blob as text'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob, encoding);
    });
  }

  static fromUint8Array(
    data: Uint8Array,
    mimeType: string = 'application/octet-stream'
  ): Blob {
    return new Blob([data as BlobPart], { type: mimeType });
  }

  static fromArrayBuffer(
    buffer: ArrayBuffer,
    mimeType: string = 'application/octet-stream'
  ): Blob {
    return new Blob([buffer], { type: mimeType });
  }

  static fromString(text: string, mimeType: string = 'text/plain'): Blob {
    return new Blob([text], { type: mimeType });
  }

  static async validatePDF(blob: Blob): Promise<boolean> {
    try {
      const data = await this.toUint8Array(blob);

      // Check PDF magic number
      const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF

      if (data.length < 4) {
        return false;
      }

      for (let i = 0; i < 4; i++) {
        if (data[i] !== pdfHeader[i]) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }
}
