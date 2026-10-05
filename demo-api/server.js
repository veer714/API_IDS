const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PRODUCTS = [
  { id: 1, name: "Sentinel Shield Pro", price: 299.00, category: "Security Hardware", inStock: true },
  { id: 2, name: "Quantum Encryption Token", price: 89.50, category: "Hardware Keys", inStock: true },
  { id: 3, name: "Intrusion Guard Edge Appliance", price: 1250.00, category: "Firewalls", inStock: false },
  { id: 4, name: "API Telemetry Hub", price: 450.00, category: "Networking", inStock: true },
  { id: 5, name: "Zero-Trust Endpoint Gateway", price: 680.00, category: "Security Hardware", inStock: true }
];

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'demo-target-ecommerce-api',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Products catalog endpoint
app.get('/api/products', (req, res) => {
  const { search, category } = req.query;
  let results = [...PRODUCTS];

  if (category) {
    const catStr = String(category).toLowerCase();
    results = results.filter(p => p.category.toLowerCase().includes(catStr));
  }

  if (search) {
    const searchStr = String(search).toLowerCase();
    results = results.filter(p => p.name.toLowerCase().includes(searchStr));
  }

  res.json({
    total: results.length,
    query: { search: search || null, category: category || null },
    products: results
  });
});

app.post('/api/products', (req, res) => {
  const { name, price, category, query } = req.body;
  if (query) {
    const results = PRODUCTS.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase()));
    return res.json({ total: results.length, query, products: results });
  }
  const newProduct = {
    id: PRODUCTS.length + 1,
    name: name || "New Product Entry",
    price: price || 99.99,
    category: category || "General",
    inStock: true
  };
  PRODUCTS.push(newProduct);
  res.status(201).json({ message: "Product created successfully", product: newProduct });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  if (username === "demo_customer" && password === "SecurePass2026!") {
    return res.json({
      success: true,
      token: "demo_jwt_customer_token_99a81",
      user: { id: 101, username: "demo_customer", tier: "Gold Member" }
    });
  }

  return res.status(401).json({
    error: "Invalid customer credentials",
    code: "AUTH_FAILURE"
  });
});

// User feedback endpoint (potential XSS target)
app.post('/api/feedback', (req, res) => {
  const { comment, rating, author } = req.body;
  if (!comment) {
    return res.status(400).json({ error: "Comment text is required" });
  }

  res.status(201).json({
    success: true,
    message: "Feedback submitted successfully",
    entry: {
      id: Math.floor(Math.random() * 10000),
      author: author || "Anonymous",
      comment: comment,
      rating: rating || 5,
      createdAt: new Date().toISOString()
    }
  });
});

// File download endpoint (potential Path Traversal target)
app.get('/api/files/download', (req, res) => {
  const { file } = req.query;
  if (!file) {
    return res.status(400).json({ error: "Query parameter 'file' is required" });
  }

  res.json({
    fileRequested: file,
    status: "dispatched",
    sizeBytes: 1024,
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  });
});

// User profile endpoint
app.get('/api/users/profile', (req, res) => {
  res.json({
    id: 101,
    username: "demo_customer",
    email: "customer@cybercorp-store.io",
    accountType: "Enterprise Buyer",
    ordersPlaced: 14,
    lastLogin: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Demo Target API] Running on http://localhost:${PORT}`);
});
