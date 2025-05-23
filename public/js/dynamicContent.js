/**
 * Dynamic Content - Fetch and display content from db.json
 * This file handles loading stories, posts, and suggestions from the JSON Server
 */

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  if (currentUser) {
    // Load dynamic content
    loadDynamicContent(currentUser);
  }
});

/**
 * Load all dynamic content for the home page
 * @param {Object} currentUser - The logged-in user
 */
async function loadDynamicContent(currentUser) {
  try {
    // Load stories
    await loadStories(currentUser);

    // Load posts
    await loadPosts(currentUser);

    // Load suggestions
    await loadSuggestions(currentUser);
  } catch (error) {
    console.error('Error loading dynamic content:', error);
  }
}

/**
 * Load stories for the home page
 * @param {Object} currentUser - The logged-in user
 */
async function loadStories(currentUser) {
  try {
    // Get the stories container
    const storiesContainer = document.querySelector('.stories-container');
    if (!storiesContainer) return;

    // Save the "Add Story" item if it exists
    const addStoryItem = storiesContainer.querySelector('a[href="/create-story"]');
    
    // Clear the container
    storiesContainer.innerHTML = '';

    // Add back the "Add Story" item if it exists
    if (addStoryItem) {
      storiesContainer.appendChild(addStoryItem);
    } else {
      // Create a new "Add Story" item if it doesn't exist
      const newAddStoryItem = document.createElement('a');
      newAddStoryItem.href = '/create-story';
      newAddStoryItem.className = 'flex-shrink-0 w-[180px] md:w-[220px] relative group cursor-pointer';
      newAddStoryItem.innerHTML = `
        <div class="aspect-[3/4] w-full rounded-2xl bg-dark-50 overflow-hidden flex flex-col items-center justify-center shadow-md h-48 md:h-64">
          <div class="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-500 mb-3">
            <i class="fas fa-plus text-xl"></i>
          </div>
          <span class="text-sm font-medium text-dark-700">Add Story</span>
        </div>
      `;
      storiesContainer.appendChild(newAddStoryItem);
    }

    // Fetch stories from db.json
    const response = await fetch('http://localhost:3001/stories');
    const stories = await response.json();

    // Filter active stories (not expired)
    const now = new Date().toISOString();
    const activeStories = stories.filter(story => story.expiresAt > now);

    // Filter stories to only show those from users the current user follows
    // Also include the current user's own stories
    const followedUserIds = currentUser.following || [];
    const filteredStories = activeStories.filter(story => 
      story.userId === currentUser.id || // User's own stories
      followedUserIds.includes(story.userId) // Stories from followed users
    );

    // Sort stories by creation date (newest first)
    filteredStories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Limit to 5 stories on the home page
    const homePageStories = filteredStories.slice(0, 5);

    // Create HTML for each story
    for (const story of homePageStories) {
      // Get user data
      const userResponse = await fetch(`http://localhost:3001/users/${story.userId}`);
      const user = await userResponse.json();

      // Create story element
      const storyElement = document.createElement('div');
      storyElement.className = 'flex-shrink-0 w-[180px] md:w-[220px] relative group cursor-pointer';
      storyElement.innerHTML = `
        <div class="aspect-[3/4] w-full rounded-2xl overflow-hidden shadow-md h-48 md:h-64">
          <img src="${story.media}" alt="${user.name}'s story" class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          
          <!-- Story Header -->
          <div class="absolute top-3 left-3 right-3">
            <div class="flex items-center">
              <div class="w-8 h-8 rounded-full border-2 border-primary-500 overflow-hidden">
                <img src="${user.avatar}" alt="${user.name}" class="w-full h-full object-cover">
              </div>
              <div class="ml-2">
                <p class="text-white text-xs font-medium">${user.name}</p>
                <p class="text-white/70 text-xs">${timeAgo(story.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      `;

      // Add click event to view story
      storyElement.addEventListener('click', () => viewStory(story, user, currentUser));

      // Add to container
      storiesContainer.appendChild(storyElement);
    }

    // Add "View More" story if there are more stories than shown
    if (filteredStories.length > homePageStories.length) {
      const viewMoreElement = document.createElement('a');
      viewMoreElement.href = '/stories';
      viewMoreElement.className = 'flex-shrink-0 w-[180px] md:w-[220px] relative group cursor-pointer';
      viewMoreElement.innerHTML = `
        <div class="aspect-[3/4] w-full rounded-2xl bg-dark-50 overflow-hidden flex flex-col items-center justify-center shadow-md h-48 md:h-64">
          <div class="w-14 h-14 rounded-full bg-gradient-to-r from-primary-100 to-secondary-100 flex items-center justify-center text-primary-500 mb-3">
            <i class="fas fa-ellipsis-h text-xl"></i>
          </div>
          <span class="text-sm font-medium text-dark-700">View All Stories</span>
          <span class="text-xs text-dark-500 mt-1">${filteredStories.length - homePageStories.length} more</span>
        </div>
      `;
      storiesContainer.appendChild(viewMoreElement);
    }

  } catch (error) {
    console.error('Error loading stories:', error);
  }
}

/**
 * Close the story viewer
 * @param {HTMLElement} storyViewer - The story viewer element to close
 */
function closeStory(storyViewer) {
  // Add fade-out animation
  storyViewer.classList.add('fade-out');
  
  // Remove after animation completes
  setTimeout(() => {
    if (storyViewer && storyViewer.parentNode) {
      storyViewer.parentNode.removeChild(storyViewer);
    }
  }, 300);
}

/**
 * View a story
 * @param {Object} story - The story object
 * @param {Object} user - The user who created the story
 * @param {Object} currentUser - The current user
 */
function viewStory(story, user, currentUser) {
  // Create story viewer modal
  const storyViewer = document.createElement('div');
  storyViewer.className = 'story-viewer';

  // Calculate time ago
  const timeAgo = getTimeAgo(story.createdAt);
  
  // Check if current user has liked the story
  const isLiked = story.likes && story.likes.includes(currentUser.id);

  storyViewer.innerHTML = `
    <div class="relative w-full max-w-lg mx-auto">
      <!-- Story header -->
      <div class="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
        <div class="flex items-center">
          <img src="${user.avatar}" alt="${user.name}" class="w-10 h-10 rounded-full border-2 border-white">
          <div class="ml-2 text-white">
            <p class="font-semibold">${user.name}</p>
            <p class="text-xs opacity-80">${timeAgo}</p>
          </div>
        </div>
        <button class="close-story text-white text-xl">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Story content -->
      <div class="story-content">
        <img src="${story.media.url}" alt="Story" class="w-full h-full object-contain">
      </div>
      
      <!-- Story caption -->
      <div class="absolute bottom-20 left-4 right-4 bg-black bg-opacity-50 p-3 rounded-lg">
        <p class="text-white">${story.caption || 'No caption'}</p>
      </div>

      <!-- Story actions -->
      <div class="absolute bottom-4 left-4 right-4 flex items-center space-x-2">
        <button class="like-story-btn flex items-center justify-center bg-black bg-opacity-50 text-white rounded-full w-12 h-12 ${isLiked ? 'text-red-500' : ''}" data-story-id="${story.id}">
          <i class="fas fa-heart text-xl"></i>
        </button>
        <div class="flex-1 relative">
          <input type="text" placeholder="Send a comment..." class="story-comment-input w-full bg-black bg-opacity-50 text-white border-none rounded-full py-3 pl-4 pr-12 focus:ring-2 focus:ring-primary-500">
          <button class="send-story-comment-btn absolute right-2 top-1/2 transform -translate-y-1/2 text-white" data-story-id="${story.id}">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>

      <!-- Story progress -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-dark-500 bg-opacity-50">
        <div class="story-progress h-full bg-white" style="width: 0%"></div>
      </div>
    </div>
  `;

  // Add to body
  document.body.appendChild(storyViewer);

  // Start progress
  const progressBar = storyViewer.querySelector('.story-progress');
  let progress = 0;
  let isPaused = false;
  let interval;
  
  // Function to start/resume the progress
  const startProgress = () => {
    interval = setInterval(() => {
      if (!isPaused) {
        progress += 1;
        progressBar.style.width = `${progress}%`;
        
        if (progress >= 100) {
          clearInterval(interval);
          closeStory(storyViewer);
        }
      }
    }, 50); // 5 seconds total (50ms * 100)
  };
  
  // Start the progress initially
  startProgress();

  // Pause progress when user focuses on comment input
  const commentInput = storyViewer.querySelector('.story-comment-input');
  commentInput.addEventListener('focus', () => {
    isPaused = true;
    clearInterval(interval);
  });
  
  // Resume progress when user blurs from comment input
  commentInput.addEventListener('blur', () => {
    // Only resume if not submitting a comment
    if (!commentInput.value.trim()) {
      isPaused = false;
      startProgress();
    }
  });

  // Close button
  const closeBtn = storyViewer.querySelector('.close-story');
  closeBtn.addEventListener('click', () => {
    clearInterval(interval);
    closeStory(storyViewer);
  });

  // Like button
  const likeBtn = storyViewer.querySelector('.like-story-btn');
  likeBtn.addEventListener('click', () => toggleLikeStory(story.id, currentUser.id, likeBtn));

  // Comment button
  const sendCommentBtn = storyViewer.querySelector('.send-story-comment-btn');
  
  sendCommentBtn.addEventListener('click', () => {
    if (commentInput.value.trim()) {
      // Pause the timer while submitting comment
      isPaused = true;
      clearInterval(interval);
      
      addStoryComment(story.id, currentUser.id, commentInput.value.trim());
      commentInput.value = '';
      
      // Resume the timer after submitting
      setTimeout(() => {
        isPaused = false;
        startProgress();
      }, 1000); // Give user a moment to see the success message
    }
  });
  
  commentInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && commentInput.value.trim()) {
      // Pause the timer while submitting comment
      isPaused = true;
      clearInterval(interval);
      
      addStoryComment(story.id, currentUser.id, commentInput.value.trim());
      commentInput.value = '';
      
      // Resume the timer after submitting
      setTimeout(() => {
        isPaused = false;
        startProgress();
      }, 1000); // Give user a moment to see the success message
    }
  });

  // Mark story as viewed
  markStoryAsViewed(story.id, currentUser.id);
}

