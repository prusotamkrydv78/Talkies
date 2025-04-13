/**
 * Profile Page - Dynamic data loading
 * This file handles loading user data and content for the profile page
 */

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  if (currentUser) {
    // Get username from URL
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username') || currentUser.username;

    // Load profile data
    loadProfileData(username, currentUser);
  } else {
    // Redirect to login if not logged in
    window.location.href = '/auth/login';
  }
});

/**
 * Load profile data for a user
 * @param {string} username - The username to load profile for
 * @param {Object} currentUser - The logged-in user
 */
async function loadProfileData(username, currentUser) {
  try {
    // Fetch user data
    const response = await fetch(`http://localhost:3001/users?username=${username}`);
    const users = await response.json();

    if (users.length === 0) {
      // User not found
      showError('User not found');
      return;
    }

    const profileUser = users[0];

    // Update profile header
    updateProfileHeader(profileUser, currentUser);

    // Update stats
    updateProfileStats(profileUser);

    // Always load the current user's posts, regardless of which profile we're viewing
    loadUserPosts(currentUser);

    // Load user photos
    loadUserPhotos(profileUser.id);
  } catch (error) {
    console.error('Error loading profile data:', error);
    showError('Failed to load profile data');
  }
}

/**
 * Update profile header with user data
 * @param {Object} user - The profile user
 * @param {Object} currentUser - The logged-in user
 */
function updateProfileHeader(user, currentUser) {
  // Update profile picture
  const profilePicture = document.querySelector('.profile-picture');
  const profileInitials = document.querySelector('.profile-initials');

  if (profilePicture && user.avatar) {
    profilePicture.src = user.avatar;
    profilePicture.alt = user.name;
    profilePicture.classList.remove('hidden');

    if (profileInitials) {
      profileInitials.classList.add('hidden');
    }
  } else if (profileInitials) {
    // Show initials if no avatar
    const initials = user.name.split(' ').map(n => n[0]).join('');
    profileInitials.textContent = initials;
    profileInitials.classList.remove('hidden');

    if (profilePicture) {
      profilePicture.classList.add('hidden');
    }
  }

  // Update name and username
  const nameElement = document.querySelector('.profile-name');
  const usernameElement = document.querySelector('.profile-username');

  if (nameElement) {
    nameElement.textContent = user.name;
  }

  if (usernameElement) {
    usernameElement.textContent = `@${user.username}`;
  }

  // Update bio
  const bioElement = document.querySelector('.profile-bio');
  if (bioElement && user.bio) {
    bioElement.textContent = user.bio;
  }

  // Update location, website, join date
  const locationElement = document.querySelector('.profile-location span');
  const websiteElement = document.querySelector('.profile-website a');
  const joinDateElement = document.querySelector('.profile-join-date span');

  if (locationElement && user.location) {
    locationElement.textContent = user.location;
    locationElement.parentElement.classList.remove('hidden');
  } else if (locationElement) {
    locationElement.parentElement.classList.add('hidden');
  }

  if (websiteElement && user.website) {
    websiteElement.textContent = user.website;
    websiteElement.href = user.website.startsWith('http') ? user.website : `https://${user.website}`;
    websiteElement.parentElement.classList.remove('hidden');
  } else if (websiteElement) {
    websiteElement.parentElement.classList.add('hidden');
  }

  if (joinDateElement && user.createdAt) {
    const joinDate = new Date(user.createdAt);
    const month = joinDate.toLocaleString('default', { month: 'long' });
    const year = joinDate.getFullYear();
    joinDateElement.textContent = `Joined ${month} ${year}`;
  }

  // Update follow button
  updateFollowButton(user, currentUser);
}

/**
 * Update follow button based on relationship
 * @param {Object} user - The profile user
 * @param {Object} currentUser - The logged-in user
 */
