/**
 * Messages Page
 * Handles dynamic messaging functionality
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const conversationsList = document.querySelector('.conversations-list');
  const messagesContainer = document.querySelector('.messages-container');
  const messageInput = document.querySelector('input[placeholder="Type a message..."]');
  const sendButton = document.querySelector('.send-button');
  const searchInput = document.querySelector('input[placeholder="Search messages..."]');
  const newMessageButton = document.querySelector('.new-message-button');
  const chatArea = document.querySelector('.chat-area');
  const mobileEmptyState = document.querySelector('.mobile-empty-state');
  const primaryTab = document.querySelector('.primary-tab');
  const requestsTab = document.querySelector('.requests-tab');

  // Current state
  let currentUser = null;
  let conversations = [];
  let followedUsers = [];
  let activeConversation = null;
  let activeConversationUser = null;
  let messages = [];
  let typingTimeout = null;
  let refreshInterval = null;
  let activeTab = 'primary'; // 'primary', 'requests', or 'followed'

  // Initialize
  init();

  /**
   * Initialize the messages page
   */
  async function init() {
    // Get current user
    currentUser = await getCurrentUser();

    if (!currentUser) {
      console.error('No user logged in');
      return;
    }

    // Load conversations
    await loadConversations();

    // Load followed users
    await loadFollowedUsers();

    // Set up event listeners
    setupEventListeners();

    // Start refresh interval
    startRefreshInterval();
  }

  /**
   * Get current user from localStorage
   */
  async function getCurrentUser() {
    try {
      const userJson = localStorage.getItem('currentUser');
      if (!userJson) return null;

      const user = JSON.parse(userJson);

      // Get fresh user data from API
      const response = await fetch(`http://localhost:3001/users/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch user');

      return await response.json();
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Load conversations for the current user
   */
  async function loadConversations() {
    try {
      // Get conversations from API
      conversations = await window.MessageService.getConversations(currentUser.id);

      // Render conversations if primary tab is active
      if (activeTab === 'primary') {
        renderConversations();

        // If there are conversations, load the first one
        if (conversations.length > 0) {
          setActiveConversation(conversations[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }

  /**
   * Load users followed by the current user
   */
  async function loadFollowedUsers() {
    try {
      // Get followed user IDs from current user
      const followingIds = currentUser.following || [];

      if (followingIds.length === 0) {
        followedUsers = [];
        return;
      }

      // Get user details for each followed user
      followedUsers = [];

      for (const userId of followingIds) {
        try {
          const response = await fetch(`http://localhost:3001/users/${userId}`);

          if (!response.ok) {
            console.warn(`Failed to fetch user with ID ${userId}`);
            continue;
          }

          const user = await response.json();
          followedUsers.push(user);
        } catch (error) {
          console.warn(`Error fetching user with ID ${userId}:`, error);
        }
      }

      // Sort followed users by name
      followedUsers.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error loading followed users:', error);
    }
  }

  /**
   * Render conversations in the sidebar
   */
  function renderConversations() {
    if (!conversationsList) return;

    // Clear existing conversations
    conversationsList.innerHTML = '';

    // Show loading indicator if no conversations
    if (conversations.length === 0) {
      conversationsList.innerHTML = `
        <div class="p-4 text-center">
          <p class="text-dark-500">No conversations yet</p>
          <p class="text-dark-400 text-sm mt-2">Start a new conversation by clicking the "New Message" button</p>
        </div>
      `;
      return;
    }

    // Add conversations
    conversations.forEach(conversation => {
      const { id, user, lastMessage, unreadCount, updatedAt } = conversation;

      // Create conversation element
      const conversationElement = document.createElement('div');
      conversationElement.className = `p-2 ${activeConversation === id ? 'bg-primary-50 border-l-4 border-primary-500' : 'border-b border-dark-50'} hover:bg-dark-50 transition-all cursor-pointer conversation-item`;
      conversationElement.dataset.id = id;

      // Format time
      const timeDisplay = formatTimeAgo(updatedAt);

      // Create HTML content
      conversationElement.innerHTML = `
        <div class="flex items-center space-x-4">
          <div class="relative">
            <img src="${user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff`}" alt="${user.name}" class="avatar h-14 w-14 border-2 ${activeConversation === id ? 'border-primary-200' : 'border-dark-100'} shadow-sm">
            <div class="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-center">
              <h4 class="font-${activeConversation === id ? 'bold' : 'semibold'} text-dark-900 truncate">${user.name}</h4>
              <span class="text-xs bg-dark-${activeConversation === id ? '100' : '50'} text-dark-${activeConversation === id ? '600' : '500'} px-2 py-1 rounded-full">${timeDisplay}</span>
            </div>
            <div class="flex justify-between items-center mt-1">
              <p class="text-sm text-dark-${activeConversation === id ? '600' : '500'} truncate">
                ${lastMessage ? (lastMessage.senderId === currentUser.id ? '<i class="fas fa-check-double text-xs text-primary-500 mr-1"></i>' : '') : ''}
                ${lastMessage ? lastMessage.content : 'No messages yet'}
              </p>
              ${unreadCount > 0 ? `
                <span class="w-6 h-6 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-xs flex items-center justify-center shadow-sm ml-2">${unreadCount}</span>
              ` : ''}
            </div>
          </div>
        </div>
      `;

      // Add click event
      conversationElement.addEventListener('click', () => {
        setActiveConversation(id);
      });

      // Add to list
      conversationsList.appendChild(conversationElement);
    });
  }

  /**
   * Render followed users in the sidebar
   */
  function renderFollowedUsers() {
    if (!conversationsList) return;

    // Clear existing content
    conversationsList.innerHTML = '';

    // Show loading indicator if no followed users
    if (followedUsers.length === 0) {
      conversationsList.innerHTML = `
        <div class="p-4 text-center">
          <p class="text-dark-500">You're not following anyone yet</p>
          <p class="text-dark-400 text-sm mt-2">Follow users to see them here</p>
        </div>
      `;
      return;
    }

    // Add followed users
    followedUsers.forEach(user => {
      // Create user element
      const userElement = document.createElement('div');
      userElement.className = 'p-2 border-b border-dark-50 hover:bg-dark-50 transition-all cursor-pointer followed-user-item';
      userElement.dataset.id = user.id;

      // Create HTML content
      userElement.innerHTML = `
        <div class="flex items-center space-x-4">
          <div class="relative">
            <img src="${user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff`}" alt="${user.name}" class="avatar h-14 w-14 border-2 border-dark-100 shadow-sm">
            <div class="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-center">
              <h4 class="font-semibold text-dark-900 truncate">${user.name}</h4>
              <span class="text-xs bg-dark-50 text-dark-500 px-2 py-1 rounded-full">@${user.username}</span>
            </div>
            <div class="flex justify-between items-center mt-1">
              <p class="text-sm text-dark-500 truncate">
                <i class="fas fa-comment-dots text-xs text-primary-500 mr-1"></i>
                Start a conversation
              </p>
            </div>
          </div>
        </div>
      `;

      // Add click event
      userElement.addEventListener('click', () => {
        startNewConversation(user);
      });

      // Add to list
      conversationsList.appendChild(userElement);
    });
  }

  /**
   * Set active conversation
   * @param {string} conversationId - The conversation ID
   */
  async function setActiveConversation(conversationId) {
    // Update active conversation
    activeConversation = conversationId;

    // Find conversation
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    // Set active conversation user
    activeConversationUser = conversation.user;

    // Update UI
    renderConversations();
    updateChatHeader();

    // Load messages
    await loadMessages(conversationId);

    // Mark messages as read
    await window.MessageService.markAsRead(conversationId, currentUser.id);

    // Reload conversations to update unread count
    await loadConversations();

    // Show chat area on mobile
    if (window.innerWidth < 768) {
      document.querySelector('.chat-area').classList.remove('hidden');
      document.querySelector('.chat-area').classList.add('flex');
      document.querySelector('.conversations-list-container').classList.add('hidden');
    }
  }

  /**
   * Update chat header with active conversation user
   */
  function updateChatHeader() {
    if (!activeConversationUser) return;

    const chatHeader = document.querySelector('.chat-header');
    if (!chatHeader) return;

    chatHeader.innerHTML = `
      <div class="flex items-center space-x-4">
        <div class="relative">
          <img src="${activeConversationUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeConversationUser.name)}&background=0D8ABC&color=fff`}" alt="${activeConversationUser.name}" class="avatar h-12 w-12 border-2 border-primary-100 shadow-sm rounded-full">
          <div class="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
        </div>
        <div>
          <h4 class="font-bold text-dark-900">${activeConversationUser.name}</h4>
          <p class="text-xs text-green-500 flex items-center">
            <span class="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
            Online
          </p>
        </div>
      </div>

      <div class="flex items-center space-x-3">
        <button class="w-10 h-10 rounded-xl bg-dark-50 flex items-center justify-center text-dark-500 hover:bg-dark-100 transition-all shadow-sm hover:shadow">
          <i class="fas fa-phone"></i>
        </button>
        <button class="w-10 h-10 rounded-xl bg-dark-50 flex items-center justify-center text-dark-500 hover:bg-dark-100 transition-all shadow-sm hover:shadow">
          <i class="fas fa-video"></i>
        </button>
        <button class="w-10 h-10 rounded-xl bg-dark-50 flex items-center justify-center text-dark-500 hover:bg-dark-100 transition-all shadow-sm hover:shadow">
          <i class="fas fa-info-circle"></i>
        </button>
      </div>
    `;
  }

  /**
   * Load messages for a conversation
   * @param {string} conversationId - The conversation ID
   */
  async function loadMessages(conversationId) {
    try {
      // Show loading indicator if no messages yet
      if (messages.length === 0) {
        messagesContainer.innerHTML = `
          <div class="flex items-center justify-center h-full">
            <div class="text-center p-8">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-6"></div>
              <p class="text-dark-500">Loading messages...</p>
            </div>
          </div>
        `;
      }

      // Get messages from API
      const newMessages = await window.MessageService.getMessages(conversationId);

      // Check if we have new messages
      const hasNewMessages = newMessages.length > messages.length;

      // Update messages
      messages = newMessages;

      // Render messages
      renderMessages();

      // Mark messages as read
      await window.MessageService.markAsRead(conversationId, currentUser.id);

      // Update conversation list to reflect read messages
      if (hasNewMessages) {
        await loadConversations();
      }
    } catch (error) {
      console.error('Error loading messages:', error);

      // Show error message
      if (messagesContainer) {
        messagesContainer.innerHTML = `
          <div class="flex items-center justify-center h-full">
            <div class="text-center p-8">
              <div class="text-red-500 mb-4">
                <i class="fas fa-exclamation-circle text-4xl"></i>
              </div>
              <p class="text-dark-700 font-medium">Failed to load messages</p>
              <p class="text-dark-500 text-sm mt-2">Please try again later</p>
              <button class="btn bg-primary-500 text-white mt-4 px-4 py-2 rounded-lg retry-load-messages" data-conversation-id="${conversationId}">
                <i class="fas fa-sync-alt mr-2"></i>
                Retry
              </button>
            </div>
          </div>
        `;

        // Add event listener to retry button
        const retryButton = messagesContainer.querySelector('.retry-load-messages');
        if (retryButton) {
          retryButton.addEventListener('click', function() {
            const conversationId = this.getAttribute('data-conversation-id');
            if (conversationId) {
              loadMessages(conversationId);
            }
          });
        }
      }
    }
  }

  /**
   * Render messages in the chat area
   */
  function renderMessages() {
    if (!messagesContainer) return;

    // Remove loading indicator or error message
    const loadingIndicator = messagesContainer.querySelector('.flex.items-center.justify-center.h-full');
    if (loadingIndicator) {
      messagesContainer.removeChild(loadingIndicator);
    }

    // Remove temporary message if it exists
    const tempMessage = messagesContainer.querySelector('.temp-message');
    if (tempMessage) {
      messagesContainer.removeChild(tempMessage);
    }

    // Clear existing messages
    messagesContainer.innerHTML = '';

    // Show empty state if no messages
    if (messages.length === 0) {
      messagesContainer.innerHTML = `
        <div class="flex items-center justify-center h-full">
          <div class="text-center p-8">
            <div class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-500 mx-auto mb-4">
              <i class="fas fa-comments text-2xl"></i>
            </div>
            <p class="text-dark-700 font-medium">No messages yet</p>
            <p class="text-dark-500 text-sm mt-2">Send a message to start the conversation</p>
          </div>
        </div>
      `;
      return;
    }

    // Group messages by date
    const messagesByDate = groupMessagesByDate(messages);

    // Render each date group
    Object.entries(messagesByDate).forEach(([date, dateMessages]) => {
      // Add date separator
      messagesContainer.innerHTML += `
        <div class="flex items-center justify-center">
          <div class="bg-white text-dark-600 text-xs px-4 py-1.5 rounded-full shadow-sm font-medium">
            ${date}
          </div>
        </div>
      `;

      // Track the previous message sender to group consecutive messages
      let prevSenderId = null;

      // Render messages for this date
      dateMessages.forEach((message, index) => {
        const isSent = message.senderId === currentUser.id;
        const time = formatTime(message.createdAt);
        const isConsecutive = prevSenderId === message.senderId;

        // Update previous sender
        prevSenderId = message.senderId;

        if (isSent) {
          // Sent message
          if (isConsecutive && index > 0) {
            // Consecutive sent message (no avatar, less margin)
            messagesContainer.innerHTML += `
              <div class="flex items-end justify-end space-x-3 max-w-[80%] ml-auto mt-1">
                <div class="bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-2xl rounded-br-none p-4 shadow-sm">
                  <p>${message.content}</p>
                  <div class="flex items-center justify-end mt-1.5 space-x-1.5">
                    <p class="text-xs text-white/70">${time}</p>
                    <i class="fas fa-${message.read ? 'check-double' : 'check'} text-xs"></i>
                  </div>
                </div>
              </div>
            `;
          } else {
            // First sent message in a sequence
            messagesContainer.innerHTML += `
              <div class="flex items-end justify-end space-x-3 max-w-[80%] ml-auto mt-6">
                <div class="bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-2xl rounded-br-none p-4 shadow-sm">
                  <p>${message.content}</p>
                  <div class="flex items-center justify-end mt-1.5 space-x-1.5">
                    <p class="text-xs text-white/70">${time}</p>
                    <i class="fas fa-${message.read ? 'check-double' : 'check'} text-xs"></i>
                  </div>
                </div>
              </div>
            `;
          }
        } else {
          // Received message
          if (isConsecutive && index > 0) {
            // Consecutive received message (smaller avatar, less margin)
            messagesContainer.innerHTML += `
              <div class="flex items-end space-x-3 max-w-[80%] mt-1">
                <div class="w-9 flex-shrink-0"></div>
                <div class="bg-white rounded-2xl rounded-bl-none p-4 shadow-sm">
                  <p class="text-dark-800">${message.content}</p>
                  <p class="text-xs text-dark-400 mt-1.5 text-right">${time}</p>
                </div>
              </div>
            `;
          } else {
            // First received message in a sequence
            messagesContainer.innerHTML += `
              <div class="flex items-end space-x-3 max-w-[80%] mt-6">
                <img src="${activeConversationUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeConversationUser.name)}&background=0D8ABC&color=fff`}" alt="${activeConversationUser.name}" class="avatar h-9 w-9 border-2 border-primary-100 shadow-sm">
                <div class="bg-white rounded-2xl rounded-bl-none p-4 shadow-sm">
                  <p class="text-dark-800">${message.content}</p>
                  <p class="text-xs text-dark-400 mt-1.5 text-right">${time}</p>
                </div>
              </div>
            `;
          }
        }
      });
    });

    // Scroll to bottom
    scrollToBottom();
  }

  /**
   * Group messages by date
   * @param {Array} messages - The messages to group
   * @returns {Object} - Messages grouped by date
   */
  function groupMessagesByDate(messages) {
    const groups = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    messages.forEach(message => {
      const date = new Date(message.createdAt).toDateString();
      let dateKey;

      if (date === today) {
        dateKey = 'Today';
      } else if (date === yesterday) {
        dateKey = 'Yesterday';
      } else {
        dateKey = formatDate(message.createdAt);
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }

      groups[dateKey].push(message);
    });

    return groups;
  }

  /**
   * Send a message
   */
  async function sendMessage() {
    if (!messageInput || !messageInput.value.trim() || !activeConversationUser) return;

    const content = messageInput.value.trim();

    try {
      // Show sending indicator
      addTemporaryMessage(content);

      // Clear input immediately for better UX
      messageInput.value = '';

      // Send message to server
      const message = await window.MessageService.sendMessage(
        currentUser.id,
        activeConversationUser.id,
        content
      );

      // If message failed to send
      if (!message) {
        console.error('Failed to send message');
        // Remove temporary message and show error
        const tempMessage = document.querySelector('.temp-message');
        if (tempMessage) {
          tempMessage.innerHTML = `
            <div class="bg-red-100 text-red-800 rounded-2xl rounded-br-none p-4 shadow-sm">
              <p>${content}</p>
              <div class="flex items-center justify-end mt-1.5 space-x-1.5">
                <p class="text-xs text-red-500">Failed to send</p>
                <i class="fas fa-exclamation-circle text-xs"></i>
              </div>
            </div>
          `;
        }
        return;
      }

      // Reload messages
      if (activeConversation) {
        await loadMessages(activeConversation);
      } else {
        // If no active conversation, get the new conversation
        await loadConversations();

        // Find the conversation with this user
        const conversation = conversations.find(c =>
          c.user.id === activeConversationUser.id
        );

        if (conversation) {
          setActiveConversation(conversation.id);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error message
      const tempMessage = document.querySelector('.temp-message');
      if (tempMessage) {
        tempMessage.innerHTML = `
          <div class="bg-red-100 text-red-800 rounded-2xl rounded-br-none p-4 shadow-sm">
            <p>${content}</p>
            <div class="flex items-center justify-end mt-1.5 space-x-1.5">
              <p class="text-xs text-red-500">Failed to send</p>
              <i class="fas fa-exclamation-circle text-xs"></i>
            </div>
          </div>
        `;
      }
    }
  }

  /**
   * Add a temporary message to the chat while sending
   * @param {string} content - The message content
   */
  function addTemporaryMessage(content) {
    if (!messagesContainer) return;

    // Create temporary message element
    const tempMessageDiv = document.createElement('div');
    tempMessageDiv.className = 'flex items-end justify-end space-x-3 max-w-[80%] ml-auto temp-message';

    // Add sending indicator
    tempMessageDiv.innerHTML = `
      <div class="bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-2xl rounded-br-none p-4 shadow-sm opacity-70">
        <p>${content}</p>
        <div class="flex items-center justify-end mt-1.5 space-x-1.5">
          <p class="text-xs text-white/70">${getCurrentTime()}</p>
          <i class="fas fa-clock text-xs"></i>
        </div>
      </div>
    `;

    // Add to container
    messagesContainer.appendChild(tempMessageDiv);

    // Scroll to bottom
    scrollToBottom();
  }

  /**
   * Get current time formatted as HH:MM AM/PM
   * @returns {string} - Formatted time
   */
  function getCurrentTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;
  }

  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    // Send button
    if (sendButton) {
      sendButton.addEventListener('click', sendMessage);
    }

    // Message input
    if (messageInput) {
      messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          sendMessage();
        }
      });
    }

    // Search input
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();

        if (activeTab === 'primary') {
          // Filter conversations
          document.querySelectorAll('.conversation-item').forEach(item => {
            const name = item.querySelector('h4').textContent.toLowerCase();
            const lastMessage = item.querySelector('p').textContent.toLowerCase();

            if (name.includes(query) || lastMessage.includes(query)) {
              item.style.display = 'block';
            } else {
              item.style.display = 'none';
            }
          });
        } else if (activeTab === 'followed') {
          // Filter followed users
          document.querySelectorAll('.followed-user-item').forEach(item => {
            const name = item.querySelector('h4').textContent.toLowerCase();
            const username = item.querySelector('span:last-child').textContent.toLowerCase();

            if (name.includes(query) || username.includes(query)) {
              item.style.display = 'block';
            } else {
              item.style.display = 'none';
            }
          });
        }
      });
    }

    // New message button
    if (newMessageButton) {
      newMessageButton.addEventListener('click', showNewMessageModal);
    }

    // Tabs
    if (primaryTab) {
      primaryTab.addEventListener('click', function() {
        // Update active tab
        activeTab = 'primary';

        // Update UI
        primaryTab.classList.add('bg-gradient-to-r', 'from-primary-500', 'to-secondary-500', 'text-white', 'shadow');
        primaryTab.classList.remove('text-dark-600', 'hover:bg-white');

        // Update other tabs
        const followedTab = document.querySelector('.followed-tab');
        if (followedTab) {
          followedTab.classList.remove('bg-gradient-to-r', 'from-primary-500', 'to-secondary-500', 'text-white', 'shadow');
          followedTab.classList.add('text-dark-600', 'hover:bg-white');
        }

        if (requestsTab) {
          requestsTab.classList.remove('bg-gradient-to-r', 'from-primary-500', 'to-secondary-500', 'text-white', 'shadow');
          requestsTab.classList.add('text-dark-600', 'hover:bg-white');
        }

        // Show primary conversations
        loadConversations();
      });
    }

    // Followed users tab
    const followedTab = document.querySelector('.followed-tab');
    if (followedTab) {
      followedTab.addEventListener('click', function() {
        // Update active tab
        activeTab = 'followed';

        // Update UI
        followedTab.classList.add('bg-gradient-to-r', 'from-primary-500', 'to-secondary-500', 'text-white', 'shadow');
        followedTab.classList.remove('text-dark-600', 'hover:bg-white');

        // Update other tabs
        if (primaryTab) {
          primaryTab.classList.remove('bg-gradient-to-r', 'from-primary-500', 'to-secondary-500', 'text-white', 'shadow');
          primaryTab.classList.add('text-dark-600', 'hover:bg-white');
        }

        if (requestsTab) {
          requestsTab.classList.remove('bg-gradient-to-r', 'from-primary-500', 'to-secondary-500', 'text-white', 'shadow');
          requestsTab.classList.add('text-dark-600', 'hover:bg-white');
        }

        // Show followed users
        renderFollowedUsers();
      });
    }

    if (requestsTab) {
      requestsTab.addEventListener('click', function() {
        // Update active tab
        activeTab = 'requests';

        // Update UI
        requestsTab.classList.add('bg-gradient-to-r', 'from-primary-500', 'to-secondary-500', 'text-white', 'shadow');
        requestsTab.classList.remove('text-dark-600', 'hover:bg-white');

        // Update other tabs
        if (primaryTab) {
          primaryTab.classList.remove('bg-gradient-to-r', 'from-primary-500', 'to-secondary-500', 'text-white', 'shadow');
          primaryTab.classList.add('text-dark-600', 'hover:bg-white');
        }

        const followedTab = document.querySelector('.followed-tab');
        if (followedTab) {
          followedTab.classList.remove('bg-gradient-to-r', 'from-primary-500', 'to-secondary-500', 'text-white', 'shadow');
          followedTab.classList.add('text-dark-600', 'hover:bg-white');
        }

        // Show message requests (not implemented yet)
        // For now, just show a message
        if (conversationsList) {
          conversationsList.innerHTML = `
            <div class="p-4 text-center">
              <p class="text-dark-500">No message requests</p>
            </div>
          `;
        }
      });
    }

    // Back button (mobile)
    const backButton = document.querySelector('.back-button');
    if (backButton) {
      backButton.addEventListener('click', function() {
        document.querySelector('.chat-area').classList.add('hidden');
        document.querySelector('.chat-area').classList.remove('flex');
        document.querySelector('.conversations-list-container').classList.remove('hidden');
      });
    }

    // Window resize
    window.addEventListener('resize', function() {
      if (window.innerWidth >= 768) {
        // Show both panels on desktop
        if (document.querySelector('.chat-area')) {
          document.querySelector('.chat-area').classList.remove('hidden');
          document.querySelector('.chat-area').classList.add('flex');
        }
        if (document.querySelector('.conversations-list-container')) {
          document.querySelector('.conversations-list-container').classList.remove('hidden');
        }
      } else if (activeConversation) {
        // On mobile, show chat if conversation is active
        if (document.querySelector('.chat-area')) {
          document.querySelector('.chat-area').classList.remove('hidden');
          document.querySelector('.chat-area').classList.add('flex');
        }
        if (document.querySelector('.conversations-list-container')) {
          document.querySelector('.conversations-list-container').classList.add('hidden');
        }
      }
    });
  }

  /**
   * Show new message modal
   */
  function showNewMessageModal() {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-dark-900 bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md mx-4">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-dark-900">New Message</h3>
          <button class="close-modal w-8 h-8 rounded-full hover:bg-dark-50 flex items-center justify-center text-dark-500 hover:text-dark-700 transition-colors">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="mb-6">
          <label class="block text-dark-700 mb-2">To:</label>
          <input type="text" class="user-search w-full bg-dark-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all shadow-sm" placeholder="Search for a user...">
        </div>

        <div class="user-results max-h-60 overflow-y-auto mb-6">
          <!-- User results will be added here -->
        </div>

        <div class="flex justify-end">
          <button class="btn bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-2 px-6 rounded-xl shadow-sm hover:shadow-md transition-all">
            Start Chat
          </button>
        </div>
      </div>
    `;

    // Add to body
    document.body.appendChild(modal);

    // Add event listeners
    modal.querySelector('.close-modal').addEventListener('click', function() {
      document.body.removeChild(modal);
    });

    const userSearch = modal.querySelector('.user-search');
    const userResults = modal.querySelector('.user-results');

    userSearch.addEventListener('input', async function() {
      const query = this.value.trim();

      if (query.length < 2) {
        userResults.innerHTML = '';
        return;
      }

      try {
        // Search users
        const response = await fetch(`http://localhost:3001/users?q=${query}`);
        const users = await response.json();

        // Filter out current user
        const filteredUsers = users.filter(user => user.id !== currentUser.id);

        // Render results
        userResults.innerHTML = '';

        if (filteredUsers.length === 0) {
          userResults.innerHTML = `
            <div class="p-4 text-center">
              <p class="text-dark-500">No users found</p>
            </div>
          `;
          return;
        }

        filteredUsers.forEach(user => {
          const userElement = document.createElement('div');
          userElement.className = 'p-2 hover:bg-dark-50 transition-all cursor-pointer rounded-xl';
          userElement.innerHTML = `
            <div class="flex items-center space-x-4">
              <img src="${user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff`}" alt="${user.name}" class="avatar h-12 w-12 rounded-full border-2 border-dark-100 shadow-sm">
              <div>
                <h4 class="font-semibold text-dark-900">${user.name}</h4>
                <p class="text-sm text-dark-500">@${user.username}</p>
              </div>
            </div>
          `;

          userElement.addEventListener('click', function() {
            startNewConversation(user);
            document.body.removeChild(modal);
          });

          userResults.appendChild(userElement);
        });
      } catch (error) {
        console.error('Error searching users:', error);
      }
    });
  }

  /**
   * Start a new conversation with a user
   * @param {Object} user - The user to start a conversation with
   */
  async function startNewConversation(user) {
    // Set active conversation user
    activeConversationUser = user;
    activeConversation = null;

    // Update chat header
    updateChatHeader();

    // Clear messages
    if (messagesContainer) {
      messagesContainer.innerHTML = `
        <div class="flex items-center justify-center h-full">
          <div class="text-center p-8">
            <p class="text-dark-500 mb-4">No messages yet</p>
            <p class="text-dark-400 text-sm">Send a message to start the conversation</p>
          </div>
        </div>
      `;
    }

    // Show chat area on mobile
    if (window.innerWidth < 768) {
      document.querySelector('.chat-area').classList.remove('hidden');
      document.querySelector('.chat-area').classList.add('flex');
      document.querySelector('.conversations-list-container').classList.add('hidden');
    }

    // Focus on message input
    if (messageInput) {
      messageInput.focus();
    }
  }

  /**
   * Start refresh interval
   */
  function startRefreshInterval() {
    // Clear existing interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }

    // Set new interval
    refreshInterval = setInterval(async () => {
      try {
        // Don't refresh if user is typing
        if (messageInput && document.activeElement === messageInput) {
          return;
        }

        // Reload conversations
        if (activeTab === 'primary') {
          await loadConversations();
        }

        // Check for new messages if active conversation
        if (activeConversation) {
          // Get current message count
          const currentMessageCount = messages.length;

          // Get latest messages
          const latestMessages = await window.MessageService.getMessages(activeConversation);

          // If we have new messages
          if (latestMessages.length > currentMessageCount) {
            // Update messages
            messages = latestMessages;

            // Render messages
            renderMessages();

            // Mark messages as read
            await window.MessageService.markAsRead(activeConversation, currentUser.id);

            // Play notification sound if not focused
            if (!document.hasFocus()) {
              playMessageSound();
            }
          }
        }

        // Reload followed users occasionally (every 5 minutes)
        if (Date.now() % (5 * 60 * 1000) < 10000) {
          await loadFollowedUsers();

          // Update UI if on followed tab
          if (activeTab === 'followed') {
            renderFollowedUsers();
          }
        }
      } catch (error) {
        console.error('Error in refresh interval:', error);
      }
    }, 5000); // 5 seconds
  }

  /**
   * Play message notification sound
   */
  function playMessageSound() {
    try {
      // Create audio element
      const audio = new Audio('/sounds/message.mp3');

      // Set volume
      audio.volume = 0.5;

      // Play sound
      audio.play();
    } catch (error) {
      console.error('Error playing message sound:', error);
    }
  }

  /**
   * Scroll to bottom of messages container
   */
  function scrollToBottom() {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  /**
   * Format time from ISO string
   * @param {string} isoString - ISO date string
   * @returns {string} - Formatted time (e.g., "10:30 AM")
   */
  function formatTime(isoString) {
    const date = new Date(isoString);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;
  }

  /**
   * Format date from ISO string
   * @param {string} isoString - ISO date string
   * @returns {string} - Formatted date (e.g., "Apr 15, 2023")
   */
  function formatDate(isoString) {
    const date = new Date(isoString);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Format time ago from ISO string
   * @param {string} isoString - ISO date string
   * @returns {string} - Formatted time ago (e.g., "2m", "1h", "3d")
   */
  function formatTimeAgo(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) {
      return 'now';
    } else if (diffMin < 60) {
      return `${diffMin}m`;
    } else if (diffHour < 24) {
      return `${diffHour}h`;
    } else if (diffDay < 7) {
      return `${diffDay}d`;
    } else {
      return formatDate(isoString);
    }
  }
});
