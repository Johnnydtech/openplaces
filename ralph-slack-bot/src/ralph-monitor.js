const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

class RalphMonitor {
  constructor(ralphDir) {
    this.ralphDir = ralphDir;
    this.slackApp = null;
    this.lastStatus = null;
    this.lastError = null;
    this.lastTaskCompletion = null;
    this.consecutiveErrors = 0;
    this.lastActivityTime = Date.now();
    this.watchers = [];
  }

  setSlackApp(app) {
    this.slackApp = app;
  }

  start() {
    // Watch key Ralph files for changes
    const filesToWatch = [
      path.join(this.ralphDir, 'status.json'),
      path.join(this.ralphDir, 'progress.json'),
      path.join(this.ralphDir, '@fix_plan.md'),
      path.join(this.ralphDir, '.response_analysis'),
      path.join(this.ralphDir, 'logs/ralph.log')
    ];

    filesToWatch.forEach(file => {
      if (fs.existsSync(file)) {
        const watcher = chokidar.watch(file, {
          persistent: true,
          ignoreInitial: false
        });

        watcher.on('change', () => this.handleFileChange(file));
        this.watchers.push(watcher);
      }
    });

    // Periodic check for stuck state
    if (process.env.ENABLE_PROACTIVE_ALERTS === 'true') {
      setInterval(() => this.checkForStuckState(), 60000); // Check every minute
    }

    console.log(`📁 Watching ${filesToWatch.length} Ralph files`);
  }

  handleFileChange(file) {
    const fileName = path.basename(file);

    switch (fileName) {
      case 'status.json':
        this.handleStatusChange();
        break;
      case '@fix_plan.md':
        this.handleTaskCompletion();
        break;
      case '.response_analysis':
        this.handleResponseAnalysis();
        break;
      case 'ralph.log':
        this.handleLogChange();
        break;
    }

    this.lastActivityTime = Date.now();
  }

  handleStatusChange() {
    const statusFile = path.join(this.ralphDir, 'status.json');

    try {
      const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));

      // Detect status changes
      if (this.lastStatus && this.lastStatus.status !== status.status) {
        if (process.env.ALERT_ON_COMPLETION === 'true' &&
            status.status === 'completed' &&
            status.exit_reason) {
          this.sendAlert('completion', {
            message: `Ralph has completed! Exit reason: ${status.exit_reason}`,
            status: status
          });
        }

        if (status.status === 'halted' || status.status === 'error') {
          this.sendAlert('error', {
            message: `Ralph has halted or encountered an error`,
            status: status
          });
        }
      }

