/**
 * API Service for interacting with JSON Server
 * This file provides functions to interact with our JSON Server backend
 */

const API_URL = 'http://localhost:3001';

// User API functions
const UserAPI = {
  // Get all users
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/users`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  // Get user by ID
  getById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/users/${id}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      return null;
    }
  },

  // Get user by username (for login)
  getByUsername: async (username) => {
    try {
      const response = await fetch(`${API_URL}/users?username=${username}`);
      const users = await response.json();
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error(`Error fetching user by username:`, error);
      return null;
    }
  },

  // Create new user (register)
  create: async (userData) => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  },

  // Update user
  update: async (id, userData) => {
    try {
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      return await response.json();
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      return null;
    }
  },

  // Follow user
  follow: async (userId, targetId) => {
    try {
      // Get current user
      const userResponse = await fetch(`${API_URL}/users/${userId}`);
      const user = await userResponse.json();
      
      // Get target user
      const targetResponse = await fetch(`${API_URL}/users/${targetId}`);
      const target = await targetResponse.json();
      
      // Update following list for current user
      if (!user.following.includes(targetId)) {
        user.following.push(targetId);
        await fetch(`${API_URL}/users/${userId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ following: user.following }),
        });
      }
      
      // Update followers list for target user
      if (!target.followers.includes(userId)) {
        target.followers.push(userId);
        await fetch(`${API_URL}/users/${targetId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ followers: target.followers }),
        });
      }
      
      return true;
    } catch (error) {
      console.error(`Error following user:`, error);
      return false;
    }
  },

  // Unfollow user
  unfollow: async (userId, targetId) => {
    try {
      // Get current user
      const userResponse = await fetch(`${API_URL}/users/${userId}`);
      const user = await userResponse.json();
      
      // Get target user
      const targetResponse = await fetch(`${API_URL}/users/${targetId}`);
      const target = await targetResponse.json();
      
      // Update following list for current user
      user.following = user.following.filter(id => id !== targetId);
      await fetch(`${API_URL}/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ following: user.following }),
      });
      
      // Update followers list for target user
      target.followers = target.followers.filter(id => id !== userId);
      await fetch(`${API_URL}/users/${targetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ followers: target.followers }),
      });
      
      return true;
    } catch (error) {
      console.error(`Error unfollowing user:`, error);
      return false;
    }
  }
};

// Post API functions
const PostAPI = {
  // Get all posts
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/posts?_sort=createdAt&_order=desc`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  },

  // Get post by ID
  getById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/posts/${id}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching post ${id}:`, error);
      return null;
    }
  },

  // Get posts by user ID
  getByUserId: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/posts?userId=${userId}&_sort=createdAt&_order=desc`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching posts for user ${userId}:`, error);
      return [];
    }
  },

  // Create new post
  create: async (postData) => {
    try {
      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...postData,
          likes: [],
          commentsCount: 0,
          sharesCount: 0,
          createdAt: new Date().toISOString()
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating post:', error);
      return null;
    }
  },

  // Update post
  update: async (id, postData) => {
    try {
      const response = await fetch(`${API_URL}/posts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });
      return await response.json();
    } catch (error) {
      console.error(`Error updating post ${id}:`, error);
      return null;
    }
  },

  // Delete post
  delete: async (id) => {
    try {
      await fetch(`${API_URL}/posts/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error(`Error deleting post ${id}:`, error);
      return false;
    }
  },

  // Like post
  like: async (postId, userId) => {
    try {
      // Get current post
      const response = await fetch(`${API_URL}/posts/${postId}`);
      const post = await response.json();
      
      // Add user to likes if not already there
      if (!post.likes.includes(userId)) {
        post.likes.push(userId);
        await fetch(`${API_URL}/posts/${postId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ likes: post.likes }),
        });
        
        // Create notification for post owner
        if (post.userId !== userId) {
          await NotificationAPI.create({
            userId: post.userId,
            type: 'like',
            actorId: userId,
            targetId: postId,
            targetType: 'post',
            read: false,
            createdAt: new Date().toISOString()
          });
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error liking post:`, error);
      return false;
    }
  },

  // Unlike post
  unlike: async (postId, userId) => {
    try {
      // Get current post
      const response = await fetch(`${API_URL}/posts/${postId}`);
      const post = await response.json();
      
      // Remove user from likes
      post.likes = post.likes.filter(id => id !== userId);
      await fetch(`${API_URL}/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ likes: post.likes }),
      });
      
      return true;
    } catch (error) {
      console.error(`Error unliking post:`, error);
      return false;
    }
  }
};

