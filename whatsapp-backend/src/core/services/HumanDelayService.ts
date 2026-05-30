export class HumanDelayService {
  public async execute(minSeconds: number = 3, maxSeconds: number = 5): Promise<void> {
    if (process.env.NODE_ENV === "test") {
      return; // Omitir retrasos de simulación en pruebas para agilizar los tests
    }
    const minMs = minSeconds * 1000;
    const maxMs = maxSeconds * 1000;
    const randomDelay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    
    return new Promise((resolve) => setTimeout(resolve, randomDelay));
  }
}
