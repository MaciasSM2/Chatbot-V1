export type DayType = 
  | 'WEEKDAY' 
  | 'WEEKEND' 
  | 'SATURDAY_WORKABLE' 
  | 'SUNDAY_WORKABLE' 
  | 'HOLIDAY_WORKABLE' 
  | 'HOLIDAY_NON_WORKABLE';

export type TimePeriod = 'MORNING' | 'AFTERNOON' | 'NIGHT';

export type GreetingCategory = 'INITIATION' | 'RESPONSE' | 'CONTINUITY';

export interface IGreeting {
  id: string;
  dayType: DayType;
  timePeriod: TimePeriod;
  text: string;
  category?: GreetingCategory;
}
