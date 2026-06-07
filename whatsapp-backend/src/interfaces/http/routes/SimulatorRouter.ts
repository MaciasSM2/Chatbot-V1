/**
 * @file SimulatorRouter.ts
 * @description Canal de transporte para pruebas locales de la FSM de facturación y auditoría.
 */
import { Router, Request, Response } from 'express';
import { AppContainer } from '../../../infrastructure/containers/AppContainer';
import { dbPool } from '../../../infrastructure/database/MySQLConnection';

export class SimulatorRouter {
  private readonly router: Router = Router();

  constructor(private readonly container: AppContainer, private readonly io: any) {
    this.exposeSimulator();
  }

  private exposeSimulator() {
    this.router.post('/simulator/message', async (req: Request, res: Response) => {
      const { phone, message } = req.body;

      if (!phone || !message) {
        return res.status(400).json({ success: false, error: 'Parámetros inconsistentes.' });
      }

      try {
        const result = await this.container.chatbotOrchestrator.handleMessage({
          clientPhone: phone,
          messageText: message,
          isSimulation: true,
          correlationId: `SIM-ROUTER-${Date.now()}`
        });
        
        // Emitir el mensaje del bot vía socket para actualizar reactivamente la UI del simulador
        if (this.io) {
          this.io.to(phone).emit(`new_message_${phone}`, {
            id: `msg_bot_${Date.now()}`,
            sender: 'bot',
            text: result.responseMessage,
            timestamp: Date.now(),
            status: 'read'
          });
        }

        return res.status(200).json({ success: true, response: result.responseMessage });
      } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
      }
    });

    const { SimulationController } = require('../controllers/SimulationController');
    const simulationController = new SimulationController(this.container.chatbotOrchestrator, this.container.clientRepository);
    this.router.post('/simulator/scenario', simulationController.executeMockScenario);

    // Endpoint para obtener todas las facturas
    this.router.get('/billing/invoices', async (_req: Request, res: Response) => {
      try {
        const [rows]: any = await dbPool.query(
          'SELECT id, client_phone as clientPhone, document_type as documentType, document_number as documentNumber, client_name as clientName, origin, destination, base_cost as baseCost, tax_amount as taxAmount, total_cost as totalCost, created_at as createdAt FROM transport_invoices ORDER BY id DESC'
        );
        return res.status(200).json({ success: true, data: rows });
      } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  public getRouter() { return this.router; }
}
