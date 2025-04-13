
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

// Serve static files from the public directory
app.use(express.static('public'));

// Configure multer for file uploads with better error handling
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      // Get upload type from request body or default to 'posts'
      const type = req.body.type || 'posts';
      console.log(`Upload type: ${type}`);
      
      // Create absolute path to upload directory
      const uploadPath = path.resolve(__dirname, 'public', 'uploads', type);
      console.log(`Absolute upload path: ${uploadPath}`);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadPath)) {
        console.log(`Creating directory: ${uploadPath}`);
        fs.mkdirSync(uploadPath, { recursive: true, mode: 0o777 });
      }
      
      // Double-check directory exists and is writable
      if (fs.existsSync(uploadPath)) {
        try {
          // Test write permissions by creating and removing a test file
          const testFile = path.join(uploadPath, '.test-write-' + Date.now());
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);
          console.log(`Directory is writable: ${uploadPath}`);
          cb(null, uploadPath);
        } catch (writeErr) {
          console.error(`Directory exists but is not writable: ${uploadPath}`, writeErr);
          cb(new Error(`Upload directory is not writable: ${writeErr.message}`));
        }
      } else {
        console.error(`Failed to create directory: ${uploadPath}`);
        cb(new Error('Failed to create upload directory'));
      }
    } catch (error) {
      console.error('Error setting upload destination:', error);
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    try {
      // Generate unique filename with original extension
      const originalName = file.originalname || 'unknown';
      let fileExt = path.extname(originalName);
      
      // If no extension, try to get from mimetype
      if (!fileExt && file.mimetype) {
        const mimeExt = {
          'image/jpeg': '.jpg',
          'image/png': '.png',
          'image/gif': '.gif',
          'image/webp': '.webp',
          'image/avif': '.png', // Convert AVIF to PNG extension
          'video/mp4': '.mp4',
          'video/quicktime': '.mov',
          'video/webm': '.webm'
        };
        fileExt = mimeExt[file.mimetype] || '';
      }
      
      // Use timestamp + uuid for unique filename
      const fileName = `${Date.now()}-${uuidv4()}${fileExt}`;
      console.log(`Generated filename: ${fileName} from original: ${originalName}`);
      cb(null, fileName);
    } catch (error) {
      console.error('Error generating filename:', error);
      cb(error);
    }
  }
});

// Add file filter to ensure only images and videos are uploaded
const fileFilter = (req, file, cb) => {
  console.log(`Filtering file: ${file.originalname}, mimetype: ${file.mimetype}`);
  
  // Accept images and videos only
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    console.log('File accepted');
    cb(null, true);
  } else {
    console.log('File rejected: not an image or video');
    cb(new Error('Only images and videos are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// API endpoint for file uploads with improved error handling
app.post('/api/upload', (req, res, next) => {
  console.log('Received upload request');
  
  // Create upload directory synchronously before processing the file
  try {
    const type = req.body.type || 'posts';
    const uploadDir = path.join(__dirname, 'public', 'uploads', type);
    
    if (!fs.existsSync(uploadDir)) {
      console.log(`Creating upload directory on demand: ${uploadDir}`);
      fs.mkdirSync(uploadDir, { recursive: true, mode: 0o777 });
    }
  } catch (dirErr) {
    console.error('Error ensuring upload directory exists:', dirErr);
  }
  
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: err.message });
    }
    
    try {
      console.log('File processed by multer');
      
      if (!req.file) {
        console.error('No file in request');
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      console.log('File details:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        destination: req.file.destination,
        filename: req.file.filename
      });
      
      // Return the relative path to the file
      const type = req.body.type || 'posts';
      const relativePath = `/uploads/${type}/${req.file.filename}`;
      const fullPath = req.file.path;
      
      console.log(`File should be at: ${fullPath}`);
      console.log(`Checking if file exists...`);
      
      // Add a small delay before checking if file exists
      setTimeout(() => {
        try {
          if (fs.existsSync(fullPath)) {
            console.log(`File exists at: ${fullPath}`);
            
            // Get file stats to verify it's a valid file
            const stats = fs.statSync(fullPath);
            console.log(`File size: ${stats.size} bytes`);
            
            if (stats.size > 0) {
              return res.json({ 
                success: true, 
                filePath: relativePath,
                originalName: req.file.originalname,
                size: req.file.size
              });
            } else {
              console.error('File exists but has zero size');
              return res.status(500).json({ error: 'File was saved but has zero size' });
            }
          } else {
            console.error(`File not found at path: ${fullPath}`);
            return res.status(500).json({ error: 'File was not saved properly' });
          }
        } catch (checkErr) {
          console.error('Error checking file:', checkErr);
          return res.status(500).json({ error: 'Error verifying file', details: checkErr.message });
        }
      }, 100); // Small delay to ensure file is written
    } catch (error) {
      console.error('Error in upload handler:', error);
      return res.status(500).json({ error: 'Failed to process upload', details: error.message });
    }
  });
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
