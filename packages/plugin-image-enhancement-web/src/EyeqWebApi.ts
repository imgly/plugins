/* eslint-disable no-await-in-loop */
/* eslint-disable no-constant-condition */

import CreativeEditorSDK, { type Source } from '@cesdk/cesdk-js';
import { ProcessImageEnhancementMethods } from './processImageEnhancement';
import uploadBlob from './uploadBlob';

class EyeqWebApi implements ProcessImageEnhancementMethods {
  cesdk: CreativeEditorSDK;

  proxyURL: string;

  constructor(cesdk: CreativeEditorSDK, proxyURL: string) {
    this.cesdk = cesdk;
    this.proxyURL = proxyURL;
  }

  async processImageFileURI(imageFileURI: string): Promise<string> {
    const enhancedBlob = await processImageEnhancement(
      imageFileURI,
      this.proxyURL
    );
    const uploaded = await uploadBlob(enhancedBlob, imageFileURI, this.cesdk);
    return uploaded;
  }

  async processSourceSet(sourceSet: Source[]): Promise<Source[]> {
    const inputSource = sourceSet[0];
    if (inputSource == null) throw new Error('No source found');

    const url = inputSource.uri;
    const enhancedBlob = await processImageEnhancement(url, this.proxyURL);

    const uploaded = await uploadBlob(
      enhancedBlob,
      inputSource.uri,
      this.cesdk
    );

    return [
      {
        ...inputSource,
        uri: uploaded
      }
    ];
  }
}

async function processImageEnhancement(
  url: string,
  proxyURL: string
): Promise<Blob> {
  const imageBlob = await fetchImageAsBlob(url);

  if (imageBlob == null) throw new Error('Failed to fetch image');

  const { fileKey, upload_url } = await getPresignedURL(proxyURL);
  if (fileKey == null || upload_url == null) {
    throw new Error('Failed to get presigned URL');
  }
  await uploadFileToEyeq(imageBlob, upload_url);
  const statusUrl = await requestCorrection(fileKey, proxyURL);

  const proxiedStatusUrl = statusUrl.replace(
    'https://api.perfectlyclear.io/v2/',
    `${proxyURL}/`
  );
  const blob = await checkJobStatus(proxiedStatusUrl);
  return blob;
}

async function fetchImageAsBlob(imageUrl: string) {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const imageBlob = await response.blob();
  return imageBlob; // This is the Blob representing the image
}

async function getPresignedURL(proxyURL: string): Promise<{
  fileKey: string;
  upload_url: string;
}> {
  const result = fetch(`${proxyURL}/upload`, {
    method: 'GET'
  }).then((response) => response.json());

  return result;
}

async function uploadFileToEyeq(blob: Blob, uploadUrl: string) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': blob.type // Ensure correct MIME type
    },
    body: blob
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
}

async function requestCorrection(fileKey: string, proxyURL: string) {
  const url = `${proxyURL}/pfc?fileKey=${fileKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return data.statusEndpoint;
}

async function checkJobStatus(statusUrl: string, interval = 1000) {
  while (true) {
    const response = await fetch(statusUrl, {
      method: 'GET'
    });

    if (response.status === 302) {
      // Job is complete, extract download URL
      const correctedFileUrl = response.headers.get('location');
      if (correctedFileUrl == null) {
        throw new Error('Corrected file URL not sent');
      }
      const correctedFileResponse = await fetch(correctedFileUrl);
      if (!correctedFileResponse.ok) {
        throw new Error(
          `Failed to fetch corrected file: ${correctedFileResponse.statusText}`
        );
      }
      const blob = await correctedFileResponse.blob();
      return blob;
    }

    if (response.headers.get('content-type') !== 'application/json') {
      const blob = await response.blob();
      return blob;
    }

    const data = await response.json();

    if (data.status === 'COMPLETED') {
      return data.correctedFile;
    }

    if (data.status === 'FAILED' || data.status === 'REJECTED') {
      return null;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, interval);
    });
  }
}

export default EyeqWebApi;
