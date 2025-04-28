export function b64JsonToBlob(b64_json: string, mimeType: string): Blob {
  const base64Data = b64_json.split(',')[1] || b64_json;

  const byteCharacters = atob(base64Data);
  const byteArrays = [];

  for (let i = 0; i < byteCharacters.length; i++) {
    byteArrays.push(byteCharacters.charCodeAt(i));
  }
  const byteArray = new Uint8Array(byteArrays);
  const blob = new Blob([byteArray], { type: mimeType });

  return blob;
}
