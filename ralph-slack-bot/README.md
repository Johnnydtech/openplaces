# Ralph Slack Bot 🤖

A Slack bot that monitors your Ralph autonomous loop and lets you query status, check for blockers, and get real-time progress updates.

## Features

### Interactive Commands
- `/ralph-status` - Get current Ralph execution status
- `/ralph-blockers` - Check for any blockers or issues
- `/ralph-progress` - See overall task progress with visual progress bar
- `/ralph-tasks` - View pending and completed tasks

### Natural Language Queries
Just message the bot naturally:
- "What's Ralph's status?"
- "Are there any blockers?"
- "How's the progress?"
- "Show me the tasks"
- "Is Ralph stuck?"

### Proactive Alerts
Get automatic notifications for:
- ✅ Task completions
- 🎉 Project completion
- 🚨 Errors and failures
- ⏸️ Stuck/stalled execution
- ⚠️ API rate limit warnings

## Quick Start

### 1. Prerequisites

- Node.js 16+ installed
- A Slack workspace where you can create apps
- Ralph running in your project

### 2. Create Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name it "Ralph Bot" and select your workspace
4. Go to "OAuth & Permissions" and add these Bot Token Scopes:
   - `chat:write`
   - `chat:write.public`
   - `commands`
   - `channels:read`
   - `groups:read`
   - `im:read`
   - `mpim:read`

5. Go to "Socket Mode" and enable it
   - Generate an App-Level Token with `connections:write` scope
   - Save this token (starts with `xapp-`)

6. Go to "Slash Commands" and create these commands:
   - `/ralph-status` → "Get Ralph's current status"
   - `/ralph-blockers` → "Check for blockers"
   - `/ralph-progress` → "Show progress"
   - `/ralph-tasks` → "List tasks"

7. Go to "Event Subscriptions" and enable it
   - Add "message.channels" and "message.im" bot events

8. Install the app to your workspace
   - Go to "OAuth & Permissions" → "Install to Workspace"
   - Save the Bot User OAuth Token (starts with `xoxb-`)

### 3. Install Dependencies

```bash
cd ralph-slack-bot
npm install
```

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your tokens:

```bash
# From Step 2.8
SLACK_BOT_TOKEN=xoxb-your-bot-token-here

# From Step 2.5
SLACK_APP_TOKEN=xapp-your-app-token-here

# From Slack App > Basic Information > Signing Secret
SLACK_SIGNING_SECRET=your-signing-secret-here

# Ralph directory (relative or absolute path)
RALPH_DIR=../.ralph

# Project name for alerts
RALPH_PROJECT_NAME=My Awesome Project

# Optional: Slack channel for proactive alerts (default: general)
SLACK_CHANNEL=ralph-alerts
```

### 5. Start the Bot

```bash
npm start
```

You should see:
```
⚡️ Ralph Slack Bot is running!
📊 Monitoring Ralph at: ../.ralph
👀 Ralph monitor started
```

### 6. Test in Slack

1. Invite the bot to a channel: `/invite @Ralph Bot`
2. Try a command: `/ralph-status`
3. Or just ask: "Hey Ralph, what's your status?"

## Configuration

### Alert Settings

Edit `.env` to customize alert behavior:

```bash
# Enable/disable proactive alerts
ENABLE_PROACTIVE_ALERTS=true
ALERT_ON_ERRORS=true
ALERT_ON_COMPLETION=true
ALERT_ON_STUCK=true

# Thresholds
STUCK_THRESHOLD_MINUTES=30      # Alert if no activity for 30 min
ERROR_THRESHOLD_COUNT=3         # Alert after 3 consecutive errors
POLL_INTERVAL_MS=5000          # Check Ralph files every 5 seconds
```

### Running in Production

#### Option 1: PM2 (Recommended)

```bash
npm install -g pm2
pm2 start src/index.js --name ralph-bot
pm2 save
pm2 startup
```

#### Option 2: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY src ./src
CMD ["node", "src/index.js"]
```

```bash
docker build -t ralph-slack-bot .
docker run -d --name ralph-bot \
  --env-file .env \
  -v /path/to/.ralph:/app/.ralph:ro \
  ralph-slack-bot