/**
 * Mark a story as viewed
 * @param {string} storyId - The story ID
 * @param {string} userId - The current user ID
 */
async function markStoryAsViewed(storyId, userId) {
  try {
    // Get current story
    const response = await fetch(`http://localhost:3001/stories/${storyId}`);
    const story = await response.json();

    // Check if already viewed
    if (story.views && story.views.includes(userId)) return;

    // Add user to views
    const views = story.views || [];
    views.push(userId);

    // Update story
    await fetch(`http://localhost:3001/stories/${storyId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ views })
    });

    // Update UI
    const storyItem = document.querySelector(`.story-item[data-story-id="${storyId}"]`);
    if (storyItem) {
      const storyRing = storyItem.querySelector('div.rounded-full');
      if (storyRing) {
        storyRing.classList.remove('border-gradient-primary');
        storyRing.classList.add('border-dark-200');
      }
    }
  } catch (error) {
    console.error('Error marking story as viewed:', error);
  }
}

/**
 * Load and display posts
 * @param {Object} currentUser - The logged-in user
 */
async function loadPosts(currentUser) {
  try {
    // Get posts container
    const postsContainer = document.querySelector('.posts-container');

    if (!postsContainer) return;

    // Save the header
    const header = postsContainer.querySelector('h3');

    // Clear existing content
    postsContainer.innerHTML = '';

    // Add back the header
    if (header) {
      postsContainer.appendChild(header);
    } else {
      // Create a new header if it doesn't exist
      const newHeader = document.createElement('h3');
      newHeader.className = 'font-semibold text-dark-900 flex items-center mb-5';
      newHeader.innerHTML = `
        <div class="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white mr-3">
          <i class="fas fa-stream"></i>
        </div>
        <span class="text-lg">Your Feed</span>
      `;
      postsContainer.appendChild(newHeader);
    }

    // Fetch posts from db.json
    const response = await fetch('http://localhost:3001/posts?_sort=createdAt&_order=desc');
    const posts = await response.json();

    // Process each post
    for (const post of posts) {
      // Get user data for the post
      const userResponse = await fetch(`http://localhost:3001/users/${post.userId}`);
      const user = await userResponse.json();

      // Get all comments for the post (including replies)
      const commentsResponse = await fetch(`http://localhost:3001/comments?postId=${post.id}&_sort=createdAt&_order=asc`);
      const allComments = await commentsResponse.json();

      // Separate parent comments and replies
      const comments = allComments.filter(comment => !comment.parentId);
      const replies = allComments.filter(comment => comment.parentId);

      // Check if current user has liked the post
      const isLiked = post.likes && post.likes.includes(currentUser.id);

      // Create post element
      const postElement = document.createElement('div');
      postElement.className = 'bg-white rounded-2xl shadow-sm mb-8';
      postElement.dataset.postId = post.id;

      // Calculate time ago
      const timeAgo = getTimeAgo(post.createdAt);

      // Post header
      let postHTML = `
        <div class="p-4 border-b border-dark-100">
          <div class="flex justify-between items-center">
            <div class="flex items-center space-x-3">
              <img src="${user.avatar}" alt="${user.name}" class="w-10 h-10 rounded-full">
              <div>
                <h4 class="font-semibold text-dark-800">${user.name}</h4>
                <p class="text-dark-500 text-xs">${timeAgo}</p>
              </div>
            </div>
            <button class="text-dark-500 hover:text-dark-700">
              <i class="fas fa-ellipsis-h"></i>
            </button>
          </div>
        </div>
      `;

      // Post content
      postHTML += `
        <div class="p-4">
          <p class="text-dark-800 mb-4">${formatPostContent(post.content)}</p>
      `;

      // Post media
      if (post.media && post.media.length > 0) {
        postHTML += `
          <div class="rounded-xl overflow-hidden mb-4">
            <img src="${post.media[0].url}" alt="Post image" class="w-full h-auto">
          </div>
        `;
      }

      // Post stats
      postHTML += `
          <div class="flex justify-between items-center text-dark-500 text-sm mb-4">
            <div class="flex items-center">
              <div class="flex -space-x-1 mr-2">
                <div class="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white">
                  <i class="fas fa-heart text-xs"></i>
                </div>
              </div>
              <span>${formatNumber(post.likes ? post.likes.length : 0)} likes</span>
            </div>
            <div class="flex items-center space-x-4">
              <div class="flex items-center">
                <i class="fas fa-comment text-dark-400 mr-1"></i>
                <span>${formatNumber(post.commentsCount)} comments</span>
              </div>
              <div class="flex items-center">
                <i class="fas fa-share text-dark-400 mr-1"></i>
                <span>${formatNumber(post.sharesCount)} shares</span>
              </div>
            </div>
          </div>
        </div>
      `;

      // Post actions
      postHTML += `
        <div class="px-4 py-2 border-t border-b border-dark-100">
          <div class="flex justify-between">
            <button class="like-button flex-1 flex items-center justify-center py-2 text-dark-500 hover:bg-dark-50 rounded-lg transition-colors" data-post-id="${post.id}">
              <i class="fas fa-heart ${isLiked ? 'text-red-500' : 'text-dark-500'}"></i>
              <span class="ml-2">Like</span>
            </button>
            <button class="comment-button flex-1 flex items-center justify-center py-2 text-dark-500 hover:bg-dark-50 rounded-lg transition-colors">
              <i class="fas fa-comment"></i>
              <span class="ml-2">Comment</span>
            </button>
            <button class="flex-1 flex items-center justify-center py-2 text-dark-500 hover:bg-dark-50 rounded-lg transition-colors">
              <i class="fas fa-share"></i>
              <span class="ml-2">Share</span>
            </button>
          </div>
        </div>
      `;

      // Comments section
      postHTML += `<div class="p-4 space-y-4 comments-section" data-post-id="${post.id}">`;

      // Show up to 2 comments initially
      const displayComments = comments.slice(0, 2);
      const hiddenComments = comments.length > 2 ? comments.slice(2) : [];

      // Process all comments first
      for (const comment of displayComments) {
        // Get comment user data
        const commentUserResponse = await fetch(`http://localhost:3001/users/${comment.userId}`);
        const commentUser = await commentUserResponse.json();

        // Calculate comment time ago
        const commentTimeAgo = getTimeAgo(comment.createdAt);

        // Check if current user has liked the comment
        const isCommentLiked = comment.likes && comment.likes.includes(currentUser.id);

        // We'll load replies after generating the HTML

        postHTML += `
          <div class="flex space-x-3 comment-item" data-comment-id="${comment.id}">
            <img src="${commentUser.avatar}" alt="${commentUser.name}" class="w-8 h-8 rounded-full">
            <div class="flex-1">
              <div class="bg-dark-50 rounded-2xl px-4 py-2">
                <h5 class="font-semibold text-dark-800">${commentUser.name}</h5>
                <p class="text-dark-700">${comment.content}</p>
              </div>
              <div class="flex items-center mt-1 text-xs text-dark-500">
                <button class="like-comment-btn font-medium mr-3 ${isCommentLiked ? 'text-primary-500' : ''}" data-comment-id="${comment.id}">
                  <i class="fas fa-heart mr-1 ${isCommentLiked ? 'text-primary-500' : ''}"></i>
                  <span>Like</span>
                </button>
                <button class="reply-btn font-medium mr-3" data-comment-id="${comment.id}" data-user="${commentUser.username}">
                  <i class="fas fa-reply mr-1"></i>
                  <span>Reply</span>
                </button>
                <span>${commentTimeAgo}</span>
              </div>

              <!-- Replies container -->
              <div class="replies-container ml-6 mt-2 space-y-2 hidden" data-comment-id="${comment.id}">
                <!-- Replies will be loaded dynamically -->
              </div>

              <!-- Reply input (hidden by default) -->
              <div class="reply-input-container ml-6 mt-2 hidden">
                <div class="flex space-x-2 items-center">
                  <img src="${currentUser.avatar}" alt="${currentUser.name}" class="w-6 h-6 rounded-full">
                  <div class="flex-1 relative">
                    <input type="text" placeholder="Write a reply..." class="w-full bg-dark-50 border-none rounded-full py-1.5 pl-3 pr-8 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all">
                    <button class="send-reply-btn absolute right-2 top-1/2 transform -translate-y-1/2 text-dark-500 hover:text-primary-500" data-comment-id="${comment.id}">
                      <i class="fas fa-paper-plane text-sm"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }

      // Hidden comments container (initially hidden)
      if (hiddenComments.length > 0) {
        postHTML += `
          <div class="hidden-comments-container hidden space-y-4" data-post-id="${post.id}">
            <!-- Hidden comments will be loaded here -->
          </div>
        `;
      }

      // Show "View more comments" if there are more than 2 comments
      if (comments.length > 2) {
        postHTML += `
          <button class="view-more-comments-btn text-dark-500 font-medium text-sm hover:text-dark-700 flex items-center" data-post-id="${post.id}" data-comment-count="${comments.length}">
            <i class="fas fa-chevron-down mr-2"></i>
            <span>View all <span class="font-bold">${comments.length - 2}</span> comments</span>
          </button>
        `;
      }

      // Comment input
      postHTML += `
        <div class="flex space-x-3 items-center">
          <img src="${currentUser.avatar}" alt="${currentUser.name}" class="w-8 h-8 rounded-full">
          <div class="flex-1 relative">
            <input type="text" placeholder="Write a comment..." class="comment-input w-full bg-dark-50 border-none rounded-full py-2 pl-4 pr-10 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all">
            <button class="send-comment-btn absolute right-2 top-1/2 transform -translate-y-1/2 text-dark-500 hover:text-primary-500" data-post-id="${post.id}">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      `;

      postHTML += `</div>`;

      // Set post HTML
      postElement.innerHTML = postHTML;

      // Add event listeners
      const likeButton = postElement.querySelector('.like-button');
      likeButton.addEventListener('click', () => toggleLikePost(post.id, currentUser.id, likeButton));

      const commentButton = postElement.querySelector('.comment-button');
      commentButton.addEventListener('click', () => {
        const commentInput = postElement.querySelector('.comment-input');
        if (commentInput) commentInput.focus();
      });

      // Add comment event listeners
      const sendCommentBtn = postElement.querySelector('.send-comment-btn');
      if (sendCommentBtn) {
        sendCommentBtn.addEventListener('click', () => addComment(post.id, currentUser.id, postElement));
      }

      const commentInput = postElement.querySelector('.comment-input');
      if (commentInput) {
        commentInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            addComment(post.id, currentUser.id, postElement);
          }
        });
      }

      // View more comments button
      const viewMoreBtn = postElement.querySelector('.view-more-comments-btn');
      if (viewMoreBtn) {
        viewMoreBtn.addEventListener('click', () => loadMoreComments(post.id, hiddenComments, currentUser, postElement));
      }

      // Like comment buttons
      const likeCommentBtns = postElement.querySelectorAll('.like-comment-btn');
      likeCommentBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const commentId = btn.dataset.commentId;
          toggleLikeComment(commentId, currentUser.id, btn);
        });
      });

      // Reply buttons
      const replyBtns = postElement.querySelectorAll('.reply-btn');
      replyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const commentId = btn.dataset.commentId;
          const username = btn.dataset.user;
          toggleReplyInput(commentId, username, postElement);
        });
      });

      // Send reply buttons
      const sendReplyBtns = postElement.querySelectorAll('.send-reply-btn');
      sendReplyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const commentId = btn.dataset.commentId;
          addReply(commentId, post.id, currentUser.id, postElement);
        });
      });

      // Add to container
      postsContainer.appendChild(postElement);

      // Load replies for visible comments
      for (const comment of displayComments) {
        const commentReplies = replies.filter(reply => reply.parentId === comment.id);
        if (commentReplies.length > 0) {
          const repliesContainer = postElement.querySelector(`.replies-container[data-comment-id="${comment.id}"]`);
          if (repliesContainer) {
            // Show container
            repliesContainer.classList.remove('hidden');

            // Load replies
            loadRepliesForComment(comment.id, commentReplies, currentUser, repliesContainer);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading posts:', error);
  }
}

/**
 * Toggle like on a post
 * @param {string} postId - The post ID
 * @param {string} userId - The current user ID
 * @param {HTMLElement} button - The like button element
 */
async function toggleLikePost(postId, userId, button) {
  try {
    // Get current post
    const response = await fetch(`http://localhost:3001/posts/${postId}`);
    const post = await response.json();

    // Check if already liked
    const isLiked = post.likes && post.likes.includes(userId);

    // Update likes array
    let likes = post.likes || [];

    if (isLiked) {
      // Unlike
      likes = likes.filter(id => id !== userId);
    } else {
      // Like
      likes.push(userId);
    }

    // Update post
    await fetch(`http://localhost:3001/posts/${postId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ likes })
    });

    // Update UI
    const postElement = button.closest('.bg-white');

    // Update like button with animation
    const icon = button.querySelector('i.fas.fa-heart');
    if (icon) {
      if (isLiked) {
        // Unlike animation
        icon.classList.remove('text-red-500');
        icon.classList.add('text-dark-500');
      } else {
        // Like animation
        icon.classList.remove('text-dark-500');
        icon.classList.add('text-red-500', 'like-animation');

        // Remove animation class after it completes
        setTimeout(() => {
          icon.classList.remove('like-animation');
        }, 400);
      }
    }

    // Add a visual feedback on the button
    button.classList.add('count-update');
    setTimeout(() => {
      button.classList.remove('count-update');
    }, 1000);

    // Update like count with animation
    const likeCountElement = postElement.querySelector('.flex.items-center:has(div.flex.-space-x-1) span');
    if (likeCountElement) {
      // Add animation class
      likeCountElement.classList.add('animate-pulse', 'text-primary-500');

      // Update count
      likeCountElement.textContent = `${formatNumber(likes.length)} likes`;

      // Remove animation after a short delay
      setTimeout(() => {
        likeCountElement.classList.remove('animate-pulse', 'text-primary-500');
      }, 1000);
    }

    // Update like icon color in stats section
    const likeIconContainer = postElement.querySelector('.flex.-space-x-1 div');
    if (likeIconContainer) {
      if (likes.length > 0) {
        likeIconContainer.classList.remove('bg-dark-300');
        likeIconContainer.classList.add('bg-red-500');
      } else {
        likeIconContainer.classList.remove('bg-red-500');
        likeIconContainer.classList.add('bg-dark-300');
      }
    }
  } catch (error) {
    console.error('Error toggling like:', error);
  }
}

/**
 * Load and display user suggestions
 * @param {Object} currentUser - The logged-in user
 */
async function loadSuggestions(currentUser) {
  try {
    // Get suggestions container
    const suggestionsContainer = document.querySelector('.suggestions-container');

    if (!suggestionsContainer) return;

    // Clear existing content
    suggestionsContainer.innerHTML = '';

    // Add header
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center mb-4';
    header.innerHTML = `
      <h3 class="font-bold text-dark-800">Suggested for you</h3>
      <a href="/explore" class="text-primary-500 text-sm font-medium hover:text-primary-600 transition-colors">See All</a>
    `;
    suggestionsContainer.appendChild(header);

    // Fetch users from db.json
    const response = await fetch('http://localhost:3001/users');
    const users = await response.json();

    // Filter out current user and already followed users
    const suggestions = users.filter(user =>
      user.id !== currentUser.id &&
      (!currentUser.following || !currentUser.following.includes(user.id))
    );

    // Limit to 5 suggestions
    const limitedSuggestions = suggestions.slice(0, 5);

    // Create suggestions list
    const suggestionsList = document.createElement('div');
    suggestionsList.className = 'space-y-4';

    // Add each suggestion
    for (const user of limitedSuggestions) {
      const suggestionItem = document.createElement('div');
      suggestionItem.className = 'flex items-center justify-between';
      suggestionItem.innerHTML = `
        <div class="flex items-center space-x-3">
          <img src="${user.avatar}" alt="${user.name}" class="w-10 h-10 rounded-full">
          <div>
            <h4 class="font-semibold text-dark-800">${user.name}</h4>
            <p class="text-dark-500 text-xs">@${user.username}</p>
          </div>
        </div>
        <button class="follow-button text-primary-500 font-medium hover:text-primary-600 transition-colors" data-user-id="${user.id}">
          Follow
        </button>
      `;

      // Add event listener to follow button
      const followButton = suggestionItem.querySelector('.follow-button');
      followButton.addEventListener('click', () => followUser(user.id, currentUser.id, followButton));

      suggestionsList.appendChild(suggestionItem);
    }

    suggestionsContainer.appendChild(suggestionsList);
  } catch (error) {
    console.error('Error loading suggestions:', error);
  }
}

/**
 * Follow a user
 * @param {string} targetId - The user ID to follow
 * @param {string} userId - The current user ID
 * @param {HTMLElement} button - The follow button element
 */
async function followUser(targetId, userId, button) {
  try {
    // Get current user
    const userResponse = await fetch(`http://localhost:3001/users/${userId}`);
    const user = await userResponse.json();

    // Get target user
    const targetResponse = await fetch(`http://localhost:3001/users/${targetId}`);
    const targetUser = await targetResponse.json();

    // Update following list for current user
    const following = user.following || [];
    following.push(targetId);

    await fetch(`http://localhost:3001/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ following })
    });

    // Update followers list for target user
    const followers = targetUser.followers || [];
    followers.push(userId);

    await fetch(`http://localhost:3001/users/${targetId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ followers })
    });

    // Update UI
    button.textContent = 'Following';
    button.classList.add('text-dark-500');
    button.classList.remove('text-primary-500', 'hover:text-primary-600');

    // Update localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.id === userId) {
      currentUser.following = following;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
  } catch (error) {
    console.error('Error following user:', error);
  }
}

/**
 * Format post content with hashtags and mentions
 * @param {string} content - The post content
 * @returns {string} - Formatted content with clickable hashtags and mentions
 */
function formatPostContent(content) {
  if (!content) return '';

  // Format hashtags
  let formattedContent = content.replace(/#(\w+)/g, '<a href="/hashtag/$1" class="text-primary-500 hover:underline">#$1</a>');

  // Format mentions
  formattedContent = formattedContent.replace(/@(\w+)/g, '<a href="/profile/$1" class="text-primary-500 hover:underline">@$1</a>');

  return formattedContent;
}

/**
 * Get time ago string from date
 * @param {string} dateString - ISO date string
 * @returns {string} - Time ago string (e.g., "2h ago")
 */
function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return interval === 1 ? '1y ago' : `${interval}y ago`;
  }

  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval === 1 ? '1mo ago' : `${interval}mo ago`;
  }

  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval === 1 ? '1d ago' : `${interval}d ago`;
  }

  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval === 1 ? '1h ago' : `${interval}h ago`;
  }

  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval === 1 ? '1m ago' : `${interval}m ago`;
  }

  return 'Just now';
}

