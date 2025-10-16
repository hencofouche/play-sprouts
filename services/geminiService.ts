import { GoogleGenAI, Type, Modality } from "@google/genai";
import * as db from '../db/indexedDB';
import { shuffleArray } from "../utils/wordHelper";

const API_KEY_STORAGE_KEY = 'gemini_api_key';

const getAiClient = (): GoogleGenAI => {
    const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (!apiKey) {
        throw new Error("API key not found. Please set your key in the Parent Settings.");
    }
    return new GoogleGenAI({ apiKey });
};

const handleApiError = (error: unknown, context: string): { error: string } => {
    console.error(`Error in ${context}:`, error);
    const message = (error as Error).message || 'An unknown error occurred';

    if (message.includes("API key not found")) {
        return { error: "Your Gemini API key is missing. Please add it in Parent Settings under the 'API Key' tab." };
    }
    if (message.includes("API key not valid")) {
        return { error: "The API key you provided is invalid. Please check it in Parent Settings." };
    }
    if (message.toLowerCase().includes("quota")) {
        return { error: "Your API key has exceeded its free quota. Please check your Google AI Studio account billing details or try again later. Note: If running on a shared platform like Vercel, free tier quotas can sometimes be affected by shared server resources." };
    }
    
    return { error: `An unexpected error occurred: ${message}` };
}

export const testApiKey = async (apiKey: string): Promise<{ success: boolean; message: string }> => {
    if (!apiKey.trim()) {
        return { success: false, message: "API Key cannot be empty." };
    }
    try {
        const ai = new GoogleGenAI({ apiKey });
        // Make a minimal, low-token request to validate the key
        await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Hi",
        });
        return { success: true, message: "Success! Your API Key is valid and working." };
    } catch (error) {
        const handledError = handleApiError(error, 'testApiKey');
        return { success: false, message: handledError.error };
    }
};


// --- PLAY SPROUTS ---

export async function getWordList(): Promise<string[]> {
  try {
    const storedWords = await db.getAllWords();
    if (storedWords.length > 0) {
      console.log(`Loaded ${storedWords.length} words from local database.`);
      return shuffleArray(storedWords).slice(0, 10);
    }
    return [];
  } catch (error) {
    console.error("Error fetching words from DB:", error);
    return [];
  }
}

export async function getImageForWord(word: string): Promise<string | null> {
  try {
    const cachedImage = await db.getImageForWord(word);
    if (cachedImage) {
      return cachedImage;
    }
    return null;
  } catch (error) {
    console.error("Error checking IndexedDB for image:", error);
    return null;
  }
}

export async function generateUnapprovedWordAndImage(): Promise<{ word: string; imageUrl: string } | { error: string }> {
    try {
        const ai = getAiClient();
        const existingWords = await db.getAllWords();
        const exclusionList = existingWords.length > 0 ? ` It must not be one of these words: ${existingWords.join(', ')}.` : '';

        const wordResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a single, simple, common, 3 to 5 letter English word for a kids reading game. Examples: cat, dog, sun, ball, tree. Just the word, no extra text.${exclusionList}`,
        });
        const word = wordResponse.text.trim().toLowerCase().replace(/[^a-z]/g, '');
        if (!word) throw new Error("Generated word was empty.");
        
        // Final check in case the model ignores the instruction
        if (await db.getImageForWord(word)) {
             return { error: `The AI suggested "${word.toUpperCase()}", which is already in the game. Please try again.` };
        }

        const prompt = `A simple, cute, cartoon vector illustration of a '${word}'. Joyful and friendly style for a children's reading game. Bright, vibrant colors. No text, letters, or words. The object should be isolated on a plain light-colored background.`;
        const imageResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', contents: { parts: [{ text: prompt }] }, config: { responseModalities: [Modality.IMAGE] }
        });

        const part = imageResponse.candidates[0].content.parts.find(p => p.inlineData);
        if (part?.inlineData) {
            const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            return { word, imageUrl };
        }
        throw new Error("No image data found in response");
    } catch (error) {
        return handleApiError(error, 'generateUnapprovedWordAndImage');
    }
}

export async function generateImageForProvidedWord(word: string): Promise<{ word: string; imageUrl:string } | { error: string }> {
    const sanitizedWord = word.trim().toLowerCase().replace(/[^a-z]/g, '');
    if (!sanitizedWord) return { error: "Please enter a valid word (letters only)." };
    if (await db.getImageForWord(sanitizedWord)) return { error: `'${sanitizedWord.toUpperCase()}' is already in the game!` };
    
    try {
        const ai = getAiClient();
        const prompt = `A simple, cute, cartoon vector illustration of a '${sanitizedWord}'. Joyful and friendly style for a children's reading game. Bright, vibrant colors. No text, letters, or words. The object should be isolated on a plain light-colored background.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', contents: { parts: [{ text: prompt }] }, config: { responseModalities: [Modality.IMAGE] }
        });
        const part = response.candidates[0].content.parts.find(p => p.inlineData);
        if (part?.inlineData) {
            const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            return { word: sanitizedWord, imageUrl };
        }
        throw new Error("No image data found in response");
    } catch (error) {
        return handleApiError(error, `generateImageForProvidedWord: ${sanitizedWord}`);
    }
}

// --- MATH ADDITION ---

export async function getMathItems(): Promise<db.MathItemRecord[]> {
    return db.getAllMathItems();
}

export async function generateUnapprovedMathItem(): Promise<{ name: string; imageUrl: string } | { error: string }> {
    try {
        const ai = getAiClient();
        const existingItems = (await db.getAllMathItems()).map(item => item.name);
        const exclusionList = existingItems.length > 0 ? ` It must not be one of these items: ${existingItems.join(', ')}.` : '';

        const nameResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a single, simple, common object name for a kids' counting game. Examples: apple, star, car, boat, duck. Just the object name, no extra text.${exclusionList}`,
        });
        const name = nameResponse.text.trim().toLowerCase().replace(/[^a-z]/g, '');
        if (!name) throw new Error("Generated name was empty.");

        if (existingItems.includes(name)) {
             return { error: `The AI suggested "${name.toUpperCase()}", which is already in the game. Please try again.` };
        }
    
        const prompt = `A single, simple, cute, cartoon vector illustration of a '${name}'. For a kids counting game. Joyful and friendly style. Bright, vibrant colors. No text, letters, or words. Isolated on a plain light-colored background.`;
        const imageResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: prompt }] }, config: { responseModalities: [Modality.IMAGE] } });
        
        const part = imageResponse.candidates[0].content.parts.find(p => p.inlineData);
        if (part?.inlineData) {
            const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            return { name, imageUrl };
        }
        throw new Error("No image data found");
    } catch (error) {
        return handleApiError(error, 'generateUnapprovedMathItem');
    }
}


