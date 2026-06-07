/**
 * @file SimilarityService.ts
 * @description Calcula la cercanía entre textos para corregir errores del usuario.
 */

export const getLevenshteinDistance = (a: string, b: string): number => {
  const tmp: number[][] = [];
  for (let i = 0; i <= a.length; i++) tmp[i] = [i];
  for (let j = 0; j <= b.length; j++) tmp[0]![j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i]![j] = Math.min(
        tmp[i - 1]![j]! + 1,
        tmp[i]![j - 1]! + 1,
        tmp[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length]![b.length]!;
};

export interface MatchResult {
  option: string;
  distance: number;
}

export const findBestMatch = (input: string, options: string[]): MatchResult => {
  if (options.length === 0) {
    return { option: "", distance: 99 };
  }
  const matches = options.map(opt => ({
    option: opt,
    distance: getLevenshteinDistance(input.toLowerCase().trim(), opt.toLowerCase().trim())
  }));
  
  return matches.sort((a, b) => a.distance - b.distance)[0]!;
};

/**
 * Clase inyectable que encapsula los algoritmos de similitud para uso en el patrón Strategy (SOLID - D).
 */
export class SimilarityService {
  /**
   * Calcula la distancia de Levenshtein entre dos cadenas de texto.
   * @returns Número de ediciones mínimas. Valor bajo = alta similitud.
   */
  public calculateDistance(a: string, b: string): number {
    return getLevenshteinDistance(a.toLowerCase().trim(), b.toLowerCase().trim());
  }

  /**
   * Busca la opción más cercana en un conjunto de candidatos.
   */
  public findBestMatch(input: string, options: string[]): MatchResult {
    return findBestMatch(input, options);
  }
}

