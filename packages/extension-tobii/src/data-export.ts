/**
 * Data export utilities
 */

/**
 * Convert data to CSV format and download
 */
export function toCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get all unique keys
  const keys = Array.from(new Set(data.flatMap((item) => Object.keys(flattenObject(item)))));

  // Create CSV header
  const header = keys.join(',');

  // Create CSV rows
  const rows = data.map((item) => {
    const flattened = flattenObject(item);
    return keys
      .map((key) => {
        const value = flattened[key];
        // Handle values that might contain commas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value ?? '';
      })
      .join(',');
  });

  // Combine header and rows
  const csv = [header, ...rows].join('\n');

  // Download
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Convert data to JSON format and download
 */
export function toJSON(data: Record<string, unknown>[], filename: string): void {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, filename, 'application/json');
}

/**
 * Flatten nested object for CSV export
 */
function flattenObject(obj: Record<string, unknown>, prefix: string = ''): Record<string, unknown> {
  const flattened: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value as Record<string, unknown>, newKey));
    } else if (Array.isArray(value)) {
      flattened[newKey] = JSON.stringify(value);
    } else {
      flattened[newKey] = value;
    }
  }

  return flattened;
}

/**
 * Download file helper
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
