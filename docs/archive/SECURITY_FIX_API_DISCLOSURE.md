# Security Fix: API Endpoint Information Disclosure

## Issue Summary
**Vulnerability**: CWE-200 - Exposure of Sensitive Information to an Unauthorized Actor  
**Severity**: Medium  
**Location**: [`backend/src/index.ts:72-93`](backend/src/index.ts:72)  
**Date Fixed**: 2026-03-23

## Vulnerability Description

The root endpoint (`/`) was exposing a complete map of all API endpoints without requiring authentication, including:
- All API route paths
- Application version number
- Administrative endpoint locations
- Complete attack surface mapping

This information disclosure vulnerability allowed attackers to:
1. Instantly discover all API endpoints without probing
2. Identify high-value targets (admin endpoints)
3. Research version-specific vulnerabilities
4. Automate attacks against the entire API surface

## Fix Implemented

**Solution**: Removed detailed endpoint enumeration from public root endpoint

### Before (Vulnerable):
```json
{
  "name": "Meal Planner API",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "health": "/health",
    "auth": "/api/auth",
    "users": "/api/users",
    "familyMembers": "/api/family-members",
    "recipes": "/api/recipes",
    "recipeImport": "/api/recipes/import",
    "mealPlans": "/api/meal-plans",
    "groceryLists": "/api/grocery-lists",
    "ingredients": "/api/ingredients",
    "pantry": "/api/pantry",
    "admin": "/api/admin",
    "images": "/api/images"
  },
  "documentation": "See README.md for API documentation"
}
```

### After (Secure):
```json
{
  "name": "Meal Planner API",
  "status": "running",
  "documentation": "Contact administrator for API documentation"
}
```

## Security Improvements

1. **Eliminated Information Disclosure**: No longer reveals API structure to unauthenticated users
2. **Removed Version Leakage**: Application version no longer exposed
3. **Protected Admin Endpoints**: Administrative routes not discoverable without authentication
4. **Increased Attack Difficulty**: Attackers must now probe/guess endpoints (slower, noisier, more detectable)

## Testing the Fix

### Verify the vulnerability is fixed:
```bash
# Test that endpoint list is no longer exposed
curl http://localhost:3000/

# Expected response (secure):
{
  "name": "Meal Planner API",
  "status": "running",
  "documentation": "Contact administrator for API documentation"
}

# Should NOT contain "endpoints" object or "version" field
```

### Verify functionality is maintained:
```bash
# Health check should still work
curl http://localhost:3000/health

# API endpoints should still be accessible
curl http://localhost:3000/api/auth/login
```

## Impact Assessment

- **Security Impact**: Positive - Reduces reconnaissance capabilities for attackers
- **Functionality Impact**: None - All API endpoints remain fully functional
- **Developer Impact**: Minimal - Developers should refer to README.md or code for endpoint documentation
- **User Impact**: None - End users interact through the frontend application

## Compliance Alignment

This fix helps meet requirements for:
- **OWASP Top 10**: A01 (Broken Access Control), A05 (Security Misconfiguration)
- **GDPR**: Article 32 (Security of processing)
- **PCI DSS**: Requirement 6.5.10 (Information leakage)
- **SOC 2**: CC6.1 (Logical access controls)

## Recommendations for Future Enhancements

1. **Authenticated Documentation Endpoint**: Consider implementing an authenticated `/api/docs` endpoint for legitimate users
2. **OpenAPI/Swagger**: Implement OpenAPI specification with environment-based access control
3. **Security Headers**: Add additional security headers to prevent information leakage
4. **Logging**: Log access attempts to the root endpoint for security monitoring
5. **Rate Limiting**: Ensure rate limiting is applied to prevent endpoint enumeration attempts

## Related Files Modified

- [`backend/src/index.ts`](backend/src/index.ts:71) - Root endpoint response minimized

## References

- CWE-200: https://cwe.mitre.org/data/definitions/200.html
- OWASP API Security Top 10: https://owasp.org/www-project-api-security/
- OWASP Information Leakage: https://owasp.org/www-community/vulnerabilities/Information_exposure_through_query_strings_in_url