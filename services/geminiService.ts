
import { GoogleGenAI, Type } from "@google/genai";
import { Activity } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

const schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    stages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.NUMBER },
          type: { type: Type.STRING, description: "One of: normal, hint_audio, drag_drop" },
          inputType: { type: Type.STRING, description: "One of: pad, direct, drag" },
          title: { type: Type.STRING },
          subText: { type: Type.STRING },
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
          sourceItems: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["id", "type", "inputType", "title"]
      }
    },
    slides: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          backgroundColor: { type: Type.STRING },
          elements: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING },
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
                width: { type: Type.NUMBER },
                height: { type: Type.NUMBER },
                content: { type: Type.STRING },
                styles: { type: Type.OBJECT },
                interaction: {
                  type: Type.OBJECT,
                  properties: {
                    trigger: { type: Type.STRING },
                    action: { type: Type.STRING },
                    targetSlide: { type: Type.NUMBER },
                    message: { type: Type.STRING }
                  }
                }
              },
              required: ["id", "type", "x", "y", "width", "height", "content", "styles"]
            }
          }
        },
        required: ["id", "backgroundColor", "elements"]
      }
    }
  },
  required: ["title", "stages", "slides"]
};

export const generateActivityWithAI = async (prompt: string): Promise<Activity | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Design a professional learning activity for: "${prompt}".
      Follow these constraints:
      1. Coordinate System: 1280x1024.
      2. Handwriting (type: normal/hint_audio): targets should be sized ~200x200 if inputType is pad, or placed inside sentence if direct.
      3. Drag & Drop (type: drag_drop): tokens are at the center bubble. sourceItems are in the top selection bar.
      4. Language: If it's Chinese, provide Pinyin.
      5. Also provide visual "slides" data for the editor view using the provided schema.
      Return valid JSON only.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    if (response.text) {
      return JSON.parse(response.text.trim()) as Activity;
    }
    return null;
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return null;
  }
};
