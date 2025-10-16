import { GoogleGenAI, Type, Modality } from "@google/genai";
import * as db from '../db/indexedDB';
import { shuffleArray } from "../utils/wordHelper";

// FIX: Per coding guidelines, initialize GoogleGenAI with API key from environment variables.
// This single instance will be used for all service calls.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });


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
    // FIX: Removed local getAiClient() call and associated try-catch block.
    let word = '';
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Generate a single, simple, common, 3 to 5 letter English word for a kids reading game. Examples: cat, dog, sun, ball, tree. Just the word, no extra text.",
        });
        word = response.text.trim().toLowerCase().replace(/[^a-z]/g, '');
        if (!word) throw new Error("Generated word was empty.");
        if (await db.getImageForWord(word)) {
             return generateUnapprovedWordAndImage();
        }
    } catch (error) {
        console.error("Error generating word:", error);
        // FIX: Removed API key specific error message as key is now handled by environment.
        return { error: "Could not generate a new word. Please check your connection." };
    }
    
    return generateImageForProvidedWord(word);
}

export async function generateImageForProvidedWord(word: string): Promise<{ word: string; imageUrl:string } | { error: string }> {
    // FIX: Removed local getAiClient() call and associated try-catch block.
    const sanitizedWord = word.trim().toLowerCase().replace(/[^a-z]/g, '');
    if (!sanitizedWord) return { error: "Please enter a valid word (letters only)." };
    if (await db.getImageForWord(sanitizedWord)) return { error: `'${sanitizedWord.toUpperCase()}' is already in the game!` };
    
    const prompt = `A simple, cute, cartoon vector illustration of a '${sanitizedWord}'. Joyful and friendly style for a children's reading game. Bright, vibrant colors. No text, letters, or words. The object should be isolated on a plain light-colored background.`;
    
    try {
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
        console.error(`Error generating image for ${sanitizedWord}:`, error);
        // FIX: Removed API key specific error message.
        return { error: `Could not generate an image for "${sanitizedWord}". Please try again.` };
    }
}

// --- MATH ADDITION ---

export async function getMathItems(): Promise<db.MathItemRecord[]> {
    return db.getAllMathItems();
}

export async function generateUnapprovedMathItem(): Promise<{ name: string; imageUrl: string } | { error: string }> {
    // FIX: Removed local getAiClient() call and associated try-catch block.
    let name = '';
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Generate a single, simple, common object name for a kids' counting game. Examples: apple, star, car, boat, duck. Just the object name, no extra text.",
        });
        name = response.text.trim().toLowerCase().replace(/[^a-z]/g, '');
        if (!name) throw new Error("Generated name was empty.");
        if ((await db.getAllMathItems()).some(item => item.name === name)) {
             return generateUnapprovedMathItem();
        }
    } catch (error) {
        console.error("Error generating math item name:", error);
        // FIX: Removed API key specific error message.
        return { error: "Could not generate a new item name. Please check your connection." };
    }
    
    const prompt = `A single, simple, cute, cartoon vector illustration of a '${name}'. For a kids counting game. Joyful and friendly style. Bright, vibrant colors. No text, letters, or words. Isolated on a plain light-colored background.`;

    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: prompt }] }, config: { responseModalities: [Modality.IMAGE] } });
        const part = response.candidates[0].content.parts.find(p => p.inlineData);
        if (part?.inlineData) {
            const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            return { name, imageUrl };
        }
        throw new Error("No image data found");
    } catch (error) {
        console.error(`Error generating image for math item ${name}:`, error);
        // FIX: Removed API key specific error message.
        return { error: `Could not generate an image for "${name}". Please try again.` };
    }
}


