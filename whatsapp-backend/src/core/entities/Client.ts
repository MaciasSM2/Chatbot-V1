export class Client {
  constructor(
    public readonly id: string,
    public readonly phoneNumber: string,
    public readonly name: string | null,
    public readonly isRegistered: boolean,
    public readonly metadata: Record<string, any> = {}
  ) {}
}