      this.lastStatus = status;
    } catch (error) {
      console.error('Error reading status file:', error);
    }
  }

  handleTaskCompletion() {
    const planFile = path.join(this.ralphDir, '@fix_plan.md');

    try {
      const content = fs.readFileSync(planFile, 'utf8');
      const completed = (content.match(/- \[x\]/gi) || []).length;
      const total = (content.match(/- \[(x| )\]/gi) || []).length;

      if (this.lastTaskCompletion && this.lastTaskCompletion.completed < completed) {
        const newlyCompleted = completed - this.lastTaskCompletion.completed;
        this.sendAlert('task_completion', {
          message: `${newlyCompleted} task(s) completed! Progress: ${completed}/${total}`,
          completed,
          total,
          percentage: Math.round((completed / total) * 100)
        });
      }

      this.lastTaskCompletion = { completed, total };
    } catch (error) {
      console.error('Error reading fix plan:', error);
    }
  }

  handleResponseAnalysis() {
    const analysisFile = path.join(this.ralphDir, '.response_analysis');

    try {
      const analysis = JSON.parse(fs.readFileSync(analysisFile, 'utf8'));

      if (analysis.analysis && analysis.analysis.has_errors) {
        this.consecutiveErrors++;

        if (this.consecutiveErrors >= parseInt(process.env.ERROR_THRESHOLD_COUNT || '3')) {
          this.sendAlert('repeated_errors', {
            message: `Ralph has encountered ${this.consecutiveErrors} consecutive errors`,
            analysis: analysis
          });
        }
      } else {
        this.consecutiveErrors = 0;
      }
    } catch (error) {
      // File might not exist or be invalid JSON
    }
  }

  handleLogChange() {
    const logFile = path.join(this.ralphDir, 'logs/ralph.log');

    try {
      const logContent = fs.readFileSync(logFile, 'utf8');
      const lines = logContent.split('\n');
      const recentLines = lines.slice(-10);

      // Look for error patterns in recent logs
      const errorPatterns = [
        'ERROR',
        'FATAL',
        'Exception',
        'Failed',
        'circuit breaker'
      ];

      const hasError = recentLines.some(line =>
        errorPatterns.some(pattern => line.includes(pattern))
      );

      if (hasError && process.env.ALERT_ON_ERRORS === 'true') {
        const errorLine = recentLines.find(line =>
          errorPatterns.some(pattern => line.includes(pattern))
        );

        if (errorLine !== this.lastError) {
          this.sendAlert('log_error', {
            message: 'Error detected in Ralph logs',
            errorLine: errorLine
          });
          this.lastError = errorLine;
        }
      }
    } catch (error) {
      console.error('Error reading log file:', error);
    }
  }

  checkForStuckState() {
    const timeSinceLastActivity = Date.now() - this.lastActivityTime;
    const stuckThreshold = parseInt(process.env.STUCK_THRESHOLD_MINUTES || '30') * 60 * 1000;

    if (timeSinceLastActivity > stuckThreshold &&
        this.lastStatus &&
        this.lastStatus.status === 'running') {

      if (process.env.ALERT_ON_STUCK === 'true') {
        this.sendAlert('stuck', {
          message: `Ralph appears to be stuck (no activity for ${Math.round(timeSinceLastActivity / 60000)} minutes)`,
          lastStatus: this.lastStatus
        });
      }
    }
  }

  async sendAlert(type, data) {
    if (!this.slackApp) {
      console.log(`Alert [${type}]:`, data.message);
      return;
    }

    const color = {
      completion: 'good',
      error: 'danger',
      task_completion: 'good',
      repeated_errors: 'danger',
      log_error: 'warning',
      stuck: 'warning'
    }[type] || '#808080';

    const emoji = {
      completion: '🎉',
      error: '🚨',
      task_completion: '✅',
      repeated_errors: '🔴',
      log_error: '⚠️',
      stuck: '⏸️'
    }[type] || '📢';

    try {
      await this.slackApp.client.chat.postMessage({
        channel: process.env.SLACK_CHANNEL || 'general',
        text: `${emoji} ${data.message}`,
        attachments: [{
          color: color,
          fields: Object.keys(data)
            .filter(key => key !== 'message')
            .map(key => ({
              title: key.replace(/_/g, ' ').toUpperCase(),
              value: typeof data[key] === 'object'
                ? JSON.stringify(data[key], null, 2)
                : String(data[key]),
              short: true
            }))
        }]
      });
    } catch (error) {
      console.error('Error sending Slack alert:', error);
    }
  }

  getStatus() {
    const statusFile = path.join(this.ralphDir, 'status.json');
    try {
      return JSON.parse(fs.readFileSync(statusFile, 'utf8'));
    } catch {
      return null;
    }
  }

  getProgress() {
    const progressFile = path.join(this.ralphDir, 'progress.json');
    try {
      return JSON.parse(fs.readFileSync(progressFile, 'utf8'));
    } catch {
      return null;
    }
  }

  getFixPlan() {
    const planFile = path.join(this.ralphDir, '@fix_plan.md');
    try {
      return fs.readFileSync(planFile, 'utf8');
    } catch {
      return null;
    }
  }

  getResponseAnalysis() {
    const analysisFile = path.join(this.ralphDir, '.response_analysis');
    try {
      return JSON.parse(fs.readFileSync(analysisFile, 'utf8'));
    } catch {
      return null;
    }
  }

  stop() {
    this.watchers.forEach(watcher => watcher.close());
    console.log('Ralph monitor stopped');
  }
}

module.exports = RalphMonitor;
