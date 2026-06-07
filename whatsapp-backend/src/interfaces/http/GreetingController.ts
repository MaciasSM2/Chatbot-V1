import { Request, Response } from "express";
import { IGreetingRepository } from "../../core/interfaces/repositories/IGreetingRepository";
import { GreetingTemplate, DayType, TimePeriod, GreetingCategory } from "../../core/entities/GreetingTemplate";
import logger from "../../infrastructure/logging/Logger";

export class GreetingController {
  constructor(private readonly greetingRepository: IGreetingRepository) {}

  public async listTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { day, time, category } = req.query;
      const validDays = ['WEEKDAY', 'WEEKEND', 'SATURDAY_WORKABLE', 'SUNDAY_WORKABLE', 'HOLIDAY_WORKABLE', 'HOLIDAY_NON_WORKABLE'];
      const validTimes = ['MORNING', 'AFTERNOON', 'NIGHT', 'EARLY_MORNING'];
      const validCategories = ['INITIATION', 'RESPONSE', 'CONTINUITY'];

      if (day && time) {
        const isValidDay = validDays.includes(day as string);
        const isValidTime = validTimes.includes(time as string);
        const isValidCategory = category ? validCategories.includes(category as string) : true;

        if (!isValidDay || !isValidTime || !isValidCategory) {
          res.status(400).json({ error: "Parámetros de consulta inválidos" });
          return;
        }

        const templates = await this.greetingRepository.getTemplates(
          day as DayType,
          time as TimePeriod,
          category as GreetingCategory
        );
        res.status(200).json(templates);
      } else {
        const templates = await this.greetingRepository.getAll();
        if (category) {
          const isValidCategory = validCategories.includes(category as string);
          if (!isValidCategory) {
            res.status(400).json({ error: "Categoría de consulta inválida" });
            return;
          }
          const filtered = templates.filter(t => t.category === category);
          res.status(200).json(filtered);
        } else {
          res.status(200).json(templates);
        }
      }
    } catch (error) {
      logger.error("Error listando templates", { error });
      res.status(500).send("Error interno");
    }
  }

  public async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id, dayType, timePeriod, text, category } = req.body;

      if (!dayType || !timePeriod || !text) {
        res.status(400).json({ error: "Faltan campos requeridos: dayType, timePeriod, text" });
        return;
      }

      const validDays = ['WEEKDAY', 'WEEKEND', 'SATURDAY_WORKABLE', 'SUNDAY_WORKABLE', 'HOLIDAY_WORKABLE', 'HOLIDAY_NON_WORKABLE'];
      const validTimes = ['MORNING', 'AFTERNOON', 'NIGHT', 'EARLY_MORNING'];
      const validCategories = ['INITIATION', 'RESPONSE', 'CONTINUITY'];

      // Validación de tipos literales
      const isValidDay = validDays.includes(dayType);
      const isValidTime = validTimes.includes(timePeriod);
      const isValidCategory = category ? validCategories.includes(category) : true;

      if (!isValidDay || !isValidTime || !isValidCategory) {
        res.status(400).json({ error: "Valores de dayType, timePeriod o category inválidos" });
        return;
      }

      const template = new GreetingTemplate(id || `greet-${Date.now()}`, dayType, timePeriod, text, category || 'RESPONSE');
      await this.greetingRepository.save(template);

      logger.info("Template creado", { id });
      res.status(201).json(template);
    } catch (error) {
      logger.error("Error creando template", { error });
      res.status(500).send("Error interno");
    }
  }

  public async updateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (typeof id !== "string") {
        res.status(400).json({ error: "Falta el ID del saludo" });
        return;
      }
      const { dayType, timePeriod, text, category } = req.body;

      if (!dayType || !timePeriod || !text) {
        res.status(400).json({ error: "Faltan campos para actualización" });
        return;
      }

      const validDays = ['WEEKDAY', 'WEEKEND', 'SATURDAY_WORKABLE', 'SUNDAY_WORKABLE', 'HOLIDAY_WORKABLE', 'HOLIDAY_NON_WORKABLE'];
      const validTimes = ['MORNING', 'AFTERNOON', 'NIGHT', 'EARLY_MORNING'];
      const validCategories = ['INITIATION', 'RESPONSE', 'CONTINUITY'];

      // Validación de tipos literales
      const isValidDay = validDays.includes(dayType);
      const isValidTime = validTimes.includes(timePeriod);
      const isValidCategory = category ? validCategories.includes(category) : true;

      if (!isValidDay || !isValidTime || !isValidCategory) {
        res.status(400).json({ error: "Valores de dayType, timePeriod o category inválidos" });
        return;
      }

      const template = new GreetingTemplate(id, dayType, timePeriod, text, category || 'RESPONSE');
      await this.greetingRepository.save(template);

      logger.info("Template actualizado", { id });
      res.status(200).json(template);
    } catch (error) {
      logger.error("Error actualizando template", { error });
      res.status(500).send("Error interno");
    }
  }

  public async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (typeof id !== "string") {
        res.status(400).json({ error: "Falta el ID del saludo" });
        return;
      }
      await this.greetingRepository.delete(id);

      logger.info("Template eliminado", { id });
      res.status(204).send();
    } catch (error) {
      logger.error("Error eliminando template", { error });
      res.status(500).send("Error interno");
    }
  }
}
