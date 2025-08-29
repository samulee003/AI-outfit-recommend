# AI Virtual Wardrobe

A modern web application that provides AI-powered outfit recommendations and virtual try-on capabilities.

## Project Setup

This project has been configured with a robust foundation including:

### TypeScript Configuration
- Strict type checking enabled
- Modern ES2022 target
- React JSX support
- Path aliases configured (`@/*` maps to project root)

### Vite Build System
- Optimized asset handling for images
- Automatic image optimization and compression
- Development server on port 3000
- Hot module replacement (HMR)
- Production build optimization

### Environment Variables
- Secure API key management
- Environment-specific configuration
- Type-safe environment variable access

### Styling System
- Tailwind CSS integration via CDN
- Custom CSS utilities and components
- Responsive design utilities
- Consistent design tokens and variables
- Accessibility-focused styling

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Add your Gemini API key: `GEMINI_API_KEY=your_api_key_here`

3. **Development**
   ```bash
   npm run dev
   ```
   The application will start on `http://localhost:3000`

4. **Build for Production**
   ```bash
   npm run build
   ```

5. **Type Checking**
   ```bash
   npm run type-check
   ```

## Project Structure

```
├── components/           # React components
├── constants/           # Style constants and configuration
├── utils/              # Utility functions (responsive helpers)
├── services/           # API services
├── styles.css          # Global CSS utilities
├── index.html          # Main HTML template
├── index.tsx           # Application entry point
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── env.d.ts           # Environment variable types
```

## Features

### Responsive Design
- Mobile-first approach
- Breakpoint-based responsive utilities
- Flexible grid system
- Optimized for all screen sizes

### Asset Management
- Automatic image optimization
- Support for PNG, JPG, JPEG, GIF, WEBP, SVG
- Inline optimization for small assets
- Organized asset output structure

### Type Safety
- Strict TypeScript configuration
- Environment variable typing
- Component prop validation
- API response typing

### Styling Architecture
- Utility-first CSS approach
- Custom design system
- Consistent spacing and typography
- Accessible color palette
- Animation and transition utilities

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for AI features | Yes |
| `VITE_APP_NAME` | Application name | No |
| `VITE_APP_VERSION` | Application version | No |
| `VITE_DEBUG` | Enable debug mode | No |

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Guidelines

### Code Style
- Use TypeScript for all new files
- Follow React functional component patterns
- Implement proper error handling
- Use semantic HTML elements
- Ensure accessibility compliance

### Performance
- Lazy load components when appropriate
- Optimize images before deployment
- Use React.memo for expensive components
- Implement proper loading states

### Responsive Design
- Test on multiple screen sizes
- Use the provided responsive utilities
- Implement touch-friendly interfaces
- Consider mobile-first design principles