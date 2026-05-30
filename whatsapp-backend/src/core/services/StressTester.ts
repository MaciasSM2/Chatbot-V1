/**
 * @file StressTester.ts
 * @description Simula múltiples usuarios interactuando en milisegundos de diferencia.
 */

export const STRESS_SCENARIOS = [
  { id: 'user_1', name: 'Andrés (Happy Path)', script: ['Hola', 'Pagar', 'Cédula 123', 'Gracias'] },
  { id: 'user_2', name: 'Marta (Interrupciones)', script: ['Hola', '¿Cuánto cuesta?', '¡No espera!', 'Menú'] },
  { id: 'user_3', name: 'Luis (Ambigüedad)', script: ['Hla', 'Pagaar', 'Quiro ayuda', 'Grax'] },
  { id: 'user_4', name: 'Sofía (Silencio)', script: ['Hola', '...', 'ayuda'] },
  { id: 'user_5', name: 'Carlos (Spam)', script: ['Hola', 'Hola', 'Hola', 'Hola'] }
];

export class ConcurrencyTester {
  constructor(private onMessage: (userId: string, text: string) => Promise<void>) {}

  public async runBatch() {
    console.log("🚀 Iniciando Batería de Pruebas de Concurrencia...");
    
    // Lanzamos todas las promesas en paralelo
    const testPromises = STRESS_SCENARIOS.map(async (user) => {
      for (const text of user.script) {
        // Delay aleatorio entre mensajes de 1 a 4 segundos para simular realidad
        await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 1000));
        
        console.log(`[TEST] 👤 ${user.name} envía: "${text}"`);
        await this.onMessage(user.id, text);
      }
    });

    await Promise.all(testPromises);
    console.log("✅ Prueba de estrés finalizada. Revisa los logs de colisiones.");
  }
}
