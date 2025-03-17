/**
 * Extracts a readable error message from an unknown error
 *
 * @param error The error caught in a try/catch block
 * @param fallbackMessage Optional fallback message if error is not an Error object
 * @returns A string representation of the error
 */
export function extractErrorMessage(
  error: unknown,
  fallbackMessage = 'An unknown error occurred'
): string {
  if (error === null) {
    return fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object') {
    // Try to get message property if it exists
    const errorObj = error as Record<string, unknown>;
    if ('message' in errorObj && typeof errorObj.message === 'string') {
      return errorObj.message;
    }

    // Try to convert to string
    try {
      return JSON.stringify(error);
    } catch {
      // If can't stringify, return the fallback
      return fallbackMessage;
    }
  }

  if (typeof error === 'string') {
    return error;
  }

  // For any other type, convert to string
  return String(error) || fallbackMessage;
}

/**
 * Generates a random UUID v4
 */
export function uuid4() {
  /* eslint-disable no-bitwise */
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
    /* eslint-enable no-bitwise */
  });
}

/**
 * Gets the duration of a video from a URL
 * @param url - The URL of the video
 * @returns A promise that resolves to the duration of the video in seconds
 */
export function getDurationForVideo(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement('video');
      video.style.display = 'none';
      
      // Set up event handlers
      video.addEventListener('loadedmetadata', () => {
        if (video.duration === Infinity) {
          // Some videos might initially report Infinity
          video.currentTime = 1e101;
          // Wait for currentTime to update
          setTimeout(() => {
            video.currentTime = 0;
            resolve(video.duration);
            document.body.removeChild(video);
          }, 50);
        } else {
          resolve(video.duration);
          document.body.removeChild(video);
        }
      });
      
      video.addEventListener('error', () => {
        document.body.removeChild(video);
        reject(new Error(`Failed to load video from ${url}`));
      });
      
      // Set source and begin loading
      video.src = url;
      document.body.appendChild(video);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Gets a thumbnail image from a video URL
 * @param url - The URL of the video
 * @param seekTime - Time in seconds to capture the thumbnail (default: 0)
 * @param format - Image format for the thumbnail (default: 'image/jpeg')
 * @param quality - Image quality between 0 and 1 (default: 0.8)
 * @returns A promise that resolves to the thumbnail data URL
 */
export function getThumbnailForVideo(
  url: string, 
  seekTime = 0, 
  format = 'image/jpeg', 
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement('video');
      // Set crossOrigin to anonymous to prevent tainted canvas issues
      video.crossOrigin = 'anonymous';
      video.style.display = 'none';
      
      // Set up event handlers
      video.addEventListener('loadedmetadata', () => {
        // Seek to the specified time
        video.currentTime = Math.min(seekTime, video.duration);
        
        video.addEventListener('seeked', () => {
          // Create a canvas to draw the video frame
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Draw the video frame to the canvas
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            document.body.removeChild(video);
            reject(new Error('Failed to create canvas context'));
            return;
          }
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          try {
            // Convert canvas to data URL
            const dataURL = canvas.toDataURL(format, quality);
            // Clean up
            document.body.removeChild(video);
            resolve(dataURL);
          } catch (e) {
            document.body.removeChild(video);
            reject(new Error(`Failed to create thumbnail: ${e instanceof Error ? e.message : String(e)}`));
          }
        }, { once: true });
      });
      
      video.addEventListener('error', () => {
        document.body.removeChild(video);
        reject(new Error(`Failed to load video from ${url}`));
      });
      
      // Set source and begin loading
      video.src = url;
      document.body.appendChild(video);
    } catch (error) {
      reject(error);
    }
  });
}
