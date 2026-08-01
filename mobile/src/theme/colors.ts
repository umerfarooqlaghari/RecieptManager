export const colors = {
  dark: {
    background: '#11101eff',
    card: 'rgba(255, 255, 255, 0.05)',
    text: '#ffffff',
    textDim: 'rgba(255, 255, 255, 0.4)',
    accent: '#8b5cf6',
    border: 'rgba(255, 255, 255, 0.1)',
    blob1: '#520c61',
    blob2: '#1f1923ff',
    blob3: '#5e0e59a9',
    button: '#3b82f6',
    inputBg: 'rgba(255, 255, 255, 0.4)',
  },
  light: {
    background: '#f8fafc',
    card: '#ffffff',
    text: '#1e293b',
    textDim: '#64748b',
    accent: '#3b82f6',
    border: '#e2e8f0',
    blob1: '#e0e7ff',
    blob2: '#f1f5f9',
    blob3: '#ede9fe',
    button: '#3b82f6',
    inputBg: '#ffffff',
  }
};

export type ThemeType = typeof colors.dark;
