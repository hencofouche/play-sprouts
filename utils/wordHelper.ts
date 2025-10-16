
export const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const scrambleWord = (word: string): string[] => {
  const letters = word.split('');
  if (letters.length <= 1) {
    return letters;
  }
  
  let scrambled = shuffleArray(letters);
  while (scrambled.join('') === word) {
    scrambled = shuffleArray(letters);
  }
  return scrambled;
};
