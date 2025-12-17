/**
 * API Client for Toddler Schedule
 * 
 * This module handles all communication with the backend server.
 * Configure the API_BASE_URL to point to your server.
 */

// Configure this to your server address
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// ===========================================
// API HELPER
// ===========================================
const api = {
  async get(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },

  async post(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },

  async put(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },

  async delete(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },
};

// ===========================================
// DATABASE CLIENT (matches the DB interface in the React app)
// ===========================================
export const DB = {
  async init() {
    // Server handles initialization
    return true;
  },

  async getSettings() {
    try {
      return await api.get('/settings');
    } catch (error) {
      console.error('Failed to get settings:', error);
      // Return defaults if server unavailable
      return this.getDefaultSettings();
    }
  },

  async updateSettings(settings) {
    try {
      await api.put('/settings', settings);
      return settings;
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  },

  async getSchedule(dateKey, scheduleType) {
    try {
      const result = await api.get(`/schedule/${dateKey}/${scheduleType}`);
      return result;
    } catch (error) {
      console.error('Failed to get schedule:', error);
      return null;
    }
  },

  async saveSchedule(dateKey, scheduleType, activities) {
    try {
      await api.post('/schedule', {
        date: dateKey,
        schedule_type: scheduleType,
        activities,
      });
    } catch (error) {
      console.error('Failed to save schedule:', error);
      throw error;
    }
  },

  async deleteSchedule(dateKey, scheduleType) {
    try {
      await api.delete(`/schedule/${dateKey}/${scheduleType}`);
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      throw error;
    }
  },

  async logActivity(activity) {
    try {
      await api.post('/activity-log', activity);
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw - logging is not critical
    }
  },

  async cleanup() {
    try {
      await api.post('/cleanup', {});
    } catch (error) {
      console.error('Failed to cleanup:', error);
      // Don't throw - cleanup is not critical
    }
  },

  async sendToHomeAssistant(eventType, data) {
    try {
      await api.post('/home-assistant/webhook', {
        event: eventType,
        timestamp: new Date().toISOString(),
        ...data,
      });
    } catch (error) {
      console.error('Failed to send to Home Assistant:', error);
      // Don't throw - HA integration is not critical
    }
  },

  async getActivityHistory() {
    try {
      return await api.get('/activity-history');
    } catch (error) {
      console.error('Failed to get activity history:', error);
      return [];
    }
  },

  // Fallback default settings if server is unavailable
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

export default DB;
