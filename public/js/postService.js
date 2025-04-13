/**
 * Post Service
 * Handles post-related operations using JSON Server
 */

const PostService = {
  // API URL
  apiUrl: 'http://localhost:3001',
  
  // Get all posts
  getAllPosts: async function() {
    try {
      const response = await fetch(`${this.apiUrl}/posts?_sort=createdAt&_order=desc`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  },
  
  // Get post by ID
  getPostById: async function(postId) {
    try {
      const response = await fetch(`${this.apiUrl}/posts/${postId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch post');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching post ${postId}:`, error);
      return null;
    }
  },
  
  // Get posts by user ID
  getPostsByUserId: async function(userId) {
    try {
      const response = await fetch(`${this.apiUrl}/posts?userId=${userId}&_sort=createdAt&_order=desc`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user posts');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching posts for user ${userId}:`, error);
      return [];
    }
  },
  
  // Create a new post
  createPost: async function(postData) {
    try {
      const response = await fetch(`${this.apiUrl}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...postData,
          likes: [],
          commentsCount: 0,
          sharesCount: 0,
          createdAt: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating post:', error);
      return null;
    }
  },
  
  // Update a post
  updatePost: async function(postId, postData) {
    try {
      const response = await fetch(`${this.apiUrl}/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update post');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating post ${postId}:`, error);
      return null;
    }
  },
  
  // Delete a post
  deletePost: async function(postId) {
    try {
      const response = await fetch(`${this.apiUrl}/posts/${postId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete post');
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting post ${postId}:`, error);
      return false;
    }
  },
  
  // Like a post
  likePost: async function(postId, userId) {
    try {
      // Get current post
      const postResponse = await fetch(`${this.apiUrl}/posts/${postId}`);
      
      if (!postResponse.ok) {
        throw new Error('Failed to fetch post');
      }
      
      const post = await postResponse.json();
      
      // Check if user already liked the post
      if (post.likes.includes(userId)) {
        return { success: true, alreadyLiked: true };
      }
      
      // Add user to likes array
      const updatedLikes = [...post.likes, userId];
      
      // Update post
      const updateResponse = await fetch(`${this.apiUrl}/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ likes: updatedLikes })
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to like post');
      }
      
      // Create notification if post is not by the current user
      if (post.userId !== userId) {
        await this.createLikeNotification(post.userId, userId, postId);
      }
      
      return { success: true, alreadyLiked: false };
    } catch (error) {
      console.error(`Error liking post ${postId}:`, error);
      return { success: false, message: 'Failed to like post' };
    }
  },
  
  // Unlike a post
  unlikePost: async function(postId, userId) {
    try {
      // Get current post
      const postResponse = await fetch(`${this.apiUrl}/posts/${postId}`);
      
      if (!postResponse.ok) {
        throw new Error('Failed to fetch post');
      }
      
      const post = await postResponse.json();
      
      // Remove user from likes array
      const updatedLikes = post.likes.filter(id => id !== userId);
      
      // Update post
      const updateResponse = await fetch(`${this.apiUrl}/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ likes: updatedLikes })
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to unlike post');
      }
      
      return { success: true };
    } catch (error) {
      console.error(`Error unliking post ${postId}:`, error);
      return { success: false, message: 'Failed to unlike post' };
    }
  },
  
  // Create a like notification
  createLikeNotification: async function(recipientId, actorId, postId) {
    try {
      const response = await fetch(`${this.apiUrl}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: recipientId,
          type: 'like',
          actorId: actorId,
          targetId: postId,
          targetType: 'post',
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

// Make PostService available globally
window.PostService = PostService;
