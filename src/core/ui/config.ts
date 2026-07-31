/**
 * UI Search Configuration
 *
 * Domain definitions, stack configurations, and keyword mappings
 * for the BM25-powered UI/UX knowledge base search.
 */

export interface DomainConfig {
  file: string;
  searchCols: string[];
  outputCols: string[];
}

export interface StackConfig {
  file: string;
}

export const MAX_RESULTS = 3;

export const CSV_CONFIG: Record<string, DomainConfig> = {
  style: {
    file: 'styles.csv',
    searchCols: ['Style Category', 'Keywords', 'Best For', 'Type', 'AI Prompt Keywords'],
    outputCols: [
      'Style Category', 'Type', 'Keywords', 'Primary Colors', 'Effects & Animation',
      'Best For', 'Light Mode ✓', 'Dark Mode ✓', 'Performance', 'Accessibility',
      'Framework Compatibility', 'Complexity', 'AI Prompt Keywords',
      'CSS/Technical Keywords', 'Implementation Checklist', 'Design System Variables',
    ],
  },
  color: {
    file: 'colors.csv',
    searchCols: ['Product Type', 'Notes'],
    outputCols: [
      'Product Type', 'Primary', 'On Primary', 'Secondary', 'On Secondary',
      'Accent', 'On Accent', 'Background', 'Foreground', 'Card', 'Card Foreground',
      'Muted', 'Muted Foreground', 'Border', 'Destructive', 'On Destructive',
      'Ring', 'Notes',
    ],
  },
  chart: {
    file: 'charts.csv',
    searchCols: ['Data Type', 'Keywords', 'Best Chart Type', 'When to Use', 'When NOT to Use', 'Accessibility Notes'],
    outputCols: [
      'Data Type', 'Keywords', 'Best Chart Type', 'Secondary Options',
      'When to Use', 'When NOT to Use', 'Data Volume Threshold', 'Color Guidance',
      'Accessibility Grade', 'Accessibility Notes', 'A11y Fallback',
      'Library Recommendation', 'Interactive Level',
    ],
  },
  landing: {
    file: 'landing.csv',
    searchCols: ['Pattern Name', 'Keywords', 'Conversion Optimization', 'Section Order'],
    outputCols: [
      'Pattern Name', 'Keywords', 'Section Order', 'Primary CTA Placement',
      'Color Strategy', 'Conversion Optimization',
    ],
  },
  product: {
    file: 'products.csv',
    searchCols: ['Product Type', 'Keywords', 'Primary Style Recommendation', 'Key Considerations'],
    outputCols: [
      'Product Type', 'Keywords', 'Primary Style Recommendation', 'Secondary Styles',
      'Landing Page Pattern', 'Dashboard Style (if applicable)', 'Color Palette Focus',
    ],
  },
  ux: {
    file: 'ux-guidelines.csv',
    searchCols: ['Category', 'Issue', 'Description', 'Platform'],
    outputCols: [
      'Category', 'Issue', 'Platform', 'Description', 'Do', "Don't",
      'Code Example Good', 'Code Example Bad', 'Severity',
    ],
  },
  typography: {
    file: 'typography.csv',
    searchCols: ['Font Pairing Name', 'Category', 'Mood/Style Keywords', 'Best For', 'Heading Font', 'Body Font'],
    outputCols: [
      'Font Pairing Name', 'Category', 'Heading Font', 'Body Font',
      'Mood/Style Keywords', 'Best For', 'Google Fonts URL', 'CSS Import',
      'Tailwind Config', 'Notes',
    ],
  },
  icons: {
    file: 'icons.csv',
    searchCols: ['Category', 'Icon Name', 'Keywords', 'Best For'],
    outputCols: [
      'Category', 'Icon Name', 'Keywords', 'Library', 'Import Code',
      'Usage', 'Best For', 'Style',
    ],
  },
  react: {
    file: 'react-performance.csv',
    searchCols: ['Category', 'Issue', 'Keywords', 'Description'],
    outputCols: [
      'Category', 'Issue', 'Platform', 'Description', 'Do', "Don't",
      'Code Example Good', 'Code Example Bad', 'Severity',
    ],
  },
  web: {
    file: 'app-interface.csv',
    searchCols: ['Category', 'Issue', 'Keywords', 'Description'],
    outputCols: [
      'Category', 'Issue', 'Platform', 'Description', 'Do', "Don't",
      'Code Example Good', 'Code Example Bad', 'Severity',
    ],
  },
  'google-fonts': {
    file: 'google-fonts.csv',
    searchCols: ['Family', 'Category', 'Stroke', 'Classifications', 'Keywords', 'Subsets', 'Designers'],
    outputCols: [
      'Family', 'Category', 'Stroke', 'Classifications', 'Styles',
      'Variable Axes', 'Subsets', 'Designers', 'Popularity Rank', 'Google Fonts URL',
    ],
  },
};

