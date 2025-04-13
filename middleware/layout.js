// Layout middleware to set default layout and pass path variable to views
export default function layoutMiddleware(req, res, next) {
  // Set default layout
  res.locals.layout = 'main';
  
  // Pass the current path to all views for active menu highlighting
  res.locals.path = req.path;
  
  // Pass user object to views (placeholder for now)
  res.locals.user = {
    name: 'John Doe',
    username: 'johndoe',
    avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff',
    notifications: 3,
    messages: 5
  };
  
  next();
}
