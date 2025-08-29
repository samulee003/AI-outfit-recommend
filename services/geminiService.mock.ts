// Mock implementation for development when Gemini API is not available
import { ClothingItem, StyleRecommendation, ClothingType } from "../types";

// Mock data for testing
const mockOutfitImages = [
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk1vY2sgT3V0Zml0IEltYWdlPC90ZXh0Pjwvc3ZnPg==',
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTBmMGZmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhc3VhbCBPdXRmaXQ8L3RleHQ+PC9zdmc+',
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmMGUwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkZvcm1hbCBPdXRmaXQ8L3RleHQ+PC9zdmc+'
];

const mockClothingImages = [
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1IiBzdHJva2U9IiNkZGQiIHN0cm9rZS13aWR0aD0iMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Nb2NrIENsb3RoaW5nPC90ZXh0Pjwvc3ZnPg=='
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function generateOutfit(
    base64ImageData: string, 
    mimeType: string, 
    prompt: string,
    topImageUrl: string | null,
    bottomImageUrl: string | null
): Promise<{ imageBase64: string | null; text: string | null }> {
    
    console.log('🎭 Using mock Gemini service for outfit generation');
    
    // Simulate API delay
    await delay(2000 + Math.random() * 1000);
    
    const randomImage = mockOutfitImages[Math.floor(Math.random() * mockOutfitImages.length)];
    const mockDescription = `Mock outfit generated based on your prompt: "${prompt}". This is a simulated response showing how the virtual try-on would work with ${topImageUrl ? 'top' : 'no top'} and ${bottomImageUrl ? 'bottom' : 'no bottom'} reference images.`;
    
    return {
        imageBase64: randomImage.split(',')[1], // Remove data URL prefix
        text: mockDescription
    };
}

export async function generateAndRecommendOutfit(base64ImageData: string, mimeType: string): Promise<{ imageBase64: string | null; text: string | null }> {
    console.log('🎭 Using mock Gemini service for outfit recommendation');
    
    await delay(1500 + Math.random() * 1000);
    
    const styles = [
        'casual chic', 'streetwear', 'business casual', 'minimalist', 'bohemian',
        'preppy', 'athletic leisure', 'vintage-inspired', 'smart casual', 'edgy rock'
    ];
    const seasons = ['Spring', 'Summer', 'Autumn', 'Winter'];
    
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const currentSeason = seasons[Math.floor(Math.random() * seasons.length)];
    const randomImage = mockOutfitImages[Math.floor(Math.random() * mockOutfitImages.length)];
    
    const mockDescription = `I've created a ${randomStyle} outfit perfect for ${currentSeason}! This mock outfit combines comfort and style, featuring carefully selected pieces that complement your look. The background has been updated to match the seasonal vibe.`;
    
    return {
        imageBase64: randomImage.split(',')[1],
        text: mockDescription
    };
}

export async function getStyleRecommendations(closet: ClothingItem[]): Promise<StyleRecommendation[]> {
    console.log('🎭 Using mock Gemini service for style recommendations');
    
    await delay(1000 + Math.random() * 500);
    
    if (closet.length === 0) {
        return [];
    }
    
    const mockRecommendations: StyleRecommendation[] = [
        {
            styleName: "Casual Weekend",
            description: "Perfect for relaxed weekend activities with a comfortable yet put-together look.",
            topId: closet.find(item => item.type === 'TOP')?.id,
            bottomId: closet.find(item => item.type === 'BOTTOM')?.id
        },
        {
            styleName: "Smart Casual",
            description: "Great for casual office days or dinner dates - professional but approachable.",
            topId: closet.find(item => item.type === 'TOP')?.id,
            bottomId: closet.find(item => item.type === 'BOTTOM')?.id
        },
        {
            styleName: "Effortless Chic",
            description: "Minimalist styling that looks effortlessly elegant for any occasion.",
            topId: closet.find(item => item.type === 'TOP')?.id
        }
    ].filter(rec => rec.topId || rec.bottomId); // Only return recommendations with valid items
    
    return mockRecommendations.slice(0, 3);
}

export async function generateClothingItem(style: string, color: string, type: ClothingType, customDescription: string): Promise<string> {
    console.log('🎭 Using mock Gemini service for clothing generation');
    
    await delay(3000 + Math.random() * 2000);
    
    // Create a more specific mock image based on the parameters
    const mockSvg = `
        <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
            <text x="50%" y="30%" font-family="Arial" font-size="14" fill="#495057" text-anchor="middle">
                Mock ${type}
            </text>
            <text x="50%" y="45%" font-family="Arial" font-size="12" fill="#6c757d" text-anchor="middle">
                Style: ${style}
            </text>
            <text x="50%" y="55%" font-family="Arial" font-size="12" fill="#6c757d" text-anchor="middle">
                Color: ${color}
            </text>
            <text x="50%" y="70%" font-family="Arial" font-size="10" fill="#868e96" text-anchor="middle">
                ${customDescription}
            </text>
        </svg>
    `;
    
    return btoa(mockSvg); // Convert to base64
}