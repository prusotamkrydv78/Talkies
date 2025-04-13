
import express from 'express';
import layoutMiddleware from './middleware/layout.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

// Import routes
import storiesRoutes from './routes/stories.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 3000;
const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
const postsUploadsDir = path.join(uploadsDir, 'posts');
const storiesUploadsDir = path.join(uploadsDir, 'stories');
const profileUploadsDir = path.join(uploadsDir, 'profiles');

[uploadsDir, postsUploadsDir, storiesUploadsDir, profileUploadsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Set EJS as the view engine
app.set('view engine', 'ejs');
// Use layout middleware
app.use(layoutMiddleware);
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files from the public directory
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const type = req.body.type || 'posts';
    const uploadPath = path.join(uploadsDir, type);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

const upload = multer({ storage: storage });

// API endpoint for file uploads
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Return the relative path to the file
    const type = req.body.type || 'posts';
    const filePath = `/uploads/${type}/${req.file.filename}`;
    
    res.json({ 
      success: true, 
      filePath: filePath,
      originalName: req.file.originalname
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Routes
app.get('/', (req, res) => {
  res.render('pages/home');
});

app.get('/profile', (req, res) => {
  res.render('pages/profile');
});

app.get('/explore', (req, res) => {
  res.render('pages/explore');
});

app.get('/notifications', (req, res) => {
  res.render('pages/notifications');
});

app.get('/create', (req, res) => {
  res.render('pages/create');
});

app.get('/messages', (req, res) => {
  res.render('pages/messages');
});

// app.get('/auth/login', (req, res) => {
//   res.render('pages/login', { layout: 'auth' });
// });

app.get('/register', (req, res) => {
  res.render('pages/register', { layout: 'auth' });
});

app.get('/forgot-password', (req, res) => {
  res.render('pages/forgot-password', { layout: 'auth' });
});

app.get('/verify-code', (req, res) => {
  res.render('pages/verify-code', { layout: 'auth' });
});

app.get('/reset-password', (req, res) => {
  res.render('pages/reset-password', { layout: 'auth' });
});

app.get('/password-reset-success', (req, res) => {
  res.render('pages/password-reset-success', { layout: 'auth' });
});

app.get('/create-story', (req, res) => {
  res.render('pages/create-story');
});

app.get('/view-story', (req, res) => {
  res.render('pages/view-story', { layout: false });
});

app.get('/stories', (req, res) => {
  res.render('pages/stories');
});
app.get("/auth/login",(req,res)=>{
  res.render("pages/login",{
    layout:"auth"
  })
})
app.get("/auth/register",(req,res)=>{
  res.render("pages/register",{layout:"auth"})
})

// Use routes
app.use('/stories', storiesRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
