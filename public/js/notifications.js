// Real-time notifications functionality (frontend only)
document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const notificationBadge = document.querySelector('.notification-badge');
  const notificationButton = document.querySelector('.notification-button');
  const notificationDropdown = document.querySelector('.notification-dropdown');
  
  // Mock Socket.io for real-time notifications
  const socket = mockSocketIO();
  
  // Mock notifications data
  let notifications = [
    { id: 1, type: 'like', user: { name: 'Emma Wilson', avatar: 'https://ui-avatars.com/api/?name=Emma+Wilson&background=10B981&color=fff' }, content: 'liked your post', time: '2m ago', read: false },
    { id: 2, type: 'comment', user: { name: 'Alex Thompson', avatar: 'https://ui-avatars.com/api/?name=Alex+Thompson&background=8B5CF6&color=fff' }, content: 'commented on your post', time: '1h ago', read: false },
    { id: 3, type: 'follow', user: { name: 'Sarah Johnson', avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=0D8ABC&color=fff' }, content: 'started following you', time: '3h ago', read: true }
  ];
  
  // Initialize notifications
  initializeNotifications();
  
  // Socket event listeners
  socket.on('notification', handleNewNotification);
  
  // Event listeners
  if (notificationButton) {
    notificationButton.addEventListener('click', toggleNotificationDropdown);
  }
  
  // Initialize notifications
  function initializeNotifications() {
    updateNotificationBadge();
    renderNotificationDropdown();
    
    // Add click event to document to close dropdown when clicking outside
    document.addEventListener('click', function(event) {
      if (notificationDropdown && notificationButton && !notificationDropdown.contains(event.target) && !notificationButton.contains(event.target)) {
        notificationDropdown.classList.add('hidden');
      }
    });
  }
  
  // Update notification badge
  function updateNotificationBadge() {
    if (!notificationBadge) return;
    
    const unreadCount = notifications.filter(notification => !notification.read).length;
    
    if (unreadCount > 0) {
      notificationBadge.textContent = unreadCount;
      notificationBadge.classList.remove('hidden');
    } else {
      notificationBadge.classList.add('hidden');
    }
  }
  
  // Render notification dropdown
  function renderNotificationDropdown() {
    if (!notificationDropdown) return;
    
    // Clear existing notifications
    notificationDropdown.innerHTML = '';
    
    // Add header
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center p-4 border-b border-dark-100';
    header.innerHTML = `
      <h3 class="font-bold text-dark-900">Notifications</h3>
      <button class="text-primary-500 text-sm font-medium hover:text-primary-600 transition-colors" id="mark-all-read">Mark all as read</button>
    `;
    notificationDropdown.appendChild(header);
    
    // Add notifications
    const notificationsList = document.createElement('div');
    notificationsList.className = 'max-h-96 overflow-y-auto custom-scrollbar';
    
    if (notifications.length === 0) {
      notificationsList.innerHTML = `
        <div class="p-4 text-center text-dark-500">
          No notifications yet
        </div>
      `;
    } else {
      notifications.forEach(notification => {
        const notificationItem = document.createElement('div');
        notificationItem.className = `p-4 hover:bg-dark-50 transition-all cursor-pointer ${notification.read ? '' : 'bg-primary-50'}`;
        notificationItem.dataset.id = notification.id;
        
        // Notification icon based on type
        let icon = '';
        switch (notification.type) {
          case 'like':
            icon = '<i class="fas fa-heart text-red-500"></i>';
            break;
          case 'comment':
            icon = '<i class="fas fa-comment text-primary-500"></i>';
            break;
          case 'follow':
            icon = '<i class="fas fa-user-plus text-green-500"></i>';
            break;
          case 'message':
            icon = '<i class="fas fa-envelope text-purple-500"></i>';
            break;
          default:
            icon = '<i class="fas fa-bell text-primary-500"></i>';
        }
        
        notificationItem.innerHTML = `
          <div class="flex items-start space-x-3">
            <div class="relative">
              <img src="${notification.user.avatar}" alt="${notification.user.name}" class="w-10 h-10 rounded-full border border-dark-100">
              <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center border border-dark-100">
                ${icon}
              </div>
            </div>
            <div class="flex-1">
              <p class="text-dark-800">
                <span class="font-semibold">${notification.user.name}</span> 
                ${notification.content}
              </p>
              <p class="text-xs text-dark-500 mt-1">${notification.time}</p>
            </div>
            ${notification.read ? '' : '<div class="w-2 h-2 rounded-full bg-primary-500"></div>'}
          </div>
        `;
        
        // Add click event to mark as read
        notificationItem.addEventListener('click', function() {
          markNotificationAsRead(notification.id);
        });
        
        notificationsList.appendChild(notificationItem);
      });
    }
    
    notificationDropdown.appendChild(notificationsList);
    
    // Add footer
    const footer = document.createElement('div');
    footer.className = 'p-4 border-t border-dark-100 text-center';
    footer.innerHTML = `
      <a href="/notifications" class="text-primary-500 font-medium hover:text-primary-600 transition-colors">View all notifications</a>
    `;
    notificationDropdown.appendChild(footer);
    
    // Add click event to mark all as read button
    const markAllReadButton = notificationDropdown.querySelector('#mark-all-read');
    if (markAllReadButton) {
      markAllReadButton.addEventListener('click', function(event) {
        event.stopPropagation();
        markAllNotificationsAsRead();
      });
    }
  }
  
  // Toggle notification dropdown
  function toggleNotificationDropdown(event) {
    if (!notificationDropdown) return;
    
    event.stopPropagation();
    notificationDropdown.classList.toggle('hidden');
  }
  
  // Mark notification as read
  function markNotificationAsRead(id) {
    const notification = notifications.find(notification => notification.id === id);
    if (notification) {
      notification.read = true;
      updateNotificationBadge();
      renderNotificationDropdown();
    }
  }
  
  // Mark all notifications as read
  function markAllNotificationsAsRead() {
    notifications.forEach(notification => {
      notification.read = true;
    });
    
    updateNotificationBadge();
    renderNotificationDropdown();
  }
  
  // Handle new notification
  function handleNewNotification(data) {
    // Add notification to list
    notifications.unshift(data);
    
    // Update UI
    updateNotificationBadge();
    renderNotificationDropdown();
    
    // Show browser notification
    showBrowserNotification(data);
    
    // Simulate notification sound
    playNotificationSound();
  }
  
  // Show browser notification
  function showBrowserNotification(notification) {
    // Check if browser supports notifications
    if (!("Notification" in window)) return;
    
    // Check if permission is granted
    if (Notification.permission === "granted") {
      createBrowserNotification(notification);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(function (permission) {
        if (permission === "granted") {
          createBrowserNotification(notification);
        }
      });
    }
  }
  
  // Create browser notification
  function createBrowserNotification(notification) {
    let title = '';
    let body = '';
    
    switch (notification.type) {
      case 'like':
        title = 'New Like';
        body = `${notification.user.name} liked your post`;
        break;
      case 'comment':
        title = 'New Comment';
        body = `${notification.user.name} commented on your post`;
        break;
      case 'follow':
        title = 'New Follower';
        body = `${notification.user.name} started following you`;
        break;
      case 'message':
        title = 'New Message';
        body = `${notification.user.name} sent you a message`;
        break;
      default:
        title = 'New Notification';
        body = notification.content;
    }
    
    const browserNotification = new Notification(title, {
      body: body,
      icon: notification.user.avatar
    });
    
    browserNotification.onclick = function() {
      window.focus();
      this.close();
    };
  }
  
  // Play notification sound
  function playNotificationSound() {
    const audio = new Audio('/sounds/notification.mp3');
    audio.play().catch(error => {
      console.log('Error playing notification sound:', error);
    });
  }
  
  // Simulate new notifications
  function simulateNewNotifications() {
    // Types of notifications
    const notificationTypes = ['like', 'comment', 'follow', 'message'];
    
    // Users
    const users = [
      { name: 'Emma Wilson', avatar: 'https://ui-avatars.com/api/?name=Emma+Wilson&background=10B981&color=fff' },
      { name: 'Alex Thompson', avatar: 'https://ui-avatars.com/api/?name=Alex+Thompson&background=8B5CF6&color=fff' },
      { name: 'Sarah Johnson', avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=0D8ABC&color=fff' },
      { name: 'Michael Brown', avatar: 'https://ui-avatars.com/api/?name=Michael+Brown&background=F59E0B&color=fff' },
      { name: 'Jessica Lee', avatar: 'https://ui-avatars.com/api/?name=Jessica+Lee&background=EF4444&color=fff' }
    ];
    
    // Content based on type
    const contentByType = {
      like: 'liked your post',
      comment: 'commented on your post',
      follow: 'started following you',
      message: 'sent you a message'
    };
    
    // Generate random notification
    setInterval(() => {
      const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const content = contentByType[type];
      
      const newNotification = {
        id: Date.now(),
        type: type,
        user: user,
        content: content,
        time: 'just now',
        read: false
      };
      
      socket.emit('notification', newNotification);
    }, 60000); // Every minute
  }
  
  // Start simulating new notifications
  simulateNewNotifications();
  
  // Mock Socket.io implementation (frontend only)
  function mockSocketIO() {
    const eventHandlers = {};
    
    return {
      on: function(event, callback) {
        if (!eventHandlers[event]) {
          eventHandlers[event] = [];
        }
        eventHandlers[event].push(callback);
      },
      
      emit: function(event, data) {
        // For frontend-only implementation, we'll simulate receiving the event
        setTimeout(() => {
          if (eventHandlers[event]) {
            eventHandlers[event].forEach(callback => {
              callback(data);
            });
          }
        }, 500);
      }
    };
  }
});