function updateFollowButton(user, currentUser) {
  const followButton = document.querySelector('.follow-button');

  if (!followButton) return;

  // Check if viewing own profile
  if (user.id === currentUser.id) {
    // Replace follow button with edit profile button
    followButton.innerHTML = '<i class="fas fa-edit mr-2"></i>Edit Profile';
    followButton.classList.remove('bg-primary-500', 'hover:bg-primary-600');
    followButton.classList.add('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
    return;
  }

  // Check if already following
  const isFollowing = currentUser.following && currentUser.following.includes(user.id);

  if (isFollowing) {
    followButton.innerHTML = '<i class="fas fa-user-check mr-2"></i>Following';
    followButton.classList.remove('bg-primary-500', 'hover:bg-primary-600');
    followButton.classList.add('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');

    // Add hover state to show "Unfollow"
    followButton.addEventListener('mouseenter', function() {
      this.innerHTML = '<i class="fas fa-user-times mr-2"></i>Unfollow';
      this.classList.add('bg-red-100', 'text-red-600');
    });

    followButton.addEventListener('mouseleave', function() {
      this.innerHTML = '<i class="fas fa-user-check mr-2"></i>Following';
      this.classList.remove('bg-red-100', 'text-red-600');
    });
  } else {
    followButton.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Follow';
    followButton.classList.add('bg-primary-500', 'hover:bg-primary-600');
    followButton.classList.remove('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');

    // Remove hover events if they exist
    followButton.removeEventListener('mouseenter', null);
    followButton.removeEventListener('mouseleave', null);
  }

  // Add click event
  followButton.addEventListener('click', () => toggleFollow(user.id, currentUser.id, isFollowing));
}

/**
 * Toggle follow status
 * @param {string} targetId - The user ID to follow/unfollow
 * @param {string} userId - The current user ID
 * @param {boolean} isFollowing - Current follow status
 */
async function toggleFollow(targetId, userId, isFollowing) {
  try {
    // Get current user
    const userResponse = await fetch(`http://localhost:3001/users/${userId}`);
    const user = await userResponse.json();

    // Get target user
    const targetResponse = await fetch(`http://localhost:3001/users/${targetId}`);
    const targetUser = await targetResponse.json();

    if (isFollowing) {
      // Unfollow
      const following = user.following.filter(id => id !== targetId);
      const followers = targetUser.followers.filter(id => id !== userId);

      await fetch(`http://localhost:3001/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ following })
      });

      await fetch(`http://localhost:3001/users/${targetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ followers })
      });
    } else {
      // Follow
      const following = [...(user.following || []), targetId];
      const followers = [...(targetUser.followers || []), userId];

      await fetch(`http://localhost:3001/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ following })
      });

      await fetch(`http://localhost:3001/users/${targetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ followers })
      });
    }

    // Update localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.id === userId) {
      if (isFollowing) {
        currentUser.following = currentUser.following.filter(id => id !== targetId);
      } else {
        currentUser.following = [...(currentUser.following || []), targetId];
      }
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }

    // Reload profile data
    loadProfileData(targetUser.username, currentUser);
  } catch (error) {
    console.error('Error toggling follow:', error);
  }
}

/**
 * Update profile stats
 * @param {Object} user - The profile user
 */
async function updateProfileStats(user) {
  try {
    // Get posts count
    const postsResponse = await fetch(`http://localhost:3001/posts?userId=${user.id}`);
    const posts = await postsResponse.json();

    // Update stats
    const postsCountElement = document.querySelector('.posts-count');
    const followersCountElement = document.querySelector('.followers-count');
    const followingCountElement = document.querySelector('.following-count');

    if (postsCountElement) {
      postsCountElement.textContent = formatNumber(posts.length);
    }

    if (followersCountElement && user.followers) {
      followersCountElement.textContent = formatNumber(user.followers.length);
    }

    if (followingCountElement && user.following) {
      followingCountElement.textContent = formatNumber(user.following.length);
    }
  } catch (error) {
    console.error('Error updating profile stats:', error);
  }
}

/**
 * Load current user's posts for the profile page
 * @param {Object} currentUser - The logged-in user
 */
