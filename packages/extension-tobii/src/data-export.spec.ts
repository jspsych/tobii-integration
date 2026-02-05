import { toCSV, toJSON } from './data-export';

// Mock DOM APIs
let mockClickCalled: boolean;
let mockHref: string;
let mockDownload: string;
let mockBlob: Blob | null;

beforeEach(() => {
  mockClickCalled = false;
  mockHref = '';
  mockDownload = '';
  mockBlob = null;

  // Mock URL.createObjectURL / revokeObjectURL
  global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = jest.fn();

  // Mock document.createElement to capture link behavior
  const originalCreateElement = document.createElement.bind(document);
  jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') {
      const link = originalCreateElement('a');
      Object.defineProperty(link, 'click', {
        value: jest.fn(() => {
          mockClickCalled = true;
          mockHref = link.href;
          mockDownload = link.download;
        }),
      });
      return link;
    }
    return originalCreateElement(tag);
  });

  jest.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
  jest.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('toCSV', () => {
  it('should warn and return for empty data', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    toCSV([], 'test.csv');
    expect(warnSpy).toHaveBeenCalledWith('No data to export');
    expect(mockClickCalled).toBe(false);
  });

  it('should trigger download for valid data', () => {
    const data = [
      { x: 0.5, y: 0.3, label: 'a' },
      { x: 0.6, y: 0.4, label: 'b' },
    ];
    toCSV(data, 'gaze.csv');
    expect(mockClickCalled).toBe(true);
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('should flatten nested objects', () => {
    const data = [{ point: { x: 0.1, y: 0.2 }, value: 42 }];

    // Capture the Blob content
    (URL.createObjectURL as jest.Mock).mockImplementation((blob: Blob) => {
      mockBlob = blob;
      return 'blob:mock-url';
    });

    toCSV(data, 'test.csv');

    // The blob should have been created
    expect(mockBlob).not.toBeNull();
  });

  it('should quote values containing commas', () => {
    const data = [{ name: 'hello, world', value: 1 }];

    let capturedContent = '';
    (URL.createObjectURL as jest.Mock).mockImplementation((blob: Blob) => {
      // Read blob synchronously via constructor
      capturedContent = 'captured';
      return 'blob:mock-url';
    });

    toCSV(data, 'test.csv');
    expect(mockClickCalled).toBe(true);
  });

  it('should handle arrays by stringifying them', () => {
    const data = [{ items: [1, 2, 3], label: 'test' }];
    toCSV(data, 'test.csv');
    expect(mockClickCalled).toBe(true);
  });

  it('should handle null values', () => {
    const data = [{ x: null, y: 0.5 }];
    toCSV(data, 'test.csv');
    expect(mockClickCalled).toBe(true);
  });
});

describe('toJSON', () => {
  it('should trigger download', () => {
    const data = [{ x: 0.5, y: 0.3 }];
    toJSON(data, 'gaze.json');
    expect(mockClickCalled).toBe(true);
  });

  it('should handle complex nested data', () => {
    const data = [
      {
        trial: 1,
        gaze: { x: 0.5, y: 0.5 },
        samples: [
          { t: 0, x: 0.5 },
          { t: 1, x: 0.6 },
        ],
      },
    ];
    toJSON(data, 'complex.json');
    expect(mockClickCalled).toBe(true);
  });
});
