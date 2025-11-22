import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in environment variables. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateCoolNickname = async (theme: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return `Player${Math.floor(Math.random() * 1000)}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a single, cool, short (max 10 chars) nickname for a competitive arcade game based on the theme: "${theme}". Return ONLY the name, no quotes.`,
    });
    return response.text?.trim().slice(0, 12) || "CosmicUser";
  } catch (error) {
    console.error("Error generating nickname:", error);
    return "Nova";
  }
};

export const getTacticalAdvice = async (mass: number, nearbyThreats: number): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Stay away from bigger circles and eat smaller ones!";

  try {
    const prompt = `
      I am playing an Agar.io clone.
      My current mass is ${Math.floor(mass)}.
      I can see ${nearbyThreats} players larger than me nearby.
      Give me a one-sentence tactical tip. Be brief and punchy.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text?.trim() || "Keep growing!";
  } catch (error) {
    console.error("Error getting advice:", error);
    return "Eat food to grow, avoid giants!";
  }
};