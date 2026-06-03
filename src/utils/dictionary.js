export function cleanWord(rawWord = "") {
  return rawWord
    .toLowerCase()
    .replace(/^[^a-z]+|[^a-z]+$/gi, "")
    .trim();
}

export async function fetchDefinition(word) {
  const cleanedWord = cleanWord(word);

  if (!cleanedWord) {
    throw new Error("Invalid word.");
  }

  const response = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${cleanedWord}`
  );

  if (!response.ok) {
    throw new Error("Definition not found.");
  }

  const data = await response.json();

  const firstMeaning = data?.[0]?.meanings?.[0];
  const firstDefinition = firstMeaning?.definitions?.[0]?.definition;

  if (!firstMeaning || !firstDefinition) {
    throw new Error("Definition not found.");
  }

  return {
    word: cleanedWord,
    partOfSpeech: firstMeaning.partOfSpeech,
    definition: firstDefinition,
  };
}