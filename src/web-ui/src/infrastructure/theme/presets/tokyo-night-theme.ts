import { ThemeConfig } from '../types';

export const bitfunTokyoNightTheme: ThemeConfig = {
  id: 'bitfun-tokyo-night',
  name: 'Tokyo Night',
  type: 'dark',
  description: 'Tokyo Night 主题 - 东京夜景风格，深邃宁静',
  author: 'BitFun Team',
  version: '1.0.0',

  colors: {
    background: {
      primary: '#1a1b26',
      secondary: '#16161e',
      tertiary: '#24283b',
      quaternary: '#292e42',
      elevated: '#16161e',
      workbench: '#1a1b26',
      scene: '#16161e',
      tooltip: 'rgba(22, 22, 30, 0.96)',
    },

    text: {
      primary: '#c0caf5',
      secondary: '#a9b1d6',
      muted: '#565f89',
      disabled: '#565f89',
    },

    accent: {
      50: 'rgba(122, 162, 247, 0.04)',
      100: 'rgba(122, 162, 247, 0.08)',
      200: 'rgba(122, 162, 247, 0.14)',
      300: 'rgba(122, 162, 247, 0.22)',
      400: 'rgba(122, 162, 247, 0.36)',
      500: '#7aa2f7',
      600: '#7aa2f7',
      700: 'rgba(122, 162, 247, 0.8)',
      800: 'rgba(122, 162, 247, 0.9)',
    },

    purple: {
      50: 'rgba(187, 77, 160, 0.04)',
      100: 'rgba(187, 77, 160, 0.08)',
      200: 'rgba(187, 77, 160, 0.14)',
      300: 'rgba(187, 77, 160, 0.22)',
      400: 'rgba(187, 77, 160, 0.36)',
      500: '#bb9af7',
      600: '#bb9af7',
      700: 'rgba(187, 77, 160, 0.8)',
      800: 'rgba(187, 77, 160, 0.9)',
    },

    semantic: {
      success: '#9ece6a',
      successBg: 'rgba(158, 206, 106, 0.15)',
      successBorder: 'rgba(158, 206, 106, 0.35)',

      warning: '#e0af68',
      warningBg: 'rgba(224, 175, 104, 0.15)',
      warningBorder: 'rgba(224, 175, 104, 0.35)',

      error: '#f7768e',
      errorBg: 'rgba(247, 118, 142, 0.15)',
      errorBorder: 'rgba(247, 118, 142, 0.35)',

      info: '#7aa2f7',
      infoBg: 'rgba(122, 162, 247, 0.15)',
      infoBorder: 'rgba(122, 162, 247, 0.35)',

      highlight: '#ff9e64',
      highlightBg: 'rgba(255, 158, 100, 0.20)',
    },

    border: {
      subtle: 'rgba(86, 95, 137, 0.15)',
      base: 'rgba(86, 95, 137, 0.22)',
      medium: 'rgba(86, 95, 137, 0.32)',
      strong: 'rgba(86, 95, 137, 0.42)',
      prominent: 'rgba(86, 95, 137, 0.52)',
    },

    element: {
      subtle: 'rgba(122, 162, 247, 0.06)',
      soft: 'rgba(122, 162, 247, 0.10)',
      base: 'rgba(122, 162, 247, 0.14)',
      medium: 'rgba(122, 162, 247, 0.18)',
      strong: 'rgba(122, 162, 247, 0.24)',
      elevated: 'rgba(22, 22, 30, 0.95)',
    },

    git: {
      branch: '#7aa2f7',
      branchBg: 'rgba(122, 162, 247, 0.15)',
      changes: '#e0af68',
      changesBg: 'rgba(224, 175, 104, 0.15)',
      added: '#9ece6a',
      addedBg: 'rgba(158, 206, 106, 0.15)',
      deleted: '#f7768e',
      deletedBg: 'rgba(247, 118, 142, 0.15)',
      staged: '#9ece6a',
      stagedBg: 'rgba(158, 206, 106, 0.15)',
    },
  },

  effects: {
    shadow: {
      xs: '0 1px 2px rgba(26, 27, 38, 0.30)',
      sm: '0 2px 4px rgba(26, 27, 38, 0.35)',
      base: '0 4px 8px rgba(26, 27, 38, 0.40)',
      lg: '0 8px 16px rgba(26, 27, 38, 0.45)',
      xl: '0 12px 24px rgba(26, 27, 38, 0.50)',
      '2xl': '0 16px 32px rgba(26, 27, 38, 0.55)',
    },

    glow: {
      blue: '0 8px 24px rgba(122, 162, 247, 0.25), 0 4px 12px rgba(122, 162, 247, 0.15)',
      purple: '0 8px 24px rgba(187, 154, 247, 0.25), 0 4px 12px rgba(187, 154, 247, 0.15)',
      mixed: '0 8px 24px rgba(122, 162, 247, 0.18), 0 4px 12px rgba(187, 154, 247, 0.12)',
    },

    blur: {
      subtle: 'blur(4px) saturate(1.02)',
      base: 'blur(8px) saturate(1.05)',
      medium: 'blur(12px) saturate(1.08)',
      strong: 'blur(16px) saturate(1.10) brightness(1.02)',
      intense: 'blur(20px) saturate(1.12) brightness(1.03)',
    },

    radius: {
      sm: '6px',
      base: '8px',
      lg: '12px',
      xl: '16px',
      '2xl': '20px',
      full: '9999px',
    },

    spacing: {
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      5: '20px',
      6: '24px',
      8: '32px',
      10: '40px',
      12: '48px',
      16: '64px',
    },

    opacity: {
      disabled: 0.55,
      hover: 0.75,
      focus: 0.9,
      overlay: 0.35,
    },
  },

  motion: {
    duration: {
      instant: '0.1s',
      fast: '0.15s',
      base: '0.3s',
      slow: '0.6s',
      lazy: '1s',
    },

    easing: {
      standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
      decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
      accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  typography: {
    font: {
      sans: "'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Display', Roboto, sans-serif",
      mono: "'FiraCode', 'JetBrains Mono', 'SF Mono', 'Consolas', 'Liberation Mono', monospace",
    },

    weight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    size: {
      xs: '12px',
      sm: '14px',
      base: '15px',
      lg: '16px',
      xl: '18px',
      '2xl': '20px',
      '3xl': '24px',
      '4xl': '30px',
      '5xl': '36px',
    },

    lineHeight: {
      tight: 1.2,
      base: 1.5,
      relaxed: 1.6,
    },
  },

  components: {
    windowControls: {
      minimize: {
        dot: 'rgba(122, 162, 247, 0.55)',
        dotShadow: '0 0 4px rgba(122, 162, 247, 0.20)',
        hoverBg: 'rgba(122, 162, 247, 0.14)',
        hoverColor: '#7aa2f7',
        hoverBorder: 'rgba(122, 162, 247, 0.25)',
        hoverShadow: '0 2px 8px rgba(122, 162, 247, 0.15)',
      },
      maximize: {
        dot: 'rgba(158, 206, 106, 0.55)',
        dotShadow: '0 0 4px rgba(158, 206, 106, 0.20)',
        hoverBg: 'rgba(158, 206, 106, 0.14)',
        hoverColor: '#9ece6a',
        hoverBorder: 'rgba(158, 206, 106, 0.25)',
        hoverShadow: '0 2px 8px rgba(158, 206, 106, 0.15)',
      },
      close: {
        dot: 'rgba(247, 118, 142, 0.55)',
        dotShadow: '0 0 4px rgba(247, 118, 142, 0.20)',
        hoverBg: 'rgba(247, 118, 142, 0.14)',
        hoverColor: '#f7768e',
        hoverBorder: 'rgba(247, 118, 142, 0.25)',
        hoverShadow: '0 2px 8px rgba(247, 118, 142, 0.15)',
      },
      common: {
        defaultColor: 'rgba(192, 202, 245, 0.95)',
        defaultDot: 'rgba(86, 95, 137, 0.28)',
        disabledDot: 'rgba(86, 95, 137, 0.15)',
        flowGradient: 'linear-gradient(90deg, transparent, rgba(86, 95, 137, 0.06), rgba(86, 95, 137, 0.10), rgba(86, 95, 137, 0.06), transparent)',
      },
    },

    button: {
      default: {
        background: 'rgba(122, 162, 247, 0.10)',
        color: '#c0caf5',
        border: 'transparent',
        shadow: 'none',
      },
      hover: {
        background: 'rgba(122, 162, 247, 0.18)',
        color: '#c0caf5',
        border: 'transparent',
        shadow: 'none',
        transform: 'none',
      },
      active: {
        background: 'rgba(122, 162, 247, 0.14)',
        color: '#c0caf5',
        border: 'transparent',
        shadow: 'none',
        transform: 'none',
      },

      primary: {
        default: {
          background: 'rgba(122, 162, 247, 0.20)',
          color: '#7aa2f7',
          border: 'transparent',
          shadow: 'none',
        },
        hover: {
          background: 'rgba(122, 162, 247, 0.30)',
          color: '#7aa2f7',
          border: 'transparent',
          shadow: 'none',
          transform: 'none',
        },
        active: {
          background: 'rgba(122, 162, 247, 0.25)',
          color: '#7aa2f7',
          border: 'transparent',
          shadow: 'none',
          transform: 'none',
        },
      },

      ghost: {
        default: {
          background: 'transparent',
          color: '#c0caf5',
          border: 'transparent',
          shadow: 'none',
        },
        hover: {
          background: 'rgba(122, 162, 247, 0.12)',
          color: '#c0caf5',
          border: 'transparent',
          shadow: 'none',
          transform: 'none',
        },
        active: {
          background: 'rgba(122, 162, 247, 0.08)',
          color: '#c0caf5',
          border: 'transparent',
          shadow: 'none',
          transform: 'none',
        },
      },
    },
  },

  monaco: {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '565f89', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'bb9af7' },
      { token: 'string', foreground: '9ece6a' },
      { token: 'number', foreground: 'ff9e64' },
      { token: 'type', foreground: '2ac3de' },
      { token: 'class', foreground: '7aa2f7' },
      { token: 'function', foreground: '7aa2f7' },
      { token: 'variable', foreground: 'c0caf5' },
      { token: 'constant', foreground: 'ff9e64' },
      { token: 'operator', foreground: '89ddff' },
      { token: 'tag', foreground: 'f7768e' },
      { token: 'attribute.name', foreground: '73daca' },
      { token: 'attribute.value', foreground: '9ece6a' },
    ],
    colors: {
      background: '#1a1b26',
      foreground: '#c0caf5',
      lineHighlight: '#24283b',
      selection: 'rgba(122, 162, 247, 0.30)',
      cursor: '#c0caf5',

      'editor.selectionBackground': 'rgba(122, 162, 247, 0.30)',
      'editor.selectionForeground': '#c0caf5',
      'editor.inactiveSelectionBackground': 'rgba(122, 162, 247, 0.20)',
      'editor.selectionHighlightBackground': 'rgba(122, 162, 247, 0.22)',
      'editor.selectionHighlightBorder': 'rgba(122, 162, 247, 0.40)',
      'editorCursor.foreground': '#c0caf5',

      'editor.wordHighlightBackground': 'rgba(122, 162, 247, 0.15)',
      'editor.wordHighlightStrongBackground': 'rgba(122, 162, 247, 0.25)',
    },
  },
};
