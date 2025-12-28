import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from "react";

function applyThemeToDom(isDark) {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const body = document.body;

    // Remove any existing theme classes first
    root.classList.remove("dark", "light");
    body.classList.remove("dark", "light");

    if (isDark) {
        root.classList.add("dark");
        root.setAttribute("data-theme", "dark");
        root.style.colorScheme = "dark";
        body.style.colorScheme = "dark";
    } else {
        root.classList.add("light");
        root.setAttribute("data-theme", "light");
        root.style.colorScheme = "light";
        body.style.colorScheme = "light";
    }

    // Force a reflow to ensure styles are applied
    void root.offsetHeight;
}

// Apply saved preference ASAP (pre-React) to avoid any mismatch
if (typeof window !== "undefined" && typeof document !== "undefined") {
    try {
        const saved = localStorage.getItem("theme");
        const preferDark = saved ? saved === "dark" : true;
        applyThemeToDom(preferDark);
    } catch {}
}

const ThemeContext = createContext(null);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("theme");
            if (saved) return saved === "dark";
        }
        return true; // default to dark
    });

    useEffect(() => {
        applyThemeToDom(isDark);
        if (typeof window !== "undefined") {
            localStorage.setItem("theme", isDark ? "dark" : "light");
        }
    }, [isDark]);

    const toggleTheme = useCallback(() => {
        setIsDark((prev) => {
            const next = !prev;
            // Immediately apply to DOM before React re-render
            if (typeof document !== "undefined") {
                applyThemeToDom(next);
                if (typeof window !== "undefined") {
                    localStorage.setItem("theme", next ? "dark" : "light");
                }
            }
            return next;
        });
    }, [isDark]);

    const setTheme = useCallback((theme) => {
        setIsDark(theme === "dark");
    }, []);

    const value = useMemo(
        () => ({
            isDark,
            theme: isDark ? "dark" : "light",
            toggleTheme,
            setTheme,
        }),
        [isDark, toggleTheme, setTheme],
    );

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
};
