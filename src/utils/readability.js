export function countSyllables(word = "") {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");

  if (!cleaned) return 0;
  if (cleaned.length <= 3) return 1;

  const withoutSilentEndings = cleaned
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "");

  const matches = withoutSilentEndings.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

export function calculateFleschReadingEase(text = "") {
  const sentences = text
    .split(/[.!?]+/)
    .filter((sentence) => sentence.trim().length > 0);

  const words = text
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (!sentences.length || !words.length) {
    return {
      score: null,
      difficulty: "Not enough text to calculate.",
      wordCount: words.length,
      sentenceCount: sentences.length,
    };
  }

  const syllables = words.reduce((total, word) => {
    return total + countSyllables(word);
  }, 0);

  const score =
    206.835 -
    1.015 * (words.length / sentences.length) -
    84.6 * (syllables / words.length);

  let difficulty = "";

  if (score >= 90) difficulty = "Very Easy";
  else if (score >= 80) difficulty = "Easy";
  else if (score >= 70) difficulty = "Fairly Easy";
  else if (score >= 60) difficulty = "Plain English";
  else if (score >= 50) difficulty = "Fairly Difficult";
  else if (score >= 30) difficulty = "Difficult";
  else difficulty = "Very Difficult";

  return {
    score: Number(score.toFixed(2)),
    difficulty,
    wordCount: words.length,
    sentenceCount: sentences.length,
  };
}