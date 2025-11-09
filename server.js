const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const db = new sqlite3.Database('./pet_rental.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  store: new SQLiteStore({
    db: 'sessions.sqlite',
    dir: './'
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Initialize database tables
function initDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      firstName TEXT,
      lastName TEXT,
      phone TEXT,
      location TEXT,
      userType TEXT CHECK(userType IN ('owner', 'renter', 'both')) DEFAULT 'renter',
      profileImage TEXT,
      bio TEXT,
      verified BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Equipment table
    db.run(`CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ownerId INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      subcategory TEXT,
      brand TEXT,
      condition TEXT CHECK(condition IN ('new', 'excellent', 'good', 'fair')) DEFAULT 'good',
      dailyRate REAL NOT NULL,
      weeklyRate REAL,
      monthlyRate REAL,
      deposit REAL DEFAULT 0,
      location TEXT NOT NULL,
      pickupMethod TEXT CHECK(pickupMethod IN ('pickup', 'delivery', 'both')) DEFAULT 'pickup',
      deliveryFee REAL DEFAULT 0,
      images TEXT,
      available BOOLEAN DEFAULT 1,
      insuranceRequired BOOLEAN DEFAULT 1,
      minimumRentalDays INTEGER DEFAULT 1,
      maximumRentalDays INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ownerId) REFERENCES users (id)
    )`);

    // Bookings table
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipmentId INTEGER NOT NULL,
      renterId INTEGER NOT NULL,
      ownerId INTEGER NOT NULL,
      startDate DATE NOT NULL,
      endDate DATE NOT NULL,
      totalDays INTEGER NOT NULL,
      dailyRate REAL NOT NULL,
      totalAmount REAL NOT NULL,
      depositAmount REAL,
      status TEXT CHECK(status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')) DEFAULT 'pending',
      message TEXT,
      specialRequests TEXT,
      pickupMethod TEXT,
      deliveryAddress TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipmentId) REFERENCES equipment (id),
      FOREIGN KEY (renterId) REFERENCES users (id),
      FOREIGN KEY (ownerId) REFERENCES users (id)
    )`);

    // Reviews table
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookingId INTEGER NOT NULL,
      reviewerId INTEGER NOT NULL,
      revieweeId INTEGER NOT NULL,
      equipmentId INTEGER NOT NULL,
      rating INTEGER CHECK(rating >= 1 AND rating <= 5) NOT NULL,
      comment TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bookingId) REFERENCES bookings (id),
      FOREIGN KEY (reviewerId) REFERENCES users (id),
      FOREIGN KEY (revieweeId) REFERENCES users (id),
      FOREIGN KEY (equipmentId) REFERENCES equipment (id)
    )`);

    // Messages table
    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      senderId INTEGER NOT NULL,
      receiverId INTEGER NOT NULL,
      bookingId INTEGER,
      subject TEXT,
      message TEXT NOT NULL,
      read BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (senderId) REFERENCES users (id),
      FOREIGN KEY (receiverId) REFERENCES users (id),
      FOREIGN KEY (bookingId) REFERENCES bookings (id)
    )`);

    // Insert sample data
    insertSampleData();
  });
}

function insertSampleData() {
  // Check if sample data exists
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (err) {
      console.error('Error checking sample data:', err);
      return;
    }

    if (row.count > 0) {
      console.log('Sample data already exists');
      return;
    }

    // Create sample users
    const hashedPassword1 = bcrypt.hashSync('password123', 10);
    const hashedPassword2 = bcrypt.hashSync('password456', 10);
    const hashedPassword3 = bcrypt.hashSync('password789', 10);

    db.run(`INSERT INTO users (username, email, password, firstName, lastName, phone, location, userType, bio) VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'mike_groomer', 'mike@example.com', hashedPassword1, 'Mike', 'Johnson', '555-0101', 'New York, NY', 'owner', 'Professional groomer with 10 years experience',
        'sarah_doglover', 'sarah@example.com', hashedPassword2, 'Sarah', 'Wilson', '555-0102', 'Los Angeles, CA', 'both', 'Dog enthusiast and part-time trainer',
        'alex_newbie', 'alex@example.com', hashedPassword3, 'Alex', 'Chen', '555-0103', 'Chicago, IL', 'renter', 'New dog owner looking for affordable equipment access'
      ]
    );

    // Create sample equipment
    setTimeout(() => {
      db.all("SELECT id FROM users WHERE username = 'mike_groomer'", (err, users) => {
        if (err || !users.length) {
          console.error('Error getting user ID:', err);
          return;
        }

        const ownerId = users[0].id;
        const equipmentData = [
          {
            title: 'Professional Dog Grooming Clippers',
            description: 'High-quality clippers perfect for professional grooming. Includes multiple blade guards and accessories.',
            category: 'Grooming',
            subcategory: 'Clippers',
            brand: 'Andis',
            condition: 'excellent',
            dailyRate: 25,
            weeklyRate: 125,
            monthlyRate: 400,
            deposit: 100,
            location: 'New York, NY',
            pickupMethod: 'both',
            deliveryFee: 15
          },
          {
            title: 'Dog Nail Trimmer Set',
            description: 'Professional grade nail trimmers for all dog sizes. Sharp and durable.',
            category: 'Grooming',
            subcategory: 'Nail Care',
            brand: 'Master Grooming Tools',
            condition: 'good',
            dailyRate: 8,
            weeklyRate: 35,
            monthlyRate: 100,
            deposit: 25,
            location: 'New York, NY',
            pickupMethod: 'pickup'
          },
          {
            title: 'Agility Training Equipment Set',
            description: 'Complete agility training set including jumps, tunnels, and weave poles.',
            category: 'Training',
            subcategory: 'Agility',
            brand: 'Custom',
            condition: 'good',
            dailyRate: 45,
            weeklyRate: 200,
            monthlyRate: 600,
            deposit: 200,
            location: 'Los Angeles, CA',
            pickupMethod: 'pickup'
          }
        ];

        equipmentData.forEach(eq => {
          db.run(`INSERT INTO equipment (ownerId, title, description, category, subcategory, brand, condition, dailyRate, weeklyRate, monthlyRate, deposit, location, pickupMethod, deliveryFee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [ownerId, eq.title, eq.description, eq.category, eq.subcategory, eq.brand, eq.condition, eq.dailyRate, eq.weeklyRate, eq.monthlyRate, eq.deposit, eq.location, eq.pickupMethod, eq.deliveryFee]);
        });

        console.log('Sample data inserted successfully');
      });
    }, 1000);
  });
}

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.json({ error: 'Authentication required' });
  }
  next();
}

// Routes

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// User registration
app.post('/api/register', async (req, res) => {
  const { username, email, password, firstName, lastName, phone, location, userType, bio } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      `INSERT INTO users (username, email, password, firstName, lastName, phone, location, userType, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, firstName || '', lastName || '', phone || '', location || '', userType || 'renter', bio || ''],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: 'Registration failed' });
        }
        
        req.session.userId = this.lastID;
        res.json({ 
          message: 'Registration successful', 
          user: { 
            id: this.lastID, 
            username, 
            email, 
            firstName, 
            lastName,
            userType: userType || 'renter'
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Login failed' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      req.session.userId = user.id;
      res.json({ 
        message: 'Login successful', 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName,
          userType: user.userType
        }
      });
    }
  );
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logout successful' });
});

// Get current user
app.get('/api/me', (req, res) => {
  if (!req.session.userId) {
    return res.json({ user: null });
  }

  db.get(
    'SELECT id, username, email, firstName, lastName, phone, location, userType, bio, createdAt FROM users WHERE id = ?',
    [req.session.userId],
    (err, user) => {
      if (err || !user) {
        return res.json({ user: null });
      }
      res.json({ user });
    }
  );
});

// Equipment routes
app.get('/api/equipment', (req, res) => {
  const { category, location, search, available = 1 } = req.query;
  
  let query = `
    SELECT e.*, u.firstName, u.lastName, u.username 
    FROM equipment e 
    JOIN users u ON e.ownerId = u.id 
    WHERE e.available = ?
  `;
  const params = [available];

  if (category) {
    query += ' AND e.category = ?';
    params.push(category);
  }

  if (location) {
    query += ' AND e.location LIKE ?';
    params.push(`%${location}%`);
  }

  if (search) {
    query += ' AND (e.title LIKE ? OR e.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY e.createdAt DESC';

  db.all(query, params, (err, equipment) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch equipment' });
    }
    
    // Parse images JSON
    equipment.forEach(item => {
      if (item.images) {
        item.images = JSON.parse(item.images);
      } else {
        item.images = [];
      }
    });
    
    res.json({ equipment });
  });
});

app.get('/api/equipment/:id', (req, res) => {
  const equipmentId = req.params.id;

  db.get(
    `SELECT e.*, u.firstName, u.lastName, u.username, u.bio, u.verified 
     FROM equipment e 
     JOIN users u ON e.ownerId = u.id 
     WHERE e.id = ?`,
    [equipmentId],
    (err, equipment) => {
      if (err || !equipment) {
        return res.status(404).json({ error: 'Equipment not found' });
      }

      if (equipment.images) {
        equipment.images = JSON.parse(equipment.images);
      } else {
        equipment.images = [];
      }

      res.json({ equipment });
    }
  );
});

app.post('/api/equipment', requireAuth, (req, res) => {
  const {
    title, description, category, subcategory, brand, condition,
    dailyRate, weeklyRate, monthlyRate, deposit, location,
    pickupMethod, deliveryFee, images, available, insuranceRequired,
    minimumRentalDays, maximumRentalDays
  } = req.body;

  if (!title || !category || !dailyRate || !location) {
    return res.status(400).json({ error: 'Title, category, daily rate, and location are required' });
  }

  db.run(
    `INSERT INTO equipment (ownerId, title, description, category, subcategory, brand, condition, 
     dailyRate, weeklyRate, monthlyRate, deposit, location, pickupMethod, deliveryFee, 
     images, available, insuranceRequired, minimumRentalDays, maximumRentalDays) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.session.userId, title, description || '', category, subcategory || '', 
      brand || '', condition || 'good', dailyRate, weeklyRate, monthlyRate, 
      deposit || 0, location, pickupMethod || 'pickup', deliveryFee || 0,
      JSON.stringify(images || []), available !== false, insuranceRequired !== false,
      minimumRentalDays || 1, maximumRentalDays || null
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create equipment listing' });
      }
      res.json({ message: 'Equipment listed successfully', equipmentId: this.lastID });
    }
  );
});

app.put('/api/equipment/:id', requireAuth, (req, res) => {
  const equipmentId = req.params.id;
  const {
    title, description, category, subcategory, brand, condition,
    dailyRate, weeklyRate, monthlyRate, deposit, location,
    pickupMethod, deliveryFee, images, available, insuranceRequired,
    minimumRentalDays, maximumRentalDays
  } = req.body;

  // Check ownership
  db.get('SELECT ownerId FROM equipment WHERE id = ?', [equipmentId], (err, equipment) => {
    if (err || !equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    if (equipment.ownerId !== req.session.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updates = [];
    const values = [];

    if (title) { updates.push('title = ?'); values.push(title); }
    if (description) { updates.push('description = ?'); values.push(description); }
    if (category) { updates.push('category = ?'); values.push(category); }
    if (subcategory) { updates.push('subcategory = ?'); values.push(subcategory); }
    if (brand) { updates.push('brand = ?'); values.push(brand); }
    if (condition) { updates.push('condition = ?'); values.push(condition); }
    if (dailyRate) { updates.push('dailyRate = ?'); values.push(dailyRate); }
    if (weeklyRate) { updates.push('weeklyRate = ?'); values.push(weeklyRate); }
    if (monthlyRate) { updates.push('monthlyRate = ?'); values.push(monthlyRate); }
    if (deposit !== undefined) { updates.push('deposit = ?'); values.push(deposit); }
    if (location) { updates.push('location = ?'); values.push(location); }
    if (pickupMethod) { updates.push('pickupMethod = ?'); values.push(pickupMethod); }
    if (deliveryFee !== undefined) { updates.push('deliveryFee = ?'); values.push(deliveryFee); }
    if (images) { updates.push('images = ?'); values.push(JSON.stringify(images)); }
    if (available !== undefined) { updates.push('available = ?'); values.push(available ? 1 : 0); }
    if (insuranceRequired !== undefined) { updates.push('insuranceRequired = ?'); values.push(insuranceRequired ? 1 : 0); }
    if (minimumRentalDays) { updates.push('minimumRentalDays = ?'); values.push(minimumRentalDays); }
    if (maximumRentalDays) { updates.push('maximumRentalDays = ?'); values.push(maximumRentalDays); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }

    values.push(equipmentId);

    db.run(
      `UPDATE equipment SET ${updates.join(', ')} WHERE id = ?`,
      values,
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to update equipment' });
        }
        res.json({ message: 'Equipment updated successfully' });
      }
    );
  });
});

// Booking routes
app.post('/api/bookings', requireAuth, (req, res) => {
  const { equipmentId, startDate, endDate, message, specialRequests, pickupMethod, deliveryAddress } = req.body;

  if (!equipmentId || !startDate || !endDate) {
    return res.status(400).json({ error: 'Equipment ID, start date, and end date are required' });
  }

  // Get equipment details
  db.get('SELECT * FROM equipment WHERE id = ?', [equipmentId], (err, equipment) => {
    if (err || !equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (totalDays <= 0) {
      return res.status(400).json({ error: 'Invalid date range' });
    }

    const totalAmount = equipment.dailyRate * totalDays;

    db.run(
      `INSERT INTO bookings (equipmentId, renterId, ownerId, startDate, endDate, totalDays, dailyRate, totalAmount, depositAmount, message, specialRequests, pickupMethod, deliveryAddress) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        equipmentId, req.session.userId, equipment.ownerId, startDate, endDate,
        totalDays, equipment.dailyRate, totalAmount, equipment.deposit,
        message || '', specialRequests || '', pickupMethod || 'pickup', deliveryAddress || ''
      ],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create booking' });
        }
        res.json({ 
          message: 'Booking request sent successfully', 
          bookingId: this.lastID,
          totalAmount,
          depositAmount: equipment.deposit
        });
      }
    );
  });
});

