export default {
    content: ["./src/pages/Landing.jsx"],
    corePlugins: {
        preflight: false, // Don't crash existing index.css
    },
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#b026ff", "primary-dark": "#7c1cbd",
                "secondary": "#00f0ff", "background-light": "#f8fafc",
                "background-dark": "#05010d", "card-bg": "rgba(255, 255, 255, 0.03)",
            },
            fontFamily: {
                "display": ["Manrope", "sans-serif"],
                "body": ["Inter", "sans-serif"],
            },
            borderRadius: { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "2xl": "1rem", "3xl": "1.5rem", "full": "9999px" },
            boxShadow: {
                "neon": "0 0 20px rgba(176, 38, 255, 0.4), 0 0 60px rgba(176, 38, 255, 0.2)",
                "cyan-glow": "0 0 20px rgba(0, 240, 255, 0.4), 0 0 40px rgba(0, 240, 255, 0.2)",
                "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
                "inner-light": "inset 0 1px 1px rgba(255, 255, 255, 0.15)",
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "mesh": "radial-gradient(at 0% 0%, hsla(270,50%,10%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(290,40%,15%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(250,50%,20%,1) 0, transparent 50%)",
            }
        },
    },
}
