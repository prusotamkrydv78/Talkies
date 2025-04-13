/**
 * File Upload Service
 * Handles file uploads to local storage and returns file paths
 */

// Check if FileUploadService already exists before declaring it
if (typeof window.FileUploadService === 'undefined') {
  const FileUploadService = {
    // Save file to local storage
    saveFile: async function(file, type = 'posts') {
      try {
        // Create a FormData object
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type); // posts, stories, or profiles
        
        // Send the file to the server
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Failed to upload file');
        }
        
        // Get the file path from the response
        const result = await response.json();
        return result.filePath;
      } catch (error) {
        console.error('Error uploading file:', error);
        return null;
      }
    }
  };

  // Make it available globally
  window.FileUploadService = FileUploadService;
}
