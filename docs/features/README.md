/** Copyright (c) 2026 e2kd7n. All rights reserved. */

# Features Documentation

This directory contains documentation for specific features and integrations in the Meal Planner application.

## Quick Reference

### Common Tasks
- **Set up Spoonacular API**: See [Spoonacular Setup](SPOONACULAR_SETUP.md)
- **Configure recipe scraping**: See [Recipe Scraping](RECIPE_SCRAPING.md)
- **Optimize image caching**: See [Image Caching](IMAGE_CACHING.md)
- **Enable WebSocket collaboration**: See [WebSocket Collaboration](WEBSOCKET_COLLABORATION.md)

## Documentation Files

### [Spoonacular Setup](SPOONACULAR_SETUP.md)
Complete guide for integrating Spoonacular API:
- API key acquisition and setup
- Environment configuration
- Rate limiting and quotas
- API endpoint usage
- Error handling
- Caching strategies
- Cost optimization
- Best practices

**Key Features**:
- Recipe search and discovery
- Ingredient parsing
- Nutritional information
- Recipe recommendations
- Meal planning suggestions

**Configuration**:
```bash
# Required environment variable
SPOONACULAR_API_KEY=your-api-key-here
```

See also: [Spoonacular API Optimization](../SPOONACULAR_API_OPTIMIZATION.md) for performance tuning.

### [Recipe Scraping](RECIPE_SCRAPING.md)
Web scraping functionality for importing recipes:
- Supported recipe websites
- Scraping implementation
- HTML parsing strategies
- Data extraction patterns
- Error handling
- Rate limiting
- Legal considerations
- Best practices

**Supported Sites**:
- AllRecipes
- Food Network
- Serious Eats
- NYT Cooking
- And more...

**Features**:
- Automatic ingredient extraction
- Instruction parsing
- Image downloading
- Metadata extraction
- Duplicate detection

### [Image Caching](IMAGE_CACHING.md)
Image optimization and caching system:
- Image upload and storage
- Automatic resizing and optimization
- CDN integration (if applicable)
- Cache strategies
- Performance optimization
- Storage management
- Cleanup procedures

**Optimization Features**:
- Automatic image compression
- Multiple size variants (thumbnail, medium, full)
- WebP format support
- Lazy loading
- Progressive loading
- Cache headers

**Storage Locations**:
- Local: `data/images/`
- Container: `/mealplanner/data/images/`

### [WebSocket Collaboration](WEBSOCKET_COLLABORATION.md)
Real-time collaboration features:
- WebSocket setup and configuration
- Real-time updates
- Multi-user support
- Conflict resolution
- Connection management
- Error handling
- Security considerations

**Use Cases**:
- Shared meal planning
- Real-time recipe updates
- Collaborative grocery lists
- Live cooking sessions

**Technical Details**:
- WebSocket protocol
- Message format
- Authentication
- Reconnection logic
- Fallback strategies

## Feature Overview

### Recipe Management
- **Create**: Add recipes manually or via import
- **Edit**: Update recipe details, ingredients, instructions
- **Delete**: Remove recipes with confirmation
- **Search**: Full-text search with filters
- **Browse**: Discover recipes via Spoonacular
- **Import**: Scrape recipes from websites

### Meal Planning
- **Calendar View**: Visual meal planning interface
- **Drag & Drop**: Easy meal assignment
- **Meal Types**: Breakfast, lunch, dinner, snack
- **Recurring Meals**: Schedule repeating meals
- **Grocery Lists**: Auto-generate from meal plans

### Image Management
- **Upload**: Support for multiple image formats
- **Optimization**: Automatic compression and resizing
- **Caching**: Efficient image delivery
- **Storage**: Organized file structure
- **Cleanup**: Automatic orphaned image removal

### API Integration
- **Spoonacular**: Recipe discovery and data
- **Recipe Scraping**: Import from websites
- **Nutritional Data**: Via Spoonacular API
- **Image Processing**: Server-side optimization

### Collaboration (Future)
- **Real-time Updates**: WebSocket-based sync
- **Shared Plans**: Multi-user meal planning
- **Permissions**: User access control
- **Notifications**: Real-time alerts

## Feature Configuration

### Environment Variables
```bash
# Spoonacular API
SPOONACULAR_API_KEY=your-api-key

# Image Storage
IMAGE_STORAGE_PATH=/mealplanner/data/images
MAX_IMAGE_SIZE=5242880  # 5MB

# WebSocket (if enabled)
WEBSOCKET_PORT=3001
WEBSOCKET_ENABLED=false

# Recipe Scraping
SCRAPING_ENABLED=true
SCRAPING_RATE_LIMIT=10  # requests per minute
```

### Feature Flags
Some features can be toggled via configuration:
- Recipe scraping (enabled by default)
- Spoonacular integration (requires API key)
- WebSocket collaboration (disabled by default)
- Image optimization (enabled by default)

## Implementation Details

### Recipe Import Flow
1. User provides recipe URL
2. Backend validates URL and checks supported sites
3. Scraper extracts recipe data
4. Data normalized to internal format
5. Images downloaded and optimized
6. Recipe saved to database
7. User notified of success/failure

### Image Processing Pipeline
1. User uploads image
2. Backend validates file type and size
3. Image optimized (compression, format conversion)
4. Multiple sizes generated (thumbnail, medium, full)
5. Images stored in organized directory structure
6. Database updated with image paths
7. Cache headers set for efficient delivery

