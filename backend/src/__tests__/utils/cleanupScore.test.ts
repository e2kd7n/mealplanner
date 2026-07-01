import { describe, it, expect } from 'vitest';
import { calculateCleanupScore, getCleanupLabel, getCleanupTips } from '../../utils/cleanupScore';

describe('calculateCleanupScore', () => {
  it('returns low score for simple recipe', () => {
    const score = calculateCleanupScore({
      ingredients: [
        { quantity: 1, unit: 'cup' },
        { quantity: 2, unit: 'tbsp' },
      ],
      instructions: ['Mix ingredients', 'Serve'],
      cookTime: 10,
      prepTime: 5,
    });
    expect(score).toBeLessThanOrEqual(3);
  });

  it('returns higher score for complex recipe', () => {
    const ingredients = Array.from({ length: 16 }, (_, i) => ({
      quantity: i + 1,
      unit: 'cups',
    }));
    const score = calculateCleanupScore({
      ingredients,
      instructions: Array.from({ length: 12 }, (_, i) => `Step ${i + 1}: Do something`),
      cookTime: 60,
      prepTime: 45,
    });
    expect(score).toBeGreaterThanOrEqual(5);
  });

  it('adds points for frying', () => {
    const base = {
      ingredients: [{ quantity: 1, unit: 'cup' }],
      cookTime: 15,
      prepTime: 5,
    };
    const withoutFry = calculateCleanupScore({
      ...base,
      instructions: ['Boil pasta'],
    });
    const withFry = calculateCleanupScore({
      ...base,
      instructions: ['Deep fry the chicken'],
    });
    expect(withFry).toBeGreaterThan(withoutFry);
  });

  it('adds points for complex prep work', () => {
    const base = {
      ingredients: [{ quantity: 1, unit: 'cup' }],
      cookTime: 15,
      prepTime: 5,
    };
    const simple = calculateCleanupScore({
      ...base,
      instructions: ['Cook it'],
    });
    const complex = calculateCleanupScore({
      ...base,
      instructions: ['Chop onions, dice tomatoes, whisk eggs, knead dough, strain sauce'],
    });
    expect(complex).toBeGreaterThan(simple);
  });

  it('adds points for multiple cooking methods', () => {
    const base = {
      ingredients: [{ quantity: 1, unit: 'cup' }],
      cookTime: 30,
      prepTime: 10,
    };
    const singleMethod = calculateCleanupScore({
      ...base,
      instructions: ['Bake at 350F'],
    });
    const multipleMethods = calculateCleanupScore({
      ...base,
      instructions: ['Bake the crust. Boil the filling. Grill the topping.'],
    });
    expect(multipleMethods).toBeGreaterThan(singleMethod);
  });

  it('handles instructions as object with steps property', () => {
    const score = calculateCleanupScore({
      ingredients: [{ quantity: 1, unit: 'cup' }],
      instructions: { steps: ['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5', 'Step 6', 'Step 7'] },
      cookTime: 30,
      prepTime: 15,
    });
    expect(score).toBeGreaterThan(0);
  });

  it('caps score at 10', () => {
    const ingredients = Array.from({ length: 20 }, (_, i) => ({
      quantity: i + 1,
      unit: 'cups',
    }));
    const score = calculateCleanupScore({
      ingredients,
      instructions: Array.from({ length: 15 }, () =>
        'Chop dice mince whisk beat knead roll out strain fry deep fry sauté stir fry blend marinate bake boil grill roast simmer steam'
      ),
      cookTime: 120,
      prepTime: 60,
    });
    expect(score).toBeLessThanOrEqual(10);
  });

  it('rounds to nearest 0.5', () => {
    const score = calculateCleanupScore({
      ingredients: [{ quantity: 1, unit: 'cup' }],
      instructions: ['Cook'],
      cookTime: 10,
      prepTime: 5,
    });
    expect(score * 2).toBe(Math.round(score * 2));
  });
});

describe('getCleanupLabel', () => {
  it('returns Minimal for score <= 2', () => {
    expect(getCleanupLabel(0)).toBe('Minimal');
    expect(getCleanupLabel(2)).toBe('Minimal');
  });

  it('returns Easy for score <= 4', () => {
    expect(getCleanupLabel(3)).toBe('Easy');
    expect(getCleanupLabel(4)).toBe('Easy');
  });

  it('returns Moderate for score <= 6', () => {
    expect(getCleanupLabel(5)).toBe('Moderate');
    expect(getCleanupLabel(6)).toBe('Moderate');
  });

  it('returns Significant for score <= 8', () => {
    expect(getCleanupLabel(7)).toBe('Significant');
    expect(getCleanupLabel(8)).toBe('Significant');
  });

  it('returns Extensive for score > 8', () => {
    expect(getCleanupLabel(9)).toBe('Extensive');
    expect(getCleanupLabel(10)).toBe('Extensive');
  });
});

describe('getCleanupTips', () => {
  it('returns quick cleanup tips for low scores', () => {
    const tips = getCleanupTips(2);
    expect(tips).toContain('Quick cleanup - perfect for busy weeknights');
  });

  it('returns moderate tips for mid scores', () => {
    const tips = getCleanupTips(5);
    expect(tips).toContain('Moderate cleanup - plan 10-15 minutes');
  });

  it('returns extensive tips for high scores', () => {
    const tips = getCleanupTips(8);
    expect(tips).toContain('Significant cleanup - best for weekends');
    expect(tips).toContain('Mise en place recommended');
  });
});
