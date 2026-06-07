/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: "#E6F0FF",
          100: "#B3D1FF",
          200: "#80B3FF",
          300: "#4D94FF",
          400: "#1A75FF",
          500: "#0A1628",
          600: "#0D1F35",
          700: "#0F2742",
          800: "#123052",
          900: "#163A63",
          950: "#070E1A",
        },
        "space": {
          700: "#0F2742",
          800: "#0D1F35",
          900: "#0A1628",
          950: "#070E1A",
        },
        "magnetic-blue": "#4F8EF7",
        "magnetic-purple": "#9B51E0",
        "magnetic-pink": "#F72585",
        "status-success": "#00C48C",
        "status-warning": "#FF8A00",
        "status-danger": "#FF4757",
        "status-info": "#17C3B2",
        "accent-gradient": {
          start: "#3B82F6",
          mid: "#8B5CF6",
          end: "#06B6D4",
        },
        warning: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },
        success: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
        },
        danger: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
          800: "#991B1B",
          900: "#7F1D1D",
        },
        info: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
      },
      fontFamily: {
        "space-grotesk": ['"Space Grotesk"', "sans-serif"],
        "jetbrains-mono": ['"JetBrains Mono"', "monospace"],
      },
      animation: {
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1)",
          },
          "50%": {
            boxShadow: "0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(59, 130, 246, 0.2)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "accent-gradient": "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #06B6D4 100%)",
        "magnetic-gradient": "linear-gradient(135deg, #4F8EF7 0%, #9B51E0 50%, #17C3B2 100%)",
        "magnetic-field":
          "radial-gradient(ellipse at 20% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(139, 92, 246, 0.12) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(6, 182, 212, 0.08) 0%, transparent 60%)",
      },
      boxShadow: {
        "glass": "0 8px 32px rgba(0, 0, 0, 0.3)",
        "glow-blue": "0 0 20px rgba(79, 142, 247, 0.3), 0 0 40px rgba(79, 142, 247, 0.1)",
        "glow-purple": "0 0 20px rgba(155, 81, 224, 0.3), 0 0 40px rgba(155, 81, 224, 0.1)",
      },
    },
  },
  plugins: [],
};