/**
 * Add a comment to a post
 * @param {string} postId - The post ID
 * @param {string} userId - The current user ID
 * @param {HTMLElement} postElement - The post element
 */
async function addComment(postId, userId, postElement) {
  try {
    // Get the comment input
    const commentInput = postElement.querySelector('.comment-input');
    if (!commentInput || !commentInput.value.trim()) return;

    // Get current user
    const userResponse = await fetch(`http://localhost:3001/users/${userId}`);
    const user = await userResponse.json();

    // Get current post
    const postResponse = await fetch(`http://localhost:3001/posts/${postId}`);
    const post = await postResponse.json();

    // Create new comment
    const newComment = {
      id: `c${Date.now()}`,
      postId: postId,
      userId: userId,
      content: commentInput.value.trim(),
      createdAt: new Date().toISOString(),
      likes: []
    };

    // Save comment to db.json
    await fetch('http://localhost:3001/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newComment)
    });

    // Update post comments count
    const commentsCount = (post.commentsCount || 0) + 1;
    await fetch(`http://localhost:3001/posts/${postId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ commentsCount })
    });

    // Clear input
    commentInput.value = '';

    // Update UI
    const commentsSection = postElement.querySelector('.comments-section');
    const hiddenCommentsContainer = postElement.querySelector('.hidden-comments-container');
    const viewMoreBtn = postElement.querySelector('.view-more-comments-btn');

    // Create comment element
    const commentElement = document.createElement('div');
    commentElement.className = 'flex space-x-3 comment-item';
    commentElement.dataset.commentId = newComment.id;

    commentElement.innerHTML = `
      <img src="${user.avatar}" alt="${user.name}" class="w-8 h-8 rounded-full">
      <div class="flex-1">
        <div class="bg-dark-50 rounded-2xl px-4 py-2">
          <h5 class="font-semibold text-dark-800">${user.name}</h5>
          <p class="text-dark-700">${newComment.content}</p>
        </div>
        <div class="flex items-center mt-1 text-xs text-dark-500">
          <button class="like-comment-btn font-medium mr-3" data-comment-id="${newComment.id}">
            <i class="fas fa-heart mr-1"></i>
            <span>Like</span>
          </button>
          <button class="reply-btn font-medium mr-3" data-comment-id="${newComment.id}" data-user="${user.username}">
            <i class="fas fa-reply mr-1"></i>
            <span>Reply</span>
          </button>
          <span>Just now</span>
        </div>

        <!-- Replies container -->
        <div class="replies-container ml-6 mt-2 space-y-2 hidden"></div>

        <!-- Reply input (hidden by default) -->
        <div class="reply-input-container ml-6 mt-2 hidden">
          <div class="flex space-x-2 items-center">
            <img src="${user.avatar}" alt="${user.name}" class="w-6 h-6 rounded-full">
            <div class="flex-1 relative">
              <input type="text" placeholder="Write a reply..." class="w-full bg-dark-50 border-none rounded-full py-1.5 pl-3 pr-8 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all">
              <button class="send-reply-btn absolute right-2 top-1/2 transform -translate-y-1/2 text-dark-500 hover:text-primary-500" data-comment-id="${newComment.id}">
                <i class="fas fa-paper-plane text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    const likeCommentBtn = commentElement.querySelector('.like-comment-btn');
    likeCommentBtn.addEventListener('click', () => toggleLikeComment(newComment.id, userId, likeCommentBtn));

    const replyBtn = commentElement.querySelector('.reply-btn');
    replyBtn.addEventListener('click', () => toggleReplyInput(newComment.id, user.username, postElement));

    const sendReplyBtn = commentElement.querySelector('.send-reply-btn');
    sendReplyBtn.addEventListener('click', () => addReply(newComment.id, postId, userId, postElement));

    // Update comments count in UI with animation
    const commentsCountElement = postElement.querySelector('.flex.items-center:has(i.fas.fa-comment) span');
    if (commentsCountElement) {
      // Add animation class
      commentsCountElement.classList.add('animate-pulse', 'text-primary-500');

      // Update count
      commentsCountElement.textContent = `${formatNumber(commentsCount)} comments`;

      // Remove animation after a short delay
      setTimeout(() => {
        commentsCountElement.classList.remove('animate-pulse', 'text-primary-500');
      }, 1000);
    }

    // If there's a view more button, update it and add to hidden container
    if (viewMoreBtn) {
      const count = parseInt(viewMoreBtn.dataset.commentCount) + 1;
      viewMoreBtn.dataset.commentCount = count;

      // Update the button text with animation
      const buttonSpan = viewMoreBtn.querySelector('span');
      if (buttonSpan) {
        // Add animation class
        buttonSpan.classList.add('animate-pulse', 'text-primary-500');

        // Update the inner HTML to keep the bold formatting
        buttonSpan.innerHTML = `View all <span class="font-bold">${count}</span> comments`;

        // Remove animation after a short delay
        setTimeout(() => {
          buttonSpan.classList.remove('animate-pulse', 'text-primary-500');
        }, 1000);
      }

      // Add to hidden container if it exists
      if (hiddenCommentsContainer) {
        hiddenCommentsContainer.appendChild(commentElement);
      } else {
        // Insert before the view more button
        commentsSection.insertBefore(commentElement, viewMoreBtn);
      }
    } else {
      // Insert before the comment input
      const commentInputContainer = postElement.querySelector('.flex.space-x-3.items-center');
      commentsSection.insertBefore(commentElement, commentInputContainer);
    }
  } catch (error) {
    console.error('Error adding comment:', error);
  }
}

