import { Router } from 'express';
import { BrandController } from '../controllers/BrandController';
import path from 'path';
import fs from 'fs';
import { dbPool } from '../../../infrastructure/database/MySQLConnection';
import { validateSchema } from '../middlewares/SchemaValidator';
import { updateBrandSchema } from '../schemas/BrandConfigSchema';

export class BrandRouter {
  private readonly router: Router;

  constructor(private readonly controller: BrandController) {
    this.router = Router();
    this.exposeRoutes();
  }

  private exposeRoutes(): void {
    // Endpoints bindeados explícitamente para preservar el contexto de ejecución de las clases (OOP)
    this.router.get('/settings/brand', (req, res) => this.controller.getBrandSettings(req, res));
    this.router.put('/settings/brand', validateSchema(updateBrandSchema), (req, res) => this.controller.updateBrandSettings(req, res));

    /**
     * GET /api/crm/download-rut/:phone
     * Descarga segura de archivos blindando el directorio raíz
     */
    this.router.get('/crm/download-rut/:phone', async (req, res) => {
      const { phone } = req.params;

      try {
        // 1. Validar la existencia del archivo en la base de datos de manera relacional
        const [rows]: any = await dbPool.query(
          'SELECT rut_file_path, full_name FROM clients WHERE phone_number = ?', 
          [phone]
        );

        if (rows.length === 0 || !rows[0].rut_file_path) {
          return res.status(404).json({ success: false, error: 'El cliente no posee un documento RUT cargado en el sistema.' });
        }

        // 2. Construir la ruta absoluta blindando el sistema de archivos
        const relativePath = rows[0].rut_file_path;
        const absolutePath = path.resolve(__dirname, '../../../../', relativePath.replace(/^\//, ''));

        // 3. Verificar existencia física del archivo binario en disco
        if (!fs.existsSync(absolutePath)) {
          return res.status(404).json({ success: false, error: 'Archivo no encontrado en el volumen de almacenamiento físico.' });
        }

        // 4. Forzar descarga segura con nombre de cliente sanitizado
        const cleanName = (rows[0].full_name || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=RUT_${cleanName}.pdf`);
        
        return res.sendFile(absolutePath);

      } catch (error) {
        console.error('Error en descarga de documento:', error);
        return res.status(500).json({ success: false, error: 'Fallo interno en el servidor de archivos.' });
      }
    });
  }

  public getRouter(): Router {
    return this.router;
  }
}