// Comment API functions
const CommentAPI = {
  // Get comments for a post
  getByPostId: async (postId) => {
    try {
      const response = await fetch(`${API_URL}/comments?postId=${postId}&_sort=createdAt&_order=asc`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error);
      return [];
    }
  },

  // Create new comment
  create: async (commentData) => {
    try {
      // Create the comment
      const response = await fetch(`${API_URL}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...commentData,
          likes: [],
          createdAt: new Date().toISOString()
        }),
      });
      const newComment = await response.json();
      
      // Update post comment count
      const postResponse = await fetch(`${API_URL}/posts/${commentData.postId}`);
      const post = await postResponse.json();
      
      await fetch(`${API_URL}/posts/${commentData.postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          commentsCount: post.commentsCount + 1 
        }),
      });
      
      // Create notification for post owner
      if (post.userId !== commentData.userId) {
        await NotificationAPI.create({
          userId: post.userId,
          type: 'comment',
          actorId: commentData.userId,
          targetId: commentData.postId,
          targetType: 'post',
          read: false,
          createdAt: new Date().toISOString()
        });
      }
      
      return newComment;
    } catch (error) {
      console.error('Error creating comment:', error);
      return null;
    }
  },

  // Delete comment
  delete: async (id, postId) => {
    try {
      // Delete the comment
      await fetch(`${API_URL}/comments/${id}`, {
        method: 'DELETE',
      });
      
      // Update post comment count
      const postResponse = await fetch(`${API_URL}/posts/${postId}`);
      const post = await postResponse.json();
      
      await fetch(`${API_URL}/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          commentsCount: Math.max(0, post.commentsCount - 1)
        }),
      });
      
      return true;
    } catch (error) {
      console.error(`Error deleting comment ${id}:`, error);
      return false;
    }
  },

  // Like comment
  like: async (commentId, userId) => {
    try {
      // Get current comment
      const response = await fetch(`${API_URL}/comments/${commentId}`);
      const comment = await response.json();
      
      // Add user to likes if not already there
      if (!comment.likes.includes(userId)) {
        comment.likes.push(userId);
        await fetch(`${API_URL}/comments/${commentId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ likes: comment.likes }),
        });
      }
      
      return true;
    } catch (error) {
      console.error(`Error liking comment:`, error);
      return false;
    }
  },

  // Unlike comment
  unlike: async (commentId, userId) => {
    try {
      // Get current comment
      const response = await fetch(`${API_URL}/comments/${commentId}`);
      const comment = await response.json();
      
      // Remove user from likes
      comment.likes = comment.likes.filter(id => id !== userId);
      await fetch(`${API_URL}/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ likes: comment.likes }),
      });
      
      return true;
    } catch (error) {
      console.error(`Error unliking comment:`, error);
      return false;
    }
  }
};

// Story API functions
const StoryAPI = {
  // Get all active stories
  getActive: async () => {
    try {
      const now = new Date().toISOString();
      const response = await fetch(`${API_URL}/stories?expiresAt_gte=${now}&_sort=createdAt&_order=desc`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching active stories:', error);
      return [];
    }
  },

  // Get stories by user ID
  getByUserId: async (userId) => {
    try {
      const now = new Date().toISOString();
      const response = await fetch(`${API_URL}/stories?userId=${userId}&expiresAt_gte=${now}&_sort=createdAt&_order=desc`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching stories for user ${userId}:`, error);
      return [];
    }
  },

  // Create new story
  create: async (storyData) => {
    try {
      // Set expiration time to 24 hours from now
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      
      const response = await fetch(`${API_URL}/stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...storyData,
          views: [],
          createdAt: now.toISOString(),
          expiresAt: expiresAt
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating story:', error);
      return null;
    }
  },

  // View story
  view: async (storyId, userId) => {
    try {
      // Get current story
      const response = await fetch(`${API_URL}/stories/${storyId}`);
      const story = await response.json();
      
      // Add user to views if not already there
      if (!story.views.includes(userId)) {
        story.views.push(userId);
        await fetch(`${API_URL}/stories/${storyId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ views: story.views }),
        });
      }
      
      return true;
    } catch (error) {
      console.error(`Error viewing story:`, error);
      return false;
    }
  }
};

