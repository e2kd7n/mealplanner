/**
 * Script to analyze user feedback and client logs
 * Generates insights for GitHub issue creation
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeFeedbackAndLogs() {
  console.log('=== Analyzing User Feedback and System Logs ===\n');

  try {
    // 1. Get all user feedback
    console.log('1. Fetching user feedback...');
    const feedback = await prisma.userFeedback.findMany({
      include: {
        user: {
          select: {
            email: true,
            familyName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`   Found ${feedback.length} feedback entries\n`);

    // 2. Get client logs (errors and warnings)
    console.log('2. Fetching client logs (errors and warnings)...');
    const clientLogs = await prisma.clientLog.findMany({
      where: {
        OR: [
          { level: 'error' },
          { level: 'warn' },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 500, // Last 500 errors/warnings
    });

    console.log(`   Found ${clientLogs.length} error/warning logs\n`);

    // 3. Analyze feedback by type
    console.log('3. Feedback Analysis:');
    const feedbackByType = feedback.reduce((acc, fb) => {
      acc[fb.feedbackType] = (acc[fb.feedbackType] || 0) + 1;
      return acc;
    }, {});

    console.log('   By Type:');
    Object.entries(feedbackByType).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });

    const feedbackByStatus = feedback.reduce((acc, fb) => {
      acc[fb.status] = (acc[fb.status] || 0) + 1;
      return acc;
    }, {});

    console.log('\n   By Status:');
    Object.entries(feedbackByStatus).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });

    // 4. Analyze feedback by page
    console.log('\n4. Feedback by Page:');
    const feedbackByPage = feedback.reduce((acc, fb) => {
      acc[fb.page] = (acc[fb.page] || 0) + 1;
      return acc;
    }, {});

    Object.entries(feedbackByPage)
      .sort((a, b) => b[1] - a[1])
      .forEach(([page, count]) => {
        console.log(`   - ${page}: ${count}`);
      });

    // 5. Analyze error patterns
    console.log('\n5. Error Log Analysis:');
    const errorsByContext = clientLogs
      .filter(log => log.level === 'error')
      .reduce((acc, log) => {
        const ctx = log.context || 'Unknown';
        acc[ctx] = (acc[ctx] || 0) + 1;
        return acc;
      }, {});

    console.log('   Errors by Context:');
    Object.entries(errorsByContext)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([context, count]) => {
        console.log(`   - ${context}: ${count}`);
      });

    // 6. Find most common error messages
    console.log('\n6. Most Common Error Messages:');
    const errorMessages = clientLogs
      .filter(log => log.level === 'error')
      .reduce((acc, log) => {
        const msg = log.message.substring(0, 100);
        acc[msg] = (acc[msg] || 0) + 1;
        return acc;
      }, {});

    Object.entries(errorMessages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([message, count]) => {
        console.log(`   - [${count}x] ${message}`);
      });

    // 7. Analyze warnings
    console.log('\n7. Warning Analysis:');
    const warningsByContext = clientLogs
      .filter(log => log.level === 'warn')
      .reduce((acc, log) => {
        const ctx = log.context || 'Unknown';
        acc[ctx] = (acc[ctx] || 0) + 1;
        return acc;
      }, {});

    console.log('   Warnings by Context:');
    Object.entries(warningsByContext)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([context, count]) => {
        console.log(`   - ${context}: ${count}`);
      });

    // 8. Detailed feedback review
    console.log('\n8. Detailed Feedback Review:');
    console.log('   ===========================\n');

    const pendingFeedback = feedback.filter(fb => fb.status === 'pending');
    console.log(`   Pending Feedback (${pendingFeedback.length}):\n`);

    pendingFeedback.forEach((fb, idx) => {
      console.log(`   ${idx + 1}. [${fb.feedbackType.toUpperCase()}] ${fb.page}`);
      console.log(`      User: ${fb.user.familyName} (${fb.user.email})`);
      console.log(`      Date: ${fb.createdAt.toISOString()}`);
      if (fb.rating) console.log(`      Rating: ${fb.rating}/5`);
      console.log(`      Message: ${fb.message}`);
      console.log('');
    });

    // 9. Generate recommendations
    console.log('\n9. Recommendations for GitHub Issues:');
    console.log('   ====================================\n');

    const recommendations = [];

    // Check for high-frequency errors
    Object.entries(errorsByContext)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([context, count]) => {
        if (count > 5) {
          recommendations.push({
            type: 'bug',
            priority: 'high',
            title: `Fix recurring errors in ${context}`,
            description: `${count} errors detected in ${context} context. Investigate and fix root cause.`,
          });
        }
      });

    // Check for feature requests
    const featureRequests = feedback.filter(fb => fb.feedbackType === 'feature');
    if (featureRequests.length > 0) {
      const featuresByPage = featureRequests.reduce((acc, fb) => {
        acc[fb.page] = acc[fb.page] || [];
        acc[fb.page].push(fb.message);
        return acc;
      }, {});

      Object.entries(featuresByPage).forEach(([page, messages]) => {
        recommendations.push({
          type: 'feature',
          priority: 'medium',
          title: `Feature requests for ${page}`,
          description: `${messages.length} feature request(s):\n${messages.map((m, i) => `${i + 1}. ${m}`).join('\n')}`,
        });
      });
    }

    // Check for improvement suggestions
    const improvements = feedback.filter(fb => fb.feedbackType === 'improvement');
    if (improvements.length > 0) {
      const improvementsByPage = improvements.reduce((acc, fb) => {
        acc[fb.page] = acc[fb.page] || [];
        acc[fb.page].push(fb.message);
        return acc;
      }, {});

      Object.entries(improvementsByPage).forEach(([page, messages]) => {
        recommendations.push({
          type: 'enhancement',
          priority: 'medium',
          title: `Improvements for ${page}`,
          description: `${messages.length} improvement suggestion(s):\n${messages.map((m, i) => `${i + 1}. ${m}`).join('\n')}`,
        });
      });
    }

    // Check for bugs
    const bugs = feedback.filter(fb => fb.feedbackType === 'bug');
    if (bugs.length > 0) {
      bugs.forEach(bug => {
        recommendations.push({
          type: 'bug',
          priority: 'high',
          title: `Bug reported: ${bug.page}`,
          description: `User: ${bug.user.familyName}\nMessage: ${bug.message}\nDate: ${bug.createdAt.toISOString()}`,
        });
      });
    }

    // Check for performance issues
    const perfWarnings = clientLogs.filter(
      log => log.level === 'warn' && (log.context === 'Performance' || log.message.includes('slow'))
    );
    if (perfWarnings.length > 10) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: 'Performance optimization needed',
        description: `${perfWarnings.length} performance warnings detected. Review and optimize slow operations.`,
      });
    }

    recommendations.forEach((rec, idx) => {
      console.log(`   ${idx + 1}. [${rec.priority.toUpperCase()}] [${rec.type}] ${rec.title}`);
      console.log(`      ${rec.description.split('\n').join('\n      ')}`);
      console.log('');
    });

    // 10. Export data for issue creation
    console.log('\n10. Exporting data for GitHub issue creation...');
    const exportData = {
      summary: {
        totalFeedback: feedback.length,
        totalErrors: clientLogs.filter(l => l.level === 'error').length,
        totalWarnings: clientLogs.filter(l => l.level === 'warn').length,
        pendingFeedback: pendingFeedback.length,
      },
      feedbackByType,
      feedbackByStatus,
      feedbackByPage,
      errorsByContext,
      warningsByContext,
      recommendations,
      detailedFeedback: pendingFeedback.map(fb => ({
        id: fb.id,
        type: fb.feedbackType,
        page: fb.page,
        rating: fb.rating,
        message: fb.message,
        user: fb.user.familyName,
        date: fb.createdAt.toISOString(),
      })),
      topErrors: Object.entries(errorMessages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([message, count]) => ({ message, count })),
    };

    const fs = require('fs');
    fs.writeFileSync(
      'feedback-analysis.json',
      JSON.stringify(exportData, null, 2)
    );
    console.log('   ✓ Data exported to feedback-analysis.json\n');

    console.log('=== Analysis Complete ===\n');
    console.log(`Summary:`);
    console.log(`- Total Feedback: ${feedback.length}`);
    console.log(`- Pending Feedback: ${pendingFeedback.length}`);
    console.log(`- Total Errors: ${clientLogs.filter(l => l.level === 'error').length}`);
    console.log(`- Total Warnings: ${clientLogs.filter(l => l.level === 'warn').length}`);
    console.log(`- Recommendations: ${recommendations.length}`);

  } catch (error) {
    console.error('Error analyzing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeFeedbackAndLogs();

// Made with Bob
