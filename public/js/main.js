// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI based on screen size
    function initializeUI() {
        const desktopSidebar = document.getElementById('desktopSidebar');
        const mobileSidebar = document.getElementById('mobileSidebar');

        if (desktopSidebar) {
            if (window.innerWidth >= 1024) { // lg breakpoint
                desktopSidebar.classList.remove('hidden');
                desktopSidebar.classList.add('flex');
            } else {
                desktopSidebar.classList.remove('flex');
                desktopSidebar.classList.add('hidden');
            }
        }

        if (mobileSidebar) {
            mobileSidebar.classList.add('hidden');
        }
    }

    // Initialize UI on page load
    initializeUI();

    // Initialize UI on window resize
    window.addEventListener('resize', initializeUI);
    // Desktop sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const desktopSidebar = document.getElementById('desktopSidebar');
    const sidebarTexts = document.querySelectorAll('.sidebar-text');
    const tooltips = document.querySelectorAll('.tooltip');

    if (sidebarToggle && desktopSidebar) {
        // Initialize sidebar state
        if (window.innerWidth >= 1024) { // lg breakpoint
            desktopSidebar.classList.remove('hidden');
            desktopSidebar.classList.add('flex');
        }

        sidebarToggle.addEventListener('click', function() {
            const isExpanded = desktopSidebar.getAttribute('data-expanded') === 'true';

            if (isExpanded) {
                // Collapse sidebar
                desktopSidebar.setAttribute('data-expanded', 'false');
                sidebarToggle.querySelector('i').classList.remove('rotate-180');

                // Hide text elements
                sidebarTexts.forEach(text => {
                    text.classList.add('opacity-0', 'w-0');
                });

                // Show tooltips
                tooltips.forEach(tooltip => {
                    tooltip.classList.remove('hidden');
                });
            } else {
                // Expand sidebar
                desktopSidebar.setAttribute('data-expanded', 'true');
                sidebarToggle.querySelector('i').classList.add('rotate-180');

                // Show text elements
                sidebarTexts.forEach(text => {
                    text.classList.remove('opacity-0', 'w-0');
                });

                // Hide tooltips
                tooltips.forEach(tooltip => {
                    tooltip.classList.add('hidden');
                });
            }
        });
    }
    // Toggle user dropdown
    const userMenuButton = document.getElementById('user-menu-button');
    const userDropdown = document.getElementById('user-dropdown');

    if (userMenuButton && userDropdown) {
        userMenuButton.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!userMenuButton.contains(event.target) && !userDropdown.contains(event.target)) {
                userDropdown.classList.add('hidden');
            }
        });
    }

    // Mobile sidebar toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const openSidebarButton = document.getElementById('openSidebar');
    const mobileSidebar = document.getElementById('mobileSidebar');
    const sidebarContent = document.getElementById('sidebarContent');
    const closeSidebarButton = document.getElementById('closeSidebar');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    const body = document.body;

    if ((mobileMenuButton || openSidebarButton) && mobileSidebar && sidebarContent) {
        // Toggle mobile sidebar
        const toggleMobileSidebar = (show) => {
            if (show) {
                // Show sidebar
                mobileSidebar.classList.remove('hidden');
                setTimeout(() => {
                    sidebarContent.classList.remove('-translate-x-full');
                    sidebarContent.classList.add('translate-x-0');
                }, 10); // Small delay to ensure transition works
                body.classList.add('overflow-hidden'); // Prevent scrolling
            } else {
                // Hide sidebar
                sidebarContent.classList.remove('translate-x-0');
                sidebarContent.classList.add('-translate-x-full');
                setTimeout(() => {
                    mobileSidebar.classList.add('hidden');
                }, 300); // Wait for transition to complete
                body.classList.remove('overflow-hidden'); // Allow scrolling
            }
        };

        // Toggle sidebar on button click
        if (mobileMenuButton) {
            mobileMenuButton.addEventListener('click', function() {
                toggleMobileSidebar(true);
            });
        }

        if (openSidebarButton) {
            openSidebarButton.addEventListener('click', function() {
                toggleMobileSidebar(true);
            });
        }

        // Close sidebar when clicking close button
        if (closeSidebarButton) {
            closeSidebarButton.addEventListener('click', function() {
                toggleMobileSidebar(false);
            });
        }

        // Close sidebar when clicking on backdrop
        if (sidebarBackdrop) {
            sidebarBackdrop.addEventListener('click', function() {
                toggleMobileSidebar(false);
            });
        }

        // Close mobile sidebar when window is resized to desktop size
        window.addEventListener('resize', function() {
            if (window.innerWidth >= 1024) { // lg breakpoint
                toggleMobileSidebar(false);

                // Show desktop sidebar
                if (desktopSidebar) {
                    desktopSidebar.classList.remove('hidden');
                    desktopSidebar.classList.add('flex');
                }
            } else if (window.innerWidth < 1024 && desktopSidebar) {
                // Hide desktop sidebar on mobile
                desktopSidebar.classList.remove('flex');
                desktopSidebar.classList.add('hidden');
            }
        });

        // Close sidebar on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mobileSidebar && !mobileSidebar.classList.contains('hidden')) {
                toggleMobileSidebar(false);
            }
        });
    }

    // Mobile search toggle
    const mobileSearchToggle = document.getElementById('mobileSearchToggle');
    const mobileSearchPanel = document.getElementById('mobileSearchPanel');

    if (mobileSearchToggle && mobileSearchPanel) {
        mobileSearchToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            mobileSearchPanel.classList.toggle('hidden');

            if (!mobileSearchPanel.classList.contains('hidden')) {
                // Focus the search input when panel is shown
                const searchInput = mobileSearchPanel.querySelector('input');
                if (searchInput) {
                    setTimeout(() => {
                        searchInput.focus();
                    }, 100);
                }
            }
        });

        // Close search panel when clicking outside
        document.addEventListener('click', function(event) {
            if (!mobileSearchToggle.contains(event.target) && !mobileSearchPanel.contains(event.target)) {
                mobileSearchPanel.classList.add('hidden');
            }
        });
    }

    // Mobile search toggle
    const mobileSearchToggle = document.getElementById('mobileSearchToggle');
    const mobileSearchPanel = document.getElementById('mobileSearchPanel');

    if (mobileSearchToggle && mobileSearchPanel) {
        mobileSearchToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            mobileSearchPanel.classList.toggle('hidden');

            if (!mobileSearchPanel.classList.contains('hidden')) {
                // Focus the search input when panel is shown
                const searchInput = mobileSearchPanel.querySelector('input');
                if (searchInput) {
                    setTimeout(() => {
                        searchInput.focus();
                    }, 100);
                }
            }
        });

        // Close search panel when clicking outside
        document.addEventListener('click', function(event) {
            if (!mobileSearchToggle.contains(event.target) && !mobileSearchPanel.contains(event.target)) {
                mobileSearchPanel.classList.add('hidden');
            }
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

    // Add animation classes for mobile menu
    const addAnimationClasses = () => {
        // Add slide-in animation class to CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-slide-in {
                animation: slideIn 0.3s ease-out forwards;
            }
        `;
        document.head.appendChild(style);
    };

    addAnimationClasses();

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