/**
 * Load more comments for a post
 * @param {string} postId - The post ID
 * @param {Array} hiddenComments - The hidden comments
 * @param {Object} currentUser - The current user
 * @param {HTMLElement} postElement - The post element
 */
async function loadMoreComments(postId, hiddenComments, currentUser, postElement) {
  try {
    // Get containers
    const hiddenCommentsContainer = postElement.querySelector('.hidden-comments-container');
    const viewMoreBtn = postElement.querySelector('.view-more-comments-btn');

    if (!hiddenCommentsContainer || !viewMoreBtn) return;

    // Toggle visibility with animation
    if (hiddenCommentsContainer.classList.contains('hidden')) {
      // Show hidden comments with animation
      hiddenCommentsContainer.classList.remove('hidden');
      hiddenCommentsContainer.style.opacity = '0';
      hiddenCommentsContainer.style.maxHeight = '0';
      hiddenCommentsContainer.style.overflow = 'hidden';

      // Animate in
      setTimeout(() => {
        hiddenCommentsContainer.style.transition = 'opacity 0.3s, max-height 0.5s';
        hiddenCommentsContainer.style.opacity = '1';
        hiddenCommentsContainer.style.maxHeight = '1000px';
      }, 10);

      // Update button text and icon
      const buttonSpan = viewMoreBtn.querySelector('span');
      if (buttonSpan) {
        buttonSpan.innerHTML = 'Hide comments';
      }
      viewMoreBtn.querySelector('i').classList.replace('fa-chevron-down', 'fa-chevron-up');

      // If container is empty, load comments
      if (hiddenCommentsContainer.children.length === 0) {
        // Load each hidden comment
        for (const comment of hiddenComments) {
          // Get comment user data
          const commentUserResponse = await fetch(`http://localhost:3001/users/${comment.userId}`);
          const commentUser = await commentUserResponse.json();

          // Calculate comment time ago
          const commentTimeAgo = getTimeAgo(comment.createdAt);

          // Check if current user has liked the comment
          const isCommentLiked = comment.likes && comment.likes.includes(currentUser.id);

          // Create comment element
          const commentElement = document.createElement('div');
          commentElement.className = 'flex space-x-3 comment-item';
          commentElement.dataset.commentId = comment.id;

          commentElement.innerHTML = `
            <img src="${commentUser.avatar}" alt="${commentUser.name}" class="w-8 h-8 rounded-full">
            <div class="flex-1">
              <div class="bg-dark-50 rounded-2xl px-4 py-2">
                <h5 class="font-semibold text-dark-800">${commentUser.name}</h5>
                <p class="text-dark-700">${comment.content}</p>
              </div>
              <div class="flex items-center mt-1 text-xs text-dark-500">
                <button class="like-comment-btn font-medium mr-3 ${isCommentLiked ? 'text-primary-500' : ''}" data-comment-id="${comment.id}">
                  <i class="fas fa-heart mr-1 ${isCommentLiked ? 'text-primary-500' : ''}"></i>
                  <span>Like</span>
                </button>
                <button class="reply-btn font-medium mr-3" data-comment-id="${comment.id}" data-user="${commentUser.username}">
                  <i class="fas fa-reply mr-1"></i>
                  <span>Reply</span>
                </button>
                <span>${commentTimeAgo}</span>
              </div>

              <!-- Replies container -->
              <div class="replies-container ml-6 mt-2 space-y-2 hidden"></div>

              <!-- Reply input (hidden by default) -->
              <div class="reply-input-container ml-6 mt-2 hidden">
                <div class="flex space-x-2 items-center">
                  <img src="${currentUser.avatar}" alt="${currentUser.name}" class="w-6 h-6 rounded-full">
                  <div class="flex-1 relative">
                    <input type="text" placeholder="Write a reply..." class="w-full bg-dark-50 border-none rounded-full py-1.5 pl-3 pr-8 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all">
                    <button class="send-reply-btn absolute right-2 top-1/2 transform -translate-y-1/2 text-dark-500 hover:text-primary-500" data-comment-id="${comment.id}">
                      <i class="fas fa-paper-plane text-sm"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `;

          // Add event listeners
          const likeCommentBtn = commentElement.querySelector('.like-comment-btn');
          likeCommentBtn.addEventListener('click', () => toggleLikeComment(comment.id, currentUser.id, likeCommentBtn));

          const replyBtn = commentElement.querySelector('.reply-btn');
          replyBtn.addEventListener('click', () => toggleReplyInput(comment.id, commentUser.username, postElement));

          const sendReplyBtn = commentElement.querySelector('.send-reply-btn');
          sendReplyBtn.addEventListener('click', () => addReply(comment.id, postId, currentUser.id, postElement));

          // Add to container
          hiddenCommentsContainer.appendChild(commentElement);

          // Load replies for this comment if any
          const commentReplies = replies.filter(reply => reply.parentId === comment.id);
          if (commentReplies.length > 0) {
            const repliesContainer = commentElement.querySelector('.replies-container');
            if (repliesContainer) {
              // Show container
              repliesContainer.classList.remove('hidden');

              // Load replies
              loadRepliesForComment(comment.id, commentReplies, currentUser, repliesContainer);
            }
          }
        }
      }
    } else {
      // Hide comments with animation
      hiddenCommentsContainer.style.transition = 'opacity 0.3s, max-height 0.5s';
      hiddenCommentsContainer.style.opacity = '0';
      hiddenCommentsContainer.style.maxHeight = '0';

      // After animation completes, hide the container
      setTimeout(() => {
        hiddenCommentsContainer.classList.add('hidden');
        // Reset styles for next time
        hiddenCommentsContainer.style.transition = '';
        hiddenCommentsContainer.style.maxHeight = '';
        hiddenCommentsContainer.style.opacity = '';
        hiddenCommentsContainer.style.overflow = '';
      }, 300);

      // Update button text and icon
      const buttonSpan = viewMoreBtn.querySelector('span');
      if (buttonSpan) {
        buttonSpan.innerHTML = `View all <span class="font-bold">${viewMoreBtn.dataset.commentCount}</span> comments`;
      }
      viewMoreBtn.querySelector('i').classList.replace('fa-chevron-up', 'fa-chevron-down');
    }
  } catch (error) {
    console.error('Error loading more comments:', error);
  }
}

