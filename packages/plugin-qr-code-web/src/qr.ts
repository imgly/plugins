import qrcodegen from './lib/qrcodegen';

interface QrCode {
  svg: string;
  path: string;
  size: number;
}

export function generateQr(content: string, color: string): QrCode {
  const code = qrcodegen.QrCode.encodeText(content, qrcodegen.QrCode.Ecc.HIGH);

  const path = toPath(code);
  const svg = toSvg(path, color, code.size);

  return {
    svg,
    path,
    size: code.size
  };
}

/**
 * Create an SVG path from a QR code.
 */
function toPath(qr: qrcodegen.QrCode) {
  const parts: Array<string> = [];
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (qr.getModule(x, y)) parts.push(`M${x},${y}h1v1h-1z`);
    }
  }

  return parts.join(' ');
}

/**
 * Create a complete SVG string from a QR code.
 */
function toSvg(path: string, color: string, size: number): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${size} ${size}" stroke="none">
	<path d="${path}" fill="${color}"/>
</svg>
`;
}
