import { apiPost } from './apiClient';
import type { RecommendationType, MaterialParams } from '@/types';

export interface RecommendationPayload {
  type?: RecommendationType;
  taskId?: string;
  materialParams?: Partial<MaterialParams>;
  geometry?: Partial<{ length: number; width: number; thickness: number }>;
  deviceLength?: number;
  deviceWidth?: number;
  targetFlipTime?: number;
  materialType?: string;
}

export interface WriteCurrentData {
  range: { min: number; max: number; optimal: number };
  confidence: number;
  rationale: string;
}

export interface PinnedLayerData {
  materials: string[];
  thicknesses: number[];
  confidence: number;
  expectedCoercivity: number;
  thermalStability: number;
}

export interface FullRecommendation {
  writeCurrent: WriteCurrentData;
  pinnedLayers: PinnedLayerData[];
}

export function getRecommendation(
  payload: RecommendationPayload
): Promise<FullRecommendation> {
  return apiPost<FullRecommendation>('/recommend', payload);
}
