/**
 * Update sidebar with logged-in user information
 */

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  if (currentUser) {
    updateSidebarWithUserInfo(currentUser);
    setupLogoutButton();
  } else {
    // Redirect to login page if not logged in and on a protected page
    const currentPath = window.location.pathname;
    const protectedPaths = ['/profile', '/messages', '/notifications', '/create'];

    if (protectedPaths.includes(currentPath)) {
      window.location.href = '/auth/login';
    }
  }
});

/**
 * Update sidebar elements with user information
 * @param {Object} user - The logged-in user object
 */
function updateSidebarWithUserInfo(user) {
  // Desktop sidebar user profile
  const desktopProfileInitials = document.querySelector('#desktopSidebar .min-w-\\[48px\\].w-12.h-12.rounded-full.bg-primary-500');
  const desktopProfileName = document.querySelector('#desktopSidebar .sidebar-text p.font-medium');
  const desktopProfileUsername = document.querySelector('#desktopSidebar .sidebar-text p.text-dark-500');
  const desktopProfileTooltip = document.querySelector('#desktopSidebar .tooltip:last-of-type');

  // Mobile bottom navigation profile image
  const mobileNavProfileImg = document.querySelector('.md\\:hidden.fixed.bottom-0 img');

  // Mobile sidebar user profile
  const mobileSidebarImg = document.querySelector('#mobileSidebar img');
  const mobileSidebarName = document.querySelector('#mobileSidebar h3.font-semibold');
  const mobileSidebarUsername = document.querySelector('#mobileSidebar p.text-dark-500');

  // Update desktop sidebar
  if (desktopProfileInitials) {
    // If user has an avatar, replace initials with image
    if (user.avatar) {
      const parent = desktopProfileInitials.parentNode;

      // Create new image element
      const img = document.createElement('img');
      img.src = user.avatar;
      img.alt = user.name;
      img.className = 'min-w-[48px] w-12 h-12 rounded-full border-2 border-primary-200';

      // Replace initials with image
      parent.replaceChild(img, desktopProfileInitials);
    } else {
      // If no avatar, update initials
      const initials = getInitials(user.name);
      desktopProfileInitials.textContent = initials;
    }
  }

  // Update desktop sidebar name and username
  if (desktopProfileName) {
    desktopProfileName.textContent = user.name;
  }

  if (desktopProfileUsername) {
    desktopProfileUsername.textContent = `@${user.username}`;
  }

  if (desktopProfileTooltip) {
    desktopProfileTooltip.textContent = `@${user.username}`;
  }

  // Update mobile navigation profile image
  if (mobileNavProfileImg && user.avatar) {
    mobileNavProfileImg.src = user.avatar;
    mobileNavProfileImg.alt = user.name;
  }

  // Update mobile sidebar
  if (mobileSidebarImg && user.avatar) {
    mobileSidebarImg.src = user.avatar;
    mobileSidebarImg.alt = user.name;
  }

  if (mobileSidebarName) {
    mobileSidebarName.textContent = user.name;
  }

  if (mobileSidebarUsername) {
    mobileSidebarUsername.textContent = `@${user.username}`;
  }

  // Update notification count if available
  updateNotificationCount(user);
}

/**
 * Get initials from name
 * @param {string} name - User's full name
 * @returns {string} - Initials (up to 2 characters)
 */
function getInitials(name) {
  if (!name) return '';

  const nameParts = name.split(' ');
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }

  return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Update notification count in sidebar
 * @param {Object} user - The logged-in user object
 */
function updateNotificationCount(user) {
  // Desktop notification badge
  const desktopNotificationBadge = document.querySelector('#desktopSidebar .fas.fa-bell + span');

  // Mobile notification badge
  const mobileNotificationBadge = document.querySelector('.md\\:hidden.fixed.bottom-0 .fas.fa-message + span');

  // Update notification count if available
  if (user.notifications && desktopNotificationBadge) {
    if (user.notifications > 0) {
      desktopNotificationBadge.textContent = user.notifications > 99 ? '99+' : user.notifications;
      desktopNotificationBadge.classList.remove('hidden');
    } else {
      desktopNotificationBadge.classList.add('hidden');
    }
  }

  // Update mobile notification count
  if (user.messages && mobileNotificationBadge) {
    if (user.messages > 0) {
      mobileNotificationBadge.textContent = user.messages > 99 ? '99+' : user.messages;
      mobileNotificationBadge.classList.remove('hidden');
    } else {
      mobileNotificationBadge.classList.add('hidden');
    }
  }
}

/**
 * Setup logout button functionality
 */
function setupLogoutButton() {
  // Mobile sidebar logout button
  const logoutButton = document.querySelector('#mobileSidebar a[href="/logout"]');

  if (logoutButton) {
    logoutButton.addEventListener('click', function(event) {
      event.preventDefault();
      logout();
    });
  }

  // Add logout button to desktop sidebar if it doesn't exist
  const desktopSidebar = document.querySelector('#desktopSidebar .flex-1');
  const desktopLogoutButton = document.querySelector('#desktopLogoutButton');

  if (desktopSidebar && !desktopLogoutButton) {
    // Create logout button
    const logoutLink = document.createElement('a');
    logoutLink.href = '#';
    logoutLink.id = 'desktopLogoutButton';
    logoutLink.className = 'nav-link group relative w-full flex items-center px-4 py-2';
    logoutLink.innerHTML = `
      <div class="min-w-[48px] w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-500 group-hover:bg-primary-200 group-hover:text-primary-600 transition-all">
        <i class="fas fa-sign-out-alt text-xl"></i>
      </div>
      <div class="absolute left-0 h-full w-1 bg-primary-500 rounded-r-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <span class="sidebar-text ml-4 font-medium text-dark-800 opacity-0 w-0 overflow-hidden transition-all duration-300">Logout</span>
      <div class="tooltip absolute left-20 bg-dark-800 text-white text-sm py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">Logout</div>
    `;

    // Add event listener
    logoutLink.addEventListener('click', function(event) {
      event.preventDefault();
      logout();
    });

    // Insert before user profile
    const userProfile = document.querySelector('#desktopSidebar .mt-auto');
    if (userProfile && userProfile.parentNode) {
      userProfile.parentNode.insertBefore(logoutLink, userProfile);
    } else {
      // If user profile not found, append to sidebar
      desktopSidebar.appendChild(logoutLink);
    }
  }
}

/**
 * Logout user
 */
function logout() {
  // Clear local storage
  localStorage.removeItem('currentUser');
  localStorage.removeItem('authToken');

  // Redirect to login page
  window.location.href = '/auth/login';
}
