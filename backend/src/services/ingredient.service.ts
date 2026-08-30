/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Prisma, IngredientCategory } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

/**
 * Find an ingredient by id or name, creating it if no match exists.
 *
 * Returns the ingredient's own default unit alongside its id so callers can
 * fall back to it when a caller omits a unit (quick ingredient entry, issue
 * #328; ad-hoc grocery item entry, issue #357 — neither requires quantity/unit
 * up front).
 *
 * `category`/`estimatedPrice` only apply when a new `Ingredient` row is being
 * created — callers that omit them get today's existing defaults
 * (`category: 'other'`, `averagePrice: 0`), so recipe authoring's two call
 * sites are unaffected by adding these params.
 */
export async function findOrCreateIngredient(
  ingredientId: string | undefined,
  ingredientName: string,
  unit: string | undefined,
  category?: IngredientCategory,
  estimatedPrice?: number
): Promise<{ id: string; unit: string }> {
  // Validate ingredient name
  if (!ingredientName || typeof ingredientName !== 'string' || ingredientName.trim() === '') {
    throw new AppError('Ingredient name is required and must be a non-empty string', 400);
  }

  const trimmedName = ingredientName.trim();

  // If we have an ID, verify it exists before using it
  if (ingredientId) {
    const existingIngredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
    });

    if (existingIngredient) {
      return { id: existingIngredient.id, unit: existingIngredient.unit };
    }

    // If ID provided but doesn't exist, log warning and fall through to create/find by name
    logger.warn(`Ingredient ID ${ingredientId} not found, searching by name: ${trimmedName}`);
  }

  // Concurrent callers resolving the same ingredient name can otherwise both
  // pass the findFirst below and race on create (issue #369): same-cased
  // names collide on the DB unique constraint (handled below via the P2002
  // catch), but differently-cased names ("Paper Towels" vs "paper towels")
  // don't collide at all, silently producing duplicate rows. A
  // transaction-scoped advisory lock keyed on the case-normalized name
  // serializes concurrent resolution of the same logical ingredient; it's
  // held only for the duration of this transaction and auto-released on
  // commit/rollback.
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${trimmedName.toLowerCase()}))`;

    let ingredient = await tx.ingredient.findFirst({
      where: { name: { equals: trimmedName, mode: 'insensitive' } },
    });

    if (!ingredient) {
      logger.info(`Creating new ingredient: ${trimmedName}`);
      try {
        ingredient = await tx.ingredient.create({
          data: {
            name: trimmedName,
            category: category ?? 'other',
            seasonalMonths: [],
            averagePrice: estimatedPrice ?? 0,
            unit: unit || 'unit',
            allergens: [],
          },
        });
      } catch (error) {
        // The advisory lock above should make this unreachable now, but
        // keep it as a defensive fallback rather than trusting that.
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          const winner = await tx.ingredient.findFirst({
            where: { name: { equals: trimmedName, mode: 'insensitive' } },
          });
          if (!winner) throw error;
          ingredient = winner;
        } else {
          throw error;
        }
      }
    }

    return { id: ingredient.id, unit: ingredient.unit };
  });
}