// Message API functions
const MessageAPI = {
  // Get messages for a conversation
  getByConversationId: async (conversationId) => {
    try {
      // Get conversation to find participants
      const convResponse = await fetch(`${API_URL}/conversations/${conversationId}`);
      const conversation = await convResponse.json();
      
      // Get all messages between these participants
      const [user1, user2] = conversation.participants;
      const response = await fetch(`${API_URL}/messages?senderId=${user1}&receiverId=${user2}&_sort=createdAt&_order=asc`);
      const messages1 = await response.json();
      
      const response2 = await fetch(`${API_URL}/messages?senderId=${user2}&receiverId=${user1}&_sort=createdAt&_order=asc`);
      const messages2 = await response2.json();
      
      // Combine and sort by createdAt
      const allMessages = [...messages1, ...messages2].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      return allMessages;
    } catch (error) {
      console.error(`Error fetching messages for conversation ${conversationId}:`, error);
      return [];
    }
  },

  // Get conversations for a user
  getConversations: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/conversations?participants_like=${userId}&_sort=updatedAt&_order=desc`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching conversations for user ${userId}:`, error);
      return [];
    }
  },

  // Send message
  send: async (messageData) => {
    try {
      // Create the message
      const response = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...messageData,
          read: false,
          createdAt: new Date().toISOString()
        }),
      });
      const newMessage = await response.json();
      
      // Check if conversation exists
      const { senderId, receiverId } = messageData;
      const convResponse = await fetch(`${API_URL}/conversations?participants_like=${senderId}&participants_like=${receiverId}`);
      const conversations = await convResponse.json();
      
      if (conversations.length > 0) {
        // Update existing conversation
        const conversation = conversations[0];
        await fetch(`${API_URL}/conversations/${conversation.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            lastMessageId: newMessage.id,
            updatedAt: newMessage.createdAt
          }),
        });
      } else {
        // Create new conversation
        await fetch(`${API_URL}/conversations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            participants: [senderId, receiverId],
            lastMessageId: newMessage.id,
            updatedAt: newMessage.createdAt
          }),
        });
      }
      
      return newMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  },

  // Mark messages as read
  markAsRead: async (conversationId, userId) => {
    try {
      // Get conversation to find participants
      const convResponse = await fetch(`${API_URL}/conversations/${conversationId}`);
      const conversation = await convResponse.json();
      
      // Get the other participant
      const otherUserId = conversation.participants.find(id => id !== userId);
      
      // Get all unread messages from the other user
      const response = await fetch(`${API_URL}/messages?senderId=${otherUserId}&receiverId=${userId}&read=false`);
      const unreadMessages = await response.json();
      
      // Mark each message as read
      for (const message of unreadMessages) {
        await fetch(`${API_URL}/messages/${message.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ read: true }),
        });
      }
      
      return true;
    } catch (error) {
      console.error(`Error marking messages as read:`, error);
      return false;
    }
  }
};

// Notification API functions
const NotificationAPI = {
  // Get notifications for a user
  getByUserId: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/notifications?userId=${userId}&_sort=createdAt&_order=desc`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching notifications for user ${userId}:`, error);
      return [];
    }
  },

  // Create notification
  create: async (notificationData) => {
    try {
      const response = await fetch(`${API_URL}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  },

  // Mark notification as read
  markAsRead: async (id) => {
    try {
      await fetch(`${API_URL}/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: true }),
      });
      return true;
    } catch (error) {
      console.error(`Error marking notification as read:`, error);
      return false;
    }
  },

  // Mark all notifications as read for a user
  markAllAsRead: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/notifications?userId=${userId}&read=false`);
      const notifications = await response.json();
      
      for (const notification of notifications) {
        await fetch(`${API_URL}/notifications/${notification.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ read: true }),
        });
      }
      
      return true;
    } catch (error) {
      console.error(`Error marking all notifications as read:`, error);
      return false;
    }
  }
};

// Auth API functions
const AuthAPI = {
  // Login user
  login: async (username, password) => {
    try {
      // Find user by username
      const response = await fetch(`${API_URL}/users?username=${username}`);
      const users = await response.json();
      
      if (users.length === 0) {
        return { success: false, message: 'User not found' };
      }
      
      const user = users[0];
      
      // Check password (in a real app, you would hash passwords)
      if (user.password !== password) {
        return { success: false, message: 'Invalid password' };
      }
      
      // Create session
      const sessionResponse = await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          token: generateToken(),
          createdAt: new Date().toISOString()
        }),
      });
      
      const session = await sessionResponse.json();
      
      // Store token in localStorage
      localStorage.setItem('token', session.token);
      localStorage.setItem('userId', user.id);
      
      return { 
        success: true, 
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          avatar: user.avatar
        }
      };
    } catch (error) {
      console.error('Error logging in:', error);
      return { success: false, message: 'An error occurred during login' };
    }
  },

  // Register user
  register: async (userData) => {
    try {
      // Check if username already exists
      const response = await fetch(`${API_URL}/users?username=${userData.username}`);
      const users = await response.json();
      
      if (users.length > 0) {
        return { success: false, message: 'Username already exists' };
      }
      
      // Check if email already exists
      const emailResponse = await fetch(`${API_URL}/users?email=${userData.email}`);
      const emailUsers = await emailResponse.json();
      
      if (emailUsers.length > 0) {
        return { success: false, message: 'Email already exists' };
      }
      
      // Create user
      const userResponse = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userData,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=0D8ABC&color=fff`,
          followers: [],
          following: [],
          createdAt: new Date().toISOString(),
          notifications: 0,
          messages: 0
        }),
      });
      
      const newUser = await userResponse.json();
      
      // Create session
      const sessionResponse = await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: newUser.id,
          token: generateToken(),
          createdAt: new Date().toISOString()
        }),
      });
      
      const session = await sessionResponse.json();
      
      // Store token in localStorage
      localStorage.setItem('token', session.token);
      localStorage.setItem('userId', newUser.id);
      
      return { 
        success: true, 
        user: {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          avatar: newUser.avatar
        }
      };
    } catch (error) {
      console.error('Error registering user:', error);
      return { success: false, message: 'An error occurred during registration' };
    }
  },

  // Logout user
  logout: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        // Find and delete session
        const response = await fetch(`${API_URL}/sessions?token=${token}`);
        const sessions = await response.json();
        
        if (sessions.length > 0) {
          await fetch(`${API_URL}/sessions/${sessions[0].id}`, {
            method: 'DELETE',
          });
        }
      }
      
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      
      return { success: true };
    } catch (error) {
      console.error('Error logging out:', error);
      return { success: false, message: 'An error occurred during logout' };
    }
  },

  // Check if user is logged in
  isLoggedIn: async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        return { loggedIn: false };
      }
      
      // Verify token
      const response = await fetch(`${API_URL}/sessions?token=${token}&userId=${userId}`);
      const sessions = await response.json();
      
      if (sessions.length === 0) {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        return { loggedIn: false };
      }
      
      // Get user data
      const userResponse = await fetch(`${API_URL}/users/${userId}`);
      const user = await userResponse.json();
      
      return { 
        loggedIn: true, 
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          avatar: user.avatar
        }
      };
    } catch (error) {
      console.error('Error checking login status:', error);
      return { loggedIn: false };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        return null;
      }
      
      const response = await fetch(`${API_URL}/users/${userId}`);
      return await response.json();
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
};

// Helper function to generate a random token
function generateToken() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Export all API functions
const API = {
  User: UserAPI,
  Post: PostAPI,
  Comment: CommentAPI,
  Story: StoryAPI,
  Message: MessageAPI,
  Notification: NotificationAPI,
  Auth: AuthAPI
};

// Make API available globally
window.API = API;