async function loadUserPosts(currentUser) {
  try {
    // Get posts container
    const postsContainer = document.querySelector('.posts-container');

    if (!postsContainer) return;

    // Clear container
    postsContainer.innerHTML = '';

    // Update the section title to show "Your Posts"
    const sectionTitle = document.querySelector('.mt-6 .flex.items-center h3');
    if (sectionTitle) {
      sectionTitle.textContent = 'Your Posts';
    }

    // FINAL FIX: Directly hardcode the filtering to only show posts by the current user
    // This approach bypasses any API or type conversion issues

    // Fetch ALL posts
    const allPostsResponse = await fetch(`http://localhost:3001/posts?_sort=createdAt&_order=desc`);
    const allPosts = await allPostsResponse.json();

    // Get the current user ID as a string for comparison
    const currentUserId = currentUser.id.toString();

    // Filter posts to only include those by the current user
    // This is a strict equality check that ensures we only get the current user's posts
    const posts = allPosts.filter(post => {
      return post.userId && post.userId.toString() === currentUserId;
    });
    console.log(posts)

    if (posts.length === 0) {
      // No posts - always show the current user's message since we're only showing their posts
      postsContainer.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm p-6 text-center">
          <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <i class="fas fa-file-alt text-gray-400 text-2xl"></i>
          </div>
          <h3 class="font-semibold text-lg mb-2">No Posts Yet</h3>
          <p class="text-gray-500">You haven't posted anything yet.</p>
          <button id="create-first-post" class="mt-4 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors">
            <i class="fas fa-plus mr-2"></i>Create Your First Post
          </button>
        </div>
      `;

      // Add event listener to the create post button
      setTimeout(() => {
        const createPostButton = document.getElementById('create-first-post');
        if (createPostButton) {
          createPostButton.addEventListener('click', () => {
            window.location.href = '/create';
          });
        }
      }, 100);
      return;
    }

    // Process each post
    for (const post of posts) {
      // Create post element
      const postElement = document.createElement('div');
      postElement.className = 'bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow mb-6';

      // Calculate time ago
      const timeAgo = getTimeAgo(post.createdAt);

      // Check if current user has liked the post
      const isLiked = post.likes && post.likes.includes(currentUser.id);

      // Get post media
      let mediaHTML = '';
      if (post.media && post.media.length > 0) {
        if (post.media.length === 1) {
          // Single image - with reduced height and object-cover
          mediaHTML = `
            <div class="rounded-xl overflow-hidden mb-4 max-h-80">
              <img src="${post.media[0].url}" alt="Post image" class="w-full h-64 object-cover">
            </div>
          `;
        } else {
          // Multiple images - with reduced height
          mediaHTML = `
            <div class="grid grid-cols-2 gap-2 rounded-xl overflow-hidden mb-4">
          `;

          const displayMedia = post.media.slice(0, 4);
          const remainingCount = post.media.length - 4;

          displayMedia.forEach((media, index) => {
            if (index === 3 && remainingCount > 0) {
              // Last visible image with overlay
              mediaHTML += `
                <div class="relative">
                  <img src="${media.url}" alt="Post image" class="w-full h-32 object-cover">
                  <div class="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold">
                    +${remainingCount} more
                  </div>
                </div>
              `;
            } else {
              // Regular image - reduced height
              mediaHTML += `
                <img src="${media.url}" alt="Post image" class="w-full h-32 object-cover">
              `;
            }
          });

          mediaHTML += `</div>`;
        }
      }

      // Get user data for the post
      const userResponse = await fetch(`http://localhost:3001/users/${post.userId}`);
      const postUser = await userResponse.json();

      // Post HTML
      postElement.innerHTML = `
        <div class="flex justify-between items-start mb-4">
          <div class="flex items-center space-x-3">
            <img src="${postUser.avatar}" alt="${postUser.name}" class="w-10 h-10 rounded-full">
            <div>
              <h4 class="font-semibold">${postUser.name}</h4>
              <p class="text-gray-500 text-sm">${timeAgo}</p>
            </div>
          </div>

          <button class="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors">
            <i class="fas fa-ellipsis-h"></i>
          </button>
        </div>

        <div class="mb-4">
          <p class="mb-3">${formatPostContent(post.content)}</p>
          ${mediaHTML}
        </div>

        <div class="flex justify-between items-center mb-4 text-sm">
          <div class="flex items-center space-x-2">
            <div class="flex -space-x-1">
              <div class="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white shadow-sm">
                <i class="fas fa-thumbs-up text-xs"></i>
              </div>
            </div>
            <span class="text-gray-500">${formatNumber(post.likes ? post.likes.length : 0)} likes</span>
          </div>

          <div class="text-gray-500 flex items-center space-x-3">
            <div class="flex items-center">
              <i class="far fa-comment text-gray-400 mr-1.5"></i>
              <span>${formatNumber(post.commentsCount || 0)}</span>
            </div>
            <div class="flex items-center">
              <i class="fas fa-share text-gray-400 mr-1.5"></i>
              <span>${formatNumber(post.sharesCount || 0)}</span>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 pt-3 flex justify-between">
          <button class="like-button flex items-center ${isLiked ? 'text-primary-500' : 'text-gray-500'} hover:text-primary-500 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors" data-post-id="${post.id}">
            <i class="fas fa-thumbs-up mr-2"></i>
            <span>Like</span>
          </button>

          <button class="flex items-center text-gray-500 hover:text-primary-500 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <i class="far fa-comment mr-2"></i>
            <span>Comment</span>
          </button>

          <button class="flex items-center text-gray-500 hover:text-primary-500 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <i class="fas fa-share mr-2"></i>
            <span>Share</span>
          </button>
        </div>
      `;

      // Add event listeners
      const likeButton = postElement.querySelector('.like-button');
      if (likeButton) {
        likeButton.addEventListener('click', () => toggleLikePost(post.id, currentUser.id, likeButton));
      }

      // Add to container
      postsContainer.appendChild(postElement);
    }
  } catch (error) {
    console.error('Error loading user posts:', error);
  }
}

/**
 * Load user photos
 * @param {string} userId - The user ID
 */
