
import { GoogleGenAI, Type } from "@google/genai";

export interface ScenePromptsResult {
  firstFrame: string;
  videoPrompt: string;
  lastFrame: string;
  sources?: { title: string; uri: string }[];
}

export interface CharacterRef {
  name: string;
  imageData: string;
}

/**
 * VERTEX ENGINE: High-fidelity scene architecture generation.
 * Utilizes gemini-3-pro-preview with Google Search Grounding.
 */
export const generateScenePrompts = async (
  environment: string,
  script: string,
  action: string,
  detectedCharacters: string[],
  fullStory: string
): Promise<ScenePromptsResult> => {
  const fallback = {
    firstFrame: `A cinematic wide shot of ${detectedCharacters.join(", ")} in ${environment}.`,
    videoPrompt: `The scene begins with ${detectedCharacters.join(", ")} in ${environment}, then ${action} according to the script: ${script}`,
    lastFrame: `A cinematic wide shot concluding the sequence with ${detectedCharacters.join(", ")} in ${environment}.`
  };

  // VERTEX: Dynamic instantiation ensures the latest authorized key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    You are a world-class professional storyboard artist and cinematic consultant.
    Task: Generate THREE consistent, high-fidelity prompts for a single scene beat.
    
    [CONTEXTUAL STORY]:
    ${fullStory}

    [CURRENT SCENE ENVIRONMENT]: ${environment}
    [CURRENT SCRIPT BEAT]: ${script}
    [SPECIFIC CHARACTER ACTIONS]: ${action}
    [CHARACTERS PRESENT]: ${detectedCharacters.join(", ") || "None"}
    
    OUTPUT REQUIREMENTS:
    1. FIRST FRAME IMAGE PROMPT: A vivid, technical description of the exact moment the video begins. Specify camera lens (e.g., 35mm anamorphic), lighting temperature, and exact character blocking.
    2. VIDEO GENERATION PROMPT: A description of the temporal motion and sequence. It MUST begin from the exact frame state described in Prompt 1. Describe performance nuances and camera movement (e.g., slow push-in, subtle parallax).
    3. LAST FRAME IMAGE PROMPT: A vivid, technical description of the exact moment the video ends. This must be a logical conclusion of the motion described in the Video Prompt.
    
    CINEMATIC RULES:
    - Use technical film terms (chiaroscuro, rim lighting, depth of field).
    - Maintain visual consistency with the broader narrative [CONTEXTUAL STORY].
    - Ground descriptions in realistic cinematography.
    - Return a JSON object with keys "firstFrame", "videoPrompt", and "lastFrame".
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            firstFrame: { type: Type.STRING },
            videoPrompt: { type: Type.STRING },
            lastFrame: { type: Type.STRING }
          },
          required: ["firstFrame", "videoPrompt", "lastFrame"]
        },
        // VERTEX: Search grounding enabled for cinematic accuracy
        tools: [{ googleSearch: {} }]
      }
    });

    const result = JSON.parse(response.text || "{}");
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Reference Source",
      uri: chunk.web?.uri || "#"
    })).filter((s: any) => s.uri !== "#");

    return {
      firstFrame: result.firstFrame || fallback.firstFrame,
      videoPrompt: result.videoPrompt || fallback.videoPrompt,
      lastFrame: result.lastFrame || fallback.lastFrame,
      sources: sources
    };
  } catch (error) {
    console.error("Vertex Text Engine Error:", error);
    return fallback;
  }
};

/**
 * VERTEX ENGINE: Ultra-HD Visual Synthesis.
 * Uses gemini-3-pro-image-preview with multi-character reference support.
 */
export const generateSceneImage = async (
  prompt: string, 
  aspectRatio: string, 
  imageSize: '1K' | '2K' | '4K' = '1K',
  characterRefs: CharacterRef[] = []
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let consistencyInstruction = '';
  const imageParts: any[] = [];

  if (characterRefs.length > 0) {
    consistencyInstruction = 'MAINTAIN ABSOLUTE CHARACTER CONSISTENCY. ';
    characterRefs.forEach((ref, index) => {
      consistencyInstruction += `Reference Image ${index + 1} represents the character "${ref.name}". This character MUST look exactly like their reference in species, face, and details. `;
      
      if (ref.imageData.includes(',')) {
        imageParts.push({
          inlineData: {
            data: ref.imageData.split(',')[1],
            mimeType: 'image/png'
          }
        });
      }
    });
    consistencyInstruction += 'Show all characters FULL-BODY from HEAD TO TOE. Do not mix their features. ';
  }

  const parts: any[] = [
    ...imageParts,
    { text: `ULTRA-HD 8K CINEMATIC PRODUCTION STILL: ${consistencyInstruction}${prompt}` }
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: (aspectRatio === '16:9' || aspectRatio === '9:16' || aspectRatio === '1:1') ? aspectRatio : '1:1',
          imageSize: imageSize
        }
      }
    });

    const candidate = response.candidates[0];
    if (candidate.finishReason === 'SAFETY') {
      throw new Error("Vertex Synthesis Blocked: Content safety filters triggered.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("Vertex synthesis returned empty data.");
  } catch (error: any) {
    console.error("Vertex Visual Engine Error:", error);
    throw error;
  }
};

export const generateSceneIllustration = async (
  environment: string,
  script: string,
  action: string,
  detectedCharacters: string[],
  fullStory: string
): Promise<string> => {
  const result = await generateScenePrompts(environment, script, action, detectedCharacters, fullStory);
  return result.videoPrompt;
};