export async function generateImageForMathItem(name: string): Promise<{ name: string; imageUrl: string } | { error: string }> {
    const sanitizedName = name.trim().toLowerCase().replace(/[^a-z]/g, '');
    if (!sanitizedName) return { error: "Please enter a valid item name (letters only)." };
    
    const allItems = await db.getAllMathItems();
    if (allItems.some(item => item.name === sanitizedName)) {
        return { error: `'${sanitizedName.toUpperCase()}' is already in the game!` };
    }

    try {
        const ai = getAiClient();
        const prompt = `A single, simple, cute, cartoon vector illustration of a '${sanitizedName}'. For a kids counting game. Joyful and friendly style. Bright, vibrant colors. No text, letters, or words. Isolated on a plain light-colored background.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: prompt }] }, config: { responseModalities: [Modality.IMAGE] } });
        
        const part = response.candidates[0].content.parts.find(p => p.inlineData);
        if (part?.inlineData) {
            const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            return { name: sanitizedName, imageUrl };
        }
        throw new Error("No image data found");
    } catch (error) {
        return handleApiError(error, `generateImageForMathItem: ${sanitizedName}`);
    }
}

// --- COLOR MATCHING ---

export async function getColorItems(): Promise<db.ColorItemRecord[]> {
    return db.getAllColorItems();
}

export async function generateUnapprovedColorItem(): Promise<{ name: string; color: string; imageUrl: string } | { error: string }> {
    try {
        const ai = getAiClient();
        const existingItems = (await db.getAllColorItems()).map(item => item.name);
        const exclusionList = existingItems.length > 0 ? ` The 'name' must not be one of these: ${existingItems.join(', ')}.` : '';

        const itemResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a simple, common object and a primary color for it, for a kids' color matching game. Examples: { "name": "apple", "color": "red" }, { "name": "frog", "color": "green" }. Only return a single JSON object.${exclusionList}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: 'The name of the object.' },
                        color: { type: Type.STRING, description: 'The color of the object.' },
                    },
                    required: ["name", "color"],
                }
            }
        });
        const result = JSON.parse(itemResponse.text) as { name: string; color: string };
        const name = result.name.trim().toLowerCase().replace(/[^a-z]/g, '');
        const color = result.color.trim().toLowerCase().replace(/[^a-z]/g, '');
        if (!name || !color) throw new Error("Generated name or color was empty.");
        
        if (existingItems.includes(name)) {
            return { error: `The AI suggested "${name.toUpperCase()}", which is already in the game. Please try again.` };
        }
    
        const prompt = `A simple, cute, cartoon vector illustration of a '${name}' that is primarily and clearly the color '${color}'. For a kids color matching game. Joyful and friendly style. No text or other objects. Isolated on a plain light-colored background.`;
        const imageResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: prompt }] }, config: { responseModalities: [Modality.IMAGE] } });
        
        const part = imageResponse.candidates[0].content.parts.find(p => p.inlineData);
        if (part?.inlineData) {
            const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            return { name, color, imageUrl };
        }
        throw new Error("No image data found");
    } catch (error) {
        return handleApiError(error, 'generateUnapprovedColorItem');
    }
}

export async function generateImageForColorItem(name: string, color: string): Promise<{ name: string, color: string, imageUrl: string } | { error: string }> {
    const sanitizedName = name.trim().toLowerCase().replace(/[^a-z]/g, '');
    const sanitizedColor = color.trim().toLowerCase();
    if (!sanitizedName || !sanitizedColor) return { error: "Please enter a valid item name and color." };
    
    const allItems = await db.getAllColorItems();
    if (allItems.some(item => item.name === sanitizedName)) {
        return { error: `'${sanitizedName.toUpperCase()}' is a duplicate item!` };
    }

    try {
        const ai = getAiClient();
        const prompt = `A simple, cute, cartoon vector illustration of a '${sanitizedName}' that is primarily and clearly the color '${sanitizedColor}'. For a kids color matching game. Joyful and friendly style. No text or other objects. Isolated on a plain light-colored background.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: prompt }] }, config: { responseModalities: [Modality.IMAGE] } });

        const part = response.candidates[0].content.parts.find(p => p.inlineData);
        if (part?.inlineData) {
            const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            return { name: sanitizedName, color: sanitizedColor, imageUrl };
        }
        throw new Error("No image data found");
    } catch (error) {
        return handleApiError(error, `generateImageForColorItem: ${sanitizedName}`);
    }
}