async function loadUserPhotos(userId) {
  try {
    // Get photos container
    const photosContainer = document.querySelector('.photos-container');

    if (!photosContainer) return;

    // Clear container
    photosContainer.innerHTML = '';

    // Fetch posts with media
    const response = await fetch(`http://localhost:3001/posts?userId=${userId}&_sort=createdAt&_order=desc`);
    const posts = await response.json();

    // Extract all media
    const allMedia = [];
    posts.forEach(post => {
      if (post.media && post.media.length > 0) {
        post.media.forEach(media => {
          allMedia.push({
            ...media,
            postId: post.id
          });
        });
      }
    });

    if (allMedia.length === 0) {
      // No photos
      photosContainer.innerHTML = `
        <div class="text-center py-8">
          <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <i class="fas fa-images text-gray-400 text-2xl"></i>
          </div>
          <h3 class="font-semibold text-lg mb-2">No Photos Yet</h3>
          <p class="text-gray-500">This user hasn't posted any photos yet.</p>
        </div>
      `;
      return;
    }

    // Display up to 8 photos
    const displayMedia = allMedia.slice(0, 8);

    // Create photo grid
    displayMedia.forEach(media => {
      const photoElement = document.createElement('div');
      photoElement.className = 'relative group rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow';
      photoElement.dataset.postId = media.postId;

      photoElement.innerHTML = `
        <img src="${media.url}" alt="Photo" class="w-full h-48 object-cover">
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div class="text-white flex space-x-3">
            <button class="hover:text-primary-400 bg-black/30 p-2 rounded-full">
              <i class="fas fa-heart"></i>
            </button>
            <button class="hover:text-primary-400 bg-black/30 p-2 rounded-full">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </div>
      `;

      // Add to container
      photosContainer.appendChild(photoElement);
    });
  } catch (error) {
    console.error('Error loading user photos:', error);
  }
}

/**
 * Toggle like on a post
 * @param {string} postId - The post ID
 * @param {string} userId - The current user ID
 * @param {HTMLElement} button - The like button element
 */
async function toggleLikePost(postId, userId, button) {
  try {
    // Get current post
    const response = await fetch(`http://localhost:3001/posts/${postId}`);
    const post = await response.json();

    // Check if already liked
    const isLiked = post.likes && post.likes.includes(userId);

    // Update likes array
    let likes = post.likes || [];

    if (isLiked) {
      // Unlike
      likes = likes.filter(id => id !== userId);
    } else {
      // Like
      likes.push(userId);
    }

    // Update post
    await fetch(`http://localhost:3001/posts/${postId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ likes })
    });

    // Update UI
    const postElement = button.closest('.bg-white');

    // Update like button
    if (isLiked) {
      button.classList.remove('text-primary-500');
      button.classList.add('text-gray-500');
    } else {
      button.classList.remove('text-gray-500');
      button.classList.add('text-primary-500');
    }

    // Update like count
    const likeCountElement = postElement.querySelector('.flex.items-center.space-x-2 span');
    if (likeCountElement) {
      likeCountElement.textContent = `${formatNumber(likes.length)} likes`;
    }
  } catch (error) {
    console.error('Error toggling like:', error);
  }
}

/**
 * Format post content with hashtags and mentions
 * @param {string} content - The post content
 * @returns {string} - Formatted content with clickable hashtags and mentions
 */
function formatPostContent(content) {
  if (!content) return '';

  // Format hashtags
  let formattedContent = content.replace(/#(\w+)/g, '<a href="/hashtag/$1" class="text-primary-500 hover:underline">#$1</a>');

  // Format mentions
  formattedContent = formattedContent.replace(/@(\w+)/g, '<a href="/profile?username=$1" class="text-primary-500 hover:underline">@$1</a>');

  return formattedContent;
}

/**
 * Get time ago string from date
 * @param {string} dateString - ISO date string
 * @returns {string} - Time ago string (e.g., "2h ago")
 */
function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return interval === 1 ? '1y ago' : `${interval}y ago`;
  }

  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval === 1 ? '1mo ago' : `${interval}mo ago`;
  }

  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval === 1 ? '1d ago' : `${interval}d ago`;
  }

  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval === 1 ? '1h ago' : `${interval}h ago`;
  }

  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval === 1 ? '1m ago' : `${interval}m ago`;
  }

  return 'Just now';
}

/**
 * Format number for display (e.g., 1200 -> 1.2K)
 * @param {number} num - The number to format
 * @returns {string} - Formatted number
 */
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

/**
 * Show error message
 * @param {string} message - The error message
 */
function showError(message) {
  const container = document.querySelector('.max-w-5xl');

  if (container) {
    container.innerHTML = `
      <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="fas fa-exclamation-circle text-red-500 mt-0.5"></i>
          </div>
          <div class="ml-3">
            <p class="font-medium">${message}</p>
          </div>
        </div>
      </div>
    `;
  }
}
