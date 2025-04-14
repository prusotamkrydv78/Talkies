
import express from 'express';
import layoutMiddleware from './middleware/layout.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fileUpload from 'express-fileupload';

// Import routes
import storiesRoutes from './routes/stories.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 3000;
const app = express();

// Create uploads directory if it doesn't exist - with better error handling
const uploadsDir = path.join(__dirname, 'public', 'uploads');
const postsUploadsDir = path.join(uploadsDir, 'posts');
const storiesUploadsDir = path.join(uploadsDir, 'stories');
const profileUploadsDir = path.join(uploadsDir, 'profiles');

// Ensure directories exist with proper permissions
[uploadsDir, postsUploadsDir, storiesUploadsDir, profileUploadsDir].forEach(dir => {
  try {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
    }
    // Verify directory is writable
    fs.accessSync(dir, fs.constants.W_OK);
    console.log(`Directory is writable: ${dir}`);
  } catch (error) {
    console.error(`Error with directory ${dir}:`, error);
  }
});

// Set EJS as the view engine
app.set('view engine', 'ejs');
// Use layout middleware
app.use(layoutMiddleware);
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save all files to public/images folder
    const uploadDir = path.join(__dirname, 'public', 'images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp and original extension
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${randomString}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    // Accept images and videos only
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

// File upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Create a web-accessible URL for the file
    const filePath = `/images/${req.file.filename}`;
    
    // Return the file path
    res.json({ 
      success: true, 
      filePath: filePath,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a fallback upload endpoint using express-fileupload
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  abortOnLimit: true,
  responseOnLimit: 'File size limit exceeded (10MB)'
}));

// Add a fallback upload endpoint
app.post('/api/upload-fallback', (req, res) => {
  try {
    console.log('Received fallback upload request');
    
    if (!req.files || Object.keys(req.files).length === 0) {
      console.error('No files were uploaded');
      return res.status(400).json({ error: 'No files were uploaded' });
    }
    
    // The name of the input field is 'file'
    const uploadedFile = req.files.file;
    const type = req.body.type || 'posts';
    
    console.log('File details:', {
      name: uploadedFile.name,
      mimetype: uploadedFile.mimetype,
      size: uploadedFile.size
    });
    
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(__dirname, 'public', 'uploads', type);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true, mode: 0o777 });
    }
    
    // Generate unique filename
    const fileExt = path.extname(uploadedFile.name) || '.png';
    const fileName = `${Date.now()}-${uuidv4()}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Move the file to the upload directory
    uploadedFile.mv(filePath, function(err) {
      if (err) {
        console.error('Error moving uploaded file:', err);
        return res.status(500).json({ error: 'Failed to save file', details: err.message });
      }
      
      console.log(`File saved to: ${filePath}`);
      
      // Return the relative path
      const relativePath = `/uploads/${type}/${fileName}`;
      return res.json({
        success: true,
        filePath: relativePath,
        originalName: uploadedFile.name,
        size: uploadedFile.size
      });
    });
  } catch (error) {
    console.error('Error in fallback upload handler:', error);
    return res.status(500).json({ error: 'Failed to process upload', details: error.message });
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

// Add a global error handler middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // Handle multer errors specifically
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        error: 'File too large', 
        details: 'Maximum file size is 10MB' 
      });
    }
    return res.status(400).json({ 
      error: 'File upload error', 
      details: err.message 
    });
  }
  
  // For all other errors
  res.status(500).json({ 
    error: 'Internal server error', 
    details: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message 
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
