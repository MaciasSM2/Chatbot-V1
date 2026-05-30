/**
 * @file AmbiguityResolver.ts
 * @description Módulo de resolución de ambigüedad semántica y sugerencias inteligentes.
 */

import { findBestMatch, MatchResult } from "./SimilarityService";

export interface ResolutionResult {
  type: 'EXECUTE' | 'SUGGEST' | 'FAILSAFE';
  target: string;
  text?: string;
  match: MatchResult;
}

export const resolveAmbiguity = (userInput: string, currentOptions: string[]): ResolutionResult => {
  const bestMatch = findBestMatch(userInput, currentOptions);

  // 1. Coincidencia Exacta o muy cercana (Distancia 0 o 1)
  if (bestMatch.distance <= 1) {
    return { type: 'EXECUTE', target: bestMatch.option, match: bestMatch };
  }

  // 2. Coincidencia Probable (Distancia 2 o 3) -> Sugerir
  if (bestMatch.distance <= 3) {
    return { 
      type: 'SUGGEST', 
      target: bestMatch.option,
      text: `No estoy seguro, pero ¿quisiste decir *${bestMatch.option}*?`,
      match: bestMatch
    };
  }

  // 3. Ambigüedad Total -> Failsafe
  return { 
    type: 'FAILSAFE', 
    target: "",
    text: "Lo siento, no logré entender eso. 😕 ¿Podrías elegir una de estas opciones?",
    match: bestMatch
  };
};