export const STACK_CONFIG: Record<string, StackConfig> = {
  react: { file: 'stacks/react.csv' },
  nextjs: { file: 'stacks/nextjs.csv' },
  vue: { file: 'stacks/vue.csv' },
  svelte: { file: 'stacks/svelte.csv' },
  astro: { file: 'stacks/astro.csv' },
  swiftui: { file: 'stacks/swiftui.csv' },
  'react-native': { file: 'stacks/react-native.csv' },
  flutter: { file: 'stacks/flutter.csv' },
  nuxtjs: { file: 'stacks/nuxtjs.csv' },
  'nuxt-ui': { file: 'stacks/nuxt-ui.csv' },
  'html-tailwind': { file: 'stacks/html-tailwind.csv' },
  shadcn: { file: 'stacks/shadcn.csv' },
  'jetpack-compose': { file: 'stacks/jetpack-compose.csv' },
  threejs: { file: 'stacks/threejs.csv' },
  angular: { file: 'stacks/angular.csv' },
  laravel: { file: 'stacks/laravel.csv' },
};

export const STACK_COLS = {
  searchCols: ['Category', 'Guideline', 'Description', 'Do', "Don't"],
  outputCols: ['Category', 'Guideline', 'Description', 'Do', "Don't", 'Code Good', 'Code Bad', 'Severity', 'Docs URL'],
};

export const AVAILABLE_DOMAINS = Object.keys(CSV_CONFIG);
export const AVAILABLE_STACKS = Object.keys(STACK_CONFIG);

export const DOMAIN_KEYWORDS: Record<string, string[]> = {
  color: ['color', 'palette', 'hex', '#', 'rgb', 'token', 'semantic', 'accent', 'destructive', 'muted', 'foreground'],
  chart: ['chart', 'graph', 'visualization', 'trend', 'bar', 'pie', 'scatter', 'heatmap', 'funnel'],
  landing: ['landing', 'page', 'cta', 'conversion', 'hero', 'testimonial', 'pricing', 'section'],
  product: [
    'saas', 'ecommerce', 'e-commerce', 'fintech', 'healthcare', 'gaming', 'portfolio', 'crypto',
    'dashboard', 'fitness', 'restaurant', 'hotel', 'travel', 'music', 'education', 'learning',
    'legal', 'insurance', 'medical', 'beauty', 'pharmacy', 'dental', 'pet', 'dating', 'wedding',
    'recipe', 'delivery', 'ride', 'booking', 'calendar', 'timer', 'tracker', 'diary', 'note',
    'chat', 'messenger', 'crm', 'invoice', 'parking', 'transit', 'vpn', 'alarm', 'weather',
    'sleep', 'meditation', 'fasting', 'habit', 'grocery', 'meme', 'wardrobe', 'plant care',
    'reading', 'flashcard', 'puzzle', 'trivia', 'arcade', 'photography', 'streaming', 'podcast',
    'newsletter', 'marketplace', 'freelancer', 'coworking', 'airline', 'museum', 'theater',
    'church', 'non-profit', 'charity', 'kindergarten', 'daycare', 'senior care', 'veterinary',
    'florist', 'bakery', 'brewery', 'construction', 'automotive', 'real estate', 'logistics',
    'agriculture', 'coding bootcamp',
  ],
  style: [
    'style', 'design', 'ui', 'minimalism', 'glassmorphism', 'neumorphism', 'brutalism',
    'dark mode', 'flat', 'aurora', 'prompt', 'css', 'implementation', 'variable', 'checklist', 'tailwind',
  ],
  ux: ['ux', 'usability', 'accessibility', 'wcag', 'touch', 'scroll', 'animation', 'keyboard', 'navigation', 'mobile'],
  typography: ['font pairing', 'typography pairing', 'heading font', 'body font'],
  'google-fonts': [
    'google font', 'font family', 'font weight', 'font style', 'variable font', 'noto',
    'font for', 'find font', 'font subset', 'font language', 'monospace font', 'serif font',
    'sans serif font', 'display font', 'handwriting font', 'font', 'typography', 'serif', 'sans',
  ],
  icons: ['icon', 'icons', 'lucide', 'heroicons', 'symbol', 'glyph', 'pictogram', 'svg icon'],
  react: [
    'react', 'next.js', 'nextjs', 'suspense', 'memo', 'usecallback', 'useeffect', 'rerender',
    'bundle', 'waterfall', 'barrel', 'dynamic import', 'rsc', 'server component',
  ],
  web: ['aria', 'focus', 'outline', 'semantic', 'virtualize', 'autocomplete', 'form', 'input type', 'preconnect'],
};
