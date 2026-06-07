import { Router, Request, Response, NextFunction } from 'express';
import PDFDocument from 'pdfkit';
import { db } from '../db/inMemoryDB';
import { AppError } from '../middleware/errorHandler';
import type { ReportData, SimulationResults, SimulationTask } from '../types';

const router = Router();

interface GenerateReportBody {
  taskId: string;
}

function buildReportData(task: SimulationTask): ReportData {
  const results: SimulationResults = task.results ?? {
    hysteresisLoop: { field: [], magnetization: [], coercivity: 0, remanence: 0 },
    domainStructure: { positions: [], magnetizationVectors: [], timestamps: [] },
    flipTimeDistribution: { positions: [], flipTimes: [] },
    energyEvolution: { time: [], exchangeEnergy: [], demagnetizationEnergy: [], zeemanEnergy: [], totalEnergy: [] },
    vortexStates: [],
    averageFlipTime: 0
  };

  const energyCloud = {
    positions: results.flipTimeDistribution.positions,
    energyDensity: results.energyEvolution.totalEnergy.slice(-results.flipTimeDistribution.positions.length)
  };

  return {
    hysteresisLoop: results.hysteresisLoop,
    domainStructure: results.domainStructure,
    flipTimeDistribution: results.flipTimeDistribution,
    energyCloud
  };
}

function generatePDF(task: SimulationTask, report: ReportData): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer.toString('base64'));
      });
      doc.on('error', reject);

      const dateStr = new Date().toLocaleDateString('zh-CN', {
        year: 'numeric', month: 'long', day: 'numeric'
      });

      doc.fontSize(24).font('Helvetica-Bold').text('Micromagnetics Simulation Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').fillColor('#666666');
      doc.text(`微磁学模拟完整报告 | Task: ${task.name}`, { align: 'center' });
      doc.text(`Date: ${dateStr}`, { align: 'center' });
      doc.moveDown(1);
      doc.strokeColor('#3B82F6').lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1.5);

      doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('参数摘要');
      doc.fontSize(10).font('Helvetica').fillColor('#333333');
      const mp = task.materialParams;
      doc.text(`材料: ${mp.materialType} | Ms: ${(mp.saturationMagnetization / 1e3).toFixed(0)} kA/m`);
      doc.text(`各向异性常数 K1: ${(mp.anisotropyConstant / 1e3).toFixed(0)} kJ/m³ | 阻尼 α: ${mp.dampingCoefficient}`);
      doc.text(`温度: ${mp.temperature} K | 尺寸: ${task.geometry.length}×${task.geometry.width}×${task.geometry.thickness} nm`);
      doc.text(`形状: ${task.geometry.shape} | 网格: ${task.geometry.meshSize} nm`);
      doc.moveDown(1);

      doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('磁滞回线 (Hysteresis Loop)');
      doc.fontSize(10).font('Helvetica').fillColor('#333333');
      doc.text(`数据点数: ${report.hysteresisLoop.field.length}`);
      doc.text(`矫顽力 (Coercivity): ${report.hysteresisLoop.coercivity.toFixed(2)} Oe`);
      doc.text(`剩磁 (Remanence): ${report.hysteresisLoop.remanence.toFixed(4)} (归一化)`);
      doc.moveDown(0.8);

      doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('磁畴结构 (Domain Structure)');
      doc.fontSize(10).font('Helvetica').fillColor('#333333');
      doc.text(`快照时间步: ${report.domainStructure.timestamps.map((t) => t.toFixed(2) + 'ns').join(', ')}`);
      doc.text(`采样位置数: ${report.domainStructure.positions.length}`);
      doc.moveDown(0.8);

      doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('翻转时间分布 (Flip Time Distribution)');
      doc.fontSize(10).font('Helvetica').fillColor('#333333');
      const avgFt = report.flipTimeDistribution.flipTimes.length > 0
        ? report.flipTimeDistribution.flipTimes.reduce((a, b) => a + b, 0) / report.flipTimeDistribution.flipTimes.length
        : 0;
      doc.text(`统计网格点数: ${report.flipTimeDistribution.flipTimes.length}`);
      doc.text(`平均翻转时间: ${avgFt.toFixed(3)} ns`);
      doc.moveDown(0.8);

      doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('能量云图 (Energy Cloud)');
      doc.fontSize(10).font('Helvetica').fillColor('#333333');
      doc.text(`能量密度采样点: ${report.energyCloud.energyDensity.length}`);
      doc.moveDown(1);

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000').text('关键指标文字总结');
      doc.fontSize(10).font('Helvetica').fillColor('#333333');
      doc.text(`• 矫顽力 (Coercivity): ${report.hysteresisLoop.coercivity.toFixed(2)} Oe，` +
        (report.hysteresisLoop.coercivity > 100 ? '属于高矫顽力材料' : '属于中低矫顽力材料'));
      doc.text(`• 剩磁 (Remanence): ${(report.hysteresisLoop.remanence * 100).toFixed(1)}% 饱和值`);
      doc.text(`• 平均翻转时间: ${avgFt.toFixed(3)} ns`);
      doc.moveDown(1.5);

      doc.fontSize(9).fillColor('#999999').text(
        'Generated by Micromagnetics Simulation Platform',
        50, 800, { align: 'center', width: 495 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.body as GenerateReportBody;
    if (!taskId) {
      throw new AppError('缺少必填字段: taskId', 400);
    }
    const task = db.getTaskById(taskId);
    if (!task) {
      throw new AppError('任务不存在', 404);
    }
    const reportData = buildReportData(task);
    const pdfBase64 = await generatePDF(task, reportData);
    res.json({ success: true, data: { reportData, pdfBase64 } });
  } catch (err) {
    next(err);
  }
});

export default router;
