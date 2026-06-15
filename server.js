const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin2024';

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/results', async (req, res) => {
  try {
    const { name, age, bday, city, email, phone, score, wrongCount, skipped, percent, startTime } = req.body;
    await pool.query(
      `INSERT INTO quiz_results (name, age, birthday, city, email, phone, score, wrong_count, skipped, percent, start_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [name, age, bday || null, city, email, phone, score, wrongCount, skipped, percent, startTime || null]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving result:', err);
    res.status(500).json({ success: false, error: 'Failed to save result' });
  }
});

app.get('/api/results', async (req, res) => {
  const pwd = req.headers['x-admin-password'];
  if (pwd !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query(
      'SELECT * FROM quiz_results ORDER BY submitted_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching results:', err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

app.delete('/api/results/:id', async (req, res) => {
  const pwd = req.headers['x-admin-password'];
  if (pwd !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    await pool.query('DELETE FROM quiz_results WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
