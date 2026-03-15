# Docling Integration Guide

**Copyright (c) 2026 Erik Didriksen. All rights reserved.**

## Overview

This document describes the integration of Docling as the primary document handling and parsing service for the Meal Planner application. Docling provides intelligent document understanding, structure extraction, and content parsing capabilities that are essential for recipe import features.

## What is Docling?

Docling is an advanced document understanding library that combines OCR, layout analysis, and semantic understanding to extract structured information from various document formats including:

- Web pages (HTML)
- PDF documents
- Images (recipe cards, cookbook pages)
- Scanned documents
- Mixed-format documents

## Why Docling as Primary Service?

### Advantages

1. **Unified Document Processing**: Single library handles multiple input types (URLs, PDFs, images)
2. **Intelligent Structure Extraction**: Understands document layout and semantic structure
3. **Context-Aware Parsing**: Recognizes recipe-specific patterns and structures
4. **Multi-Format Support**: Works with web pages, PDFs, and images without separate parsers
5. **Open Source**: No API costs, runs locally, full control over processing
6. **Privacy**: All processing happens on our servers, no third-party data sharing
7. **Customizable**: Can be fine-tuned for recipe-specific extraction

### Use Cases in Meal Planner

1. **URL-Based Recipe Import** (Issue #19)
   - Primary parser for extracting recipes from web pages
   - Handles complex layouts, ads, and clutter automatically
   - Extracts structured recipe data (ingredients, instructions, metadata)

2. **Recipe Card OCR Import** (Issue #18)
   - Primary OCR engine for physical recipe cards
   - Understands recipe card layouts and structure
   - Extracts text with context awareness

3. **PDF Cookbook Import** (Future)
   - Parse recipes from PDF cookbooks
   - Handle multi-page recipes
   - Extract images and formatting

## Architecture

### Multi-Parser Strategy

Docling serves as the **primary parser** in a multi-parser architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     Recipe Import Request                    │
│                  (URL, Image, or PDF)                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    PRIMARY: Docling Parser                   │
│  • Document understanding and structure extraction           │
│  • Layout analysis and semantic parsing                      │
│  • Recipe-specific pattern recognition                       │
│  • Confidence scoring per field                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────┐
                    │  High Confidence? │
                    └─────────────────┘
                       ↓           ↓
                     Yes          No
                       ↓           ↓
              ┌────────────┐  ┌──────────────────────┐
              │   Return   │  │  SECONDARY PARSERS   │
              │   Result   │  │  • recipe-scrapers   │
              └────────────┘  │  • Schema.org parser │
                              │  • Custom parsers    │
                              └──────────────────────┘
                                       ↓
                              ┌──────────────────────┐
                              │  TERTIARY PARSERS    │
                              │  • Google Vision API │
                              │  • AWS Textract      │
                              │  • Tesseract.js      │
                              └──────────────────────┘
                                       ↓
                              ┌──────────────────────┐
                              │  Consensus Algorithm │
                              │  Merge & validate    │
                              └──────────────────────┘
```

### Parser Priority

1. **Primary (Docling)**: 
   - First attempt for all imports
   - Handles 80-90% of cases successfully
   - Provides structured output with confidence scores

2. **Secondary (Specialized)**:
   - recipe-scrapers: For known recipe sites
   - Schema.org parser: For structured data markup
   - Custom parsers: Site-specific extraction

3. **Tertiary (Fallback)**:
   - Cloud OCR services: High accuracy for difficult images
   - Tesseract.js: Free fallback option
   - AI parsing: GPT-4/Claude for complex cases

## Implementation Plan

### Phase 1: Core Integration (Issue #19 - URL Import)

1. **Install Docling**
   ```bash
   cd backend
   pnpm add docling
   ```

2. **Create Docling Service**
   - `backend/src/services/docling.service.ts`
   - Document parsing and structure extraction
   - Recipe-specific field extraction
   - Confidence scoring

3. **URL Import Endpoint**
   - `POST /api/recipes/import/url`
   - Fetch URL content
   - Parse with Docling
   - Return structured recipe data

4. **Review Interface**
   - Display parsed recipe
   - Show confidence scores
   - Allow field editing
   - Re-parse option

### Phase 2: OCR Integration (Issue #18 - Recipe Card Import)

1. **Image Processing**
   - Image upload and validation
   - Preprocessing (rotation, enhancement)
   - Format conversion

2. **Docling OCR**
   - Extract text from images
   - Understand recipe card layout
   - Parse structured data

3. **Multi-Parser Validation**
   - Compare Docling results with cloud OCR
   - Consensus algorithm
   - Confidence scoring

### Phase 3: Advanced Features

1. **Batch Processing**
   - Queue system for multiple imports
   - Progress tracking
   - Error handling

2. **Caching**
   - Cache parsed results by URL/hash
   - Reduce redundant processing
   - Improve performance

3. **Fine-Tuning**
   - Train on recipe-specific patterns
   - Improve accuracy over time
   - Custom extraction rules

## API Design

### URL Import

```typescript
// Request
POST /api/recipes/import/url
{
  "url": "https://example.com/recipe",
  "options": {
    "parser": "docling", // or "auto" for multi-parser
    "includeImages": true,
    "validateNutrition": true
  }
}

// Response
{
  "jobId": "uuid",
  "status": "completed",
  "parser": "docling",
  "confidence": 0.95,
  "recipe": {
    "title": "Chocolate Chip Cookies",
    "description": "Classic homemade cookies",
    "ingredients": [...],
    "instructions": [...],
    "prepTime": 15,
    "cookTime": 12,
    "servings": 24,
    "nutrition": {...},
    "images": [...]
  },
  "metadata": {
    "sourceUrl": "https://example.com/recipe",
    "parsedAt": "2026-03-15T12:00:00Z",
    "parserVersion": "1.0.0"
  }
}
```

### OCR Import

```typescript
// Request
POST /api/recipes/import/ocr
Content-Type: multipart/form-data
{
  "image": <file>,
  "options": {
    "parser": "docling",
    "enhanceImage": true,
    "multiParser": true
  }
}

// Response
{
  "jobId": "uuid",
  "status": "processing",
  "estimatedTime": 30 // seconds
}

// Status Check
GET /api/recipes/import/ocr/:jobId
{
  "jobId": "uuid",
  "status": "completed",
  "parser": "docling",
  "confidence": 0.87,
  "recipe": {...},
  "alternativeParsers": [
    {
      "parser": "google-vision",
      "confidence": 0.92,
      "recipe": {...}
    }
  ]
}
```

## Configuration

### Environment Variables

```bash
# Docling Configuration
DOCLING_ENABLED=true
DOCLING_CACHE_DIR=/app/data/docling-cache
DOCLING_MAX_FILE_SIZE=10485760  # 10MB
DOCLING_TIMEOUT=30000  # 30 seconds

# Multi-Parser Configuration
ENABLE_MULTI_PARSER=true
PARSER_CONFIDENCE_THRESHOLD=0.85
FALLBACK_TO_CLOUD_OCR=true

# Cloud OCR (Fallback)
GOOGLE_VISION_API_KEY=your-key-here
AWS_TEXTRACT_ENABLED=false
```

### Parser Configuration

```typescript
// backend/src/config/parsers.config.ts
export const parserConfig = {
  primary: 'docling',
  fallbackChain: ['recipe-scrapers', 'schema-org', 'google-vision', 'tesseract'],
  confidenceThreshold: 0.85,
  enableMultiParser: true,
  cacheResults: true,
  cacheTTL: 86400, // 24 hours
};
```

## Performance Considerations

### Optimization Strategies

1. **Caching**
   - Cache parsed results by URL hash
   - Cache OCR results by image hash
   - Reduce redundant processing

2. **Queue System**
   - Process imports asynchronously
   - Limit concurrent processing
   - Priority queue for user requests

3. **Resource Management**
   - Set memory limits for Docling
   - Timeout long-running processes
   - Clean up temporary files

4. **Monitoring**
   - Track parser success rates
   - Monitor processing times
   - Alert on failures

### Expected Performance

- **URL Import**: 2-5 seconds average
- **OCR Import**: 10-30 seconds average
- **Batch Import**: 5-10 seconds per recipe
- **Cache Hit**: <100ms

## Error Handling

### Common Errors

1. **Invalid URL**: Return 400 with helpful message
2. **Parsing Failed**: Fall back to secondary parsers
3. **Low Confidence**: Prompt user for manual review
4. **Timeout**: Queue for retry with increased timeout
5. **Rate Limit**: Queue and process later

### Error Response Format

```typescript
{
  "error": {
    "code": "PARSING_FAILED",
    "message": "Unable to extract recipe from URL",
    "details": {
      "parser": "docling",
      "confidence": 0.45,
      "reason": "Insufficient structured data"
    },
    "suggestions": [
      "Try a different URL",
      "Use manual recipe entry",
      "Contact support if issue persists"
    ]
  }
}
```

## Testing Strategy

### Unit Tests

- Test Docling service methods
- Mock document parsing
- Validate output structure

### Integration Tests

- Test full import flow
- Test multi-parser consensus
- Test error handling

### End-to-End Tests

- Import from real URLs
- Import from sample images
- Verify data accuracy

## Security Considerations

1. **Input Validation**
   - Validate URLs before fetching
   - Scan uploaded images for malware
   - Limit file sizes

2. **Rate Limiting**
   - Limit imports per user per hour
   - Prevent abuse of parsing services
   - Queue excessive requests

3. **Data Privacy**
   - Process documents locally
   - Don't store original images long-term
   - Respect robots.txt for URL imports

4. **Content Security**
   - Sanitize extracted HTML
   - Validate extracted URLs
   - Prevent XSS in recipe content

## Future Enhancements

1. **Machine Learning**
   - Fine-tune Docling on recipe corpus
   - Improve accuracy over time
   - Custom recipe pattern recognition

2. **Browser Extension**
   - One-click import from any recipe site
   - Direct integration with Docling
   - Offline parsing capability

3. **Mobile App**
   - Camera integration for recipe cards
   - Real-time OCR preview
   - Offline processing

4. **Collaborative Parsing**
   - User corrections improve parser
   - Community-validated recipes
   - Shared parsing improvements

## Resources

- [Docling Documentation](https://github.com/DS4SD/docling)
- [Recipe Schema.org Specification](https://schema.org/Recipe)
- [recipe-scrapers Library](https://github.com/hhursev/recipe-scrapers)

## Support

For questions or issues with Docling integration:
1. Check this documentation
2. Review ISSUES.md for related issues
3. Check application logs for parsing errors
4. Contact development team

---

**Last Updated**: March 15, 2026  
**Version**: 1.0.0  
**Maintained By**: Development Team