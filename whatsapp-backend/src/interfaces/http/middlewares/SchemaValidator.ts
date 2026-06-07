/**
 * @file SchemaValidator.ts
 */
import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodType } from 'zod';

export const validateSchema = (schema: ZodType<any, any, any>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validar de forma asíncrona cookies, queries, params y body de forma simultánea
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Reducir el árbol de errores de Zod a un formato JSON plano y estructurado
        const cleanErrors = error.issues.map((err) => ({
          field: err.path.join('.').replace('body.', ''),
          message: err.message,
        }));

        res.status(422).json({
          success: false,
          error: 'Fallo en la validación del contrato de datos.',
          details: cleanErrors,
        });
        return;
      }
      return next(error);
    }
  };
};
