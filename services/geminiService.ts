
import { GoogleGenAI, Type } from "@google/genai";
import { type WineRegionInfo } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    description: {
      type: Type.STRING,
      description: "A brief, engaging description of the region's terroir and history (about 50-70 words)."
    },
    grapes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of 3-5 key grape varieties grown in the region."
    },
    wineries: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of 3-5 notable wineries from the region."
    },
  },
  required: ['description', 'grapes', 'wineries'],
};

export const fetchRegionInfo = async (regionName: string): Promise<WineRegionInfo> => {
  const prompt = `
    You are a knowledgeable and eloquent sommelier.
    For the wine region "${regionName}", provide the following information in a JSON format.

    1. A brief, engaging description of the region's terroir and history (about 50-70 words).
    2. A list of 3-5 key grape varieties.
    3. A list of 3-5 notable wineries.

    Ensure your response strictly adheres to the provided JSON schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      },
    });

    const jsonText = response.text.trim();
    const parsedData: WineRegionInfo = JSON.parse(jsonText);
    return parsedData;
  } catch (error) {
    console.error("Error fetching data from Gemini API:", error);
    throw new Error("Failed to retrieve information for the selected region. Please try again.");
  }
};
