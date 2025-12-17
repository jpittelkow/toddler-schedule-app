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

  -- Custom activities table
  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    seasons TEXT NOT NULL DEFAULT '["winter","spring","summer","fall"]',
    is_default INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
  CREATE INDEX IF NOT EXISTS idx_activity_history_date ON activity_history(started_at);
  CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
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

  // Seed default activities if none exist
  const activitiesCount = db.prepare('SELECT COUNT(*) as count FROM activities').get();
  if (activitiesCount.count === 0) {
    const defaultActivities = [
      // Indoor activities (all seasons)
      { name: 'Block Tower Building', type: 'building', description: 'Build tall towers together', seasons: ['winter', 'spring', 'summer', 'fall'] },
      { name: 'Dance Party', type: 'dance', description: 'Morning wiggles out', seasons: ['winter', 'spring', 'summer', 'fall'] },
      { name: 'Sensory Bins', type: 'sensory', description: 'Rice and scoop play', seasons: ['winter', 'spring', 'summer', 'fall'] },
      { name: 'Playdough Fun', type: 'craft', description: 'Squish and create', seasons: ['winter', 'spring', 'summer', 'fall'] },
      { name: 'Library Trip', type: 'errand', description: 'Story time and books', seasons: ['winter', 'spring', 'summer', 'fall'] },
      { name: 'Target Adventure', type: 'errand', description: 'Walk around, get out of house', seasons: ['winter', 'spring', 'summer', 'fall'] },
      { name: 'Basement Play', type: 'basement', description: 'Burn energy downstairs', seasons: ['winter', 'spring', 'summer', 'fall'] },
      { name: 'Puzzle Time', type: 'puzzle', description: 'Calm puzzle solving', seasons: ['winter', 'spring', 'summer', 'fall'] },
      { name: 'Blanket Fort', type: 'fort', description: 'Build a cozy hideout', seasons: ['winter', 'spring', 'fall'] },
      { name: 'Story Time', type: 'reading', description: 'Calm reading together', seasons: ['winter', 'spring', 'summer', 'fall'] },
      { name: 'Coloring Books', type: 'craft', description: 'Quiet coloring time', seasons: ['winter', 'spring', 'summer', 'fall'] },
      { name: 'Music Time', type: 'music', description: 'Instruments and singing', seasons: ['winter', 'spring', 'summer', 'fall'] },
      { name: 'Cooking Together', type: 'cooking', description: 'Help in the kitchen', seasons: ['winter', 'spring', 'summer', 'fall'] },
      // Outdoor activities (warmer seasons)
      { name: 'Backyard Bubbles', type: 'outdoor', description: 'Chase bubbles outside', seasons: ['spring', 'summer'] },
      { name: 'Sidewalk Chalk', type: 'outdoor', description: 'Draw on the driveway', seasons: ['spring', 'summer', 'fall'] },
      { name: 'Water Table', type: 'sensory', description: 'Splash and pour', seasons: ['summer'] },
      { name: 'Nature Walk', type: 'outdoor', description: 'Explore the neighborhood', seasons: ['spring', 'summer', 'fall'] },
      { name: 'Playground', type: 'outdoor', description: 'Slides and swings', seasons: ['spring', 'summer', 'fall'] },
      { name: 'Splash Pad', type: 'outdoor', description: 'Cool off with water play', seasons: ['summer'] },
      { name: 'Bug Hunt', type: 'outdoor', description: 'Find crawly friends', seasons: ['spring', 'summer', 'fall'] },
      { name: 'Kiddie Pool', type: 'outdoor', description: 'Backyard water fun', seasons: ['summer'] },
      { name: 'Popsicles & Books', type: 'reading', description: 'Cool treat and stories', seasons: ['summer'] },
      // Winter specific
      { name: 'Snow Play', type: 'snow', description: 'Build snowmen and play', seasons: ['winter'] },
      { name: 'Hot Cocoa Time', type: 'snack', description: 'Warm up with cocoa', seasons: ['winter'] },
    ];

    const insertActivity = db.prepare(`
      INSERT INTO activities (name, type, description, seasons, is_default)
      VALUES (?, ?, ?, ?, 1)
    `);

    for (const activity of defaultActivities) {
      insertActivity.run(
        activity.name,
        activity.type,
        activity.description,
        JSON.stringify(activity.seasons)
      );
    }
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

// ===========================================
// ACTIVITIES CRUD
// ===========================================

// Get all activities (optionally filtered by season)
app.get('/api/activities', (req, res) => {
  try {
    const { season } = req.query;
    let rows;

    if (season) {
      // Filter activities that include this season
      rows = db.prepare(`
        SELECT id, name, type, description, seasons, is_default, created_at
        FROM activities
        ORDER BY is_default DESC, name ASC
      `).all();

      // Filter in JS since SQLite JSON support is limited
      rows = rows.filter(row => {
        const seasons = JSON.parse(row.seasons);
        return seasons.includes(season);
      });
    } else {
      rows = db.prepare(`
        SELECT id, name, type, description, seasons, is_default, created_at
        FROM activities
        ORDER BY is_default DESC, name ASC
      `).all();
    }

    // Parse seasons JSON for each row
    const activities = rows.map(row => ({
      ...row,
      seasons: JSON.parse(row.seasons),
      is_default: row.is_default === 1,
    }));

    res.json({ activities });
  } catch (error) {
    console.error('Error getting activities:', error);
    res.status(500).json({ error: 'Failed to get activities' });
  }
});

// Create a new activity
app.post('/api/activities', (req, res) => {
  try {
    const { name, type, description, seasons } = req.body;

    // Validation
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    if (!seasons || !Array.isArray(seasons) || seasons.length === 0) {
      return res.status(400).json({ error: 'At least one season must be selected' });
    }

    const validSeasons = ['winter', 'spring', 'summer', 'fall'];
    if (!seasons.every(s => validSeasons.includes(s))) {
      return res.status(400).json({ error: 'Invalid season value' });
    }

    const result = db.prepare(`
      INSERT INTO activities (name, type, description, seasons, is_default)
      VALUES (?, ?, ?, ?, 0)
    `).run(name, type, description || '', JSON.stringify(seasons));

    res.json({
      success: true,
      id: result.lastInsertRowid,
      activity: {
        id: result.lastInsertRowid,
        name,
        type,
        description: description || '',
        seasons,
        is_default: false,
      }
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

// Delete an activity
app.delete('/api/activities/:id', (req, res) => {
  try {
    const { id } = req.params;

    // Check if it's a default activity
    const activity = db.prepare('SELECT is_default FROM activities WHERE id = ?').get(id);

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (activity.is_default === 1) {
      return res.status(400).json({ error: 'Cannot delete default activities' });
    }

    db.prepare('DELETE FROM activities WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

// ===========================================
// WEATHER & GEOCODING
// ===========================================

// Weather code to description mapping
const WEATHER_DESCRIPTIONS = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

// Geocode address to coordinates
app.post('/api/geocode', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    // Call Nominatim API (OpenStreetMap geocoding)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'ToddlerScheduleApp/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Address not found. Try a more specific address.' });
    }

    const result = data[0];
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    const displayName = result.display_name;

    // Save to settings
    const updateSetting = db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `);

    updateSetting.run('location_address', address, address);
    updateSetting.run('location_lat', lat.toString(), lat.toString());
    updateSetting.run('location_lon', lon.toString(), lon.toString());
    updateSetting.run('location_display', displayName, displayName);

    // Clear weather cache so it fetches fresh data
    updateSetting.run('weather_cache', '', '');

    res.json({
      success: true,
      lat,
      lon,
      displayName,
    });
  } catch (error) {
    console.error('Error geocoding address:', error);
    res.status(500).json({ error: 'Failed to geocode address' });
  }
});

// Get weather for stored location
app.get('/api/weather', async (req, res) => {
  try {
    // Get location and cache from settings
    const settings = {};
    const rows = db.prepare(`
      SELECT key, value FROM settings
      WHERE key IN ('location_lat', 'location_lon', 'location_display', 'weather_cache')
    `).all();

    for (const row of rows) {
      settings[row.key] = row.value;
    }

    // Check if location is set
    if (!settings.location_lat || !settings.location_lon) {
      return res.status(400).json({
        error: 'Location not set',
        message: 'Please set your location in settings first',
      });
    }

    // Check cache (30 minute expiry)
    if (settings.weather_cache) {
      try {
        const cached = JSON.parse(settings.weather_cache);
        const cacheTime = new Date(cached.timestamp);
        const now = new Date();
        const diffMinutes = (now - cacheTime) / (1000 * 60);

        if (diffMinutes < 30) {
          return res.json(cached.data);
        }
      } catch (e) {
        // Cache invalid, fetch fresh
      }
    }

    // Fetch from Open-Meteo API
    const lat = settings.location_lat;
    const lon = settings.location_lon;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto`;

    const response = await fetch(weatherUrl);

    if (!response.ok) {
      throw new Error('Weather service unavailable');
    }

    const data = await response.json();

    const weatherData = {
      temperature: Math.round(data.current.temperature_2m),
      temperatureUnit: 'F',
      weatherCode: data.current.weather_code,
      weatherDescription: WEATHER_DESCRIPTIONS[data.current.weather_code] || 'Unknown',
      high: Math.round(data.daily.temperature_2m_max[0]),
      low: Math.round(data.daily.temperature_2m_min[0]),
      location: settings.location_display || 'Unknown location',
    };

    // Cache the result
    const cacheData = {
      timestamp: new Date().toISOString(),
      data: weatherData,
    };

    db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES ('weather_cache', ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `).run(JSON.stringify(cacheData), JSON.stringify(cacheData));

    res.json(weatherData);
  } catch (error) {
    console.error('Error fetching weather:', error);
    res.status(500).json({ error: 'Failed to fetch weather' });
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
