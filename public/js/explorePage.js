/**
 * Explore Page - Dynamic data loading
 * This file handles loading data for the explore page
 */

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  if (currentUser) {
    // Load explore page data
    loadExploreData(currentUser);
  } else {
    // Redirect to login if not logged in
    window.location.href = '/auth/login';
  }
});

/**
 * Load all data for the explore page
 * @param {Object} currentUser - The logged-in user
 */
async function loadExploreData(currentUser) {
  try {
    // Load popular creators
    await loadPopularCreators(currentUser);

    // Load trending topics
    await loadTrendingTopics();

    // Load explore photos
    await loadExplorePhotos(currentUser);

    // Set up category buttons
    setupCategoryButtons();
  } catch (error) {
    console.error('Error loading explore data:', error);
  }
}

/**
 * Load popular creators based on post count and likes
 * @param {Object} currentUser - The logged-in user
 */
async function loadPopularCreators(currentUser) {
  try {
    // Get the container
    const creatorsContainer = document.querySelector('.grid.grid-cols-2.md\\:grid-cols-4.gap-6');
    if (!creatorsContainer) return;

    // Clear container
    creatorsContainer.innerHTML = '';

    // Fetch all users
    const usersResponse = await fetch('http://localhost:3001/users');
    const users = await usersResponse.json();

    // Fetch all posts
    const postsResponse = await fetch('http://localhost:3001/posts');
    const posts = await postsResponse.json();

    // Filter out the current user
    const filteredUsers = users.filter(user => user.id.toString() !== currentUser.id.toString());

    // Calculate popularity score for each user (based on post count and total likes)
    const userPopularity = filteredUsers.map(user => {
      // Get posts by this user
      const userPosts = posts.filter(post => post.userId === user.id.toString());

      // Calculate total likes
      let totalLikes = 0;
      userPosts.forEach(post => {
        if (post.likes && Array.isArray(post.likes)) {
          totalLikes += post.likes.length;
        }
      });

      // Calculate popularity score (post count * 10 + total likes)
      const popularityScore = (userPosts.length * 10) + totalLikes;

      return {
        ...user,
        postCount: userPosts.length,
        totalLikes: totalLikes,
        popularityScore: popularityScore
      };
    });

    // Sort by popularity score (descending)
    userPopularity.sort((a, b) => b.popularityScore - a.popularityScore);

    // Take top 4 users
    const topCreators = userPopularity.slice(0, 4);

    // Create HTML for each creator
    const colors = ['blue', 'purple', 'pink', 'green'];

    topCreators.forEach((creator, index) => {
      // Check if current user is following this creator
      const isFollowing = currentUser.following &&
                         (currentUser.following.includes(creator.id) ||
                          currentUser.following.includes(parseInt(creator.id)));

      // Create creator element
      const creatorElement = document.createElement('div');
      creatorElement.className = 'bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all text-center relative overflow-hidden group';

      // Get color for this creator
      const color = colors[index % colors.length];
      const nextColor = colors[(index + 1) % colors.length];

      creatorElement.innerHTML = `
        <!-- Background pattern -->
        <div class="absolute inset-0 bg-gradient-to-br from-${color}-50 to-${color}-100 opacity-10 group-hover:opacity-20 transition-opacity"></div>

        <div class="relative">
          <!-- Avatar -->
          <div class="relative mx-auto mb-4 inline-block">
            <div class="w-24 h-24 rounded-full bg-gradient-to-r from-${color}-500 to-${nextColor}-500 flex items-center justify-center p-0.5">
              <img src="${creator.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&background=random&color=fff&size=96`}" alt="${creator.name}" class="avatar w-full h-full rounded-full">
            </div>
            <div class="absolute rounded-full bottom-0 right-0 bg-${color}-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs border-2 border-white shadow-md">
              <i class="fas fa-check"></i>
            </div>
          </div>

          <!-- Creator Info -->
          <h3 class="font-bold text-lg mb-1">${creator.name}</h3>
          <p class="text-dark-500 text-sm mb-3">@${creator.username}</p>

          <!-- Stats -->
          <div class="flex justify-center space-x-4 text-center text-sm mb-4">
            <div>
              <div class="font-bold text-dark-900">${formatNumber(creator.followers ? creator.followers.length : 0)}</div>
              <div class="text-dark-500 text-xs">Followers</div>
            </div>
            <div>
              <div class="font-bold text-dark-900">${formatNumber(creator.postCount)}</div>
              <div class="text-dark-500 text-xs">Posts</div>
            </div>
          </div>

          <!-- Follow Button -->
          <button class="follow-button w-full py-2 px-4 rounded-xl ${isFollowing ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : `bg-${color}-500 hover:bg-${color}-600 text-white`} font-medium transition-colors shadow-sm hover:shadow" data-user-id="${creator.id}">
            <i class="fas ${isFollowing ? 'fa-user-check' : 'fa-user-plus'} mr-2"></i>${isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>
      `;

      // Add event listener for follow button
      const followButton = creatorElement.querySelector('.follow-button');
      if (followButton) {
        followButton.addEventListener('click', () => toggleFollow(creator.id, currentUser.id, isFollowing, followButton));
      }

      // Add to container
      creatorsContainer.appendChild(creatorElement);
    });
  } catch (error) {
    console.error('Error loading popular creators:', error);
  }
}

/**
 * Toggle follow status
 * @param {string} targetId - The user ID to follow/unfollow
 * @param {string} userId - The current user ID
 * @param {boolean} isFollowing - Current follow status
 * @param {HTMLElement} button - The button element
 */
async function toggleFollow(targetId, userId, isFollowing, button) {
  try {
    // Get current user
    const userResponse = await fetch(`http://localhost:3001/users/${userId}`);
    const user = await userResponse.json();

    // Get target user
    const targetResponse = await fetch(`http://localhost:3001/users/${targetId}`);
    const targetUser = await targetResponse.json();

    if (isFollowing) {
      // Unfollow
      const following = user.following.filter(id => id.toString() !== targetId.toString());
      const followers = targetUser.followers.filter(id => id.toString() !== userId.toString());

      await fetch(`http://localhost:3001/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ following })
      });

      await fetch(`http://localhost:3001/users/${targetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ followers })
      });

      // Update button
      button.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Follow';
      button.classList.remove('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');

      // Get the color class
      const colorClass = Array.from(button.classList).find(cls => cls.startsWith('bg-') && cls.endsWith('-500'));
      if (colorClass) {
        const color = colorClass.split('-')[1];
        button.classList.add(`bg-${color}-500`, `hover:bg-${color}-600`, 'text-white');
      }
    } else {
      // Follow
      const following = [...(user.following || []), targetId];
      const followers = [...(targetUser.followers || []), userId];

      await fetch(`http://localhost:3001/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ following })
      });

      await fetch(`http://localhost:3001/users/${targetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ followers })
      });

      // Update button
      button.innerHTML = '<i class="fas fa-user-check mr-2"></i>Following';

      // Remove color classes
      const colorClass = Array.from(button.classList).find(cls => cls.startsWith('bg-') && cls.endsWith('-500'));
      const hoverClass = Array.from(button.classList).find(cls => cls.startsWith('hover:bg-') && cls.endsWith('-600'));

      if (colorClass) button.classList.remove(colorClass, 'text-white');
      if (hoverClass) button.classList.remove(hoverClass);

      button.classList.add('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
    }

    // Update localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.id === userId) {
      if (isFollowing) {
        currentUser.following = currentUser.following.filter(id => id.toString() !== targetId.toString());
      } else {
        currentUser.following = [...(currentUser.following || []), targetId];
      }
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
  }
}

/**
 * Load trending topics
 */
async function loadTrendingTopics() {
  try {
    // Get the container
    const topicsContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-6');
    if (!topicsContainer) return;

    // For now, we'll keep the existing topics since they're not in the database
    // In a future update, we could add a topics collection to db.json

    // Fetch all posts to extract hashtags
    const postsResponse = await fetch('http://localhost:3001/posts');
    const posts = await postsResponse.json();

    // Extract hashtags from post content
    const hashtagRegex = /#(\w+)/g;
    const hashtags = {};

    posts.forEach(post => {
      if (!post.content) return;

      const matches = post.content.match(hashtagRegex);
      if (matches) {
        matches.forEach(tag => {
          const cleanTag = tag.substring(1); // Remove the # symbol
          if (hashtags[cleanTag]) {
            hashtags[cleanTag]++;
          } else {
            hashtags[cleanTag] = 1;
          }
        });
      }
    });

    // Convert to array and sort by count
    const hashtagArray = Object.entries(hashtags).map(([tag, count]) => ({ tag, count }));
    hashtagArray.sort((a, b) => b.count - a.count);

    // Take top 3 hashtags
    const topHashtags = hashtagArray.slice(0, 3);

    // If we have at least one hashtag, update the first topic
    if (topHashtags.length > 0) {
      const firstTopic = topicsContainer.querySelector('.bg-gradient-to-br.from-blue-500');
      if (firstTopic) {
        const tagElement = firstTopic.querySelector('.text-2xl.font-bold');
        const countElement = firstTopic.querySelector('.flex.items-center.text-white\\/80 span');

        if (tagElement) {
          tagElement.textContent = `#${topHashtags[0].tag}`;
        }

        if (countElement) {
          countElement.textContent = `${topHashtags[0].count} posts`;
        }
      }
    }

    // If we have at least two hashtags, update the second topic
    if (topHashtags.length > 1) {
      const secondTopic = topicsContainer.querySelector('.bg-gradient-to-br.from-purple-500');
      if (secondTopic) {
        const tagElement = secondTopic.querySelector('.text-2xl.font-bold');
        const countElement = secondTopic.querySelector('.flex.items-center.text-white\\/80 span');

        if (tagElement) {
          tagElement.textContent = `#${topHashtags[1].tag}`;
        }

        if (countElement) {
          countElement.textContent = `${topHashtags[1].count} posts`;
        }
      }
    }

    // If we have at least three hashtags, update the third topic
    if (topHashtags.length > 2) {
      const thirdTopic = topicsContainer.querySelector('.bg-gradient-to-br.from-pink-500');
      if (thirdTopic) {
        const tagElement = thirdTopic.querySelector('.text-2xl.font-bold');
        const countElement = thirdTopic.querySelector('.flex.items-center.text-white\\/80 span');

        if (tagElement) {
          tagElement.textContent = `#${topHashtags[2].tag}`;
        }

        if (countElement) {
          countElement.textContent = `${topHashtags[2].count} posts`;
        }
      }
    }
  } catch (error) {
    console.error('Error loading trending topics:', error);
  }
}

/**
 * Load explore photos
 * @param {Object} currentUser - The logged-in user
 */
async function loadExplorePhotos(currentUser) {
  try {
    // Get the container
    const photosContainer = document.querySelector('.grid.grid-cols-2.md\\:grid-cols-3.lg\\:grid-cols-4.gap-5');
    if (!photosContainer) return;

    // Clear container
    photosContainer.innerHTML = '';

    // Fetch all posts with media
    const postsResponse = await fetch('http://localhost:3001/posts?_sort=createdAt&_order=desc');
    const posts = await postsResponse.json();

    // Filter posts with media and exclude posts by the current user
    const postsWithMedia = posts.filter(post =>
      post.media &&
      post.media.length > 0 &&
      post.userId.toString() !== currentUser.id.toString()
    );

    // Extract all media items
    const allMedia = [];
    postsWithMedia.forEach(post => {
      post.media.forEach(media => {
        if (media.type === 'image') {
          allMedia.push({
            ...media,
            postId: post.id,
            userId: post.userId
          });
        }
      });
    });

    // Take up to 12 media items
    const displayMedia = allMedia.slice(0, 12);

    // Create HTML for each media item
    await Promise.all(displayMedia.map(async (media, index) => {
      // Get user data
      const userResponse = await fetch(`http://localhost:3001/users/${media.userId}`);
      const user = await userResponse.json();

      // Get post data
      const postResponse = await fetch(`http://localhost:3001/posts/${media.postId}`);
      const post = await postResponse.json();

      // Check if current user has liked this post
      const isLiked = post.likes && post.likes.includes(currentUser.id);

      // Create media element
      const mediaElement = document.createElement('div');
      mediaElement.className = `relative group rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all ${index % 5 === 0 ? 'md:col-span-2 md:row-span-2' : ''}`;

      mediaElement.innerHTML = `
        <!-- Image -->
        <img
          src="${media.url}"
          alt="Explore Image"
          class="w-full h-full object-cover ${index % 5 === 0 ? 'aspect-square md:aspect-auto' : 'aspect-square'}"
        >

        <!-- Overlay on hover -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-4">
          <!-- Top actions -->
          <div class="flex justify-end">
            <button class="bookmark-btn text-white hover:text-primary-400 bg-black/30 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300" data-post-id="${media.postId}">
              <i class="fas fa-bookmark"></i>
            </button>
          </div>

          <!-- Bottom content -->
          <div class="transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <!-- User info -->
            <div class="flex items-center space-x-2 mb-3">
              <img src="${user.avatar}" alt="${user.name}" class="avatar w-8 h-8 border-2 border-white">
              <span class="text-white font-medium">${user.name}</span>
            </div>

            <!-- Engagement stats -->
            <div class="text-white flex justify-between items-center">
              <div class="flex space-x-4">
                <button class="like-btn hover:text-primary-400 flex items-center space-x-1 transition-colors ${isLiked ? 'text-primary-400' : ''}" data-post-id="${media.postId}">
                  <i class="fas fa-heart"></i>
                  <span>${formatNumber(post.likes ? post.likes.length : 0)}</span>
                </button>
                <button class="comment-btn hover:text-primary-400 flex items-center space-x-1 transition-colors" data-post-id="${media.postId}">
                  <i class="fas fa-comment"></i>
                  <span>${formatNumber(post.comments ? post.comments.length : 0)}</span>
                </button>
              </div>
              <button class="share-btn hover:text-primary-400 bg-white/10 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center transition-colors" data-post-id="${media.postId}">
                <i class="fas fa-share-alt"></i>
              </button>
            </div>
          </div>
        </div>
      `;

      // Add event listeners
      const likeBtn = mediaElement.querySelector('.like-btn');
      if (likeBtn) {
        likeBtn.addEventListener('click', () => toggleLikePost(media.postId, currentUser.id, likeBtn));
      }

      const commentBtn = mediaElement.querySelector('.comment-btn');
      if (commentBtn) {
        commentBtn.addEventListener('click', () => {
          window.location.href = `/post?id=${media.postId}#comments`;
        });
      }

      const shareBtn = mediaElement.querySelector('.share-btn');
      if (shareBtn) {
        shareBtn.addEventListener('click', () => {
          // Show share dialog
          alert('Share functionality coming soon!');
        });
      }

      const bookmarkBtn = mediaElement.querySelector('.bookmark-btn');
      if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', () => {
          // Toggle bookmark
          bookmarkBtn.classList.toggle('text-primary-400');
          // In a future update, we could add bookmarks to the user object in db.json
        });
      }

      // Add to container
      photosContainer.appendChild(mediaElement);
    }));

    // Add event listener to Load More button
    const loadMoreBtn = document.querySelector('.mt-6.text-center .btn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        // In a future update, we could implement pagination
        alert('Load more functionality coming soon!');
      });
    }
  } catch (error) {
    console.error('Error loading explore photos:', error);
  }
}

