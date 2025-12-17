/**
 * Toddler Schedule Backend Server
 * 
 * This server provides:
 * - SQLite database for persistent storage
 * - REST API for the React frontend
 * - Webhook relay to Home Assistant
 * 
 * Run with: node server.js
 * Requires: npm install express better-sqlite3 cors
 */

const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ===========================================
// STATIC FILE SERVING
// ===========================================
// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve app.jsx with correct content type for Babel
app.get('/app.jsx', (req, res) => {
  res.setHeader('Content-Type', 'text/babel');
  res.sendFile(path.join(__dirname, 'public', 'app.jsx'));
});

// Initialize SQLite database
const dbPath = process.env.DB_PATH || path.join(__dirname, 'toddler-schedule.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// ===========================================
// DATABASE SCHEMA
// ===========================================
db.exec(`
  -- Settings table (key-value store)
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Kids table
  CREATE TABLE IF NOT EXISTS kids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    color TEXT DEFAULT '#4D96FF',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Daily schedules table
  CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    schedule_type TEXT NOT NULL,
    activities TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, schedule_type)
  );

  -- Activity history for analytics
  CREATE TABLE IF NOT EXISTS activity_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id TEXT NOT NULL,
    activity_name TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
  CREATE INDEX IF NOT EXISTS idx_activity_history_date ON activity_history(started_at);
`);

// ===========================================
// INITIALIZE DEFAULT DATA
// ===========================================
const initDefaults = () => {
  const defaultSettings = {
    home_assistant_url: 'http://homeassistant.local:8123',
    webhook_id: 'toddler-schedule',
    enable_home_assistant: 'false',
    enable_voice_announcements: 'true',
    enable_light_automations: 'true',
    current_season: 'winter',
    location: 'Wisconsin',
    school_days: JSON.stringify([1, 3, 5]),
    school_start: '08:45',
    school_end: '11:45',
    wake_time: '06:30',
    bedtime: '19:30',
    baby_nap_start: '12:30',
    baby_nap_duration: '150',
    toddler_nap_start: '13:30',
    toddler_nap_duration: '90',
    theme: 'purple',
  };

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
  `);

  for (const [key, value] of Object.entries(defaultSettings)) {
    insertSetting.run(key, value);
  }

  // Check if kids exist, if not add defaults
  const kidsCount = db.prepare('SELECT COUNT(*) as count FROM kids').get();
  if (kidsCount.count === 0) {
    const insertKid = db.prepare('INSERT INTO kids (name, age, color) VALUES (?, ?, ?)');
    insertKid.run('Big Brother', 3, '#4D96FF');
    insertKid.run('Little Brother', 1, '#6BCB77');
  }
};

initDefaults();

// ===========================================
// API ROUTES
// ===========================================

// Get all settings
app.get('/api/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    
    for (const row of rows) {
      // Parse JSON values
      if (row.key === 'school_days') {
        settings[row.key] = JSON.parse(row.value);
      } else if (['enable_home_assistant', 'enable_voice_announcements', 'enable_light_automations'].includes(row.key)) {
        settings[row.key] = row.value === 'true';
      } else if (['baby_nap_duration', 'toddler_nap_duration'].includes(row.key)) {
        settings[row.key] = parseInt(row.value);
      } else {
        settings[row.key] = row.value;
      }
    }
    
    // Get kids
    settings.kids = db.prepare('SELECT id, name, age, color FROM kids ORDER BY age DESC').all();
    
    res.json(settings);
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update settings
app.put('/api/settings', (req, res) => {
  try {
    const settings = req.body;
    const updateSetting = db.prepare(`
      INSERT INTO settings (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `);

    const transaction = db.transaction(() => {
      for (const [key, value] of Object.entries(settings)) {
        if (key === 'kids') continue; // Handle separately
        
        let strValue;
        if (Array.isArray(value)) {
          strValue = JSON.stringify(value);
        } else if (typeof value === 'boolean') {
          strValue = value.toString();
        } else if (typeof value === 'number') {
          strValue = value.toString();
        } else {
          strValue = value;
        }
        
        updateSetting.run(key, strValue, strValue);
      }

      // Handle kids separately
      if (settings.kids) {
        // Delete removed kids
        const existingIds = settings.kids.filter(k => k.id).map(k => k.id);
        if (existingIds.length > 0) {
          db.prepare(`DELETE FROM kids WHERE id NOT IN (${existingIds.join(',')})`).run();
        } else {
          db.prepare('DELETE FROM kids').run();
        }

        // Update or insert kids
        const upsertKid = db.prepare(`
          INSERT INTO kids (id, name, age, color)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET name = ?, age = ?, color = ?
        `);
        const insertKid = db.prepare('INSERT INTO kids (name, age, color) VALUES (?, ?, ?)');

        for (const kid of settings.kids) {
          if (kid.id) {
            upsertKid.run(kid.id, kid.name, kid.age, kid.color, kid.name, kid.age, kid.color);
          } else {
            insertKid.run(kid.name, kid.age, kid.color);
          }
        }
      }
    });

    transaction();
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get schedule for a date
app.get('/api/schedule/:date/:type', (req, res) => {
  try {
    const { date, type } = req.params;
    const row = db.prepare(`
      SELECT activities, created_at 
      FROM schedules 
      WHERE date = ? AND schedule_type = ?
    `).get(date, type);

    if (row) {
      res.json({
        activities: JSON.parse(row.activities),
        created_at: row.created_at,
      });
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('Error getting schedule:', error);
    res.status(500).json({ error: 'Failed to get schedule' });
  }
});

// Save schedule for a date
app.post('/api/schedule', (req, res) => {
  try {
    const { date, schedule_type, activities } = req.body;
    
    db.prepare(`
      INSERT INTO schedules (date, schedule_type, activities)
      VALUES (?, ?, ?)
      ON CONFLICT(date, schedule_type) DO UPDATE SET activities = ?, created_at = CURRENT_TIMESTAMP
    `).run(date, schedule_type, JSON.stringify(activities), JSON.stringify(activities));

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving schedule:', error);
    res.status(500).json({ error: 'Failed to save schedule' });
  }
});

// Delete schedule for a date
app.delete('/api/schedule/:date/:type', (req, res) => {
  try {
    const { date, type } = req.params;
    db.prepare('DELETE FROM schedules WHERE date = ? AND schedule_type = ?').run(date, type);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

// Log activity
app.post('/api/activity-log', (req, res) => {
  try {
    const { activity_id, activity_name, activity_type } = req.body;
    
    db.prepare(`
      INSERT INTO activity_history (activity_id, activity_name, activity_type)
      VALUES (?, ?, ?)
    `).run(activity_id, activity_name, activity_type);

    res.json({ success: true });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

// Get activity history (last 7 days)
app.get('/api/activity-history', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM activity_history 
      WHERE started_at >= datetime('now', '-7 days')
      ORDER BY started_at DESC
    `).all();
    
    res.json(rows);
  } catch (error) {
    console.error('Error getting activity history:', error);
    res.status(500).json({ error: 'Failed to get activity history' });
  }
});

