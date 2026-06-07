import { CorporateSettings } from '../../entities/CorporateSettings';

export interface ICorporateSettingsRepository {
  getSettings(): Promise<CorporateSettings>;
  updateSettings(settings: CorporateSettings): Promise<void>;
}
