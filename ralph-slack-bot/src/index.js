require('dotenv').config();
const { App } = require('@slack/bolt');
const RalphMonitor = require('./ralph-monitor');
const StatusParser = require('./status-parser');

// Initialize Slack app with Socket Mode
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT || 3000
});

// Initialize Ralph monitor
const ralphMonitor = new RalphMonitor(process.env.RALPH_DIR || '../.ralph');
const statusParser = new StatusParser(ralphMonitor);

// Store the app instance for the monitor to send proactive alerts
ralphMonitor.setSlackApp(app);

// Command: /ralph-status
app.command('/ralph-status', async ({ command, ack, respond }) => {
  await ack();

  const status = statusParser.getCurrentStatus();
  await respond({
    text: status.text,
    blocks: status.blocks
  });
});

// Command: /ralph-blockers
app.command('/ralph-blockers', async ({ command, ack, respond }) => {
  await ack();

  const blockers = statusParser.getBlockers();
  await respond({
    text: blockers.text,
    blocks: blockers.blocks
  });
});

// Command: /ralph-progress
app.command('/ralph-progress', async ({ command, ack, respond }) => {
  await ack();

  const progress = statusParser.getProgress();
  await respond({
    text: progress.text,
    blocks: progress.blocks
  });
});

// Command: /ralph-tasks
app.command('/ralph-tasks', async ({ command, ack, respond }) => {
  await ack();

  const tasks = statusParser.getTasks();
  await respond({
    text: tasks.text,
    blocks: tasks.blocks
  });
});

// Message handler for natural language queries
app.message(async ({ message, say }) => {
  const text = message.text.toLowerCase();

  // Only respond to messages mentioning the bot or ralph
  if (!text.includes('ralph') && !text.includes('<@')) {
    return;
  }

  // Status queries
  if (text.includes('status') || text.includes('how is') || text.includes('what\'s happening')) {
    const status = statusParser.getCurrentStatus();
    await say({
      text: status.text,
      blocks: status.blocks,
      thread_ts: message.ts
    });
    return;
  }

  // Blocker queries
  if (text.includes('stuck') || text.includes('block') || text.includes('problem') || text.includes('issue')) {
    const blockers = statusParser.getBlockers();
    await say({
      text: blockers.text,
      blocks: blockers.blocks,
      thread_ts: message.ts
    });
    return;
  }

  // Progress queries
  if (text.includes('progress') || text.includes('how far') || text.includes('completion')) {
    const progress = statusParser.getProgress();
    await say({
      text: progress.text,
      blocks: progress.blocks,
      thread_ts: message.ts
    });
    return;
  }

  // Task queries
  if (text.includes('task') || text.includes('story') || text.includes('epic')) {
    const tasks = statusParser.getTasks();
    await say({
      text: tasks.text,
      blocks: tasks.blocks,
      thread_ts: message.ts
    });
    return;
  }

  // Help/general queries
  if (text.includes('help') || text.includes('what can you do')) {
    await say({
      text: 'Ralph Bot - Available Commands',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Ralph Bot - Available Commands*\n\n' +
                  'You can use slash commands or just ask me naturally!\n\n' +
                  '*Commands:*\n' +
                  '• `/ralph-status` - Get current Ralph status\n' +
                  '• `/ralph-blockers` - Check for any blockers or issues\n' +
                  '• `/ralph-progress` - See overall progress\n' +
                  '• `/ralph-tasks` - View task list and completion\n\n' +
                  '*Natural Language:*\n' +
                  '• "What\'s Ralph\'s status?" - Get current status\n' +
                  '• "Are there any blockers?" - Check for issues\n' +
                  '• "How\'s the progress?" - See progress\n' +
                  '• "Show me the tasks" - View task list'
          }
        }
      ],
      thread_ts: message.ts
    });
    return;
  }
});

// Error handler
app.error(async (error) => {
  console.error('Slack app error:', error);
});

// Start the app
(async () => {
  await app.start();
  console.log('⚡️ Ralph Slack Bot is running!');
  console.log(`📊 Monitoring Ralph at: ${process.env.RALPH_DIR}`);

  // Start monitoring Ralph
  ralphMonitor.start();
  console.log('👀 Ralph monitor started');
})();
