/**
 * @file JsonFileStorageAdapter.ts
 * @description Adaptador de almacenamiento plano en archivo JSON (Patrón Repository).
 * Previene la pérdida de datos cuando la aplicación opera en MODO DEMO / IN-MEMORIA sin MariaDB.
 */

import fs from 'fs';
import path from 'path';

export class JsonFileStorageAdapter<T extends { id: string }> {
  private readonly filePath: string;

  constructor(filename: string) {
    this.filePath = path.join(process.cwd(), 'storage', `${filename}.json`);
    this.ensureFileExists();
  }

  public async save(data: T): Promise<void> {
    const records = await this.readAll();
    const index = records.findIndex((r) => r.id === data.id);

    if (index >= 0) {
      records[index] = data;
    } else {
      records.push(data);
    }

    await fs.promises.writeFile(this.filePath, JSON.stringify(records, null, 2), 'utf-8');
  }

  public async findById(id: string): Promise<T | null> {
    const records = await this.readAll();
    return records.find((r) => r.id === id) ?? null;
  }

  public async readAll(): Promise<T[]> {
    try {
      const raw = await fs.promises.readFile(this.filePath, 'utf-8');
      return JSON.parse(raw) as T[];
    } catch {
      return [];
    }
  }

  private ensureFileExists(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, '[]', 'utf-8');
    }
  }
}
