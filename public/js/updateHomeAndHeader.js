/**
 * Update home page and top header with user data from localStorage
 */

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  
  if (currentUser) {
    // Update home page
    updateHomePage(currentUser);
    
    // Update top header
    updateTopHeader(currentUser);
  }
});

/**
 * Update home page with user information
 * @param {Object} user - The logged-in user object
 */
function updateHomePage(user) {
  // Update user stats card
  updateUserStatsCard(user);
  
  // Update create post section
  updateCreatePostSection(user);
  
  // Update posts feed
  updatePostsFeed(user);
}

/**
 * Update user stats card in the left sidebar
 * @param {Object} user - The logged-in user object
 */
function updateUserStatsCard(user) {
  // User stats card elements
  const userStatsCard = document.querySelector('.card .flex.items-center.space-x-3.mb-5');
  
  if (userStatsCard) {
    const userAvatar = userStatsCard.querySelector('img');
    const userName = userStatsCard.querySelector('h3.font-semibold');
    const userUsername = userStatsCard.querySelector('p.text-dark-500');
    
    // Update user avatar
    if (userAvatar && user.avatar) {
      userAvatar.src = user.avatar;
      userAvatar.alt = user.name;
    }
    
    // Update user name
    if (userName) {
      userName.textContent = user.name;
    }
    
    // Update username
    if (userUsername) {
      userUsername.textContent = `@${user.username}`;
    }
    
    // Update stats (followers, following)
    const statsContainer = userStatsCard.parentElement.querySelector('.grid.grid-cols-3');
    
    if (statsContainer) {
      const statsItems = statsContainer.querySelectorAll('.bg-dark-50');
      
      // Posts count (we don't have this data, so we'll leave it as is)
      
      // Followers count
      if (statsItems[1] && user.followers) {
        const followersCount = statsItems[1].querySelector('.font-bold');
        if (followersCount) {
          const count = user.followers.length;
          followersCount.textContent = formatNumber(count);
        }
      }
      
      // Following count
      if (statsItems[2] && user.following) {
        const followingCount = statsItems[2].querySelector('.font-bold');
        if (followingCount) {
          const count = user.following.length;
          followingCount.textContent = formatNumber(count);
        }
      }
    }
  }
}

/**
 * Update create post section
 * @param {Object} user - The logged-in user object
 */
function updateCreatePostSection(user) {
  // Create post section elements
  const createPostSection = document.querySelector('.bg-white.rounded-2xl.shadow-sm.mb-8');
  
  if (createPostSection) {
    const userAvatar = createPostSection.querySelector('img');
    const createPostPlaceholder = createPostSection.querySelector('a.block.w-full.bg-dark-50');
    
    // Update user avatar
    if (userAvatar && user.avatar) {
      userAvatar.src = user.avatar;
      userAvatar.alt = user.name;
    }
    
    // Update create post placeholder
    if (createPostPlaceholder) {
      createPostPlaceholder.textContent = `What's on your mind, ${user.name.split(' ')[0]}?`;
    }
  }
}

/**
 * Update posts feed with user data
 * @param {Object} user - The logged-in user object
 */
function updatePostsFeed(user) {
  // Comment input sections
  const commentInputs = document.querySelectorAll('.flex.space-x-3 img[alt="Profile"]');
  
  // Update comment input avatars
  commentInputs.forEach(avatar => {
    if (user.avatar) {
      avatar.src = user.avatar;
      avatar.alt = user.name;
    }
  });
  
  // Add event listeners to like, comment, and share buttons
  const likeButtons = document.querySelectorAll('button:has(i.fas.fa-heart)');
  const commentButtons = document.querySelectorAll('button:has(i.fas.fa-comment)');
  const shareButtons = document.querySelectorAll('button:has(i.fas.fa-share)');
  
  // Add event listeners to like buttons
  likeButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Toggle like state
      const icon = button.querySelector('i.fas.fa-heart');
      if (icon) {
        if (icon.classList.contains('text-dark-500')) {
          icon.classList.remove('text-dark-500');
          icon.classList.add('text-red-500');
        } else {
          icon.classList.remove('text-red-500');
          icon.classList.add('text-dark-500');
        }
      }
    });
  });
  
  // Add event listeners to comment buttons
  commentButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Find the closest comment input
      const postContainer = button.closest('.bg-white.rounded-2xl');
      if (postContainer) {
        const commentInput = postContainer.querySelector('input[placeholder="Write a comment..."]');
        if (commentInput) {
          commentInput.focus();
        }
      }
    });
  });
}

/**
 * Update top header with user information
 * @param {Object} user - The logged-in user object
 */
function updateTopHeader(user) {
  // Update notification badge
  updateNotificationBadge(user);
  
  // Add logout functionality
  addLogoutFunctionality();
}

/**
 * Update notification badge in top header
 * @param {Object} user - The logged-in user object
 */
function updateNotificationBadge(user) {
  // Notification badge
  const notificationBadge = document.querySelector('.notification-badge');
  
  // Update notification count if available
  if (notificationBadge && user.notifications) {
    if (user.notifications > 0) {
      notificationBadge.textContent = user.notifications > 99 ? '99+' : user.notifications;
      notificationBadge.classList.remove('hidden');
    } else {
      notificationBadge.classList.add('hidden');
    }
  }
}

/**
 * Add logout functionality to logout links
 */
function addLogoutFunctionality() {
  // Logout links
  const logoutLinks = document.querySelectorAll('a[href="/logout"]');
  
  // Add event listeners to logout links
  logoutLinks.forEach(link => {
    link.addEventListener('click', function(event) {
      event.preventDefault();
      
      // Clear localStorage
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
      
      // Redirect to login page
      window.location.href = '/auth/login';
    });
  });
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
