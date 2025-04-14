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

  // Create a new post with media
  createPostWithMedia: async function(postData, mediaFile) {
    try {
      // First upload the media file if provided
      let mediaUrl = null;
      if (mediaFile) {
        mediaUrl = await FileUploadService.saveFile(mediaFile, 'posts');
        if (!mediaUrl) {
          throw new Error('Failed to upload media');
        }
      }

      // Prepare media array for the post
      const media = mediaUrl ? [{ type: mediaFile.type.startsWith('image/') ? 'image' : 'video', url: mediaUrl }] : [];

      // Create the post with the media URL
      const response = await fetch(`${this.apiUrl}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...postData,
          media: media,
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
        console.log('Creating like notification:', { recipientId: post.userId, actorId: userId, postId });
        const notification = await this.createLikeNotification(post.userId, userId, postId);
        console.log('Notification created:', notification);
      } else {
        console.log('Not creating notification - user liked their own post');
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
      console.log('Creating notification with data:', {
        userId: recipientId,
        type: 'like',
        actorId: actorId,
        targetId: postId,
        targetType: 'post'
      });

      const notificationData = {
        userId: recipientId,
        type: 'like',
        actorId: actorId,
        targetId: postId,
        targetType: 'post',
        read: false,
        createdAt: new Date().toISOString()
      };

      console.log('Sending POST request to:', `${this.apiUrl}/notifications`);
      console.log('With body:', JSON.stringify(notificationData));

      const response = await fetch(`${this.apiUrl}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationData)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to create notification: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('Notification created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }
};

// Make PostService available globally
window.PostService = PostService;
