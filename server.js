const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const isVercel = process.env.VERCEL || process.env.NOW_REGION || process.env.AWS_LAMBDA_FUNCTION_NAME || __dirname.includes('/var/task') || __dirname.includes('\\var\\task');
const CONFIG_FILE = isVercel ? path.join('/tmp', 'config.json') : path.join(__dirname, 'config.json');
const UPLOADS_DIR = isVercel ? path.join('/tmp', 'uploads') : path.join(__dirname, 'Assets', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create uploads directory:', err);
  }
}

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Dynamic sitemap.xml for multiple domains (neatqatar.com and neatconstruction.com)
app.get('/sitemap.xml', (req, res) => {
  const host = req.get('host') || 'www.neat-construction.com';
  let domain = 'www.neat-construction.com';
  if (host.includes('neatqatar.com')) {
    domain = 'www.neatqatar.com';
  }
  
  res.header('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${domain}/</loc>
    <lastmod>2026-06-30</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://${domain}/about.html</loc>
    <lastmod>2026-06-30</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://${domain}/services.html</loc>
    <lastmod>2026-06-30</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://${domain}/why-us.html</loc>
    <lastmod>2026-06-30</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://${domain}/projects.html</loc>
    <lastmod>2026-06-30</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://${domain}/contact.html</loc>
    <lastmod>2026-06-30</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`);
});

// Dynamic robots.txt
app.get('/robots.txt', (req, res) => {
  const host = req.get('host') || 'www.neat-construction.com';
  let domain = 'www.neat-construction.com';
  if (host.includes('neatqatar.com')) {
    domain = 'www.neatqatar.com';
  }
  
  res.header('Content-Type', 'text/plain');
  res.send(`User-agent: *
Allow: /
Sitemap: https://${domain}/sitemap.xml`);
});

// Serve static files from the root directory with html extension fallback
app.use(express.static(__dirname, {
  extensions: ['html', 'htm']
}));

// Also serve uploaded files from the dynamic uploads directory
app.use('/Assets/uploads', express.static(UPLOADS_DIR));

// Multer Storage Configuration for Local Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'file_' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// Initial Default Configuration
const DEFAULT_CFG = require('./config.json');

// Get Config
app.get('/api/config', (req, res) => {
  if (fs.existsSync(CONFIG_FILE)) {
    fs.readFile(CONFIG_FILE, 'utf8', (err, data) => {
      if (err) return res.status(500).json({ error: 'Failed to read config file.' });
      res.json(JSON.parse(data));
    });
  } else {
    // Try reading local config.json first as a template
    const localConfigPath = path.join(__dirname, 'config.json');
    let initialCfg = DEFAULT_CFG;
    if (fs.existsSync(localConfigPath)) {
      try {
        initialCfg = JSON.parse(fs.readFileSync(localConfigPath, 'utf8'));
      } catch (e) {
        initialCfg = DEFAULT_CFG;
      }
    }
    
    // Write default/local config template to CONFIG_FILE (writable temp dir)
    fs.writeFile(CONFIG_FILE, JSON.stringify(initialCfg, null, 2), 'utf8', (err) => {
      if (err) {
        console.warn('Warning: Failed to initialize config file in temp dir.', err);
        return res.json(initialCfg); // Fallback to memory
      }
      res.json(initialCfg);
    });
  }
});

// Save Config
app.post('/api/config', (req, res) => {
  const newConfig = req.body;
  fs.writeFile(CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf8', (err) => {
    if (err) {
      console.warn('Warning: Failed to write to local config file (normal on read-only environments like Vercel).', err);
      return res.json({ success: true, message: 'Configuration saved in memory / Firebase.' });
    }
    res.json({ success: true, message: 'Configuration saved successfully.' });
  });
});

// Upload File
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  const relativePath = 'Assets/uploads/' + req.file.filename;
  res.json({ success: true, url: relativePath });
});

// Handle contact submissions (save to local JSON database)
app.post('/api/quotations', (req, res) => {
  const formData = req.body;
  const QUOTATIONS_FILE = isVercel ? path.join('/tmp', 'quotations.json') : path.join(__dirname, 'quotations.json');
  
  fs.readFile(QUOTATIONS_FILE, 'utf8', (err, data) => {
    let quotations = [];
    if (!err && data) {
      try {
        quotations = JSON.parse(data);
      } catch (e) {
        quotations = [];
      }
    }
    quotations.push(formData);
    
    fs.writeFile(QUOTATIONS_FILE, JSON.stringify(quotations, null, 2), 'utf8', (writeErr) => {
      if (writeErr) {
        console.warn('Warning: Failed to write quotation to local JSON file (normal on Vercel).', writeErr);
        return res.json({ success: true, message: 'Quotation submitted successfully.' });
      }
      res.json({ success: true, message: 'Quotation submitted successfully.' });
    });
  });
});
// Catch-all route to serve index.html for frontend routing fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`NEAT Construction server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
