import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClothingItem, ClothingType } from '../../types';

// Mock the @google/genai module
const mockGenerateContent = vi.fn();
const mockGenerateImages = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
      generateImages: mockGenerateImages
    }
  })),
  Modality: {
    IMAGE: 'IMAGE',
    TEXT: 'TEXT'
  },
  Type: {
    ARRAY: 'array',
    OBJECT: 'object',
    STRING: 'string',
    INTEGER: 'integer'
  }
}));

describe('GeminiService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateOutfit', () => {
    it('should successfully generate outfit with reference images', async () => {
      // Arrange
      const mockResponse = {
        candidates: [{
          content: {
            parts: [
              { inlineData: { data: 'generated-image-base64' } },
              { text: 'Generated outfit description' }
            ]
          }
        }]
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      // Import after mocking
      const { generateOutfit } = await import('../geminiService');

      const mockBase64 = 'test-base64';
      const mockMimeType = 'image/png';
      const mockPrompt = 'Test prompt';
      const mockTopImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const mockBottomImageUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

      // Act
      const result = await generateOutfit(mockBase64, mockMimeType, mockPrompt, mockTopImageUrl, mockBottomImageUrl);

      // Assert
      expect(result).toEqual({
        imageBase64: 'generated-image-base64',
        text: 'Generated outfit description'
      });
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
          parts: expect.arrayContaining([
            { inlineData: { data: mockBase64, mimeType: mockMimeType } },
            { text: mockPrompt }
          ])
        },
        config: { responseModalities: ['IMAGE', 'TEXT'] }
      });
    });

    it('should handle null reference images', async () => {
      // Arrange
      const mockResponse = {
        candidates: [{
          content: {
            parts: [
              { inlineData: { data: 'generated-image-base64' } }
            ]
          }
        }]
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const { generateOutfit } = await import('../geminiService');

      // Act
      const result = await generateOutfit('test-base64', 'image/png', 'test prompt', null, null);

      // Assert
      expect(result).toEqual({
        imageBase64: 'generated-image-base64',
        text: null
      });
    });

    it('should throw error when API call fails', async () => {
      // Arrange
      const mockError = new Error('API Error');
      mockGenerateContent.mockRejectedValue(mockError);

      const { generateOutfit } = await import('../geminiService');

      // Act & Assert
      await expect(generateOutfit('test', 'image/png', 'test', null, null))
        .rejects.toThrow('Gemini API Error: API Error');
    });

    it('should throw error when no image or text is returned', async () => {
      // Arrange
      const mockResponse = {
        candidates: [{
          content: {
            parts: []
          }
        }]
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const { generateOutfit } = await import('../geminiService');

      // Act & Assert
      await expect(generateOutfit('test', 'image/png', 'test', null, null))
        .rejects.toThrow('Invalid response from Gemini API. No image or text found.');
    });
  });

  describe('generateAndRecommendOutfit', () => {
    it('should generate outfit with seasonal awareness', async () => {
      // Arrange
      const mockResponse = {
        candidates: [{
          content: {
            parts: [
              { inlineData: { data: 'generated-image-base64' } },
              { text: 'Generated seasonal outfit description' }
            ]
          }
        }]
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const { generateAndRecommendOutfit } = await import('../geminiService');

      // Act
      const result = await generateAndRecommendOutfit('test-base64', 'image/png');

      // Assert
      expect(result).toEqual({
        imageBase64: 'generated-image-base64',
        text: 'Generated seasonal outfit description'
      });
      
      // Verify the prompt includes seasonal information
      const callArgs = mockGenerateContent.mock.calls[0][0];
      const promptPart = callArgs.contents.parts.find((part: any) => part.text);
      expect(promptPart.text).toContain('season');
      expect(promptPart.text).toMatch(/(Spring|Summer|Autumn|Winter)/);
    });

    it('should use random style selection', async () => {
      // Arrange
      const mockResponse = {
        candidates: [{
          content: {
            parts: [
              { text: 'Generated outfit with random style' }
            ]
          }
        }]
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const { generateAndRecommendOutfit } = await import('../geminiService');

      // Act
      await generateAndRecommendOutfit('test-base64', 'image/png');

      // Assert
      const callArgs = mockGenerateContent.mock.calls[0][0];
      const promptPart = callArgs.contents.parts.find((part: any) => part.text);
      
      // Check that one of the predefined styles is included
      const styles = [
        'casual chic', 'streetwear', 'business casual', 'minimalist', 'bohemian',
        'preppy', 'athletic leisure', 'vintage-inspired', 'smart casual', 'edgy rock',
        'classic', 'avant-garde', 'eclectic', 'sophisticated urban'
      ];
      
      const hasStyle = styles.some(style => promptPart.text.includes(style));
      expect(hasStyle).toBe(true);
    });
  });

  describe('getStyleRecommendations', () => {
    it('should return style recommendations with proper structure', async () => {
      // Arrange
      const mockRecommendations = [
        { styleName: 'Casual Chic', description: 'Relaxed yet polished look', topId: 1, bottomId: 2 },
        { styleName: 'Business Casual', description: 'Professional appearance', topId: 3, bottomId: 2 },
        { styleName: 'Weekend Comfort', description: 'Comfortable weekend style', topId: 1 }
      ];
      
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockRecommendations)
      });

      const { getStyleRecommendations } = await import('../geminiService');

      const mockCloset: ClothingItem[] = [
        { id: 1, type: 'TOP', description: 'Blue cotton t-shirt', imageUrl: 'data:image/png;base64,test1' },
        { id: 2, type: 'BOTTOM', description: 'Black jeans', imageUrl: 'data:image/png;base64,test2' },
        { id: 3, type: 'TOP', description: 'White dress shirt', imageUrl: 'data:image/png;base64,test3' }
      ];

      // Act
      const result = await getStyleRecommendations(mockCloset);

      // Assert
      expect(result).toEqual(mockRecommendations);
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash',
        contents: expect.stringContaining('id: 1, description: Blue cotton t-shirt (TOP)'),
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                styleName: { type: 'string' },
                description: { type: 'string' },
                topId: { type: 'integer', description: 'ID of the recommended top item from the closet list.' },
                bottomId: { type: 'integer', description: 'ID of the recommended bottom item from the closet list.' }
              },
              required: ['styleName', 'description']
            }
          }
        }
      });
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const mockError = new Error('Network error');
      mockGenerateContent.mockRejectedValue(mockError);

      const { getStyleRecommendations } = await import('../geminiService');

      const mockCloset: ClothingItem[] = [
        { id: 1, type: 'TOP', description: 'Test item', imageUrl: 'data:image/png;base64,test' }
      ];

      // Act & Assert
      await expect(getStyleRecommendations(mockCloset))
        .rejects.toThrow('Gemini API Error: Network error');
    });

    it('should handle invalid JSON response', async () => {
      // Arrange
      mockGenerateContent.mockResolvedValue({
        text: 'invalid json'
      });

      const { getStyleRecommendations } = await import('../geminiService');

      const mockCloset: ClothingItem[] = [
        { id: 1, type: 'TOP', description: 'Test item', imageUrl: 'data:image/png;base64,test' }
      ];

      // Act & Assert
      await expect(getStyleRecommendations(mockCloset))
        .rejects.toThrow();
    });
  });

  describe('generateClothingItem', () => {
    it('should generate clothing item successfully', async () => {
      // Arrange
      const mockImageBytes = 'generated-clothing-image-bytes';
      mockGenerateImages.mockResolvedValue({
        generatedImages: [{ image: { imageBytes: mockImageBytes } }]
      });

      const { generateClothingItem } = await import('../geminiService');

      const mockStyle = 'casual';
      const mockColor = 'blue';
      const mockType: ClothingType = 'TOP';
      const mockDescription = 'comfortable cotton shirt';

      // Act
      const result = await generateClothingItem(mockStyle, mockColor, mockType, mockDescription);

      // Assert
      expect(result).toBe(mockImageBytes);
      expect(mockGenerateImages).toHaveBeenCalledWith({
        model: 'imagen-4.0-generate-001',
        prompt: expect.stringContaining('top'),
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '1:1'
        }
      });
    });

    it('should include all parameters in the prompt', async () => {
      // Arrange
      mockGenerateImages.mockResolvedValue({
        generatedImages: [{ image: { imageBytes: 'test-bytes' } }]
      });

      const { generateClothingItem } = await import('../geminiService');

      const mockStyle = 'casual';
      const mockColor = 'blue';
      const mockType: ClothingType = 'TOP';
      const mockDescription = 'comfortable cotton shirt';

      // Act
      await generateClothingItem(mockStyle, mockColor, mockType, mockDescription);

      // Assert
      const callArgs = mockGenerateImages.mock.calls[0][0];
      expect(callArgs.prompt).toContain(mockStyle);
      expect(callArgs.prompt).toContain(mockColor);
      expect(callArgs.prompt).toContain(mockType.toLowerCase());
      expect(callArgs.prompt).toContain(mockDescription);
      expect(callArgs.prompt).toContain('white background');
      expect(callArgs.prompt).toContain('studio photograph');
    });

    it('should handle API errors', async () => {
      // Arrange
      const mockError = new Error('Generation failed');
      mockGenerateImages.mockRejectedValue(mockError);

      const { generateClothingItem } = await import('../geminiService');

      // Act & Assert
      await expect(generateClothingItem('casual', 'blue', 'TOP', 'test'))
        .rejects.toThrow('Gemini API Error: Generation failed');
    });

    it('should handle empty response', async () => {
      // Arrange
      mockGenerateImages.mockResolvedValue({
        generatedImages: []
      });

      const { generateClothingItem } = await import('../geminiService');

      // Act & Assert
      await expect(generateClothingItem('casual', 'blue', 'TOP', 'test'))
        .rejects.toThrow('The AI did not return any images.');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown errors gracefully', async () => {
      // Arrange
      mockGenerateContent.mockRejectedValue('string error');

      const { generateOutfit } = await import('../geminiService');

      // Act & Assert
      await expect(generateOutfit('test', 'image/png', 'test', null, null))
        .rejects.toThrow('An unknown error occurred while communicating with the Gemini API.');
    });
  });
});