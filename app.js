const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.render('pages/home', { 
    title: 'Talkie - Home',
    user: {
      name: 'John Doe',
      username: 'johndoe',
      avatar: 'https://i.pravatar.cc/150?img=8',
      notifications: 5,
      messages: 3
    }
  });
});

app.get('/profile', (req, res) => {
  res.render('pages/profile', { 
    title: 'Talkie - Profile',
    user: {
      name: 'John Doe',
      username: 'johndoe',
      avatar: 'https://i.pravatar.cc/150?img=8',
      notifications: 5,
      messages: 3,
      followers: 1250,
      following: 420,
      posts: 86,
      bio: 'Digital creator | Photography enthusiast | Travel lover'
    }
  });
});

app.get('/chat', (req, res) => {
  res.render('pages/chat', { 
    title: 'Talkie - Chat',
    user: {
      name: 'John Doe',
      username: 'johndoe',
      avatar: 'https://i.pravatar.cc/150?img=8',
      notifications: 5,
      messages: 3
    },
    contacts: [
      { id: 1, name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?img=5', online: true, lastMessage: 'Hey, how are you?' },
      { id: 2, name: 'Mike Johnson', avatar: 'https://i.pravatar.cc/150?img=12', online: false, lastMessage: 'Did you see the new movie?' },
      { id: 3, name: 'Sarah Williams', avatar: 'https://i.pravatar.cc/150?img=20', online: true, lastMessage: 'Let\'s meet tomorrow' },
      { id: 4, name: 'Alex Brown', avatar: 'https://i.pravatar.cc/150?img=33', online: false, lastMessage: 'Thanks for your help!' }
    ]
  });
});

app.get('/video-call', (req, res) => {
  res.render('pages/video-call', { 
    title: 'Talkie - Video Call',
    user: {
      name: 'John Doe',
      username: 'johndoe',
      avatar: 'https://i.pravatar.cc/150?img=8'
    },
    caller: {
      name: 'Jane Smith',
      avatar: 'https://i.pravatar.cc/150?img=5'
    }
  });
});

app.get('/notifications', (req, res) => {
  res.render('pages/notifications', { 
    title: 'Talkie - Notifications',
    user: {
      name: 'John Doe',
      username: 'johndoe',
      avatar: 'https://i.pravatar.cc/150?img=8',
      notifications: 5,
      messages: 3
    },
    notifications: [
      { type: 'like', user: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?img=5', content: 'liked your post', time: '2 min ago' },
      { type: 'comment', user: 'Mike Johnson', avatar: 'https://i.pravatar.cc/150?img=12', content: 'commented on your photo', time: '15 min ago' },
      { type: 'follow', user: 'Sarah Williams', avatar: 'https://i.pravatar.cc/150?img=20', content: 'started following you', time: '1 hour ago' },
      { type: 'mention', user: 'Alex Brown', avatar: 'https://i.pravatar.cc/150?img=33', content: 'mentioned you in a comment', time: '3 hours ago' }
    ]
  });
});

app.get('/settings', (req, res) => {
  res.render('pages/settings', { 
    title: 'Talkie - Settings',
    user: {
      name: 'John Doe',
      username: 'johndoe',
      avatar: 'https://i.pravatar.cc/150?img=8',
      email: 'john.doe@example.com',
      phone: '+1 234 567 890',
      notifications: 5,
      messages: 3
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Talkie app listening at http://localhost:${port}`);
});
