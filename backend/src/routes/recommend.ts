import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import type {
  MaterialParams,
  DeviceGeometry,
  WriteCurrentRecommendation,
  PinnedLayerRecommendation
} from '../types';

const router = Router();

interface RecommendBody {
  materialParams: Partial<MaterialParams>;
  geometry: Partial<DeviceGeometry>;
  taskHistory?: Array<{ materialParams: MaterialParams; result?: { success: boolean } }>;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { materialParams, geometry, taskHistory } = req.body as RecommendBody;
    if (!materialParams) {
      throw new AppError('缺少必填字段: materialParams', 400);
    }

    const Ms = materialParams.saturationMagnetization ?? 800e3;
    const K1 = materialParams.anisotropyConstant ?? 10e3;

    const baseCurrent = 50;
    let optimal = baseCurrent * (Ms / 1e6) * Math.sqrt(K1 / 1e4);
    optimal = clamp(Math.round(optimal), 20, 80);
    const writeCurrent: WriteCurrentRecommendation = {
      range: {
        min: clamp(optimal - 10, 20, 80),
        max: clamp(optimal + 10, 20, 80),
        optimal
      },
      confidence: 0,
      rationale: `基于 Ms=${(Ms / 1e3).toFixed(0)}kA/m 和 K1=${(K1 / 1e3).toFixed(0)}kJ/m³ 计算, ` +
        `公式 I_write = 50 * (Ms/1e6) * sqrt(K1/1e4), 范围限定 20~80mA。`
    };

    const historyMatches = (taskHistory ?? []).filter((h) => {
      const hMs = h.materialParams.saturationMagnetization;
      const hK1 = h.materialParams.anisotropyConstant;
      return Math.abs(hMs - Ms) / Ms < 0.1 && Math.abs(hK1 - K1) / K1 < 0.1;
    }).length;
    writeCurrent.confidence = Math.min(0.99, 0.7 + 0.3 * (historyMatches / 100));

    const pinnedLayers: PinnedLayerRecommendation[] = [];
    if (K1 >= 50e3) {
      pinnedLayers.push({
        materials: ['FePt', 'MgO'],
        thicknesses: [6, 0.8],
        confidence: 0.92,
        expectedCoercivity: 120,
        thermalStability: 68
      });
      pinnedLayers.push({
        materials: ['FePd', 'MgO', 'CrRu'],
        thicknesses: [5, 1.0, 3],
        confidence: 0.85,
        expectedCoercivity: 105,
        thermalStability: 60
      });
      pinnedLayers.push({
        materials: ['Co/Pt', 'Pt', 'MgO'],
        thicknesses: [4, 2, 0.8],
        confidence: 0.80,
        expectedCoercivity: 90,
        thermalStability: 55
      });
    } else if (K1 >= 20e3) {
      pinnedLayers.push({
        materials: ['CoFeB', 'Ta', 'MgO'],
        thicknesses: [1.2, 0.5, 0.8],
        confidence: 0.90,
        expectedCoercivity: 55,
        thermalStability: 45
      });
      pinnedLayers.push({
        materials: ['CoFeB', 'W', 'MgO'],
        thicknesses: [1.0, 0.4, 0.9],
        confidence: 0.82,
        expectedCoercivity: 50,
        thermalStability: 42
      });
      pinnedLayers.push({
        materials: ['CoFeB', 'Hf', 'MgO'],
        thicknesses: [1.1, 0.3, 1.0],
        confidence: 0.78,
        expectedCoercivity: 48,
        thermalStability: 40
      });
    } else {
      pinnedLayers.push({
        materials: ['Permalloy', 'Ru'],
        thicknesses: [8, 2],
        confidence: 0.88,
        expectedCoercivity: 10,
        thermalStability: 25
      });
      pinnedLayers.push({
        materials: ['NiFe', 'Cu', 'NiFe'],
        thicknesses: [6, 3, 6],
        confidence: 0.80,
        expectedCoercivity: 8,
        thermalStability: 22
      });
      pinnedLayers.push({
        materials: ['Permalloy', 'Ta', 'MgO'],
        thicknesses: [7, 0.5, 0.8],
        confidence: 0.75,
        expectedCoercivity: 12,
        thermalStability: 28
      });
    }

    res.json({
      success: true,
      data: { writeCurrent, pinnedLayers }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
