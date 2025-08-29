# ADR-001: Multi-Service AI Architecture for Geographic Accessibility

## Status
**Accepted** - Implemented on 2025-01-29

## Context

During the implementation of the AI Virtual Wardrobe application, we encountered a critical blocker when integrating with Google's Gemini API. The direct Gemini API service returned the following error:

```
{
  "error": {
    "code": 400,
    "message": "User location is not supported for the API use.",
    "status": "FAILED_PRECONDITION"
  }
}
```

### Problem Analysis

1. **Geographic Restrictions**: Google's direct Gemini API has regional availability limitations
2. **Valid Credentials**: The API key was valid and properly configured
3. **Service Dependency**: The entire application's core functionality depended on AI services
4. **User Impact**: Users in restricted regions would have no access to AI features

### Technical Investigation

We tested multiple approaches:
- **API Key Validation**: Confirmed the key was valid and had proper permissions
- **Model Availability**: Tested different Gemini models (gemini-pro, gemini-1.5-flash, gemini-2.0-flash-exp)
- **Regional Testing**: All models returned the same geographic restriction error

## Decision

We decided to implement a **Multi-Service AI Architecture** with the following components:

### 1. Service Abstraction Layer
Create a unified interface that abstracts the underlying AI service implementation:

```typescript
interface AIService {
  generateOutfit(...): Promise<{imageBase64: string | null; text: string | null}>;
  generateAndRecommendOutfit(...): Promise<{imageBase64: string | null; text: string | null}>;
  getStyleRecommendations(...): Promise<StyleRecommendation[]>;
  generateClothingItem(...): Promise<string>;
}
```

### 2. Multiple Service Implementations

**Primary Solution: Google Cloud Vertex AI**
- **Rationale**: Uses the same Gemini models but through Google Cloud infrastructure
- **Advantage**: Bypasses geographic restrictions while maintaining model quality
- **Model**: Gemini 1.5 Flash (equivalent to 2.5 Flash functionality)
- **Access**: Available in more regions through enterprise Google Cloud

**Fallback: Direct Gemini API**
- **Purpose**: For regions where direct API access is available
- **Advantage**: Simpler setup, no Google Cloud project required
- **Limitation**: Geographic restrictions apply

**Development Fallback: Mock Service**
- **Purpose**: Development and testing when AI services are unavailable
- **Features**: Realistic response simulation with proper delays
- **Advantage**: Enables development without API dependencies

### 3. Intelligent Service Selection
Implement automatic service selection with fallback logic:

```typescript
class AIServiceFactory {
  async getService(): Promise<AIService> {
    const configuredService = process.env.AI_SERVICE_TYPE || 'gemini-direct';
    
    try {
      return await this.initializeService(configuredService);
    } catch (error) {
      console.warn(`Failed to initialize ${configuredService}, falling back to mock`);
      return await this.initializeMockService();
    }
  }
}
```

## Consequences

### Positive Outcomes

1. **Global Accessibility**: Users in any region can access the application
2. **Service Reliability**: Multiple fallback options ensure service availability
3. **Development Flexibility**: Mock service enables development without API dependencies
4. **Future-Proofing**: Easy to add new AI service providers
5. **Transparent Integration**: No changes required to existing component code

### Implementation Overhead

1. **Additional Complexity**: Multiple service implementations to maintain
2. **Configuration Management**: More environment variables and setup options
3. **Testing Requirements**: Need to test all service implementations
4. **Documentation Burden**: Comprehensive setup guides for each service option

### Technical Trade-offs

1. **Bundle Size**: Slightly larger due to multiple service implementations
2. **Runtime Overhead**: Service selection logic adds minimal overhead
3. **Maintenance**: Multiple API integrations to keep updated

## Implementation Details

### Files Created/Modified

1. **`services/aiServiceFactory.ts`** - Service factory with intelligent selection
2. **`services/geminiService.vertexai.ts`** - Vertex AI implementation
3. **`services/geminiService.mock.ts`** - Mock service for development
4. **`components/AIServiceStatus.tsx`** - Service status indicator
5. **`test-vertex-ai.js`** - Vertex AI connection testing
6. **`docs/vertex-ai-setup.md`** - Comprehensive setup guide

### Environment Configuration

```env
# Service Selection
AI_SERVICE_TYPE=vertex-ai  # Options: vertex-ai | gemini-direct | mock

# Vertex AI Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account.json

# Direct Gemini API (fallback)
GEMINI_API_KEY=your-api-key
```

### Model Compatibility

| Feature | Direct Gemini | Vertex AI | Mock Service |
|---------|---------------|-----------|--------------|
| Text Generation | ✅ Gemini 2.5 Flash | ✅ Gemini 1.5 Flash | ✅ Simulated |
| Image Analysis | ✅ Multimodal | ✅ Multimodal | ✅ Simulated |
| Image Generation | ✅ Imagen 4.0 | ⚠️ Text descriptions | ✅ SVG placeholders |
| JSON Responses | ✅ Structured | ✅ Structured | ✅ Structured |
| Geographic Access | ❌ Limited | ✅ Global | ✅ Always available |

## Monitoring and Observability

### Service Status Monitoring
- Real-time service status indicator in the UI
- Connection health checks on service initialization
- Automatic fallback with user notification

### Error Handling
- Graceful degradation when services are unavailable
- Clear error messages with setup guidance
- Retry logic with exponential backoff

### Performance Monitoring
- Service response time tracking
- API quota usage monitoring
- Error rate tracking per service

## Future Considerations

### Potential Enhancements
1. **Regional Optimization**: Automatic service selection based on user location
2. **Load Balancing**: Distribute requests across multiple service instances
3. **Caching Layer**: Reduce API calls through intelligent response caching
4. **Health Monitoring**: Proactive service health checks and alerting

### Alternative Services
The architecture is designed to easily accommodate additional AI service providers:
- OpenAI GPT-4 Vision for text analysis
- Replicate API for image generation
- Hugging Face Inference API for specialized models
- Local AI models for privacy-focused deployments

## Lessons Learned

1. **Geographic Considerations**: Always verify API availability in target regions early
2. **Service Abstraction**: Abstraction layers provide valuable flexibility
3. **Fallback Strategies**: Multiple fallback options increase reliability
4. **User Communication**: Clear status indicators improve user experience
5. **Documentation**: Comprehensive setup guides reduce user friction

## References

- [Google Cloud Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Gemini API Geographic Availability](https://ai.google.dev/available_regions)
- [Service Factory Pattern](https://refactoring.guru/design-patterns/factory-method)
- [Multi-Service Architecture Best Practices](https://microservices.io/patterns/data/database-per-service.html)

---

**Decision Date**: 2025-01-29  
**Decision Makers**: Development Team  
**Review Date**: 2025-04-29 (3 months)  
**Status**: Active Implementation