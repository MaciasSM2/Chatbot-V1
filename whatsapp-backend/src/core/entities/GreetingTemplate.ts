export type DayType = 
  | 'WEEKDAY' 
  | 'WEEKEND' 
  | 'SATURDAY_WORKABLE' 
  | 'SUNDAY_WORKABLE' 
  | 'HOLIDAY_WORKABLE' 
  | 'HOLIDAY_NON_WORKABLE';

export type TimePeriod = 'MORNING' | 'AFTERNOON' | 'NIGHT';

export type GreetingCategory = 'INITIATION' | 'RESPONSE' | 'CONTINUITY';

export class GreetingTemplate {
  constructor(
    public readonly id: string,
    public readonly dayType: DayType,
    public readonly timePeriod: TimePeriod,
    public readonly text: string, // Contiene placeholders como {{name}}
    public readonly category: GreetingCategory = 'RESPONSE'
  ) {}
}

