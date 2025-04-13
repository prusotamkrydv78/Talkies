import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// In-memory storage for stories (replace with database in production)
let stories = [];

// Get all stories
router.get('/', (req, res) => {
  // Filter by userId if provided
  const userId = req.query.userId;
  if (userId) {
    const userStories = stories.filter(story => story.userId === userId);
    return res.json(userStories);
  }
  
  // Return all stories
  res.json(stories);
});

// Create a new story
router.post('/', (req, res) => {
  try {
    const { userId, media, caption, privacy, settings, views, createdAt, expiresAt } = req.body;
    
    if (!userId || !media || !media.url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const newStory = {
      id: uuidv4(),
      userId,
      media,
      caption: caption || '',
      privacy: privacy || 'Public',
      settings: settings || {
        allowReplies: true,
        closeFriendsOnly: false,
        hideViewCount: false
      },
      views: views || [],
      createdAt,
      expiresAt
    };
    
    stories.push(newStory);
    res.status(201).json(newStory);
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({ error: 'Failed to create story' });
  }
});

// Get a specific story by ID
router.get('/:id', (req, res) => {
  const story = stories.find(s => s.id === req.params.id);
  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }
  res.json(story);
});

// Delete a story
router.delete('/:id', (req, res) => {
  const storyIndex = stories.findIndex(s => s.id === req.params.id);
  if (storyIndex === -1) {
    return res.status(404).json({ error: 'Story not found' });
  }
  
  const deletedStory = stories[storyIndex];
  stories.splice(storyIndex, 1);
  
  // Optionally delete the media file
  if (deletedStory.media && deletedStory.media.url) {
    const filePath = path.join(process.cwd(), 'public', deletedStory.media.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  
  res.json({ success: true, message: 'Story deleted' });
});

export default router;