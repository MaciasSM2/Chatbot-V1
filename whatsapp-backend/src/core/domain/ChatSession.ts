/**
 * @file ChatSession.ts
 * @description Entidad de dominio pura que representa el estado en tiempo real 
 * de una conversación en la tubería de WhatsApp.
 */

export interface IChatSessionProps {
  phoneNumber: string;
  clientName: string | null;
  currentFsmState: string;
  isRegisteredUser: boolean;
  lastMessageTimestamp: number;
}

export class ChatSession {
  private props: IChatSessionProps;

  constructor(props: IChatSessionProps) {
    this.props = props;
  }

  // --- Getters y Setters Encapsulados ---
  public get phoneNumber(): string { return this.props.phoneNumber; }
  public get clientName(): string | null { return this.props.clientName; }
  public get currentFsmState(): string { return this.props.currentFsmState; }
  public get isRegisteredUser(): boolean { return this.props.isRegisteredUser; }
  public get lastMessageTimestamp(): number { return this.props.lastMessageTimestamp; }

  /**
   * Transiciona el estado de la conversación dentro de la máquina de estados.
   */
  public transitionToState(nextState: string): void {
    this.props.currentFsmState = nextState;
    this.props.lastMessageTimestamp = Date.now();
  }

  /**
   * Asigna el nombre verificado del cliente una vez capturado por el bot.
   */
  public registerClientName(name: string): void {
    this.props.clientName = name;
    this.props.isRegisteredUser = true;
    this.props.lastMessageTimestamp = Date.now();
  }

  /**
   * Convierte la entidad de dominio a un objeto plano estructurado para su transporte.
   */
  public toPrimitives(): IChatSessionProps {
    return { ...this.props };
  }
}
