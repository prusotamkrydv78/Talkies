// Messaging functionality using Socket.io (frontend only)
document.addEventListener('DOMContentLoaded', function() {
  // Mock data for conversations
  const conversations = [
    { id: 1, name: 'Sarah Johnson', avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=0D8ABC&color=fff', online: true, lastMessage: "That sounds great! When should we meet?", unread: 2, time: '2m' },
    { id: 2, name: 'Alex Thompson', avatar: 'https://ui-avatars.com/api/?name=Alex+Thompson&background=8B5CF6&color=fff', online: false, lastMessage: "I'll send you the files tomorrow", unread: 0, time: '1h' },
    { id: 3, name: 'Emma Wilson', avatar: 'https://ui-avatars.com/api/?name=Emma+Wilson&background=10B981&color=fff', online: true, lastMessage: "Did you see the latest update?", unread: 3, time: '3h' }
  ];

  // Mock messages for the current conversation
  let currentMessages = [
    { id: 1, sender: 'them', text: "Hey there! How's your day going?", time: '10:30 AM' },
    { id: 2, sender: 'me', text: "Pretty good! Just working on some design projects. How about you?", time: '10:32 AM', read: true },
    { id: 3, sender: 'them', text: "I'm just finishing up a presentation for tomorrow. Been quite busy lately!", time: '10:35 AM' },
    { id: 4, sender: 'them', text: "Would you like to grab coffee sometime this week?", time: '10:36 AM' },
    { id: 5, sender: 'me', text: "That sounds great! When should we meet?", time: '10:38 AM', read: true }
  ];

  // Current active conversation
  let activeConversation = conversations[0];

  // DOM elements
  const conversationsList = document.querySelector('.conversations-list');
  const messagesContainer = document.querySelector('.messages-container');
  const messageInput = document.querySelector('.message-input');
  const sendButton = document.querySelector('.send-button');
  const typingIndicator = document.querySelector('.typing-indicator');
  const videoCallButton = document.querySelector('.video-call-button');
  const audioCallButton = document.querySelector('.audio-call-button');
  const newMessageButton = document.querySelector('.new-message-button');
  const chatArea = document.querySelector('.chat-area');
  const mobileEmptyState = document.querySelector('.mobile-empty-state');

  // Initialize Socket.io (frontend mock)
  const socket = mockSocketIO();

  // Initialize the UI
  initializeUI();

  // Event listeners
  if (sendButton) {
    sendButton.addEventListener('click', sendMessage);
  }

  if (messageInput) {
    messageInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
      
      // Show typing indicator to the other user
      socket.emit('typing', { conversationId: activeConversation.id });
    });
  }

  if (videoCallButton) {
    videoCallButton.addEventListener('click', initiateVideoCall);
  }

  if (audioCallButton) {
    audioCallButton.addEventListener('click', initiateAudioCall);
  }

  if (newMessageButton) {
    newMessageButton.addEventListener('click', showNewMessageModal);
  }

  // Socket event listeners
  socket.on('message', function(data) {
    receiveMessage(data);
  });

  socket.on('typing', function(data) {
    showTypingIndicator(data);
  });

  socket.on('call', function(data) {
    receiveCall(data);
  });

  // Functions
  function initializeUI() {
    // Render conversations
    renderConversations();
    
    // Render messages for active conversation
    renderMessages();
    
    // Show/hide mobile empty state
    toggleMobileView();
    
    // Add click event to conversation items
    document.querySelectorAll('.conversation-item').forEach(item => {
      item.addEventListener('click', function() {
        const conversationId = parseInt(this.dataset.id);
        setActiveConversation(conversationId);
        toggleMobileView(true);
      });
    });
  }

  function renderConversations() {
    if (!conversationsList) return;
    
    // Clear existing conversations
    conversationsList.innerHTML = '';
    
    // Add conversations
    conversations.forEach(conversation => {
      const isActive = conversation.id === activeConversation.id;
      const html = `
        <div class="conversation-item p-2 ${isActive ? 'bg-primary-50 border-l-4 border-primary-500' : ''} hover:bg-primary-100 transition-all cursor-pointer" data-id="${conversation.id}">
          <div class="flex items-center space-x-4">
            <div class="relative">
              <img src="${conversation.avatar}" alt="${conversation.name}" class="avatar h-14 w-14 border-2 ${isActive ? 'border-primary-200' : 'border-dark-100'} shadow-sm">
              ${conversation.online ? '<div class="absolute bottom-0 rounded-full right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>' : ''}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-center">
                <h4 class="font-bold text-dark-900 truncate">${conversation.name}</h4>
                <span class="text-xs bg-dark-100 text-dark-600 px-2 py-1 rounded-full">${conversation.time}</span>
              </div>
              <div class="flex justify-between items-center mt-1">
                <p class="text-sm text-dark-600 truncate">${conversation.lastMessage}</p>
                ${conversation.unread > 0 ? `<span class="w-6 h-6 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-xs flex items-center justify-center shadow-sm ml-2">${conversation.unread}</span>` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
      conversationsList.innerHTML += html;
    });
  }

  function renderMessages() {
    if (!messagesContainer) return;
    
    // Clear existing messages
    messagesContainer.innerHTML = '';
    
    // Add date separator
    messagesContainer.innerHTML += `
      <div class="flex items-center justify-center">
        <div class="bg-white text-dark-600 text-xs px-4 py-1.5 rounded-full shadow-sm font-medium">
          Today
        </div>
      </div>
    `;
    
    // Add messages
    currentMessages.forEach(message => {
      if (message.sender === 'me') {
        messagesContainer.innerHTML += `
          <div class="flex items-end justify-end space-x-3 max-w-[80%] ml-auto">
            <div class="bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-2xl rounded-br-none p-4 shadow-sm">
              <p>${message.text}</p>
              <div class="flex items-center justify-end mt-1.5 space-x-1.5">
                <p class="text-xs text-white/70">${message.time}</p>
                <i class="fas fa-${message.read ? 'check-double' : 'check'} text-xs"></i>
              </div>
            </div>
          </div>
        `;
      } else {
        messagesContainer.innerHTML += `
          <div class="flex items-end space-x-3 max-w-[80%]">
            <img src="${activeConversation.avatar}" alt="${activeConversation.name}" class="avatar h-9 w-9 border-2 border-primary-100 shadow-sm">
            <div class="bg-white rounded-2xl rounded-bl-none p-4 shadow-sm">
              <p class="text-dark-800">${message.text}</p>
              <p class="text-xs text-dark-400 mt-1.5 text-right">${message.time}</p>
            </div>
          </div>
        `;
      }
    });
    
    // Add typing indicator if needed
    if (typingIndicator && typingIndicator.classList.contains('active')) {
      messagesContainer.innerHTML += `
        <div class="flex items-end space-x-3 max-w-[80%] typing-indicator active">
          <img src="${activeConversation.avatar}" alt="${activeConversation.name}" class="avatar h-9 w-9 border-2 border-primary-100 shadow-sm">
          <div class="bg-white rounded-2xl rounded-bl-none p-4 shadow-sm">
            <div class="flex space-x-1.5">
              <div class="w-2.5 h-2.5 rounded-full bg-primary-300 animate-bounce"></div>
              <div class="w-2.5 h-2.5 rounded-full bg-primary-400 animate-bounce" style="animation-delay: 0.2s"></div>
              <div class="w-2.5 h-2.5 rounded-full bg-primary-500 animate-bounce" style="animation-delay: 0.4s"></div>
            </div>
          </div>
        </div>
      `;
    }
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function sendMessage() {
    if (!messageInput || !messageInput.value.trim()) return;
    
    const text = messageInput.value.trim();
    const time = getCurrentTime();
    
    // Add message to current messages
    const newMessage = {
      id: currentMessages.length + 1,
      sender: 'me',
      text: text,
      time: time,
      read: false
    };
    
    currentMessages.push(newMessage);
    
    // Update conversation last message
    activeConversation.lastMessage = text;
    activeConversation.time = 'now';
    
    // Clear input
    messageInput.value = '';
    
    // Render messages
    renderMessages();
    
    // Emit message to socket
    socket.emit('message', {
      conversationId: activeConversation.id,
      message: newMessage
    });
    
    // Simulate response after delay
    simulateResponse();
  }

  function receiveMessage(data) {
    // Add message to current messages
    currentMessages.push(data.message);
    
    // Update conversation last message
    const conversation = conversations.find(c => c.id === data.conversationId);
    if (conversation) {
      conversation.lastMessage = data.message.text;
      conversation.time = 'now';
      conversation.unread = (conversation.unread || 0) + 1;
    }
    
    // Render messages and conversations
    renderMessages();
    renderConversations();
    
    // Show notification
    showNotification(data.message);
  }

  function showTypingIndicator(data) {
    if (!typingIndicator) return;
    
    // Show typing indicator
    typingIndicator.classList.add('active');
    
    // Render messages to show typing indicator
    renderMessages();
    
    // Hide typing indicator after delay
    setTimeout(() => {
      typingIndicator.classList.remove('active');
      renderMessages();
    }, 3000);
  }

  function setActiveConversation(conversationId) {
    // Find conversation
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;
    
    // Set active conversation
    activeConversation = conversation;
    
    // Reset unread count
    conversation.unread = 0;
    
    // Render conversations and messages
    renderConversations();
    renderMessages();
  }

  function toggleMobileView(showChat = false) {
    if (!chatArea || !mobileEmptyState) return;
    
    if (window.innerWidth < 768) {
      if (showChat) {
        chatArea.classList.remove('hidden');
        chatArea.classList.add('flex');
        mobileEmptyState.classList.add('hidden');
      } else {
        chatArea.classList.add('hidden');
        chatArea.classList.remove('flex');
        mobileEmptyState.classList.remove('hidden');
      }
    } else {
      chatArea.classList.remove('hidden');
      chatArea.classList.add('flex');
      mobileEmptyState.classList.add('hidden');
    }
  }

  function showNewMessageModal() {
    // Create modal for new message
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-dark-900 bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-bold text-xl text-dark-900">New Message</h3>
          <button class="close-modal text-dark-500 hover:text-dark-700">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="mb-4">
          <label class="block text-dark-700 text-sm font-medium mb-2">To:</label>
          <input type="text" class="w-full bg-dark-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all shadow-sm" placeholder="Search for a user...">
        </div>
        <div class="mb-4">
          <label class="block text-dark-700 text-sm font-medium mb-2">Message:</label>
          <textarea class="w-full bg-dark-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all shadow-sm h-32" placeholder="Type your message..."></textarea>
        </div>
        <div class="flex justify-end">
          <button class="btn bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-2.5 px-6 rounded-xl shadow-sm hover:shadow-md transition-all">
            Send Message
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listener to close button
    modal.querySelector('.close-modal').addEventListener('click', function() {
      document.body.removeChild(modal);
    });
  }

  function showNotification(message) {
    // Check if browser supports notifications
    if (!("Notification" in window)) return;
    
    // Check if permission is granted
    if (Notification.permission === "granted") {
      createNotification(message);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(function (permission) {
        if (permission === "granted") {
          createNotification(message);
        }
      });
    }
  }

  function createNotification(message) {
    const notification = new Notification(activeConversation.name, {
      body: message.text,
      icon: activeConversation.avatar
    });
    
    notification.onclick = function() {
      window.focus();
      this.close();
    };
  }

  function getCurrentTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    return `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;
  }

  function simulateResponse() {
    // Hide typing indicator after delay
    setTimeout(() => {
      // Show typing indicator
      socket.emit('typing', { conversationId: activeConversation.id });
      
      // Send response after delay
      setTimeout(() => {
        const responses = [
          "How about Wednesday at 2pm?",
          "That works for me! Looking forward to it.",
          "I'll be free on Thursday if that works for you?",
          "Great! I'll send you the details later.",
          "Perfect! See you then."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const time = getCurrentTime();
        
        const responseMessage = {
          id: currentMessages.length + 1,
          sender: 'them',
          text: randomResponse,
          time: time
        };
        
        socket.emit('message', {
          conversationId: activeConversation.id,
          message: responseMessage
        });
      }, 3000);
    }, 1000);
  }

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
