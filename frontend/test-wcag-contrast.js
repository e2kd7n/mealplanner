/**
 * WCAG Color Contrast Verification Test
 * Tests that all theme colors meet WCAG AA standards (4.5:1 for normal text)
 */

// Color contrast calculation using relative luminance
function getLuminance(hexColor) {
  const rgb = hexColor.match(/[A-Za-z0-9]{2}/g).map(v => parseInt(v, 16) / 255);
  const [r, g, b] = rgb.map(val => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Theme colors from frontend/src/theme.ts
const themeColors = {
  primary: {
    main: '#2E7D32',
    light: '#2E7D32',
    dark: '#1B5E20',
  },
  secondary: {
    main: '#C62828',
    light: '#D32F2F',
    dark: '#BF360C',
  },
  error: {
    main: '#D32F2F',
  },
  warning: {
    main: '#C62828',
  },
  info: {
    main: '#0277BD',
  },
  success: {
    main: '#2E7D32',
  },
};

const backgroundColor = '#FFFFFF';
const WCAG_AA_NORMAL = 4.5;
const WCAG_AA_LARGE = 3.0;

console.log('='.repeat(70));
console.log('WCAG AA Color Contrast Verification');
console.log('='.repeat(70));
console.log(`Background: ${backgroundColor}`);
console.log(`WCAG AA Requirements: Normal text ≥ ${WCAG_AA_NORMAL}:1, Large text ≥ ${WCAG_AA_LARGE}:1`);
console.log('='.repeat(70));

let allPassed = true;
const results = [];

// Test all colors against white background
Object.entries(themeColors).forEach(([category, colors]) => {
  Object.entries(colors).forEach(([shade, color]) => {
    const ratio = getContrastRatio(color, backgroundColor);
    const passes = ratio >= WCAG_AA_NORMAL;
    const status = passes ? '✅ PASS' : '❌ FAIL';
    
    if (!passes) allPassed = false;
    
    results.push({
      category,
      shade,
      color,
      ratio: ratio.toFixed(2),
      status,
      passes
    });
  });
});

// Display results
results.forEach(({ category, shade, color, ratio, status }) => {
  console.log(`${status} ${category}.${shade.padEnd(6)} ${color} - ${ratio}:1`);
});

console.log('='.repeat(70));

if (allPassed) {
  console.log('✅ ALL COLORS PASS WCAG AA STANDARDS');
  console.log('All theme colors meet the 4.5:1 contrast ratio requirement.');
} else {
  console.log('❌ SOME COLORS FAIL WCAG AA STANDARDS');
  console.log('The following colors need adjustment:');
  results.filter(r => !r.passes).forEach(({ category, shade, color, ratio }) => {
    const needed = (WCAG_AA_NORMAL - parseFloat(ratio)).toFixed(2);
    console.log(`  - ${category}.${shade} (${color}): ${ratio}:1 (needs +${needed})`);
  });
  process.exit(1);
}

console.log('='.repeat(70));
console.log('Test completed successfully!');
process.exit(0);

// Made with Bob
