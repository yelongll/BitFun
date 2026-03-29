import { ThemeConfig } from '../types';

export const bitfunNordTheme: ThemeConfig = {
  id: 'bitfun-nord',
  name: 'Nord',
  type: 'dark',
  description: 'Nord 主题 - 北极蓝调色板，干净优雅',
  author: 'BitFun Team',
  version: '1.0.0',

  colors: {
    background: {
      primary: '#2e3440',
      secondary: '#3b4252',
      tertiary: '#434c5e',
      quaternary: '#4c566a',
      elevated: '#3b4252',
      workbench: '#2e3440',
      scene: '#3b4252',
      tooltip: 'rgba(59, 66, 82, 0.96)',
    },

    text: {
      primary: '#eceff4',
      secondary: '#e5e9f0',
      muted: '#d8dee9',
      disabled: '#81a1c1',
    },

    accent: {
      50: 'rgba(136, 192, 208, 0.04)',
      100: 'rgba(136, 192, 208, 0.08)',
      200: 'rgba(136, 192, 208, 0.14)',
      300: 'rgba(136, 192, 208, 0.22)',
      400: 'rgba(136, 192, 208, 0.36)',
      500: '#88c0d0',
      600: '#81a1c1',
      700: 'rgba(129, 161, 193, 0.8)',
      800: 'rgba(129, 161, 193, 0.9)',
    },

    purple: {
      50: 'rgba(180, 142, 173, 0.04)',
      100: 'rgba(180, 142, 173, 0.08)',
      200: 'rgba(180, 142, 173, 0.14)',
      300: 'rgba(180, 142, 173, 0.22)',
      400: 'rgba(180, 142, 173, 0.36)',
      500: '#b48ead',
      600: '#a3be8c',
      700: 'rgba(180, 142, 173, 0.8)',
      800: 'rgba(180, 142, 173, 0.9)',
    },

    semantic: {
      success: '#a3be8c',
      successBg: 'rgba(163, 190, 140, 0.15)',
      successBorder: 'rgba(163, 190, 140, 0.35)',

      warning: '#ebcb8b',
      warningBg: 'rgba(235, 203, 139, 0.15)',
      warningBorder: 'rgba(235, 203, 139, 0.35)',

      error: '#bf616a',
      errorBg: 'rgba(191, 97, 106, 0.15)',
      errorBorder: 'rgba(191, 97, 106, 0.35)',

      info: '#88c0d0',
      infoBg: 'rgba(136, 192, 208, 0.15)',
      infoBorder: 'rgba(136, 192, 208, 0.35)',

      highlight: '#ebcb8b',
      highlightBg: 'rgba(235, 203, 139, 0.20)',
    },

    border: {
      subtle: 'rgba(216, 222, 233, 0.10)',
      base: 'rgba(216, 222, 233, 0.15)',
      medium: 'rgba(216, 222, 233, 0.22)',
      strong: 'rgba(216, 222, 233, 0.32)',
      prominent: 'rgba(216, 222, 233, 0.42)',
    },

    element: {
      subtle: 'rgba(136, 192, 208, 0.06)',
      soft: 'rgba(136, 192, 208, 0.10)',
      base: 'rgba(136, 192, 208, 0.14)',
      medium: 'rgba(136, 192, 208, 0.18)',
      strong: 'rgba(136, 192, 208, 0.24)',
      elevated: 'rgba(59, 66, 82, 0.95)',
    },

    git: {
      branch: '#88c0d0',
      branchBg: 'rgba(136, 192, 208, 0.15)',
      changes: '#ebcb8b',
      changesBg: 'rgba(235, 203, 139, 0.15)',
      added: '#a3be8c',
      addedBg: 'rgba(163, 190, 140, 0.15)',
      deleted: '#bf616a',
      deletedBg: 'rgba(191, 97, 106, 0.15)',
      staged: '#a3be8c',
      stagedBg: 'rgba(163, 190, 140, 0.15)',
    },
  },

  effects: {
    shadow: {
      xs: '0 1px 2px rgba(46, 52, 64, 0.30)',
      sm: '0 2px 4px rgba(46, 52, 64, 0.35)',
      base: '0 4px 8px rgba(46, 52, 64, 0.40)',
      lg: '0 8px 16px rgba(46, 52, 64, 0.45)',
      xl: '0 12px 24px rgba(46, 52, 64, 0.50)',
      '2xl': '0 16px 32px rgba(46, 52, 64, 0.55)',
    },

    glow: {
      blue: '0 8px 24px rgba(136, 192, 208, 0.25), 0 4px 12px rgba(136, 192, 208, 0.15)',
      purple: '0 8px 24px rgba(180, 142, 173, 0.25), 0 4px 12px rgba(180, 142, 173, 0.15)',
      mixed: '0 8px 24px rgba(136, 192, 208, 0.18), 0 4px 12px rgba(180, 142, 173, 0.12)',
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
        dot: 'rgba(136, 192, 208, 0.55)',
        dotShadow: '0 0 4px rgba(136, 192, 208, 0.20)',
        hoverBg: 'rgba(136, 192, 208, 0.14)',
        hoverColor: '#88c0d0',
        hoverBorder: 'rgba(136, 192, 208, 0.25)',
        hoverShadow: '0 2px 8px rgba(136, 192, 208, 0.15)',
      },
      maximize: {
        dot: 'rgba(136, 192, 208, 0.55)',
        dotShadow: '0 0 4px rgba(136, 192, 208, 0.20)',
        hoverBg: 'rgba(136, 192, 208, 0.14)',
        hoverColor: '#88c0d0',
        hoverBorder: 'rgba(136, 192, 208, 0.25)',
        hoverShadow: '0 2px 8px rgba(136, 192, 208, 0.15)',
      },
      close: {
        dot: 'rgba(191, 97, 106, 0.55)',
        dotShadow: '0 0 4px rgba(191, 97, 106, 0.20)',
        hoverBg: 'rgba(191, 97, 106, 0.14)',
        hoverColor: '#bf616a',
        hoverBorder: 'rgba(191, 97, 106, 0.25)',
        hoverShadow: '0 2px 8px rgba(191, 97, 106, 0.15)',
      },
      common: {
        defaultColor: 'rgba(236, 239, 244, 0.95)',
        defaultDot: 'rgba(216, 222, 233, 0.28)',
        disabledDot: 'rgba(216, 222, 233, 0.15)',
        flowGradient: 'linear-gradient(90deg, transparent, rgba(216, 222, 233, 0.06), rgba(216, 222, 233, 0.10), rgba(216, 222, 233, 0.06), transparent)',
      },
    },

    button: {
      default: {
        background: 'rgba(136, 192, 208, 0.10)',
        color: '#eceff4',
        border: 'transparent',
        shadow: 'none',
      },
      hover: {
        background: 'rgba(136, 192, 208, 0.18)',
        color: '#eceff4',
        border: 'transparent',
        shadow: 'none',
        transform: 'none',
      },
      active: {
        background: 'rgba(136, 192, 208, 0.14)',
        color: '#eceff4',
        border: 'transparent',
        shadow: 'none',
        transform: 'none',
      },

      primary: {
        default: {
          background: 'rgba(136, 192, 208, 0.20)',
          color: '#88c0d0',
          border: 'transparent',
          shadow: 'none',
        },
        hover: {
          background: 'rgba(136, 192, 208, 0.30)',
          color: '#88c0d0',
          border: 'transparent',
          shadow: 'none',
          transform: 'none',
        },
        active: {
          background: 'rgba(136, 192, 208, 0.25)',
          color: '#88c0d0',
          border: 'transparent',
          shadow: 'none',
          transform: 'none',
        },
      },

      ghost: {
        default: {
          background: 'transparent',
          color: '#eceff4',
          border: 'transparent',
          shadow: 'none',
        },
        hover: {
          background: 'rgba(136, 192, 208, 0.12)',
          color: '#eceff4',
          border: 'transparent',
          shadow: 'none',
          transform: 'none',
        },
        active: {
          background: 'rgba(136, 192, 208, 0.08)',
          color: '#eceff4',
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
      { token: 'comment', foreground: '616e88', fontStyle: 'italic' },
      { token: 'keyword', foreground: '81a1c1' },
      { token: 'string', foreground: 'a3be8c' },
      { token: 'number', foreground: 'b48ead' },
      { token: 'type', foreground: '8fbcbb' },
      { token: 'class', foreground: '8fbcbb' },
      { token: 'function', foreground: '88c0d0' },
      { token: 'variable', foreground: 'd8dee9' },
      { token: 'constant', foreground: 'ebcb8b' },
      { token: 'operator', foreground: '81a1c1' },
      { token: 'tag', foreground: '81a1c1' },
      { token: 'attribute.name', foreground: '8fbcbb' },
      { token: 'attribute.value', foreground: 'a3be8c' },
    ],
    colors: {
      background: '#2e3440',
      foreground: '#d8dee9',
      lineHighlight: '#3b4252',
      selection: 'rgba(136, 192, 208, 0.30)',
      cursor: '#d8dee9',

      'editor.selectionBackground': 'rgba(136, 192, 208, 0.30)',
      'editor.selectionForeground': '#d8dee9',
      'editor.inactiveSelectionBackground': 'rgba(136, 192, 208, 0.20)',
      'editor.selectionHighlightBackground': 'rgba(136, 192, 208, 0.22)',
      'editor.selectionHighlightBorder': 'rgba(136, 192, 208, 0.40)',
      'editorCursor.foreground': '#d8dee9',

      'editor.wordHighlightBackground': 'rgba(136, 192, 208, 0.15)',
      'editor.wordHighlightStrongBackground': 'rgba(136, 192, 208, 0.25)',
    },
  },
};
