/**
 * AI Model Configuration Utility
 * 
 * This utility provides access to the current AI model configuration
 * set by administrators in the admin dashboard.
 */

export interface AiModelConfig {
  phase1Model: string;
  phase2Model: string;
}

// Default configuration (fallback if admin config is not available)
const DEFAULT_CONFIG: AiModelConfig = {
  phase1Model: "gpt-4o", // Default to GPT-4o for better visual analysis
  phase2Model: "gpt-4o"  // Default to GPT-4o for Phase 2
};

let currentConfig: AiModelConfig = DEFAULT_CONFIG;

/**
 * Get the current AI model configuration
 * @returns The current AI model configuration
 */
export function getAiModelConfig(): AiModelConfig {
  return currentConfig;
}

/**
 * Update the current AI model configuration
 * @param config The new AI model configuration
 */
export function updateAiModelConfig(config: AiModelConfig): void {
  currentConfig = config;
  console.log('AI Model Configuration updated:', currentConfig);
}

/**
 * Get the model for a specific AI service phase
 * @param phase The AI service phase (1 or 2)
 * @returns The model identifier for the specified phase
 */
export function getModelForPhase(phase: 1 | 2): string {
  if (phase === 1) {
    return currentConfig.phase1Model;
  } else if (phase === 2) {
    return currentConfig.phase2Model;
  }
  
  // Fallback to default
  return DEFAULT_CONFIG.phase1Model;
}

/**
 * Get the model for AI Service Phase 1 (Comprehensive Listing Generation)
 * @returns The model identifier for Phase 1
 */
export function getPhase1Model(): string {
  return currentConfig.phase1Model;
}

/**
 * Get the model for AI Service Phase 2 (Staged Photo Generation)
 * @returns The model identifier for Phase 2
 */
export function getPhase2Model(): string {
  return currentConfig.phase2Model;
}

/**
 * Check if the current configuration uses GPT-5 for a specific phase
 * @param phase The AI service phase (1 or 2)
 * @returns True if GPT-5 is configured for the specified phase
 */
export function isUsingGpt5(phase: 1 | 2): boolean {
  const model = getModelForPhase(phase);
  return model === "gpt-5";
}

/**
 * Check if the current configuration uses GPT-4o for a specific phase
 * @param phase The AI service phase (1 or 2)
 * @returns True if GPT-4o is configured for the specified phase
 */
export function isUsingGpt4o(phase: 1 | 2): boolean {
  const model = getModelForPhase(phase);
  return model === "gpt-4o";
}

