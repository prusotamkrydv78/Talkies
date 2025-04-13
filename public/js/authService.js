/**
 * Authentication Service
 * Handles user authentication using local storage and JSON Server
 */

// Define AuthService in the global scope
window.AuthService = {
  // API URL
  apiUrl: 'http://localhost:3001',

  // Register a new user
  register: async function(userData) {
    try {
      // Check if username already exists
      const usernameCheck = await fetch(`${this.apiUrl}/users?username=${userData.username}`);
      const usernameExists = await usernameCheck.json();

      if (usernameExists.length > 0) {
        return { success: false, message: 'Username already exists' };
      }

      // Check if email already exists
      const emailCheck = await fetch(`${this.apiUrl}/users?email=${userData.email}`);
      const emailExists = await emailCheck.json();

      if (emailExists.length > 0) {
        return { success: false, message: 'Email already exists' };
      }

      // Create new user
      const response = await fetch(`${this.apiUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...userData,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=0D8ABC&color=fff`,
          followers: [],
          following: [],
          createdAt: new Date().toISOString(),
          notifications: 0,
          messages: 0
        })
      });

      if (!response.ok) {
        throw new Error('Failed to register user');
      }

      const newUser = await response.json();

      // Save user data to local storage
      this.setCurrentUser(newUser);

      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'An error occurred during registration' };
    }
  },

  // Login user
  login: async function(username, password) {
    try {
      // Find user by username
      const response = await fetch(`${this.apiUrl}/users?username=${username}`);
      const users = await response.json();

      if (users.length === 0) {
        return { success: false, message: 'User not found' };
      }

      const user = users[0];

      // Check password (in a real app, you would hash passwords)
      if (user.password !== password) {
        return { success: false, message: 'Invalid password' };
      }

      // Save user data to local storage
      this.setCurrentUser(user);

      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An error occurred during login' };
    }
  },

  // Logout user
  logout: function() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    return { success: true };
  },

  // Check if user is logged in
  isLoggedIn: function() {
    return !!this.getCurrentUser();
  },

  // Get current user
  getCurrentUser: function() {
    const userJson = localStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
  },

  // Set current user
  setCurrentUser: function(user) {
    // Remove password before storing in local storage
    const { password, ...userWithoutPassword } = user;

    // Generate a simple token (in a real app, you would use JWT)
    const token = this.generateToken();

    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    localStorage.setItem('authToken', token);
  },

  // Generate a simple token
  generateToken: function() {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  },

  // Update user profile
  updateProfile: async function(userId, userData) {
    try {
      const response = await fetch(`${this.apiUrl}/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();

      // Update user in local storage
      this.setCurrentUser(updatedUser);

      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: 'An error occurred while updating profile' };
    }
  }
};

// AuthService is now globally available
