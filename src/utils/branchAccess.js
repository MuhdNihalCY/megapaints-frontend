/**
 * Branch Access - Frontend
 * Single source of truth for "can user access this branch/customer?"
 * Must match backend/utils/branchAccess.js logic.
 */

function idEqual(a, b) {
    if (a == null || b == null) return false;
    const sa = (a._id || a).toString();
    const sb = (b._id || b).toString();
    return sa === sb;
}

/**
 * Check if user is admin (by role / isAdmin flag from API).
 */
export function isAdmin(user) {
    if (!user) return false;
    if (user.isAdmin === true) return true;
    const roles = user.roles || [];
    return (
        roles.includes("admin") === true ||
        roles.includes("super_admin") === true ||
        (Array.isArray(roles) &&
            roles.some(
                (r) =>
                    r &&
                    (String(r).toLowerCase() === "admin" ||
                        String(r).toLowerCase() === "super_admin")
            ))
    );
}

/**
 * Check if user can access a branch.
 * True if user is admin or user.branches includes branchId.
 */
export function canAccessBranch(user, branchId) {
    if (!user) return false;
    if (user.isAdmin === true) return true;
    if (isAdmin(user)) return true;
    const branches = user.branches || [];
    if (!branchId) return branches.length === 0;
    return branches.some((b) => idEqual(b, branchId));
}

/**
 * Check if user can manage (view/edit) a customer.
 */
export function canManageCustomer(user, customer) {
    if (!user || !customer) return false;
    const branchId = customer.branch_id || customer.branch;
    return canAccessBranch(user, branchId);
}
