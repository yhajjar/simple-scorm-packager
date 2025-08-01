const scopackager = require('../lib/index');
const fs = require('fs-extra');
const path = require('path');

// Mock fs-extra to avoid actual file system operations during tests
jest.mock('fs-extra');

describe('Simple SCORM Packager', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    fs.outputFile.mockClear();
    fs.copy.mockClear();
  });

  it('should run without errors with minimal configuration', (done) => {
    const config = {
      source: './test-source',
      title: 'Test Course'
    };

    // The callback function is our assertion
    const callback = (msg) => {
      expect(msg).toBe('Done');
      done();
    };

    scopackager(config, callback);
  });
});