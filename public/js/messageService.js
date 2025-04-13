/**
 * Message Service
 * Handles message-related operations using JSON Server
 */

const MessageService = {
  // API URL
  apiUrl: 'http://localhost:3001',
  
  // Get conversations for a user
  getConversations: async function(userId) {
    try {
      // Find conversations where user is a participant
      const response = await fetch(`${this.apiUrl}/conversations?participants_like=${userId}&_sort=updatedAt&_order=desc`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const conversations = await response.json();
      
      // Enhance conversations with additional data
      const enhancedConversations = [];
      
      for (const conversation of conversations) {
        // Get the other participant
        const otherUserId = conversation.participants.find(id => id !== userId);
        
        // Get user details
        const userResponse = await fetch(`${this.apiUrl}/users/${otherUserId}`);
        
        if (!userResponse.ok) {
          continue;
        }
        
        const user = await userResponse.json();
        
        // Get last message
        let lastMessage = null;
        
        if (conversation.lastMessageId) {
          const messageResponse = await fetch(`${this.apiUrl}/messages/${conversation.lastMessageId}`);
          
          if (messageResponse.ok) {
            lastMessage = await messageResponse.json();
          }
        }
        
        // Get unread count
        const unreadResponse = await fetch(`${this.apiUrl}/messages?receiverId=${userId}&senderId=${otherUserId}&read=false`);
        
        if (!unreadResponse.ok) {
          continue;
        }
        
        const unreadMessages = await unreadResponse.json();
        
        enhancedConversations.push({
          id: conversation.id,
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            avatar: user.avatar
          },
          lastMessage,
          unreadCount: unreadMessages.length,
          updatedAt: conversation.updatedAt
        });
      }
      
      return enhancedConversations;
    } catch (error) {
      console.error(`Error fetching conversations:`, error);
      return [];
    }
  },
  
  // Get messages for a conversation
  getMessages: async function(conversationId) {
    try {
      // Get conversation
      const conversationResponse = await fetch(`${this.apiUrl}/conversations/${conversationId}`);
      
      if (!conversationResponse.ok) {
        throw new Error('Failed to fetch conversation');
      }
      
      const conversation = await conversationResponse.json();
      
      // Get messages between participants
      const [user1, user2] = conversation.participants;
      
      const messages1Response = await fetch(`${this.apiUrl}/messages?senderId=${user1}&receiverId=${user2}&_sort=createdAt&_order=asc`);
      const messages2Response = await fetch(`${this.apiUrl}/messages?senderId=${user2}&receiverId=${user1}&_sort=createdAt&_order=asc`);
      
      if (!messages1Response.ok || !messages2Response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const messages1 = await messages1Response.json();
      const messages2 = await messages2Response.json();
      
      // Combine and sort messages
      const allMessages = [...messages1, ...messages2].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      return allMessages;
    } catch (error) {
      console.error(`Error fetching messages:`, error);
      return [];
    }
  },
  
  // Send a message
  sendMessage: async function(senderId, receiverId, content) {
    try {
      // Create message
      const messageResponse = await fetch(`${this.apiUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          senderId,
          receiverId,
          content,
          read: false,
          createdAt: new Date().toISOString()
        })
      });
      
      if (!messageResponse.ok) {
        throw new Error('Failed to send message');
      }
      
      const message = await messageResponse.json();
      
      // Check if conversation exists
      const conversationResponse = await fetch(`${this.apiUrl}/conversations?participants_like=${senderId}&participants_like=${receiverId}`);
      
      if (!conversationResponse.ok) {
        throw new Error('Failed to check conversation');
      }
      
      const conversations = await conversationResponse.json();
      
      if (conversations.length > 0) {
        // Update existing conversation
        const conversation = conversations[0];
        
        await fetch(`${this.apiUrl}/conversations/${conversation.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            lastMessageId: message.id,
            updatedAt: message.createdAt
          })
        });
      } else {
        // Create new conversation
        await fetch(`${this.apiUrl}/conversations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            participants: [senderId, receiverId],
            lastMessageId: message.id,
            updatedAt: message.createdAt
          })
        });
      }
      
      return message;
    } catch (error) {
      console.error(`Error sending message:`, error);
      return null;
    }
  },
  
  // Mark messages as read
  markAsRead: async function(conversationId, userId) {
    try {
      // Get conversation
      const conversationResponse = await fetch(`${this.apiUrl}/conversations/${conversationId}`);
      
      if (!conversationResponse.ok) {
        throw new Error('Failed to fetch conversation');
      }
      
      const conversation = await conversationResponse.json();
      
      // Get the other participant
      const otherUserId = conversation.participants.find(id => id !== userId);
      
      // Get unread messages
      const unreadResponse = await fetch(`${this.apiUrl}/messages?receiverId=${userId}&senderId=${otherUserId}&read=false`);
      
      if (!unreadResponse.ok) {
        throw new Error('Failed to fetch unread messages');
      }
      
      const unreadMessages = await unreadResponse.json();
      
      // Mark each message as read
      for (const message of unreadMessages) {
        await fetch(`${this.apiUrl}/messages/${message.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ read: true })
        });
      }
      
      return true;
    } catch (error) {
      console.error(`Error marking messages as read:`, error);
      return false;
    }
  },
  
  // Get conversation by user IDs
  getConversationByUsers: async function(user1Id, user2Id) {
    try {
      const response = await fetch(`${this.apiUrl}/conversations?participants_like=${user1Id}&participants_like=${user2Id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversation');
      }
      
      const conversations = await response.json();
      
      if (conversations.length > 0) {
        return conversations[0];
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching conversation:`, error);
      return null;
    }
  }
};

// Make MessageService available globally
window.MessageService = MessageService;
