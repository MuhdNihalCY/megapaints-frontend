/**
 * Token Debug Utilities
 * Helper functions to debug token authentication issues
 */

/**
 * Get current token status
 */
export function getTokenStatus() {
    try {
        const lastRole = localStorage.getItem("lastRole");
        const userToken = localStorage.getItem("user_access_token");
        const adminToken = localStorage.getItem("admin_access_token");
        const genericToken = localStorage.getItem("access_token");

        return {
            lastRole,
            userToken: userToken ? `${userToken.substring(0, 20)}...` : null,
            adminToken: adminToken ? `${adminToken.substring(0, 20)}...` : null,
            genericToken: genericToken
                ? `${genericToken.substring(0, 20)}...`
                : null,
            hasAnyToken: !!(userToken || adminToken || genericToken),
            note: "Uses in-memory role for token selection, not localStorage",
        };
    } catch (error) {
        return {
            error: error.message,
            hasAnyToken: false,
        };
    }
}

/**
 * Clear all tokens (for debugging)
 */
export function clearAllTokens() {
    try {
        localStorage.removeItem("user_access_token");
        localStorage.removeItem("admin_access_token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("lastRole");

        // Clear cookies
        document.cookie.split(";").forEach(function (c) {
            document.cookie = c
                .replace(/^ +/, "")
                .replace(
                    /=.*/,
                    "=;expires=" + new Date().toUTCString() + ";path=/",
                );
        });

        console.log("[Token Debug] All tokens cleared");
        return true;
    } catch (error) {
        console.error("[Token Debug] Error clearing tokens:", error);
        return false;
    }
}

/**
 * Log current token status to console
 */
export function logTokenStatus() {
    const status = getTokenStatus();
    console.log("[Token Debug] Current token status:", status);
    return status;
}
