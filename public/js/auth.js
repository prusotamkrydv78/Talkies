/**
 * Authentication Service
 * Handles user authentication, registration, and session management
 */

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is already logged in
  checkAuthStatus();
  
  // Add event listeners to auth forms if they exist
  setupLoginForm();
  setupRegisterForm();
  setupLogoutButton();
});

// Check authentication status
async function checkAuthStatus() {
  try {
    const { loggedIn, user } = await API.Auth.isLoggedIn();
    
    if (loggedIn) {
      // User is logged in
      updateUIForLoggedInUser(user);
    } else {
      // User is not logged in
      updateUIForLoggedOutUser();
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    updateUIForLoggedOutUser();
  }
}

// Update UI for logged in user
function updateUIForLoggedInUser(user) {
  // Update navigation
  const authButtons = document.querySelectorAll('.auth-buttons');
  const userMenus = document.querySelectorAll('.user-menu');
  const userAvatars = document.querySelectorAll('.user-avatar');
  const userNames = document.querySelectorAll('.user-name');
  
  // Hide auth buttons and show user menu
  authButtons.forEach(el => el.classList.add('hidden'));
  userMenus.forEach(el => el.classList.remove('hidden'));
  
  // Update user avatar and name
  userAvatars.forEach(el => {
    if (el.tagName === 'IMG') {
      el.src = user.avatar;
      el.alt = user.name;
    }
  });
  
  userNames.forEach(el => {
    el.textContent = user.name;
  });
  
  // Update create post form if it exists
  const createPostForms = document.querySelectorAll('.create-post-form');
  createPostForms.forEach(form => {
    form.classList.remove('hidden');
    
    const createPostAvatar = form.querySelector('.create-post-avatar');
    if (createPostAvatar) {
      createPostAvatar.src = user.avatar;
      createPostAvatar.alt = user.name;
    }
  });
  
  // Redirect to home page if on login or register page
  const currentPath = window.location.pathname;
  if (currentPath === '/login' || currentPath === '/register') {
    window.location.href = '/';
  }
}

// Update UI for logged out user
function updateUIForLoggedOutUser() {
  // Update navigation
  const authButtons = document.querySelectorAll('.auth-buttons');
  const userMenus = document.querySelectorAll('.user-menu');
  const createPostForms = document.querySelectorAll('.create-post-form');
  
  // Show auth buttons and hide user menu
  authButtons.forEach(el => el.classList.remove('hidden'));
  userMenus.forEach(el => el.classList.add('hidden'));
  
  // Hide create post form
  createPostForms.forEach(form => {
    form.classList.add('hidden');
  });
  
  // Redirect to login page if on protected page
  const currentPath = window.location.pathname;
  const protectedPaths = ['/profile', '/messages', '/notifications', '/create'];
  
  if (protectedPaths.includes(currentPath)) {
    window.location.href = '/login';
  }
}

// Setup login form
function setupLoginForm() {
  const loginForm = document.getElementById('login-form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      // Get form data
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      // Validate form data
      if (!username || !password) {
        showAuthError('Please fill in all fields');
        return;
      }
      
      // Show loading state
      const submitButton = loginForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = 'Logging in...';
      
      try {
        // Login user
        const result = await API.Auth.login(username, password);
        
        if (result.success) {
          // Login successful
          updateUIForLoggedInUser(result.user);
          window.location.href = '/';
        } else {
          // Login failed
          showAuthError(result.message);
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        }
      } catch (error) {
        console.error('Error logging in:', error);
        showAuthError('An error occurred during login');
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    });
  }
}

// Setup register form
function setupRegisterForm() {
  const registerForm = document.getElementById('register-form');
  
  if (registerForm) {
    registerForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      // Get form data
      const name = document.getElementById('name').value;
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      
      // Validate form data
      if (!name || !username || !email || !password || !confirmPassword) {
        showAuthError('Please fill in all fields');
        return;
      }
      
      if (password !== confirmPassword) {
        showAuthError('Passwords do not match');
        return;
      }
      
      // Show loading state
      const submitButton = registerForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = 'Creating account...';
      
      try {
        // Register user
        const result = await API.Auth.register({
          name,
          username,
          email,
          password,
          bio: ''
        });
        
        if (result.success) {
          // Registration successful
          updateUIForLoggedInUser(result.user);
          window.location.href = '/';
        } else {
          // Registration failed
          showAuthError(result.message);
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        }
      } catch (error) {
        console.error('Error registering:', error);
        showAuthError('An error occurred during registration');
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    });
  }
}

// Setup logout button
function setupLogoutButton() {
  const logoutButtons = document.querySelectorAll('.logout-button');
  
  logoutButtons.forEach(button => {
    button.addEventListener('click', async function(event) {
      event.preventDefault();
      
      try {
        // Logout user
        const result = await API.Auth.logout();
        
        if (result.success) {
          // Logout successful
          updateUIForLoggedOutUser();
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Error logging out:', error);
      }
    });
  });
}

// Show auth error
function showAuthError(message) {
  const errorAlert = document.querySelector('.auth-error');
  
  if (errorAlert) {
    errorAlert.textContent = message;
    errorAlert.classList.remove('hidden');
    
    // Hide error after 5 seconds
    setTimeout(() => {
      errorAlert.classList.add('hidden');
    }, 5000);
  }
}
