/** Copyright (c) 2026 e2kd7n. All rights reserved. */

# Design Documentation

This directory contains all design, accessibility, and user experience documentation for the Meal Planner application.

## Quick Reference

### Common Tasks
- **Review design principles**: See [Design Principles](DESIGN_PRINCIPLES.md)
- **Check accessibility**: See [ARIA Accessibility](ARIA_ACCESSIBILITY.md)
- **Verify WCAG compliance**: See [WCAG Compliance](WCAG_COMPLIANCE.md)
- **Implement keyboard navigation**: See [Keyboard Navigation](KEYBOARD_NAVIGATION.md)
- **Plan UI enhancements**: See [UI/UX Enhancements](UIUX_ENHANCEMENTS.md)

## Documentation Files

### [Design Principles](DESIGN_PRINCIPLES.md)
Core design principles and standards:
- User CRUD authority - Full control over user data
- Consistency and predictability - Uniform behavior across app
- Accessibility first - WCAG AA minimum compliance
- Error prevention and recovery - Validation and confirmations
- Visual hierarchy and clarity - Clear information architecture
- Responsive design - Mobile-first approach
- Performance considerations - Optimized user experience

**Key Principles**:
- Users must have full Create, Read, Update, Delete control
- Similar actions work the same way throughout app
- Semantic HTML structure required
- Keyboard navigation support mandatory
- Clear error messages with actionable guidance

### [ARIA Accessibility](ARIA_ACCESSIBILITY.md)
ARIA (Accessible Rich Internet Applications) implementation:
- ARIA labels for interactive elements
- ARIA roles for semantic structure
- ARIA states and properties
- Screen reader support
- Focus management
- Live regions for dynamic content
- Best practices for ARIA usage

**Implementation Guidelines**:
- Use semantic HTML first, ARIA second
- Label all interactive elements
- Provide text alternatives for images
- Ensure proper focus order
- Test with screen readers

### [WCAG Compliance](WCAG_COMPLIANCE.md)
Web Content Accessibility Guidelines compliance:
- WCAG 2.1 Level AA compliance (minimum)
- Color contrast requirements (4.5:1 for normal text)
- Text alternatives for non-text content
- Keyboard accessibility
- Time limits and animations
- Seizure prevention
- Navigation and structure
- Input assistance

**Compliance Checklist**:
- Color contrast meets AA standards
- All functionality keyboard accessible
- Form inputs have labels
- Error messages are clear
- Focus indicators visible
- No keyboard traps

### [Keyboard Navigation](KEYBOARD_NAVIGATION.md)
Comprehensive keyboard navigation support:
- Tab order and focus management
- Keyboard shortcuts
- Skip links for main content
- Modal and dialog navigation
- Form navigation
- Custom component keyboard support
- Focus indicators

**Key Shortcuts**:
- `Tab` - Navigate forward
- `Shift+Tab` - Navigate backward
- `Enter` - Activate buttons/links
- `Space` - Toggle checkboxes
- `Esc` - Close modals/dialogs
- `Arrow keys` - Navigate lists/menus

### [UI/UX Enhancements](UIUX_ENHANCEMENTS.md)
Planned and implemented UI/UX improvements:
- User feedback and iterations
- Design system evolution
- Component improvements
- Interaction patterns
- Visual refinements
- Performance optimizations
- Mobile experience enhancements

### [Epic Visual Refresh](EPIC_VISUAL_REFRESH.md)
Major visual redesign documentation:
- Design system overhaul
- Component library updates
- Color palette refinement
- Typography improvements
- Spacing and layout updates
- Animation and transitions
- Dark mode support (if applicable)

## Design System

### Color Palette
- **Primary**: Brand colors for main actions
- **Secondary**: Supporting colors for secondary actions
- **Neutral**: Grays for text and backgrounds
- **Semantic**: Success, warning, error, info colors
- **Contrast**: All colors meet WCAG AA standards (4.5:1 minimum)

### Typography
- **Font Family**: System fonts for performance
- **Font Sizes**: Responsive scale (16px base minimum)
- **Line Height**: 1.5 minimum for body text
- **Font Weight**: Regular (400) and bold (700) minimum
- **Readability**: Maximum line length ~70 characters

### Spacing
- **Base Unit**: 8px grid system
- **Consistent Spacing**: Multiples of base unit (8, 16, 24, 32, 40, 48)
- **Component Padding**: Adequate touch targets (44x44px minimum)
- **Whitespace**: Generous spacing for clarity

### Components
- **Buttons**: Clear hierarchy (primary, secondary, tertiary)
- **Forms**: Labeled inputs with validation
- **Modals**: Accessible dialogs with focus management
- **Navigation**: Clear structure with breadcrumbs
- **Cards**: Consistent layout and spacing
- **Tables**: Responsive with proper headers

## Accessibility Standards

### WCAG 2.1 Level AA Requirements
1. **Perceivable**
   - Text alternatives for images
   - Captions for audio/video
   - Adaptable content structure
   - Distinguishable colors and contrast

