const StatusParser = require('./status-parser');

describe('StatusParser', () => {
  let mockMonitor;
  let parser;

  beforeEach(() => {
    mockMonitor = {
      getStatus: jest.fn(),
      getProgress: jest.fn(),
      getFixPlan: jest.fn(),
      getResponseAnalysis: jest.fn()
    };
    parser = new StatusParser(mockMonitor);
  });

  describe('getCurrentStatus', () => {
    it('should return error when status file is missing', () => {
      mockMonitor.getStatus.mockReturnValue(null);
      const result = parser.getCurrentStatus();
      expect(result.text).toContain('Unable to read Ralph status');
    });

    it('should format status correctly', () => {
      mockMonitor.getStatus.mockReturnValue({
        status: 'running',
        loop_count: 42,
        calls_made_this_hour: 15,
        max_calls_per_hour: 100,
        last_action: 'executing',
        timestamp: new Date().toISOString()
      });

      const result = parser.getCurrentStatus();
      expect(result.blocks[0].type).toBe('header');
      expect(result.blocks[1].type).toBe('section');
    });
  });

  describe('getProgress', () => {
    it('should return error when fix plan is missing', () => {
      mockMonitor.getFixPlan.mockReturnValue(null);
      const result = parser.getProgress();
      expect(result.text).toContain('No task plan found');
    });

    it('should calculate progress correctly', () => {
      const fixPlan = `
# Tasks
- [x] Task 1
- [x] Task 2
- [ ] Task 3
- [ ] Task 4
      `;
      mockMonitor.getFixPlan.mockReturnValue(fixPlan);
      mockMonitor.getStatus.mockReturnValue({
        loop_count: 10,
        status: 'running'
      });

      const result = parser.getProgress();
      expect(result.text).toContain('2/4');
      expect(result.text).toContain('50%');
    });
  });

  describe('getBlockers', () => {
    it('should detect halted status as blocker', () => {
      mockMonitor.getStatus.mockReturnValue({
        status: 'halted',
        exit_reason: 'Circuit breaker'
      });
      mockMonitor.getResponseAnalysis.mockReturnValue(null);

      const result = parser.getBlockers();
      expect(result.text).toContain('blocker');
      expect(result.blocks.length).toBeGreaterThan(1);
    });

    it('should return no blockers when everything is fine', () => {
      mockMonitor.getStatus.mockReturnValue({
        status: 'running',
        calls_made_this_hour: 10,
        max_calls_per_hour: 100
      });
      mockMonitor.getResponseAnalysis.mockReturnValue({
        analysis: { has_errors: false }
      });

      const result = parser.getBlockers();
      expect(result.text).toContain('No blockers');
    });
  });

  describe('getTasks', () => {
    it('should parse tasks correctly', () => {
      const fixPlan = `
# Fix Plan

### [Epic 1]
- [x] Story 1.1
- [ ] Story 1.2

### [Epic 2]
- [ ] Story 2.1
      `;
      mockMonitor.getFixPlan.mockReturnValue(fixPlan);

      const result = parser.getTasks();
      expect(result.text).toContain('1 completed');
      expect(result.text).toContain('2 pending');
    });
  });
});
