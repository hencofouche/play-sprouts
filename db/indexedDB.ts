const DB_NAME = 'PlaySproutsDB';
const WORDS_STORE_NAME = 'wordImages';
const MATH_ITEMS_STORE_NAME = 'mathItems';
const COLOR_ITEMS_STORE_NAME = 'colorItems';
const DB_VERSION = 2;

export interface WordImageRecord {
  word: string;
  image: string;
}

export interface MathItemRecord {
  name: string;
  image: string;
}

export interface ColorItemRecord {
  name: string;
  color: string;
  image: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

const getDB = (): Promise<IDBDatabase> => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(WORDS_STORE_NAME)) {
          db.createObjectStore(WORDS_STORE_NAME, { keyPath: 'word' });
        }
        if (!db.objectStoreNames.contains(MATH_ITEMS_STORE_NAME)) {
          db.createObjectStore(MATH_ITEMS_STORE_NAME, { keyPath: 'name' });
        }
        if (!db.objectStoreNames.contains(COLOR_ITEMS_STORE_NAME)) {
          db.createObjectStore(COLOR_ITEMS_STORE_NAME, { keyPath: 'name' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };
    });
  }
  return dbPromise;
};

// --- Word Store Functions ---

export const addWordImage = async (word: string, image: string): Promise<void> => {
  const db = await getDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(WORDS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(WORDS_STORE_NAME);
    const request = store.put({ word, image });

    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error('Failed to add word/image:', request.error);
      reject(request.error);
    };
  });
};

export const getImageForWord = async (word: string): Promise<string | null> => {
  const db = await getDB();
  return new Promise<string | null>((resolve, reject) => {
    const transaction = db.transaction(WORDS_STORE_NAME, 'readonly');
    const store = transaction.objectStore(WORDS_STORE_NAME);
    const request = store.get(word);

    request.onsuccess = () => {
      const result: WordImageRecord | undefined = request.result;
      resolve(result ? result.image : null);
    };
    request.onerror = () => {
      console.error('Failed to get image for word:', request.error);
      reject(request.error);
    };
  });
};

export const getAllWords = async (): Promise<string[]> => {
  const db = await getDB();
  return new Promise<string[]>((resolve, reject) => {
    const transaction = db.transaction(WORDS_STORE_NAME, 'readonly');
    const store = transaction.objectStore(WORDS_STORE_NAME);
    const request = store.getAllKeys();

    request.onsuccess = () => {
      resolve(request.result as string[]);
    };
    request.onerror = () => {
      console.error('Failed to get all words:', request.error);
      reject(request.error);
    };
  });
};

export const deleteWordImage = async (word: string): Promise<void> => {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(WORDS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(WORDS_STORE_NAME);
        const request = store.delete(word);

        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error('Failed to delete word:', request.error);
            reject(request.error);
        };
    });
};

export const getAllWordImagePairs = async (): Promise<WordImageRecord[]> => {
    const db = await getDB();
    return new Promise<WordImageRecord[]>((resolve, reject) => {
        const transaction = db.transaction(WORDS_STORE_NAME, 'readonly');
        const store = transaction.objectStore(WORDS_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result as WordImageRecord[]);
        };
        request.onerror = () => {
            console.error('Failed to get all word/image pairs:', request.error);
            reject(request.error);
        };
    });
};

// --- Math Items Store Functions ---

export const addMathItem = async (name: string, image: string): Promise<void> => {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(MATH_ITEMS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(MATH_ITEMS_STORE_NAME);
        const request = store.put({ name, image });
        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error('Failed to add math item:', request.error);
            reject(request.error);
        };
    });
};

export const getAllMathItems = async (): Promise<MathItemRecord[]> => {
    const db = await getDB();
    return new Promise<MathItemRecord[]>((resolve, reject) => {
        const transaction = db.transaction(MATH_ITEMS_STORE_NAME, 'readonly');
        const store = transaction.objectStore(MATH_ITEMS_STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result as MathItemRecord[]);
        request.onerror = () => {
            console.error('Failed to get all math items:', request.error);
            reject(request.error);
        };
    });
};

export const deleteMathItem = async (name: string): Promise<void> => {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(MATH_ITEMS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(MATH_ITEMS_STORE_NAME);
        const request = store.delete(name);
        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error('Failed to delete math item:', request.error);
            reject(request.error);
        };
    });
};

// --- Color Items Store Functions ---

export const addColorItem = async (name: string, color: string, image: string): Promise<void> => {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(COLOR_ITEMS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(COLOR_ITEMS_STORE_NAME);
        const request = store.put({ name, color, image });
        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error('Failed to add color item:', request.error);
            reject(request.error);
        };
    });
};

export const getAllColorItems = async (): Promise<ColorItemRecord[]> => {
    const db = await getDB();
    return new Promise<ColorItemRecord[]>((resolve, reject) => {
        const transaction = db.transaction(COLOR_ITEMS_STORE_NAME, 'readonly');
        const store = transaction.objectStore(COLOR_ITEMS_STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result as ColorItemRecord[]);
        request.onerror = () => {
            console.error('Failed to get all color items:', request.error);
            reject(request.error);
        };
    });
};

export const deleteColorItem = async (name: string): Promise<void> => {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(COLOR_ITEMS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(COLOR_ITEMS_STORE_NAME);
        const request = store.delete(name);
        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error('Failed to delete color item:', request.error);
            reject(request.error);
        };
    });
};