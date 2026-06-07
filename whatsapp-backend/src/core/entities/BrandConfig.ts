export class BrandConfig {
  constructor(
    public readonly id: string,
    public readonly companyName: string,
    public readonly companySlogan: string,
    public readonly institutionalLanguage: string,
    public readonly companyLogoUrl: string,
    public readonly startWorkHour: string = '08:00',
    public readonly endWorkHour: string = '18:00',
    public readonly operationMode: number = 1,
    public readonly themeAccent: string = 'WHATSAPP_GREEN'
  ) {}
}
