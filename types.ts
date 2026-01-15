

export interface Lens {
  id: string;
  x: number; // 0-1 percentage of image width
  y: number; // 0-1 percentage of image height
  size: number; // pixels
  zoom: number; // multiplier (e.g., 2.0)
  // Lens Style
  borderWidth: number;
  borderColor: string;
  shadowBlur: number;
  shadowSpread: number;
  shadowOpacity: number;
  shadowColor: string;
  shadowX: number;
  shadowY: number;
}

export interface StyleState {
  backgroundColor: string;
  isBackgroundTransparent: boolean;
  // Canvas Drop Shadow
  canvasShadowEnabled: boolean;
  canvasShadowColor: string;
  canvasShadowBlur: number;
  canvasShadowSpread: number;
  canvasShadowOpacity: number;
  canvasShadowX: number;
  canvasShadowY: number;
  // Canvas Border
  canvasBorderWidth: number;
  canvasBorderColor: string;
  // Background Filters
  baseBlur: number;
  baseGrayscale: number;
  baseOpacity: number;
  scrimColor: string;
  scrimOpacity: number;
  // Background Crop
  cropZoom: number;
  cropRadius: number;
  cropWidth: number; // 0-100 percentage of original width
  cropHeight: number; // 0-100 percentage of original height
  cropX: number; // 0-100 percentage, 50 is center
  cropY: number; // 0-100 percentage, 50 is center
}

// Using a reliable CORS-enabled image from Unsplash
export const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1605142859862-978be7eba909?q=80&w=2400&auto=format&fit=crop&ixlib=rb-4.0.3';

export const DEFAULT_LENS: Lens = {
  id: '1',
  x: 0.35,
  y: 0.4,
  size: 250,
  zoom: 2.5,
  borderWidth: 6,
  borderColor: '#ffffff',
  shadowBlur: 40,
  shadowSpread: 0,
  shadowOpacity: 0.4,
  shadowColor: '#000000',
  shadowX: 0,
  shadowY: 20,
};

export const DEFAULT_STYLE: StyleState = {
  backgroundColor: '#ffffff',
  isBackgroundTransparent: true,
  canvasShadowEnabled: false,
  canvasShadowColor: '#000000',
  canvasShadowBlur: 50,
  canvasShadowSpread: 0,
  canvasShadowOpacity: 0.4,
  canvasShadowX: 0,
  canvasShadowY: 20,
  canvasBorderWidth: 0,
  canvasBorderColor: '#000000',
  baseBlur: 0,
  baseGrayscale: 0,
  baseOpacity: 100,
  scrimColor: '#000000',
  scrimOpacity: 0,
  cropZoom: 1.0,
  cropRadius: 0,
  cropWidth: 100,
  cropHeight: 100,
  cropX: 50,
  cropY: 50,
};