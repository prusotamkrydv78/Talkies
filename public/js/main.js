// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Toggle user dropdown
    const userMenuButton = document.getElementById('user-menu-button');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (userMenuButton && userDropdown) {
        userMenuButton.addEventListener('click', function() {
            userDropdown.classList.toggle('hidden');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!userMenuButton.contains(event.target) && !userDropdown.contains(event.target)) {
                userDropdown.classList.add('hidden');
            }
        });
    }
    
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // Dark mode toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    if (darkModeToggle) {
        // Check for saved theme preference or use system preference
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            document.documentElement.classList.add('dark');
            darkModeToggle.checked = true;
        }
        
        darkModeToggle.addEventListener('change', function() {
            if (this.checked) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        });
    }
    
    // Post interactions
    const likeButtons = document.querySelectorAll('.like-button');
    
    likeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const icon = this.querySelector('i');
            const likeCount = this.closest('.post').querySelector('.like-count');
            
            if (icon.classList.contains('far')) {
                // Like
                icon.classList.remove('far');
                icon.classList.add('fas');
                icon.classList.add('text-red-500');
                
                if (likeCount) {
                    const count = parseInt(likeCount.textContent) + 1;
                    likeCount.textContent = count;
                }
            } else {
                // Unlike
                icon.classList.remove('fas');
                icon.classList.remove('text-red-500');
                icon.classList.add('far');
                
                if (likeCount) {
                    const count = parseInt(likeCount.textContent) - 1;
                    likeCount.textContent = count;
                }
            }
        });
    });
    
    // Comment toggle
    const commentButtons = document.querySelectorAll('.comment-button');
    
    commentButtons.forEach(button => {
        button.addEventListener('click', function() {
            const commentsSection = this.closest('.post').querySelector('.comments-section');
            if (commentsSection) {
                commentsSection.classList.toggle('hidden');
            }
        });
    });
    
    // Story navigation
    const storyPrev = document.getElementById('story-prev');
    const storyNext = document.getElementById('story-next');
    const storyContainer = document.querySelector('.stories-container');
    
    if (storyPrev && storyNext && storyContainer) {
        storyPrev.addEventListener('click', function() {
            storyContainer.scrollBy({ left: -200, behavior: 'smooth' });
        });
        
        storyNext.addEventListener('click', function() {
            storyContainer.scrollBy({ left: 200, behavior: 'smooth' });
        });
    }
    
    // Notification read toggle
    const markAsReadButtons = document.querySelectorAll('.mark-as-read');
    
    markAsReadButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const notification = this.closest('.notification');
            notification.classList.remove('bg-primary-50', 'dark:bg-primary-900/10');
            const indicator = notification.querySelector('.unread-indicator');
            if (indicator) {
                indicator.remove();
            }
        });
    });
    
    // Chat message input
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-message');
    const messagesContainer = document.getElementById('messages-container');
    
    if (chatInput && sendButton && messagesContainer) {
        sendButton.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        function sendMessage() {
            const message = chatInput.value.trim();
            if (message) {
                const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                const messageElement = document.createElement('div');
                messageElement.className = 'flex justify-end';
                messageElement.innerHTML = `
                    <div class="max-w-[70%]">
                        <div class="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl rounded-br-none px-4 py-2 shadow-sm">
                            <p class="text-white">${message}</p>
                        </div>
                        <div class="flex items-center mt-1 justify-end">
                            <span class="text-xs text-gray-500 dark:text-gray-400">${time}</span>
                            <span class="ml-2">
                                <i class="fas fa-check text-xs text-gray-400"></i>
                            </span>
                        </div>
                    </div>
                `;
                
                messagesContainer.appendChild(messageElement);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                chatInput.value = '';
            }
        }
    }
    
    // Video call controls
    const videoControls = document.querySelectorAll('.video-control');
    
    videoControls.forEach(control => {
        control.addEventListener('click', function() {
            this.classList.toggle('bg-dark-700');
            this.classList.toggle('bg-primary-500');
            
            const icon = this.querySelector('i');
            if (this.classList.contains('mic-control')) {
                icon.classList.toggle('fa-microphone');
                icon.classList.toggle('fa-microphone-slash');
            } else if (this.classList.contains('video-control')) {
                icon.classList.toggle('fa-video');
                icon.classList.toggle('fa-video-slash');
            }
        });
    });
    
    // Profile tabs
    const profileTabs = document.querySelectorAll('.profile-tab');
    const profileSections = document.querySelectorAll('.profile-section');
    
    if (profileTabs.length && profileSections.length) {
        profileTabs.forEach(tab => {
            tab.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all tabs
                profileTabs.forEach(t => {
                    t.classList.remove('text-primary-500', 'border-b-2', 'border-primary-500');
                    t.classList.add('text-gray-500', 'dark:text-gray-400', 'hover:text-primary-500', 'dark:hover:text-primary-400');
                });
                
                // Add active class to clicked tab
                this.classList.remove('text-gray-500', 'dark:text-gray-400', 'hover:text-primary-500', 'dark:hover:text-primary-400');
                this.classList.add('text-primary-500', 'border-b-2', 'border-primary-500');
                
                // Hide all sections
                profileSections.forEach(section => {
                    section.classList.add('hidden');
                });
                
                // Show corresponding section
                const target = this.getAttribute('href').substring(1);
                document.getElementById(target).classList.remove('hidden');
            });
        });
    }
});
