/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';

/**
 * Submit user feedback
 * POST /api/feedback
 */
export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { page, feedbackType, rating, message, screenshot } = req.body;

    // Validate required fields
    if (!page || !feedbackType || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: page, feedbackType, and message are required',
      });
    }

    // Validate feedback type
    const validTypes = ['bug', 'feature', 'improvement', 'question', 'other'];
    if (!validTypes.includes(feedbackType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback type',
      });
    }

    // Validate rating only if it's provided (not null, not undefined)
    if (rating !== null && rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5',
        });
      }
    }

    const feedback = await prisma.userFeedback.create({
      data: {
        userId,
        page,
        feedbackType,
        rating: rating || null,
        message,
        screenshot: screenshot || null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            familyName: true,
          },
        },
      },
    });

    logger.info(`Feedback submitted by user ${userId} on page ${page}`);

    return res.status(201).json({
      success: true,
      data: feedback,
      message: 'Feedback submitted successfully',
    });
  } catch (error: any) {
    logger.error(`Submit feedback error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
    });
  }
};

/**
 * Get all feedback (admin only)
 * GET /api/feedback
 */
export const getAllFeedback = async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const {
      status,
      feedbackType,
      page,
      limit = '50',
      offset = '0',
    } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (feedbackType) where.feedbackType = feedbackType;
    if (page) where.page = page;

    const [feedback, total] = await Promise.all([
      prisma.userFeedback.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              familyName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.userFeedback.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: feedback,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error: any) {
    logger.error(`Get feedback error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve feedback',
    });
  }
};

/**
 * Get feedback by ID (admin only)
 * GET /api/feedback/:id
 */
export const getFeedbackById = async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const { id } = req.params;
    const feedbackId = Array.isArray(id) ? id[0] : id;

    const feedback = await prisma.userFeedback.findUnique({
      where: { id: feedbackId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            familyName: true,
          },
        },
      },
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (error: any) {
    logger.error(`Get feedback by ID error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve feedback',
    });
  }
};

/**
 * Update feedback status (admin only)
 * PATCH /api/feedback/:id
 */
export const updateFeedbackStatus = async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const { id } = req.params;
    const feedbackId = Array.isArray(id) ? id[0] : id;
    const { status, adminNotes } = req.body;

    // Validate status if provided
    if (status) {
      const validStatuses = ['pending', 'reviewed', 'in_progress', 'resolved', 'wont_fix'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status',
        });
      }
    }

    const feedback = await prisma.userFeedback.update({
      where: { id: feedbackId },
      data: {
        ...(status && { status }),
        ...(adminNotes !== undefined && { adminNotes }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            familyName: true,
          },
        },
      },
    });

    logger.info(`Feedback ${id} updated by admin ${req.user?.id}`);

    return res.status(200).json({
      success: true,
      data: feedback,
      message: 'Feedback updated successfully',
    });
  } catch (error: any) {
    logger.error(`Update feedback error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to update feedback',
    });
  }
};

/**
 * Export feedback to JSON (admin only)
 * GET /api/feedback/export
 */
export const exportFeedback = async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const { status, feedbackType, startDate, endDate } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (feedbackType) where.feedbackType = feedbackType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const feedback = await prisma.userFeedback.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            familyName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=feedback-export-${Date.now()}.json`);

    return res.status(200).json({
      exportDate: new Date().toISOString(),
      totalRecords: feedback.length,
      filters: { status, feedbackType, startDate, endDate },
      feedback,
    });
  } catch (error: any) {
    logger.error(`Export feedback error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to export feedback',
    });
  }
};

/**
 * Get feedback statistics (admin only)
 * GET /api/feedback/stats
 */
export const getFeedbackStats = async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const [
      totalFeedback,
      byStatus,
      byType,
      recentFeedback,
    ] = await Promise.all([
      prisma.userFeedback.count(),
      prisma.userFeedback.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.userFeedback.groupBy({
        by: ['feedbackType'],
        _count: true,
      }),
      prisma.userFeedback.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              familyName: true,
            },
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total: totalFeedback,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
        byType: byType.reduce((acc, item) => {
          acc[item.feedbackType] = item._count;
          return acc;
        }, {} as Record<string, number>),
        recent: recentFeedback,
      },
    });
  } catch (error: any) {
    logger.error(`Get feedback stats error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve feedback statistics',
    });
  }
};

// Made with Bob
