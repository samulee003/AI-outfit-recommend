import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GOOGLE_CLOUD_PROJECT_ID': JSON.stringify(env.GOOGLE_CLOUD_PROJECT_ID),
        'process.env.GOOGLE_CLOUD_LOCATION': JSON.stringify(env.GOOGLE_CLOUD_LOCATION),
        'process.env.GOOGLE_APPLICATION_CREDENTIALS': JSON.stringify(env.GOOGLE_APPLICATION_CREDENTIALS),
        'process.env.AI_SERVICE_TYPE': JSON.stringify(env.AI_SERVICE_TYPE || 'gemini-direct'),
        'process.env.VITE_APP_NAME': JSON.stringify(env.VITE_APP_NAME || 'AI Virtual Wardrobe'),
        'process.env.VITE_APP_VERSION': JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
        'process.env.VITE_DEBUG': JSON.stringify(env.VITE_DEBUG === 'true'),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Asset handling configuration
      assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.webp', '**/*.svg'],
      build: {
        assetsInlineLimit: 4096, // 4kb - inline smaller assets as base64
        rollupOptions: {
          output: {
            assetFileNames: (assetInfo) => {
              const info = assetInfo.name?.split('.') ?? [];
              const ext = info[info.length - 1];
              if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp/i.test(ext ?? '')) {
                return `assets/images/[name]-[hash][extname]`;
              }
              return `assets/[name]-[hash][extname]`;
            },
          },
        },
      },
      // Optimize dependencies
      optimizeDeps: {
        include: ['react', 'react-dom', '@google/genai'],
      },
      // Server configuration for development
      server: {
        port: 3000,
        open: true,
      },
    };
});
