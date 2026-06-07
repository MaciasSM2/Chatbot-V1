/**
 * @file CliTaskRunner.ts
 * @description Punto de entrada unificado para la ejecución de comandos del sistema desde la terminal.
 */
import { UpdateMetadataTask } from './UpdateMetadataTask';

class CliTaskRunner {
  private readonly tasksRegistry: Map<string, any> = new Map();

  constructor() {
    // Registrar polimórficamente los comandos permitidos en el sistema
    this.tasksRegistry.set('sync-metadata', new UpdateMetadataTask());
  }

  public async run(): Promise<void> {
    const taskArgument = process.argv[2];

    if (!taskArgument || !this.tasksRegistry.has(taskArgument)) {
      console.log('🚨 Comando no reconocido. Tareas disponibles:');
      console.log('   -> sync-metadata : Normaliza metadatos JSON de los prospectos en MariaDB.');
      process.exit(1);
    }

    const commandToRun = this.tasksRegistry.get(taskArgument);
    try {
      await commandToRun.execute();
      process.exit(0);
    } catch (err) {
      process.exit(1);
    }
  }
}

// Inicializar y disparar el ejecutor de consola
const runner = new CliTaskRunner();
runner.run();
