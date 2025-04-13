/**
 * User Service
 * Handles user-related operations using JSON Server
 */

const UserService = {
  // API URL
  apiUrl: 'http://localhost:3001',
  
  // Get all users
  getAllUsers: async function() {
    try {
      const response = await fetch(`${this.apiUrl}/users`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },
  
  // Get user by ID
  getUserById: async function(userId) {
    try {
      const response = await fetch(`${this.apiUrl}/users/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      return null;
    }
  },
  
  // Get user by username
  getUserByUsername: async function(username) {
    try {
      const response = await fetch(`${this.apiUrl}/users?username=${username}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      
      const users = await response.json();
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error(`Error fetching user by username:`, error);
      return null;
    }
  },
  
  // Follow a user
  followUser: async function(userId, targetId) {
    try {
      // Get current user
      const userResponse = await fetch(`${this.apiUrl}/users/${userId}`);
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user');
      }
      
      const user = await userResponse.json();
      
      // Get target user
      const targetResponse = await fetch(`${this.apiUrl}/users/${targetId}`);
      
      if (!targetResponse.ok) {
        throw new Error('Failed to fetch target user');
      }
      
      const targetUser = await targetResponse.json();
      
      // Check if already following
      if (user.following.includes(targetId)) {
        return { success: true, alreadyFollowing: true };
      }
      
      // Update current user's following list
      const updatedFollowing = [...user.following, targetId];
      
      const updateUserResponse = await fetch(`${this.apiUrl}/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ following: updatedFollowing })
      });
      
      if (!updateUserResponse.ok) {
        throw new Error('Failed to update user');
      }
      
      // Update target user's followers list
      const updatedFollowers = [...targetUser.followers, userId];
      
      const updateTargetResponse = await fetch(`${this.apiUrl}/users/${targetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ followers: updatedFollowers })
      });
      
      if (!updateTargetResponse.ok) {
        throw new Error('Failed to update target user');
      }
      
      // Create follow notification
      await this.createFollowNotification(targetId, userId);
      
      // Update local storage if current user
      const currentUser = AuthService.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        currentUser.following = updatedFollowing;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
      }
      
      return { success: true, alreadyFollowing: false };
    } catch (error) {
      console.error(`Error following user:`, error);
      return { success: false, message: 'Failed to follow user' };
    }
  },
  
  // Unfollow a user
  unfollowUser: async function(userId, targetId) {
    try {
      // Get current user
      const userResponse = await fetch(`${this.apiUrl}/users/${userId}`);
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user');
      }
      
      const user = await userResponse.json();
      
      // Get target user
      const targetResponse = await fetch(`${this.apiUrl}/users/${targetId}`);
      
      if (!targetResponse.ok) {
        throw new Error('Failed to fetch target user');
      }
      
      const targetUser = await targetResponse.json();
      
      // Update current user's following list
      const updatedFollowing = user.following.filter(id => id !== targetId);
      
      const updateUserResponse = await fetch(`${this.apiUrl}/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ following: updatedFollowing })
      });
      
      if (!updateUserResponse.ok) {
        throw new Error('Failed to update user');
      }
      
      // Update target user's followers list
      const updatedFollowers = targetUser.followers.filter(id => id !== userId);
      
      const updateTargetResponse = await fetch(`${this.apiUrl}/users/${targetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ followers: updatedFollowers })
      });
      
      if (!updateTargetResponse.ok) {
        throw new Error('Failed to update target user');
      }
      
      // Update local storage if current user
      const currentUser = AuthService.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        currentUser.following = updatedFollowing;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
      }
      
      return { success: true };
    } catch (error) {
      console.error(`Error unfollowing user:`, error);
      return { success: false, message: 'Failed to unfollow user' };
    }
  },
  
  // Get followers
  getFollowers: async function(userId) {
    try {
      // Get user
      const userResponse = await fetch(`${this.apiUrl}/users/${userId}`);
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user');
      }
      
      const user = await userResponse.json();
      
      // Get follower details
      const followers = [];
      
      for (const followerId of user.followers) {
        const followerResponse = await fetch(`${this.apiUrl}/users/${followerId}`);
        
        if (followerResponse.ok) {
          const follower = await followerResponse.json();
          // Remove sensitive information
          const { password, email, ...safeFollower } = follower;
          followers.push(safeFollower);
        }
      }
      
      return followers;
    } catch (error) {
      console.error(`Error fetching followers:`, error);
      return [];
    }
  },
  
  // Get following
  getFollowing: async function(userId) {
    try {
      // Get user
      const userResponse = await fetch(`${this.apiUrl}/users/${userId}`);
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user');
      }
      
      const user = await userResponse.json();
      
      // Get following details
      const following = [];
      
      for (const followingId of user.following) {
        const followingResponse = await fetch(`${this.apiUrl}/users/${followingId}`);
        
        if (followingResponse.ok) {
          const followingUser = await followingResponse.json();
          // Remove sensitive information
          const { password, email, ...safeFollowing } = followingUser;
          following.push(safeFollowing);
        }
      }
      
      return following;
    } catch (error) {
      console.error(`Error fetching following:`, error);
      return [];
    }
  },
  
  // Create a follow notification
  createFollowNotification: async function(recipientId, actorId) {
    try {
      const response = await fetch(`${this.apiUrl}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: recipientId,
          type: 'follow',
          actorId: actorId,
          targetId: null,
          targetType: null,
          read: false,
          createdAt: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create notification');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }
};

// Make UserService available globally
window.UserService = UserService;
