import { DayType, TimePeriod, GreetingTemplate, GreetingCategory } from "../../entities/GreetingTemplate";

export interface IGreetingRepository {
  getTemplates(dayType: DayType, timePeriod: TimePeriod, category?: GreetingCategory): Promise<GreetingTemplate[]>;
  save(template: GreetingTemplate): Promise<void>;
  getAll(): Promise<GreetingTemplate[]>;
  delete(id: string): Promise<void>;
}

