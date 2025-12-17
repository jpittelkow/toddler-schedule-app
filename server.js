/**
 * Toddler Schedule Backend Server
 * 
 * This server provides:
 * - SQLite database for persistent storage (using sql.js)
 * - REST API for the React frontend
 * - Webhook relay to Home Assistant
 * 
 * Run with: node server.js
 * Requires: npm install express sql.js cors
 */

const express = require('express');
const initSqlJs = require('sql.js');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ===========================================
// STATIC FILE SERVING
// ===========================================
app.use(express.static(path.join(__dirname, 'public')));

app.get('/app.jsx', (req, res) => {
  res.setHeader('Content-Type', 'text/babel');
  res.sendFile(path.join(__dirname, 'public', 'app.jsx'));
});

// Database
let db = null;
const dbPath = process.env.DB_PATH || path.join(__dirname, 'toddler-schedule.db');

// Helper to save database
const saveDatabase = () => {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
};

// Helper to run query and get results as objects
const queryAll = (sql, params = []) => {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
};

const queryOne = (sql, params = []) => {
  const results = queryAll(sql, params);
  return results[0] || null;
};

const run = (sql, params = []) => {
  db.run(sql, params);
  saveDatabase();
};

// ===========================================
// INITIALIZE DATABASE
// ===========================================
const initDatabase = async () => {
  const SQL = await initSqlJs();
  
  try {
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
      console.log('📂 Loaded existing database');
    } else {
      db = new SQL.Database();
      console.log('📂 Created new database');
    }
  } catch (err) {
    console.log('📂 Creating fresh database:', err.message);
    db = new SQL.Database();
  }

  // Create schema
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS kids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      color TEXT DEFAULT '#4D96FF',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      schedule_type TEXT NOT NULL,
      activities TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, schedule_type)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS activity_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id TEXT NOT NULL,
      activity_name TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      seasons TEXT NOT NULL DEFAULT '["winter","spring","summer","fall"]',
      is_default INTEGER DEFAULT 0,
      thumbs_up INTEGER DEFAULT 0,
      thumbs_down INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS activity_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      rating INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(activity_id, date)
    )
  `);

  // Migration: Add thumbs_up and thumbs_down columns to activities if they don't exist
  try {
    const tableInfo = queryAll("PRAGMA table_info(activities)");
    const hasThumbsUp = tableInfo.some(col => col.name === 'thumbs_up');
    const hasThumbsDown = tableInfo.some(col => col.name === 'thumbs_down');
    
    if (!hasThumbsUp) {
      db.run('ALTER TABLE activities ADD COLUMN thumbs_up INTEGER DEFAULT 0');
      console.log('📊 Added thumbs_up column to activities');
    }
    if (!hasThumbsDown) {
      db.run('ALTER TABLE activities ADD COLUMN thumbs_down INTEGER DEFAULT 0');
      console.log('📊 Added thumbs_down column to activities');
    }
  } catch (err) {
    console.log('Migration check for activities columns:', err.message);
  }

  // Initialize defaults
  initDefaults();
  saveDatabase();
};

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

  for (const [key, value] of Object.entries(defaultSettings)) {
    db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, value]);
  }

  // Check if kids exist
  const kidsCount = queryOne('SELECT COUNT(*) as count FROM kids');
  if (kidsCount.count === 0) {
    db.run('INSERT INTO kids (name, age, color) VALUES (?, ?, ?)', ['Big Brother', 3, '#4D96FF']);
    db.run('INSERT INTO kids (name, age, color) VALUES (?, ?, ?)', ['Little Brother', 1, '#6BCB77']);
  }

  // Seed default activities
  const activitiesCount = queryOne('SELECT COUNT(*) as count FROM activities');
  if (activitiesCount.count === 0) {
    const defaultActivities = [
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
      { name: 'Backyard Bubbles', type: 'outdoor', description: 'Chase bubbles outside', seasons: ['spring', 'summer'] },
      { name: 'Sidewalk Chalk', type: 'outdoor', description: 'Draw on the driveway', seasons: ['spring', 'summer', 'fall'] },
      { name: 'Water Table', type: 'sensory', description: 'Splash and pour', seasons: ['summer'] },
      { name: 'Nature Walk', type: 'outdoor', description: 'Explore the neighborhood', seasons: ['spring', 'summer', 'fall'] },
      { name: 'Playground', type: 'outdoor', description: 'Slides and swings', seasons: ['spring', 'summer', 'fall'] },
      { name: 'Splash Pad', type: 'outdoor', description: 'Cool off with water play', seasons: ['summer'] },
      { name: 'Bug Hunt', type: 'outdoor', description: 'Find crawly friends', seasons: ['spring', 'summer', 'fall'] },
      { name: 'Kiddie Pool', type: 'outdoor', description: 'Backyard water fun', seasons: ['summer'] },
      { name: 'Popsicles & Books', type: 'reading', description: 'Cool treat and stories', seasons: ['summer'] },
      { name: 'Snow Play', type: 'snow', description: 'Build snowmen and play', seasons: ['winter'] },
      { name: 'Hot Cocoa Time', type: 'snack', description: 'Warm up with cocoa', seasons: ['winter'] },
    ];

    for (const activity of defaultActivities) {
      db.run(
        'INSERT INTO activities (name, type, description, seasons, is_default) VALUES (?, ?, ?, ?, 1)',
        [activity.name, activity.type, activity.description, JSON.stringify(activity.seasons)]
      );
    }
  }
};

// ===========================================
// API ROUTES
// ===========================================

// Get all settings
app.get('/api/settings', (req, res) => {
  try {
    const rows = queryAll('SELECT key, value FROM settings');
    const settings = {};
    
    for (const row of rows) {
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
    
    settings.kids = queryAll('SELECT id, name, age, color FROM kids ORDER BY age DESC');
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

    for (const [key, value] of Object.entries(settings)) {
      if (key === 'kids') continue;
      
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
      
      db.run(
        'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP',
        [key, strValue, strValue]
      );
    }

    if (settings.kids) {
      const existingIds = settings.kids.filter(k => k.id).map(k => k.id);
      if (existingIds.length > 0) {
        db.run(`DELETE FROM kids WHERE id NOT IN (${existingIds.join(',')})`);
      } else {
        db.run('DELETE FROM kids');
      }

      for (const kid of settings.kids) {
        if (kid.id) {
          db.run(
            'INSERT INTO kids (id, name, age, color) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = ?, age = ?, color = ?',
            [kid.id, kid.name, kid.age, kid.color, kid.name, kid.age, kid.color]
          );
        } else {
          db.run('INSERT INTO kids (name, age, color) VALUES (?, ?, ?)', [kid.name, kid.age, kid.color]);
        }
      }
    }

    saveDatabase();
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
    const row = queryOne(
      'SELECT activities, created_at FROM schedules WHERE date = ? AND schedule_type = ?',
      [date, type]
    );

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
    
    db.run(
      'INSERT INTO schedules (date, schedule_type, activities) VALUES (?, ?, ?) ON CONFLICT(date, schedule_type) DO UPDATE SET activities = ?, created_at = CURRENT_TIMESTAMP',
      [date, schedule_type, JSON.stringify(activities), JSON.stringify(activities)]
    );

    saveDatabase();
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
    db.run('DELETE FROM schedules WHERE date = ? AND schedule_type = ?', [date, type]);
    saveDatabase();
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
    db.run(
      'INSERT INTO activity_history (activity_id, activity_name, activity_type) VALUES (?, ?, ?)',
      [activity_id, activity_name, activity_type]
    );
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

// Get activity history
app.get('/api/activity-history', (req, res) => {
  try {
    const rows = queryAll(
      "SELECT * FROM activity_history WHERE started_at >= datetime('now', '-7 days') ORDER BY started_at DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error('Error getting activity history:', error);
    res.status(500).json({ error: 'Failed to get activity history' });
  }
});

// ===========================================
// ACTIVITIES CRUD
// ===========================================

app.get('/api/activities', (req, res) => {
  try {
    const { season } = req.query;
    let rows = queryAll(
      'SELECT id, name, type, description, seasons, is_default, thumbs_up, thumbs_down, created_at FROM activities ORDER BY is_default DESC, name ASC'
    );

    if (season) {
      rows = rows.filter(row => {
        const seasons = JSON.parse(row.seasons);
        return seasons.includes(season);
      });
    }

    const activities = rows.map(row => ({
      ...row,
      seasons: JSON.parse(row.seasons),
      is_default: row.is_default === 1,
      thumbs_up: row.thumbs_up || 0,
      thumbs_down: row.thumbs_down || 0,
      // Calculate weight: base 10, +2 per thumbs up, -3 per thumbs down (min 1)
      weight: Math.max(1, 10 + (row.thumbs_up || 0) * 2 - (row.thumbs_down || 0) * 3),
    }));

    res.json({ activities });
  } catch (error) {
    console.error('Error getting activities:', error);
    res.status(500).json({ error: 'Failed to get activities' });
  }
});

app.post('/api/activities', (req, res) => {
  try {
    const { name, type, description, seasons } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    if (!seasons || !Array.isArray(seasons) || seasons.length === 0) {
      return res.status(400).json({ error: 'At least one season must be selected' });
    }

    db.run(
      'INSERT INTO activities (name, type, description, seasons, is_default) VALUES (?, ?, ?, ?, 0)',
      [name, type, description || '', JSON.stringify(seasons)]
    );

    const lastId = queryOne('SELECT last_insert_rowid() as id');
    saveDatabase();

    res.json({
      success: true,
      id: lastId.id,
      activity: { id: lastId.id, name, type, description: description || '', seasons, is_default: false }
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

app.delete('/api/activities/:id', (req, res) => {
  try {
    const { id } = req.params;
    const activity = queryOne('SELECT is_default FROM activities WHERE id = ?', [id]);

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (activity.is_default === 1) {
      return res.status(400).json({ error: 'Cannot delete default activities' });
    }

    db.run('DELETE FROM activities WHERE id = ?', [id]);
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

// Rate an activity (thumbs up or down)
app.post('/api/activities/:id/rate', (req, res) => {
  try {
    const { id } = req.params;
    const { rating, date } = req.body; // rating: 1 (thumbs up) or -1 (thumbs down)

    if (rating !== 1 && rating !== -1) {
      return res.status(400).json({ error: 'Rating must be 1 or -1' });
    }

    const activity = queryOne('SELECT id, thumbs_up, thumbs_down FROM activities WHERE id = ?', [id]);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Check if already rated for this date
    const existingRating = queryOne(
      'SELECT rating FROM activity_ratings WHERE activity_id = ? AND date = ?',
      [id, date]
    );

    if (existingRating) {
      // Update existing rating
      const oldRating = existingRating.rating;
      if (oldRating !== rating) {
        // Remove old rating effect
        if (oldRating === 1) {
          db.run('UPDATE activities SET thumbs_up = thumbs_up - 1 WHERE id = ?', [id]);
        } else {
          db.run('UPDATE activities SET thumbs_down = thumbs_down - 1 WHERE id = ?', [id]);
        }
        // Apply new rating
        if (rating === 1) {
          db.run('UPDATE activities SET thumbs_up = thumbs_up + 1 WHERE id = ?', [id]);
        } else {
          db.run('UPDATE activities SET thumbs_down = thumbs_down + 1 WHERE id = ?', [id]);
        }
        db.run('UPDATE activity_ratings SET rating = ? WHERE activity_id = ? AND date = ?', [rating, id, date]);
      }
    } else {
      // New rating
      if (rating === 1) {
        db.run('UPDATE activities SET thumbs_up = thumbs_up + 1 WHERE id = ?', [id]);
      } else {
        db.run('UPDATE activities SET thumbs_down = thumbs_down + 1 WHERE id = ?', [id]);
      }
      db.run('INSERT INTO activity_ratings (activity_id, date, rating) VALUES (?, ?, ?)', [id, date, rating]);
    }

    saveDatabase();

    // Return updated activity
    const updated = queryOne('SELECT thumbs_up, thumbs_down FROM activities WHERE id = ?', [id]);
    res.json({
      success: true,
      thumbs_up: updated.thumbs_up,
      thumbs_down: updated.thumbs_down,
    });
  } catch (error) {
    console.error('Error rating activity:', error);
    res.status(500).json({ error: 'Failed to rate activity' });
  }
});

// Get ratings for activities on a specific date
app.get('/api/ratings/:date', (req, res) => {
  try {
    const { date } = req.params;
    const ratings = queryAll(
      'SELECT activity_id, rating FROM activity_ratings WHERE date = ?',
      [date]
    );
    const ratingsMap = {};
    ratings.forEach(r => { ratingsMap[r.activity_id] = r.rating; });
    res.json({ ratings: ratingsMap });
  } catch (error) {
    console.error('Error getting ratings:', error);
    res.status(500).json({ error: 'Failed to get ratings' });
  }
});

// Get schedules for a week (7 days starting from a date)
app.get('/api/schedules/week/:startDate', (req, res) => {
  try {
    const { startDate } = req.params;
    const { type } = req.query;
    
    // Generate array of 7 dates
    const dates = [];
    const start = new Date(startDate);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const schedules = {};
    for (const date of dates) {
      const schedule = queryOne(
        'SELECT activities, created_at FROM schedules WHERE date = ? AND schedule_type = ?',
        [date, type || 'home']
      );
      schedules[date] = schedule ? {
        activities: JSON.parse(schedule.activities),
        created_at: schedule.created_at,
      } : null;
    }

    res.json({ schedules, dates });
  } catch (error) {
    console.error('Error getting week schedules:', error);
    res.status(500).json({ error: 'Failed to get week schedules' });
  }
});

// ===========================================
// WEATHER & GEOCODING
// ===========================================

const WEATHER_DESCRIPTIONS = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  66: 'Light freezing rain', 67: 'Heavy freezing rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
  85: 'Slight snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
};

app.post('/api/geocode', async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: 'Address is required' });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'ToddlerScheduleApp/1.0' } }
    );

    if (!response.ok) throw new Error('Geocoding service unavailable');

    const data = await response.json();
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    const result = data[0];
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    const displayName = result.display_name;

    db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?', ['location_address', address, address]);
    db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?', ['location_lat', lat.toString(), lat.toString()]);
    db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?', ['location_lon', lon.toString(), lon.toString()]);
    db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?', ['location_display', displayName, displayName]);
    db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?', ['weather_cache', '', '']);

    saveDatabase();
    res.json({ success: true, lat, lon, displayName });
  } catch (error) {
    console.error('Error geocoding:', error);
    res.status(500).json({ error: 'Failed to geocode address' });
  }
});

app.get('/api/weather', async (req, res) => {
  try {
    const settings = {};
    const rows = queryAll("SELECT key, value FROM settings WHERE key IN ('location_lat', 'location_lon', 'location_display', 'weather_cache')");
    for (const row of rows) settings[row.key] = row.value;

    if (!settings.location_lat || !settings.location_lon) {
      return res.status(400).json({ error: 'Location not set', message: 'Please set your location in settings first' });
    }

    if (settings.weather_cache) {
      try {
        const cached = JSON.parse(settings.weather_cache);
        const cacheTime = new Date(cached.timestamp);
        const diffMinutes = (new Date() - cacheTime) / (1000 * 60);
        if (diffMinutes < 30) return res.json(cached.data);
      } catch (e) {}
    }

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${settings.location_lat}&longitude=${settings.location_lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto`;
    const response = await fetch(weatherUrl);
    if (!response.ok) throw new Error('Weather service unavailable');

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

    const cacheData = { timestamp: new Date().toISOString(), data: weatherData };
    db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?', ['weather_cache', JSON.stringify(cacheData), JSON.stringify(cacheData)]);
    saveDatabase();

    res.json(weatherData);
  } catch (error) {
    console.error('Error fetching weather:', error);
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

// Home Assistant webhook relay
app.post('/api/home-assistant/webhook', async (req, res) => {
  try {
    const settings = {};
    const rows = queryAll("SELECT key, value FROM settings WHERE key IN ('home_assistant_url', 'webhook_id', 'enable_home_assistant')");
    for (const row of rows) settings[row.key] = row.value;

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

// Cleanup old data
app.post('/api/cleanup', (req, res) => {
  try {
    db.run("DELETE FROM schedules WHERE date < date('now', '-30 days')");
    db.run("DELETE FROM activity_history WHERE started_at < datetime('now', '-30 days')");
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({ error: 'Failed to cleanup' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===========================================
// START SERVER
// ===========================================
initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🍼 Toddler Schedule Server running on port ${PORT}`);
    console.log(`📁 Database: ${dbPath}`);
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  saveDatabase();
  process.exit(0);
});
