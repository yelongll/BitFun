import { ThemeConfig } from '../types';

export const bitfunSolarizedDarkTheme: ThemeConfig = {
  id: 'bitfun-solarized-dark',
  name: 'Solarized Dark',
  type: 'dark',
  description: 'Solarized Dark 主题 - 经典 Solarized 深色，精确配色方案',
  author: '空灵语言 团队',
  version: '1.0.0',

  colors: {
    background: {
      primary: '#002b36',
      secondary: '#073642',
      tertiary: '#073642',
      quaternary: '#094b5a',
      elevated: '#073642',
      workbench: '#002b36',
      scene: '#073642',
      tooltip: 'rgba(7, 54, 66, 0.96)',
    },

    text: {
      primary: '#839496',
      secondary: '#93a1a1',
      muted: '#657b83',
      disabled: '#586e75',
    },

    accent: {
      50: 'rgba(38, 139, 210, 0.04)',
      100: 'rgba(38, 139, 210, 0.08)',
      200: 'rgba(38, 139, 210, 0.14)',
      300: 'rgba(38, 139, 210, 0.22)',
      400: 'rgba(38, 139, 210, 0.36)',
      500: '#268bd2',
      600: '#268bd2',
      700: 'rgba(38, 139, 210, 0.8)',
      800: 'rgba(38, 139, 210, 0.9)',
    },

    purple: {
      50: 'rgba(108, 113, 196, 0.04)',
      100: 'rgba(108, 113, 196, 0.08)',
      200: 'rgba(108, 113, 196, 0.14)',
      300: 'rgba(108, 113, 196, 0.22)',
      400: 'rgba(108, 113, 196, 0.36)',
      500: '#6c71c4',
      600: '#6c71c4',
      700: 'rgba(108, 113, 196, 0.8)',
      800: 'rgba(108, 113, 196, 0.9)',
    },

    semantic: {
      success: '#859900',
      successBg: 'rgba(133, 153, 0, 0.15)',
      successBorder: 'rgba(133, 153, 0, 0.35)',

      warning: '#b58900',
      warningBg: 'rgba(181, 137, 0, 0.15)',
      warningBorder: 'rgba(181, 137, 0, 0.35)',

      error: '#dc322f',
      errorBg: 'rgba(220, 50, 47, 0.15)',
      errorBorder: 'rgba(220, 50, 47, 0.35)',

      info: '#268bd2',
      infoBg: 'rgba(38, 139, 210, 0.15)',
      infoBorder: 'rgba(38, 139, 210, 0.35)',

      highlight: '#cb4b16',
      highlightBg: 'rgba(203, 75, 22, 0.20)',
    },

    border: {
      subtle: 'rgba(88, 110, 117, 0.15)',
      base: 'rgba(88, 110, 117, 0.22)',
      medium: 'rgba(88, 110, 117, 0.32)',
      strong: 'rgba(88, 110, 117, 0.42)',
      prominent: 'rgba(88, 110, 117, 0.52)',
    },

    element: {
      subtle: 'rgba(38, 139, 210, 0.06)',
      soft: 'rgba(38, 139, 210, 0.10)',
      base: 'rgba(38, 139, 210, 0.14)',
      medium: 'rgba(38, 139, 210, 0.18)',
      strong: 'rgba(38, 139, 210, 0.24)',
      elevated: 'rgba(7, 54, 66, 0.95)',
    },

    git: {
      branch: '#268bd2',
      branchBg: 'rgba(38, 139, 210, 0.15)',
      changes: '#b58900',
      changesBg: 'rgba(181, 137, 0, 0.15)',
      added: '#859900',
      addedBg: 'rgba(133, 153, 0, 0.15)',
      deleted: '#dc322f',
      deletedBg: 'rgba(220, 50, 47, 0.15)',
      staged: '#859900',
      stagedBg: 'rgba(133, 153, 0, 0.15)',
    },
  },

  effects: {
    shadow: {
      xs: '0 1px 2px rgba(0, 43, 54, 0.30)',
      sm: '0 2px 4px rgba(0, 43, 54, 0.35)',
      base: '0 4px 8px rgba(0, 43, 54, 0.40)',
      lg: '0 8px 16px rgba(0, 43, 54, 0.45)',
      xl: '0 12px 24px rgba(0, 43, 54, 0.50)',
      '2xl': '0 16px 32px rgba(0, 43, 54, 0.55)',
    },

    glow: {
      blue: '0 8px 24px rgba(38, 139, 210, 0.25), 0 4px 12px rgba(38, 139, 210, 0.15)',
      purple: '0 8px 24px rgba(108, 113, 196, 0.25), 0 4px 12px rgba(108, 113, 196, 0.15)',
      mixed: '0 8px 24px rgba(38, 139, 210, 0.18), 0 4px 12px rgba(108, 113, 196, 0.12)',
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
        dot: 'rgba(38, 139, 210, 0.55)',
        dotShadow: '0 0 4px rgba(38, 139, 210, 0.20)',
        hoverBg: 'rgba(38, 139, 210, 0.14)',
        hoverColor: '#268bd2',
        hoverBorder: 'rgba(38, 139, 210, 0.25)',
        hoverShadow: '0 2px 8px rgba(38, 139, 210, 0.15)',
      },
      maximize: {
        dot: 'rgba(133, 153, 0, 0.55)',
        dotShadow: '0 0 4px rgba(133, 153, 0, 0.20)',
        hoverBg: 'rgba(133, 153, 0, 0.14)',
        hoverColor: '#859900',
        hoverBorder: 'rgba(133, 153, 0, 0.25)',
        hoverShadow: '0 2px 8px rgba(133, 153, 0, 0.15)',
      },
      close: {
        dot: 'rgba(220, 50, 47, 0.55)',
        dotShadow: '0 0 4px rgba(220, 50, 47, 0.20)',
        hoverBg: 'rgba(220, 50, 47, 0.14)',
        hoverColor: '#dc322f',
        hoverBorder: 'rgba(220, 50, 47, 0.25)',
        hoverShadow: '0 2px 8px rgba(220, 50, 47, 0.15)',
      },
      common: {
        defaultColor: 'rgba(131, 148, 150, 0.95)',
        defaultDot: 'rgba(88, 110, 117, 0.28)',
        disabledDot: 'rgba(88, 110, 117, 0.15)',
        flowGradient: 'linear-gradient(90deg, transparent, rgba(88, 110, 117, 0.06), rgba(88, 110, 117, 0.10), rgba(88, 110, 117, 0.06), transparent)',
      },
    },

    button: {
      default: {
        background: 'rgba(38, 139, 210, 0.10)',
        color: '#839496',
        border: 'transparent',
        shadow: 'none',
      },
      hover: {
        background: 'rgba(38, 139, 210, 0.18)',
        color: '#93a1a1',
        border: 'transparent',
        shadow: 'none',
        transform: 'none',
      },
      active: {
        background: 'rgba(38, 139, 210, 0.14)',
        color: '#93a1a1',
        border: 'transparent',
        shadow: 'none',
        transform: 'none',
      },

      primary: {
        default: {
          background: 'rgba(38, 139, 210, 0.20)',
          color: '#268bd2',
          border: 'transparent',
          shadow: 'none',
        },
        hover: {
          background: 'rgba(38, 139, 210, 0.30)',
          color: '#268bd2',
          border: 'transparent',
          shadow: 'none',
          transform: 'none',
        },
        active: {
          background: 'rgba(38, 139, 210, 0.25)',
          color: '#268bd2',
          border: 'transparent',
          shadow: 'none',
          transform: 'none',
        },
      },

      ghost: {
        default: {
          background: 'transparent',
          color: '#839496',
          border: 'transparent',
          shadow: 'none',
        },
        hover: {
          background: 'rgba(38, 139, 210, 0.12)',
          color: '#93a1a1',
          border: 'transparent',
          shadow: 'none',
          transform: 'none',
        },
        active: {
          background: 'rgba(38, 139, 210, 0.08)',
          color: '#93a1a1',
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
      { token: 'comment', foreground: '586e75', fontStyle: 'italic' },
      { token: 'keyword', foreground: '859900' },
      { token: 'string', foreground: '2aa198' },
      { token: 'number', foreground: 'd33682' },
      { token: 'type', foreground: 'b58900' },
      { token: 'class', foreground: 'b58900' },
      { token: 'function', foreground: '268bd2' },
      { token: 'variable', foreground: '839496' },
      { token: 'constant', foreground: 'cb4b16' },
      { token: 'operator', foreground: '859900' },
      { token: 'tag', foreground: '268bd2' },
      { token: 'attribute.name', foreground: 'b58900' },
      { token: 'attribute.value', foreground: '2aa198' },
    ],
    colors: {
      background: '#002b36',
      foreground: '#839496',
      lineHighlight: '#073642',
      selection: 'rgba(38, 139, 210, 0.30)',
      cursor: '#839496',

      'editor.selectionBackground': 'rgba(38, 139, 210, 0.30)',
      'editor.selectionForeground': '#839496',
      'editor.inactiveSelectionBackground': 'rgba(38, 139, 210, 0.20)',
      'editor.selectionHighlightBackground': 'rgba(38, 139, 210, 0.22)',
      'editor.selectionHighlightBorder': 'rgba(38, 139, 210, 0.40)',
      'editorCursor.foreground': '#839496',

      'editor.wordHighlightBackground': 'rgba(38, 139, 210, 0.15)',
      'editor.wordHighlightStrongBackground': 'rgba(38, 139, 210, 0.25)',
    },
  },
};