export async function generateImageForMathItem(name: string): Promise<{ name: string; imageUrl: string } | { error: string }> {
    // FIX: Removed local getAiClient() call and associated try-catch block.
    const sanitizedName = name.trim().toLowerCase().replace(/[^a-z]/g, '');
    if (!sanitizedName) return { error: "Please enter a valid item name (letters only)." };
    
    const allItems = await db.getAllMathItems();
    if (allItems.some(item => item.name === sanitizedName)) {
        return { error: `'${sanitizedName.toUpperCase()}' is already in the game!` };
    }

    const prompt = `A single, simple, cute, cartoon vector illustration of a '${sanitizedName}'. For a kids counting game. Joyful and friendly style. Bright, vibrant colors. No text, letters, or words. Isolated on a plain light-colored background.`;

    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: prompt }] }, config: { responseModalities: [Modality.IMAGE] } });
        const part = response.candidates[0].content.parts.find(p => p.inlineData);
        if (part?.inlineData) {
            const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            return { name: sanitizedName, imageUrl };
        }
        throw new Error("No image data found");
    } catch (error) {
        console.error(`Error generating image for math item ${sanitizedName}:`, error);
        // FIX: Removed API key specific error message.
        return { error: `Could not generate an image for "${sanitizedName}". Please try again.` };
    }
}

// --- COLOR MATCHING ---

export async function getColorItems(): Promise<db.ColorItemRecord[]> {
    return db.getAllColorItems();
}

export async function generateUnapprovedColorItem(): Promise<{ name: string; color: string; imageUrl: string } | { error: string }> {
    // FIX: Removed local getAiClient() call and associated try-catch block.
    let name = '';
    let color = '';
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Generate a simple, common object and a primary color for it, for a kids' color matching game. Examples: { \"name\": \"apple\", \"color\": \"red\" }, { \"name\": \"frog\", \"color\": \"green\" }. Only return a single JSON object.",
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
        const result = JSON.parse(response.text) as { name: string; color: string };
        name = result.name.trim().toLowerCase().replace(/[^a-z]/g, '');
        color = result.color.trim().toLowerCase().replace(/[^a-z]/g, '');
        if (!name || !color) throw new Error("Generated name or color was empty.");
        
        if ((await db.getAllColorItems()).some(item => item.name === name)) {
            return generateUnapprovedColorItem(); // Retry
        }
    } catch (error) {
        console.error("Error generating color item:", error);
        // FIX: Removed API key specific error message.
        return { error: "Could not generate a new item. Please check your connection." };
    }
    
    const prompt = `A simple, cute, cartoon vector illustration of a '${name}' that is primarily and clearly the color '${color}'. For a kids color matching game. Joyful and friendly style. No text or other objects. Isolated on a plain light-colored background.`;

    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: prompt }] }, config: { responseModalities: [Modality.IMAGE] } });
        const part = response.candidates[0].content.parts.find(p => p.inlineData);
        if (part?.inlineData) {
            const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            return { name, color, imageUrl };
        }
        throw new Error("No image data found");
    } catch (error) {
        console.error(`Error generating image for color item ${name}:`, error);
        // FIX: Removed API key specific error message.
        return { error: `Could not generate an image for "${name}". Please try again.` };
    }
}

export async function generateImageForColorItem(name: string, color: string): Promise<{ name: string, color: string, imageUrl: string } | { error: string }> {
    // FIX: Removed local getAiClient() call and associated try-catch block.
    const sanitizedName = name.trim().toLowerCase().replace(/[^a-z]/g, '');
    const sanitizedColor = color.trim().toLowerCase();
    if (!sanitizedName || !sanitizedColor) return { error: "Please enter a valid item name and color." };
    
    const allItems = await db.getAllColorItems();
    if (allItems.some(item => item.name === sanitizedName)) {
        return { error: `'${sanitizedName.toUpperCase()}' is already in the game!` };
    }

    const prompt = `A simple, cute, cartoon vector illustration of a '${sanitizedName}' that is primarily and clearly the color '${sanitizedColor}'. For a kids color matching game. Joyful and friendly style. No text or other objects. Isolated on a plain light-colored background.`;

    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: prompt }] }, config: { responseModalities: [Modality.IMAGE] } });
        const part = response.candidates[0].content.parts.find(p => p.inlineData);
        if (part?.inlineData) {
            const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            return { name: sanitizedName, color: sanitizedColor, imageUrl };
        }
        throw new Error("No image data found");
    } catch (error) {
        console.error(`Error generating image for color item ${sanitizedName}:`, error);
        // FIX: Removed API key specific error message.
        return { error: `Could not generate an image for "${sanitizedName}". Please try again.` };
    }
}
