const scopackager = require('../lib/index');
const fse = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

// Mock fs-extra to avoid actual file system operations during tests
jest.mock('fs-extra', () => ({
  outputFile: jest.fn().mockResolvedValue(),
  copy: jest.fn().mockResolvedValue(),
  ensureDir: jest.fn().mockResolvedValue(),
  createWriteStream: jest.fn(),
}));

// Mock archiver to avoid creating zip files
jest.mock('archiver');

describe('Simple SCORM Packager', () => {
  const mockArchive = {
    on: jest.fn(),
    pipe: jest.fn(),
    directory: jest.fn(),
    finalize: jest.fn().mockResolvedValue(),
    pointer: jest.fn().mockReturnValue(12345),
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Set up the archiver mock to return our mock archive object
    archiver.mockReturnValue(mockArchive);
  });

  it('should generate a SCORM 1.2 package correctly', async () => {
    const config = {
      source: './test-source',
      title: 'Test Course 1.2',
      organization: 'Test Org',
      version: '1.2',
    };

    await new Promise(resolve => scopackager(config, resolve));

    // Check that imsmanifest.xml was created
    expect(fse.outputFile).toHaveBeenCalledWith(
      path.join(config.source, 'imsmanifest.xml'),
      expect.any(String)
    );

    // Check that metadata.xml was created
    expect(fse.outputFile).toHaveBeenCalledWith(
      path.join(config.source, 'metadata.xml'),
      expect.any(String)
    );

    // Check that the correct schema files were copied
    expect(fse.copy).toHaveBeenCalledWith(
      expect.stringContaining(path.join('schemas', 'definitionFiles', 'scorm12edition')),
      expect.any(String)
    );

    // Check the content of the manifest
    const manifestContent = fse.outputFile.mock.calls[0][1];
    expect(manifestContent).toContain('<manifest');
    expect(manifestContent).toContain('<organization identifier="Test_Org">');
    expect(manifestContent).toContain('<title>Test Course 1.2</title>');
    expect(manifestContent).toContain('adlcp:scormtype>sco</adlcp:scormtype>');
  });

  it('should generate a SCORM 2004 4th Edition package correctly', async () => {
    const config = {
      source: './test-source',
      title: 'Test Course 2004.4',
      version: '2004 4th Edition',
    };

    await new Promise(resolve => scopackager(config, resolve));

    // Check that the correct schema files were copied
    expect(fse.copy).toHaveBeenCalledWith(
      expect.stringContaining(path.join('schemas', 'definitionFiles', 'scorm20044thedition')),
      expect.any(String)
    );

    // Check the content of the manifest for the correct version
    const manifestContent = fse.outputFile.mock.calls[0][1];
    expect(manifestContent).toContain('<schemaversion>2004 4th Edition</schemaversion>');
  });

  it('should create a zip archive when package.zip is true', async () => {
    const config = {
      source: './test-source',
      title: 'Zipped Course',
      package: {
        zip: true,
        outputFolder: './scorm-zips',
      },
    };

    await new Promise(resolve => scopackager(config, resolve));

    expect(archiver).toHaveBeenCalledWith('zip');
    expect(fse.ensureDir).toHaveBeenCalledWith(config.package.outputFolder);
    expect(mockArchive.directory).toHaveBeenCalledWith(config.source, false);
    expect(mockArchive.pipe).toHaveBeenCalled();
    expect(mockArchive.finalize).toHaveBeenCalled();
  });
});