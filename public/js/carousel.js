/**
 * Carousel Component
 * Handles carousel/slider functionality for posts with multiple media files
 */

class Carousel {
  constructor(container) {
    this.container = container;
    this.inner = container.querySelector('.carousel-inner');
    this.items = container.querySelectorAll('.carousel-item');
    this.prevBtn = container.querySelector('.carousel-prev');
    this.nextBtn = container.querySelector('.carousel-next');
    this.indicators = container.querySelectorAll('.carousel-indicator');
    this.currentIndex = 0;
    this.itemCount = this.items.length;
    
    // Set data attribute for item count
    this.container.setAttribute('data-items', this.itemCount);
    
    // Initialize
    this.init();
  }
  
  init() {
    // Add event listeners
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.prev());
    }
    
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.next());
    }
    
    // Add indicator event listeners
    this.indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => this.goTo(index));
    });
    
    // Set initial state
    this.updateCarousel();
  }
  
  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.itemCount) % this.itemCount;
    this.updateCarousel();
  }
  
  next() {
    this.currentIndex = (this.currentIndex + 1) % this.itemCount;
    this.updateCarousel();
  }
  
  goTo(index) {
    if (index >= 0 && index < this.itemCount) {
      this.currentIndex = index;
      this.updateCarousel();
    }
  }
  
  updateCarousel() {
    // Update inner position
    if (this.inner) {
      this.inner.style.transform = `translateX(-${this.currentIndex * 100}%)`;
    }
    
    // Update indicators
    this.indicators.forEach((indicator, index) => {
      if (index === this.currentIndex) {
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
      }
    });
  }
}

/**
 * Initialize all carousels on the page
 */
function initCarousels() {
  const carouselContainers = document.querySelectorAll('.carousel-container');
  
  carouselContainers.forEach(container => {
    new Carousel(container);
  });
}

// Initialize carousels when DOM is loaded
document.addEventListener('DOMContentLoaded', initCarousels);

// Make Carousel class available globally
window.Carousel = Carousel;

// Function to initialize a specific carousel
window.initCarousel = function(container) {
  return new Carousel(container);
};

// Function to create a carousel from media array
window.createCarouselFromMedia = function(mediaArray) {
  if (!mediaArray || mediaArray.length === 0) return '';
  
  // If only one media item, return simple HTML
  if (mediaArray.length === 1) {
    const media = mediaArray[0];
    if (media.type === 'image') {
      return `
        <div class="mb-4">
          <img src="${media.url}" alt="Post image" class="w-full rounded-xl">
        </div>
      `;
    } else if (media.type === 'video') {
      return `
        <div class="mb-4">
          <video src="${media.url}" controls class="w-full rounded-xl"></video>
        </div>
      `;
    }
    return '';
  }
  
  // Create carousel HTML for multiple media items
  let carouselItemsHTML = '';
  let indicatorsHTML = '';
  
  mediaArray.forEach((media, index) => {
    // Create carousel item
    if (media.type === 'image') {
      carouselItemsHTML += `
        <div class="carousel-item">
          <img src="${media.url}" alt="Post image ${index + 1}">
        </div>
      `;
    } else if (media.type === 'video') {
      carouselItemsHTML += `
        <div class="carousel-item">
          <video src="${media.url}" controls></video>
        </div>
      `;
    }
    
    // Create indicator
    indicatorsHTML += `
      <div class="carousel-indicator ${index === 0 ? 'active' : ''}"></div>
    `;
  });
  
  // Return complete carousel HTML
  return `
    <div class="carousel-container mb-4" data-items="${mediaArray.length}">
      <div class="carousel-inner">
        ${carouselItemsHTML}
      </div>
      <div class="carousel-controls">
        <div class="carousel-control carousel-prev">
          <i class="fas fa-chevron-left"></i>
        </div>
        <div class="carousel-control carousel-next">
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>
      <div class="carousel-indicators">
        ${indicatorsHTML}
      </div>
    </div>
  `;
};
