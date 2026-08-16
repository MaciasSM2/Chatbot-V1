/**
 * @file DecisionTreeRule.ts
 * @description Definición de interfaces dominiales para el árbol de decisión determinista.
 */

export type NodeActionType = 
  | 'MESSAGE_ONLY' 
  | 'CAPTURE_NAME' 
  | 'CAPTURE_DOCUMENT' 
  | 'CAPTURE_CONTACT' 
  | 'SCHEDULE_DATE' 
  | 'HUMAN_HANDOFF' 
  | 'INACTIVITY_WARN' 
  | 'INACTIVITY_CLOSE' 
  | 'CANCEL_PROCESS';

export interface IDecisionNode {
  readonly id: string;
  readonly category: 'CORPORATE' | 'FLOW' | 'DATA_CAPTURE' | 'SUPPORT' | 'SYSTEM';
  readonly triggers: readonly string[];
  readonly responseText: string;
  readonly actionType: NodeActionType;
  readonly nextExpectedState?: string;
  readonly requiresHumanEscalation?: boolean;
}

export interface IMatchEvaluationResult {
  readonly matchedNode: IDecisionNode | null;
  readonly confidenceScore: number;
  readonly isFallback: boolean;
}
