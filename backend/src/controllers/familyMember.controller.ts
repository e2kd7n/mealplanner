/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

/**
 * Extract and validate user ID from request
 */
function getUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }
  return userId;
}

/**
 * @route   GET /api/family-members
 * @desc    Get all family members for the authenticated user
 * @access  Private
 */
export async function getFamilyMembers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getUserId(req);

    const familyMembers = await prisma.familyMember.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json({
      data: familyMembers,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/family-members/:id
 * @desc    Get a specific family member by ID
 * @access  Private
 */
export async function getFamilyMemberById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getUserId(req);
    const { id } = req.params as { id: string };

    const familyMember = await prisma.familyMember.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!familyMember) {
      throw new AppError('Family member not found', 404);
    }

    res.json({
      data: familyMember,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   POST /api/family-members
 * @desc    Add a new family member
 * @access  Private
 */
export async function createFamilyMember(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getUserId(req);
    const { name, ageGroup, canCook, dietaryRestrictions } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new AppError('Name is required', 400);
    }

    if (!ageGroup || !['child', 'teen', 'adult'].includes(ageGroup)) {
      throw new AppError('Valid age group is required (child, teen, adult)', 400);
    }

    // Validate dietary restrictions format
    if (dietaryRestrictions && typeof dietaryRestrictions !== 'object') {
      throw new AppError('Dietary restrictions must be an object', 400);
    }

    const familyMember = await prisma.familyMember.create({
      data: {
        userId,
        name: name.trim(),
        ageGroup,
        canCook: canCook || false,
        dietaryRestrictions: dietaryRestrictions || {},
      },
    });

    logger.info('Family member created', { familyMemberId: familyMember.id, userId });

    res.status(201).json({
      message: 'Family member added successfully',
      data: familyMember,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   PUT /api/family-members/:id
 * @desc    Update a family member
 * @access  Private
 */
export async function updateFamilyMember(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getUserId(req);
    const { id } = req.params as { id: string };
    const { name, ageGroup, canCook, dietaryRestrictions } = req.body;

    // Check if family member exists and belongs to user
    const existingMember = await prisma.familyMember.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingMember) {
      throw new AppError('Family member not found', 404);
    }

    // Validate age group if provided
    if (ageGroup && !['child', 'teen', 'adult'].includes(ageGroup)) {
      throw new AppError('Valid age group is required (child, teen, adult)', 400);
    }

    // Validate name if provided
    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
      throw new AppError('Name must be a non-empty string', 400);
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (ageGroup !== undefined) updateData.ageGroup = ageGroup;
    if (canCook !== undefined) updateData.canCook = canCook;
    if (dietaryRestrictions !== undefined) updateData.dietaryRestrictions = dietaryRestrictions;

    const familyMember = await prisma.familyMember.update({
      where: { id },
      data: updateData,
    });

    logger.info('Family member updated', { familyMemberId: id, userId });

    res.json({
      message: 'Family member updated successfully',
      data: familyMember,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   DELETE /api/family-members/:id
 * @desc    Remove a family member
 * @access  Private
 */
export async function deleteFamilyMember(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getUserId(req);
    const { id } = req.params as { id: string };

    // Check if family member exists and belongs to user
    const existingMember = await prisma.familyMember.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingMember) {
      throw new AppError('Family member not found', 404);
    }

    // Delete family member (cascade will handle related records)
    await prisma.familyMember.delete({
      where: { id },
    });

    logger.info('Family member deleted', { familyMemberId: id, userId });

    res.json({
      message: 'Family member removed successfully',
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getFamilyMembers,
  getFamilyMemberById,
  createFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
};

// Made with Bob