/**
 * File Upload Service
 * Handles file uploads to local storage and returns file paths
 */

// Check if FileUploadService already exists before declaring it
if (typeof window.FileUploadService === 'undefined') {
  const FileUploadService = {
    // Save file to local storage with improved error handling
    saveFile: async function(file, type = 'posts') {
      try {
        if (!file) {
          console.error('No file provided to upload');
          return null;
        }
        
        console.log(`Uploading file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
        
        // Check if file is AVIF and convert if needed
        if (file.type === 'image/avif') {
          console.log('AVIF image detected, converting to PNG for better compatibility');
          try {
            // Create a temporary image element to convert AVIF to PNG
            const img = document.createElement('img');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Create a promise to handle the image loading
            const convertedFile = await new Promise((resolve, reject) => {
              img.onload = () => {
                try {
                  canvas.width = img.width;
                  canvas.height = img.height;
                  ctx.drawImage(img, 0, 0);
                  
                  // Convert to PNG
                  canvas.toBlob((blob) => {
                    if (!blob) {
                      reject(new Error('Failed to convert AVIF to PNG'));
                      return;
                    }
                    
                    // Create a new file from the blob
                    const convertedFile = new File([blob], 
                      file.name.replace(/\.avif$/i, '.png') || 'image.png', 
                      { type: 'image/png' }
                    );
                    resolve(convertedFile);
                  }, 'image/png');
                } catch (err) {
                  reject(err);
                }
              };
              
              img.onerror = () => {
                reject(new Error('Failed to load AVIF image for conversion'));
              };
              
              // Set the source to the file
              img.src = URL.createObjectURL(file);
            });
            
            // Use the converted file instead
            file = convertedFile;
            console.log('Successfully converted AVIF to PNG');
          } catch (convErr) {
            console.error('Error converting AVIF to PNG:', convErr);
            // Continue with original file if conversion fails
          }
        }
        
        // Create a FormData object
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type); // posts, stories, or profiles
        
        try {
          // Try the main upload endpoint first
          console.log('Trying main upload endpoint...');
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });
          
          const result = await response.json();
          
          if (!response.ok) {
            console.error('Server error during file upload:', result.error);
            throw new Error(result.error || 'Failed to upload file');
          }
          
          console.log('File uploaded successfully:', result);
          return result.filePath;
        } catch (mainError) {
          console.warn('Main upload failed, trying fallback endpoint...', mainError);
          
          // Try the fallback endpoint
          const fallbackResponse = await fetch('/api/upload-fallback', {
            method: 'POST',
            body: formData
          });
          
          const fallbackResult = await fallbackResponse.json();
          
          if (!fallbackResponse.ok) {
            console.error('Server error during fallback file upload:', fallbackResult.error);
            throw new Error(fallbackResult.error || 'Failed to upload file using fallback');
          }
          
          console.log('File uploaded successfully using fallback:', fallbackResult);
          return fallbackResult.filePath;
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        alert(`Failed to upload file: ${error.message}`);
        return null;
      }
    }
  };

  // Make it available globally
  window.FileUploadService = FileUploadService;
}
