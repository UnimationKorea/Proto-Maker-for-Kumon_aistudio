
import { GoogleGenAI, Type } from "@google/genai";
import { Activity } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const activitySchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    stages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING, description: "One of: handwriting, drag_drop, speech" },
          inputType: { type: Type.STRING, description: "One of: pad, direct" },
          title: { type: Type.STRING },
          instructions: { type: Type.STRING },
          sentence: {
            type: Type.OBJECT,
            properties: {
              pre: { type: Type.STRING },
              post: { type: Type.STRING },
              y: { type: Type.NUMBER }
            }
          },
          targets: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
                width: { type: Type.NUMBER },
                height: { type: Type.NUMBER }
              }
            }
          },
          hintText: { type: Type.ARRAY, items: { type: Type.STRING } },
          audioWord: { type: Type.STRING },
          lang: { type: Type.STRING, description: "ISO language code, e.g. zh-CN, ko-KR, en-US" },
          tokens: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                char: { type: Type.STRING },
                pinyin: { type: Type.STRING },
                fixed: { type: Type.BOOLEAN }
              }
            }
          },
          sourceItems: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Non-fixed pinyin values for drag_drop" }
        },
        required: ["id", "type", "title"]
      }
    }
  },
  required: ["title", "stages"]
};

export const generateActivityWithAI = async (prompt: string): Promise<Activity | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Design a high-quality educational interaction series for: "${prompt}".
      Available Stage Types:
      - 'handwriting': Teaching character writing. inputType 'pad' (writing at bottom) or 'direct' (writing on slot).
      - 'drag_drop': Matching Pinyin to Hanja or words to slots.
      - 'speech': Pronunciation training using microphone.
      
      Coordinate System: 1280 (width) x 1024 (height).
      - Sentence y-level usually around 400.
      - Handwriting targets: Width ~200, Height ~200.
      
      Return valid JSON only. Generate 3-5 diverse stages.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: activitySchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text.trim()) as Activity;
    }
    return null;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return null;
  }
};
