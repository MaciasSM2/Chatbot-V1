export interface ColorScale {
  accent: string;
  bgBase: string;
  bgGradientEnd: string;
  bgCard: string;
  bgSidebar: string;
  bgCardHover: string;
  bgInput: string;
  bgHeader: string;
  iconBg: string;
  kpiStripe: string;
  avatarBg: string;
  bubbleUser: string;
  bubbleBot: string;
  borderSubtle: string;
  borderStrong: string;
}

export interface FullScale {
  light: ColorScale;
  dark: ColorScale;
}

export interface PresetMeta {
  name: string;
  hex: string;
}

export const PRESETS: PresetMeta[] = [
  { name: 'Verde WhatsApp', hex: '#25D366' },
  { name: 'Azul Real', hex: '#2563EB' },
  { name: 'Púrpura', hex: '#7C3AED' },
  { name: 'Rojo Crimson', hex: '#DC2626' },
  { name: 'Cyan Teal', hex: '#06B6D4' },
  { name: 'Dorado', hex: '#D97706' },
  { name: 'Plateado', hex: '#64748B' },
  { name: 'Naranja', hex: '#F97316' },
  { name: 'Rosa', hex: '#EC4899' },
];

export const LEGACY_PRESET_MAP: Record<string, string> = {
  WHATSAPP_GREEN: '#25D366',
  BLUE: '#2563EB',
  PURPLE: '#7C3AED',
  RED: '#DC2626',
  CYAN: '#06B6D4',
  GOLD: '#D97706',
  SILVER: '#64748B',
  ORANGE: '#F97316',
  MEDITERRANEAN: '#2E6F40',
  FLORAL: '#EC4899',
};

function hexToRgb(hex: string) {
  const c = parseInt(hex.replace('#', ''), 16);
  if (isNaN(c)) return null;
  return { r: (c >> 16) & 255, g: (c >> 8) & 255, b: c & 255 };
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    switch (mx) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToCss(h: number, s: number, l: number) {
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

function hexWithAlpha(hex: string, alpha: number) {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255);
  return hex + a.toString(16).padStart(2, '0');
}

export function generateColorScale(hex: string): FullScale {
  const rgb = hexToRgb(hex);
  if (!rgb) return generateColorScale('#25D366');

  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const lightBgBase = hslToCss(h, Math.max(0, s - 55), Math.min(98, l + 50));
  const lightCardHover = hslToCss(h, Math.max(0, s - 55), Math.min(96, l + 40));
  const lightHeader = hslToCss(h, Math.max(0, s - 55), Math.min(95, l + 38));
  const lightAvatar = hslToCss(h, Math.max(0, s - 45), Math.min(93, l + 32));
  const lightBorderSubtle = hslToCss(h, Math.max(0, s - 60), 88);
  const lightBorderStrong = hslToCss(h, Math.max(0, s - 55), 78);

  const darkGradientEnd = hslToCss(h, Math.min(100, s * 0.4), Math.max(5, l * 0.25));
  const darkAvatar = hslToCss(h, Math.min(100, s * 0.7), Math.max(8, l * 0.15));

  return {
    light: {
      accent: hex,
      bgBase: lightBgBase,
      bgGradientEnd: '#FFFFFF',
      bgCard: '#FFFFFF',
      bgSidebar: '#FFFFFF',
      bgCardHover: lightCardHover,
      bgInput: '#FFFFFF',
      bgHeader: lightHeader,
      iconBg: hexWithAlpha(hex, 0.10),
      kpiStripe: hex,
      avatarBg: lightAvatar,
      bubbleUser: hexWithAlpha(hex, 0.15),
      bubbleBot: '#FFFFFF',
      borderSubtle: lightBorderSubtle,
      borderStrong: lightBorderStrong,
    },
    dark: {
      accent: hex,
      bgBase: '#070A0E',
      bgGradientEnd: darkGradientEnd,
      bgCard: '#0d0d0d',
      bgSidebar: '#0f1114',
      bgCardHover: '#1a1c20',
      bgInput: '#18191b',
      bgHeader: '#141517',
      iconBg: hexWithAlpha(hex, 0.12),
      kpiStripe: hex,
      avatarBg: darkAvatar,
      bubbleUser: hexWithAlpha(hex, 0.19),
      bubbleBot: '#141617',
      borderSubtle: 'rgba(255, 255, 255, 0.05)',
      borderStrong: 'rgba(255, 255, 255, 0.15)',
    },
  };
}
