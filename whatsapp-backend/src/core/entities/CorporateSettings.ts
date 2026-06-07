export class CorporateSettings {
  constructor(
    public readonly id: string,
    public readonly companyName: string,
    public readonly companySlogan: string,
    public readonly institutionalLanguage: string,
    public readonly companyLogoUrl: string
  ) {}
}
