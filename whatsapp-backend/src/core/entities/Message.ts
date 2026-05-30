export class Message {
  public status: string;
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly sender: 'user' | 'bot' | 'system',
    public readonly text: string,
    status: string = 'sent',
    public readonly timestamp: Date = new Date()
  ) {
    this.status = status;
  }

  public updateStatus(newStatus: string): void {
    this.status = newStatus;
  }
}
