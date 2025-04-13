document.addEventListener('DOMContentLoaded', function() {
  // Desktop sidebar toggle functionality
  const sidebarToggle = document.getElementById('sidebarToggle');
  const desktopSidebar = document.getElementById('desktopSidebar');
  const sidebarTexts = document.querySelectorAll('.sidebar-text');
  const tooltips = document.querySelectorAll('.tooltip');

  if (sidebarToggle && desktopSidebar) {
    sidebarToggle.addEventListener('click', function() {
      const isExpanded = desktopSidebar.getAttribute('data-expanded') === 'true';

      if (isExpanded) {
        // Collapse sidebar
        desktopSidebar.style.width = '80px';
        desktopSidebar.setAttribute('data-expanded', 'false');
        sidebarToggle.querySelector('i').style.transform = 'rotate(0deg)';

        // Hide text elements
        sidebarTexts.forEach(text => {
          text.style.opacity = '0';
          text.style.width = '0';
        });

        // Show tooltips
        tooltips.forEach(tooltip => {
          tooltip.style.display = 'block';
        });
      } else {
        // Expand sidebar
        desktopSidebar.style.width = '240px';
        desktopSidebar.setAttribute('data-expanded', 'true');
        sidebarToggle.querySelector('i').style.transform = 'rotate(180deg)';

        // Show text elements
        sidebarTexts.forEach(text => {
          text.style.opacity = '1';
          text.style.width = 'auto';
        });

        // Hide tooltips
        tooltips.forEach(tooltip => {
          tooltip.style.display = 'none';
        });
      }
    });

    // Initialize sidebar in collapsed state
    desktopSidebar.style.width = '80px';
  }
  // Mobile sidebar functionality
  const openSidebarBtn = document.getElementById('openSidebar');
  const closeSidebarBtn = document.getElementById('closeSidebar');
  const mobileSidebar = document.getElementById('mobileSidebar');
  const sidebarContent = document.getElementById('sidebarContent');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');

  if (openSidebarBtn && mobileSidebar) {
    openSidebarBtn.addEventListener('click', function() {
      mobileSidebar.classList.remove('hidden');
      setTimeout(() => {
        sidebarContent.classList.remove('-translate-x-full');
      }, 10);
    });
  }

  if (closeSidebarBtn && mobileSidebar) {
    closeSidebarBtn.addEventListener('click', closeSidebar);
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', closeSidebar);
  }

  function closeSidebar() {
    sidebarContent.classList.add('-translate-x-full');
    setTimeout(() => {
      mobileSidebar.classList.add('hidden');
    }, 300);
  }

  // Mobile search toggle
  const searchBtn = document.querySelector('.md\\:hidden .fa-search');
  const mobileSearch = document.getElementById('mobileSearch');

  if (searchBtn && mobileSearch) {
    searchBtn.closest('button').addEventListener('click', function() {
      mobileSearch.classList.toggle('hidden');
      if (!mobileSearch.classList.contains('hidden')) {
        mobileSearch.querySelector('input').focus();
      }
    });
  }

  // Like button functionality
  const likeButtons = document.querySelectorAll('.fa-heart, .fa-thumbs-up').forEach(button => {
    button.closest('button')?.addEventListener('click', function(e) {
      const likeCount = this.closest('.card').querySelector('.text-dark-500 span:first-child, .text-dark-400 span:first-child');
      if (likeCount) {
        const currentLikes = parseInt(likeCount.textContent);
        if (this.classList.contains('text-primary-500')) {
          likeCount.textContent = `${currentLikes - 1} likes`;
          this.classList.remove('text-primary-500');
          this.classList.add('text-dark-500');
        } else {
          likeCount.textContent = `${currentLikes + 1} likes`;
          this.classList.remove('text-dark-500');
          this.classList.add('text-primary-500');

          // Add heart animation
          const heart = document.createElement('div');
          heart.classList.add('heart-animation');
          heart.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:var(--tw-color-primary-500); font-size:2rem; opacity:0; animation: heart-burst 0.8s ease-out;';
          heart.innerHTML = '<i class="fas fa-heart"></i>';
          this.style.position = 'relative';
          this.appendChild(heart);

          setTimeout(() => {
            heart.remove();
          }, 800);
        }
      }
    });
  });

  // Comment button functionality
  const commentButtons = document.querySelectorAll('.fa-comment').forEach(button => {
    button.closest('button')?.addEventListener('click', function(e) {
      const commentInput = this.closest('.card').querySelector('input[placeholder="Write a comment..."]');
      if (commentInput) {
        commentInput.focus();
      }
    });
  });

  // Post creation text area auto-resize
  const textArea = document.querySelector('textarea[placeholder="What\'s on your mind?"]');
  if (textArea) {
    textArea.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight) + 'px';
    });
  }

  // File upload functionality
  const uploadArea = document.querySelector('.border-dashed');
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.multiple = true;
  fileInput.accept = 'image/*,video/*';
  fileInput.style.display = 'none';

  if (uploadArea) {
    document.body.appendChild(fileInput);

    uploadArea.addEventListener('click', function() {
      fileInput.click();
    });

    uploadArea.addEventListener('dragover', function(e) {
      e.preventDefault();
      this.classList.add('border-primary-500');
      this.classList.add('bg-primary-50');
    });

    uploadArea.addEventListener('dragleave', function(e) {
      e.preventDefault();
      this.classList.remove('border-primary-500');
      this.classList.remove('bg-primary-50');
    });

    uploadArea.addEventListener('drop', function(e) {
      e.preventDefault();
      this.classList.remove('border-primary-500');
      this.classList.remove('bg-primary-50');

      // Handle file drop
      if (e.dataTransfer.files.length) {
        // In a real app, you would handle the files here
        console.log('Files dropped:', e.dataTransfer.files);

        // Show preview
        const mediaPreview = document.querySelector('.hidden.mb-6');
        if (mediaPreview) {
          mediaPreview.classList.remove('hidden');
        }
      }
    });

    fileInput.addEventListener('change', function() {
      if (this.files.length) {
        // In a real app, you would handle the files here
        console.log('Files selected:', this.files);

        // Show preview
        const mediaPreview = document.querySelector('.hidden.mb-6');
        if (mediaPreview) {
          mediaPreview.classList.remove('hidden');
        }
      }
    });
  }

  // Follow button functionality
  const followButtons = document.querySelectorAll('.btn-primary:not([type="submit"])').forEach(button => {
    if (button.textContent.trim() === 'Follow' || button.textContent.trim() === 'Follow Back') {
      button.addEventListener('click', function() {
        if (this.textContent.trim() === 'Follow' || this.textContent.trim() === 'Follow Back') {
          this.innerHTML = '<i class="fas fa-check mr-2"></i> Following';
          this.classList.remove('btn-primary');
          this.classList.add('btn-outline');
        } else {
          this.innerHTML = 'Follow';
          this.classList.add('btn-primary');
          this.classList.remove('btn-outline');
        }
      });
    }
  });

  // Search functionality
  const searchInputs = document.querySelectorAll('input[placeholder="Search..."]');
  searchInputs.forEach(input => {
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        alert('Search functionality would be implemented with backend integration');
      }
    });
  });

  // Horizontal scroll with mouse wheel for story section
  const storyContainer = document.querySelector('.custom-scrollbar');
  if (storyContainer) {
    storyContainer.addEventListener('wheel', function(e) {
      if (e.deltaY !== 0) {
        e.preventDefault();
        this.scrollLeft += e.deltaY;

        // Add smooth scrolling animation
        this.style.scrollBehavior = 'smooth';

        // Reset scroll behavior after animation
        setTimeout(() => {
          this.style.scrollBehavior = 'auto';
        }, 500);
      }
    });

    // Add enhanced drag to scroll functionality
    let isDown = false;
    let startX;
    let scrollLeft;
    let momentumID;
    let velocity = 0;
    let lastPageX = 0;

    // Apply smooth scrolling behavior
    storyContainer.style.scrollBehavior = 'smooth';

    storyContainer.addEventListener('mousedown', (e) => {
      isDown = true;
      storyContainer.classList.add('cursor-grabbing');
      startX = e.pageX - storyContainer.offsetLeft;
      scrollLeft = storyContainer.scrollLeft;
      lastPageX = e.pageX;

      // Clear any existing momentum scrolling
      cancelAnimationFrame(momentumID);

      // Add visual feedback
      storyContainer.style.transform = 'scale(0.99)';
      storyContainer.style.transition = 'transform 0.2s ease';
    });

    storyContainer.addEventListener('mouseleave', () => {
      if (!isDown) return;
      isDown = false;
      storyContainer.classList.remove('cursor-grabbing');
      storyContainer.style.transform = 'scale(1)';

      // Apply momentum scrolling when mouse leaves
      applyMomentum();
    });

    storyContainer.addEventListener('mouseup', (e) => {
      isDown = false;
      storyContainer.classList.remove('cursor-grabbing');
      storyContainer.style.transform = 'scale(1)';

      // Apply momentum scrolling on mouse up
      applyMomentum();
    });

    storyContainer.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - storyContainer.offsetLeft;
      const walk = (x - startX) * 2.5; // Increased scroll speed multiplier

      // Calculate velocity for momentum
      velocity = e.pageX - lastPageX;
      lastPageX = e.pageX;

      storyContainer.scrollLeft = scrollLeft - walk;
    });

    // Function to apply momentum scrolling
    function applyMomentum() {
      // Apply momentum based on velocity
      if (Math.abs(velocity) > 0.5) {
        momentumID = requestAnimationFrame(animateMomentum);
      }
    }

    function animateMomentum() {
      // Reduce velocity with each frame
      velocity *= 0.95;

      // Apply the scroll
      storyContainer.scrollLeft -= velocity;

      // Continue animation until velocity is very small
      if (Math.abs(velocity) > 0.5) {
        momentumID = requestAnimationFrame(animateMomentum);
      }
    }
  }
});
