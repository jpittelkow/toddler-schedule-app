// ===========================================
// DATABASE HELPER - API Client
// ===========================================
const API_BASE = '/api';

const DB = {
  async init() {
    // Server handles initialization
    return true;
  },

  async getSettings() {
    try {
      const response = await fetch(`${API_BASE}/settings`);
      if (!response.ok) throw new Error('Failed to fetch settings');
      return await response.json();
    } catch (error) {
      console.error('Failed to get settings:', error);
      return this.getDefaultSettings();
    }
  },

  async updateSettings(settings) {
    try {
      const response = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return settings;
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  },

  async getSchedule(dateKey, scheduleType) {
    try {
      const response = await fetch(`${API_BASE}/schedule/${dateKey}/${scheduleType}`);
      if (!response.ok) throw new Error('Failed to fetch schedule');
      return await response.json();
    } catch (error) {
      console.error('Failed to get schedule:', error);
      return null;
    }
  },

  async saveSchedule(dateKey, scheduleType, activities) {
    try {
      const response = await fetch(`${API_BASE}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateKey,
          schedule_type: scheduleType,
          activities,
        }),
      });
      if (!response.ok) throw new Error('Failed to save schedule');
    } catch (error) {
      console.error('Failed to save schedule:', error);
      throw error;
    }
  },

  async deleteSchedule(dateKey, scheduleType) {
    try {
      const response = await fetch(`${API_BASE}/schedule/${dateKey}/${scheduleType}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete schedule');
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      throw error;
    }
  },

  async logActivity(activity) {
    try {
      await fetch(`${API_BASE}/activity-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity),
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  },

  async cleanup() {
    try {
      await fetch(`${API_BASE}/cleanup`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to cleanup:', error);
    }
  },

  async sendToHomeAssistant(eventType, data) {
    try {
      await fetch(`${API_BASE}/home-assistant/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: eventType,
          timestamp: new Date().toISOString(),
          ...data,
        }),
      });
    } catch (error) {
      console.error('Failed to send to Home Assistant:', error);
    }
  },

  // Weather API
  async getWeather() {
    try {
      const response = await fetch(`${API_BASE}/weather`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch weather');
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get weather:', error);
      return null;
    }
  },

  async geocodeAddress(address) {
    try {
      const response = await fetch(`${API_BASE}/geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to geocode address');
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to geocode address:', error);
      throw error;
    }
  },

  // Activities API
  async getActivities(season) {
    try {
      const url = season
        ? `${API_BASE}/activities?season=${season}`
        : `${API_BASE}/activities`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch activities');
      const data = await response.json();
      return data.activities;
    } catch (error) {
      console.error('Failed to get activities:', error);
      return [];
    }
  },

  async createActivity(activity) {
    try {
      const response = await fetch(`${API_BASE}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create activity');
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to create activity:', error);
      throw error;
    }
  },

  async deleteActivity(id) {
    try {
      const response = await fetch(`${API_BASE}/activities/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete activity');
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to delete activity:', error);
      throw error;
    }
  },

  getDefaultSettings() {
    return {
      home_assistant_url: 'http://homeassistant.local:8123',
      webhook_id: 'toddler-schedule',
      enable_home_assistant: false,
      enable_voice_announcements: true,
      enable_light_automations: true,
      current_season: 'winter',
      location: 'Wisconsin',
      kids: [
        { id: 1, name: 'Big Brother', age: 3, color: '#4D96FF' },
        { id: 2, name: 'Little Brother', age: 1, color: '#6BCB77' },
      ],
      school_days: [1, 3, 5],
      school_start: '08:45',
      school_end: '11:45',
      wake_time: '06:30',
      bedtime: '19:30',
      baby_nap_start: '12:30',
      baby_nap_duration: 150,
      toddler_nap_start: '13:30',
      toddler_nap_duration: 90,
      theme: 'purple',
    };
  },
};

// ===========================================
// ICONS AND COLORS
// ===========================================
const ACTIVITY_ICONS = {
  wake: '🌅', breakfast: '🥣', freeplay: '🧸', school: '🏫',
  snack: '🍎', outdoor: '🌳', lunch: '🍽️', nap: '😴',
  quiettime: '📚', activity: '🎨', basement: '🏠', tv: '📺',
  dinner: '🍝', bath: '🛁', bedtime: '🌙', drive: '🚗',
  errand: '🛒', mombreak: '☕', sensory: '🎭', music: '🎵',
  building: '🧱', reading: '📖', cooking: '👨‍🍳', dance: '💃',
  craft: '✂️', puzzle: '🧩', snow: '❄️', fort: '🏰',
};

const ACTIVITY_COLORS = {
  wake: '#FFD93D', breakfast: '#FF8C42', freeplay: '#6BCB77', school: '#4D96FF',
  snack: '#FF6B9D', outdoor: '#2ECC71', lunch: '#FF7B54', nap: '#9B59B6',
  quiettime: '#A8DADC', activity: '#FF6B6B', basement: '#45B7D1', tv: '#DDA0DD',
  dinner: '#F39C12', bath: '#74B9FF', bedtime: '#6C5CE7', drive: '#FDCB6E',
  errand: '#00CEC9', mombreak: '#E17055', sensory: '#E056FD', music: '#686DE0',
  building: '#F8B500', reading: '#22A6B3', cooking: '#EB4D4B', dance: '#FF6B81',
  craft: '#7BED9F', puzzle: '#70A1FF', snow: '#74B9FF', fort: '#FFA502',
};

const THEMES = {
  purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
  blue: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  green: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  sunset: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  ocean: 'linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)',
  forest: 'linear-gradient(135deg, #134E5E 0%, #71B280 100%)',
};

// Weather code to emoji mapping (WMO codes)
const WEATHER_ICONS = {
  0: '☀️',      // Clear sky
  1: '🌤️',      // Mainly clear
  2: '⛅',      // Partly cloudy
  3: '☁️',      // Overcast
  45: '🌫️',     // Foggy
  48: '🌫️',     // Depositing rime fog
  51: '🌧️',     // Light drizzle
  53: '🌧️',     // Moderate drizzle
  55: '🌧️',     // Dense drizzle
  56: '🌧️',     // Light freezing drizzle
  57: '🌧️',     // Dense freezing drizzle
  61: '🌧️',     // Slight rain
  63: '🌧️',     // Moderate rain
  65: '🌧️',     // Heavy rain
  66: '🌧️',     // Light freezing rain
  67: '🌧️',     // Heavy freezing rain
  71: '🌨️',     // Slight snow
  73: '🌨️',     // Moderate snow
  75: '❄️',     // Heavy snow
  77: '🌨️',     // Snow grains
  80: '🌦️',     // Slight rain showers
  81: '🌦️',     // Moderate rain showers
  82: '🌧️',     // Violent rain showers
  85: '🌨️',     // Slight snow showers
  86: '🌨️',     // Heavy snow showers
  95: '⛈️',     // Thunderstorm
  96: '⛈️',     // Thunderstorm with slight hail
  99: '⛈️',     // Thunderstorm with heavy hail
};

// ===========================================
// UTILITY FUNCTIONS
// ===========================================
const parseTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const formatTimeRemaining = (minutes) => {
  if (minutes < 0) return "Done!";
  const hrs = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins} min`;
};

const formatTime12h = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const getCurrentMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
};

const getTodayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const minutesToTime = (minutes) => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

// ===========================================
// SCHEDULE BUILDER
// ===========================================
const buildScheduleTemplate = (settings, isSchoolDay) => {
  const wake = parseTime(settings.wake_time);
  const bedtime = parseTime(settings.bedtime);
  
  const template = [];
  
  // Wake up
  template.push({
    id: 'wake',
    name: 'Wake Up',
    start: settings.wake_time,
    end: minutesToTime(wake + 30),
    type: 'wake',
    fixed: true,
  });
  
  // Breakfast
  template.push({
    id: 'breakfast',
    name: 'Breakfast',
    start: minutesToTime(wake + 30),
    end: minutesToTime(wake + 60),
    type: 'breakfast',
    fixed: true,
  });
  
  if (isSchoolDay) {
    // School day schedule
    const schoolStart = parseTime(settings.school_start);
    const schoolEnd = parseTime(settings.school_end);
    
    // Morning play before school
    template.push({
      id: 'morning-play',
      name: 'Play Time',
      start: minutesToTime(wake + 60),
      end: minutesToTime(schoolStart - 15),
      type: 'freeplay',
      customizable: true,
      slot: 'morning-play',
    });
    
    // School drop-off
    template.push({
      id: 'school-dropoff',
      name: 'School Drop-off',
      start: minutesToTime(schoolStart - 15),
      end: settings.school_start,
      type: 'drive',
      fixed: true,
    });
    
    // Baby morning time
    template.push({
      id: 'baby-morning',
      name: 'Baby Play',
      start: settings.school_start,
      end: minutesToTime(schoolStart + 75),
      type: 'freeplay',
      customizable: true,
      slot: 'baby-morning',
    });
    
    // Snack
    template.push({
      id: 'snack1',
      name: 'Snack',
      start: minutesToTime(schoolStart + 75),
      end: minutesToTime(schoolStart + 105),
      type: 'snack',
      fixed: true,
    });
    
    // Late morning activity
    template.push({
      id: 'late-morning',
      name: 'Outing',
      start: minutesToTime(schoolStart + 105),
      end: minutesToTime(schoolEnd - 15),
      type: 'errand',
      customizable: true,
      slot: 'late-morning',
    });
    
    // School pickup
    template.push({
      id: 'school-pickup',
      name: 'School Pick-up',
      start: minutesToTime(schoolEnd - 15),
      end: minutesToTime(schoolEnd + 15),
      type: 'drive',
      fixed: true,
    });
  } else {
    // Home day schedule
    // Morning play
    template.push({
      id: 'morning-play',
      name: 'Play Time',
      start: minutesToTime(wake + 60),
      end: minutesToTime(wake + 90),
      type: 'freeplay',
      customizable: true,
      slot: 'early-morning',
    });
    
    // Morning activity
    template.push({
      id: 'morning-activity',
      name: 'Morning Activity',
      start: minutesToTime(wake + 90),
      end: minutesToTime(wake + 150),
      type: 'activity',
      customizable: true,
      slot: 'morning-activity',
    });
    
    // Snack
    template.push({
      id: 'snack1',
      name: 'Snack',
      start: minutesToTime(wake + 150),
      end: minutesToTime(wake + 180),
      type: 'snack',
      fixed: true,
    });
    
    // Outing
    template.push({
      id: 'outing',
      name: 'Outing',
      start: minutesToTime(wake + 180),
      end: minutesToTime(wake + 270),
      type: 'errand',
      customizable: true,
      slot: 'outing',
    });
    
    // Pre-lunch play
    template.push({
      id: 'pre-lunch',
      name: 'Indoor Play',
      start: minutesToTime(wake + 270),
      end: minutesToTime(wake + 330),
      type: 'freeplay',
      customizable: true,
      slot: 'pre-lunch',
    });
  }
  
  // Lunch (same for both)
  const lunchTime = isSchoolDay ? parseTime(settings.school_end) + 15 : wake + 330;
  template.push({
    id: 'lunch',
    name: 'Lunch',
    start: minutesToTime(lunchTime),
    end: minutesToTime(lunchTime + 30),
    type: 'lunch',
    fixed: true,
  });
  
  // Baby nap
  const babyNapStart = parseTime(settings.baby_nap_start);
  template.push({
    id: 'baby-nap',
    name: 'Baby Nap',
    start: settings.baby_nap_start,
    end: minutesToTime(babyNapStart + 60),
    type: 'nap',
    fixed: true,
    for: 'baby',
  });
  
  // Quiet time for 3yo
  template.push({
    id: 'quiet-time',
    name: 'Quiet Time',
    start: settings.baby_nap_start,
    end: minutesToTime(babyNapStart + 60),
    type: 'quiettime',
    customizable: true,
    slot: 'quiet-time',
    for: '3yo',
  });
  
  // Both kids nap
  const toddlerNapStart = parseTime(settings.toddler_nap_start);
  template.push({
    id: 'both-nap',
    name: 'Nap Time',
    start: settings.toddler_nap_start,
    end: minutesToTime(toddlerNapStart + settings.toddler_nap_duration),
    type: 'nap',
    fixed: true,
  });
  
  // Afternoon snack
  const afternoonSnack = toddlerNapStart + settings.toddler_nap_duration;
  template.push({
    id: 'snack2',
    name: 'Snack',
    start: minutesToTime(afternoonSnack),
    end: minutesToTime(afternoonSnack + 30),
    type: 'snack',
    fixed: true,
  });
  
  // Afternoon activity
  template.push({
    id: 'afternoon-activity',
    name: 'Activity',
    start: minutesToTime(afternoonSnack + 30),
    end: minutesToTime(afternoonSnack + 90),
    type: 'activity',
    customizable: true,
    slot: 'afternoon-activity',
  });
  
  // Wind down
  const dinnerTime = bedtime - 120;
  template.push({
    id: 'wind-down',
    name: 'Wind Down',
    start: minutesToTime(afternoonSnack + 90),
    end: minutesToTime(dinnerTime),
    type: 'freeplay',
    customizable: true,
    slot: 'wind-down',
  });
  
  // Dinner
  template.push({
    id: 'dinner',
    name: 'Dinner',
    start: minutesToTime(dinnerTime),
    end: minutesToTime(dinnerTime + 45),
    type: 'dinner',
    fixed: true,
  });
  
  // Bath
  template.push({
    id: 'bath',
    name: 'Bath Time',
    start: minutesToTime(dinnerTime + 45),
    end: minutesToTime(dinnerTime + 75),
    type: 'bath',
    fixed: true,
  });
  
  // Bedtime routine
  template.push({
    id: 'bedtime',
    name: 'Bedtime',
    start: minutesToTime(dinnerTime + 75),
    end: settings.bedtime,
    type: 'bedtime',
    fixed: true,
  });
  
  return template;
};

// ===========================================
// ACTIVITY GENERATION
// ===========================================

// Generate activities for schedule slots from database activities
const generateActivitiesFromDB = async (season) => {
  const dbActivities = await DB.getActivities(season);
  if (!dbActivities || dbActivities.length === 0) {
    // Fallback to hardcoded defaults if DB is empty
    return getDefaultActivitiesFallback(season);
  }

  const slots = [
    'morning-play', 'early-morning', 'baby-morning', 'morning-activity',
    'late-morning', 'outing', 'pre-lunch', 'quiet-time', 'afternoon-activity', 'wind-down'
  ];

  const activities = {};
  const shuffled = [...dbActivities].sort(() => Math.random() - 0.5);

  slots.forEach((slot, index) => {
    const activity = shuffled[index % shuffled.length];
    activities[slot] = {
      name: activity.name,
      type: activity.type,
      description: activity.description,
    };
  });

  return activities;
};

// Fallback for when DB is empty (shouldn't happen normally)
const getDefaultActivitiesFallback = (season) => {
  const winterActivities = {
    'morning-play': { name: 'Block Tower Building', type: 'building', description: 'Build tall towers together' },
    'early-morning': { name: 'Dance Party', type: 'dance', description: 'Morning wiggles out' },
    'baby-morning': { name: 'Sensory Bins', type: 'sensory', description: 'Rice and scoop play' },
    'morning-activity': { name: 'Playdough Fun', type: 'craft', description: 'Squish and create' },
    'late-morning': { name: 'Library Trip', type: 'errand', description: 'Story time and books' },
    'outing': { name: 'Target Adventure', type: 'errand', description: 'Walk around, get out of house' },
    'pre-lunch': { name: 'Basement Play', type: 'basement', description: 'Burn energy downstairs' },
    'quiet-time': { name: 'Puzzle Time', type: 'puzzle', description: 'Calm puzzle solving' },
    'afternoon-activity': { name: 'Blanket Fort', type: 'fort', description: 'Build a cozy hideout' },
    'wind-down': { name: 'Story Time', type: 'reading', description: 'Calm reading together' },
  };

  const summerActivities = {
    'morning-play': { name: 'Backyard Bubbles', type: 'outdoor', description: 'Chase bubbles outside' },
    'early-morning': { name: 'Sidewalk Chalk', type: 'outdoor', description: 'Draw on the driveway' },
    'baby-morning': { name: 'Water Table', type: 'sensory', description: 'Splash and pour' },
    'morning-activity': { name: 'Nature Walk', type: 'outdoor', description: 'Explore the neighborhood' },
    'late-morning': { name: 'Playground', type: 'outdoor', description: 'Slides and swings' },
    'outing': { name: 'Splash Pad', type: 'outdoor', description: 'Cool off with water play' },
    'pre-lunch': { name: 'Bug Hunt', type: 'outdoor', description: 'Find crawly friends' },
    'quiet-time': { name: 'Coloring Books', type: 'craft', description: 'Quiet coloring time' },
    'afternoon-activity': { name: 'Kiddie Pool', type: 'outdoor', description: 'Backyard water fun' },
    'wind-down': { name: 'Popsicles & Books', type: 'reading', description: 'Cool treat and stories' },
  };

  return season === 'summer' ? summerActivities : winterActivities;
};

// Get a random activity from DB for refreshing a single slot
const getRandomActivityFromDB = async (season, excludeNames = []) => {
  const dbActivities = await DB.getActivities(season);
  if (!dbActivities || dbActivities.length === 0) return null;

  const available = dbActivities.filter(a => !excludeNames.includes(a.name));
  if (available.length === 0) return dbActivities[Math.floor(Math.random() * dbActivities.length)];

  return available[Math.floor(Math.random() * available.length)];
};

// ===========================================
// HOME ASSISTANT INTEGRATION
// ===========================================
const sendToHomeAssistant = async (settings, eventType, data) => {
  if (!settings.enable_home_assistant) {
    console.log('Home Assistant event (disabled):', eventType, data);
    return;
  }
  
  // Use backend relay
  await DB.sendToHomeAssistant(eventType, {
    ...data,
    enable_voice: settings.enable_voice_announcements,
    enable_lights: settings.enable_light_automations,
  });
};

// ===========================================
// COMPONENTS
// ===========================================

// Individual countdown digit with animation
const CountdownDigit = ({ value, label, pulse, isWarning, isAlmostDone }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{
        background: isAlmostDone ? 'rgba(255,100,100,0.3)' : isWarning ? 'rgba(255,217,61,0.3)' : 'rgba(255,255,255,0.2)',
        borderRadius: '16px',
        padding: '12px 16px',
        minWidth: '70px',
        transform: pulse ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.2s ease, background 0.3s ease',
      }}>
        <div style={{
          fontSize: '48px',
          fontWeight: 800,
          color: 'white',
          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          lineHeight: 1,
          fontFamily: "'Nunito', sans-serif",
        }}>
          {String(value).padStart(2, '0')}
        </div>
      </div>
      <div style={{
        fontSize: '12px',
        fontWeight: 600,
        color: 'rgba(255,255,255,0.8)',
        marginTop: '4px',
        textTransform: 'uppercase',
        letterSpacing: '1px',
      }}>
        {label}
      </div>
    </div>
  );
};

// Current Activity Card with integrated countdown
const CurrentActivityCard = ({ activity, timeRemaining, onRefresh, isRefreshing }) => {
  const bgColor = ACTIVITY_COLORS[activity.type] || '#888';
  const icon = ACTIVITY_ICONS[activity.type] || '⭐';
  const canRefresh = activity.customizable && onRefresh;
  
  const totalSeconds = Math.max(0, Math.floor(timeRemaining * 60));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const [pulse, setPulse] = React.useState(false);
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 200);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const isWarning = timeRemaining <= 5 && timeRemaining > 1;
  const isAlmostDone = timeRemaining <= 1;
  
  const handleRefreshClick = (e) => {
    e.stopPropagation();
    if (window.confirm(`🔄 Generate a new activity for "${activity.name}"?\n\nThis will create a different activity suggestion for this time slot.`)) {
      onRefresh(activity);
    }
  };
  
  return (
    <div style={{
      background: `linear-gradient(135deg, ${bgColor}ee, ${bgColor})`,
      borderRadius: '32px',
      padding: '24px',
      textAlign: 'center',
      boxShadow: `0 8px 32px ${bgColor}60`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background bubbles */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: `${20 + i * 12}px`,
              height: `${20 + i * 12}px`,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              left: `${5 + i * 12}%`,
              bottom: '-20px',
              animation: `float ${3 + i * 0.4}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      
      {/* Refresh button */}
      {canRefresh && (
        <button
          onClick={handleRefreshClick}
          disabled={isRefreshing}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255,255,255,0.25)',
            border: 'none',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            cursor: isRefreshing ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            transition: 'all 0.2s ease',
            opacity: isRefreshing ? 0.5 : 1,
            animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
            zIndex: 10,
          }}
          title="Get different activity"
        >
          🔄
        </button>
      )}
      
      {/* Header label */}
      <div style={{
        fontSize: '16px',
        fontWeight: 700,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: '12px',
        textTransform: 'uppercase',
        letterSpacing: '2px',
      }}>
        ⭐ Right Now ⭐
      </div>
      
      {/* Activity icon - big and bouncy */}
      <div style={{
        fontSize: '80px',
        lineHeight: 1,
        marginBottom: '12px',
        animation: pulse ? 'bounce 0.3s ease' : 'none',
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
      }}>
        {icon}
      </div>
      
      {/* Activity name */}
      <div style={{
        fontSize: '32px',
        fontWeight: 800,
        color: 'white',
        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
        marginBottom: '8px',
      }}>
        {activity.name}
      </div>
      
      {/* Description */}
      {activity.description && (
        <div style={{
          fontSize: '18px',
          color: 'rgba(255,255,255,0.9)',
          fontWeight: 600,
          marginBottom: '8px',
        }}>
          {activity.description}
        </div>
      )}
      
      {/* Time range */}
      <div style={{
        fontSize: '16px',
        color: 'rgba(255,255,255,0.8)',
        fontWeight: 600,
        marginBottom: '20px',
      }}>
        {formatTime12h(activity.start)} - {formatTime12h(activity.end)}
      </div>
      
      {/* Big countdown numbers */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
      }}>
        {hours > 0 && (
          <>
            <CountdownDigit value={hours} label="hr" pulse={pulse} isWarning={isWarning} isAlmostDone={isAlmostDone} />
            <div style={{ fontSize: '48px', fontWeight: 800, color: 'white', opacity: 0.8, alignSelf: 'flex-start', marginTop: '12px' }}>:</div>
          </>
        )}
        <CountdownDigit value={minutes} label="min" pulse={pulse} isWarning={isWarning} isAlmostDone={isAlmostDone} />
        <div style={{ fontSize: '48px', fontWeight: 800, color: 'white', opacity: 0.8, alignSelf: 'flex-start', marginTop: '12px' }}>:</div>
        <CountdownDigit value={seconds} label="sec" pulse={pulse} isWarning={isWarning} isAlmostDone={isAlmostDone} />
      </div>
      
      {/* Progress bar */}
      <div style={{
        height: '14px',
        background: 'rgba(255,255,255,0.3)',
        borderRadius: '7px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: isAlmostDone ? '#FF6B6B' : isWarning ? '#FFD93D' : 'white',
          borderRadius: '7px',
          width: `${Math.max(0, 100 - ((timeRemaining / 60) * 100))}%`,
          minWidth: '2%',
          transition: 'width 1s linear, background 0.3s ease',
        }} />
      </div>
      
      {/* Status messages */}
      {isAlmostDone && (
        <div style={{
          marginTop: '16px',
          fontSize: '20px',
          fontWeight: 700,
          color: '#FFD93D',
          animation: 'pulse 0.5s infinite',
        }}>
          ⏰ Almost time to switch!
        </div>
      )}
      {isWarning && !isAlmostDone && (
        <div style={{
          marginTop: '16px',
          fontSize: '18px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.95)',
        }}>
          🕐 {Math.ceil(timeRemaining)} minutes left!
        </div>
      )}
    </div>
  );
};

const ActivityCard = ({ activity, isCurrent, isPast, timeRemaining, progress, onRefresh, isRefreshing }) => {
  const bgColor = ACTIVITY_COLORS[activity.type] || '#888';
  const icon = ACTIVITY_ICONS[activity.type] || '⭐';
  const canRefresh = activity.customizable && !isPast && onRefresh;
  
  const handleRefreshClick = (e) => {
    e.stopPropagation();
    if (window.confirm(`🔄 Generate a new activity for "${activity.name}"?\n\nThis will create a different activity suggestion for this time slot.`)) {
      onRefresh(activity);
    }
  };
  
  return (
    <div style={{
      background: isPast ? `${bgColor}66` : bgColor,
      borderRadius: '20px',
      padding: isCurrent ? '20px' : '14px 16px',
      display: 'flex',
      flexDirection: isCurrent ? 'column' : 'row',
      alignItems: 'center',
      gap: isCurrent ? '16px' : '12px',
      boxShadow: isCurrent ? `0 8px 24px ${bgColor}60` : '0 2px 8px rgba(0,0,0,0.15)',
      opacity: isPast ? 0.6 : 1,
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative',
    }}>
      {/* Refresh button for customizable activities */}
      {canRefresh && (
        <button
          onClick={handleRefreshClick}
          disabled={isRefreshing}
          style={{
            position: 'absolute',
            top: isCurrent ? '12px' : '8px',
            right: isCurrent ? '12px' : '8px',
            background: 'rgba(255,255,255,0.25)',
            border: 'none',
            borderRadius: '50%',
            width: isCurrent ? '40px' : '32px',
            height: isCurrent ? '40px' : '32px',
            cursor: isRefreshing ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isCurrent ? '20px' : '16px',
            transition: 'all 0.2s ease',
            opacity: isRefreshing ? 0.5 : 1,
            animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
          }}
          title="Get different activity"
        >
          🔄
        </button>
      )}
      
      {isCurrent ? (
        <>
          <div style={{ fontSize: '72px', lineHeight: 1 }}>{icon}</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            {activity.name}
          </div>
          {activity.description && (
            <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', fontWeight: 600, textAlign: 'center' }}>
              {activity.description}
            </div>
          )}
          <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
            {formatTime12h(activity.start)} - {formatTime12h(activity.end)}
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: '36px', lineHeight: 1, flexShrink: 0, filter: isPast ? 'grayscale(40%)' : 'none' }}>{icon}</div>
          <div style={{ flex: 1, minWidth: 0, paddingRight: canRefresh ? '36px' : '0' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
              {activity.name}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
              {formatTime12h(activity.start)} - {formatTime12h(activity.end)}
            </div>
            {activity.description && (
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginTop: '2px' }}>
                {activity.description}
              </div>
            )}
          </div>
          {isPast && <div style={{ fontSize: '24px', color: 'white', flexShrink: 0 }}>✓</div>}
        </>
      )}
    </div>
  );
};

const LoadingSpinner = () => (
  <div style={{ textAlign: 'center', padding: '40px' }}>
    <div style={{ fontSize: '64px', animation: 'spin 1s linear infinite' }}>🎨</div>
    <div style={{ color: 'white', fontSize: '24px', fontWeight: 700, marginTop: '16px' }}>Planning today's fun...</div>
  </div>
);

// Weather Display Component
const WeatherDisplay = ({ weather, loading }) => {
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px 20px',
        background: 'rgba(255,255,255,0.15)',
        borderRadius: '20px',
        marginTop: '12px',
      }}>
        <div style={{ fontSize: '20px', animation: 'spin 1s linear infinite' }}>🌀</div>
        <span style={{ color: 'white', fontSize: '14px', fontWeight: 600 }}>Loading weather...</span>
      </div>
    );
  }

  if (!weather) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px 20px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '20px',
        marginTop: '12px',
      }}>
        <span style={{ fontSize: '20px' }}>🌡️</span>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600 }}>
          Set location in settings for weather
        </span>
      </div>
    );
  }

  const icon = WEATHER_ICONS[weather.weatherCode] || '🌡️';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      padding: '12px 24px',
      background: 'rgba(255,255,255,0.15)',
      borderRadius: '20px',
      marginTop: '12px',
      flexWrap: 'wrap',
    }}>
      {/* Weather icon and temp */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '36px' }}>{icon}</span>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'white', lineHeight: 1 }}>
            {weather.temperature}°F
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
            {weather.weatherDescription}
          </div>
        </div>
      </div>

      {/* High/Low */}
      <div style={{
        display: 'flex',
        gap: '12px',
        fontSize: '14px',
        fontWeight: 600,
        color: 'rgba(255,255,255,0.9)',
      }}>
        <span>↑ {weather.high}°</span>
        <span>↓ {weather.low}°</span>
      </div>
    </div>
  );
};

// ===========================================
// SETTINGS PANEL
// ===========================================
const SettingsPanel = ({ settings, onSave, onClose, onActivitiesChange }) => {
  const [localSettings, setLocalSettings] = React.useState(settings);
  const [activeSection, setActiveSection] = React.useState('general');
  const [activities, setActivities] = React.useState([]);
  const [activitiesLoading, setActivitiesLoading] = React.useState(false);
  const [geocoding, setGeocoding] = React.useState(false);
  const [locationAddress, setLocationAddress] = React.useState(settings.location_address || '');
  const [locationDisplay, setLocationDisplay] = React.useState(settings.location_display || '');
  const [newActivity, setNewActivity] = React.useState({ name: '', type: 'activity', description: '', seasons: ['winter', 'spring', 'summer', 'fall'] });

  // Load activities when Activities tab is opened
  React.useEffect(() => {
    if (activeSection === 'activities') {
      loadActivities();
    }
  }, [activeSection]);

  const loadActivities = async () => {
    setActivitiesLoading(true);
    const acts = await DB.getActivities();
    setActivities(acts);
    setActivitiesLoading(false);
  };

  const handleAddActivity = async () => {
    if (!newActivity.name.trim()) {
      alert('Please enter an activity name');
      return;
    }
    if (newActivity.seasons.length === 0) {
      alert('Please select at least one season');
      return;
    }
    try {
      await DB.createActivity(newActivity);
      setNewActivity({ name: '', type: 'activity', description: '', seasons: ['winter', 'spring', 'summer', 'fall'] });
      await loadActivities();
      if (onActivitiesChange) onActivitiesChange();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteActivity = async (id) => {
    if (!confirm('Delete this activity?')) return;
    try {
      await DB.deleteActivity(id);
      await loadActivities();
      if (onActivitiesChange) onActivitiesChange();
    } catch (error) {
      alert(error.message);
    }
  };

  const toggleNewActivitySeason = (season) => {
    setNewActivity(prev => ({
      ...prev,
      seasons: prev.seasons.includes(season)
        ? prev.seasons.filter(s => s !== season)
        : [...prev.seasons, season]
    }));
  };

  const handleGeocode = async () => {
    if (!locationAddress.trim()) {
      alert('Please enter an address');
      return;
    }
    setGeocoding(true);
    try {
      const result = await DB.geocodeAddress(locationAddress);
      setLocationDisplay(result.displayName);
      updateSetting('location_address', locationAddress);
      updateSetting('location_display', result.displayName);
      alert('Location updated! Weather will refresh shortly.');
    } catch (error) {
      alert(error.message || 'Failed to find address. Try a more specific address.');
    }
    setGeocoding(false);
  };

  const updateSetting = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateKid = (index, field, value) => {
    const newKids = [...localSettings.kids];
    newKids[index] = { ...newKids[index], [field]: value };
    setLocalSettings(prev => ({ ...prev, kids: newKids }));
  };

  const addKid = () => {
    const newKids = [...localSettings.kids, { id: Date.now(), name: 'New Child', age: 2, color: '#FF6B6B' }];
    setLocalSettings(prev => ({ ...prev, kids: newKids }));
  };

  const removeKid = (index) => {
    const newKids = localSettings.kids.filter((_, i) => i !== index);
    setLocalSettings(prev => ({ ...prev, kids: newKids }));
  };

  const toggleSchoolDay = (day) => {
    const newDays = localSettings.school_days.includes(day)
      ? localSettings.school_days.filter(d => d !== day)
      : [...localSettings.school_days, day].sort();
    setLocalSettings(prev => ({ ...prev, school_days: newDays }));
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };
  
  const inputStyle = {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    outline: 'none',
    boxSizing: 'border-box',
  };
  
  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '6px',
    color: 'rgba(255,255,255,0.9)',
  };
  
  const sectionButtonStyle = (active) => ({
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    background: active ? 'white' : 'rgba(255,255,255,0.2)',
    color: active ? '#764ba2' : 'white',
    flex: 1,
  });
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, color: 'white', fontSize: '24px' }}>⚙️ Settings</h2>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'white',
            }}>✕</button>
          </div>
          
          {/* Section tabs */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button onClick={() => setActiveSection('general')} style={sectionButtonStyle(activeSection === 'general')}>General</button>
            <button onClick={() => setActiveSection('schedule')} style={sectionButtonStyle(activeSection === 'schedule')}>Schedule</button>
            <button onClick={() => setActiveSection('activities')} style={sectionButtonStyle(activeSection === 'activities')}>Activities</button>
            <button onClick={() => setActiveSection('homeassistant')} style={sectionButtonStyle(activeSection === 'homeassistant')}>Home Assistant</button>
          </div>
        </div>
        
        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {activeSection === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Kids */}
              <div>
                <label style={labelStyle}>Kids</label>
                {localSettings.kids.map((kid, index) => (
                  <div key={kid.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={kid.name}
                      onChange={(e) => updateKid(index, 'name', e.target.value)}
                      style={{ ...inputStyle, flex: 2 }}
                      placeholder="Name"
                    />
                    <input
                      type="number"
                      value={kid.age}
                      onChange={(e) => updateKid(index, 'age', parseInt(e.target.value) || 0)}
                      style={{ ...inputStyle, flex: 1 }}
                      min="0"
                      max="18"
                    />
                    <input
                      type="color"
                      value={kid.color}
                      onChange={(e) => updateKid(index, 'color', e.target.value)}
                      style={{ width: '44px', height: '44px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    />
                    {localSettings.kids.length > 1 && (
                      <button onClick={() => removeKid(index)} style={{
                        background: 'rgba(255,0,0,0.3)',
                        border: 'none',
                        borderRadius: '8px',
                        width: '44px',
                        height: '44px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '18px',
                      }}>🗑</button>
                    )}
                  </div>
                ))}
                <button onClick={addKid} style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(255,255,255,0.2)',
                  border: '2px dashed rgba(255,255,255,0.4)',
                  borderRadius: '12px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}>+ Add Child</button>
              </div>
              
              {/* Location for Weather */}
              <div>
                <label style={labelStyle}>Location (for weather)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="123 Main St, City, State"
                  />
                  <button
                    onClick={handleGeocode}
                    disabled={geocoding}
                    style={{
                      padding: '12px 16px',
                      background: geocoding ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.25)',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      cursor: geocoding ? 'wait' : 'pointer',
                      fontWeight: 600,
                      fontSize: '14px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {geocoding ? '...' : 'Update'}
                  </button>
                </div>
                {locationDisplay && (
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '6px' }}>
                    Current: {locationDisplay.split(',').slice(0, 3).join(',')}
                  </div>
                )}
              </div>
              
              {/* Season */}
              <div>
                <label style={labelStyle}>Current Season</label>
                <select
                  value={localSettings.current_season}
                  onChange={(e) => updateSetting('current_season', e.target.value)}
                  style={inputStyle}
                >
                  <option value="winter">❄️ Winter</option>
                  <option value="spring">🌸 Spring</option>
                  <option value="summer">☀️ Summer</option>
                  <option value="fall">🍂 Fall</option>
                </select>
              </div>
              
              {/* Theme */}
              <div>
                <label style={labelStyle}>App Theme</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {Object.entries(THEMES).map(([name, gradient]) => (
                    <button
                      key={name}
                      onClick={() => updateSetting('theme', name)}
                      style={{
                        padding: '20px 12px',
                        border: localSettings.theme === name ? '3px solid white' : '3px solid transparent',
                        borderRadius: '12px',
                        background: gradient,
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {activeSection === 'schedule' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* School Days */}
              <div>
                <label style={labelStyle}>School Days</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <button
                      key={index}
                      onClick={() => toggleSchoolDay(index)}
                      style={{
                        flex: 1,
                        padding: '12px 0',
                        border: 'none',
                        borderRadius: '10px',
                        background: localSettings.school_days.includes(index) ? 'white' : 'rgba(255,255,255,0.2)',
                        color: localSettings.school_days.includes(index) ? '#764ba2' : 'white',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '14px',
                      }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Times */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Wake Time</label>
                  <input type="time" value={localSettings.wake_time} onChange={(e) => updateSetting('wake_time', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Bedtime</label>
                  <input type="time" value={localSettings.bedtime} onChange={(e) => updateSetting('bedtime', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>School Start</label>
                  <input type="time" value={localSettings.school_start} onChange={(e) => updateSetting('school_start', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>School End</label>
                  <input type="time" value={localSettings.school_end} onChange={(e) => updateSetting('school_end', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Baby Nap Start</label>
                  <input type="time" value={localSettings.baby_nap_start} onChange={(e) => updateSetting('baby_nap_start', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Baby Nap (min)</label>
                  <input type="number" value={localSettings.baby_nap_duration} onChange={(e) => updateSetting('baby_nap_duration', parseInt(e.target.value) || 0)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Toddler Nap Start</label>
                  <input type="time" value={localSettings.toddler_nap_start} onChange={(e) => updateSetting('toddler_nap_start', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Toddler Nap (min)</label>
                  <input type="number" value={localSettings.toddler_nap_duration} onChange={(e) => updateSetting('toddler_nap_duration', parseInt(e.target.value) || 0)} style={inputStyle} />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'activities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Add New Activity Form */}
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px' }}>
                <label style={{ ...labelStyle, marginBottom: '12px' }}>Add New Activity</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="text"
                    value={newActivity.name}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, name: e.target.value }))}
                    style={inputStyle}
                    placeholder="Activity name"
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      value={newActivity.type}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, type: e.target.value }))}
                      style={{ ...inputStyle, flex: 1 }}
                    >
                      {Object.entries(ACTIVITY_ICONS).map(([type, icon]) => (
                        <option key={type} value={type}>{icon} {type}</option>
                      ))}
                    </select>
                    <div style={{ fontSize: '32px', display: 'flex', alignItems: 'center' }}>
                      {ACTIVITY_ICONS[newActivity.type] || '🎨'}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={newActivity.description}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                    style={inputStyle}
                    placeholder="Description (optional)"
                  />
                  <div>
                    <label style={{ ...labelStyle, fontSize: '12px' }}>Seasons</label>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      {[['winter', '❄️'], ['spring', '🌸'], ['summer', '☀️'], ['fall', '🍂']].map(([season, emoji]) => (
                        <button
                          key={season}
                          onClick={() => toggleNewActivitySeason(season)}
                          style={{
                            flex: 1,
                            padding: '8px 4px',
                            border: 'none',
                            borderRadius: '8px',
                            background: newActivity.seasons.includes(season) ? 'white' : 'rgba(255,255,255,0.2)',
                            color: newActivity.seasons.includes(season) ? '#764ba2' : 'white',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '12px',
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleAddActivity}
                    style={{
                      padding: '12px',
                      background: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#764ba2',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '14px',
                    }}
                  >
                    + Add Activity
                  </button>
                </div>
              </div>

              {/* Activities List */}
              <div>
                <label style={labelStyle}>
                  Activities ({activities.filter(a => a.seasons.includes(localSettings.current_season)).length} for {localSettings.current_season})
                </label>
                {activitiesLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.7)' }}>
                    Loading activities...
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                    {activities
                      .filter(a => a.seasons.includes(localSettings.current_season))
                      .map(activity => (
                      <div
                        key={activity.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          background: `${ACTIVITY_COLORS[activity.type] || '#888'}99`,
                          borderRadius: '12px',
                        }}
                      >
                        <span style={{ fontSize: '24px' }}>{ACTIVITY_ICONS[activity.type] || '🎨'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>{activity.name}</div>
                          {activity.description && (
                            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>{activity.description}</div>
                          )}
                          <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                            {activity.seasons.map(s => (
                              <span key={s} style={{ fontSize: '10px' }}>
                                {s === 'winter' ? '❄️' : s === 'spring' ? '🌸' : s === 'summer' ? '☀️' : '🍂'}
                              </span>
                            ))}
                          </div>
                        </div>
                        {activity.is_default ? (
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', padding: '4px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>Default</span>
                        ) : (
                          <button
                            onClick={() => handleDeleteActivity(activity.id)}
                            style={{
                              background: 'rgba(255,0,0,0.3)',
                              border: 'none',
                              borderRadius: '8px',
                              width: '32px',
                              height: '32px',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '14px',
                            }}
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'homeassistant' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Enable HA */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
              }}>
                <span style={{ color: 'white', fontWeight: 600 }}>Enable Home Assistant</span>
                <button
                  onClick={() => updateSetting('enable_home_assistant', !localSettings.enable_home_assistant)}
                  style={{
                    width: '60px',
                    height: '32px',
                    borderRadius: '16px',
                    border: 'none',
                    background: localSettings.enable_home_assistant ? '#4CAF50' : 'rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'white',
                    position: 'absolute',
                    top: '3px',
                    left: localSettings.enable_home_assistant ? '31px' : '3px',
                    transition: 'left 0.2s',
                  }} />
                </button>
              </div>

              {/* HA URL */}
              <div>
                <label style={labelStyle}>Home Assistant URL</label>
                <input
                  type="text"
                  value={localSettings.home_assistant_url}
                  onChange={(e) => updateSetting('home_assistant_url', e.target.value)}
                  style={inputStyle}
                  placeholder="http://homeassistant.local:8123"
                />
              </div>

              {/* Webhook ID */}
              <div>
                <label style={labelStyle}>Webhook ID</label>
                <input
                  type="text"
                  value={localSettings.webhook_id}
                  onChange={(e) => updateSetting('webhook_id', e.target.value)}
                  style={inputStyle}
                  placeholder="toddler-schedule"
                />
              </div>

              {/* Automation Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                }}>
                  <span style={{ color: 'white', fontWeight: 600 }}>🔊 Voice Announcements</span>
                  <button
                    onClick={() => updateSetting('enable_voice_announcements', !localSettings.enable_voice_announcements)}
                    style={{
                      width: '50px',
                      height: '28px',
                      borderRadius: '14px',
                      border: 'none',
                      background: localSettings.enable_voice_announcements ? '#4CAF50' : 'rgba(255,255,255,0.3)',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: 'white',
                      position: 'absolute',
                      top: '3px',
                      left: localSettings.enable_voice_announcements ? '25px' : '3px',
                      transition: 'left 0.2s',
                    }} />
                  </button>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                }}>
                  <span style={{ color: 'white', fontWeight: 600 }}>💡 Light Automations</span>
                  <button
                    onClick={() => updateSetting('enable_light_automations', !localSettings.enable_light_automations)}
                    style={{
                      width: '50px',
                      height: '28px',
                      borderRadius: '14px',
                      border: 'none',
                      background: localSettings.enable_light_automations ? '#4CAF50' : 'rgba(255,255,255,0.3)',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: 'white',
                      position: 'absolute',
                      top: '3px',
                      left: localSettings.enable_light_automations ? '25px' : '3px',
                      transition: 'left 0.2s',
                    }} />
                  </button>
                </div>
              </div>
              
              {/* Test Connection */}
              <button
                onClick={async () => {
                  await DB.sendToHomeAssistant('test', { message: 'Connection test from schedule app' });
                  alert('Test event sent! Check Home Assistant logs.');
                }}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'rgba(255,255,255,0.2)',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderRadius: '12px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 600,
                }}
              >
                🧪 Test Connection
              </button>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.2)', display: 'flex', gap: '12px' }}>
          <button onClick={onClose} style={{
            flex: 1,
            padding: '14px',
            border: '2px solid rgba(255,255,255,0.4)',
            borderRadius: '12px',
            background: 'transparent',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 600,
          }}>Cancel</button>
          <button onClick={handleSave} style={{
            flex: 1,
            padding: '14px',
            border: 'none',
            borderRadius: '12px',
            background: 'white',
            color: '#764ba2',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 700,
          }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
};

// ===========================================
// MAIN APP
// ===========================================
function ToddlerScheduleApp() {
  const [currentTime, setCurrentTime] = React.useState(getCurrentMinutes());
  const [settings, setSettings] = React.useState(null);
  const [schedule, setSchedule] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showSettings, setShowSettings] = React.useState(false);
  const [lastActivityId, setLastActivityId] = React.useState(null);
  const [scheduleType, setScheduleType] = React.useState('home');
  const [refreshingActivity, setRefreshingActivity] = React.useState(null);
  const [generatedActivities, setGeneratedActivities] = React.useState({});
  const [weather, setWeather] = React.useState(null);
  const [weatherLoading, setWeatherLoading] = React.useState(true);

  // Fetch weather
  const fetchWeather = React.useCallback(async () => {
    setWeatherLoading(true);
    const weatherData = await DB.getWeather();
    setWeather(weatherData);
    setWeatherLoading(false);
  }, []);

  // Initialize
  React.useEffect(() => {
    const init = async () => {
      await DB.init();
      await DB.cleanup();
      const loadedSettings = await DB.getSettings();
      setSettings(loadedSettings);

      // Determine if today is a school day
      const today = new Date().getDay();
      const isSchool = loadedSettings.school_days.includes(today);
      setScheduleType(isSchool ? 'school' : 'home');

      // Fetch weather
      fetchWeather();
    };
    init();
  }, []);

  // Refresh weather every 30 minutes
  React.useEffect(() => {
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  // Build schedule when settings load
  const buildFullSchedule = React.useCallback(async () => {
    if (!settings) return;
    
    setLoading(true);
    const todayKey = getTodayKey();
    const isSchool = scheduleType === 'school';
    
    // Check for existing schedule
    const existing = await DB.getSchedule(todayKey, scheduleType);
    
    let activities;
    if (existing && existing.activities) {
      activities = existing.activities;
    } else {
      // Generate activities from database
      activities = await generateActivitiesFromDB(settings.current_season);
      await DB.saveSchedule(todayKey, scheduleType, activities);

      sendToHomeAssistant(settings, 'schedule_generated', {
        day_type: scheduleType,
        activities,
      });
    }
    
    setGeneratedActivities(activities);
    
    // Build template and merge activities
    const template = buildScheduleTemplate(settings, isSchool);
    const fullSchedule = template.map(item => {
      if (item.customizable && item.slot && activities[item.slot]) {
        const custom = activities[item.slot];
        return { ...item, name: custom.name, type: custom.type, description: custom.description };
      }
      return item;
    });
    
    setSchedule(fullSchedule);
    setLoading(false);
  }, [settings, scheduleType]);

  // Regenerate a single activity
  const handleRefreshSingleActivity = React.useCallback(async (activity) => {
    if (!settings || !activity.slot) return;

    setRefreshingActivity(activity.id);

    try {
      // Get current activity names to exclude
      const currentNames = Object.values(generatedActivities).map(a => a.name);

      // Get a random activity from DB
      const randomActivity = await getRandomActivityFromDB(settings.current_season, [activity.name]);

      if (!randomActivity) {
        alert('No alternative activities available. Add more in settings!');
        return;
      }

      const newActivity = {
        name: randomActivity.name,
        type: randomActivity.type,
        description: randomActivity.description,
      };

      // Update the generated activities
      const updatedActivities = {
        ...generatedActivities,
        [activity.slot]: newActivity,
      };

      setGeneratedActivities(updatedActivities);

      // Save to database
      const todayKey = getTodayKey();
      await DB.saveSchedule(todayKey, scheduleType, updatedActivities);

      // Update the schedule
      setSchedule(prevSchedule =>
        prevSchedule.map(item =>
          item.id === activity.id
            ? { ...item, name: newActivity.name, type: newActivity.type, description: newActivity.description }
            : item
        )
      );
    } catch (error) {
      console.error('Failed to regenerate activity:', error);
      alert('Failed to generate new activity. Please try again.');
    } finally {
      setRefreshingActivity(null);
    }
  }, [settings, scheduleType, generatedActivities]);

  React.useEffect(() => {
    buildFullSchedule();
  }, [buildFullSchedule]);

  // Update time every second for smooth countdown
  React.useEffect(() => {
    const interval = setInterval(() => setCurrentTime(getCurrentMinutes()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Find current activity
  const currentActivityIndex = schedule.findIndex(activity => {
    const start = parseTime(activity.start);
    const end = parseTime(activity.end);
    return currentTime >= start && currentTime < end;
  });

  const currentActivity = currentActivityIndex !== -1 ? schedule[currentActivityIndex] : null;

  // Send HA events on activity change
  React.useEffect(() => {
    if (settings && currentActivity && currentActivity.id !== lastActivityId) {
      setLastActivityId(currentActivity.id);
      
      DB.logActivity({
        activity_id: currentActivity.id,
        activity_name: currentActivity.name,
        activity_type: currentActivity.type,
      });
      
      sendToHomeAssistant(settings, 'activity_changed', {
        activity_id: currentActivity.id,
        activity_name: currentActivity.name,
        activity_type: currentActivity.type,
        start_time: currentActivity.start,
        end_time: currentActivity.end,
        description: currentActivity.description || '',
      });
    }
  }, [settings, currentActivity, lastActivityId]);

  // Calculate progress
  let timeRemaining = 0;
  let progress = 0;
  if (currentActivityIndex !== -1 && schedule[currentActivityIndex]) {
    const current = schedule[currentActivityIndex];
    const start = parseTime(current.start);
    const end = parseTime(current.end);
    timeRemaining = end - currentTime;
    progress = ((currentTime - start) / (end - start)) * 100;
  }

  // Time display
  const now = new Date();
  const timeDisplay = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayDisplay = dayNames[now.getDay()];

  const upcomingActivities = schedule.filter((_, index) => index !== currentActivityIndex);

  const handleRegenerate = async () => {
    const todayKey = getTodayKey();
    await DB.deleteSchedule(todayKey, scheduleType);
    await buildFullSchedule();
  };

  const handleSaveSettings = async (newSettings) => {
    await DB.updateSettings(newSettings);
    setSettings(newSettings);
    
    // Check if schedule type changed
    const today = new Date().getDay();
    const isSchool = newSettings.school_days.includes(today);
    setScheduleType(isSchool ? 'school' : 'home');
  };

  if (!settings) {
    return <LoadingSpinner />;
  }

  const theme = THEMES[settings.theme] || THEMES.purple;

  return (
    <div style={{
      minHeight: '100vh',
      background: theme,
      padding: '20px',
      fontFamily: "'Nunito', sans-serif",
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    }}>
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
          onActivitiesChange={() => {
            // Refresh weather after location change
            fetchWeather();
          }}
        />
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'white',
            }}
          >
            ⚙️
          </button>
        </div>
        
        <div style={{ fontSize: '56px', fontWeight: 800, textShadow: '0 4px 12px rgba(0,0,0,0.3)', lineHeight: 1.1 }}>
          {timeDisplay}
        </div>
        <div style={{ fontSize: '24px', fontWeight: 600, opacity: 0.9, marginTop: '4px' }}>{dayDisplay}</div>
        <div style={{ fontSize: '16px', fontWeight: 600, opacity: 0.8, marginTop: '2px' }}>
          {now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>

        {/* Weather Display */}
        <WeatherDisplay weather={weather} loading={weatherLoading} />

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '12px' }}>
          <button
            onClick={() => setScheduleType('school')}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              fontWeight: 700,
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              background: scheduleType === 'school' ? 'white' : 'rgba(255,255,255,0.3)',
              color: scheduleType === 'school' ? '#764ba2' : 'white',
            }}
          >
            🏫 School Day
          </button>
          <button
            onClick={() => setScheduleType('home')}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              fontWeight: 700,
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              background: scheduleType === 'home' ? 'white' : 'rgba(255,255,255,0.3)',
              color: scheduleType === 'home' ? '#764ba2' : 'white',
            }}
          >
            🏠 Home Day
          </button>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={loading}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            borderRadius: '50px',
            cursor: loading ? 'not-allowed' : 'pointer',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            opacity: loading ? 0.5 : 1,
          }}
        >
          🎲 New Activities
        </button>

        <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
          {settings.enable_home_assistant ? '🟢 Home Assistant Connected' : '⚪ Home Assistant Disabled'}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Current Activity Card with Integrated Countdown */}
          {currentActivityIndex !== -1 && (
            <CurrentActivityCard
              activity={schedule[currentActivityIndex]}
              timeRemaining={timeRemaining}
              onRefresh={handleRefreshSingleActivity}
              isRefreshing={refreshingActivity === schedule[currentActivityIndex].id}
            />
          )}

          <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '24px',
            padding: '20px',
            backdropFilter: 'blur(10px)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}>
            <div style={{ textAlign: 'center', color: 'white', fontSize: '20px', fontWeight: 700, marginBottom: '12px', flexShrink: 0 }}>
              📅 Today's Schedule
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              {upcomingActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  isCurrent={false}
                  isPast={currentTime >= parseTime(activity.end)}
                  timeRemaining={0}
                  progress={0}
                  onRefresh={handleRefreshSingleActivity}
                  isRefreshing={refreshingActivity === activity.id}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}


