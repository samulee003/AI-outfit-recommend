// Test script for Vertex AI configuration
import { config } from 'dotenv';

// Load environment variables
config();

console.log('🧪 Testing Vertex AI Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('- GOOGLE_CLOUD_PROJECT_ID:', process.env.GOOGLE_CLOUD_PROJECT_ID || '❌ Not set');
console.log('- GOOGLE_CLOUD_LOCATION:', process.env.GOOGLE_CLOUD_LOCATION || '❌ Not set');
console.log('- GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS || '❌ Not set');
console.log('- AI_SERVICE_TYPE:', process.env.AI_SERVICE_TYPE || '❌ Not set');

// Check if service account key file exists
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  try {
    const fs = await import('fs');
    if (fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
      console.log('✅ Service account key file found');
    } else {
      console.log('❌ Service account key file not found at specified path');
    }
  } catch (error) {
    console.log('⚠️  Could not check service account key file');
  }
}

console.log('\n🔧 Testing Vertex AI Connection...');

try {
  // Import and test Vertex AI service
  const { testVertexAIConnection } = await import('./services/geminiService.vertexai.js');
  
  const isWorking = await testVertexAIConnection();
  
  if (isWorking) {
    console.log('✅ Vertex AI connection successful!');
    console.log('🎉 You can now use Vertex AI for the virtual wardrobe app');
  } else {
    console.log('❌ Vertex AI connection failed');
    console.log('💡 Please check your configuration and try again');
  }
  
} catch (error) {
  console.error('❌ Error testing Vertex AI:', error.message);
  
  if (error.message.includes('GOOGLE_CLOUD_PROJECT_ID')) {
    console.log('\n💡 Setup Steps:');
    console.log('1. Set GOOGLE_CLOUD_PROJECT_ID in your .env file');
    console.log('2. Create a service account in Google Cloud Console');
    console.log('3. Download the service account key JSON file');
    console.log('4. Set GOOGLE_APPLICATION_CREDENTIALS to the key file path');
    console.log('5. Set AI_SERVICE_TYPE=vertex-ai');
  }
  
  if (error.message.includes('authentication')) {
    console.log('\n💡 Authentication Issues:');
    console.log('- Check if your service account key file exists');
    console.log('- Verify the service account has Vertex AI permissions');
    console.log('- Ensure the Vertex AI API is enabled in your project');
  }
}

console.log('\n📚 For detailed setup instructions, see: docs/vertex-ai-setup.md');