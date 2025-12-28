import { createTheme } from "@mui/material/styles";

/**
 * Create MUI theme with dark/light mode support
 * @param {boolean} isDark - Whether dark mode is enabled
 * @returns {Theme} MUI theme object
 */
export const createMuiTheme = (isDark) => {
    return createTheme({
        palette: {
            mode: isDark ? "dark" : "light",
            primary: {
                main: isDark ? "#90caf9" : "#1976d2",
                light: isDark ? "#e3f2fd" : "#42a5f5",
                dark: isDark ? "#42a5f5" : "#1565c0",
                contrastText: isDark ? "#000" : "#fff",
            },
            secondary: {
                main: isDark ? "#ce93d8" : "#9c27b0",
                light: isDark ? "#f3e5f5" : "#ba68c8",
                dark: isDark ? "#ab47bc" : "#7b1fa2",
                contrastText: isDark ? "#000" : "#fff",
            },
            error: {
                main: isDark ? "#f44336" : "#d32f2f",
                light: isDark ? "#e57373" : "#ef5350",
                dark: isDark ? "#d32f2f" : "#c62828",
            },
            warning: {
                main: isDark ? "#ffa726" : "#ed6c02",
                light: isDark ? "#ffb74d" : "#ff9800",
                dark: isDark ? "#f57c00" : "#e65100",
            },
            info: {
                main: isDark ? "#29b6f6" : "#0288d1",
                light: isDark ? "#4fc3f7" : "#03a9f4",
                dark: isDark ? "#0288d1" : "#01579b",
            },
            success: {
                main: isDark ? "#66bb6a" : "#2e7d32",
                light: isDark ? "#81c784" : "#4caf50",
                dark: isDark ? "#388e3c" : "#1b5e20",
            },
            background: {
                default: isDark ? "#1e2939" : "#f5f5f5",
                paper: isDark ? "#1e2939" : "#ffffff",
            },
            text: {
                primary: isDark ? "#ffffff" : "rgba(0, 0, 0, 0.87)",
                secondary: isDark
                    ? "rgba(255, 255, 255, 0.7)"
                    : "rgba(0, 0, 0, 0.6)",
                disabled: isDark
                    ? "rgba(255, 255, 255, 0.5)"
                    : "rgba(0, 0, 0, 0.38)",
            },
            divider: isDark
                ? "rgba(255, 255, 255, 0.12)"
                : "rgba(0, 0, 0, 0.12)",
            action: {
                active: isDark ? "#fff" : "rgba(0, 0, 0, 0.54)",
                hover: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 0, 0, 0.04)",
                selected: isDark
                    ? "rgba(255, 255, 255, 0.16)"
                    : "rgba(0, 0, 0, 0.08)",
                disabled: isDark
                    ? "rgba(255, 255, 255, 0.3)"
                    : "rgba(0, 0, 0, 0.26)",
                disabledBackground: isDark
                    ? "rgba(255, 255, 255, 0.12)"
                    : "rgba(0, 0, 0, 0.12)",
            },
        },
        components: {
            MuiPaper: {
                styleOverrides: {
                    root: ({ theme }) => ({
                        backgroundColor: theme.palette.background.paper,
                        backgroundImage: "none",
                    }),
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: ({ theme }) => ({
                        backgroundColor: theme.palette.background.paper,
                        backgroundImage: "none",
                    }),
                },
            },
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        backgroundColor: (theme) =>
                            theme.palette.background.default,
                    },
                },
            },
        },
    });
};
