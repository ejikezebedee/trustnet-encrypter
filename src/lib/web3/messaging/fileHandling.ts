
/**
 * Compresses an image file to reduce size
 * @param file The image file to compress
 * @param maxWidth Maximum width in pixels
 * @param quality Compression quality (0-1)
 * @returns A compressed File object
 */
export const compressImage = async (
  file: File,
  maxWidth = 1200,
  quality = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions maintaining aspect ratio
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              
              // Create new file
              const compressedFile = new File(
                [blob],
                file.name,
                {
                  type: file.type,
                  lastModified: Date.now()
                }
              );
              
              resolve(compressedFile);
            },
            file.type,
            quality
          );
        };
      };
      
      reader.onerror = (error) => reject(error);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Processes a voice recording for sending
 * @param audioBlob The recorded audio blob
 * @param fileName Optional filename
 * @returns A File object ready for sending
 */
export const processVoiceRecording = (
  audioBlob: Blob,
  fileName = `voice-${Date.now()}.webm`
): File => {
  return new File([audioBlob], fileName, {
    type: audioBlob.type,
    lastModified: Date.now()
  });
};

/**
 * Checks if a file is valid for sending
 * @param file The file to validate
 * @param maxSizeMB Maximum file size in MB
 * @returns Object with validation result and error message if any
 */
export const validateFile = (
  file: File,
  maxSizeMB = 10
): { valid: boolean; error?: string } => {
  const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxSizeMB}MB.`
    };
  }
  
  // Validate file type
  const allowedTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Audio
    'audio/webm',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'text/plain',
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not supported.'
    };
  }
  
  return { valid: true };
};

/**
 * Gets file type category from MIME type
 * @param mimeType MIME type of the file
 * @returns File type category
 */
export const getFileTypeCategory = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) {
    return 'image';
  } else if (mimeType.startsWith('audio/')) {
    return 'audio';
  } else if (mimeType === 'application/pdf') {
    return 'pdf';
  } else if (mimeType.startsWith('application/') || mimeType === 'text/plain') {
    return 'document';
  }
  return 'other';
};

/**
 * Generates a preview URL for a file
 * @param file The file to preview
 * @returns Promise resolving to a preview URL
 */
export const generatePreviewUrl = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    resolve(URL.createObjectURL(file));
  });
};
