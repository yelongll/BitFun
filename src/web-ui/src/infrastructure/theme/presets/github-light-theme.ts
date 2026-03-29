import { ThemeConfig } from '../types';

export const bitfunGitHubLightTheme: ThemeConfig = {
  id: 'bitfun-github-light',
  name: 'GitHub Light',
  type: 'light',
  description: 'GitHub Light 主题 - GitHub 风格，干净明亮',
  author: 'BitFun Team',
  version: '1.0.0',

  colors: {
    background: {
      primary: '#ffffff',
      secondary: '#f6f8fa',
      tertiary: '#eaeef2',
      quaternary: '#d0d7de',
      elevated: '#ffffff',
      workbench: '#f6f8fa',
      scene: '#f6f8fa',
      tooltip: 'rgba(255, 255, 255, 0.98)',
    },

    text: {
      primary: '#24292f',
      secondary: '#57606a',
      muted: '#6e7781',
      disabled: '#8c959f',
    },

    accent: {
      50: 'rgba(9, 105, 218, 0.04)',
      100: 'rgba(9, 105, 218, 0.08)',
      200: 'rgba(9, 105, 218, 0.14)',
      300: 'rgba(9, 105, 218, 0.22)',
      400: 'rgba(9, 105, 218, 0.36)',
      500: '#0969da',
      600: '#0969da',
      700: 'rgba(9, 105, 218, 0.8)',
      800: 'rgba(9, 105, 218, 0.9)',
    },

    purple: {
      50: 'rgba(130, 80, 223, 0.04)',
      100: 'rgba(130, 80, 223, 0.08)',
      200: 'rgba(130, 80, 223, 0.14)',
      300: 'rgba(130, 80, 223, 0.22)',
      400: 'rgba(130, 80, 223, 0.36)',
      500: '#8250df',
      600: '#8250df',
      700: 'rgba(130, 80, 223, 0.8)',
      800: 'rgba(130, 80, 223, 0.9)',
    },

    semantic: {
      success: '#1a7f37',
      successBg: 'rgba(26, 127, 55, 0.10)',
      successBorder: 'rgba(26, 127, 55, 0.30)',

      warning: '#9a6700',
      warningBg: 'rgba(154, 103, 0, 0.10)',
      warningBorder: 'rgba(154, 103, 0, 0.30)',

      error: '#cf222e',
      errorBg: 'rgba(207, 34, 46, 0.10)',
      errorBorder: 'rgba(207, 34, 46, 0.30)',

      info: '#0969da',
      infoBg: 'rgba(9, 105, 218, 0.10)',
      infoBorder: 'rgba(9, 105, 218, 0.30)',

      highlight: '#bf8700',
      highlightBg: 'rgba(191, 135, 0, 0.15)',
    },

    border: {
      subtle: 'rgba(208, 215, 222, 0.60)',
      base: 'rgba(208, 215, 222, 0.80)',
      medium: 'rgba(208, 215, 222, 1)',
      strong: 'rgba(175, 184, 193, 1)',
      prominent: 'rgba(143, 149, 158, 1)',
    },

    element: {
      subtle: 'rgba(9, 105, 218, 0.05)',
      soft: 'rgba(9, 105, 218, 0.08)',
      base: 'rgba(9, 105, 218, 0.12)',
      medium: 'rgba(9, 105, 218, 0.16)',
      strong: 'rgba(9, 105, 218, 0.22)',
      elevated: 'rgba(255, 255, 255, 0.95)',
    },

    git: {
      branch: '#0969da',
      branchBg: 'rgba(9, 105, 218, 0.10)',
      changes: '#9a6700',
      changesBg: 'rgba(154, 103, 0, 0.10)',
      added: '#1a7f37',
      addedBg: 'rgba(26, 127, 55, 0.10)',
      deleted: '#cf222e',
      deletedBg: 'rgba(207, 34, 46, 0.10)',
      staged: '#1a7f37',
      stagedBg: 'rgba(26, 127, 55, 0.10)',
    },
  },

  effects: {
    shadow: {
      xs: '0 1px 2px rgba(36, 41, 47, 0.04)',
      sm: '0 2px 4px rgba(36, 41, 47, 0.06)',
      base: '0 4px 8px rgba(36, 41, 47, 0.08)',
      lg: '0 8px 16px rgba(36, 41, 47, 0.10)',
      xl: '0 12px 24px rgba(36, 41, 47, 0.12)',
      '2xl': '0 16px 32px rgba(36, 41, 47, 0.14)',
    },

    glow: {
      blue: '0 8px 24px rgba(9, 105, 218, 0.12), 0 4px 12px rgba(9, 105, 218, 0.08)',
      purple: '0 8px 24px rgba(130, 80, 223, 0.12), 0 4px 12px rgba(130, 80, 223, 0.08)',
      mixed: '0 8px 24px rgba(9, 105, 218, 0.10), 0 4px 12px rgba(130, 80, 223, 0.06)',
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
        dot: 'rgba(9, 105, 218, 0.55)',
        dotShadow: '0 0 4px rgba(9, 105, 218, 0.20)',
        hoverBg: 'rgba(9, 105, 218, 0.10)',
        hoverColor: '#0969da',
        hoverBorder: 'rgba(9, 105, 218, 0.25)',
        hoverShadow: '0 2px 8px rgba(9, 105, 218, 0.12)',
      },
      maximize: {
        dot: 'rgba(26, 127, 55, 0.55)',
        dotShadow: '0 0 4px rgba(26, 127, 55, 0.20)',
        hoverBg: 'rgba(26, 127, 55, 0.10)',
        hoverColor: '#1a7f37',
        hoverBorder: 'rgba(26, 127, 55, 0.25)',
        hoverShadow: '0 2px 8px rgba(26, 127, 55, 0.12)',
      },
      close: {
        dot: 'rgba(207, 34, 46, 0.55)',
        dotShadow: '0 0 4px rgba(207, 34, 46, 0.20)',
        hoverBg: 'rgba(207, 34, 46, 0.10)',
        hoverColor: '#cf222e',
        hoverBorder: 'rgba(207, 34, 46, 0.25)',
        hoverShadow: '0 2px 8px rgba(207, 34, 46, 0.12)',
      },
      common: {
        defaultColor: 'rgba(36, 41, 47, 0.95)',
        defaultDot: 'rgba(110, 119, 129, 0.28)',
        disabledDot: 'rgba(110, 119, 129, 0.15)',
        flowGradient: 'linear-gradient(90deg, transparent, rgba(110, 119, 129, 0.04), rgba(110, 119, 129, 0.08), rgba(110, 119, 129, 0.04), transparent)',
      },
    },

    button: {
      default: {
        background: 'rgba(208, 215, 222, 0.40)',
        color: '#24292f',
        border: 'rgba(208, 215, 222, 1)',
        shadow: 'none',
      },
      hover: {
        background: 'rgba(208, 215, 222, 0.60)',
        color: '#24292f',
        border: 'rgba(208, 215, 222, 1)',
        shadow: 'none',
        transform: 'none',
      },
      active: {
        background: 'rgba(208, 215, 222, 0.50)',
        color: '#24292f',
        border: 'rgba(208, 215, 222, 1)',
        shadow: 'none',
        transform: 'none',
      },

      primary: {
        default: {
          background: '#1f883d',
          color: '#ffffff',
          border: 'transparent',
          shadow: 'none',
        },
        hover: {
          background: '#1a7f37',
          color: '#ffffff',
          border: 'transparent',
          shadow: 'none',
          transform: 'none',
        },
        active: {
          background: '#1a7f37',
          color: '#ffffff',
          border: 'transparent',
          shadow: 'none',
          transform: 'none',
        },
      },

      ghost: {
        default: {
          background: 'transparent',
          color: '#24292f',
          border: 'transparent',
          shadow: 'none',
        },
        hover: {
          background: 'rgba(208, 215, 222, 0.40)',
          color: '#24292f',
          border: 'transparent',
          shadow: 'none',
          transform: 'none',
        },
        active: {
          background: 'rgba(208, 215, 222, 0.30)',
          color: '#24292f',
          border: 'transparent',
          shadow: 'none',
          transform: 'none',
        },
      },
    },
  },

  monaco: {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6e7781', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'cf222e' },
      { token: 'string', foreground: '0a3069' },
      { token: 'number', foreground: '0550ae' },
      { token: 'type', foreground: '953800' },
      { token: 'class', foreground: '953800' },
      { token: 'function', foreground: '8250df' },
      { token: 'variable', foreground: '24292f' },
      { token: 'constant', foreground: '0550ae' },
      { token: 'operator', foreground: 'cf222e' },
      { token: 'tag', foreground: '116329' },
      { token: 'attribute.name', foreground: '0550ae' },
      { token: 'attribute.value', foreground: '0a3069' },
    ],
    colors: {
      background: '#ffffff',
      foreground: '#24292f',
      lineHighlight: '#f6f8fa',
      selection: 'rgba(180, 188, 204, 0.40)',
      cursor: '#24292f',

      'editor.selectionBackground': 'rgba(180, 188, 204, 0.40)',
      'editor.selectionForeground': '#24292f',
      'editor.inactiveSelectionBackground': 'rgba(180, 188, 204, 0.25)',
      'editor.selectionHighlightBackground': 'rgba(180, 188, 204, 0.30)',
      'editor.selectionHighlightBorder': 'rgba(180, 188, 204, 0.50)',
      'editorCursor.foreground': '#24292f',

      'editor.wordHighlightBackground': 'rgba(9, 105, 218, 0.10)',
      'editor.wordHighlightStrongBackground': 'rgba(9, 105, 218, 0.18)',
    },
  },
};
