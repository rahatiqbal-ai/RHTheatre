
import { GoogleGenAI, Type } from "@google/genai";
import { CartoonScript, ScriptRequest } from "../types";

/**
 * VERTEX ENGINE: Pro-tier Cartoon Scripting.
 * Uses gemini-3-pro-preview for strategic content architecture.
 */
export const generateCartoonScript = async (params: ScriptRequest): Promise<CartoonScript> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const charLimit = params.durationMinutes * 1000;
  
  const charactersPrompt = params.seedCharacters && params.seedCharacters.length > 0
    ? `USE THESE CHARACTERS:
       ${params.seedCharacters.map(c => `- ${c.name}: ${c.description}`).join('\n')}`
    : `Create 2 simple characters for this story.`;

  const prompt = `
    ROLE: Professional Cartoon Storyteller and YouTube Content Strategist.
    TASK: Write a long story script for a cartoon AND a catchy YouTube title.
    
    TOPIC: ${params.topic}
    AUDIENCE: Primary School Students (Ages 6-10).
    GENRES: ${params.genres.join(", ")}
    STYLE: Strictly Third-Person Narrative.
    DURATION: ${params.durationMinutes} minutes.
    
    HARD CHARACTER LIMIT: The total narrative text MUST be between ${charLimit - 200} and ${charLimit} characters. 
    
    VOCABULARY RULES: Simple words, short sentences, Primary education level.
    YOUTUBE TITLE: Create a viral, clicky title for a YouTube kids' cartoon.

    ${charactersPrompt}
    
    EXTRA INSTRUCTIONS: ${params.instructions}

    FORMAT: Return a JSON object with keys: "youtubeTitle" (string) and "paragraphs" (array of strings).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        temperature: 0.8,
        // VERTEX: High reasoning for content strategy
        thinkingConfig: { thinkingBudget: 8000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            youtubeTitle: { type: Type.STRING },
            paragraphs: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["youtubeTitle", "paragraphs"]
        }
      }
    });

    const result = JSON.parse(response.text || '{"paragraphs":[], "youtubeTitle": ""}');
    
    let totalText = result.paragraphs.join('\n\n');
    if (totalText.length > charLimit) {
      totalText = totalText.substring(0, charLimit);
    }

    return {
      title: params.topic,
      youtubeTitle: result.youtubeTitle || params.topic,
      concept: params.topic,
      characters: params.seedCharacters?.map(c => ({ name: c.name, description: c.description })) || [],
      scenes: [],
      fullNarrative: totalText.split('\n\n')
    };
  } catch (error) {
    console.error("Vertex Toon Engine Error:", error);
    throw new Error("The Vertex script engine encountered a logic fault.");
  }
};