2. **Operable**
   - Keyboard accessible
   - Sufficient time for interactions
   - No seizure-inducing content
   - Navigable structure

3. **Understandable**
   - Readable text
   - Predictable behavior
   - Input assistance

4. **Robust**
   - Compatible with assistive technologies
   - Valid HTML
   - Proper ARIA usage

### Testing Checklist
- [ ] Color contrast meets 4.5:1 ratio
- [ ] All interactive elements keyboard accessible
- [ ] Screen reader announces content correctly
- [ ] Focus indicators visible
- [ ] Form labels associated with inputs
- [ ] Error messages clear and actionable
- [ ] No keyboard traps
- [ ] Skip links work correctly
- [ ] Headings in logical order
- [ ] Images have alt text

## Design Workflow

### Design Process
1. **Research** - User needs and pain points
2. **Ideation** - Brainstorm solutions
3. **Wireframes** - Low-fidelity layouts
4. **Mockups** - High-fidelity designs
5. **Prototype** - Interactive prototypes
6. **Testing** - User testing and feedback
7. **Implementation** - Development
8. **Iteration** - Continuous improvement

### Design Reviews
- Review against [Design Principles](DESIGN_PRINCIPLES.md)
- Check [WCAG Compliance](WCAG_COMPLIANCE.md)
- Verify [Keyboard Navigation](KEYBOARD_NAVIGATION.md)
- Test with screen readers
- Validate color contrast
- Review responsive behavior

### User Testing
- Conduct usability testing
- Gather user feedback
- Document findings
- Prioritize improvements
- Iterate on designs
- See [User Testing](../usertesting/) for reports

## Common Design Patterns

### Confirmation Dialogs
- Used for destructive actions (delete, remove)
- Clear action description
- Primary action (confirm) and secondary action (cancel)
- Keyboard accessible (Enter/Esc)
- Focus management

### Form Validation
- Inline validation on blur
- Clear error messages
- Error summary at top of form
- Success feedback
- Disabled submit until valid

### Loading States
- Skeleton screens for content loading
- Spinners for actions
- Progress indicators for long operations
- Optimistic updates where appropriate

### Empty States
- Clear messaging
- Call-to-action button
- Helpful guidance
- Visual illustration (optional)

### Error States
- Clear error message
- Actionable guidance
- Retry option
- Contact support link (if applicable)

## Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile-First Approach
- Design for mobile first
- Progressive enhancement for larger screens
- Touch-friendly targets (44x44px minimum)
- Simplified navigation on mobile
- Optimized images for mobile

### Testing Devices
- iPhone (various models)
- Android phones (various models)
- iPad
- Android tablets
- Desktop browsers (Chrome, Firefox, Safari, Edge)

## Related Documentation

### User Testing
- [User Testing Overview](../usertesting/V1.1_TESTING_OVERVIEW.md) - Testing methodology
- [Feedback Collection Guide](../usertesting/FEEDBACK_COLLECTION_PM_GUIDE.md) - Gathering feedback
- [UAT Findings](../usertesting/MEAL_PLANNER_SEARCH_UAT_FINDINGS.md) - User testing results

### Development
- [Setup Guide](../development/SETUP.md) - Development environment
- [Workflow Guide](../development/WORKFLOW_GUIDE.md) - Development process

### Architecture
- [Architecture Overview](../ARCHITECTURE.md) - System architecture
- [Design UX Evaluation](../DESIGN_UX_EVALUATION_REPORT.md) - Comprehensive evaluation

## Design Tools

### Recommended Tools
- **Figma** - Design and prototyping
- **Contrast Checker** - WCAG contrast validation
- **Screen Readers** - NVDA, JAWS, VoiceOver
- **Browser DevTools** - Accessibility audits
- **Lighthouse** - Performance and accessibility

### Browser Extensions
- **axe DevTools** - Accessibility testing
- **WAVE** - Web accessibility evaluation
- **Color Contrast Analyzer** - Contrast checking
- **Responsive Viewer** - Multi-device preview

## Best Practices

### Design
1. **Follow design principles** - Consistency is key
2. **Design for accessibility** - WCAG AA minimum
3. **Test with real users** - Regular user testing
4. **Iterate based on feedback** - Continuous improvement
5. **Document decisions** - Keep design docs updated
6. **Use design system** - Consistent components
7. **Consider performance** - Optimize for speed

### Accessibility
1. **Semantic HTML first** - Use proper elements
2. **ARIA when needed** - Enhance, don't replace
3. **Test with keyboard** - All functionality accessible
4. **Test with screen readers** - Verify announcements
5. **Check color contrast** - Meet WCAG standards
6. **Provide alternatives** - Text for images, captions for video
7. **Focus management** - Clear focus indicators

### Implementation
1. **Mobile-first** - Start with smallest screen
2. **Progressive enhancement** - Add features for larger screens
3. **Performance matters** - Optimize images and code
4. **Test across devices** - Multiple browsers and devices
5. **Validate HTML** - Proper structure
6. **Review accessibility** - Regular audits
7. **Document components** - Clear usage guidelines

---

[← Back to Documentation Hub](../README.md)

// Made with Bob