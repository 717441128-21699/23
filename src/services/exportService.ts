export type ExportFormat = 'csv' | 'json' | 'txt';

export interface ExportField<T = unknown> {
  key: string;
  label: string;
  format?: (value: unknown, row: T) => string | number;
}

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatValue(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return escapeCSV(value);
}

export function exportToCSV<T extends Record<string, unknown>>(
  tasks: T[],
  fields: ExportField<T>[] | string[]
): string {
  if (!tasks || tasks.length === 0) {
    const headers = fields.map((f) => (typeof f === 'string' ? f : f.label));
    return headers.join(',');
  }

  const normalizedFields: ExportField<T>[] = fields.map((f) =>
    typeof f === 'string' ? { key: f, label: f } : f
  );

  const headers = normalizedFields.map((f) => escapeCSV(f.label));
  const rows = tasks.map((row) =>
    normalizedFields
      .map((field) => {
        const rawValue = row[field.key] as unknown;
        if (field.format) {
          return escapeCSV(field.format(rawValue, row));
        }
        return formatValue(rawValue);
      })
      .join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

export function generateDownloadBlob(
  data: string | object | ArrayBuffer,
  format: ExportFormat
): Blob {
  const mimeMap: Record<ExportFormat, string> = {
    csv: 'text/csv;charset=utf-8;',
    json: 'application/json;charset=utf-8;',
    txt: 'text/plain;charset=utf-8;',
  };

  let content: string | ArrayBuffer = data as string | ArrayBuffer;

  if (typeof data === 'object' && !(data instanceof ArrayBuffer)) {
    content = JSON.stringify(data, null, 2);
  }

  const mimeType = mimeMap[format] || mimeMap.txt;
  return new Blob([content as string | ArrayBuffer], { type: mimeType });
}

export function triggerDownload(blob: Blob, filename: string): void {
  if (!blob || !filename) return;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function exportJSON<T extends string | object | ArrayBuffer>(data: T, filename: string): void {
  const blob = generateDownloadBlob(data, 'json');
  triggerDownload(blob, filename.endsWith('.json') ? filename : `${filename}.json`);
}

export function exportCSV<T extends Record<string, unknown>>(
  data: T[],
  fields: ExportField<T>[] | string[],
  filename: string
): void {
  const csv = exportToCSV(data, fields);
  const blob = generateDownloadBlob('\ufeff' + csv, 'csv');
  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}