```

#### Option 3: systemd

Create `/etc/systemd/system/ralph-bot.service`:

```ini
[Unit]
Description=Ralph Slack Bot
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/ralph-slack-bot
ExecStart=/usr/bin/node src/index.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable ralph-bot
sudo systemctl start ralph-bot
```

## Usage Examples

### Check Status
```
You: @Ralph Bot what's your status?
Bot: 🟢 Ralph Status
     Status: RUNNING
     Loop: #47
     API Calls: 23/100
     Last Action: completed
```

### Check for Blockers
```
You: /ralph-blockers
Bot: ✅ No blockers detected
     Ralph is running smoothly!
```

or

```
Bot: 🚧 2 Blocker(s) Found

     🚨 Test Failures
     3 test(s) failing

     ⚠️ API Rate Limit Warning
     89/100 calls used (89%)
```

### View Progress
```
You: how's the progress?
Bot: 📊 Ralph Progress
     ████████████████░░░░ 80%

     Completed Tasks: 16
     Total Tasks: 20
     Remaining: 4
     Progress: 80%
```

### List Tasks
```
You: show me the tasks
Bot: 📋 Task List
     Summary: 16 completed, 4 pending

     🔜 Next Tasks:
     ⬜ Story 4.1: Implement user authentication
     [Epic 4: Security Features]

     ⬜ Story 4.2: Add JWT token handling
     [Epic 4: Security Features]

     ✅ Recently Completed:
     ✅ Story 3.5: Add error boundaries
     [Epic 3: Core Features]
```

## Troubleshooting

### Bot doesn't respond

1. Check the bot is running: `ps aux | grep node`
2. Check logs for errors: `tail -f /path/to/logs`
3. Verify Ralph directory path in `.env`
4. Ensure bot is invited to the channel: `/invite @Ralph Bot`

### "Unable to read Ralph status"

- Ralph isn't running or `status.json` doesn't exist
- Check `RALPH_DIR` path in `.env`
- Verify Ralph has been started at least once

### Proactive alerts not working

- Check `ENABLE_PROACTIVE_ALERTS=true` in `.env`
- Verify `SLACK_CHANNEL` exists and bot is a member
- Check bot has `chat:write` permission

### Socket mode connection issues

- Verify `SLACK_APP_TOKEN` starts with `xapp-`
- Ensure Socket Mode is enabled in Slack App settings
- Check network/firewall allows WebSocket connections

## Architecture

```
┌─────────────────┐
│   Slack App     │
│   (Socket Mode) │
└────────┬────────┘
         │
         │ WebSocket
         │
┌────────▼────────────┐
│   Ralph Slack Bot   │
│  ┌───────────────┐  │
│  │ Slack Handler │  │
│  └───────┬───────┘  │
│          │          │
│  ┌───────▼────────┐ │
│  │ Status Parser  │ │
│  └───────┬────────┘ │
│          │          │
│  ┌───────▼────────┐ │
│  │ Ralph Monitor  │ │
│  │  (File Watch)  │ │
│  └───────┬────────┘ │
└──────────┼──────────┘
           │
           │ Read files
           │
┌──────────▼──────────┐
│  .ralph/ directory  │
│  ├── status.json    │
│  ├── progress.json  │
│  ├── @fix_plan.md   │
│  └── logs/          │
└─────────────────────┘
```

## Development

### Run in dev mode with auto-reload

```bash
npm run dev
```

### Run tests

```bash
npm test
```

### File Watching

The bot watches these Ralph files:
- `status.json` - Current execution status
- `progress.json` - Real-time progress
- `@fix_plan.md` - Task list and completion
- `.response_analysis` - Error detection
- `logs/ralph.log` - Error patterns

## Contributing

PRs welcome! Please:
1. Add tests for new features
2. Update README with new commands
3. Follow existing code style

## License

MIT

## Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Check Ralph documentation
- Ask in #ralph-users Slack channel

---

Built with ❤️ for the Ralph autonomous coding community
