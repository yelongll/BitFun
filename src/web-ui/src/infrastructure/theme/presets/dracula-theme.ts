import { ThemeConfig } from '../types';

export const bitfunDraculaTheme: ThemeConfig = {
  id: 'bitfun-dracula',
  name: 'Dracula',
  type: 'dark',
  description: 'Dracula 主题 - 深紫色背景，鲜艳配色，经典吸血鬼美学',
  author: 'BitFun Team',
  version: '1.0.0',

  colors: {
    background: {
      primary: '#282a36',
      secondary: '#21222c',
      tertiary: '#343746',
      quaternary: '#44475a',
      elevated: '#21222c',
      workbench: '#282a36',
      scene: '#21222c',
      tooltip: 'rgba(33, 34, 44, 0.96)',
    },

    text: {
      primary: '#f8f8f2',
      secondary: '#f8f8f2',
      muted: '#6272a4',
      disabled: '#6272a4',
    },

    accent: {
      50: 'rgba(139, 233, 253, 0.04)',
      100: 'rgba(139, 233, 253, 0.08)',
      200: 'rgba(139, 233, 253, 0.14)',
      300: 'rgba(139, 233, 253, 0.22)',
      400: 'rgba(139, 233, 253, 0.36)',
      500: '#8be9fd',
      600: '#8be9fd',
      700: 'rgba(139, 233, 253, 0.8)',
      800: 'rgba(139, 233, 253, 0.9)',
    },

    purple: {
      50: 'rgba(189, 147, 249, 0.04)',
      100: 'rgba(189, 147, 249, 0.08)',
      200: 'rgba(189, 147, 249, 0.14)',
      300: 'rgba(189, 147, 249, 0.22)',
      400: 'rgba(189, 147, 249, 0.36)',
      500: '#bd93f9',
      600: '#bd93f9',
      700: 'rgba(189, 147, 249, 0.8)',
      800: 'rgba(189, 147, 249, 0.9)',
    },

    semantic: {
      success: '#50fa7b',
      successBg: 'rgba(80, 250, 123, 0.15)',
      successBorder: 'rgba(80, 250, 123, 0.35)',

      warning: '#ffb86c',
      warningBg: 'rgba(255, 184, 108, 0.15)',
      warningBorder: 'rgba(255, 184, 108, 0.35)',

      error: '#ff5555',
      errorBg: 'rgba(255, 85, 85, 0.15)',
      errorBorder: 'rgba(255, 85, 85, 0.35)',

      info: '#8be9fd',
      infoBg: 'rgba(139, 233, 253, 0.15)',
      infoBorder: 'rgba(139, 233, 253, 0.35)',

      highlight: '#f1fa8c',
      highlightBg: 'rgba(241, 250, 140, 0.20)',
    },

    border: {
      subtle: 'rgba(98, 114, 164, 0.15)',
      base: 'rgba(98, 114, 164, 0.22)',
      medium: 'rgba(98, 114, 164, 0.32)',
      strong: 'rgba(98, 114, 164, 0.42)',
      prominent: 'rgba(98, 114, 164, 0.52)',
    },

    element: {
      subtle: 'rgba(189, 147, 249, 0.06)',
      soft: 'rgba(189, 147, 249, 0.10)',
      base: 'rgba(189, 147, 249, 0.14)',
      medium: 'rgba(189, 147, 249, 0.18)',
      strong: 'rgba(189, 147, 249, 0.24)',
      elevated: 'rgba(33, 34, 44, 0.95)',
    },

    git: {
      branch: '#bd93f9',
      branchBg: 'rgba(189, 147, 249, 0.15)',
      changes: '#ffb86c',
      changesBg: 'rgba(255, 184, 108, 0.15)',
      added: '#50fa7b',
      addedBg: 'rgba(80, 250, 123, 0.15)',
      deleted: '#ff5555',
      deletedBg: 'rgba(255, 85, 85, 0.15)',
      staged: '#50fa7b',
      stagedBg: 'rgba(80, 250, 123, 0.15)',
    },
  },

  effects: {
    shadow: {
      xs: '0 1px 2px rgba(40, 42, 54, 0.30)',
      sm: '0 2px 4px rgba(40, 42, 54, 0.35)',
      base: '0 4px 8px rgba(40, 42, 54, 0.40)',
      lg: '0 8px 16px rgba(40, 42, 54, 0.45)',
      xl: '0 12px 24px rgba(40, 42, 54, 0.50)',
      '2xl': '0 16px 32px rgba(40, 42, 54, 0.55)',
    },

    glow: {
      blue: '0 8px 24px rgba(139, 233, 253, 0.25), 0 4px 12px rgba(139, 233, 253, 0.15)',
      purple: '0 8px 24px rgba(189, 147, 249, 0.25), 0 4px 12px rgba(189, 147, 249, 0.15)',
      mixed: '0 8px 24px rgba(189, 147, 249, 0.18), 0 4px 12px rgba(139, 233, 253, 0.12)',
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
        dot: 'rgba(139, 233, 253, 0.55)',
        dotShadow: '0 0 4px rgba(139, 233, 253, 0.20)',
        hoverBg: 'rgba(139, 233, 253, 0.14)',
        hoverColor: '#8be9fd',
        hoverBorder: 'rgba(139, 233, 253, 0.25)',
        hoverShadow: '0 2px 8px rgba(139, 233, 253, 0.15)',
      },
      maximize: {
        dot: 'rgba(80, 250, 123, 0.55)',
        dotShadow: '0 0 4px rgba(80, 250, 123, 0.20)',
        hoverBg: 'rgba(80, 250, 123, 0.14)',
        hoverColor: '#50fa7b',
        hoverBorder: 'rgba(80, 250, 123, 0.25)',
        hoverShadow: '0 2px 8px rgba(80, 250, 123, 0.15)',
      },
      close: {
        dot: 'rgba(255, 85, 85, 0.55)',
        dotShadow: '0 0 4px rgba(255, 85, 85, 0.20)',
        hoverBg: 'rgba(255, 85, 85, 0.14)',
        hoverColor: '#ff5555',
        hoverBorder: 'rgba(255, 85, 85, 0.25)',
        hoverShadow: '0 2px 8px rgba(255, 85, 85, 0.15)',
      },
      common: {
        defaultColor: 'rgba(248, 248, 242, 0.95)',
        defaultDot: 'rgba(98, 114, 164, 0.28)',
        disabledDot: 'rgba(98, 114, 164, 0.15)',
        flowGradient: 'linear-gradient(90deg, transparent, rgba(98, 114, 164, 0.06), rgba(98, 114, 164, 0.10), rgba(98, 114, 164, 0.06), transparent)',
      },
    },

    button: {
      default: {
        background: 'rgba(189, 147, 249, 0.10)',
        color: '#f8f8f2',
        border: 'transparent',
        shadow: 'none',
      },
      hover: {
        background: 'rgba(189, 147, 249, 0.18)',
        color: '#f8f8f2',
        border: 'transparent',
        shadow: 'none',
        transform: 'none',
      },
      active: {
        background: 'rgba(189, 147, 249, 0.14)',
        color: '#f8f8f2',
        border: 'transparent',
        shadow: 'none',
        transform: 'none',
      },

      primary: {
        default: {
          background: 'rgba(189, 147, 249, 0.20)',
          color: '#bd93f9',
          border: 'transparent',
          shadow: 'none',
        },
        hover: {
          background: 'rgba(189, 147, 249, 0.30)',
          color: '#bd93f9',
          border: 'transparent',
          shadow: 'none',
          transform: 'none',
        },
        active: {
          background: 'rgba(189, 147, 249, 0.25)',
          color: '#bd93f9',
          border: 'transparent',
          shadow: 'none',
          transform: 'none',
        },
      },

      ghost: {
        default: {
          background: 'transparent',
          color: '#f8f8f2',
          border: 'transparent',
          shadow: 'none',
        },
        hover: {
          background: 'rgba(189, 147, 249, 0.12)',
          color: '#f8f8f2',
          border: 'transparent',
          shadow: 'none',
          transform: 'none',
        },
        active: {
          background: 'rgba(189, 147, 249, 0.08)',
          color: '#f8f8f2',
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
      { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff79c6' },
      { token: 'string', foreground: 'f1fa8c' },
      { token: 'number', foreground: 'bd93f9' },
      { token: 'type', foreground: '8be9fd' },
      { token: 'class', foreground: '8be9fd' },
      { token: 'function', foreground: '50fa7b' },
      { token: 'variable', foreground: 'f8f8f2' },
      { token: 'constant', foreground: 'ffb86c' },
      { token: 'operator', foreground: 'ff79c6' },
      { token: 'tag', foreground: 'ff79c6' },
      { token: 'attribute.name', foreground: '50fa7b' },
      { token: 'attribute.value', foreground: 'f1fa8c' },
    ],
    colors: {
      background: '#282a36',
      foreground: '#f8f8f2',
      lineHighlight: '#44475a',
      selection: 'rgba(189, 147, 249, 0.30)',
      cursor: '#f8f8f2',

      'editor.selectionBackground': 'rgba(189, 147, 249, 0.30)',
      'editor.selectionForeground': '#f8f8f2',
      'editor.inactiveSelectionBackground': 'rgba(189, 147, 249, 0.20)',
      'editor.selectionHighlightBackground': 'rgba(189, 147, 249, 0.22)',
      'editor.selectionHighlightBorder': 'rgba(189, 147, 249, 0.40)',
      'editorCursor.foreground': '#f8f8f2',

      'editor.wordHighlightBackground': 'rgba(189, 147, 249, 0.15)',
      'editor.wordHighlightStrongBackground': 'rgba(189, 147, 249, 0.25)',
    },
  },
};
