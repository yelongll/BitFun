import { ThemeConfig } from '../types';

export const bitfunOneDarkTheme: ThemeConfig = {
  id: 'bitfun-one-dark',
  name: 'One Dark',
  type: 'dark',
  description: 'One Dark 主题 - Atom 编辑器经典主题，干净专业',
  author: 'BitFun Team',
  version: '1.0.0',

  colors: {
    background: {
      primary: '#282c34',
      secondary: '#21252b',
      tertiary: '#3e4451',
      quaternary: '#4b5263',
      elevated: '#21252b',
      workbench: '#282c34',
      scene: '#21252b',
      tooltip: 'rgba(33, 37, 43, 0.96)',
    },

    text: {
      primary: '#abb2bf',
      secondary: '#abb2bf',
      muted: '#5c6370',
      disabled: '#5c6370',
    },

    accent: {
      50: 'rgba(97, 175, 239, 0.04)',
      100: 'rgba(97, 175, 239, 0.08)',
      200: 'rgba(97, 175, 239, 0.14)',
      300: 'rgba(97, 175, 239, 0.22)',
      400: 'rgba(97, 175, 239, 0.36)',
      500: '#61afef',
      600: '#61afef',
      700: 'rgba(97, 175, 239, 0.8)',
      800: 'rgba(97, 175, 239, 0.9)',
    },

    purple: {
      50: 'rgba(198, 120, 221, 0.04)',
      100: 'rgba(198, 120, 221, 0.08)',
      200: 'rgba(198, 120, 221, 0.14)',
      300: 'rgba(198, 120, 221, 0.22)',
      400: 'rgba(198, 120, 221, 0.36)',
      500: '#c678dd',
      600: '#c678dd',
      700: 'rgba(198, 120, 221, 0.8)',
      800: 'rgba(198, 120, 221, 0.9)',
    },

    semantic: {
      success: '#98c379',
      successBg: 'rgba(152, 195, 121, 0.15)',
      successBorder: 'rgba(152, 195, 121, 0.35)',

      warning: '#e5c07b',
      warningBg: 'rgba(229, 192, 123, 0.15)',
      warningBorder: 'rgba(229, 192, 123, 0.35)',

      error: '#e06c75',
      errorBg: 'rgba(224, 108, 117, 0.15)',
      errorBorder: 'rgba(224, 108, 117, 0.35)',

      info: '#61afef',
      infoBg: 'rgba(97, 175, 239, 0.15)',
      infoBorder: 'rgba(97, 175, 239, 0.35)',

      highlight: '#e5c07b',
      highlightBg: 'rgba(229, 192, 123, 0.20)',
    },

    border: {
      subtle: 'rgba(92, 99, 112, 0.15)',
      base: 'rgba(92, 99, 112, 0.22)',
      medium: 'rgba(92, 99, 112, 0.32)',
      strong: 'rgba(92, 99, 112, 0.42)',
      prominent: 'rgba(92, 99, 112, 0.52)',
    },

    element: {
      subtle: 'rgba(97, 175, 239, 0.06)',
      soft: 'rgba(97, 175, 239, 0.10)',
      base: 'rgba(97, 175, 239, 0.14)',
      medium: 'rgba(97, 175, 239, 0.18)',
      strong: 'rgba(97, 175, 239, 0.24)',
      elevated: 'rgba(33, 37, 43, 0.95)',
    },

    git: {
      branch: '#61afef',
      branchBg: 'rgba(97, 175, 239, 0.15)',
      changes: '#e5c07b',
      changesBg: 'rgba(229, 192, 123, 0.15)',
      added: '#98c379',
      addedBg: 'rgba(152, 195, 121, 0.15)',
      deleted: '#e06c75',
      deletedBg: 'rgba(224, 108, 117, 0.15)',
      staged: '#98c379',
      stagedBg: 'rgba(152, 195, 121, 0.15)',
    },
  },

  effects: {
    shadow: {
      xs: '0 1px 2px rgba(40, 44, 52, 0.30)',
      sm: '0 2px 4px rgba(40, 44, 52, 0.35)',
      base: '0 4px 8px rgba(40, 44, 52, 0.40)',
      lg: '0 8px 16px rgba(40, 44, 52, 0.45)',
      xl: '0 12px 24px rgba(40, 44, 52, 0.50)',
      '2xl': '0 16px 32px rgba(40, 44, 52, 0.55)',
    },

    glow: {
      blue: '0 8px 24px rgba(97, 175, 239, 0.25), 0 4px 12px rgba(97, 175, 239, 0.15)',
      purple: '0 8px 24px rgba(198, 120, 221, 0.25), 0 4px 12px rgba(198, 120, 221, 0.15)',
      mixed: '0 8px 24px rgba(97, 175, 239, 0.18), 0 4px 12px rgba(198, 120, 221, 0.12)',
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
        dot: 'rgba(97, 175, 239, 0.55)',
        dotShadow: '0 0 4px rgba(97, 175, 239, 0.20)',
        hoverBg: 'rgba(97, 175, 239, 0.14)',
        hoverColor: '#61afef',
        hoverBorder: 'rgba(97, 175, 239, 0.25)',
        hoverShadow: '0 2px 8px rgba(97, 175, 239, 0.15)',
      },
      maximize: {
        dot: 'rgba(152, 195, 121, 0.55)',
        dotShadow: '0 0 4px rgba(152, 195, 121, 0.20)',
        hoverBg: 'rgba(152, 195, 121, 0.14)',
        hoverColor: '#98c379',
        hoverBorder: 'rgba(152, 195, 121, 0.25)',
        hoverShadow: '0 2px 8px rgba(152, 195, 121, 0.15)',
      },
      close: {
        dot: 'rgba(224, 108, 117, 0.55)',
        dotShadow: '0 0 4px rgba(224, 108, 117, 0.20)',
        hoverBg: 'rgba(224, 108, 117, 0.14)',
        hoverColor: '#e06c75',
        hoverBorder: 'rgba(224, 108, 117, 0.25)',
        hoverShadow: '0 2px 8px rgba(224, 108, 117, 0.15)',
      },
      common: {
        defaultColor: 'rgba(171, 178, 191, 0.95)',
        defaultDot: 'rgba(92, 99, 112, 0.28)',
        disabledDot: 'rgba(92, 99, 112, 0.15)',
        flowGradient: 'linear-gradient(90deg, transparent, rgba(92, 99, 112, 0.06), rgba(92, 99, 112, 0.10), rgba(92, 99, 112, 0.06), transparent)',
      },
    },

    button: {
      default: {
        background: 'rgba(97, 175, 239, 0.10)',
        color: '#abb2bf',
        border: 'transparent',
        shadow: 'none',
      },
      hover: {
        background: 'rgba(97, 175, 239, 0.18)',
        color: '#abb2bf',
        border: 'transparent',
        shadow: 'none',
        transform: 'none',
      },
      active: {
        background: 'rgba(97, 175, 239, 0.14)',
        color: '#abb2bf',
        border: 'transparent',
        shadow: 'none',
        transform: 'none',
      },

      primary: {
        default: {
          background: 'rgba(97, 175, 239, 0.20)',
          color: '#61afef',
          border: 'transparent',
          shadow: 'none',
        },
        hover: {
          background: 'rgba(97, 175, 239, 0.30)',
          color: '#61afef',
          border: 'transparent',
          shadow: 'none',
          transform: 'none',
        },
        active: {
          background: 'rgba(97, 175, 239, 0.25)',
          color: '#61afef',
          border: 'transparent',
          shadow: 'none',
          transform: 'none',
        },
      },

      ghost: {
        default: {
          background: 'transparent',
          color: '#abb2bf',
          border: 'transparent',
          shadow: 'none',
        },
        hover: {
          background: 'rgba(97, 175, 239, 0.12)',
          color: '#abb2bf',
          border: 'transparent',
          shadow: 'none',
          transform: 'none',
        },
        active: {
          background: 'rgba(97, 175, 239, 0.08)',
          color: '#abb2bf',
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
      { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'c678dd' },
      { token: 'string', foreground: '98c379' },
      { token: 'number', foreground: 'd19a66' },
      { token: 'type', foreground: 'e5c07b' },
      { token: 'class', foreground: 'e5c07b' },
      { token: 'function', foreground: '61afef' },
      { token: 'variable', foreground: 'abb2bf' },
      { token: 'constant', foreground: 'd19a66' },
      { token: 'operator', foreground: '56b6c2' },
      { token: 'tag', foreground: 'e06c75' },
      { token: 'attribute.name', foreground: 'e06c75' },
      { token: 'attribute.value', foreground: '98c379' },
    ],
    colors: {
      background: '#282c34',
      foreground: '#abb2bf',
      lineHighlight: '#3e4451',
      selection: 'rgba(97, 175, 239, 0.30)',
      cursor: '#528bff',

      'editor.selectionBackground': 'rgba(97, 175, 239, 0.30)',
      'editor.selectionForeground': '#abb2bf',
      'editor.inactiveSelectionBackground': 'rgba(97, 175, 239, 0.20)',
      'editor.selectionHighlightBackground': 'rgba(97, 175, 239, 0.22)',
      'editor.selectionHighlightBorder': 'rgba(97, 175, 239, 0.40)',
      'editorCursor.foreground': '#528bff',

      'editor.wordHighlightBackground': 'rgba(97, 175, 239, 0.15)',
      'editor.wordHighlightStrongBackground': 'rgba(97, 175, 239, 0.25)',
    },
  },
};
