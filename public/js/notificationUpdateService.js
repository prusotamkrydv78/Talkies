/**
 * Notification Update Service
 * Handles real-time notification updates and counts
 */

const NotificationUpdateService = {
  // API URL
  apiUrl: 'http://localhost:3001',

  // Debug flag
  debug: true,

  // Notification check interval (in milliseconds)
  checkInterval: 10000, // 10 seconds

  // Interval ID for periodic checks
  intervalId: null,

  // Last notification count
  lastCount: 0,

  // Log method for debugging
  log: function(...args) {
    if (this.debug) {
      console.log('[NotificationService]', ...args);
    }
  },

  // Initialize the service
  init: function() {
    this.log('Initializing notification service');

    // Get current user
    const currentUser = this.getCurrentUser();

    if (!currentUser) {
      console.warn('NotificationUpdateService: No user logged in');
      return;
    }

    this.log('Current user:', currentUser);

    // Update notification count immediately
    this.updateNotificationCount(currentUser.id);

    // Set up periodic checks
    this.startPeriodicChecks(currentUser.id);

    // Set up event listeners for notification actions
    this.setupEventListeners();

    this.log('NotificationUpdateService initialized successfully');
  },

  // Get current user from localStorage
  getCurrentUser: function() {
    try {
      const userJson = localStorage.getItem('currentUser');
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Start periodic notification checks
  startPeriodicChecks: function(userId) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      this.updateNotificationCount(userId);
    }, this.checkInterval);
  },

  // Stop periodic notification checks
  stopPeriodicChecks: function() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  },

  // Update notification count
  updateNotificationCount: async function(userId) {
    try {
      this.log('Updating notification count for user:', userId);

      // Get unread notification count
      const count = await this.getUnreadNotificationCount(userId);
      this.log('Current unread count:', count, 'Previous count:', this.lastCount);

      // Update UI
      this.updateNotificationUI(count);

      // Check if count has increased
      if (count > this.lastCount) {
        this.log('New notifications detected:', count - this.lastCount);
        // New notifications received
        this.onNewNotifications(count - this.lastCount);
      }

      // Update last count
      this.lastCount = count;
    } catch (error) {
      console.error('Error updating notification count:', error);
    }
  },

  // Get unread notification count
  getUnreadNotificationCount: async function(userId) {
    try {
      this.log('Checking for unread notifications for user:', userId);
      const url = `${this.apiUrl}/notifications?userId=${userId}&read=false`;
      this.log('Fetching from URL:', url);

      const response = await fetch(url);

      if (!response.ok) {
        console.error('Failed to fetch notifications, status:', response.status);
        throw new Error('Failed to fetch notifications');
      }

      const notifications = await response.json();
      this.log('Unread notifications found:', notifications.length, notifications);
      return notifications.length;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  },

  // Update notification UI
  updateNotificationUI: function(count) {
    this.log('Updating notification UI with count:', count);

    // Update desktop notification count
    const notificationCount = document.querySelector('.notification-count');
    if (notificationCount) {
      this.log('Found desktop notification count element');
      notificationCount.textContent = count;

      // Show/hide based on count
      if (count > 0) {
        notificationCount.style.display = 'flex';
        this.log('Showing desktop notification count');
      } else {
        notificationCount.style.display = 'none';
        this.log('Hiding desktop notification count');
      }
    } else {
      console.warn('Desktop notification count element not found');
    }

    // Update mobile notification count
    const mobileNotificationCount = document.querySelector('.notification-count-mobile');
    if (mobileNotificationCount) {
      this.log('Found mobile notification count element');
      mobileNotificationCount.textContent = count;

      // Show/hide based on count
      if (count > 0) {
        mobileNotificationCount.style.display = 'flex';
        this.log('Showing mobile notification count');
      } else {
        mobileNotificationCount.style.display = 'none';
        this.log('Hiding mobile notification count');
      }
    } else {
      console.warn('Mobile notification count element not found');
    }
  },

  // Handle new notifications
  onNewNotifications: function(newCount) {
    this.log(`${newCount} new notification(s) received`);

    // Show notification toast
    this.showNotificationToast(newCount);

    // Refresh notifications page if it's open
    this.refreshNotificationsPage();
  },

  // Show notification toast
  showNotificationToast: function(count) {
    this.log('Showing notification toast for', count, 'notifications');

    // Create toast element if it doesn't exist
    let toast = document.getElementById('notification-toast');

    if (!toast) {
      this.log('Creating new toast element');
      toast = document.createElement('div');
      toast.id = 'notification-toast';
      toast.className = 'fixed bottom-4 right-4 bg-white rounded-xl shadow-lg p-4 z-50 transform translate-y-20 opacity-0 transition-all duration-300';
      document.body.appendChild(toast);
    } else {
      this.log('Using existing toast element');
    }

    // Set toast content
    toast.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-500">
          <i class="fas fa-bell"></i>
        </div>
        <div>
          <h4 class="font-semibold text-dark-900">New Notification${count > 1 ? 's' : ''}</h4>
          <p class="text-dark-500 text-sm">You have ${count} new notification${count > 1 ? 's' : ''}</p>
        </div>
        <button class="w-8 h-8 rounded-full hover:bg-dark-50 flex items-center justify-center text-dark-500 hover:text-dark-700 transition-colors" onclick="document.getElementById('notification-toast').classList.remove('translate-y-0', 'opacity-100');">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    // Show toast
    this.log('Animating toast in');
    setTimeout(() => {
      toast.classList.add('translate-y-0', 'opacity-100');

      // Hide toast after 5 seconds
      setTimeout(() => {
        this.log('Animating toast out');
        toast.classList.remove('translate-y-0', 'opacity-100');
      }, 5000);
    }, 100);
  },

  // Refresh notifications page if it's open
  refreshNotificationsPage: function() {
    this.log('Checking if notifications page is open');

    // Check if we're on the notifications page
    if (window.location.pathname === '/notifications') {
      this.log('On notifications page, refreshing content');

      // Reload notifications
      if (window.loadNotifications) {
        this.log('loadNotifications function found');
        const currentUser = this.getCurrentUser();
        if (currentUser) {
          this.log('Reloading notifications for user:', currentUser.id);
          window.loadNotifications(currentUser.id);
        } else {
          this.log('No current user found, cannot reload notifications');
        }
      } else {
        this.log('loadNotifications function not found');
      }
    } else {
      this.log('Not on notifications page, no refresh needed');
    }
  },

  // Set up event listeners for notification actions
  setupEventListeners: function() {
    this.log('Setting up event listeners for notifications');

    // Listen for post likes
    document.addEventListener('postLiked', (event) => {
      this.log('Post liked event detected:', event.detail);

      // Create notification directly
      if (event.detail && event.detail.postOwnerId && event.detail.userId) {
        this.log('Creating like notification');
        this.createNotification({
          userId: event.detail.postOwnerId,
          type: 'like',
          actorId: event.detail.userId,
          targetId: event.detail.postId,
          targetType: 'post'
        });
      } else {
        this.log('Invalid event detail for like notification:', event.detail);
      }
    });

    // Listen for post comments
    document.addEventListener('postCommented', (event) => {
      this.log('Post commented event detected:', event.detail);

      // Create notification directly
      if (event.detail && event.detail.postOwnerId && event.detail.userId) {
        this.log('Creating comment notification');
        this.createNotification({
          userId: event.detail.postOwnerId,
          type: 'comment',
          actorId: event.detail.userId,
          targetId: event.detail.postId,
          targetType: 'post'
        });
      } else {
        this.log('Invalid event detail for comment notification:', event.detail);
      }
    });

    // Listen for user follows
    document.addEventListener('userFollowed', (event) => {
      this.log('User followed event detected:', event.detail);

      // Create notification directly
      if (event.detail && event.detail.targetUserId && event.detail.userId) {
        this.log('Creating follow notification');
        this.createNotification({
          userId: event.detail.targetUserId,
          type: 'follow',
          actorId: event.detail.userId,
          targetId: null,
          targetType: null
        });
      } else {
        this.log('Invalid event detail for follow notification:', event.detail);
      }
    });

    this.log('Event listeners set up successfully');
  },

  // Create a notification
  createNotification: async function(notificationData) {
    try {
      this.log('Creating notification with data:', notificationData);

      // Skip if the notification is for the current user (self-notification)
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === notificationData.userId) {
        this.log('Skipping self-notification');
        return null;
      }

      const fullNotificationData = {
        ...notificationData,
        read: false,
        createdAt: new Date().toISOString()
      };

      this.log('Full notification data:', fullNotificationData);
      this.log('Sending POST request to:', `${this.apiUrl}/notifications`);

      const response = await fetch(`${this.apiUrl}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fullNotificationData)
      });

      this.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to create notification: ${response.status} ${errorText}`);
      }

      const notification = await response.json();
      this.log('Notification created successfully:', notification);

      // Update notification count immediately
      if (currentUser) {
        this.log('Updating notification count for current user:', currentUser.id);
        this.updateNotificationCount(currentUser.id);
      } else {
        this.log('No current user found, cannot update notification count');
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }
};

// Initialize the service when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  NotificationUpdateService.init();
});

// Make the service available globally
window.NotificationUpdateService = NotificationUpdateService;
