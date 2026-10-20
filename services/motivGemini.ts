
import { GoogleGenAI } from "@google/genai";

export const LEGENDARY_NAMES = [
  "Aurelius Thorne", "Seraphina Vane", "Kaelen Voss", "Lyra Nightshade", 
  "Castian Draken", "Elowen Frost", "Valerius Grimm", "Isolde Sterling"
];

/**
 * VERTEX ENGINE: Massive Long-Form Epic Generator.
 * Uses gemini-3-pro-preview with 32k Thinking Budget.
 */
export const generateStory = async (idea: string, genre: string, characterName: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Write an EXTREMELY LONG and highly detailed cinematic narrative (minimum 15,000 characters, maximum 40,000 characters).
    
    CORE IDEA: ${idea}
    TONAL ARCHITECTURE: ${genre}
    PROTAGONIST: ${characterName}
    
    EXACT REQUIREMENTS:
    1. LENGTH: You MUST output between 15,000 and 40,000 characters.
    2. STRUCTURE: Use a professional cinematic narrative style. Focus on atmosphere, lighting, and sensory details.
    3. STYLE: Use advanced literary devices. The prose should be "heavy" and "textured".
    
    GUIDELINE FOR HITTING 15K-40K CHARS: 
    - Dedicate entire sections to environmental descriptions.
    - Elaborate on every minor action and its philosophical weight.
    - Ensure the dialogue is sparse but meaningful, buried in heavy narrative description.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { 
        temperature: 0.9,
        // VERTEX: Maximum thinking budget for massive narrative consistency
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });

    const output = response.text || "";
    if (output.length < 500) {
       throw new Error("Vertex Engine under-generated. Please refine your seed idea.");
    }

    return output;
  } catch (error: any) {
    console.error("Vertex Story Engine Error:", error);
    throw new Error(error.message || "Failed to synchronize with the Vertex storytelling engine.");
  }
};

export const generateStoryStream = async (idea: string, genre: string, characterName: string, onChunk: (text: string) => void) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Write a massive cinematic story (15,000-40,000 characters). Idea: ${idea}, Tonal Architecture: ${genre}, Protagonist: ${characterName}. Focus on extreme detail and atmosphere.`;
  try {
    const result = await ai.models.generateContentStream({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { 
        temperature: 0.9,
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });
    let fullText = "";
    for await (const chunk of result) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    return fullText;
  } catch (error) {
    throw new Error("Vertex Streaming Engine Failure.");
  }
};