### Spoonacular Integration
1. User searches for recipes
2. Frontend sends search query to backend
3. Backend queries Spoonacular API with caching
4. Results normalized and returned
5. User can import selected recipes
6. Recipe data saved to local database
7. Images cached locally

## Performance Considerations

### Image Optimization
- Compress images to reduce file size
- Generate multiple sizes for responsive images
- Use WebP format where supported
- Implement lazy loading
- Set appropriate cache headers
- Clean up unused images regularly

### API Rate Limiting
- Cache Spoonacular API responses
- Implement request throttling
- Use batch requests where possible
- Monitor API usage
- Handle rate limit errors gracefully

### Recipe Scraping
- Respect robots.txt
- Implement rate limiting
- Use connection pooling
- Handle timeouts gracefully
- Cache scraped data
- Retry failed requests with backoff

## Security Considerations

### API Keys
- Store API keys securely (see [Secrets Management](../security/SECRETS_MANAGEMENT.md))
- Never expose keys in frontend code
- Rotate keys periodically
- Monitor API usage for anomalies

### Recipe Scraping
- Validate URLs before scraping
- Sanitize scraped content (XSS prevention)
- Respect copyright and terms of service
- Implement rate limiting
- Handle malicious content

### Image Uploads
- Validate file types (whitelist approach)
- Limit file sizes
- Scan for malware (if applicable)
- Sanitize filenames
- Store outside web root
- Set appropriate permissions

### WebSocket Security
- Authenticate connections
- Validate messages
- Implement rate limiting
- Encrypt communications (WSS)
- Handle malicious clients

## Testing Features

### Recipe Import Testing
```bash
# Test recipe scraping
curl -X POST http://localhost:3000/api/recipes/import \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/recipe"}'
```

### Image Upload Testing
```bash
# Test image upload
curl -X POST http://localhost:3000/api/images/upload \
  -F "image=@test-image.jpg"
```

### Spoonacular API Testing
```bash
# Test recipe search
curl "http://localhost:3000/api/recipes/search?q=pasta"
```

## Troubleshooting

### Spoonacular API Issues
**Problem**: API requests failing
**Solutions**:
- Verify API key is set correctly
- Check API quota and rate limits
- Review [Spoonacular Setup](SPOONACULAR_SETUP.md)
- Check network connectivity
- Review API response errors

### Recipe Scraping Issues
**Problem**: Unable to scrape recipes
**Solutions**:
- Verify URL is from supported site
- Check if site structure changed
- Review scraping rate limits
- Check network connectivity
- Review [Recipe Scraping](RECIPE_SCRAPING.md)

### Image Upload Issues
**Problem**: Image uploads failing
**Solutions**:
- Check file size limits
- Verify file type is supported
- Check storage permissions
- Review disk space
- Check [Image Caching](IMAGE_CACHING.md)

### WebSocket Issues
**Problem**: Real-time updates not working
**Solutions**:
- Verify WebSocket is enabled
- Check firewall rules
- Review connection logs
- Test WebSocket endpoint
- Check [WebSocket Collaboration](WEBSOCKET_COLLABORATION.md)

## Related Documentation

### Infrastructure
- [Performance Optimization](../infrastructure/PERFORMANCE_OPTIMIZATION.md) - Performance tuning
- [Monitoring](../infrastructure/MONITORING.md) - System monitoring

### Security
- [Secrets Management](../security/SECRETS_MANAGEMENT.md) - API key storage

### Development
- [Setup Guide](../development/SETUP.md) - Development environment
- [Workflow Guide](../development/WORKFLOW_GUIDE.md) - Development process

### Root Documentation
- [Spoonacular API Optimization](../SPOONACULAR_API_OPTIMIZATION.md) - API performance
- [Image Optimization](../IMAGE_OPTIMIZATION.md) - Image processing details

## Future Features

### Planned Enhancements
- [ ] Advanced recipe recommendations
- [ ] Meal plan templates
- [ ] Shopping list optimization
- [ ] Nutritional tracking
- [ ] Recipe scaling
- [ ] Ingredient substitutions
- [ ] Voice commands
- [ ] Mobile app integration

### Under Consideration
- Recipe video support
- Social sharing features
- Recipe collections/cookbooks
- Advanced search filters
- Recipe ratings and reviews
- Cooking timers
- Step-by-step cooking mode

## Best Practices

### Feature Development
1. **Document thoroughly** - Update feature docs
2. **Test extensively** - Unit, integration, E2E tests
3. **Consider performance** - Optimize from the start
4. **Security first** - Review security implications
5. **User feedback** - Gather and incorporate feedback
6. **Iterate** - Continuous improvement
7. **Monitor** - Track feature usage and errors

### API Integration
1. **Cache aggressively** - Reduce API calls
2. **Handle errors gracefully** - Provide fallbacks
3. **Monitor usage** - Track quotas and costs
4. **Rate limit** - Respect API limits
5. **Document** - Keep integration docs updated
6. **Test** - Verify API changes don't break features
7. **Secure** - Protect API keys

### Image Handling
1. **Optimize always** - Compress and resize
2. **Generate variants** - Multiple sizes for responsive
3. **Cache effectively** - Set appropriate headers
4. **Clean up** - Remove unused images
5. **Validate** - Check file types and sizes
6. **Secure** - Prevent malicious uploads
7. **Monitor** - Track storage usage

---

[← Back to Documentation Hub](../README.md)

// Made with Bob