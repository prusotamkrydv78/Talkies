# Nexus - Social Media Platform

Nexus is a modern social media platform with a unique design that allows users to share their daily experiences, connect with friends, and discover new content.

## Features

- **Home Feed**: View posts from people you follow
- **Profile Page**: Showcase your posts, photos, and personal information
- **Explore Page**: Discover trending topics and new content
- **Notifications**: Stay updated with interactions on your posts
- **Post Creation**: Share your thoughts, photos, and videos

## Tech Stack

- **Frontend**: EJS templates with Tailwind CSS
- **Server**: Node.js with Express

## Design Principles

Nexus features a unique design with:
- A teal/purple gradient theme with coral accents
- Modern UI with rounded corners and subtle shadows
- Distinctive layout that differs from traditional social media platforms

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
```
git clone <repository-url>
```

2. Install dependencies
```
npm install
```

3. Start the server
```
npm start
```

4. For development with auto-reload
```
npm run dev
```

5. Open your browser and navigate to `http://localhost:3000`

## Pages

- **Home**: `/` - Main feed with posts
- **Profile**: `/profile` - User profile page
- **Explore**: `/explore` - Discover new content
- **Notifications**: `/notifications` - View your notifications
- **Create Post**: `/create` - Create a new post

## Project Structure

```
├── middleware/         # Express middleware
├── public/             # Static assets
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   └── images/         # Images
├── views/              # EJS templates
│   ├── layouts/        # Layout templates
│   ├── pages/          # Page templates
│   └── partials/       # Reusable components
├── server.js           # Express server
└── package.json        # Project dependencies
```

## Frontend Functionality

All frontend functionality is implemented using vanilla JavaScript, including:
- Post creation interface
- Like and comment functionality
- Mobile menu toggle
- Image upload interface
- Follow/unfollow actions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Images from [Unsplash](https://unsplash.com)
- Avatar images from [Pravatar](https://pravatar.cc)
- Icons from [Font Awesome](https://fontawesome.com)
