/**
 * @file AnalyticsController.ts
 * @description Controlador encargado de exponer las métricas transformadas con sintaxis pura de MariaDB.
 */
import { Request, Response } from 'express';
import { StatsService } from '../../../core/services/StatsService';
import { ApiResponse } from '../types/ApiResponse';

interface DashboardMetricsData {
  volume: any;
  funnel: any;
}

export class AnalyticsController {
  constructor(private readonly statsService: StatsService) {}

  /**
   * GET /api/analytics/traffic
   * Provee los set de datos agregados para alimentar las gráficas de Recharts en el inicio.
   */
  public async getDashboardMetrics(_req: Request, res: Response): Promise<void> {
    try {
      const volume = await this.statsService.getDailyMessageVolume();
      const funnel = await this.statsService.getFsmFunnelStats();

      res.status(200).json({
        success: true,
        data: { volume, funnel }
      } as ApiResponse<DashboardMetricsData>);
    } catch (error: any) {
      console.error(`❌ [AnalyticsController] Fallo relacional: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        error: 'Error de sintaxis interna al compilar estadísticas desde MariaDB.' 
      } as ApiResponse);
    }
  }

  /**
   * GET /api/analytics/summary
   * Retorna las métricas del tablero analítico para el inicio del operador.
   */
  public async getSummaryStats(_req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.statsService.getSummaryStats();
      res.status(200).json({ success: true, metrics });
    } catch (error: any) {
      console.error(`❌ [AnalyticsController] Fallo en summary: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        error: 'Error de sintaxis interna al compilar resumen analítico.' 
      } as ApiResponse);
    }
  }
}
