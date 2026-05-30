export interface IBotStrategy {
  execute(userId: string, messageBody: string): Promise<{ nextStep: string; responseMessage: string }>;
}
