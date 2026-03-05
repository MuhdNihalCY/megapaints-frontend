/**
 * Normalize a comment from API (snake_case) or mixed shape to a consistent frontend shape.
 * Used when merging comments into card state and when displaying in CommentsSection.
 * @param {Object} c - Raw comment (from API or state)
 * @returns {Object} Normalized comment with id, text, author.name, createdAt, updatedAt, etc.
 */
export function normalizeComment(c) {
    if (!c) return c;
    const author = c.author || {};
    const id = c.id ?? (c._id != null ? String(c._id) : null);
    const text = c.text ?? c.content ?? "";
    const createdAt = c.createdAt ?? c.created_at ?? null;
    const updatedAt = c.updatedAt ?? c.updated_at ?? null;
    return {
        ...c,
        id,
        _id: c._id ?? id,
        text,
        content: c.content ?? text,
        createdAt,
        updatedAt,
        created_at: createdAt,
        updated_at: updatedAt,
        author: {
            ...author,
            name: author.name ?? author.username ?? author.email ?? "Unknown",
        },
    };
}

/**
 * Build a tree of comments from a flat list using parent_comment_id.
 * @param {Array} comments - Flat list of comments
 * @returns {Array} Tree of comments with replies[] on each node, sorted by created_at
 */
export function buildCommentTree(comments) {
    if (!Array.isArray(comments) || comments.length === 0) return [];
    const list = comments.map((c) => ({ ...normalizeComment(c), _id: (c._id || c.id)?.toString?.() ?? c._id ?? c.id }));
    const byParent = {};
    list.forEach((c) => {
        const pid = c.parent_comment_id ? String(c.parent_comment_id) : null;
        if (!byParent[pid]) byParent[pid] = [];
        byParent[pid].push(c);
    });
    byParent[null] = byParent[null] || [];
    byParent[""] = byParent[""] || [];
    const roots = [...(byParent[null] || []), ...(byParent[""] || [])].sort(
        (a, b) => new Date(a.createdAt || a.created_at || 0) - new Date(b.createdAt || b.created_at || 0)
    );
    const getReplies = (parentId) =>
        (byParent[parentId != null ? String(parentId) : null] || []).sort(
            (a, b) => new Date(a.createdAt || a.created_at || 0) - new Date(b.createdAt || b.created_at || 0)
        );
    const nest = (item) => ({
        ...item,
        replies: getReplies(item.id ?? item._id).map(nest),
    });
    return roots.map(nest);
}
