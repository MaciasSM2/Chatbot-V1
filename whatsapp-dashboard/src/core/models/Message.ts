export interface IMessagePayload {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
}

export interface IUiMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: string;
}
