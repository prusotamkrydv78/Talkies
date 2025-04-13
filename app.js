const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const app = express();
const port = process.env.PORT || 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Set up EJS layouts
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.render('pages/home', {
    title: 'Pulse - Home',
    path: '/',
    user: {
      name: 'John Doe',
      username: 'johndoe',
      avatar: 'https://i.pravatar.cc/150?img=8',
      notifications: 5,
      messages: 3
    },
    stories: [
      { id: 1, user: { name: 'Jane Smith', username: 'janesmith', avatar: 'https://i.pravatar.cc/150?img=5' }, image: 'https://source.unsplash.com/random/300x500?nature', viewed: false },
      { id: 2, user: { name: 'Mike Johnson', username: 'mikejohnson', avatar: 'https://i.pravatar.cc/150?img=12' }, image: 'https://source.unsplash.com/random/300x500?city', viewed: true },
      { id: 3, user: { name: 'Sarah Williams', username: 'sarahwilliams', avatar: 'https://i.pravatar.cc/150?img=20' }, image: 'https://source.unsplash.com/random/300x500?people', viewed: false },
      { id: 4, user: { name: 'Alex Brown', username: 'alexbrown', avatar: 'https://i.pravatar.cc/150?img=33' }, image: 'https://source.unsplash.com/random/300x500?travel', viewed: true }
    ],
    posts: [
      {
        id: 1,
        author: { name: 'Jane Smith', username: 'janesmith', avatar: 'https://i.pravatar.cc/150?img=5' },
        content: 'Just finished my morning hike! The view was absolutely breathtaking. Nature always has a way of putting things into perspective. #MorningHike #Nature #Sunrise',
        image: 'https://source.unsplash.com/random/600x400?hiking',
        timeAgo: '15 minutes ago',
        likes: 42,
        comments: 8,
        shares: 3,
        commentsList: [
          { author: { name: 'Mike Johnson', avatar: 'https://i.pravatar.cc/150?img=12' }, content: 'Looks amazing! Where is this?', timeAgo: '10 min ago' },
          { author: { name: 'Sarah Williams', avatar: 'https://i.pravatar.cc/150?img=20' }, content: 'The colors are stunning! 😍', timeAgo: '5 min ago' }
        ]
      },
      {
        id: 2,
        author: { name: 'Mike Johnson', username: 'mikejohnson', avatar: 'https://i.pravatar.cc/150?img=12' },
        content: 'Just got my hands on the latest tech gadget! Can\'t wait to try it out and share my thoughts with you all. #TechReview #NewGadget',
        timeAgo: '2 hours ago',
        likes: 28,
        comments: 14,
        shares: 5,
        commentsList: [
          { author: { name: 'Alex Brown', avatar: 'https://i.pravatar.cc/150?img=33' }, content: 'Let me know how it works!', timeAgo: '1 hour ago' },
          { author: { name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?img=5' }, content: 'I\'ve been thinking about getting one too!', timeAgo: '45 min ago' }
        ]
      },
      {
        id: 3,
        author: { name: 'Sarah Williams', username: 'sarahwilliams', avatar: 'https://i.pravatar.cc/150?img=20' },
        content: 'Just finished reading this amazing book! Highly recommend it to anyone who loves mystery novels with a twist. #BookRecommendation #Reading',
        image: 'https://source.unsplash.com/random/600x400?book',
        timeAgo: '5 hours ago',
        likes: 76,
        comments: 22,
        shares: 12,
        commentsList: [
          { author: { name: 'John Doe', avatar: 'https://i.pravatar.cc/150?img=8' }, content: 'Thanks for the recommendation! Adding it to my list.', timeAgo: '3 hours ago' },
          { author: { name: 'Mike Johnson', avatar: 'https://i.pravatar.cc/150?img=12' }, content: 'I read this last month, it\'s fantastic!', timeAgo: '2 hours ago' }
        ]
      }
    ]
  });
});

app.get('/profile', (req, res) => {
  res.render('pages/profile', {
    title: 'Pulse - Profile',
    path: '/profile',
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

app.get('/messages', (req, res) => {
  res.render('pages/chat', {
    title: 'Pulse - Messages',
    path: '/messages',
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
    title: 'Pulse - Video Call',
    path: '/video-call',
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
    title: 'Pulse - Notifications',
    path: '/notifications',
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
    title: 'Pulse - Settings',
    path: '/settings',
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
  console.log(`Pulse app listening at http://localhost:${port}`);
});
