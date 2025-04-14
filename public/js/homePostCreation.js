/**
 * Home Page Post Creation
 * Handles post creation functionality directly from the home page
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const postCreationModal = document.getElementById('postCreationModal');
  const openPostModalBtn = document.getElementById('openPostModal');
  const closePostModalBtn = document.getElementById('closePostModal');
  const openPhotoUploadBtn = document.getElementById('openPhotoUpload');
  const openVideoUploadBtn = document.getElementById('openVideoUpload');
  const openFeelingSelectorBtn = document.getElementById('openFeelingSelector');
  const publishPostBtn = document.getElementById('publishPost');
  const postContentTextarea = document.getElementById('postContent');
  const postPrivacySelect = document.getElementById('postPrivacy');
  const uploadArea = document.getElementById('uploadArea');
  const browseFilesBtn = document.getElementById('browseFiles');
  const mediaPreview = document.getElementById('mediaPreview');
  const previewGrid = document.getElementById('previewGrid');
  const addPhotoVideoBtn = document.getElementById('addPhotoVideo');
  const userAvatarElement = document.getElementById('userAvatar');
  const userNameElement = document.getElementById('userName');

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
  }

  /**
   * Get current user from AuthService
   */
  function getCurrentUser() {
    if (window.AuthService) {
      currentUser = window.AuthService.getCurrentUser();

      if (currentUser) {
        // Update user info in the modal
        updateUserInfo();
      }
    }
  }

  /**
   * Update user info in the modal
   */
  function updateUserInfo() {
    if (!currentUser) return;

    // Update avatar
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

    // Update name
    userNameElement.textContent = currentUser.name;
  }

  /**
   * Add event listeners
   */
  function addEventListeners() {
    // Open modal
    if (openPostModalBtn) {
      openPostModalBtn.addEventListener('click', openModal);
    }

    // Open modal with photo upload
    if (openPhotoUploadBtn) {
      openPhotoUploadBtn.addEventListener('click', () => {
        openModal();
        setTimeout(() => {
          fileInput.accept = 'image/*';
          fileInput.click();
        }, 300);
      });
    }

    // Open modal with video upload
    if (openVideoUploadBtn) {
      openVideoUploadBtn.addEventListener('click', () => {
        openModal();
        setTimeout(() => {
          fileInput.accept = 'video/*';
          fileInput.click();
        }, 300);
      });
    }

    // Open modal with feeling selector
    if (openFeelingSelectorBtn) {
      openFeelingSelectorBtn.addEventListener('click', () => {
        openModal();
        // In a real app, you would show a feeling selector here
        alert('Feeling selector would be implemented in a real app');
      });
    }

    // Close modal
    if (closePostModalBtn) {
      closePostModalBtn.addEventListener('click', closeModal);
    }

    // Close modal when clicking outside
    if (postCreationModal) {
      postCreationModal.addEventListener('click', (e) => {
        if (e.target === postCreationModal) {
          closeModal();
        }
      });
    }

    // Publish post
    if (publishPostBtn) {
      publishPostBtn.addEventListener('click', publishPost);
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
      browseFilesBtn.addEventListener('click', () => {
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
  }

  /**
   * Open the post creation modal
   */
  function openModal() {
    if (postCreationModal) {
      postCreationModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden'; // Prevent scrolling

      // Focus on textarea
      if (postContentTextarea) {
        setTimeout(() => {
          postContentTextarea.focus();
        }, 100);
      }
    }
  }

  /**
   * Close the post creation modal
   */
  function closeModal() {
    if (postCreationModal) {
      postCreationModal.classList.add('hidden');
      document.body.style.overflow = ''; // Restore scrolling

      // Reset form
      resetForm();
    }
  }

  /**
   * Reset the post creation form
   */
  function resetForm() {
    if (postContentTextarea) {
      postContentTextarea.value = '';
    }

    if (postPrivacySelect) {
      postPrivacySelect.value = 'Public';
    }

    // Clear selected files
    selectedFiles = [];

    // Hide media preview
    if (mediaPreview) {
      mediaPreview.classList.add('hidden');
    }

    // Clear preview grid
    if (previewGrid) {
      previewGrid.innerHTML = '';
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

    // Clear preview grid
    if (previewGrid) {
      previewGrid.innerHTML = '';
    }

    // Add preview for each file
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      addFilePreview(file, i);
    }
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
        previewGrid.innerHTML = '';
      }

      // Add preview for each file
      for (let i = 0; i < selectedFiles.length; i++) {
        addFilePreview(selectedFiles[i], i);
      }

      // Hide media preview if no files
      if (selectedFiles.length === 0 && mediaPreview) {
        mediaPreview.classList.add('hidden');
      }
    });

    deleteOverlay.appendChild(deleteButton);
    previewItem.appendChild(deleteOverlay);

    // Add to preview grid
    previewGrid.appendChild(previewItem);
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
      publishPostBtn.disabled = true;
      publishPostBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Publishing...';

      // Upload media files if any
      let mediaUrls = [];

      if (selectedFiles.length > 0) {
        // Show progress message
        publishPostBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Uploading media (0/${selectedFiles.length})...`;

        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          try {
            // Update progress message
            publishPostBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Uploading media (${i+1}/${selectedFiles.length})...`;

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
        publishPostBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Creating post...`;
      }

      // Create post data
      const postData = {
        userId: currentUser.id,
        content: content,
        media: mediaUrls,
        privacy: postPrivacySelect.value
      };

      // Create post using PostService
      if (window.PostService) {
        const newPost = await window.PostService.createPost(postData);

        if (newPost) {
          // Close modal
          closeModal();

          // Show success message
          alert('Post published successfully!');

          // Refresh the feed
          refreshFeed();
        } else {
          alert('Failed to publish post. Please try again.');
        }
      } else {
        alert('Post service not available');
      }
    } catch (error) {
      console.error('Error publishing post:', error);
      alert('An error occurred while publishing your post');
    } finally {
      // Reset button state
      publishPostBtn.disabled = false;
      publishPostBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> Post Now';
    }
  }

  /**
   * Refresh the posts feed
   */
  async function refreshFeed() {
    try {
      // Get posts container
      const postsContainer = document.querySelector('.posts-container');

      if (!postsContainer) return;

      // Get posts
      if (window.PostService) {
        let posts = await window.PostService.getAllPosts();

        // Explicitly sort posts by createdAt timestamp (newest first)
        posts = posts.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB - dateA; // Sort in descending order (newest first)
        });

        console.log('Home page: Sorted posts by timestamp (newest first):', posts);

        if (posts && posts.length > 0) {
          // Clear existing posts (except the heading)
          const heading = postsContainer.querySelector('h3');
          postsContainer.innerHTML = '';

          if (heading) {
            postsContainer.appendChild(heading);
          }

          // Add posts to the container
          for (const post of posts) {
            const postElement = await createPostElement(post);
            postsContainer.appendChild(postElement);
          }

          // Initialize carousels in the posts
          if (window.initCarousels) {
            window.initCarousels();
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing feed:', error);
    }
  }

  /**
   * Create a post element
   * @param {Object} post - The post data
   * @returns {HTMLElement} - The post element
   */
  async function createPostElement(post) {
    try {
      // Create post element
      const postElement = document.createElement('div');
      postElement.className = 'bg-white rounded-2xl shadow-sm overflow-hidden mb-8';
      postElement.setAttribute('data-post-id', post.id);

      // Get user data
      let userData = { name: 'Unknown User', avatar: null };

      if (window.UserService) {
        const user = await window.UserService.getUserById(post.userId);
        if (user) {
          userData = user;
        }
      }

      // Format date
      const postDate = new Date(post.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now - postDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffTime / (1000 * 60));

      let timeAgo;
      if (diffDays > 0) {
        timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffHours > 0) {
        timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffMinutes > 0) {
        timeAgo = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      } else {
        timeAgo = 'Just now';
      }

      // Create post HTML
      let mediaHTML = '';

      if (post.media && post.media.length > 0) {
        // Use the carousel for media display
        if (window.createCarouselFromMedia) {
          mediaHTML = window.createCarouselFromMedia(post.media);
        } else {
          // Fallback if carousel function is not available
          const media = post.media[0];

          if (media.type === 'image') {
            mediaHTML = `
              <div class="mb-4">
                <img src="${media.url}" alt="Post image" class="w-full rounded-xl">
              </div>
            `;
          } else if (media.type === 'video') {
            mediaHTML = `
              <div class="mb-4">
                <video src="${media.url}" controls class="w-full rounded-xl"></video>
              </div>
            `;
          }
        }
      }

      // Set post HTML
      postElement.innerHTML = `
        <div class="p-4">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-full bg-cover bg-center" style="background-image: url('${userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=0D8ABC&color=fff`}')"></div>
              <div>
                <h4 class="font-semibold text-dark-900">${userData.name}</h4>
                <p class="text-dark-500 text-xs">${timeAgo} • <i class="fas fa-${post.privacy === 'Public' ? 'globe-americas' : (post.privacy === 'Friends' ? 'user-friends' : 'lock')}"></i></p>
              </div>
            </div>
            <button class="text-dark-400 hover:text-dark-600 transition-colors">
              <i class="fas fa-ellipsis-h"></i>
            </button>
          </div>

          <div class="mb-4">
            <p class="text-dark-800">${post.content}</p>
          </div>

          ${mediaHTML}

          <div class="flex justify-between items-center text-dark-500 text-sm mt-2">
            <div>
              <span>${post.likes ? post.likes.length : 0} likes</span>
            </div>
            <div>
              <span>${post.commentsCount || 0} comments • ${post.sharesCount || 0} shares</span>
            </div>
          </div>
        </div>

        <div class="border-t border-dark-100 px-4 py-2 flex justify-between">
          <button class="flex-1 flex items-center justify-center text-dark-500 hover:text-primary-500 transition-colors py-2">
            <i class="far fa-thumbs-up mr-2"></i>
            <span>Like</span>
          </button>
          <button class="flex-1 flex items-center justify-center text-dark-500 hover:text-primary-500 transition-colors py-2">
            <i class="far fa-comment mr-2"></i>
            <span>Comment</span>
          </button>
          <button class="flex-1 flex items-center justify-center text-dark-500 hover:text-primary-500 transition-colors py-2">
            <i class="far fa-share-square mr-2"></i>
            <span>Share</span>
          </button>
        </div>
      `;

      return postElement;
    } catch (error) {
      console.error('Error creating post element:', error);

      // Return a simple error element
      const errorElement = document.createElement('div');
      errorElement.className = 'bg-red-50 text-red-500 p-4 rounded-xl mb-4';
      errorElement.textContent = 'Error loading post';

      return errorElement;
    }
  }
});
