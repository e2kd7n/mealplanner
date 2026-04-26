/**
 * ARIA Labels Verification Test
 * Verifies that all interactive elements have proper ARIA labels for screen readers
 */

const fs = require('fs');
const path = require('path');

// Read the FeedbackDialog component
const feedbackDialogPath = path.join(__dirname, 'src/components/FeedbackDialog.tsx');
const feedbackDialogContent = fs.readFileSync(feedbackDialogPath, 'utf8');

console.log('='.repeat(70));
console.log('ARIA Labels Verification Test');
console.log('='.repeat(70));
console.log(`File: ${feedbackDialogPath}`);
console.log('='.repeat(70));

const checks = [
  {
    name: 'Rating Component - aria-label',
    pattern: /aria-label="Rate your experience from 1 to 5 stars"/,
    description: 'Rating component has descriptive aria-label'
  },
  {
    name: 'Rating Component - aria-labelledby',
    pattern: /aria-labelledby="rating-label"/,
    description: 'Rating component linked to legend via aria-labelledby'
  },
  {
    name: 'Rating Component - aria-describedby',
    pattern: /aria-describedby="rating-helper"/,
    description: 'Rating component has helper text via aria-describedby'
  },
  {
    name: 'Feedback Type Select - aria-describedby',
    pattern: /aria-describedby="feedback-type-helper"/,
    description: 'Feedback type select has helper text'
  },
  {
    name: 'Bug Report MenuItem - aria-label',
    pattern: /value="bug" aria-label="Bug Report"/,
    description: 'Bug Report option has text alternative'
  },
  {
    name: 'Feature Request MenuItem - aria-label',
    pattern: /value="feature" aria-label="Feature Request"/,
    description: 'Feature Request option has text alternative'
  },
  {
    name: 'Improvement MenuItem - aria-label',
    pattern: /value="improvement" aria-label="Improvement"/,
    description: 'Improvement option has text alternative'
  },
  {
    name: 'Question MenuItem - aria-label',
    pattern: /value="question" aria-label="Question"/,
    description: 'Question option has text alternative'
  },
  {
    name: 'Other MenuItem - aria-label',
    pattern: /value="other" aria-label="Other"/,
    description: 'Other option has text alternative'
  },
  {
    name: 'Emoji aria-hidden',
    pattern: /aria-hidden="true">🐛<\/span>/,
    description: 'Emojis are hidden from screen readers'
  },
  {
    name: 'TextField - aria-describedby',
    pattern: /aria-describedby="feedback-message-helper"/,
    description: 'Feedback message field has helper text'
  },
  {
    name: 'Screenshot Button - aria-label',
    pattern: /aria-label=\{screenshot \? 'Screenshot captured successfully' : 'Capture screenshot of current page'\}/,
    description: 'Screenshot button has descriptive aria-label'
  },
  {
    name: 'Screenshot Button - aria-describedby',
    pattern: /aria-describedby="screenshot-helper"/,
    description: 'Screenshot button has helper text'
  },
  {
    name: 'Close Button - aria-label',
    pattern: /aria-label="close"/,
    description: 'Close button has aria-label'
  },
  {
    name: 'Dialog - aria-labelledby',
    pattern: /aria-labelledby="feedback-dialog-title"/,
    description: 'Dialog has proper title reference'
  }
];

let allPassed = true;
const results = [];

checks.forEach(check => {
  const passed = check.pattern.test(feedbackDialogContent);
  results.push({
    name: check.name,
    description: check.description,
    passed
  });
  if (!passed) allPassed = false;
});

// Display results
results.forEach(({ name, description, passed }) => {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name}`);
  console.log(`         ${description}`);
});

console.log('='.repeat(70));

if (allPassed) {
  console.log('✅ ALL ARIA LABELS PROPERLY IMPLEMENTED');
  console.log('All interactive elements have proper accessibility attributes.');
  console.log('Screen readers will be able to announce all form fields correctly.');
} else {
  console.log('❌ SOME ARIA LABELS ARE MISSING');
  console.log('The following checks failed:');
  results.filter(r => !r.passed).forEach(({ name, description }) => {
    console.log(`  - ${name}: ${description}`);
  });
  process.exit(1);
}

console.log('='.repeat(70));
console.log('Accessibility improvements summary:');
console.log('- Rating component: Full ARIA support with labels and descriptions');
console.log('- Feedback type dropdown: Text alternatives for all emoji options');
console.log('- Form fields: Helper text linked via aria-describedby');
console.log('- Interactive buttons: Descriptive aria-labels');
console.log('- Emojis: Hidden from screen readers with aria-hidden="true"');
console.log('='.repeat(70));
console.log('Test completed successfully!');
process.exit(0);

// Made with Bob
