/**
 * @file ChatExecutionController.ts
 * @description Controlador HTTP para manejar ejecuciones individuales o simultáneas según el perfil.
 */

import { Request, Response } from 'express';
import { SimultaneousChatOrchestrator } from '../../../core/services/SimultaneousChatOrchestrator';
import { RbacPolicyService } from '../../../core/services/RbacPolicyService';
import { IUserAuthContext } from '../../../core/domain/entities/UserPermission';

export class ChatExecutionController {
  constructor(
    private readonly orchestrator: SimultaneousChatOrchestrator,
    private readonly policyService: RbacPolicyService
  ) {}

  /**
   * POST /api/v2/chat/execute
   * Procesa la solicitud según el tipo de ejecución autorizada (Simultánea para Developer o Individual).
   */
  public executeChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const userContext = (req as unknown as { user?: IUserAuthContext }).user || {
        userId: 'demo-user',
        tenantId: 'tenant-demo-01',
        email: 'dev@prochat.com',
        role: 'DEVELOPER' as any,
        grantedPermissions: [],
      };

      const { text, targetEngine, isSimultaneousRequest } = req.body;

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        res.status(400).json({ success: false, error: 'El parámetro "text" es obligatorio.' });
        return;
      }

      // 1. Caso 1: Solicitud de Ejecución Simultánea (Exclusivo para DEVELOPER / Permiso Quad-Chat)
      if (isSimultaneousRequest) {
        if (!this.policyService.canExecuteSimultaneousChat(userContext)) {
          res.status(403).json({
            success: false,
            error: 'No tienes permisos para ejecutar la vista comparativa simultánea Quad-Chat.',
          });
          return;
        }

        const simultaneousResult = await this.orchestrator.executeSimultaneousChats(
          userContext.tenantId,
          userContext.userId,
          text.trim()
        );

        res.status(200).json({ success: true, mode: 'SIMULTANEOUS', data: simultaneousResult });
        return;
      }

      // 2. Caso 2: Solicitud de Motor Individual (Validación de Aislamiento de Perfil)
      const engineToRun = targetEngine || this.getEngineByRole(userContext);

      if (!this.policyService.canExecuteEngine(userContext, engineToRun)) {
        res.status(403).json({
          success: false,
          error: `Tu perfil no tiene acceso al motor [${engineToRun}].`,
        });
        return;
      }

      const singleResult = await this.orchestrator.executeSingleEngine(
        userContext.tenantId,
        userContext.userId,
        text.trim(),
        engineToRun
      );

      res.status(200).json({ success: true, mode: 'SINGLE', data: singleResult });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error en ejecución de chat';
      res.status(500).json({ success: false, error: message });
    }
  };

  private getEngineByRole(context: IUserAuthContext): 'FULL_JS' | 'HYBRID' | 'FULL_AI' {
    switch (context.role) {
      case 'USER_FULL_JS':
        return 'FULL_JS';
      case 'USER_HYBRID':
        return 'HYBRID';
      case 'USER_FULL_AI':
        return 'FULL_AI';
      default:
        return 'FULL_JS';
    }
  }
}
