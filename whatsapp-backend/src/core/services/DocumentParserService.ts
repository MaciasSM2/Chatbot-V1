const pdfParse = require('pdf-parse');
import Papa from 'papaparse';
import * as xlsx from 'xlsx';

export interface ParsedRule {
  trigger_keyword: string;
  respuesta_texto: string;
  nodo_siguiente?: string | undefined;
  es_fallback?: boolean | undefined;
}

export interface DocumentParseResult {
  contenido_texto: string;
  estructura_json: Record<string, any>;
  reglas_sugeridas: ParsedRule[];
}

export class DocumentParserService {
  /**
   * Procesa un buffer de archivo (PDF, TXT, JSON, CSV, Excel) y devuelve texto plano y reglas FSM sugeridas.
   */
  public async parseDocument(buffer: Buffer, fileType: string, fileName: string): Promise<DocumentParseResult> {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    if (fileType.includes('pdf') || ext === 'pdf') {
      return this.parsePdf(buffer);
    } else if (fileType.includes('json') || ext === 'json') {
      return this.parseJson(buffer);
    } else if (fileType.includes('csv') || ext === 'csv') {
      return this.parseCsv(buffer.toString('utf-8'));
    } else if (fileType.includes('spreadsheet') || ext === 'xlsx' || ext === 'xls') {
      return this.parseExcel(buffer);
    } else {
      // Por defecto TXT / texto plano
      return this.parseTxt(buffer.toString('utf-8'));
    }
  }

  private async parsePdf(buffer: Buffer): Promise<DocumentParseResult> {
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text || '';
    const rules = this.extractRulesFromText(text);

    return {
      contenido_texto: text,
      estructura_json: { pages: pdfData.numpages, info: pdfData.info },
      reglas_sugeridas: rules
    };
  }

  private parseTxt(text: string): DocumentParseResult {
    const rules = this.extractRulesFromText(text);
    return {
      contenido_texto: text,
      estructura_json: { lineCount: text.split('\n').length },
      reglas_sugeridas: rules
    };
  }

  private parseJson(buffer: Buffer): DocumentParseResult {
    const raw = buffer.toString('utf-8');
    let parsed: any = {};
    const rules: ParsedRule[] = [];

    try {
      parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach(item => {
          if (item.keyword && item.response) {
            rules.push({
              trigger_keyword: String(item.keyword).toLowerCase().trim(),
              respuesta_texto: String(item.response),
              nodo_siguiente: item.next_node ? String(item.next_node) : undefined
            });
          }
        });
      }
    } catch {
      parsed = { raw };
    }

    return {
      contenido_texto: typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2),
      estructura_json: parsed,
      reglas_sugeridas: rules.length > 0 ? rules : this.extractRulesFromText(raw)
    };
  }

  private parseCsv(csvText: string): DocumentParseResult {
    const parsed = Papa.parse<Record<string, string>>(csvText, { header: true });
    const rules: ParsedRule[] = [];

    if (parsed.data && Array.isArray(parsed.data)) {
      parsed.data.forEach(row => {
        const keyword = row['keyword'] || row['pregunta'] || row['palabra_clave'] || row['trigger'];
        const response = row['respuesta'] || row['response'] || row['texto'];
        if (keyword && response) {
          rules.push({
            trigger_keyword: keyword.toLowerCase().trim(),
            respuesta_texto: response,
            nodo_siguiente: row['nodo_siguiente'] ? row['nodo_siguiente'] : undefined
          });
        }
      });
    }

    return {
      contenido_texto: csvText,
      estructura_json: { rows: parsed.data.length },
      reglas_sugeridas: rules
    };
  }

  private parseExcel(buffer: Buffer): DocumentParseResult {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0] || 'Sheet1';
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = worksheet ? xlsx.utils.sheet_to_json<Record<string, any>>(worksheet) : [];
    const rules: ParsedRule[] = [];

    jsonData.forEach(row => {
      const keyword = row['keyword'] || row['pregunta'] || row['palabra_clave'] || row['trigger'];
      const response = row['respuesta'] || row['response'] || row['texto'];
      if (keyword && response) {
        rules.push({
          trigger_keyword: String(keyword).toLowerCase().trim(),
          respuesta_texto: String(response),
          nodo_siguiente: row['nodo_siguiente'] ? String(row['nodo_siguiente']) : undefined
        });
      }
    });

    const fullText = jsonData.map(r => JSON.stringify(r)).join('\n');

    return {
      contenido_texto: fullText,
      estructura_json: { totalRows: jsonData.length },
      reglas_sugeridas: rules
    };
  }

  private extractRulesFromText(text: string): ParsedRule[] {
    const lines = text.split(/\r?\n/);
    const rules: ParsedRule[] = [];

    lines.forEach(line => {
      if (line.includes(':') || line.includes('->') || line.includes('=')) {
        const parts = line.split(/[:=]|->/);
        const firstPart = parts[0];
        if (parts.length >= 2 && firstPart) {
          const key = firstPart.trim().toLowerCase();
          const val = parts.slice(1).join(':').trim();
          if (key.length > 2 && val.length > 3) {
            rules.push({ trigger_keyword: key, respuesta_texto: val });
          }
        }
      }
    });


    return rules;
  }

}