app.get('/api/bookings', requireAuth, (req, res) => {
  const { status, role } = req.query; // role: 'renter' or 'owner'

  let query = `
    SELECT b.*, e.title, e.dailyRate, e.location as equipmentLocation,
           r.firstName as renterFirstName, r.lastName as renterLastName,
           o.firstName as ownerFirstName, o.lastName as ownerLastName
    FROM bookings b
    JOIN equipment e ON b.equipmentId = e.id
    JOIN users r ON b.renterId = r.id
    JOIN users o ON b.ownerId = o.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND b.status = ?';
    params.push(status);
  }

  if (role === 'renter') {
    query += ' AND b.renterId = ?';
    params.push(req.session.userId);
  } else if (role === 'owner') {
    query += ' AND b.ownerId = ?';
    params.push(req.session.userId);
  } else {
    query += ' AND (b.renterId = ? OR b.ownerId = ?)';
    params.push(req.session.userId, req.session.userId);
  }

  query += ' ORDER BY b.createdAt DESC';

  db.all(query, params, (err, bookings) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch bookings' });
    }
    res.json({ bookings });
  });
});

app.put('/api/bookings/:id/status', requireAuth, (req, res) => {
  const bookingId = req.params.id;
  const { status } = req.body;

  if (!['approved', 'rejected', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  // Check if user is the owner
  db.get('SELECT ownerId FROM bookings WHERE id = ?', [bookingId], (err, booking) => {
    if (err || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.ownerId !== req.session.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    db.run(
      'UPDATE bookings SET status = ? WHERE id = ?',
      [status, bookingId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to update booking status' });
        }
        res.json({ message: 'Booking status updated successfully' });
      }
    );
  });
});

// Get user equipment (for dashboard)
app.get('/api/my-equipment', requireAuth, (req, res) => {
  db.all(
    'SELECT * FROM equipment WHERE ownerId = ? ORDER BY createdAt DESC',
    [req.session.userId],
    (err, equipment) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch equipment' });
      }
      
      equipment.forEach(item => {
        if (item.images) {
          item.images = JSON.parse(item.images);
        } else {
          item.images = [];
        }
      });
      
      res.json({ equipment });
    }
  );
});

// Simple search endpoint
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.json({ results: [] });
  }

  const query = `
    SELECT e.*, u.firstName, u.lastName, u.username 
    FROM equipment e 
    JOIN users u ON e.ownerId = u.id 
    WHERE e.available = 1 
    AND (e.title LIKE ? OR e.description LIKE ? OR e.category LIKE ? OR e.brand LIKE ?)
    ORDER BY e.createdAt DESC
    LIMIT 20
  `;
  
  const searchTerm = `%${q}%`;

  db.all(query, [searchTerm, searchTerm, searchTerm, searchTerm], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Search failed' });
    }
    
    results.forEach(item => {
      if (item.images) {
        item.images = JSON.parse(item.images);
      } else {
        item.images = [];
      }
    });
    
    res.json({ results });
  });
});

// Start server
initDatabase();

app.listen(PORT, () => {
  console.log(`Pet Rental MVP Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the application`);
});

module.exports = app;