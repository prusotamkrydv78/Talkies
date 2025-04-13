/**
 * Notification Service
 * Handles notification-related operations using JSON Server
 */

const NotificationService = {
  // API URL
  apiUrl: 'http://localhost:3001',
  
  // Get notifications for a user
  getNotificationsByUserId: async function(userId) {
    try {
      const response = await fetch(`${this.apiUrl}/notifications?userId=${userId}&_sort=createdAt&_order=desc`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching notifications for user ${userId}:`, error);
      return [];
    }
  },
  
  // Get unread notifications count
  getUnreadCount: async function(userId) {
    try {
      const response = await fetch(`${this.apiUrl}/notifications?userId=${userId}&read=false`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const notifications = await response.json();
      return notifications.length;
    } catch (error) {
      console.error(`Error fetching unread notifications count:`, error);
      return 0;
    }
  },
  
  // Mark notification as read
  markAsRead: async function(notificationId) {
    try {
      const response = await fetch(`${this.apiUrl}/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ read: true })
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      return true;
    } catch (error) {
      console.error(`Error marking notification as read:`, error);
      return false;
    }
  },
  
  // Mark all notifications as read
  markAllAsRead: async function(userId) {
    try {
      // Get all unread notifications
      const response = await fetch(`${this.apiUrl}/notifications?userId=${userId}&read=false`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const notifications = await response.json();
      
      // Mark each notification as read
      for (const notification of notifications) {
        await fetch(`${this.apiUrl}/notifications/${notification.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ read: true })
        });
      }
      
      return true;
    } catch (error) {
      console.error(`Error marking all notifications as read:`, error);
      return false;
    }
  },
  
  // Format notification text
  formatNotification: async function(notification) {
    try {
      // Get actor details
      const actorResponse = await fetch(`${this.apiUrl}/users/${notification.actorId}`);
      
      if (!actorResponse.ok) {
        throw new Error('Failed to fetch actor');
      }
      
      const actor = await actorResponse.json();
      
      let text = '';
      let link = '';
      
      switch (notification.type) {
        case 'like':
          // Get post details
          const postResponse = await fetch(`${this.apiUrl}/posts/${notification.targetId}`);
          
          if (postResponse.ok) {
            const post = await postResponse.json();
            text = `${actor.name} liked your post`;
            link = `/post/${notification.targetId}`;
          } else {
            text = `${actor.name} liked your post`;
            link = '#';
          }
          break;
          
        case 'comment':
          text = `${actor.name} commented on your post`;
          link = `/post/${notification.targetId}`;
          break;
          
        case 'follow':
          text = `${actor.name} started following you`;
          link = `/profile/${actor.username}`;
          break;
          
        default:
          text = 'You have a new notification';
          link = '#';
      }
      
      return {
        ...notification,
        actor,
        text,
        link
      };
    } catch (error) {
      console.error(`Error formatting notification:`, error);
      return notification;
    }
  }
};

// Make NotificationService available globally
window.NotificationService = NotificationService;
