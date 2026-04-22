/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

/**
 * Natural Language Search Parser
 * Parses user queries to extract filters and keywords
 */

export interface ParsedQuery {
  keywords: string[];
  maxTime?: number;
  servings?: number;
  diet?: string;
  mealType?: string;
  cuisine?: string;
  difficulty?: string;
}

// Time-related keywords
const timeKeywords: Record<string, number> = {
  'quick': 30,
  'fast': 30,
  'rapid': 30,
  'slow': 120,
  'long': 120,
};

// Meal type keywords
const mealTypeKeywords: Record<string, string> = {
  'breakfast': 'breakfast',
  'brunch': 'breakfast',
  'lunch': 'lunch',
  'dinner': 'dinner',
  'supper': 'dinner',
  'snack': 'snack',
  'dessert': 'dessert',
  'appetizer': 'snack',
};

// Diet keywords
const dietKeywords: Record<string, string> = {
  'vegetarian': 'Vegetarian',
  'vegan': 'Vegan',
  'gluten-free': 'Gluten Free',
  'glutenfree': 'Gluten Free',
  'keto': 'Ketogenic',
  'ketogenic': 'Ketogenic',
  'paleo': 'Paleo',
  'pescetarian': 'Pescetarian',
  'whole30': 'Whole30',
  'healthy': 'Vegetarian', // Map to vegetarian as proxy for healthy
};

// Cuisine keywords
const cuisineKeywords: Record<string, string> = {
  'italian': 'Italian',
  'mexican': 'Mexican',
  'chinese': 'Chinese',
  'japanese': 'Japanese',
  'thai': 'Thai',
  'indian': 'Indian',
  'french': 'French',
  'greek': 'Greek',
  'mediterranean': 'Mediterranean',
  'american': 'American',
  'korean': 'Korean',
  'vietnamese': 'Vietnamese',
  'spanish': 'Spanish',
};

// Difficulty keywords
const difficultyKeywords: Record<string, string> = {
  'easy': 'easy',
  'simple': 'easy',
  'beginner': 'easy',
  'medium': 'medium',
  'intermediate': 'medium',
  'hard': 'hard',
  'difficult': 'hard',
  'advanced': 'hard',
};

// Synonym mapping for better search
export const synonyms: Record<string, string[]> = {
  'pasta': ['noodles', 'spaghetti', 'penne', 'linguine', 'fettuccine'],
  'chicken': ['poultry', 'hen'],
  'beef': ['steak', 'meat'],
  'pork': ['ham', 'bacon'],
  'fish': ['seafood', 'salmon', 'tuna'],
  'quick': ['fast', 'easy', 'simple', 'rapid'],
  'healthy': ['nutritious', 'wholesome', 'light', 'clean'],
  'spicy': ['hot', 'fiery'],
  'sweet': ['sugary', 'dessert'],
};

/**
 * Parse natural language query into structured filters
 */
export function parseNaturalLanguage(query: string): ParsedQuery {
  const lowerQuery = query.toLowerCase();
  const words = lowerQuery.split(/\s+/);
  
  const result: ParsedQuery = {
    keywords: [],
  };

  // Extract time constraints
  // Pattern: "under X minutes", "less than X min", "X minute"
  const timeMatch = lowerQuery.match(/(?:under|less than|within|in)\s+(\d+)\s*(?:min|minute|minutes)/);
  if (timeMatch) {
    result.maxTime = parseInt(timeMatch[1]);
  } else {
    // Check for time keywords
    for (const [keyword, time] of Object.entries(timeKeywords)) {
      if (words.includes(keyword)) {
        result.maxTime = time;
        break;
      }
    }
  }

  // Extract servings
  // Pattern: "for X", "serves X", "X people", "X servings"
  const servingsMatch = lowerQuery.match(/(?:for|serves?)\s+(\d+)|(\d+)\s+(?:people|servings?|persons?)/);
  if (servingsMatch) {
    result.servings = parseInt(servingsMatch[1] || servingsMatch[2]);
  }

  // Extract meal type
  for (const [keyword, mealType] of Object.entries(mealTypeKeywords)) {
    if (words.includes(keyword)) {
      result.mealType = mealType;
      break;
    }
  }

  // Extract diet
  for (const [keyword, diet] of Object.entries(dietKeywords)) {
    if (lowerQuery.includes(keyword)) {
      result.diet = diet;
      break;
    }
  }

  // Extract cuisine
  for (const [keyword, cuisine] of Object.entries(cuisineKeywords)) {
    if (words.includes(keyword)) {
      result.cuisine = cuisine;
      break;
    }
  }

  // Extract difficulty
  for (const [keyword, difficulty] of Object.entries(difficultyKeywords)) {
    if (words.includes(keyword)) {
      result.difficulty = difficulty;
      break;
    }
  }

  // Extract remaining keywords (filter out parsed terms)
  const parsedTerms = new Set([
    ...Object.keys(timeKeywords),
    ...Object.keys(mealTypeKeywords),
    ...Object.keys(dietKeywords),
    ...Object.keys(cuisineKeywords),
    ...Object.keys(difficultyKeywords),
    'under', 'less', 'than', 'within', 'in', 'for', 'serves', 'people', 'servings', 'persons',
    'minute', 'minutes', 'min',
  ]);

  result.keywords = words.filter(word => 
    word.length > 2 && 
    !parsedTerms.has(word) &&
    !/^\d+$/.test(word) // Filter out standalone numbers
  );

  return result;
}

/**
 * Expand search terms with synonyms
 */
export function expandWithSynonyms(keywords: string[]): string[] {
  const expanded = new Set(keywords);
  
  for (const keyword of keywords) {
    const syns = synonyms[keyword];
    if (syns) {
      syns.forEach(syn => expanded.add(syn));
    }
  }
  
  return Array.from(expanded);
}

/**
 * Format parsed query for display to user
 */
export function formatParsedQuery(parsed: ParsedQuery): string {
  const parts: string[] = [];
  
  if (parsed.keywords.length > 0) {
    parts.push(`Keywords: ${parsed.keywords.join(', ')}`);
  }
  if (parsed.maxTime) {
    parts.push(`Max time: ${parsed.maxTime} min`);
  }
  if (parsed.servings) {
    parts.push(`Servings: ${parsed.servings}`);
  }
  if (parsed.diet) {
    parts.push(`Diet: ${parsed.diet}`);
  }
  if (parsed.mealType) {
    parts.push(`Meal: ${parsed.mealType}`);
  }
  if (parsed.cuisine) {
    parts.push(`Cuisine: ${parsed.cuisine}`);
  }
  if (parsed.difficulty) {
    parts.push(`Difficulty: ${parsed.difficulty}`);
  }
  
  return parts.join(' • ');
}

/**
 * Calculate Levenshtein distance for fuzzy matching
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Find closest match for typo tolerance
 */
export function findClosestMatch(input: string, options: string[], threshold: number = 2): string | null {
  let closestMatch: string | null = null;
  let minDistance = Infinity;

  for (const option of options) {
    const distance = levenshteinDistance(input.toLowerCase(), option.toLowerCase());
    if (distance <= threshold && distance < minDistance) {
      minDistance = distance;
      closestMatch = option;
    }
  }

  return closestMatch;
}

// Made with Bob
