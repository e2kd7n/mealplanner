/**
 * WCAG 2.1 Color Contrast Checker
 * Verifies color combinations meet accessibility standards
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format');
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 */
export function meetsWCAG_AA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): { passes: boolean; ratio: number; required: number } {
  const ratio = getContrastRatio(foreground, background);
  const required = isLargeText ? 3.0 : 4.5;
  
  return {
    passes: ratio >= required,
    ratio: Math.round(ratio * 100) / 100,
    required,
  };
}

/**
 * Check if contrast ratio meets WCAG AAA standards
 */
export function meetsWCAG_AAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): { passes: boolean; ratio: number; required: number } {
  const ratio = getContrastRatio(foreground, background);
  const required = isLargeText ? 4.5 : 7.0;
  
  return {
    passes: ratio >= required,
    ratio: Math.round(ratio * 100) / 100,
    required,
  };
}

/**
 * Verify theme colors meet WCAG standards
 */
export function verifyThemeContrast() {
  const results = {
    primary: {
      main: meetsWCAG_AA('#2E7D32', '#FFFFFF'),
      dark: meetsWCAG_AA('#1B5E20', '#FFFFFF'),
      light: meetsWCAG_AA('#4CAF50', '#FFFFFF'),
    },
    secondary: {
      main: meetsWCAG_AA('#E65100', '#FFFFFF'),
      dark: meetsWCAG_AA('#BF360C', '#FFFFFF'),
      light: meetsWCAG_AA('#FF6F00', '#FFFFFF'),
    },
    error: meetsWCAG_AA('#D32F2F', '#FFFFFF'),
    warning: meetsWCAG_AA('#E65100', '#FFFFFF'),
    info: meetsWCAG_AA('#0277BD', '#FFFFFF'),
    success: meetsWCAG_AA('#2E7D32', '#FFFFFF'),
    text: {
      onBackground: meetsWCAG_AA('#000000', '#F5F5F5'),
      onPaper: meetsWCAG_AA('#000000', '#FFFFFF'),
    },
  };

  return results;
}

/**
 * Log contrast verification results to console (dev only)
 */
export function logContrastResults() {
  if (import.meta.env.DEV) {
    const results = verifyThemeContrast();
    console.group('🎨 WCAG Contrast Verification');
    
    Object.entries(results).forEach(([category, value]) => {
      if (typeof value === 'object' && 'passes' in value) {
        const icon = value.passes ? '✅' : '❌';
        console.log(`${icon} ${category}: ${value.ratio}:1 (required: ${value.required}:1)`);
      } else {
        console.group(category);
        Object.entries(value).forEach(([variant, result]) => {
          if ('passes' in result) {
            const icon = result.passes ? '✅' : '❌';
            console.log(`${icon} ${variant}: ${result.ratio}:1 (required: ${result.required}:1)`);
          }
        });
        console.groupEnd();
      }
    });
    
    console.groupEnd();
  }
}

// Made with Bob