// Relay to Home Assistant webhook
app.post('/api/home-assistant/webhook', async (req, res) => {
  try {
    const settings = {};
    const rows = db.prepare('SELECT key, value FROM settings WHERE key IN (?, ?, ?)').all(
      'home_assistant_url', 'webhook_id', 'enable_home_assistant'
    );
    
    for (const row of rows) {
      settings[row.key] = row.value;
    }

    if (settings.enable_home_assistant !== 'true') {
      return res.json({ success: true, message: 'Home Assistant disabled' });
    }

    const webhookUrl = `${settings.home_assistant_url}/api/webhook/${settings.webhook_id}`;
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    res.json({ success: response.ok });
  } catch (error) {
    console.error('Error relaying to Home Assistant:', error);
    res.status(500).json({ error: 'Failed to relay to Home Assistant' });
  }
});

// Cleanup old data (schedules older than 30 days)
app.post('/api/cleanup', (req, res) => {
  try {
    const result = db.prepare(`
      DELETE FROM schedules 
      WHERE date < date('now', '-30 days')
    `).run();

    const historyResult = db.prepare(`
      DELETE FROM activity_history 
      WHERE started_at < datetime('now', '-30 days')
    `).run();

    res.json({ 
      success: true, 
      schedulesDeleted: result.changes,
      historyDeleted: historyResult.changes,
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({ error: 'Failed to cleanup' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===========================================
// SPA FALLBACK
// ===========================================
// Serve index.html for any non-API routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===========================================
// START SERVER
// ===========================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🍼 Toddler Schedule Server running on port ${PORT}`);
  console.log(`📁 Database: ${dbPath}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  db.close();
  process.exit(0);
});
