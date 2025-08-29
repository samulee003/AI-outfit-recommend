// AI Service Factory - Automatically selects the best available AI service
import { ClothingItem, StyleRecommendation, ClothingType } from "../types";

// Service interface that all AI services must implement
export interface AIService {
  generateOutfit(
    base64ImageData: string, 
    mimeType: string, 
    prompt: string,
    topImageUrl: string | null,
    bottomImageUrl: string | null
  ): Promise<{ imageBase64: string | null; text: string | null }>;

  generateAndRecommendOutfit(
    base64ImageData: string, 
    mimeType: string
  ): Promise<{ imageBase64: string | null; text: string | null }>;

  getStyleRecommendations(closet: ClothingItem[]): Promise<StyleRecommendation[]>;

  generateClothingItem(
    style: string, 
    color: string, 
    type: ClothingType, 
    customDescription: string
  ): Promise<string>;
}

// Service types
type ServiceType = 'gemini-direct' | 'vertex-ai' | 'mock';

class AIServiceFactory {
  private static instance: AIServiceFactory;
  private currentService: AIService | null = null;
  private serviceType: ServiceType = 'mock';

  private constructor() {}

  public static getInstance(): AIServiceFactory {
    if (!AIServiceFactory.instance) {
      AIServiceFactory.instance = new AIServiceFactory();
    }
    return AIServiceFactory.instance;
  }

  public async getService(): Promise<AIService> {
    if (this.currentService) {
      return this.currentService;
    }

    // Determine which service to use based on environment variables
    const configuredService = (process.env.AI_SERVICE_TYPE as ServiceType) || 'gemini-direct';
    
    console.log(`🤖 Attempting to initialize AI service: ${configuredService}`);

    try {
      switch (configuredService) {
        case 'vertex-ai':
          this.currentService = await this.initializeVertexAI();
          this.serviceType = 'vertex-ai';
          break;
        
        case 'gemini-direct':
          this.currentService = await this.initializeGeminiDirect();
          this.serviceType = 'gemini-direct';
          break;
        
        case 'mock':
        default:
          this.currentService = await this.initializeMockService();
          this.serviceType = 'mock';
          break;
      }
    } catch (error) {
      console.warn(`⚠️  Failed to initialize ${configuredService} service:`, error);
      
      // Fallback strategy
      if (configuredService !== 'mock') {
        console.log('🔄 Falling back to mock service...');
        this.currentService = await this.initializeMockService();
        this.serviceType = 'mock';
      } else {
        throw error;
      }
    }

    console.log(`✅ AI service initialized: ${this.serviceType}`);
    return this.currentService;
  }

  private async initializeVertexAI(): Promise<AIService> {
    // Check if Vertex AI credentials are configured
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
      throw new Error('GOOGLE_CLOUD_PROJECT_ID not configured');
    }

    const vertexService = await import('./geminiService.vertexai');
    
    // Test the connection
    const isWorking = await vertexService.testVertexAIConnection();
    if (!isWorking) {
      throw new Error('Vertex AI connection test failed');
    }

    return {
      generateOutfit: vertexService.generateOutfit,
      generateAndRecommendOutfit: vertexService.generateAndRecommendOutfit,
      getStyleRecommendations: vertexService.getStyleRecommendations,
      generateClothingItem: vertexService.generateClothingItem,
    };
  }

  private async initializeGeminiDirect(): Promise<AIService> {
    // Check if Gemini API key is configured
    if (!process.env.API_KEY && !process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const geminiService = await import('./geminiService');
    
    // Test the connection by trying a simple call
    try {
      await geminiService.getStyleRecommendations([]);
    } catch (error: any) {
      if (error.message?.includes('User location is not supported') || 
          error.message?.includes('FAILED_PRECONDITION')) {
        throw new Error('Gemini Direct API not available in your region');
      }
      // Other errors might be acceptable (like empty closet)
    }

    return {
      generateOutfit: geminiService.generateOutfit,
      generateAndRecommendOutfit: geminiService.generateAndRecommendOutfit,
      getStyleRecommendations: geminiService.getStyleRecommendations,
      generateClothingItem: geminiService.generateClothingItem,
    };
  }

  private async initializeMockService(): Promise<AIService> {
    const mockService = await import('./geminiService.mock');
    
    return {
      generateOutfit: mockService.generateOutfit,
      generateAndRecommendOutfit: mockService.generateAndRecommendOutfit,
      getStyleRecommendations: mockService.getStyleRecommendations,
      generateClothingItem: mockService.generateClothingItem,
    };
  }

  public getServiceType(): ServiceType {
    return this.serviceType;
  }

  public async switchService(serviceType: ServiceType): Promise<void> {
    this.currentService = null;
    process.env.AI_SERVICE_TYPE = serviceType;
    await this.getService();
  }
}

// Export singleton instance
export const aiServiceFactory = AIServiceFactory.getInstance();

// Export convenience functions that use the factory
export async function generateOutfit(
  base64ImageData: string, 
  mimeType: string, 
  prompt: string,
  topImageUrl: string | null,
  bottomImageUrl: string | null
): Promise<{ imageBase64: string | null; text: string | null }> {
  const service = await aiServiceFactory.getService();
  return service.generateOutfit(base64ImageData, mimeType, prompt, topImageUrl, bottomImageUrl);
}

export async function generateAndRecommendOutfit(
  base64ImageData: string, 
  mimeType: string
): Promise<{ imageBase64: string | null; text: string | null }> {
  const service = await aiServiceFactory.getService();
  return service.generateAndRecommendOutfit(base64ImageData, mimeType);
}

export async function getStyleRecommendations(closet: ClothingItem[]): Promise<StyleRecommendation[]> {
  const service = await aiServiceFactory.getService();
  return service.getStyleRecommendations(closet);
}

export async function generateClothingItem(
  style: string, 
  color: string, 
  type: ClothingType, 
  customDescription: string
): Promise<string> {
  const service = await aiServiceFactory.getService();
  return service.generateClothingItem(style, color, type, customDescription);
}

export async function getServiceInfo(): Promise<{ type: ServiceType; status: string }> {
  const type = aiServiceFactory.getServiceType();
  let status = 'Unknown';
  
  try {
    await aiServiceFactory.getService();
    status = 'Connected';
  } catch (error) {
    status = 'Error';
  }
  
  return { type, status };
}