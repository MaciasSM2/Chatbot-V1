/**
 * @file HumanDelayService.ts
 * @description Servicio de latencia sintética optimizado para respuestas ultrarrápidas (<100ms).
 */
export class HumanDelayService {
  public async execute(minSeconds: number = 0.05, maxSeconds: number = 0.2): Promise<void> {
    if (process.env.NODE_ENV === "test") {
      return; // Omitir retrasos en pruebas unitarias
    }
    const minMs = minSeconds * 1000;
    const maxMs = maxSeconds * 1000;
    const randomDelay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    
    return new Promise((resolve) => setTimeout(resolve, randomDelay));
  }
}
