/**
 * Responsive design utilities for the AI Virtual Wardrobe application
 */

// Breakpoint definitions matching Tailwind CSS defaults
export const breakpoints = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Check if the current viewport matches a breakpoint
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.innerWidth >= breakpoints[breakpoint];
}

/**
 * Get the current breakpoint based on window width
 */
export function getCurrentBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') return 'sm';
  
  const width = window.innerWidth;
  
  if (width >= breakpoints['2xl']) return '2xl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
}

/**
 * Responsive image sizing utility
 */
export function getResponsiveImageSize(
  baseSize: number,
  breakpoint: Breakpoint = 'md'
): number {
  const multipliers: Record<Breakpoint, number> = {
    xs: 0.8,
    sm: 0.9,
    md: 1.0,
    lg: 1.1,
    xl: 1.2,
    '2xl': 1.3,
  };
  
  return Math.round(baseSize * multipliers[breakpoint]);
}

/**
 * Generate responsive grid columns based on screen size
 */
export function getResponsiveColumns(
  items: number,
  maxColumns: number = 4
): string {
  const currentBp = getCurrentBreakpoint();
  
  const columnMap: Record<Breakpoint, number> = {
    xs: Math.min(1, maxColumns),
    sm: Math.min(2, maxColumns),
    md: Math.min(3, maxColumns),
    lg: Math.min(4, maxColumns),
    xl: Math.min(maxColumns, items),
    '2xl': Math.min(maxColumns, items),
  };
  
  const columns = columnMap[currentBp];
  return `repeat(${columns}, minmax(0, 1fr))`;
}

/**
 * Responsive spacing utility
 */
export function getResponsiveSpacing(
  baseSpacing: number,
  breakpoint?: Breakpoint
): number {
  const currentBp = breakpoint || getCurrentBreakpoint();
  
  const spacingMultipliers: Record<Breakpoint, number> = {
    xs: 0.75,
    sm: 0.875,
    md: 1.0,
    lg: 1.125,
    xl: 1.25,
    '2xl': 1.5,
  };
  
  return baseSpacing * spacingMultipliers[currentBp];
}

/**
 * Check if device is mobile based on screen size
 */
export function isMobile(): boolean {
  return !useBreakpoint('sm');
}

/**
 * Check if device is tablet based on screen size
 */
export function isTablet(): boolean {
  return useBreakpoint('sm') && !useBreakpoint('lg');
}

/**
 * Check if device is desktop based on screen size
 */
export function isDesktop(): boolean {
  return useBreakpoint('lg');
}

/**
 * Media query helper for CSS-in-JS
 */
export function mediaQuery(breakpoint: Breakpoint): string {
  return `@media (min-width: ${breakpoints[breakpoint]}px)`;
}

/**
 * Responsive font size utility
 */
export function getResponsiveFontSize(
  baseFontSize: number,
  breakpoint?: Breakpoint
): number {
  const currentBp = breakpoint || getCurrentBreakpoint();
  
  const fontSizeMultipliers: Record<Breakpoint, number> = {
    xs: 0.875,
    sm: 0.9375,
    md: 1.0,
    lg: 1.0625,
    xl: 1.125,
    '2xl': 1.1875,
  };
  
  return baseFontSize * fontSizeMultipliers[currentBp];
}