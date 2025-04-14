/**
 * Notifications Page
 * Handles loading and displaying notifications for the logged-in user
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const notificationsContainer = document.querySelector('.notifications-container');
  const markAllReadBtn = document.querySelector('#markAllReadBtn');
  const notificationTabs = document.querySelectorAll('.notification-tab');

  // Current filter
  let currentFilter = 'all';

  // Initialize
  init();

  /**
   * Initialize the notifications page
   */
  async function init() {
    // Check if user is logged in
    if (!window.AuthService || !window.AuthService.isLoggedIn()) {
      window.location.href = '/login';
      return;
    }

    // Get current user
    const currentUser = window.AuthService.getCurrentUser();

    // Add event listeners
    addEventListeners();

    // Load notifications
    await loadNotifications(currentUser.id);
  }

  /**
   * Add event listeners
   */
  function addEventListeners() {
    // Mark all as read button
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', handleMarkAllAsRead);
    }

    // Notification tabs
    if (notificationTabs) {
      notificationTabs.forEach(tab => {
        tab.addEventListener('click', function() {
          // Remove active class from all tabs
          notificationTabs.forEach(t => t.classList.remove('active-tab'));

          // Add active class to clicked tab
          this.classList.add('active-tab');

          // Get filter type
          const filterType = this.dataset.filter;

          // Filter notifications
          filterNotifications(filterType);
        });
      });
    }
  }

  /**
   * Load notifications for the user
   * @param {string} userId - The user ID
   */
  async function loadNotifications(userId) {
    try {
      // Show loading state
      if (notificationsContainer) {
        notificationsContainer.innerHTML = '<div class="text-center p-8"><i class="fas fa-spinner fa-spin text-3xl text-primary-500"></i></div>';
      }

      // Check if NotificationService is available
      if (!window.NotificationService) {
        throw new Error('Notification service not available');
      }

      // Get notifications
      const notifications = await window.NotificationService.getNotificationsByUserId(userId);

      // Format notifications
      const formattedNotifications = await Promise.all(
        notifications.map(async notification => {
          return await window.NotificationService.formatNotification(notification);
        })
      );

      // Group notifications by date
      const groupedNotifications = groupNotificationsByDate(formattedNotifications);

      // Render notifications
      renderNotifications(groupedNotifications);

      // Update unread count
      updateUnreadCount(formattedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);

      // Show error message
      if (notificationsContainer) {
        notificationsContainer.innerHTML = `
          <div class="text-center p-8">
            <i class="fas fa-exclamation-circle text-3xl text-red-500 mb-4"></i>
            <p class="text-dark-700">Failed to load notifications. Please try again later.</p>
          </div>
        `;
      }
    }
  }

  /**
   * Group notifications by date
   * @param {Array} notifications - The notifications to group
   * @returns {Object} - Grouped notifications
   */
  function groupNotificationsByDate(notifications) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    notifications.forEach(notification => {
      const notificationDate = new Date(notification.createdAt);

      if (notificationDate >= today) {
        groups.today.push(notification);
      } else if (notificationDate >= yesterday) {
        groups.yesterday.push(notification);
      } else if (notificationDate >= lastWeek) {
        groups.thisWeek.push(notification);
      } else {
        groups.older.push(notification);
      }
    });

    return groups;
  }

  /**
   * Render notifications
   * @param {Object} groupedNotifications - The grouped notifications
   */
  function renderNotifications(groupedNotifications) {
    if (!notificationsContainer) return;

    // Clear container
    notificationsContainer.innerHTML = '';

    // Check if there are any notifications
    const totalNotifications = Object.values(groupedNotifications).reduce((total, group) => total + group.length, 0);

    if (totalNotifications === 0) {
      notificationsContainer.innerHTML = `
        <div class="text-center p-8">
          <i class="fas fa-bell-slash text-3xl text-dark-300 mb-4"></i>
          <p class="text-dark-700">You don't have any notifications yet.</p>
        </div>
      `;
      return;
    }

    // Render each group
    renderNotificationGroup('TODAY', groupedNotifications.today);
    renderNotificationGroup('YESTERDAY', groupedNotifications.yesterday);
    renderNotificationGroup('THIS WEEK', groupedNotifications.thisWeek);
    renderNotificationGroup('OLDER', groupedNotifications.older);

    // Add load more button if there are older notifications
    if (groupedNotifications.older.length > 0) {
      const loadMoreBtn = document.createElement('div');
      loadMoreBtn.className = 'mt-8 mb-10 text-center';
      loadMoreBtn.innerHTML = `
        <button class="btn bg-white border border-dark-100 text-dark-700 hover:bg-dark-50 px-8 py-3 rounded-xl shadow-sm hover:shadow transition-all font-medium">
          <i class="fas fa-spinner mr-2"></i>
          Load More
        </button>
      `;
      notificationsContainer.appendChild(loadMoreBtn);
    }
  }

  /**
   * Render a notification group
   * @param {string} title - The group title
   * @param {Array} notifications - The notifications in the group
   */
  function renderNotificationGroup(title, notifications) {
    if (!notificationsContainer || notifications.length === 0) return;

    // Create group container
    const groupContainer = document.createElement('div');
    groupContainer.className = 'mb-10';

    // Create group header
    const groupHeader = document.createElement('div');
    groupHeader.className = 'flex items-center justify-between mb-4';
    groupHeader.innerHTML = `
      <h2 class="text-sm font-bold text-dark-700 bg-dark-50 px-3 py-1 rounded-lg inline-block">${title}</h2>
      ${title === 'TODAY' ? `<span class="text-xs text-dark-500">${countUnread(notifications)} new notifications</span>` : ''}
    `;

    // Create notifications list
    const notificationsList = document.createElement('div');
    notificationsList.className = 'space-y-3';

    // Add notifications to list
    notifications.forEach(notification => {
      const notificationElement = createNotificationElement(notification);
      notificationsList.appendChild(notificationElement);
    });

    // Add header and list to group container
    groupContainer.appendChild(groupHeader);
    groupContainer.appendChild(notificationsList);

    // Add group to container
    notificationsContainer.appendChild(groupContainer);
  }

  /**
   * Create a notification element
   * @param {Object} notification - The notification data
   * @returns {HTMLElement} - The notification element
   */
  function createNotificationElement(notification) {
    // Create notification container
    const notificationElement = document.createElement('div');
    notificationElement.className = `bg-white rounded-2xl shadow-sm p-5 ${notification.read ? '' : 'border-l-4 border-primary-500'} hover:shadow-md transition-all`;
    notificationElement.dataset.id = notification.id;
    notificationElement.dataset.type = notification.type;

    // Get notification icon
    let iconClass = '';
    let iconBgClass = '';

    switch (notification.type) {
      case 'like':
        iconClass = 'fas fa-heart';
        iconBgClass = 'bg-red-500';
        break;
      case 'comment':
        iconClass = 'fas fa-comment';
        iconBgClass = 'bg-green-500';
        break;
      case 'follow':
        iconClass = 'fas fa-user-plus';
        iconBgClass = 'bg-blue-500';
        break;
      case 'mention':
        iconClass = 'fas fa-at';
        iconBgClass = 'bg-yellow-500';
        break;
      case 'share':
        iconClass = 'fas fa-share-alt';
        iconBgClass = 'bg-purple-500';
        break;
      default:
        iconClass = 'fas fa-bell';
        iconBgClass = 'bg-primary-500';
    }

    // Format date
    const notificationDate = new Date(notification.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - notificationDate);
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

    // Create notification content based on type
    let contentHTML = '';

    switch (notification.type) {
      case 'like':
        contentHTML = `
          <div class="mt-4 bg-dark-50 p-4 rounded-xl">
            <p class="text-dark-700 text-sm">${notification.targetContent || 'Post content not available'}</p>
          </div>
        `;
        break;
      case 'comment':
        contentHTML = `
          <div class="mt-4 bg-dark-50 p-4 rounded-xl">
            <p class="text-dark-700 text-sm">"${notification.commentContent || 'Comment content not available'}"</p>
          </div>
          <div class="mt-4">
            <button class="text-primary-500 hover:text-primary-600 text-sm font-medium flex items-center reply-btn">
              <i class="fas fa-reply mr-2"></i>
              Reply
            </button>
          </div>
        `;
        break;
      case 'follow':
        contentHTML = `
          <div class="mt-4">
            <button class="btn bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm py-2 px-5 rounded-xl shadow-sm hover:shadow-md transition-all follow-back-btn">
              <i class="fas fa-user-plus mr-2"></i>
              Follow Back
            </button>
          </div>
        `;
        break;
      case 'mention':
        contentHTML = `
          <div class="mt-4 bg-dark-50 p-4 rounded-xl">
            <p class="text-dark-700 text-sm">${notification.mentionContent || 'Mention content not available'}</p>
          </div>
          <div class="mt-4">
            <button class="text-primary-500 hover:text-primary-600 text-sm font-medium flex items-center reply-btn">
              <i class="fas fa-reply mr-2"></i>
              Reply
            </button>
          </div>
        `;
        break;
      case 'share':
        contentHTML = `
          <div class="mt-4 bg-dark-50 p-4 rounded-xl">
            <p class="text-dark-700 text-sm">${notification.targetContent || 'Post content not available'}</p>
          </div>
        `;
        break;
    }

    // Set notification HTML
    notificationElement.innerHTML = `
      <div class="flex">
        <div class="relative">
          <img src="${notification.actor?.avatar || 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff'}" alt="${notification.actor?.name || 'User'}" class="avatar h-14 w-14 mr-5 border-2 border-primary-100">
          <div class="absolute -bottom-1 -right-1 ${iconBgClass} text-white rounded-full w-6 h-6 flex items-center justify-center text-xs border-2 border-white shadow-md">
            <i class="${iconClass}"></i>
          </div>
        </div>

        <div class="flex-1">
          <div class="flex justify-between items-start">
            <div>
              <p class="font-medium text-dark-800">
                <span class="font-bold">${notification.actor?.name || 'Unknown User'}</span> ${notification.text || 'sent you a notification'}
              </p>
              <p class="text-dark-500 text-sm mt-1 flex items-center">
                <i class="fas fa-clock mr-1 text-xs"></i>
                ${timeAgo}
              </p>
            </div>

            <div class="flex items-center">
              ${notification.read ? '' : '<span class="w-3 h-3 bg-primary-500 rounded-full mr-3 animate-pulse"></span>'}
              <button class="w-8 h-8 rounded-full hover:bg-dark-50 flex items-center justify-center text-dark-500 hover:text-dark-700 transition-colors notification-options-btn">
                <i class="fas fa-ellipsis-h"></i>
              </button>
            </div>
          </div>

          ${contentHTML}
        </div>
      </div>
    `;

    // Add click event to mark as read
    notificationElement.addEventListener('click', function() {
      markNotificationAsRead(notification.id);
    });

    // Add click event to follow back button
    const followBackBtn = notificationElement.querySelector('.follow-back-btn');
    if (followBackBtn) {
      followBackBtn.addEventListener('click', function(event) {
        event.stopPropagation();
        handleFollowBack(notification.actorId);
      });
    }

    // Add click event to reply button
    const replyBtn = notificationElement.querySelector('.reply-btn');
    if (replyBtn) {
      replyBtn.addEventListener('click', function(event) {
        event.stopPropagation();
        handleReply(notification);
      });
    }

    // Add click event to notification options button
    const optionsBtn = notificationElement.querySelector('.notification-options-btn');
    if (optionsBtn) {
      optionsBtn.addEventListener('click', function(event) {
        event.stopPropagation();
        // Show options menu (to be implemented)
      });
    }

    return notificationElement;
  }

  /**
   * Count unread notifications
   * @param {Array} notifications - The notifications to count
   * @returns {number} - The number of unread notifications
   */
  function countUnread(notifications) {
    return notifications.filter(notification => !notification.read).length;
  }

  /**
   * Update unread count
   * @param {Array} notifications - All notifications
   */
  function updateUnreadCount(notifications) {
    const unreadCount = countUnread(notifications);

    // Update count in header if it exists
    const unreadCountElement = document.querySelector('.unread-count');
    if (unreadCountElement) {
      unreadCountElement.textContent = `${unreadCount} new notifications`;
    }
  }

  /**
   * Filter notifications
   * @param {string} filterType - The filter type
   */
  function filterNotifications(filterType) {
    // Save current filter
    currentFilter = filterType;

    // Get all notification elements
    const notificationElements = document.querySelectorAll('[data-type]');

    // Show/hide based on filter
    notificationElements.forEach(element => {
      const type = element.dataset.type;

      if (filterType === 'all' || type === filterType) {
        element.parentElement.classList.remove('hidden');
      } else {
        element.parentElement.classList.add('hidden');
      }
    });

    // Check if any notifications are visible in each group
    const groups = document.querySelectorAll('.notifications-container > div');
    groups.forEach(group => {
      const visibleNotifications = group.querySelectorAll('[data-type]:not(.hidden)');

      if (visibleNotifications.length === 0) {
        group.classList.add('hidden');
      } else {
        group.classList.remove('hidden');
      }
    });
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - The notification ID
   */
  async function markNotificationAsRead(notificationId) {
    try {
      // Check if NotificationService is available
      if (!window.NotificationService) {
        throw new Error('Notification service not available');
      }

      // Mark as read
      const success = await window.NotificationService.markAsRead(notificationId);

      if (success) {
        // Update UI
        const notificationElement = document.querySelector(`[data-id="${notificationId}"]`);
        if (notificationElement) {
          // Remove border
          notificationElement.classList.remove('border-l-4', 'border-primary-500');

          // Remove unread indicator
          const unreadIndicator = notificationElement.querySelector('.bg-primary-500.rounded-full');
          if (unreadIndicator) {
            unreadIndicator.remove();
          }
        }

        // Reload notifications to update counts
        const currentUser = window.AuthService.getCurrentUser();
        await loadNotifications(currentUser.id);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Handle mark all as read
   */
  async function handleMarkAllAsRead() {
    try {
      // Check if NotificationService is available
      if (!window.NotificationService) {
        throw new Error('Notification service not available');
      }

      // Get current user
      const currentUser = window.AuthService.getCurrentUser();

      // Mark all as read
      const success = await window.NotificationService.markAllAsRead(currentUser.id);

      if (success) {
        // Reload notifications
        await loadNotifications(currentUser.id);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  /**
   * Handle follow back
   * @param {string} userId - The user ID to follow
   */
  function handleFollowBack(userId) {
    // To be implemented
    console.log('Follow back user:', userId);
  }

  /**
   * Handle reply
   * @param {Object} notification - The notification data
   */
  function handleReply(notification) {
    // To be implemented
    console.log('Reply to notification:', notification);
  }
  // Make loadNotifications available globally
  window.loadNotifications = loadNotifications;
});