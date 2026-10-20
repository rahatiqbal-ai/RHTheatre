
import { normalizeWhitespace } from './nameMatcher';

interface PromptData {
  sceneIndex: number;
  detectedCharacters: string[];
  environment: string;
  script: string;
  action: string;
  illustration: string;
  visualCue: string;
}

/**
 * Constructs a cohesive video prompt by blending only the visual illustration 
 * and artistic style into a single paragraph.
 * 
 * Per user request: All other information (scene features, characters, location, 
 * environment, narrative context, character performance) is excluded.
 */
export const constructFinalPrompt = (data: PromptData): string => {
  const illustration = normalizeWhitespace(data.illustration);
  const style = normalizeWhitespace(data.visualCue);
  
  // Combine the visual composition and artistic style into a singular, clean paragraph.
  return `${illustration} ${style}`.trim();
};
