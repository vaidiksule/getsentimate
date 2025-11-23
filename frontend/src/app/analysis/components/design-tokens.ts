// Design System Tokens for Analysis Components
// Minimalist, cohesive design language

export const tokens = {
  // Card styling
  card: {
    borderRadius: 'rounded-2xl', // More subtle than rounded-3xl
    border: 'border-neutral-100/50',
    background: 'bg-white/60',
    shadow: 'shadow-sm',
    backdrop: 'backdrop-blur-sm',
  },
  
  // Typography scale
  text: {
    title: 'text-sm font-medium text-neutral-900', // Consistent title
    subtitle: 'text-xs text-neutral-500', // Subtitle/metadata
    body: 'text-xs text-neutral-700', // Main content
    caption: 'text-[11px] text-neutral-600', // Secondary info
    small: 'text-[10px] text-neutral-500', // Small labels
  },
  
  // Spacing
  spacing: {
    cardPadding: 'p-4', // Consistent padding
    cardHeader: 'pb-3',
    cardContent: 'pt-0',
    sectionGap: 'space-y-3',
    itemGap: 'gap-2',
  },
  
  // Colors
  colors: {
    primary: {
      50: 'blue-50',
      100: 'blue-100', 
      500: 'blue-500',
      600: 'blue-600',
      900: 'blue-900',
    },
    neutral: {
      50: 'neutral-50',
      100: 'neutral-100',
      200: 'neutral-200',
      400: 'neutral-400',
      500: 'neutral-500',
      600: 'neutral-600',
      700: 'neutral-700',
      900: 'neutral-900',
    }
  },
  
  // Interactive states
  interactive: {
    hover: 'hover:bg-neutral-50/50 transition-colors duration-200',
    borderHover: 'hover:border-neutral-200/80 transition-colors duration-200',
  },
  
  // Badges and indicators
  badge: {
    primary: 'bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium',
    neutral: 'bg-neutral-100 text-neutral-700 text-[10px] px-2 py-0.5 rounded-full font-medium',
    subtle: 'bg-neutral-50 text-neutral-600 text-[10px] px-2 py-0.5 rounded-full font-medium',
  },
  
  // Progress bars and metrics
  progress: {
    background: 'bg-neutral-100',
    fill: 'bg-blue-500',
    height: 'h-1.5',
    rounded: 'rounded-full',
  }
};

// Helper functions for consistent styling
export const getCardClasses = () => 
  `${tokens.card.borderRadius} ${tokens.card.border} ${tokens.card.background} ${tokens.card.shadow} ${tokens.card.backdrop}`;

export const getTitleClasses = () => tokens.text.title;
export const getSubtitleClasses = () => tokens.text.subtitle;
export const getBodyClasses = () => tokens.text.body;
export const getCaptionClasses = () => tokens.text.caption;
