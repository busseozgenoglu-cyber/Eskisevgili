export const colors = {
  bg: '#000000',
  surface: '#0A0A0C',
  surfaceRaised: '#121216',
  surfaceSunken: '#050506',

  hairline: 'rgba(255,255,255,0.08)',
  hairlineStrong: 'rgba(255,255,255,0.16)',

  cyan: '#00E5FF',
  cyanDim: 'rgba(0,229,255,0.16)',
  cyanFaint: 'rgba(0,229,255,0.06)',

  violet: '#A855F7',
  violetDim: 'rgba(168,85,247,0.16)',

  blue: '#2B7FFF',

  text: '#F2F5F7',
  textMuted: 'rgba(242,245,247,0.55)',
  textFaint: 'rgba(242,245,247,0.30)',
  textGhost: 'rgba(242,245,247,0.14)',

  danger: '#FF4D5E',
} as const;

// Tight, clinical type scale. Display sizes carry negative tracking so
// headlines read as one dense block rather than airy marketing copy.
export const type = {
  display: { fontSize: 42, fontWeight: '800' as const, letterSpacing: -1.4, lineHeight: 46 },
  title: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.6 },
  heading: { fontSize: 19, fontWeight: '700' as const, letterSpacing: -0.3 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  small: { fontSize: 13, fontWeight: '400' as const, lineHeight: 19 },
  // Wide-tracked uppercase used for system/status labels.
  label: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 2.2 },
} as const;

export const radius = {
  sharp: 2,
  sm: 4,
  md: 8,
  lg: 14,
  pill: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 36,
  xxl: 56,
} as const;

export const glow = (color: string = colors.cyan, radiusPx = 18) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.55,
  shadowRadius: radiusPx,
  elevation: 12,
});
