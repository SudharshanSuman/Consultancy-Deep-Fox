import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, Service } from "../types";
import { SERVICES } from "../constants";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_NAME = "gemini-2.5-flash";

const SYSTEM_INSTRUCTION = `
You are the brain of "Consultancy Deep Fox", a booking assistant for a consulting firm.
Your job is to analyze user input and extract intent, entities, and recommend services based on problems described.

Available Services:
${SERVICES.map(s => `- ID: ${s.id}, Name: ${s.name}, Desc: ${s.description}`).join('\n')}

Rules:
1. If the user describes a problem (e.g., "tax audit help"), map it to the closest Service ID.
2. If the user wants to book, intent is 'BOOK'.
3. If the user wants to change a booking, intent is 'RESCHEDULE'.
4. If the user wants to cancel, intent is 'CANCEL'.
5. Always provide a friendly, professional 'replyText' to be displayed to the user.
6. If the user input is just a greeting, intent is 'GENERAL_QUERY' and ask how you can help.
`;

export const analyzeUserIntent = async (userText: string): Promise<AIAnalysisResult> => {
  if (!apiKey) {
    console.warn("API Key missing, returning mock response");
    return {
      intent: 'GENERAL_QUERY',
      replyText: "I'm running in demo mode without an API key. I can still help you book an appointment manually!",
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: userText,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: {
              type: Type.STRING,
              enum: ['BOOK', 'RESCHEDULE', 'CANCEL', 'GENERAL_QUERY', 'UNKNOWN']
            },
            recommendedServiceId: {
              type: Type.STRING,
              description: "The ID of the service that best matches the user's request, if applicable."
            },
            extractedDate: {
              type: Type.STRING,
              description: "Any date mentioned in ISO format YYYY-MM-DD"
            },
            replyText: {
              type: Type.STRING,
              description: "A polite, conversational response to the user."
            }
          },
          required: ['intent', 'replyText']
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response from Gemini");
    
    return JSON.parse(resultText) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      intent: 'UNKNOWN',
      replyText: "I'm having trouble connecting to my brain right now. Please try again or use the buttons below."
    };
  }
};