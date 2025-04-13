/**
 * Comment Service
 * Handles comment-related operations using JSON Server
 */

const CommentService = {
  // API URL
  apiUrl: 'http://localhost:3001',
  
  // Get comments for a post
  getCommentsByPostId: async function(postId) {
    try {
      const response = await fetch(`${this.apiUrl}/comments?postId=${postId}&_sort=createdAt&_order=asc`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error);
      return [];
    }
  },
  
  // Create a new comment
  createComment: async function(commentData) {
    try {
      // Create the comment
      const response = await fetch(`${this.apiUrl}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...commentData,
          likes: [],
          createdAt: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create comment');
      }
      
      const newComment = await response.json();
      
      // Update post comment count
      await this.updatePostCommentCount(commentData.postId, 1);
      
      // Create notification if comment is not by the post author
      const postResponse = await fetch(`${this.apiUrl}/posts/${commentData.postId}`);
      
      if (postResponse.ok) {
        const post = await postResponse.json();
        
        if (post.userId !== commentData.userId) {
          await this.createCommentNotification(post.userId, commentData.userId, commentData.postId);
        }
      }
      
      return newComment;
    } catch (error) {
      console.error('Error creating comment:', error);
      return null;
    }
  },
  
  // Delete a comment
  deleteComment: async function(commentId, postId) {
    try {
      const response = await fetch(`${this.apiUrl}/comments/${commentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }
      
      // Update post comment count
      await this.updatePostCommentCount(postId, -1);
      
      return true;
    } catch (error) {
      console.error(`Error deleting comment ${commentId}:`, error);
      return false;
    }
  },
  
  // Like a comment
  likeComment: async function(commentId, userId) {
    try {
      // Get current comment
      const commentResponse = await fetch(`${this.apiUrl}/comments/${commentId}`);
      
      if (!commentResponse.ok) {
        throw new Error('Failed to fetch comment');
      }
      
      const comment = await commentResponse.json();
      
      // Check if user already liked the comment
      if (comment.likes.includes(userId)) {
        return { success: true, alreadyLiked: true };
      }
      
      // Add user to likes array
      const updatedLikes = [...comment.likes, userId];
      
      // Update comment
      const updateResponse = await fetch(`${this.apiUrl}/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ likes: updatedLikes })
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to like comment');
      }
      
      return { success: true, alreadyLiked: false };
    } catch (error) {
      console.error(`Error liking comment ${commentId}:`, error);
      return { success: false, message: 'Failed to like comment' };
    }
  },
  
  // Unlike a comment
  unlikeComment: async function(commentId, userId) {
    try {
      // Get current comment
      const commentResponse = await fetch(`${this.apiUrl}/comments/${commentId}`);
      
      if (!commentResponse.ok) {
        throw new Error('Failed to fetch comment');
      }
      
      const comment = await commentResponse.json();
      
      // Remove user from likes array
      const updatedLikes = comment.likes.filter(id => id !== userId);
      
      // Update comment
      const updateResponse = await fetch(`${this.apiUrl}/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ likes: updatedLikes })
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to unlike comment');
      }
      
      return { success: true };
    } catch (error) {
      console.error(`Error unliking comment ${commentId}:`, error);
      return { success: false, message: 'Failed to unlike comment' };
    }
  },
  
  // Update post comment count
  updatePostCommentCount: async function(postId, change) {
    try {
      // Get current post
      const postResponse = await fetch(`${this.apiUrl}/posts/${postId}`);
      
      if (!postResponse.ok) {
        throw new Error('Failed to fetch post');
      }
      
      const post = await postResponse.json();
      
      // Calculate new comment count
      const newCount = Math.max(0, post.commentsCount + change);
      
      // Update post
      const updateResponse = await fetch(`${this.apiUrl}/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ commentsCount: newCount })
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to update post comment count');
      }
      
      return true;
    } catch (error) {
      console.error(`Error updating post comment count:`, error);
      return false;
    }
  },
  
  // Create a comment notification
  createCommentNotification: async function(recipientId, actorId, postId) {
    try {
      const response = await fetch(`${this.apiUrl}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: recipientId,
          type: 'comment',
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

// Make CommentService available globally
window.CommentService = CommentService;
