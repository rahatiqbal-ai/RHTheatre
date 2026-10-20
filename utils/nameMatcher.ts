
/**
 * Matches character names in a script part based on word boundaries.
 * Returns a list of matched names in the order they first appear.
 */
export const matchCharacterNames = (script: string, characterNames: string[]): string[] => {
  if (!script || characterNames.length === 0) return [];

  const detected: { name: string; index: number }[] = [];
  const normalizedScript = script.replace(/\s+/g, ' ').toLowerCase();

  characterNames.forEach((name) => {
    // Escape special characters and handle multi-word names with flexible whitespace
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    const regex = new RegExp(`\\b${escapedName}\\b`, 'gi');
    
    let match;
    while ((match = regex.exec(script)) !== null) {
      detected.push({ name, index: match.index });
    }
  });

  // Sort by index to maintain appearance order and deduplicate
  return Array.from(new Set(
    detected
      .sort((a, b) => a.index - b.index)
      .map(d => d.name)
  ));
};

export const normalizeWhitespace = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ');
};
