import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { solveLLG } from '../services/llgSolver';
import type { MaterialParams, DeviceGeometry, CalculationConfig } from '../types';

const router = Router();

interface SimulateBody {
  materialParams: MaterialParams;
  geometry: DeviceGeometry;
  config: CalculationConfig;
}

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { materialParams, geometry, config } = req.body as SimulateBody;
    if (!materialParams || !geometry || !config) {
      throw new AppError('缺少必填字段: materialParams, geometry, config', 400);
    }
    const result = await solveLLG(materialParams, geometry, config);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
