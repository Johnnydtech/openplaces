class StatusParser {
  constructor(ralphMonitor) {
    this.monitor = ralphMonitor;
  }

  getCurrentStatus() {
    const status = this.monitor.getStatus();
    const progress = this.monitor.getProgress();

    if (!status) {
      return {
        text: '❌ Unable to read Ralph status',
        blocks: [{
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '❌ *Unable to read Ralph status*\n\nRalph may not be running or status file is missing.'
          }
        }]
      };
    }

    const statusEmoji = {
      running: '🟢',
      executing: '🔄',
      completed: '✅',
      halted: '🛑',
      error: '🚨',
      paused: '⏸️'
    }[status.status] || '⚪';

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${statusEmoji} Ralph Status`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Status:*\n${status.status.toUpperCase()}`
          },
          {
            type: 'mrkdwn',
            text: `*Loop:*\n#${status.loop_count || 0}`
          },
          {
            type: 'mrkdwn',
            text: `*API Calls:*\n${status.calls_made_this_hour}/${status.max_calls_per_hour}`
          },
          {
            type: 'mrkdwn',
            text: `*Last Action:*\n${status.last_action || 'N/A'}`
          }
        ]
      }
    ];

    if (status.exit_reason) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Exit Reason:* ${status.exit_reason}`
        }
      });
    }

    if (progress && progress.status === 'executing') {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `⏱️ *Currently Executing* (${progress.elapsed_seconds}s)\n\`\`\`${progress.last_output || 'Working...'}\`\`\``
        }
      });
    }

    blocks.push({
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: `Last updated: <!date^${Math.floor(new Date(status.timestamp).getTime() / 1000)}^{date_short_pretty} at {time}|${status.timestamp}>`
      }]
    });

    return {
      text: `Ralph Status: ${status.status}`,
      blocks
    };
  }

  getBlockers() {
    const status = this.monitor.getStatus();
    const analysis = this.monitor.getResponseAnalysis();
    const fixPlan = this.monitor.getFixPlan();

    const blockers = [];

    // Check status for issues
    if (status) {
      if (status.status === 'halted') {
        blockers.push({
          type: 'error',
          title: 'Ralph Halted',
          description: status.exit_reason || 'Unknown reason'
        });
      }

      if (status.status === 'error') {
        blockers.push({
          type: 'error',
          title: 'Execution Error',
          description: status.last_action || 'Check logs for details'
        });
      }

      // Check API rate limits
      if (status.calls_made_this_hour >= status.max_calls_per_hour * 0.9) {
        blockers.push({
          type: 'warning',
          title: 'API Rate Limit Warning',
          description: `${status.calls_made_this_hour}/${status.max_calls_per_hour} calls used (${Math.round((status.calls_made_this_hour / status.max_calls_per_hour) * 100)}%)`
        });
      }
    }

    // Check response analysis for errors
    if (analysis && analysis.analysis) {
      if (analysis.analysis.has_errors) {
        blockers.push({
          type: 'error',
          title: 'Code Errors Detected',
          description: analysis.analysis.error_summary || 'Errors found in execution'
        });
      }

      if (analysis.analysis.test_failures) {
        blockers.push({
          type: 'error',
          title: 'Test Failures',
          description: `${analysis.analysis.test_failures} test(s) failing`
        });
      }
    }

    // Check for circuit breaker
    if (status && status.status === 'circuit_breaker_open') {
      blockers.push({
        type: 'error',
        title: 'Circuit Breaker Open',
        description: 'Ralph detected stagnation and halted. Run `ralph --reset-circuit` to continue.'
      });
    }

    if (blockers.length === 0) {
      return {
        text: '✅ No blockers detected',
        blocks: [{
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '✅ *No blockers detected*\n\nRalph is running smoothly!'
          }
        }]
      };
    }

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🚧 ${blockers.length} Blocker(s) Found`
        }
      }
    ];

    blockers.forEach((blocker, index) => {
      const emoji = blocker.type === 'error' ? '🚨' : '⚠️';
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *${blocker.title}*\n${blocker.description}`
        }
      });

      if (index < blockers.length - 1) {
        blocks.push({ type: 'divider' });
      }
    });

    return {
      text: `${blockers.length} blocker(s) found`,
      blocks
    };
  }

  getProgress() {
    const fixPlan = this.monitor.getFixPlan();
    const status = this.monitor.getStatus();

    if (!fixPlan) {
      return {
        text: '❌ No task plan found',
        blocks: [{
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '❌ *No task plan found*\n\nThe @fix_plan.md file is missing.'
          }
        }]
      };
    }

    // Parse tasks
    const totalTasks = (fixPlan.match(/- \[(x| )\]/gi) || []).length;
    const completedTasks = (fixPlan.match(/- \[x\]/gi) || []).length;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Create progress bar
    const progressBarLength = 20;
    const filledBars = Math.round((percentage / 100) * progressBarLength);
    const progressBar = '█'.repeat(filledBars) + '░'.repeat(progressBarLength - filledBars);

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📊 Ralph Progress'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\`${progressBar}\` ${percentage}%`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Completed Tasks:*\n${completedTasks}`
          },
          {
            type: 'mrkdwn',
            text: `*Total Tasks:*\n${totalTasks}`
          },
          {
            type: 'mrkdwn',
            text: `*Remaining:*\n${totalTasks - completedTasks}`
          },
          {
            type: 'mrkdwn',
            text: `*Progress:*\n${percentage}%`
          }
        ]
      }
    ];

    if (status) {
      blocks.push({
        type: 'context',
        elements: [{
          type: 'mrkdwn',
          text: `Loop #${status.loop_count || 0} | Status: ${status.status}`
        }]
      });
    }

    return {
      text: `Progress: ${completedTasks}/${totalTasks} (${percentage}%)`,
      blocks
    };
  }

  getTasks() {
    const fixPlan = this.monitor.getFixPlan();

    if (!fixPlan) {
      return {
        text: '❌ No task plan found',
        blocks: [{
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '❌ *No task plan found*\n\nThe @fix_plan.md file is missing.'
          }
        }]
      };
    }

    // Parse tasks with better regex
    const lines = fixPlan.split('\n');
    const tasks = {
      pending: [],
      completed: [],
      currentEpic: null
    };

    lines.forEach(line => {
      // Epic headers
      if (line.match(/^###\s+\[.*?\]/)) {
        tasks.currentEpic = line.replace(/^###\s+/, '').trim();
      }

      // Pending tasks
      if (line.match(/^[\s]*-\s+\[\s\]/)) {
        const task = line.replace(/^[\s]*-\s+\[\s\]/, '').trim();
        tasks.pending.push({
          epic: tasks.currentEpic,
          task: task
        });
      }

      // Completed tasks
      if (line.match(/^[\s]*-\s+\[x\]/i)) {
        const task = line.replace(/^[\s]*-\s+\[x\]/i, '').trim();
        tasks.completed.push({
          epic: tasks.currentEpic,
          task: task
        });
      }
    });

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📋 Task List'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Summary:* ${tasks.completed.length} completed, ${tasks.pending.length} pending`
        }
      }
    ];

    // Show next 5 pending tasks
    if (tasks.pending.length > 0) {
      blocks.push({ type: 'divider' });
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*🔜 Next Tasks:*'
        }
      });

      tasks.pending.slice(0, 5).forEach(item => {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `⬜ ${item.task}\n_${item.epic || 'No epic'}_`
          }
        });
      });

      if (tasks.pending.length > 5) {
        blocks.push({
          type: 'context',
          elements: [{
            type: 'mrkdwn',
            text: `_... and ${tasks.pending.length - 5} more pending tasks_`
          }]
        });
      }
    }

    // Show last 3 completed tasks
    if (tasks.completed.length > 0) {
      blocks.push({ type: 'divider' });
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*✅ Recently Completed:*'
        }
      });

      tasks.completed.slice(-3).reverse().forEach(item => {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `✅ ${item.task}\n_${item.epic || 'No epic'}_`
          }
        });
      });
    }

    return {
      text: `Tasks: ${tasks.completed.length} completed, ${tasks.pending.length} pending`,
      blocks
    };
  }
}

module.exports = StatusParser;
