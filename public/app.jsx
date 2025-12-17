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

  async searchAddresses(query) {
    try {
      const response = await fetch(`${API_BASE}/address-search?q=${encodeURIComponent(query)}`);
      if (!response.ok) return { results: [] };
      return await response.json();
    } catch (error) {
      console.error('Failed to search addresses:', error);
      return { results: [] };
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

  // Rating API
  async rateActivity(activityId, rating, date) {
    try {
      const response = await fetch(`${API_BASE}/activities/${activityId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, date }),
      });
      if (!response.ok) throw new Error('Failed to rate activity');
      return await response.json();
    } catch (error) {
      console.error('Failed to rate activity:', error);
      throw error;
    }
  },

  async getRatingsForDate(date) {
    try {
      const response = await fetch(`${API_BASE}/ratings/${date}`);
      if (!response.ok) throw new Error('Failed to fetch ratings');
      const data = await response.json();
      return data.ratings;
    } catch (error) {
      console.error('Failed to get ratings:', error);
      return {};
    }
  },

  async getWeekSchedules(startDate, scheduleType) {
    try {
      const response = await fetch(`${API_BASE}/schedules/week/${startDate}?type=${scheduleType}`);
      if (!response.ok) throw new Error('Failed to fetch week schedules');
      return await response.json();
    } catch (error) {
      console.error('Failed to get week schedules:', error);
      return { schedules: {}, dates: [] };
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
      activity_duration: 30,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago',
      theme: 'lavender',
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
  // Morning/Energy - Warm soft tones
  wake: '#F5C77E',      // Soft gold
  breakfast: '#E8A87C', // Warm peach
  // Active/Play - Natural greens and terracotta
  freeplay: '#7FC8A9',  // Sage green
  outdoor: '#5DAE8B',   // Forest green
  activity: '#E07A5F',  // Terracotta
  // Learning/Calm - Cool blues
  school: '#6B8FC7',    // Slate blue
  reading: '#8AACC8',   // Sky blue
  quiettime: '#B8C5D6', // Light periwinkle
  // Rest - Soft purples
  nap: '#A78BBA',       // Lavender
  bath: '#89CFF0',      // Baby blue
  bedtime: '#7B68A6',   // Deep lavender
  // Meals - Earthy warm
  lunch: '#E9967A',     // Salmon
  dinner: '#CD7F5C',    // Sienna
  snack: '#F4A7BB',     // Soft pink
  cooking: '#D4826A',   // Clay
  // Other activities
  basement: '#79B4A9',  // Teal
  tv: '#C9B1D4',        // Light purple
  drive: '#D4A574',     // Camel
  errand: '#79B4A9',    // Teal
  mombreak: '#E8A87C',  // Warm peach
  sensory: '#C9A7D4',   // Soft violet
  music: '#8B9DC3',     // Dusty blue
  building: '#D4B896',  // Sand
  dance: '#E8A0B0',     // Dusty rose
  craft: '#9BC4A8',     // Sage
  puzzle: '#92A8D1',    // Periwinkle
  snow: '#A8D4E6',      // Ice blue
  fort: '#D4A574',      // Camel
};

const THEMES = {
  // Solid black background
  default: '#000000',
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

// Timezone-aware utility functions
const getTimeInTimezone = (timezone) => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const hours = parseInt(parts.find(p => p.type === 'hour').value);
  const minutes = parseInt(parts.find(p => p.type === 'minute').value);
  const seconds = parseInt(parts.find(p => p.type === 'second').value);
  return { hours, minutes, seconds };
};

const getDateInTimezone = (timezone) => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now); // Returns YYYY-MM-DD format
};

const getCurrentMinutes = (timezone) => {
  if (timezone) {
    const { hours, minutes, seconds } = getTimeInTimezone(timezone);
    return hours * 60 + minutes + seconds / 60;
  }
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
};

const getTodayKey = (timezone) => {
  if (timezone) {
    return getDateInTimezone(timezone);
  }
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
// Weighted random selection based on activity ratings
const weightedRandomSelect = (activities, excludeNames = []) => {
  const available = activities.filter(a => !excludeNames.includes(a.name));
  if (available.length === 0) return activities[Math.floor(Math.random() * activities.length)];
  
  // Calculate total weight
  const totalWeight = available.reduce((sum, a) => sum + (a.weight || 10), 0);
  
  // Random weighted selection
  let random = Math.random() * totalWeight;
  for (const activity of available) {
    random -= (activity.weight || 10);
    if (random <= 0) return activity;
  }
  
  return available[available.length - 1];
};

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
  const usedNames = [];

  slots.forEach((slot) => {
    // Use weighted selection for variety based on ratings
    const activity = weightedRandomSelect(dbActivities, usedNames);
    usedNames.push(activity.name);
    
    activities[slot] = {
      name: activity.name,
      type: activity.type,
      description: activity.description,
      activityDbId: activity.id, // Store DB ID for rating
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
        background: isAlmostDone ? 'rgba(224,122,95,0.2)' : isWarning ? 'rgba(245,199,126,0.2)' : '#262626',
        borderRadius: '12px',
        padding: '12px 16px',
        minWidth: '70px',
        transform: pulse ? 'scale(1.02)' : 'scale(1)',
        transition: 'transform 0.2s ease, background 0.3s ease',
      }}>
        <div style={{
          fontSize: '48px',
          fontWeight: 800,
          color: isAlmostDone ? '#E07A5F' : isWarning ? '#F5C77E' : '#FFFFFF',
          lineHeight: 1,
          fontFamily: "'Nunito', sans-serif",
        }}>
          {String(value).padStart(2, '0')}
        </div>
      </div>
      <div style={{
        fontSize: '11px',
        fontWeight: 600,
        color: '#666666',
        marginTop: '6px',
        textTransform: 'uppercase',
        letterSpacing: '1px',
      }}>
        {label}
      </div>
    </div>
  );
};

// Current Activity Card with integrated countdown
const CurrentActivityCard = ({ activity, timeRemaining, onRefresh, isRefreshing, onRate, rating }) => {
  const bgColor = ACTIVITY_COLORS[activity.type] || '#888';
  const icon = ACTIVITY_ICONS[activity.type] || '⭐';
  const canRefresh = activity.customizable && onRefresh;
  const canRate = activity.customizable && activity.activityDbId && onRate;
  
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
      background: '#161616',
      borderRadius: '28px',
      padding: '28px',
      textAlign: 'center',
      border: '1px solid #262626',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Activity color accent bar at top */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: bgColor,
      }} />

      {/* Header label */}
      <div style={{
        fontSize: '12px',
        fontWeight: 700,
        color: bgColor,
        marginBottom: '16px',
        marginTop: '8px',
        textTransform: 'uppercase',
        letterSpacing: '3px',
      }}>
        Now
      </div>

      {/* Activity icon - big and bouncy */}
      <div style={{
        fontSize: '72px',
        lineHeight: 1,
        marginBottom: '16px',
        animation: pulse ? 'bounce 0.3s ease' : 'none',
      }}>
        {icon}
      </div>

      {/* Activity name */}
      <div style={{
        fontSize: '28px',
        fontWeight: 800,
        color: '#FFFFFF',
        marginBottom: '8px',
        letterSpacing: '-0.02em',
      }}>
        {activity.name}
      </div>

      {/* Description */}
      {activity.description && (
        <div style={{
          fontSize: '16px',
          color: '#888888',
          fontWeight: 600,
          marginBottom: '8px',
        }}>
          {activity.description}
        </div>
      )}

      {/* Time range */}
      <div style={{
        fontSize: '14px',
        color: '#666666',
        fontWeight: 600,
        marginBottom: '24px',
      }}>
        {formatTime12h(activity.start)} - {formatTime12h(activity.end)}
      </div>

      {/* Big countdown numbers */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '20px',
      }}>
        {hours > 0 && (
          <>
            <CountdownDigit value={hours} label="hr" pulse={pulse} isWarning={isWarning} isAlmostDone={isAlmostDone} />
            <div style={{ fontSize: '48px', fontWeight: 800, color: '#444444', alignSelf: 'flex-start', marginTop: '12px' }}>:</div>
          </>
        )}
        <CountdownDigit value={minutes} label="min" pulse={pulse} isWarning={isWarning} isAlmostDone={isAlmostDone} />
        <div style={{ fontSize: '48px', fontWeight: 800, color: '#444444', alignSelf: 'flex-start', marginTop: '12px' }}>:</div>
        <CountdownDigit value={seconds} label="sec" pulse={pulse} isWarning={isWarning} isAlmostDone={isAlmostDone} />
      </div>

      {/* Progress bar */}
      <div style={{
        height: '6px',
        background: '#262626',
        borderRadius: '3px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: isAlmostDone ? '#E07A5F' : isWarning ? '#F5C77E' : bgColor,
          borderRadius: '3px',
          width: `${Math.max(0, 100 - ((timeRemaining / 60) * 100))}%`,
          minWidth: '2%',
          transition: 'width 1s linear, background 0.3s ease',
        }} />
      </div>

      {/* Action buttons row */}
      {(canRate || canRefresh) && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '20px',
        }}>
          {canRate && (
            <>
              <button
                onClick={() => onRate(activity.activityDbId, 1)}
                style={{
                  background: rating === 1 ? '#5DAE8B' : '#262626',
                  border: rating === 1 ? 'none' : '1px solid #333333',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  transition: 'all 0.2s ease',
                }}
              >
                👍 Love it!
              </button>
              <button
                onClick={() => onRate(activity.activityDbId, -1)}
                style={{
                  background: rating === -1 ? '#E07A5F' : '#262626',
                  border: rating === -1 ? 'none' : '1px solid #333333',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  transition: 'all 0.2s ease',
                }}
              >
                👎 Not today
              </button>
            </>
          )}
          {canRefresh && (
            <button
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              style={{
                background: '#262626',
                border: '1px solid #333333',
                borderRadius: '12px',
                padding: '12px 20px',
                cursor: isRefreshing ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: 700,
                color: '#FFFFFF',
                transition: 'all 0.2s ease',
                opacity: isRefreshing ? 0.5 : 1,
              }}
              title="Get different activity"
            >
              <span style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}>🔄</span> Shuffle
            </button>
          )}
        </div>
      )}

      {/* Status messages */}
      {isAlmostDone && (
        <div style={{
          marginTop: '20px',
          fontSize: '16px',
          fontWeight: 700,
          color: '#F5C77E',
          animation: 'pulse 1s infinite',
        }}>
          Almost time to switch!
        </div>
      )}
      {isWarning && !isAlmostDone && (
        <div style={{
          marginTop: '20px',
          fontSize: '14px',
          fontWeight: 600,
          color: '#888888',
        }}>
          {Math.ceil(timeRemaining)} minutes left
        </div>
      )}
    </div>
  );
};

const ActivityCard = ({ activity, isCurrent, isPast, timeRemaining, progress, onRefresh, isRefreshing, onRate, rating }) => {
  const bgColor = ACTIVITY_COLORS[activity.type] || '#888';
  const icon = ACTIVITY_ICONS[activity.type] || '⭐';
  const canRefresh = activity.customizable && !isPast && onRefresh;
  const canRate = activity.customizable && activity.activityDbId && onRate;
  
  const handleRefreshClick = (e) => {
    e.stopPropagation();
    if (window.confirm(`🔄 Generate a new activity for "${activity.name}"?\n\nThis will create a different activity suggestion for this time slot.`)) {
      onRefresh(activity);
    }
  };

  const handleRate = (e, value) => {
    e.stopPropagation();
    if (onRate && activity.activityDbId) {
      onRate(activity.activityDbId, value);
    }
  };

  // Action buttons component (rating + refresh)
  const ActionButtons = ({ size = 'normal' }) => {
    const btnSize = size === 'small' ? '30px' : '36px';
    const fontSize = size === 'small' ? '14px' : '18px';
    const showRefresh = canRefresh && !isPast;

    if (!canRate && !showRefresh) return null;

    return (
      <div style={{
        display: 'flex',
        gap: '6px',
        marginTop: size === 'small' ? '0' : '8px',
      }}>
        {canRate && (
          <>
            <button
              onClick={(e) => handleRate(e, 1)}
              style={{
                background: rating === 1 ? '#5DAE8B' : '#333333',
                border: 'none',
                borderRadius: '8px',
                width: btnSize,
                height: btnSize,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: fontSize,
                transition: 'all 0.2s ease',
              }}
              title="Thumbs up - show more often"
            >
              👍
            </button>
            <button
              onClick={(e) => handleRate(e, -1)}
              style={{
                background: rating === -1 ? '#E07A5F' : '#333333',
                border: 'none',
                borderRadius: '8px',
                width: btnSize,
                height: btnSize,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: fontSize,
                transition: 'all 0.2s ease',
              }}
              title="Thumbs down - show less often"
            >
              👎
            </button>
          </>
        )}
        {showRefresh && (
          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            style={{
              background: '#333333',
              border: 'none',
              borderRadius: '8px',
              width: btnSize,
              height: btnSize,
              cursor: isRefreshing ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: fontSize,
              transition: 'all 0.2s ease',
              opacity: isRefreshing ? 0.5 : 1,
            }}
            title="Get different activity"
          >
            <span style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}>🔄</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{
      background: '#161616',
      borderRadius: '16px',
      padding: isCurrent ? '20px' : '14px 16px',
      display: 'flex',
      flexDirection: isCurrent ? 'column' : 'row',
      alignItems: 'center',
      gap: isCurrent ? '16px' : '14px',
      border: '1px solid #262626',
      opacity: isPast ? 0.4 : 1,
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative',
      transition: 'all 0.2s ease',
    }}>
      {/* Color accent */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: '3px',
        height: '60%',
        background: bgColor,
        borderRadius: '0 2px 2px 0',
      }} />

      {isCurrent ? (
        <>
          <div style={{ fontSize: '72px', lineHeight: 1 }}>{icon}</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF', textAlign: 'center', letterSpacing: '-0.01em' }}>
            {activity.name}
          </div>
          {activity.description && (
            <div style={{ fontSize: '16px', color: '#888888', fontWeight: 600, textAlign: 'center' }}>
              {activity.description}
            </div>
          )}
          <div style={{ fontSize: '16px', color: '#666666', fontWeight: 600 }}>
            {formatTime12h(activity.start)} - {formatTime12h(activity.end)}
          </div>
          <ActionButtons />
        </>
      ) : (
        <>
          <div style={{ fontSize: '32px', lineHeight: 1, flexShrink: 0, marginLeft: '8px', filter: isPast ? 'grayscale(30%)' : 'none' }}>{icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
              {activity.name}
            </div>
            <div style={{ fontSize: '13px', color: '#666666', fontWeight: 600 }}>
              {formatTime12h(activity.start)} - {formatTime12h(activity.end)}
            </div>
            {activity.description && (
              <div style={{ fontSize: '12px', color: '#555555', fontWeight: 500, marginTop: '2px' }}>
                {activity.description}
              </div>
            )}
          </div>
          {isPast ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <ActionButtons size="small" />
              <div style={{ fontSize: '20px', color: '#5DAE8B' }}>✓</div>
            </div>
          ) : (
            <ActionButtons size="small" />
          )}
        </>
      )}
    </div>
  );
};

const LoadingSpinner = () => (
  <div style={{ textAlign: 'center', padding: '40px' }}>
    <div style={{ fontSize: '64px', animation: 'spin 1.5s linear infinite' }}>🎨</div>
    <div style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: 700, marginTop: '16px' }}>Planning today's fun...</div>
  </div>
);

// Weather Display Component - Compact & Clean
const WeatherDisplay = ({ weather, loading }) => {
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#666666',
        fontSize: '14px',
      }}>
        <span style={{ animation: 'spin 1s linear infinite' }}>🌀</span>
        <span>Loading...</span>
      </div>
    );
  }

  if (!weather) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: '#666666',
        fontSize: '13px',
      }}>
        <span>🌡️</span>
        <span>Set location in ⚙️</span>
      </div>
    );
  }

  const icon = WEATHER_ICONS[weather.weatherCode] || '🌡️';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    }}>
      {/* Weather Icon */}
      <div style={{
        fontSize: '36px',
        lineHeight: 1,
      }}>
        {icon}
      </div>

      {/* Temperature & Details */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <div style={{
          fontSize: '24px',
          fontWeight: 800,
          color: '#FFFFFF',
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          {weather.temperature}°
        </div>
        <div style={{
          fontSize: '11px',
          color: '#666666',
          fontWeight: 600,
        }}>
          {weather.weatherDescription}
        </div>
      </div>

      {/* High/Low - Compact */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        fontSize: '11px',
        fontWeight: 700,
      }}>
        <span style={{ color: '#E07A5F' }}>↑{weather.high}°</span>
        <span style={{ color: '#6B8FC7' }}>↓{weather.low}°</span>
      </div>
    </div>
  );
};

// ===========================================
// WEEK CALENDAR COMPONENT
// ===========================================
const WeekCalendar = ({ selectedDate, onSelectDate, weekSchedules, schoolDays = [] }) => {
  // Use local date formatting to avoid timezone issues
  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseLocalDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const today = new Date();
  const todayStr = formatLocalDate(today);

  // Get start of week (Sunday) containing selected date
  const getWeekStart = (dateStr) => {
    const d = parseLocalDate(dateStr);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  };

  const [weekStart, setWeekStart] = React.useState(() => getWeekStart(selectedDate));

  // Generate week days
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dateStr = formatLocalDate(d);
    const dayOfWeek = d.getDay();
    weekDays.push({
      date: dateStr,
      dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
      dayNum: d.getDate(),
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDate,
      hasSchedule: weekSchedules && weekSchedules[dateStr],
      isSchoolDay: schoolDays.includes(dayOfWeek),
    });
  }

  const goToPrevWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() - 7);
    setWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + 7);
    setWeekStart(newStart);
  };

  const goToToday = () => {
    setWeekStart(getWeekStart(todayStr));
    onSelectDate(todayStr);
  };

  // Format month display
  const monthDisplay = () => {
    const firstDay = parseLocalDate(weekDays[0].date);
    const lastDay = parseLocalDate(weekDays[6].date);
    const firstMonth = firstDay.toLocaleDateString('en-US', { month: 'short' });
    const lastMonth = lastDay.toLocaleDateString('en-US', { month: 'short' });
    const year = firstDay.getFullYear();

    if (firstMonth === lastMonth) {
      return `${firstMonth} ${year}`;
    }
    return `${firstMonth} - ${lastMonth} ${year}`;
  };

  return (
    <div style={{
      background: '#161616',
      borderRadius: '16px',
      padding: '14px',
      marginBottom: '14px',
      border: '1px solid #262626',
    }}>
      {/* Header with navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}>
        <button
          onClick={goToPrevWeek}
          style={{
            background: '#262626',
            border: '1px solid #333333',
            borderRadius: '10px',
            padding: '8px 12px',
            color: '#888888',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
        >
          ‹
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '15px' }}>
            {monthDisplay()}
          </span>
          {selectedDate !== todayStr && (
            <button
              onClick={goToToday}
              style={{
                background: '#404040',
                border: 'none',
                borderRadius: '8px',
                padding: '5px 10px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
            >
              Today
            </button>
          )}
        </div>

        <button
          onClick={goToNextWeek}
          style={{
            background: '#262626',
            border: '1px solid #333333',
            borderRadius: '10px',
            padding: '8px 12px',
            color: '#888888',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
        >
          ›
        </button>
      </div>

      {/* Week days */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '6px',
      }}>
        {weekDays.map((day) => (
          <button
            key={day.date}
            onClick={() => onSelectDate(day.date)}
            style={{
              background: day.isSelected
                ? '#404040'
                : day.isToday
                  ? '#262626'
                  : 'transparent',
              border: 'none',
              borderRadius: '12px',
              padding: '8px 4px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: day.isSelected ? '#FFFFFF' : '#666666',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
            }}>
              {day.dayName}
            </span>
            <span style={{
              fontSize: '18px',
              fontWeight: 800,
              color: day.isSelected ? 'white' : day.isToday ? '#FFFFFF' : '#888888',
              lineHeight: 1,
            }}>
              {day.dayNum}
            </span>
            {/* School day indicator */}
            <span style={{
              fontSize: '10px',
              opacity: day.isSchoolDay ? 1 : 0,
              marginTop: '2px',
            }}>
              🏫
            </span>
          </button>
        ))}
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
  const [addressSuggestions, setAddressSuggestions] = React.useState([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [searchTimeout, setSearchTimeout] = React.useState(null);
  const [newActivity, setNewActivity] = React.useState({ name: '', type: 'activity', description: '', seasons: ['winter', 'spring', 'summer', 'fall'], duration: null });

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
      setNewActivity({ name: '', type: 'activity', description: '', seasons: ['winter', 'spring', 'summer', 'fall'], duration: null });
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
      // Auto-update timezone and season from location
      if (result.timezone) {
        updateSetting('timezone', result.timezone);
      }
      if (result.season) {
        updateSetting('current_season', result.season);
      }
      alert(`Location updated! Timezone set to ${result.timezone || 'auto'}, season to ${result.season || 'auto'}.`);
    } catch (error) {
      alert(error.message || 'Failed to find address. Try a more specific address.');
    }
    setGeocoding(false);
  };

  // Debounced address search
  const handleAddressChange = (value) => {
    setLocationAddress(value);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Don't search if too short
    if (value.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce the search
    const timeout = setTimeout(async () => {
      const { results } = await DB.searchAddresses(value);
      setAddressSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 300);

    setSearchTimeout(timeout);
  };

  const selectAddress = (suggestion) => {
    setLocationAddress(suggestion.display_name);
    setAddressSuggestions([]);
    setShowSuggestions(false);
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
    padding: '14px 16px',
    fontSize: '15px',
    border: '1px solid #333333',
    borderRadius: '12px',
    background: '#1A1A1A',
    color: '#FFFFFF',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '8px',
    color: '#FFFFFF',
  };

  const sectionButtonStyle = (active) => ({
    padding: '10px 14px',
    fontSize: '13px',
    fontWeight: 600,
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    background: active ? '#404040' : '#262626',
    color: active ? 'white' : '#888888',
    flex: 1,
    transition: 'all 0.2s ease',
  });

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        background: '#161616',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '85vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #262626',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #262626' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, color: '#FFFFFF', fontSize: '22px', fontWeight: 700 }}>⚙️ Settings</h2>
            <button onClick={onClose} style={{
              background: '#262626',
              border: '1px solid #333333',
              borderRadius: '10px',
              width: '40px',
              height: '40px',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#888888',
              transition: 'all 0.2s ease',
            }}>✕</button>
          </div>

          {/* Section tabs */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button onClick={() => setActiveSection('general')} style={sectionButtonStyle(activeSection === 'general')}>General</button>
            <button onClick={() => setActiveSection('schedule')} style={sectionButtonStyle(activeSection === 'schedule')}>Schedule</button>
            <button onClick={() => setActiveSection('activities')} style={sectionButtonStyle(activeSection === 'activities')}>Activities</button>
            <button onClick={() => setActiveSection('homeassistant')} style={sectionButtonStyle(activeSection === 'homeassistant')}>Smart Home</button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, background: '#0F0F0F' }}>
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
                        background: '#FEE2E2',
                        border: 'none',
                        borderRadius: '10px',
                        width: '44px',
                        height: '44px',
                        color: '#E07A5F',
                        cursor: 'pointer',
                        fontSize: '16px',
                        transition: 'all 0.2s ease',
                      }}>🗑</button>
                    )}
                  </div>
                ))}
                <button onClick={addKid} style={{
                  width: '100%',
                  padding: '12px',
                  background: '#1A1A1A',
                  border: '2px dashed #333333',
                  borderRadius: '12px',
                  color: '#888888',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}>+ Add Child</button>
              </div>
              
              {/* Location for Weather */}
              <div style={{ position: 'relative' }}>
                <label style={labelStyle}>Location (for weather, timezone & season)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      type="text"
                      value={locationAddress}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      style={inputStyle}
                      placeholder="Start typing your address..."
                    />
                    {/* Address suggestions dropdown */}
                    {showSuggestions && addressSuggestions.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#1A1A1A',
                        border: '1px solid #333333',
                        borderRadius: '8px',
                        marginTop: '4px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 100,
                      }}>
                        {addressSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            onClick={() => selectAddress(suggestion)}
                            style={{
                              padding: '10px 12px',
                              cursor: 'pointer',
                              borderBottom: index < addressSuggestions.length - 1 ? '1px solid #262626' : 'none',
                              fontSize: '13px',
                              color: '#CCCCCC',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#262626'}
                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                          >
                            {suggestion.display_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleGeocode}
                    disabled={geocoding}
                    style={{
                      padding: '12px 16px',
                      background: geocoding ? '#262626' : '#333333',
                      border: '1px solid #404040',
                      borderRadius: '12px',
                      color: 'white',
                      cursor: geocoding ? 'wait' : 'pointer',
                      fontWeight: 600,
                      fontSize: '14px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {geocoding ? '...' : 'Set'}
                  </button>
                </div>
                {locationDisplay && (
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '6px' }}>
                    📍 {locationDisplay.split(',').slice(0, 3).join(',')}
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

              {/* Timezone */}
              <div>
                <label style={labelStyle}>Timezone</label>
                <select
                  value={localSettings.timezone || 'America/Chicago'}
                  onChange={(e) => updateSetting('timezone', e.target.value)}
                  style={inputStyle}
                >
                  <option value="America/New_York">Eastern (New York)</option>
                  <option value="America/Chicago">Central (Chicago)</option>
                  <option value="America/Denver">Mountain (Denver)</option>
                  <option value="America/Phoenix">Arizona (Phoenix)</option>
                  <option value="America/Los_Angeles">Pacific (Los Angeles)</option>
                  <option value="America/Anchorage">Alaska (Anchorage)</option>
                  <option value="Pacific/Honolulu">Hawaii (Honolulu)</option>
                  <option value="Europe/London">UK (London)</option>
                  <option value="Europe/Paris">Central Europe (Paris)</option>
                  <option value="Europe/Berlin">Germany (Berlin)</option>
                  <option value="Asia/Tokyo">Japan (Tokyo)</option>
                  <option value="Asia/Shanghai">China (Shanghai)</option>
                  <option value="Australia/Sydney">Australia (Sydney)</option>
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
                        background: localSettings.school_days.includes(index) ? '#404040' : '#262626',
                        color: localSettings.school_days.includes(index) ? '#FFFFFF' : '#888888',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '14px',
                        transition: 'all 0.2s ease',
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

              {/* Activity Duration */}
              <div>
                <label style={labelStyle}>Activity Duration</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[15, 30, 45, 60].map((duration) => (
                    <button
                      key={duration}
                      onClick={() => updateSetting('activity_duration', duration)}
                      style={{
                        flex: 1,
                        padding: '12px 0',
                        border: 'none',
                        borderRadius: '10px',
                        background: localSettings.activity_duration === duration ? '#404040' : '#262626',
                        color: localSettings.activity_duration === duration ? '#FFFFFF' : '#888888',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '14px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {duration === 60 ? '1hr' : `${duration}m`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'activities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Add New Activity Form */}
              <div style={{ background: '#1A1A1A', borderRadius: '16px', padding: '16px', border: '1px solid #262626' }}>
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
                            background: newActivity.seasons.includes(season) ? '#404040' : '#262626',
                            color: newActivity.seasons.includes(season) ? 'white' : '#666666',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '12px',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '12px' }}>Duration (optional)</label>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      {[
                        { value: null, label: 'Default' },
                        { value: 15, label: '15m' },
                        { value: 30, label: '30m' },
                        { value: 45, label: '45m' },
                        { value: 60, label: '1hr' },
                      ].map((opt) => (
                        <button
                          key={opt.label}
                          onClick={() => setNewActivity(prev => ({ ...prev, duration: opt.value }))}
                          style={{
                            flex: 1,
                            padding: '8px 4px',
                            border: 'none',
                            borderRadius: '8px',
                            background: newActivity.duration === opt.value ? '#404040' : '#262626',
                            color: newActivity.duration === opt.value ? 'white' : '#666666',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '12px',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleAddActivity}
                    style={{
                      padding: '12px',
                      background: '#404040',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '14px',
                      transition: 'all 0.2s ease',
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
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666666' }}>
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
                          padding: '12px',
                          background: '#1A1A1A',
                          borderRadius: '12px',
                          border: '1px solid #262626',
                        }}
                      >
                        <span style={{ fontSize: '24px' }}>{ACTIVITY_ICONS[activity.type] || '🎨'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '14px' }}>{activity.name}</div>
                          {activity.description && (
                            <div style={{ color: '#666666', fontSize: '12px' }}>{activity.description}</div>
                          )}
                          <div style={{ display: 'flex', gap: '4px', marginTop: '4px', alignItems: 'center' }}>
                            {activity.seasons.map(s => (
                              <span key={s} style={{ fontSize: '10px' }}>
                                {s === 'winter' ? '❄️' : s === 'spring' ? '🌸' : s === 'summer' ? '☀️' : '🍂'}
                              </span>
                            ))}
                            {activity.duration && (
                              <span style={{ fontSize: '10px', color: '#888888', marginLeft: '8px' }}>
                                ⏱ {activity.duration === 60 ? '1hr' : `${activity.duration}m`}
                              </span>
                            )}
                          </div>
                        </div>
                        {activity.is_default ? (
                          <span style={{ fontSize: '10px', color: '#666666', padding: '4px 8px', background: '#262626', borderRadius: '8px' }}>Default</span>
                        ) : (
                          <button
                            onClick={() => handleDeleteActivity(activity.id)}
                            style={{
                              background: '#3D2020',
                              border: 'none',
                              borderRadius: '8px',
                              width: '32px',
                              height: '32px',
                              color: '#E07A5F',
                              cursor: 'pointer',
                              fontSize: '14px',
                              transition: 'all 0.2s ease',
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
        <div style={{ padding: '16px 24px', borderTop: '1px solid #262626', display: 'flex', gap: '12px', background: '#161616' }}>
          <button onClick={onClose} style={{
            flex: 1,
            padding: '14px',
            border: '1px solid #333333',
            borderRadius: '12px',
            background: '#262626',
            color: '#888888',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}>Cancel</button>
          <button onClick={handleSave} style={{
            flex: 1,
            padding: '14px',
            border: 'none',
            borderRadius: '12px',
            background: '#404040',
            color: 'white',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 700,
            transition: 'all 0.2s ease',
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
  
  // Calendar & Rating state
  const [selectedDate, setSelectedDate] = React.useState(getTodayKey());
  const [weekSchedules, setWeekSchedules] = React.useState({});
  const [ratings, setRatings] = React.useState({});

  // Fetch weather
  const fetchWeather = React.useCallback(async () => {
    setWeatherLoading(true);
    const weatherData = await DB.getWeather();
    setWeather(weatherData);
    setWeatherLoading(false);
  }, []);

  // Fetch ratings for selected date
  const fetchRatings = React.useCallback(async (date) => {
    const dateRatings = await DB.getRatingsForDate(date);
    setRatings(dateRatings);
  }, []);

  // Fetch week schedules
  const fetchWeekSchedules = React.useCallback(async (startDate, type) => {
    const weekData = await DB.getWeekSchedules(startDate, type);
    setWeekSchedules(weekData.schedules || {});
  }, []);

  // Handle rating an activity
  const handleRateActivity = React.useCallback(async (activityId, rating) => {
    try {
      await DB.rateActivity(activityId, rating, selectedDate);
      setRatings(prev => ({ ...prev, [activityId]: rating }));
    } catch (error) {
      console.error('Failed to rate activity:', error);
    }
  }, [selectedDate]);

  // Initialize
  React.useEffect(() => {
    const init = async () => {
      await DB.init();
      await DB.cleanup();
      const loadedSettings = await DB.getSettings();
      setSettings(loadedSettings);

      // Get today in the configured timezone
      const todayKey = getTodayKey(loadedSettings.timezone);
      setSelectedDate(todayKey);

      // Determine if today is a school day (using timezone)
      const todayDate = new Date(todayKey + 'T12:00:00'); // Use noon to avoid DST issues
      const today = todayDate.getDay();
      const isSchool = loadedSettings.school_days.includes(today);
      setScheduleType(isSchool ? 'school' : 'home');

      // Fetch weather and ratings
      fetchWeather();
      fetchRatings(todayKey);
    };
    init();
  }, []);

  // Refresh weather every 30 minutes
  React.useEffect(() => {
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  // Build schedule when settings load or date changes
  const buildFullSchedule = React.useCallback(async (dateKey = null) => {
    if (!settings) return;
    
    setLoading(true);
    const targetDate = dateKey || selectedDate;
    const isSchool = scheduleType === 'school';
    
    // Check for existing schedule
    const existing = await DB.getSchedule(targetDate, scheduleType);
    
    let activities;
    if (existing && existing.activities) {
      activities = existing.activities;
    } else {
      // Generate activities from database with weighted selection
      activities = await generateActivitiesFromDB(settings.current_season);
      await DB.saveSchedule(targetDate, scheduleType, activities);

      // Only send HA notification for today
      if (targetDate === getTodayKey(settings.timezone)) {
        sendToHomeAssistant(settings, 'schedule_generated', {
          day_type: scheduleType,
          activities,
        });
      }
    }
    
    setGeneratedActivities(activities);
    
    // Build template and merge activities
    const template = buildScheduleTemplate(settings, isSchool);
    const fullSchedule = template.map(item => {
      if (item.customizable && item.slot && activities[item.slot]) {
        const custom = activities[item.slot];
        return { 
          ...item, 
          name: custom.name, 
          type: custom.type, 
          description: custom.description,
          activityDbId: custom.activityDbId, // Include DB ID for rating
        };
      }
      return item;
    });
    
    setSchedule(fullSchedule);
    setLoading(false);
    
    // Fetch ratings for the selected date
    fetchRatings(targetDate);
    
    // Update week schedules (using local date parsing to avoid timezone issues)
    const [year, month, day] = targetDate.split('-').map(Number);
    const weekStart = new Date(year, month - 1, day);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
    fetchWeekSchedules(weekStartStr, scheduleType);
  }, [settings, scheduleType, selectedDate, fetchRatings, fetchWeekSchedules]);

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
      await DB.saveSchedule(selectedDate, scheduleType, updatedActivities);

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

  // Update time every second for smooth countdown (using timezone from settings)
  React.useEffect(() => {
    if (!settings) return;
    const interval = setInterval(() => setCurrentTime(getCurrentMinutes(settings.timezone)), 1000);
    return () => clearInterval(interval);
  }, [settings]);

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

  // Time display (using timezone from settings)
  const now = new Date();
  const timezone = settings?.timezone;
  const timeDisplay = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  });
  const dayDisplay = now.toLocaleDateString('en-US', {
    weekday: 'long',
    timeZone: timezone,
  });

  // Check if viewing today (using timezone)
  const isViewingToday = selectedDate === getTodayKey(timezone);
  
  // Only show current activity highlight when viewing today
  const displayCurrentIndex = isViewingToday ? currentActivityIndex : -1;
  const upcomingActivities = schedule.filter((_, index) => index !== displayCurrentIndex);

  const handleRegenerate = async () => {
    await DB.deleteSchedule(selectedDate, scheduleType);
    await buildFullSchedule(selectedDate);
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    // Determine schedule type based on selected date's day of week
    const [year, month, day] = newDate.split('-').map(Number);
    const selectedDayOfWeek = new Date(year, month - 1, day).getDay();
    const isSchool = settings.school_days.includes(selectedDayOfWeek);
    setScheduleType(isSchool ? 'school' : 'home');
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

  const theme = THEMES.default;

  return (
    <div style={{
      minHeight: '100vh',
      background: theme,
      padding: 'clamp(12px, 4vw, 24px)',
      fontFamily: "'Nunito', sans-serif",
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      maxWidth: '900px',
      width: '100%',
      margin: '0 auto',
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

      {/* Compact Header */}
      <div style={{
        background: '#161616',
        borderRadius: '20px',
        padding: '18px',
        border: '1px solid #262626',
      }}>
        {/* Top Row: Time, Weather, Settings */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          {/* Time & Date */}
          <div style={{ color: '#FFFFFF' }}>
            <div style={{
              fontSize: '32px',
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}>
              {timeDisplay}
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#888888',
              marginTop: '4px',
            }}>
              {dayDisplay} · {now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* Weather Display */}
          <WeatherDisplay weather={weather} loading={weatherLoading} />

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            style={{
              background: '#262626',
              border: '1px solid #333333',
              borderRadius: '12px',
              width: '44px',
              height: '44px',
              fontSize: '18px',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
          >
            ⚙️
          </button>
        </div>

        {/* Bottom Row: Schedule type indicator & Refresh */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '14px',
          gap: '10px',
        }}>
          {/* Schedule type indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: '#262626',
            borderRadius: '12px',
          }}>
            <span style={{ fontSize: '18px' }}>{scheduleType === 'school' ? '🏫' : '🏠'}</span>
            <span style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '14px' }}>
              {scheduleType === 'school' ? 'School Day' : 'Home Day'}
            </span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRegenerate}
            disabled={loading}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              borderRadius: '10px',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: '#404040',
              color: 'white',
              opacity: loading ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            🎲 <span>Shuffle</span>
          </button>
        </div>
      </div>

      {/* Week Calendar */}
      <WeekCalendar
        selectedDate={selectedDate}
        onSelectDate={handleDateChange}
        weekSchedules={weekSchedules}
        schoolDays={settings.school_days}
      />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Current Activity Card with Integrated Countdown - Only show for today */}
          {isViewingToday && displayCurrentIndex !== -1 && (
            <CurrentActivityCard
              activity={schedule[displayCurrentIndex]}
              timeRemaining={timeRemaining}
              onRefresh={handleRefreshSingleActivity}
              isRefreshing={refreshingActivity === schedule[displayCurrentIndex].id}
              onRate={handleRateActivity}
              rating={schedule[displayCurrentIndex].activityDbId ? ratings[schedule[displayCurrentIndex].activityDbId] : null}
            />
          )}

          <div style={{
            background: '#161616',
            borderRadius: '20px',
            padding: '20px',
            border: '1px solid #262626',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}>
            <div style={{ textAlign: 'center', color: '#FFFFFF', fontSize: '18px', fontWeight: 700, marginBottom: '16px', flexShrink: 0, letterSpacing: '-0.01em' }}>
              {isViewingToday ? "Today's Schedule" : new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              {upcomingActivities.map((activity) => {
                // For past dates, all activities are past. For future dates, none are.
                const isPastActivity = isViewingToday
                  ? currentTime >= parseTime(activity.end)
                  : selectedDate < getTodayKey(timezone);
                
                return (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    isCurrent={false}
                    isPast={isPastActivity}
                    timeRemaining={0}
                    progress={0}
                    onRefresh={handleRefreshSingleActivity}
                    isRefreshing={refreshingActivity === activity.id}
                    onRate={handleRateActivity}
                    rating={activity.activityDbId ? ratings[activity.activityDbId] : null}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}


