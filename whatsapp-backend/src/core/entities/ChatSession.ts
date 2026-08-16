export interface IMessageLog {
  sender: 'bot' | 'user' | 'system';
  text: string;
  timestamp: number;
}

export interface UserState {
  userId: string;
  currentStep: string;
  updatedAt: Date;
  isPaused?: boolean;
  messageHistory?: IMessageLog[];
  metadata?: Record<string, any>;
}

export class ChatSession {
  private props: UserState;
  private readonly MAX_HISTORY = 10;

  constructor(props: UserState) {
    this.props = {
      ...props,
      updatedAt: props.updatedAt || new Date(),
      isPaused: props.isPaused || false,
      messageHistory: props.messageHistory || [],
      metadata: props.metadata || {}
    };
  }

  public get userId(): string {
    return this.props.userId;
  }

  public get currentStep(): string {
    return this.props.currentStep;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public get isPaused(): boolean {
    return this.props.isPaused || false;
  }

  public transitionTo(nextStep: string): void {
    this.props.currentStep = nextStep;
    this.props.updatedAt = new Date();
  }

  public pauseBot(): void {
    this.props.isPaused = true;
    this.props.updatedAt = new Date();
  }

  public resumeBot(): void {
    this.props.isPaused = false;
    this.props.updatedAt = new Date();
  }

  public addMessageToHistory(sender: 'bot' | 'user', text: string): void {
    if (!this.props.messageHistory) {
      this.props.messageHistory = [];
    }
    this.props.messageHistory.push({
      sender,
      text,
      timestamp: Date.now()
    });

    if (this.props.messageHistory.length > this.MAX_HISTORY) {
      this.props.messageHistory.shift();
    }
    this.props.updatedAt = new Date();
  }

  public get history(): IMessageLog[] {
    return this.props.messageHistory || [];
  }

  public get metadata(): Record<string, any> {
    return this.props.metadata || {};
  }

  public updateMetadata(data: Record<string, any>): void {
    this.props.metadata = {
      ...(this.props.metadata || {}),
      ...data
    };
    this.props.updatedAt = new Date();
  }
}
