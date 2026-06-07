import { apiPost } from './apiClient';
import type { Recommendation, RecommendationType, MaterialParams } from '@/types';

export interface RecommendationPayload {
  type: RecommendationType;
  taskId?: string;
  materialParams?: Partial<MaterialParams>;
  deviceLength?: number;
  deviceWidth?: number;
  targetFlipTime?: number;
  materialType?: string;
}

export function getRecommendation(
  payload: RecommendationPayload
): Promise<Recommendation> {
  return apiPost<Recommendation>('/recommend', payload);
}
