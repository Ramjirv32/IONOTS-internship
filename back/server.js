// server.js (Backend - Node.js/Express)
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8001;

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const connectDB = async () => {
  try {
    await pool.connect();
    console.log('Database connected successfully');
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
};

connectDB();

// Basic test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Get all projects for a specific user
app.get('/api/projects', async (req, res) => {
  const userId = req.query.userId;
  try {
    // First get projects created by the user
    const result = await pool.query(`
      SELECT 
        p.*,
        COALESCE(pr.progress, 0) as progress,
        COALESCE(pr.score, 0) as score,
        CASE 
          WHEN p.accepted_by = $1 THEN true 
          ELSE false 
        END as is_accepted
      FROM projects p
      LEFT JOIN progress pr ON p.id = pr.project_id AND pr.candidate_id = $1
      WHERE p.status != 'Completed'
      ORDER BY p.deadline ASC
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create a new project
app.post('/api/projects', async (req, res) => {
  const { name, description, status, deadline } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO projects 
        (name, description, status, deadline) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [name, description, status || 'Pending', deadline]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project progress
app.post('/api/progress/update', async (req, res) => {
  const { project_id, candidate_id, progress, score } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO progress (project_id, candidate_id, progress, score)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (project_id, candidate_id) 
      DO UPDATE SET 
        progress = $3,
        score = $4,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [project_id, candidate_id, progress, score]);
    
    // If progress is 100%, update project status to completed
    if (progress === 100) {
      await pool.query(
        'UPDATE projects SET status = $1 WHERE id = $2',
        ['Completed', project_id]
      );
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating progress:', err);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Accept project
app.post('/api/projects/accept', async (req, res) => {
  const { project_id, candidate_id } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update project status
    await client.query(`
      UPDATE projects 
      SET status = 'Accepted', 
          accepted_at = CURRENT_TIMESTAMP, 
          accepted_by = $1
      WHERE id = $2
    `, [candidate_id, project_id]);

    // Initialize progress record
    await client.query(`
      INSERT INTO progress (project_id, candidate_id, progress, score)
      VALUES ($1, $2, 0, 0)
      ON CONFLICT (project_id, candidate_id) DO NOTHING
    `, [project_id, candidate_id]);

    await client.query('COMMIT');
    res.json({ message: 'Project accepted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error accepting project:', err);
    res.status(500).json({ error: 'Failed to accept project' });
  } finally {
    client.release();
  }
});

// Add sample projects route
app.post('/api/projects/samples', async (req, res) => {
  try {
    const sampleProjects = [
      {
        name: 'Mobile App Development',
        description: 'Create a cross-platform mobile application using React Native. Features include user authentication, real-time data sync, and offline functionality.',
        status: 'Pending',
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)
      },
      {
        name: 'Data Analytics Dashboard',
        description: 'Build an interactive dashboard for visualizing business metrics. Implement charts, filters, and export functionality using D3.js and React.',
        status: 'Pending',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      },
      {
        name: 'E-commerce Platform',
        description: 'Develop a full-stack e-commerce solution with features like product catalog, shopping cart, payment integration, and order management.',
        status: 'Pending',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    ];

    for (const project of sampleProjects) {
      await pool.query(
        `INSERT INTO projects (name, description, status, deadline) 
         VALUES ($1, $2, $3, $4)`,
        [project.name, project.description, project.status, project.deadline]
      );
    }

    res.json({ message: 'Sample projects added successfully' });
  } catch (err) {
    console.error('Error adding sample projects:', err);
    res.status(500).json({ error: 'Failed to add sample projects' });
  }
});

// Add this new route to get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.uid as candidate_id,
        u.display_name,
        u.email,
        u.photo_url,
        COALESCE(SUM(p.score), 0) as total_score,
        COUNT(DISTINCT p.project_id) as projects_completed,
        MAX(p.updated_at) as last_activity
      FROM users u
      LEFT JOIN progress p ON u.uid = p.candidate_id
      GROUP BY u.uid, u.display_name, u.email, u.photo_url
      ORDER BY total_score DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Add new route to save user data when they log in
app.post('/api/users', async (req, res) => {
  const { uid, email, displayName, photoURL } = req.body;
  try {
    await pool.query(`
      INSERT INTO users (uid, email, display_name, photo_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (uid) 
      DO UPDATE SET 
        email = $2,
        display_name = $3,
        photo_url = $4
    `, [uid, email, displayName, photoURL]);
    res.json({ message: 'User data saved' });
  } catch (err) {
    console.error('Error saving user:', err);
    res.status(500).json({ error: 'Failed to save user' });
  }
});

// Add error logging middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Add request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Start server with error handling
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Trying port ${port + 1}`);
    app.listen(port + 1);
  } else {
    console.error('Server error:', err);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    pool.end();
    console.log('Server closed');
  });
});