/**
 * Toggle like on a comment
 * @param {string} commentId - The comment ID
 * @param {string} userId - The current user ID
 * @param {HTMLElement} button - The like button element
 */
async function toggleLikeComment(commentId, userId, button) {
  try {
    // Get current comment
    const response = await fetch(`http://localhost:3001/comments/${commentId}`);
    const comment = await response.json();

    // Check if already liked
    const isLiked = comment.likes && comment.likes.includes(userId);

    // Update likes array
    let likes = comment.likes || [];

    if (isLiked) {
      // Unlike
      likes = likes.filter(id => id !== userId);
    } else {
      // Like
      likes.push(userId);
    }

    // Update comment
    await fetch(`http://localhost:3001/comments/${commentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ likes })
    });

    // Update UI
    const icon = button.querySelector('i.fas.fa-heart');
    if (icon) {
      if (isLiked) {
        icon.classList.remove('text-primary-500');
        button.classList.remove('text-primary-500');
      } else {
        icon.classList.add('text-primary-500');
        button.classList.add('text-primary-500');
      }
    }
  } catch (error) {
    console.error('Error toggling comment like:', error);
  }
}

/**
 * Toggle reply input for a comment
 * @param {string} commentId - The comment ID
 * @param {string} username - The username to reply to
 * @param {HTMLElement} postElement - The post element
 */
function toggleReplyInput(commentId, username, postElement) {
  // Find the comment element
  const commentElement = postElement.querySelector(`.comment-item[data-comment-id="${commentId}"]`);
  if (!commentElement) return;

  // Find the reply input container
  const replyInputContainer = commentElement.querySelector('.reply-input-container');
  if (!replyInputContainer) return;

  // Toggle visibility
  replyInputContainer.classList.toggle('hidden');

  // Focus input and set placeholder
  const input = replyInputContainer.querySelector('input');
  if (input && !replyInputContainer.classList.contains('hidden')) {
    input.placeholder = `Reply to @${username}...`;
    input.focus();
  }
}

/**
 * Add a reply to a comment
 * @param {string} commentId - The comment ID
 * @param {string} postId - The post ID
 * @param {string} userId - The current user ID
 * @param {HTMLElement} postElement - The post element
 */
async function addReply(commentId, postId, userId, postElement) {
  try {
    // Find the comment element
    const commentElement = postElement.querySelector(`.comment-item[data-comment-id="${commentId}"]`);
    if (!commentElement) return;

    // Find the reply input
    const replyInput = commentElement.querySelector('.reply-input-container input');
    if (!replyInput || !replyInput.value.trim()) return;

    // Get current user
    const userResponse = await fetch(`http://localhost:3001/users/${userId}`);
    const user = await userResponse.json();

    // Get comment (we don't need the comment data, just verifying it exists)
    await fetch(`http://localhost:3001/comments/${commentId}`);

    // Create new reply (as a comment with parentId)
    const newReply = {
      id: `r${Date.now()}`,
      postId: postId,
      userId: userId,
      parentId: commentId,
      content: replyInput.value.trim(),
      createdAt: new Date().toISOString(),
      likes: []
    };

    // Save reply to db.json
    const replyResponse = await fetch('http://localhost:3001/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newReply)
    });

    // Verify the reply was saved successfully
    if (!replyResponse.ok) {
      throw new Error('Failed to save reply');
    }

    // Update post comments count
    const postResponse = await fetch(`http://localhost:3001/posts/${postId}`);
    const post = await postResponse.json();
    const commentsCount = (post.commentsCount || 0) + 1;

    await fetch(`http://localhost:3001/posts/${postId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ commentsCount })
    });

    // Clear input and hide container
    replyInput.value = '';
    const replyInputContainer = commentElement.querySelector('.reply-input-container');
    if (replyInputContainer) {
      replyInputContainer.classList.add('hidden');
    }

    // Show replies container
    const repliesContainer = commentElement.querySelector('.replies-container');
    if (repliesContainer) {
      repliesContainer.classList.remove('hidden');

      // Create reply element
      const replyElement = document.createElement('div');
      replyElement.className = 'flex space-x-2 items-start reply-item';
      replyElement.dataset.replyId = newReply.id;
      replyElement.dataset.parentId = commentId; // Add parent comment ID as data attribute

      replyElement.innerHTML = `
        <img src="${user.avatar}" alt="${user.name}" class="w-6 h-6 rounded-full">
        <div class="flex-1">
          <div class="bg-dark-50 rounded-xl px-3 py-1.5">
            <h5 class="font-semibold text-dark-800 text-sm">${user.name}</h5>
            <p class="text-dark-700 text-sm">${newReply.content}</p>
          </div>
          <div class="flex items-center mt-1 text-xs text-dark-500">
            <button class="like-reply-btn font-medium mr-3" data-reply-id="${newReply.id}">
              <i class="fas fa-heart mr-1"></i>
              <span>Like</span>
            </button>
            <span>Just now</span>
          </div>
        </div>
      `;

      // Add event listener for like button
      const likeReplyBtn = replyElement.querySelector('.like-reply-btn');
      if (likeReplyBtn) {
        likeReplyBtn.addEventListener('click', () => toggleLikeReply(newReply.id, userId, likeReplyBtn));
      }

      // Add to container with animation
      replyElement.style.opacity = '0';
      repliesContainer.appendChild(replyElement);

      // Animate in
      setTimeout(() => {
        replyElement.style.transition = 'opacity 0.3s';
        replyElement.style.opacity = '1';
      }, 10);

      // Update comments count in UI with animation
      const commentsCountElement = postElement.querySelector('.flex.items-center:has(i.fas.fa-comment) span');
      if (commentsCountElement) {
        // Add animation class
        commentsCountElement.classList.add('animate-pulse', 'text-primary-500');

        // Update count
        commentsCountElement.textContent = `${formatNumber(commentsCount)} comments`;

        // Remove animation after a short delay
        setTimeout(() => {
          commentsCountElement.classList.remove('animate-pulse', 'text-primary-500');
        }, 1000);
      }

      // Update view more comments button if it exists
      const viewMoreBtn = postElement.querySelector('.view-more-comments-btn');
      if (viewMoreBtn) {
        const count = parseInt(viewMoreBtn.dataset.commentCount) + 1;
        viewMoreBtn.dataset.commentCount = count;

        // Update the button text with animation
        const buttonSpan = viewMoreBtn.querySelector('span');
        if (buttonSpan) {
          // Add animation class
          buttonSpan.classList.add('animate-pulse', 'text-primary-500');

          // Update the inner HTML to keep the bold formatting
          buttonSpan.innerHTML = `View all <span class="font-bold">${count}</span> comments`;

          // Remove animation after a short delay
          setTimeout(() => {
            buttonSpan.classList.remove('animate-pulse', 'text-primary-500');
          }, 1000);
        }
      }
    }
  } catch (error) {
    console.error('Error adding reply:', error);
  }
}

/**
 * Render replies for a comment
 * @param {Array} replies - The replies to render
 * @param {Object} currentUser - The current user
 * @returns {string} - HTML for the replies
 */
async function renderReplies(replies, currentUser) {
  if (!replies || replies.length === 0) return '';

  let repliesHTML = '';

  for (const reply of replies) {
    // Get reply user data
    const userResponse = await fetch(`http://localhost:3001/users/${reply.userId}`);
    const user = await userResponse.json();

    // Calculate reply time ago
    const timeAgo = getTimeAgo(reply.createdAt);

    // Check if current user has liked the reply
    const isLiked = reply.likes && reply.likes.includes(currentUser.id);

    repliesHTML += `
      <div class="flex space-x-2 items-start reply-item" data-reply-id="${reply.id}">
        <img src="${user.avatar}" alt="${user.name}" class="w-6 h-6 rounded-full">
        <div class="flex-1">
          <div class="bg-dark-50 rounded-xl px-3 py-1.5">
            <h5 class="font-semibold text-dark-800 text-sm">${user.name}</h5>
            <p class="text-dark-700 text-sm">${reply.content}</p>
          </div>
          <div class="flex items-center mt-1 text-xs text-dark-500">
            <button class="like-reply-btn font-medium mr-3 ${isLiked ? 'text-primary-500' : ''}" data-reply-id="${reply.id}">
              <i class="fas fa-heart mr-1 ${isLiked ? 'text-primary-500' : ''}"></i>
              <span>Like</span>
            </button>
            <span>${timeAgo}</span>
          </div>
        </div>
      </div>
    `;
  }

  return repliesHTML;
}

/**
 * Load replies for a comment
 * @param {string} commentId - The comment ID
 * @param {Array} replies - The replies to load
 * @param {Object} currentUser - The current user
 * @param {HTMLElement} container - The container to append replies to
 */
async function loadRepliesForComment(commentId, replies, currentUser, container) {
  try {
    // Clear container
    container.innerHTML = '';

    // Sort replies by creation date (oldest first)
    const sortedReplies = [...replies].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Process each reply
    for (const reply of sortedReplies) {
      // Get user data
      const userResponse = await fetch(`http://localhost:3001/users/${reply.userId}`);
      const user = await userResponse.json();

      // Calculate time ago
      const timeAgo = getTimeAgo(reply.createdAt);

      // Check if current user has liked the reply
      const isLiked = reply.likes && reply.likes.includes(currentUser.id);

      // Create reply element
      const replyElement = document.createElement('div');
      replyElement.className = 'flex space-x-2 items-start reply-item';
      replyElement.dataset.replyId = reply.id;
      replyElement.dataset.parentId = commentId;

      replyElement.innerHTML = `
        <img src="${user.avatar}" alt="${user.name}" class="w-6 h-6 rounded-full">
        <div class="flex-1">
          <div class="bg-dark-50 rounded-xl px-3 py-1.5">
            <h5 class="font-semibold text-dark-800 text-sm">${user.name}</h5>
            <p class="text-dark-700 text-sm">${reply.content}</p>
          </div>
          <div class="flex items-center mt-1 text-xs text-dark-500">
            <button class="like-reply-btn font-medium mr-3 ${isLiked ? 'text-primary-500' : ''}" data-reply-id="${reply.id}">
              <i class="fas fa-heart mr-1 ${isLiked ? 'text-primary-500' : ''}"></i>
              <span>Like</span>
            </button>
            <span>${timeAgo}</span>
          </div>
        </div>
      `;

      // Add event listener for like button
      const likeReplyBtn = replyElement.querySelector('.like-reply-btn');
      if (likeReplyBtn) {
        likeReplyBtn.addEventListener('click', () => toggleLikeReply(reply.id, currentUser.id, likeReplyBtn));
      }

      // Add to container with animation
      replyElement.style.opacity = '0';
      container.appendChild(replyElement);

      // Animate in
      setTimeout(() => {
        replyElement.style.transition = 'opacity 0.3s';
        replyElement.style.opacity = '1';
      }, 10);
    }
  } catch (error) {
    console.error('Error loading replies for comment:', error);
  }
}

/**
 * Toggle like on a reply
 * @param {string} replyId - The reply ID
 * @param {string} userId - The current user ID
 * @param {HTMLElement} button - The like button element
 */
async function toggleLikeReply(replyId, userId, button) {
  try {
    // Get current reply
    const response = await fetch(`http://localhost:3001/comments/${replyId}`);
    const reply = await response.json();

    // Check if already liked
    const isLiked = reply.likes && reply.likes.includes(userId);

    // Update likes array
    let likes = reply.likes || [];

    if (isLiked) {
      // Unlike
      likes = likes.filter(id => id !== userId);
    } else {
      // Like
      likes.push(userId);
    }

    // Update reply
    await fetch(`http://localhost:3001/comments/${replyId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ likes })
    });

    // Update UI
    const icon = button.querySelector('i.fas.fa-heart');
    if (icon) {
      if (isLiked) {
        icon.classList.remove('text-primary-500');
        button.classList.remove('text-primary-500');
      } else {
        icon.classList.add('text-primary-500', 'like-animation');
        button.classList.add('text-primary-500');

        // Remove animation class after it completes
        setTimeout(() => {
          icon.classList.remove('like-animation');
        }, 400);
      }
    }

    // Add a visual feedback on the button
    button.classList.add('count-update');
    setTimeout(() => {
      button.classList.remove('count-update');
    }, 1000);
  } catch (error) {
    console.error('Error toggling reply like:', error);
  }
}

/**
 * Format number for display (e.g., 1200 -> 1.2K)
 * @param {number} num - The number to format
 * @returns {string} - Formatted number
 */
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

/**
 * Toggle like on a story
 * @param {string} storyId - The story ID
 * @param {string} userId - The current user ID
 * @param {HTMLElement} button - The like button element
 */
async function toggleLikeStory(storyId, userId, button) {
  try {
    // Get current story
    const response = await fetch(`http://localhost:3001/stories/${storyId}`);
    const story = await response.json();

    // Check if already liked
    const isLiked = story.likes && story.likes.includes(userId);

    // Update likes array
    let likes = story.likes || [];

    if (isLiked) {
      // Unlike
      likes = likes.filter(id => id !== userId);
      button.classList.remove('text-red-500');
    } else {
      // Like
      likes.push(userId);
      button.classList.add('text-red-500');
    }

    // Update story in db.json
    await fetch(`http://localhost:3001/stories/${storyId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ likes })
    });

    // Update UI
    const postElement = button.closest('.bg-white');

    // Update like button with animation
    const icon = button.querySelector('i.fas.fa-heart');
    if (icon) {
      if (isLiked) {
        // Unlike animation
        icon.classList.remove('text-red-500');
        icon.classList.add('text-dark-500');
      } else {
        // Like animation
        icon.classList.remove('text-dark-500');
        icon.classList.add('text-red-500', 'like-animation');

        // Remove animation class after it completes
        setTimeout(() => {
          icon.classList.remove('like-animation');
        }, 400);
      }
    }

    // Add a visual feedback on the button
    button.classList.add('count-update');
    setTimeout(() => {
      button.classList.remove('count-update');
    }, 1000);

    // Update like count with animation
    const likeCountElement = postElement.querySelector('.flex.items-center:has(div.flex.-space-x-1) span');
    if (likeCountElement) {
      // Add animation class
      likeCountElement.classList.add('animate-pulse', 'text-primary-500');

      // Update count
      likeCountElement.textContent = `${formatNumber(likes.length)} likes`;

      // Remove animation after a short delay
      setTimeout(() => {
        likeCountElement.classList.remove('animate-pulse', 'text-primary-500');
      }, 1000);
    }

    // Update like icon color in stats section
    const likeIconContainer = postElement.querySelector('.flex.-space-x-1 div');
    if (likeIconContainer) {
      if (likes.length > 0) {
        likeIconContainer.classList.remove('bg-dark-300');
        likeIconContainer.classList.add('bg-red-500');
      } else {
        likeIconContainer.classList.remove('bg-red-500');
        likeIconContainer.classList.add('bg-dark-300');
      }
    }
  } catch (error) {
    console.error('Error toggling like:', error);
  }
}

/**
 * Load stories for the home page
 * @param {Object} currentUser - The logged-in user
 */
async function loadStories(currentUser) {
  try {
    // Get the stories container
    const storiesContainer = document.querySelector('.stories-container');
    if (!storiesContainer) return;

    // Save the "Add Story" item if it exists
    const addStoryItem = storiesContainer.querySelector('a[href="/create-story"]');
    
    // Clear the container
    storiesContainer.innerHTML = '';

    // Add back the "Add Story" item if it exists
    if (addStoryItem) {
      storiesContainer.appendChild(addStoryItem);
    } else {
      // Create a new "Add Story" item if it doesn't exist
      const newAddStoryItem = document.createElement('a');
      newAddStoryItem.href = '/create-story';
      newAddStoryItem.className = 'flex-shrink-0 w-[180px] md:w-[220px] relative group cursor-pointer';
      newAddStoryItem.innerHTML = `
        <div class="aspect-[3/4] w-full rounded-2xl bg-dark-50 overflow-hidden flex flex-col items-center justify-center shadow-md h-48 md:h-64">
          <div class="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-500 mb-3">
            <i class="fas fa-plus text-xl"></i>
          </div>
          <span class="text-sm font-medium text-dark-700">Add Story</span>
        </div>
      `;
      storiesContainer.appendChild(newAddStoryItem);
    }

    // Fetch stories from db.json
    const response = await fetch('http://localhost:3001/stories');
    const stories = await response.json();

    // Filter active stories (not expired)
    const now = new Date().toISOString();
    const activeStories = stories.filter(story => story.expiresAt > now);

    // Filter stories to only show those from users the current user follows
    // Also include the current user's own stories
    const followedUserIds = currentUser.following || [];
    const filteredStories = activeStories.filter(story => 
      story.userId === currentUser.id || // User's own stories
      followedUserIds.includes(story.userId) // Stories from followed users
    );

    // Sort stories by creation date (newest first)
    filteredStories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Limit to 5 stories on the home page
    const homePageStories = filteredStories.slice(0, 5);

    // Create HTML for each story
    for (const story of homePageStories) {
      // Get user data
      const userResponse = await fetch(`http://localhost:3001/users/${story.userId}`);
      const user = await userResponse.json();

      // Create story element
      const storyElement = document.createElement('div');
      storyElement.className = 'flex-shrink-0 w-[180px] md:w-[220px] relative group cursor-pointer';
      storyElement.innerHTML = `
        <div class="aspect-[3/4] w-full rounded-2xl overflow-hidden shadow-md h-48 md:h-64">
          <img src="${story.media.url}" alt="${user.name}'s story" class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          
          <!-- Story Header -->
          <div class="absolute top-3 left-3 right-3">
            <div class="flex items-center">
              <div class="w-8 h-8 rounded-full border-2 border-primary-500 overflow-hidden">
                <img src="${user.avatar}" alt="${user.name}" class="w-full h-full object-cover">
              </div>
              <div class="ml-2">
                <p class="text-white text-xs font-medium">${user.name}</p>
                <p class="text-white/70 text-xs">${getTimeAgo(story.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      `;

      // Add click event to view story
      storyElement.addEventListener('click', () => viewStory(story, user, currentUser));

      // Add to container
      storiesContainer.appendChild(storyElement);
    }

    // Add "View More" story if there are more stories than shown
    if (filteredStories.length > homePageStories.length) {
      const viewMoreElement = document.createElement('a');
      viewMoreElement.href = '/stories';
      viewMoreElement.className = 'flex-shrink-0 w-[180px] md:w-[220px] relative group cursor-pointer';
      viewMoreElement.innerHTML = `
        <div class="aspect-[3/4] w-full rounded-2xl bg-dark-50 overflow-hidden flex flex-col items-center justify-center shadow-md h-48 md:h-64">
          <div class="w-14 h-14 rounded-full bg-gradient-to-r from-primary-100 to-secondary-100 flex items-center justify-center text-primary-500 mb-3">
            <i class="fas fa-ellipsis-h text-xl"></i>
          </div>
          <span class="text-sm font-medium text-dark-700">View All Stories</span>
          <span class="text-xs text-dark-500 mt-1">${filteredStories.length - homePageStories.length} more</span>
        </div>
      `;
      storiesContainer.appendChild(viewMoreElement);
    }

  } catch (error) {
    console.error('Error loading stories:', error);
  }
}

/**
 * Close the story viewer
 * @param {HTMLElement} storyViewer - The story viewer element to close
 */
function closeStory(storyViewer) {
  // Add fade-out animation
  storyViewer.classList.add('fade-out');
  
  // Remove after animation completes
  setTimeout(() => {
    if (storyViewer && storyViewer.parentNode) {
      storyViewer.parentNode.removeChild(storyViewer);
    }
  }, 300);
}

/**
 * View a story
 * @param {Object} story - The story object
 * @param {Object} user - The user who created the story
 * @param {Object} currentUser - The current user
 */
function viewStory(story, user, currentUser) {
  // Create story viewer modal
  const storyViewer = document.createElement('div');
  storyViewer.className = 'story-viewer';

  // Calculate time ago
  const timeAgo = getTimeAgo(story.createdAt);
  
  // Check if current user has liked the story
  const isLiked = story.likes && story.likes.includes(currentUser.id);

  storyViewer.innerHTML = `
    <div class="relative w-full max-w-lg mx-auto">
      <!-- Story header -->
      <div class="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
        <div class="flex items-center">
          <img src="${user.avatar}" alt="${user.name}" class="w-10 h-10 rounded-full border-2 border-white">
          <div class="ml-2 text-white">
            <p class="font-semibold">${user.name}</p>
            <p class="text-xs opacity-80">${timeAgo}</p>
          </div>
        </div>
        <button class="close-story text-white text-xl">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Story content -->
      <div class="story-content">
        <img src="${story.media.url}" alt="Story" class="w-full h-full object-contain">
      </div>
      
      <!-- Story caption -->
      <div class="absolute bottom-20 left-4 right-4 bg-black bg-opacity-50 p-3 rounded-lg">
        <p class="text-white">${story.caption || 'No caption'}</p>
      </div>

      <!-- Story actions -->
      <div class="absolute bottom-4 left-4 right-4 flex items-center space-x-2">
        <button class="like-story-btn flex items-center justify-center bg-black bg-opacity-50 text-white rounded-full w-12 h-12 ${isLiked ? 'text-red-500' : ''}" data-story-id="${story.id}">
          <i class="fas fa-heart text-xl"></i>
        </button>
        <div class="flex-1 relative">
          <input type="text" placeholder="Send a comment..." class="story-comment-input w-full bg-black bg-opacity-50 text-white border-none rounded-full py-3 pl-4 pr-12 focus:ring-2 focus:ring-primary-500">
          <button class="send-story-comment-btn absolute right-2 top-1/2 transform -translate-y-1/2 text-white" data-story-id="${story.id}">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>

      <!-- Story progress -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-dark-500 bg-opacity-50">
        <div class="story-progress h-full bg-white" style="width: 0%"></div>
      </div>
    </div>
  `;

  // Add to body
  document.body.appendChild(storyViewer);

  // Start progress
  const progressBar = storyViewer.querySelector('.story-progress');
  let progress = 0;
  let isPaused = false;
  let interval;
  
  // Function to start/resume the progress
  const startProgress = () => {
    interval = setInterval(() => {
      if (!isPaused) {
        progress += 1;
        progressBar.style.width = `${progress}%`;
        
        if (progress >= 100) {
          clearInterval(interval);
          closeStory(storyViewer);
        }
      }
    }, 50); // 5 seconds total (50ms * 100)
  };
  
  // Start the progress initially
  startProgress();

  // Pause progress when user focuses on comment input
  const commentInput = storyViewer.querySelector('.story-comment-input');
  commentInput.addEventListener('focus', () => {
    isPaused = true;
    clearInterval(interval);
  });
  
  // Resume progress when user blurs from comment input
  commentInput.addEventListener('blur', () => {
    // Only resume if not submitting a comment
    if (!commentInput.value.trim()) {
      isPaused = false;
      startProgress();
    }
  });

  // Close button
  const closeBtn = storyViewer.querySelector('.close-story');
  closeBtn.addEventListener('click', () => {
    clearInterval(interval);
    closeStory(storyViewer);
  });

  // Like button
  const likeBtn = storyViewer.querySelector('.like-story-btn');
  likeBtn.addEventListener('click', () => toggleLikeStory(story.id, currentUser.id, likeBtn));

  // Comment button
  const sendCommentBtn = storyViewer.querySelector('.send-story-comment-btn');
  
  sendCommentBtn.addEventListener('click', () => {
    if (commentInput.value.trim()) {
      // Pause the timer while submitting comment
      isPaused = true;
      clearInterval(interval);
      
      addStoryComment(story.id, currentUser.id, commentInput.value.trim());
      commentInput.value = '';
      
      // Resume the timer after submitting
      setTimeout(() => {
        isPaused = false;
        startProgress();
      }, 1000); // Give user a moment to see the success message
    }
  });
  
  commentInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && commentInput.value.trim()) {
      // Pause the timer while submitting comment
      isPaused = true;
      clearInterval(interval);
      
      addStoryComment(story.id, currentUser.id, commentInput.value.trim());
      commentInput.value = '';
      
      // Resume the timer after submitting
      setTimeout(() => {
        isPaused = false;
        startProgress();
      }, 1000); // Give user a moment to see the success message
    }
  });

  // Mark story as viewed
  markStoryAsViewed(story.id)
}
