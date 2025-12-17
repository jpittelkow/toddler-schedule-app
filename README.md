# 🍼 Toddler Visual Schedule App

A beautiful, kid-friendly visual schedule application with:
- **Animated countdown timers** kids can follow
- **AI-generated daily activities** using Claude
- **SQLite database** for persistent storage
- **Home Assistant integration** for smart home automations
- **Settings panel** for easy customization

![Preview](https://via.placeholder.com/800x400?text=Toddler+Schedule+Preview)

---

## ✨ Features

### For Kids 👶
- Big, colorful activity cards with emoji icons
- **Animated countdown** with hours:minutes:seconds
- Bouncing icons and floating bubbles
- Visual warnings when activity is almost over
- Progress bar showing time elapsed

### For Parents 👨‍👩‍👧‍👦
- AI generates fresh activities each day
- **Refresh button** on each activity to get alternatives
- Configurable schedule (wake time, naps, bedtime, school days)
- Multiple color themes
- Home Assistant integration for automations

---

## 📁 What's Included

```
toddler-schedule-app/
├── install.sh                  # Automated installation script
├── server.js                   # Node.js backend with SQLite
├── api-client.js               # API client for React frontend
├── toddler-schedule-v2.jsx     # Main React component
├── package.json                # Node.js dependencies
├── home-assistant-config.yaml  # Home Assistant automations
└── README.md                   # This file
```

---

## 🚀 Quick Start

### Option 1: Automated Installation (Recommended)

```bash
# Extract the zip file
unzip toddler-schedule-app.zip
cd toddler-schedule-app

# Make install script executable
chmod +x install.sh

# Run the installer
./install.sh
```

The installer will:
1. Check for Node.js 18+
2. Install backend dependencies
3. Optionally set up the React frontend

### Option 2: Manual Installation

```bash
# Extract and enter directory
unzip toddler-schedule-app.zip
cd toddler-schedule-app

# Install backend dependencies
npm install

# Start the backend server
npm start
```

Server runs on `http://localhost:3001`

#### Setting up the React Frontend Manually

```bash
# Create React app
npx create-react-app client

# Copy files
cp toddler-schedule-v2.jsx client/src/App.jsx
cp api-client.js client/src/api.js

# Add import to top of App.jsx
# import { DB } from './api';

# Start frontend
cd client
npm start
```

Frontend runs on `http://localhost:3000`

### Option 3: Use in Claude.ai Artifacts

1. Open Claude.ai
2. Copy contents of `toddler-schedule-v2.jsx`
3. Ask Claude to run it as a React artifact
4. The app will use localStorage instead of SQLite

---

## ⚙️ Configuration

Click the **⚙️ Settings** button in the app to configure:

### General Tab
- **Kids**: Add names, ages, and colors for each child
- **Location**: Your city/state (for weather-appropriate activities)
- **Season**: Current season (affects activity suggestions)
- **Theme**: Choose from 6 color themes

### Schedule Tab
- **School Days**: Select which days have school (M/W/F, etc.)
- **Wake Time**: When kids wake up
- **Bedtime**: Target bedtime
- **School Hours**: Start and end time
- **Nap Times**: Baby nap and toddler nap schedules

### Home Assistant Tab
- **Enable/Disable**: Toggle HA integration
- **URL**: Your Home Assistant address
- **Webhook ID**: Custom webhook identifier
- **Voice Announcements**: Toggle TTS announcements
- **Light Automations**: Toggle light scene changes
- **Test Connection**: Verify webhook is working

---

## 🏠 Home Assistant Integration

### Setting Up the Webhook

1. In Home Assistant, go to **Settings → Automations**
2. Create a new automation
3. Add trigger: **Webhook**
4. Set webhook ID: `toddler-schedule` (or your custom ID)
5. Add actions based on the examples below

### Example Automations

Copy from `home-assistant-config.yaml` or use these examples:

#### Voice Announcement on Activity Change
```yaml
automation:
  - alias: "Announce Activity Change"
    trigger:
      - platform: webhook
        webhook_id: toddler-schedule
    condition:
      - condition: template
        value_template: "{{ trigger.json.event == 'activity_changed' }}"
    action:
      - service: tts.speak
        data:
          message: "Time for {{ trigger.json.activity_name }}!"
          media_player_entity_id: media_player.kitchen_speaker
```

#### Dim Lights for Nap Time
```yaml
automation:
  - alias: "Nap Time Lights"
    trigger:
      - platform: webhook
        webhook_id: toddler-schedule
    condition:
      - condition: template
        value_template: "{{ trigger.json.activity_type == 'nap' }}"
    action:
      - service: light.turn_on
        target:
          area_id: kids_room
        data:
          brightness_pct: 5
          color_temp: 500
```

### Webhook Events

**activity_changed** - Sent when current activity changes:
```json
{
  "event": "activity_changed",
  "activity_id": "breakfast",
  "activity_name": "Breakfast",
  "activity_type": "breakfast",
  "start_time": "07:00",
  "end_time": "07:30",
  "description": "Yummy morning fuel",
  "enable_voice": true,
  "enable_lights": true
}
```

**schedule_generated** - Sent when new daily schedule is created:
```json
{
  "event": "schedule_generated",
  "day_type": "school",
  "activities": { ... }
}
```

---

## 🎨 Activity Types & Icons

| Type | Icon | Description |
|------|------|-------------|
| wake | 🌅 | Morning wake up |
| breakfast | 🥣 | Breakfast |
| lunch | 🍽️ | Lunch |
| dinner | 🍝 | Dinner |
| snack | 🍎 | Snack times |
| nap | 😴 | Nap time |
| bath | 🛁 | Bath time |
| bedtime | 🌙 | Bedtime routine |
| freeplay | 🧸 | Unstructured play |
| activity | 🎨 | Structured activities |
| quiettime | 📚 | Quiet time |
| tv | 📺 | Screen time |
| outdoor | 🌳 | Outside play |
| basement | 🏠 | Basement play |
| school | 🏫 | School time |
| drive | 🚗 | Car rides |
| errand | 🛒 | Errands/outings |
| sensory | 🎭 | Sensory play |
| music | 🎵 | Music activities |
| building | 🧱 | Building/blocks |
| reading | 📖 | Reading |
| cooking | 👨‍🍳 | Cooking together |
| dance | 💃 | Dance party |
| craft | ✂️ | Arts & crafts |
| puzzle | 🧩 | Puzzles |
| snow | ❄️ | Snow play |
| fort | 🏰 | Fort building |

---

## 🖥️ Deployment Options

### Local Network (Raspberry Pi / Home Server)

```bash
# On your server
cd toddler-schedule-app
npm start

# Access from tablet at
http://YOUR_SERVER_IP:3001
```

### Docker

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t toddler-schedule .
docker run -d -p 3001:3001 -v ./data:/app/data toddler-schedule
```

### Systemd Service (Linux)

Create `/etc/systemd/system/toddler-schedule.service`:
```ini
[Unit]
Description=Toddler Schedule App
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/toddler-schedule-app
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable toddler-schedule
sudo systemctl start toddler-schedule
```

---

## 📱 Tablet Setup Tips

1. **Mount a tablet** in the kitchen or play area at kid height
2. **Use fullscreen mode** (F11 or add to home screen)
3. **Disable sleep** during active hours
4. **Set auto-brightness** or keep brightness high
5. **Use a case** with a stand or wall mount

### Recommended Tablets
- Amazon Fire HD 8/10 (budget-friendly)
- iPad (any model)
- Samsung Galaxy Tab
- Any Android tablet with Chrome

---

## 🔧 Troubleshooting

### Server won't start
- Check Node.js version: `node -v` (need 18+)
- Run `npm install` to install dependencies
- Check if port 3001 is in use: `lsof -i :3001`

### Database errors
- Delete `toddler-schedule.db` to reset
- Check file permissions in the directory

### Activities not generating
- Check browser console for errors
- Verify internet connection (Claude API needs access)
- Try the "🎲 New Activities" button

### Home Assistant not responding
- Verify webhook URL is correct
- Check HA logs: Settings → System → Logs
- Use "Test Connection" button in settings
- Ensure `local_only: false` in webhook config

### Display issues on tablet
- Clear browser cache
- Try a different browser
- Check if Nunito font is loading

---

## 🤝 Tips for Success

1. **Let kids help** press the "🎲 New Activities" button each morning
2. **Start simple** with HA - just announcements first
3. **Adjust times** to match your actual routine
4. **Use the refresh button** when an activity doesn't fit
5. **January is survival mode** - don't stress about perfect schedules!

---

## 📄 License

MIT License - Free to use and modify for your family!

---

## 💡 Ideas for Expansion

- Add multiple user profiles
- Weekly activity planning
- Integration with Google Calendar
- Reward/sticker chart for completed activities
- Weather API integration for outdoor activity suggestions
- Alexa/Google Home voice control

---

Made with ❤️ for busy parents and curious toddlers!
