
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { AudioAnalysis, AudioEditPlan } from "../types";

const MODELS = {
  TTS: 'gemini-2.5-flash-preview-tts',
  ANALYSIS: 'gemini-3-flash-preview',
  PLANNER: 'gemini-3-pro-preview'
};

export const generateVoice = async (text: string, voiceName: string, languageCode: string, styleInstruction: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: MODELS.TTS,
    contents: [{ parts: [{ text: `${styleInstruction}. Language: ${languageCode}. Text: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio data returned from Voice Engine.");
  
  return base64Audio;
};

export const analyzeAudio = async (audioBase64: string, mimeType: string): Promise<AudioAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Analyze this audio. Provide:
    1. A detailed transcript with timestamps (startTime, endTime), speaker labels, emotion per segment, and language per segment.
    2. Overall emotion of the file.
    3. Primary language detected.
    4. Tempo estimate (BPM) if music is present.
    5. Mood tags.

    Return a JSON object matching this schema:
    {
      "transcript": [{"startTime": number, "endTime": number, "text": string, "speaker": string, "emotion": string, "language": string}],
      "overallEmotion": string,
      "languageDetected": string,
      "tempoEstimate": number,
      "moodTags": [string]
    }
  `;

  const response = await ai.models.generateContent({
    model: MODELS.ANALYSIS,
    contents: {
      parts: [
        { inlineData: { data: audioBase64, mimeType } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcript: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                startTime: { type: Type.NUMBER },
                endTime: { type: Type.NUMBER },
                text: { type: Type.STRING },
                speaker: { type: Type.STRING },
                emotion: { type: Type.STRING },
                language: { type: Type.STRING }
              }
            }
          },
          overallEmotion: { type: Type.STRING },
          languageDetected: { type: Type.STRING },
          tempoEstimate: { type: Type.NUMBER },
          moodTags: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateEditPlan = async (analysis: AudioAnalysis, userGoal: string): Promise<AudioEditPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Based on this audio analysis: ${JSON.stringify(analysis)}
    The user wants to achieve this goal: "${userGoal}"
    
    Generate a technical edit plan using these available tools: trim, fade, normalize, eq, noise-reduction, tempo, pitch, compress, limiter.
    
    Return a JSON object with keys "steps" (array of {type, params, description}) and "explanation" (string).
    The "params" object should contain specific numeric or string values relevant to the tool, such as start/end times, gain levels, or frequencies.
  `;

  const response = await ai.models.generateContent({
    model: MODELS.PLANNER,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: 'The tool name (e.g. trim, eq, compress)' },
                params: { 
                  type: Type.OBJECT, 
                  description: 'Parameters for the tool',
                  properties: {
                    start: { type: Type.NUMBER, description: 'Start timestamp in seconds' },
                    end: { type: Type.NUMBER, description: 'End timestamp in seconds' },
                    value: { type: Type.NUMBER, description: 'General numeric setting for the effect' },
                    gain: { type: Type.NUMBER, description: 'Gain level in decibels' },
                    frequency: { type: Type.NUMBER, description: 'Center frequency in Hertz' },
                    threshold: { type: Type.NUMBER, description: 'Threshold level in decibels' },
                    ratio: { type: Type.NUMBER, description: 'Compression ratio' },
                    intensity: { type: Type.STRING, description: 'Descriptive intensity level (low, medium, high)' }
                  }
                },
                description: { type: Type.STRING, description: 'Natural language description of this edit step' }
              },
              required: ["type", "params", "description"]
            }
          },
          explanation: { type: Type.STRING, description: 'Overall logic for the generated plan' }
        },
        required: ["steps", "explanation"]
      }
    }
  });

  return JSON.parse(response.text);
};
