/**
 * Create Post Page
 * Handles post creation functionality on the dedicated create post page
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const postContentTextarea = document.getElementById('postContent');
  const privacySelect = document.getElementById('postPrivacy');
  const uploadArea = document.getElementById('uploadArea');
  const browseFilesBtn = document.getElementById('browseFiles');
  const mediaPreview = document.getElementById('mediaPreview');
  const previewGrid = document.getElementById('previewGrid');
  const addPhotoVideoBtn = document.getElementById('addPhotoVideo');
  const publishButtons = document.querySelectorAll('#publishPost, #headerPublish, #finalPublishButton');
  const saveDraftButtons = document.querySelectorAll('#saveDraft, #headerSaveDraft');
  const cancelButton = document.getElementById('cancelButton');
  const allowCommentsCheckbox = document.getElementById('allowCommentsCheckbox');
  const showLikeCountCheckbox = document.getElementById('showLikeCountCheckbox');
  // Preview elements
  const previewContent = document.querySelector('.border.border-dark-100 p.mb-3');
  const previewImage = document.querySelector('.rounded-xl.overflow-hidden.mb-3');

  // User info elements
  const userAvatarElement = document.getElementById('userAvatar');
  const userNameElement = document.getElementById('userName');
  const previewAvatarElement = document.querySelector('.w-10.h-10.rounded-full');
  const previewNameElement = document.querySelector('h4.font-semibold');

  // Create file input element
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.multiple = true;
  fileInput.accept = 'image/*,video/*';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  // Selected files storage
  let selectedFiles = [];

  // Current user
  let currentUser = null;

  // Post settings
  const postSettings = {
    allowComments: true,
    showLikeCount: true
  };

  // Initialize
  init();

  /**
   * Initialize the post creation functionality
   */
  function init() {
    // Get current user
    getCurrentUser();

    // Add event listeners
    addEventListeners();

    // Initialize textarea auto-resize
    initTextareaAutoResize();
  }

  /**
   * Get current user from AuthService
   */
  function getCurrentUser() {
    if (window.AuthService) {
      currentUser = window.AuthService.getCurrentUser();

      if (currentUser) {
        // Update user info in the form and preview
        updateUserInfo();
      }
    }
  }

  /**
   * Update user info in the form and preview
   */
  function updateUserInfo() {
    if (!currentUser) return;

    // Update main avatar
    if (userAvatarElement) {
      if (currentUser.avatar) {
        userAvatarElement.innerHTML = '';
        userAvatarElement.style.backgroundImage = `url(${currentUser.avatar})`;
        userAvatarElement.style.backgroundSize = 'cover';
        userAvatarElement.style.backgroundPosition = 'center';
      } else {
        // Use initials if no avatar
        const initials = currentUser.name
          .split(' ')
          .map(name => name[0])
          .join('')
          .toUpperCase();
        userAvatarElement.textContent = initials;
      }
    }

    // Update preview avatar
    if (previewAvatarElement) {
      if (currentUser.avatar) {
        previewAvatarElement.innerHTML = '';
        previewAvatarElement.style.backgroundImage = `url(${currentUser.avatar})`;
        previewAvatarElement.style.backgroundSize = 'cover';
        previewAvatarElement.style.backgroundPosition = 'center';
      } else {
        // Use initials if no avatar
        const initials = currentUser.name
          .split(' ')
          .map(name => name[0])
          .join('')
          .toUpperCase();
        previewAvatarElement.textContent = initials;
      }
    }

    // Update main name
    if (userNameElement) {
      userNameElement.textContent = currentUser.name;
    }

    // Update preview name
    if (previewNameElement) {
      previewNameElement.textContent = currentUser.name;
    }
  }

  /**
   * Add event listeners
   */
  function addEventListeners() {
    // Textarea input for preview update
    if (postContentTextarea) {
      postContentTextarea.addEventListener('input', updatePreview);
    }

    // File upload via drag and drop
    if (uploadArea) {
      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('border-primary-500');
        uploadArea.classList.add('bg-primary-50');
      });

      uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('border-primary-500');
        uploadArea.classList.remove('bg-primary-50');
      });

      uploadArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        uploadArea.classList.remove('border-primary-500');
        uploadArea.classList.remove('bg-primary-50');

        if (e.dataTransfer.files.length) {
          await handleFiles(e.dataTransfer.files);
        }
      });

      uploadArea.addEventListener('click', () => {
        fileInput.click();
      });
    }

    // Browse files button
    if (browseFilesBtn) {
      browseFilesBtn.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
      });
    }

    // File input change
    fileInput.addEventListener('change', async () => {
      if (fileInput.files.length) {
        await handleFiles(fileInput.files);
      }
    });

    // Add photo/video button
    if (addPhotoVideoBtn) {
      addPhotoVideoBtn.addEventListener('click', () => {
        fileInput.click();
      });
    }

    // Publish buttons
    publishButtons.forEach(button => {
      button.addEventListener('click', publishPost);
    });

    // Save draft buttons
    saveDraftButtons.forEach(button => {
      button.addEventListener('click', saveDraft);
    });

    // Cancel button
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to cancel? Your changes will be lost.')) {
          window.location.href = '/';
        }
      });
    }

    // Privacy select
    if (privacySelect) {
      privacySelect.addEventListener('change', updatePreview);
    }

    // Post settings checkboxes
    if (allowCommentsCheckbox) {
      allowCommentsCheckbox.addEventListener('change', () => {
        postSettings.allowComments = allowCommentsCheckbox.checked;
      });
    }

    if (showLikeCountCheckbox) {
      showLikeCountCheckbox.addEventListener('change', () => {
        postSettings.showLikeCount = showLikeCountCheckbox.checked;
        updatePreview();
      });
    }

    // Add more button in preview
    const addMoreBtn = document.querySelector('.fa-plus')?.closest('.relative.group');
    if (addMoreBtn) {
      addMoreBtn.addEventListener('click', () => {
        fileInput.click();
      });
    }
  }

  /**
   * Initialize textarea auto-resize
   */
  function initTextareaAutoResize() {
    if (postContentTextarea) {
      postContentTextarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
      });
    }
  }

  /**
   * Update preview based on current input
   */
  function updatePreview() {
    // Update content
    if (previewContent && postContentTextarea) {
      const content = postContentTextarea.value.trim();
      previewContent.textContent = content || "What's on your mind?";
    }

    // Update privacy icon
    const privacyIcon = document.querySelector('.text-dark-500.text-xs i.fas');
    if (privacyIcon && privacySelect) {
      const privacy = privacySelect.value;
      privacyIcon.className = `fas fa-${privacy === 'Public' ? 'globe-americas' : (privacy === 'Friends Only' ? 'user-friends' : 'lock')}`;
    }

    // Update like count visibility
    const likeCount = document.querySelector('.text-dark-500.text-sm span:first-child');
    if (likeCount && postSettings) {
      likeCount.style.visibility = postSettings.showLikeCount ? 'visible' : 'hidden';
    }
  }

  /**
   * Handle selected files
   * @param {FileList} files - The selected files
   */
  async function handleFiles(files) {
    // Convert FileList to Array
    const filesArray = Array.from(files);

    // Add files to selected files array
    selectedFiles = [...selectedFiles, ...filesArray];

    // Show media preview
    if (mediaPreview) {
      mediaPreview.classList.remove('hidden');
    }

    // Clear preview grid except for the "Add More" button
    if (previewGrid) {
      const addMoreBtn = previewGrid.querySelector('.relative.group:last-child');
      previewGrid.innerHTML = '';
      if (addMoreBtn) {
        previewGrid.appendChild(addMoreBtn);
      }
    }

    // Add preview for each file
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      addFilePreview(file, i);
    }

    // Update preview image
    updatePreviewImage();
  }

  /**
   * Add file preview to the preview grid
   * @param {File} file - The file to preview
   * @param {number} index - The index of the file
   */
  function addFilePreview(file, index) {
    if (!previewGrid) return;

    const previewItem = document.createElement('div');
    previewItem.className = 'relative group rounded-xl overflow-hidden shadow-sm';

    if (file.type.startsWith('image/')) {
      // Image preview
      const img = document.createElement('img');
      img.className = 'w-full h-32 object-cover';
      img.src = URL.createObjectURL(file);
      previewItem.appendChild(img);
    } else if (file.type.startsWith('video/')) {
      // Video preview
      const video = document.createElement('video');
      video.className = 'w-full h-32 object-cover';
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.autoplay = true;
      video.loop = true;
      previewItem.appendChild(video);
    } else {
      // Fallback for other file types
      const fallback = document.createElement('div');
      fallback.className = 'w-full h-32 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center';

      const icon = document.createElement('i');
      icon.className = 'fas fa-file text-primary-400 text-4xl';
      fallback.appendChild(icon);

      previewItem.appendChild(fallback);
    }

    // Add delete button
    const deleteOverlay = document.createElement('div');
    deleteOverlay.className = 'absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100';

    const deleteButton = document.createElement('button');
    deleteButton.className = 'bg-white/80 text-red-500 p-2 rounded-full hover:bg-white transition-all';
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButton.addEventListener('click', () => {
      // Remove file from selected files
      selectedFiles.splice(index, 1);

      // Refresh preview
      if (previewGrid) {
        const addMoreBtn = previewGrid.querySelector('.relative.group:last-child');
        previewGrid.innerHTML = '';
        if (addMoreBtn) {
          previewGrid.appendChild(addMoreBtn);
        }
      }

      // Add preview for each file
      for (let i = 0; i < selectedFiles.length; i++) {
        addFilePreview(selectedFiles[i], i);
      }

      // Hide media preview if no files
      if (selectedFiles.length === 0 && mediaPreview) {
        mediaPreview.classList.add('hidden');
      }

      // Update preview image
      updatePreviewImage();
    });

    deleteOverlay.appendChild(deleteButton);
    previewItem.appendChild(deleteOverlay);

    // Add to preview grid before the "Add More" button
    const addMoreBtn = previewGrid.querySelector('.relative.group:last-child');
    if (addMoreBtn) {
      previewGrid.insertBefore(previewItem, addMoreBtn);
    } else {
      previewGrid.appendChild(previewItem);
    }
  }

  /**
   * Update the preview image based on selected files
   */
  function updatePreviewImage() {
    if (!previewImage) return;

    if (selectedFiles.length > 0) {
      // Use carousel for multiple files
      if (selectedFiles.length > 1 && window.createCarouselFromMedia) {
        // Convert files to media objects
        const mediaArray = selectedFiles.map(file => {
          return {
            type: file.type.startsWith('image/') ? 'image' : 'video',
            url: URL.createObjectURL(file)
          };
        });

        // Create carousel HTML
        previewImage.innerHTML = window.createCarouselFromMedia(mediaArray);

        // Initialize the carousel
        if (window.initCarousels) {
          window.initCarousels();
        }
      } else {
        // Single file preview
        const file = selectedFiles[0];

        if (file.type.startsWith('image/')) {
          // Image preview
          previewImage.innerHTML = '';
          const img = document.createElement('img');
          img.className = 'w-full h-48 md:h-64 object-cover rounded-xl';
          img.src = URL.createObjectURL(file);
          previewImage.appendChild(img);
        } else if (file.type.startsWith('video/')) {
          // Video preview
          previewImage.innerHTML = '';
          const video = document.createElement('video');
          video.className = 'w-full h-48 md:h-64 object-cover rounded-xl';
          video.src = URL.createObjectURL(file);
          video.muted = true;
          video.controls = true;
          previewImage.appendChild(video);
        }
      }
    } else {
      // Default placeholder
      previewImage.innerHTML = `
        <div class="w-full h-48 md:h-64 bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center rounded-xl">
          <i class="fas fa-image text-4xl text-primary-300"></i>
        </div>
      `;
    }
  }

  /**
   * Save post as draft
   */
  function saveDraft() {
    alert('Draft saving functionality would be implemented in a real app');
    // In a real app, you would save the draft to local storage or the server
  }

  /**
   * Publish the post
   */
  async function publishPost() {
    try {
      // Check if user is logged in
      if (!currentUser) {
        alert('You must be logged in to publish a post');
        return;
      }

      // Get post content
      const content = postContentTextarea.value.trim();

      // Validate content
      if (!content && selectedFiles.length === 0) {
        alert('Please enter some content or add media to your post');
        return;
      }

      // Show loading state
      const publishBtn = this;
      const originalText = publishBtn.innerHTML;
      publishBtn.disabled = true;
      publishBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Publishing...';

      // Upload media files if any
      let mediaUrls = [];

      if (selectedFiles.length > 0) {
        // Show progress message
        publishBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Uploading media (0/${selectedFiles.length})...`;

        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          try {
            // Update progress message
            publishBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Uploading media (${i+1}/${selectedFiles.length})...`;

            // Use FileUploadService to upload the file
            if (window.FileUploadService) {
              const mediaUrl = await window.FileUploadService.saveFile(file, 'posts');

              if (mediaUrl) {
                mediaUrls.push({
                  type: file.type.startsWith('image/') ? 'image' : 'video',
                  url: mediaUrl
                });
              }
            }
          } catch (error) {
            console.error('Error uploading file:', error);
            alert(`Failed to upload file: ${file.name}. ${error.message || 'Unknown error'}`);
          }
        }

        // Update button text for post creation
        publishBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Creating post...`;
      }

      // Create post data
      const postData = {
        userId: currentUser.id,
        content: content,
        media: mediaUrls,
        privacy: privacySelect.value,
        settings: {
          allowComments: postSettings.allowComments,
          showLikeCount: postSettings.showLikeCount
        }
      };

      // Create post using PostService
      if (window.PostService) {
        const newPost = await window.PostService.createPost(postData);

        if (newPost) {
          // Show success message
          alert('Post published successfully!');

          // Redirect to home page
          window.location.href = '/';
        } else {
          alert('Failed to publish post. Please try again.');

          // Reset button state
          publishBtn.disabled = false;
          publishBtn.innerHTML = originalText;
        }
      } else {
        alert('Post service not available');

        // Reset button state
        publishBtn.disabled = false;
        publishBtn.innerHTML = originalText;
      }
    } catch (error) {
      console.error('Error publishing post:', error);
      alert('An error occurred while publishing your post');

      // Reset button state
      const publishBtn = this;
      publishBtn.disabled = false;
      publishBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> Publish';
    }
  }
});