/**
 * Set up category buttons
 */
function setupCategoryButtons() {
  const categoryButtons = document.querySelectorAll('.flex.overflow-x-auto.space-x-3.pb-4.mb-8 button');

  categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      categoryButtons.forEach(btn => {
        btn.classList.remove('bg-gradient-to-r', 'from-primary-500', 'to-secondary-500', 'text-white');
        btn.classList.add('bg-white', 'border', 'border-dark-100', 'text-dark-700');
      });

      // Add active class to clicked button
      button.classList.remove('bg-white', 'border', 'border-dark-100', 'text-dark-700');
      button.classList.add('bg-gradient-to-r', 'from-primary-500', 'to-secondary-500', 'text-white');

      // Get category
      const category = button.querySelector('span').textContent;

      // Filter content based on category
      filterContentByCategory(category);
    });
  });
}

/**
 * Filter content by category
 * @param {string} category - The category to filter by
 */
function filterContentByCategory(category) {
  // In a future update, we could implement category filtering
  console.log(`Filtering by category: ${category}`);

  // For now, just show a message
  alert(`Filtering by ${category} - Coming soon!`);
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
    if (isLiked) {
      button.classList.remove('text-primary-400');
    } else {
      button.classList.add('text-primary-400');
    }

    // Update like count
    const likeCountElement = button.querySelector('span');
    if (likeCountElement) {
      likeCountElement.textContent = formatNumber(likes.length);
    }
  } catch (error) {
    console.error('Error toggling like:', error);
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
