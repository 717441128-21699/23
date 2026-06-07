import { apiPost } from './apiClient';

export interface ReportData {
  taskId: string;
  taskName: string;
  summary: string;
  parameters: Record<string, unknown>;
  results: Record<string, unknown>;
  warnings: string[];
  generatedAt: string;
}

export interface GenerateReportResponse {
  reportData: ReportData;
  pdfBase64: string;
}

export function generateReport(
  taskId: string
): Promise<GenerateReportResponse> {
  return apiPost<GenerateReportResponse>('/reports/generate', { taskId });
}
