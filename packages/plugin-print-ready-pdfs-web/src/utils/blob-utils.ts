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
}
