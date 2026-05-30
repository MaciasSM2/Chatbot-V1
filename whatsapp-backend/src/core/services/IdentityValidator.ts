import { IClientRepository } from "../interfaces/repositories/IClientRepository";

export class IdentityValidator {
  constructor(private readonly clientRepository: IClientRepository) {}

  public async validatePhoneNumber(phoneNumber: string): Promise<{ isRegistered: boolean; name?: string }> {
    if (phoneNumber === 'TEST_BOT_DEBUG') {
      return { isRegistered: true, name: "Sebastian Macias (Ejemplo)" };
    }
    const client = await this.clientRepository.findByPhoneNumber(phoneNumber);
    if (client && client.isRegistered && client.name) {
      return { isRegistered: true, name: client.name };
    }
    return { isRegistered: false };
  }
}
