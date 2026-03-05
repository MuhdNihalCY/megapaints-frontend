/**
 * CommentsSection Component - Enhanced with Advanced @Mentions
 * Handles comments with advanced @mentions functionality, notifications, and rich text
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageSquare,
    Send,
    Edit3,
    Trash2,
    AtSign,
    User,
    Clock,
    Bell,
    BellOff,
    Hash,
    AlertCircle,
    CheckCircle,
    X,
    Search,
    Filter,
    MoreHorizontal,
} from "lucide-react";
import { useKanban } from "../../contexts/KanbanContext";
import { buildCommentTree } from "../../utils/commentUtils";
import { extractMentionedUserIds } from "../../types/notificationModel";
import { useSafeNotifications } from "../../hooks/useSafeNotifications";

const CommentsSection = ({
    card,
    onUpdate,
    onCommentAdded,
    onCommentUpdated,
    onCommentDeleted,
}) => {
    const { users, addComment, updateComment, deleteComment, user: currentUser } = useKanban();
    const { createMentionNotificationsForComment } = useSafeNotifications();
    const [newComment, setNewComment] = useState("");
    const [editingComment, setEditingComment] = useState(null);
    const [editText, setEditText] = useState("");
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [mentionPosition, setMentionPosition] = useState(0);
    const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
    const [showMentionNotifications, setShowMentionNotifications] =
        useState(true);
    const [mentionSearch, setMentionSearch] = useState("");
    const [showAllMentions, setShowAllMentions] = useState(false);
    const [replyingToCommentId, setReplyingToCommentId] = useState(null);
    const textareaRef = useRef(null);
    const mentionRef = useRef(null);
    const editTextareaRef = useRef(null);

    // Enhanced user filtering for mentions
    const filteredUsers = users.filter((user) => {
        if (user.id === currentUser?.id) return false; // Don't show current user
        const query = mentionQuery.toLowerCase();
        return (
            user.name?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query) ||
            user.username?.toLowerCase().includes(query) ||
            user.designation?.toLowerCase().includes(query)
        );
    });

    // Get all mentioned users in the card (support both userId and user_id)
    const getAllMentionedUsers = () => {
        const mentionedUserIds = new Set();
        card?.comments?.forEach((comment) => {
            comment.mentions?.forEach((mention) => {
                const uid = mention.userId ?? mention.user_id?.toString?.();
                if (uid) mentionedUserIds.add(uid);
            });
        });
        return users.filter((user) => mentionedUserIds.has(user.id));
    };

    // Get recent mentions (users mentioned in last 5 comments)
    const getRecentMentions = () => {
        const recentComments = card?.comments?.slice(-5) || [];
        const recentMentionedUserIds = new Set();
        recentComments.forEach((comment) => {
            comment.mentions?.forEach((mention) => {
                const uid = mention.userId ?? mention.user_id?.toString?.();
                if (uid) recentMentionedUserIds.add(uid);
            });
        });
        return users.filter((user) => recentMentionedUserIds.has(user.id));
    };

    // Enhanced text change with mention detection
    const handleTextChange = (e) => {
        const text = e.target.value;
        setNewComment(text);

        // Check for @ mentions
        const cursorPos = e.target.selectionStart;
        const textBeforeCursor = text.substring(0, cursorPos);
        const mentionMatch = textBeforeCursor.match(/@([\w\s]*)$/);

        if (mentionMatch) {
            setShowMentions(true);
            setMentionQuery(mentionMatch[1].trim());
            setMentionPosition(cursorPos);
            setSelectedMentionIndex(0);
        } else {
            setShowMentions(false);
        }
    };

    // Handle edit text change with mention detection
    const handleEditTextChange = (e) => {
        const text = e.target.value;
        setEditText(text);

        // Check for @ mentions in edit mode
        const cursorPos = e.target.selectionStart;
        const textBeforeCursor = text.substring(0, cursorPos);
        const mentionMatch = textBeforeCursor.match(/@([\w\s]*)$/);

        if (mentionMatch) {
            setShowMentions(true);
            setMentionQuery(mentionMatch[1].trim());
            setMentionPosition(cursorPos);
            setSelectedMentionIndex(0);
        } else {
            setShowMentions(false);
        }
    };

    // Enhanced mention selection
    const handleMentionSelect = (user, isEditMode = false) => {
        const currentText = isEditMode ? editText : newComment;
        const textBeforeMention = currentText.substring(
            0,
            mentionPosition - mentionQuery.length - 1,
        );
        const textAfterMention = currentText.substring(mentionPosition);
        const mentionText = `@${user.name || user.email}`;

        const newText =
            textBeforeMention + mentionText + " " + textAfterMention;

        if (isEditMode) {
            setEditText(newText);
        } else {
            setNewComment(newText);
        }

        setShowMentions(false);

        // Focus back to textarea
        setTimeout(() => {
            const targetRef = isEditMode
                ? editTextareaRef.current
                : textareaRef.current;
            if (targetRef) {
                const newCursorPos =
                    textBeforeMention.length + mentionText.length + 1;
                targetRef.focus();
                targetRef.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    };

    // Handle keyboard navigation in mentions dropdown
    const handleMentionKeyDown = (e) => {
        if (!showMentions) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedMentionIndex((prev) =>
                    prev < filteredUsers.length - 1 ? prev + 1 : 0,
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedMentionIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredUsers.length - 1,
                );
                break;
            case "Enter":
                e.preventDefault();
                if (filteredUsers[selectedMentionIndex]) {
                    handleMentionSelect(filteredUsers[selectedMentionIndex]);
                }
                break;
            case "Escape":
                e.preventDefault();
                setShowMentions(false);
                break;
        }
    };

    // Enhanced comment submission (top-level or reply)
    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const cardId = card?.id ?? card?._id;
        if (!cardId) return;

        try {
            const mentions = extractMentions(newComment);
            const commentData = {
                text: newComment.trim(),
                mentions,
                createdAt: new Date().toISOString(),
                author: {
                    id: currentUser?.id,
                    name: currentUser?.name || currentUser?.email,
                    email: currentUser?.email,
                    designation: currentUser?.designation,
                },
            };
            if (replyingToCommentId) {
                commentData.parent_comment_id = replyingToCommentId;
            }

            const savedComment = await addComment(cardId, commentData);

            if (mentions.length > 0 && savedComment) {
                const mentionedUserIds = extractMentionedUserIds(newComment);
                createMentionNotificationsForComment(
                    savedComment,
                    mentionedUserIds,
                    currentUser,
                    card,
                );
            }
            await sendMentionNotifications(mentions);

            onCommentAdded?.(savedComment);
            setNewComment("");
            setShowMentions(false);
            setReplyingToCommentId(null);
        } catch (error) {
            // Error adding comment
        }
    };

    // Enhanced mention extraction
    const extractMentions = (text) => {
        const mentionRegex = /@([\w\s]+)/g;
        const mentions = [];
        let match;

        while ((match = mentionRegex.exec(text)) !== null) {
            const mentionText = match[1].trim();
            const mentionedUser = users.find(
                (user) =>
                    user.name === mentionText ||
                    user.email === mentionText ||
                    user.username === mentionText,
            );
            if (mentionedUser) {
                mentions.push({
                    userId: mentionedUser.id,
                    userName: mentionedUser.name || mentionedUser.email,
                    userEmail: mentionedUser.email,
                    userDesignation: mentionedUser.designation,
                    position: match.index,
                });
            }
        }

        return mentions;
    };

    // Send mention notifications
    const sendMentionNotifications = async (mentions) => {
        if (!showMentionNotifications || !mentions.length) return;

        try {
            // TODO: Implement notification service
            // Show success message
            // You can add a toast notification here
        } catch (error) {
            // Error sending mention notifications
        }
    };

    // Handle comment edit (support id or _id)
    const handleEditComment = (comment) => {
        if (!isCommentAuthor(comment)) return;
        const cid = comment.id ?? comment._id;
        setEditingComment(cid);
        setEditText(comment.text ?? comment.content ?? "");
    };

    // Enhanced comment update
    const handleUpdateComment = async (commentId) => {
        if (!editText.trim()) return;

        const comment = (card?.comments ?? []).find(
            (c) => (c.id ?? c._id) === commentId || String(c.id ?? c._id) === String(commentId),
        );
        if (comment && !isCommentAuthor(comment)) return;

        const cardId = card?.id ?? card?._id;
        if (!cardId) return;

        try {
            const mentions = extractMentions(editText);
            const updates = {
                text: editText.trim(),
                content: editText.trim(),
                mentions,
                updatedAt: new Date().toISOString(),
            };
            const result = await updateComment(cardId, commentId, updates);
            await sendMentionNotifications(mentions);
            onCommentUpdated?.(commentId, result ?? updates);
            setEditingComment(null);
            setEditText("");
            setShowMentions(false);
        } catch (error) {
            // Error updating comment
        }
    };

    // Handle comment delete
    const handleDeleteComment = async (commentId) => {
        const comment = (card?.comments ?? []).find(
            (c) => (c.id ?? c._id) === commentId || String(c.id ?? c._id) === String(commentId),
        );
        if (comment && !isCommentAuthor(comment)) return;
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        const cardId = card?.id ?? card?._id;
        if (!cardId) return;
        try {
            await deleteComment(cardId, commentId);
            onCommentDeleted?.(commentId);
        } catch (error) {
            // Error deleting comment
        }
    };

    // Enhanced text rendering with mentions (support userId and user_id)
    const renderTextWithMentions = (text, mentions = []) => {
        if (!mentions?.length) return text ?? "";

        let result = String(text ?? "");
        mentions.forEach((mention) => {
            const mentionText = `@${mention.userName ?? mention.username ?? ""}`;
            const isCurrentUser =
                (mention.userId ?? mention.user_id?.toString?.()) === currentUser?.id;
            const mentionClass = isCurrentUser
                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200";

            result = result.replace(
                mentionText,
                `<span class="${mentionClass} px-1 rounded font-medium cursor-pointer hover:opacity-80" title="Mentioned: ${mention.userName ?? mention.username}">${mentionText}</span>`,
            );
        });

        return <span dangerouslySetInnerHTML={{ __html: result }} />;
    };

    const commentTree = buildCommentTree(card?.comments ?? []);

    const isCommentAuthor = (node) => {
        if (!currentUser) return false;
        const authorId = node.author?.id ?? node.author?._id ?? node.author?.user_id;
        const userId = currentUser.id ?? currentUser._id;
        return authorId != null && userId != null && String(authorId) === String(userId);
    };

    const renderCommentBlock = (node, depth = 0) => {
        const isReply = depth > 0;
        const commentId = node.id ?? node._id;
        const displayText = node.text ?? node.content ?? "";
        const displayDate = node.createdAt ?? node.created_at;

        return (
            <div
                key={commentId}
                className={
                    isReply
                        ? "ml-5 mt-2 border-l-2 border-gray-200 dark:border-gray-600 pl-3"
                        : "mt-3 first:mt-0"
                }
            >
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <span className="font-medium text-sm text-gray-900 dark:text-white">
                                    {node.author?.name ?? node.author?.email ?? "Unknown User"}
                                </span>
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                    <Clock className="w-3 h-3" />
                                    {displayDate ? new Date(displayDate).toLocaleString() : ""}
                                    {(node.updatedAt ?? node.updated_at) &&
                                        (node.updatedAt ?? node.updated_at) !== (node.createdAt ?? node.created_at) && (
                                        <span>(edited)</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setReplyingToCommentId(commentId)}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Reply
                            </button>
                            {isCommentAuthor(node) && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => handleEditComment(node)}
                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400"
                                    >
                                        <Edit3 className="w-3 h-3" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteComment(commentId)}
                                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-500 dark:text-red-400"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {editingComment === commentId ? (
                        <div className="space-y-2">
                            <div className="relative">
                                <textarea
                                    ref={editTextareaRef}
                                    value={editText}
                                    onChange={handleEditTextChange}
                                    onKeyDown={handleMentionKeyDown}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    rows={3}
                                    placeholder="Edit comment... Use @ to mention someone"
                                />
                                <AnimatePresence>
                                    {showMentions && (
                                        <motion.div
                                            ref={mentionRef}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10"
                                        >
                                            <div className="p-2">
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                    Mention someone:
                                                </div>
                                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                                    {filteredUsers.map((user, index) => (
                                                        <button
                                                            key={user.id}
                                                            type="button"
                                                            onClick={() => handleMentionSelect(user, true)}
                                                            className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                                                                index === selectedMentionIndex
                                                                    ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                                                                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                                                    <User className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium">
                                                                        {user.name ?? user.email}
                                                                    </div>
                                                                    {user.designation && (
                                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                            {user.designation}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                    {filteredUsers.length === 0 && (
                                                        <div className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
                                                            No users found
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleUpdateComment(commentId)}
                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                >
                                    Save
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingComment(null);
                                        setEditText("");
                                        setShowMentions(false);
                                    }}
                                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            {renderTextWithMentions(displayText, node.mentions)}
                        </div>
                    )}

                    {node.mentions?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {node.mentions.map((mention, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                                >
                                    <AtSign className="w-3 h-3" />
                                    {mention.userName ?? mention.username}
                                    {mention.userDesignation && (
                                        <span className="text-gray-500 dark:text-gray-400">
                                            ({mention.userDesignation})
                                        </span>
                                    )}
                                </span>
                            ))}
                        </div>
                    )}
                </motion.div>
                {(node.replies ?? []).map((r) => renderCommentBlock(r, depth + 1))}
            </div>
        );
    };

    // Close mentions on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                mentionRef.current &&
                !mentionRef.current.contains(event.target)
            ) {
                setShowMentions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="space-y-4">
            {/* Mentions Summary */}
            {getAllMentionedUsers().length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                            <AtSign className="w-4 h-4" />
                            Mentioned Users ({getAllMentionedUsers().length})
                        </h4>
                        <button
                            onClick={() => setShowAllMentions(!showAllMentions)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            {showAllMentions ? "Hide" : "Show All"}
                        </button>
                    </div>

                    {showAllMentions && (
                        <div className="flex flex-wrap gap-2">
                            {getAllMentionedUsers().map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-gray-800 rounded-full text-xs"
                                >
                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                                        {(user.name || user.email)
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>
                                    <span className="text-gray-700 dark:text-gray-300">
                                        {user.name || user.email}
                                    </span>
                                    {user.designation && (
                                        <span className="text-gray-500 dark:text-gray-400">
                                            ({user.designation})
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Comments List (tree by parent_comment_id) */}
            <div className="space-y-4">
                {commentTree.map((node) => renderCommentBlock(node))}
            </div>

            {/* Enhanced Add Comment Form */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <form onSubmit={handleSubmitComment} className="space-y-3 py-6">
                    {replyingToCommentId && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span>Replying to:</span>
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                                {(() => {
                                    const replyingTo = (card?.comments ?? []).find(
                                        (c) => (c.id ?? c._id) === replyingToCommentId,
                                    );
                                    return replyingTo?.author?.name ?? replyingTo?.author?.email ?? "comment";
                                })()}
                            </span>
                            <button
                                type="button"
                                onClick={() => setReplyingToCommentId(null)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-500"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    <div className="relative">
                        <textarea
                            ref={textareaRef}
                            value={newComment}
                            onChange={handleTextChange}
                            onKeyDown={handleMentionKeyDown}
                            placeholder="Add a comment... Use @ to mention someone"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />

                        {/* Enhanced Mentions Dropdown */}
                        <AnimatePresence>
                            {showMentions && (
                                <motion.div
                                    ref={mentionRef}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10"
                                >
                                    <div className="p-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                Mention someone:
                                            </div>
                                            <button
                                                onClick={() =>
                                                    setShowMentions(false)
                                                }
                                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>

                                        {/* Recent Mentions */}
                                        {getRecentMentions().length > 0 &&
                                            !mentionQuery && (
                                                <div className="mb-2">
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                        Recent:
                                                    </div>
                                                    <div className="space-y-1">
                                                        {getRecentMentions()
                                                            .slice(0, 3)
                                                            .map((user) => (
                                                                <button
                                                                    key={
                                                                        user.id
                                                                    }
                                                                    onClick={() =>
                                                                        handleMentionSelect(
                                                                            user,
                                                                        )
                                                                    }
                                                                    className="w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                                                                            {(
                                                                                user.name ||
                                                                                user.email
                                                                            )
                                                                                .charAt(
                                                                                    0,
                                                                                )
                                                                                .toUpperCase()}
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-medium">
                                                                                {user.name ||
                                                                                    user.email}
                                                                            </div>
                                                                            {user.designation && (
                                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                                    {
                                                                                        user.designation
                                                                                    }
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}

                                        {/* All Users */}
                                        <div className="space-y-1 max-h-32 overflow-y-auto">
                                            {filteredUsers.map(
                                                (user, index) => (
                                                    <button
                                                        key={user.id}
                                                        onClick={() =>
                                                            handleMentionSelect(
                                                                user,
                                                            )
                                                        }
                                                        className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                                                            index ===
                                                            selectedMentionIndex
                                                                ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                                                                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                                                <User className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium">
                                                                    {user.name ||
                                                                        user.email}
                                                                </div>
                                                                {user.name &&
                                                                    user.email && (
                                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                            {
                                                                                user.email
                                                                            }
                                                                        </div>
                                                                    )}
                                                                {user.designation && (
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {
                                                                            user.designation
                                                                        }
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                ),
                                            )}
                                            {filteredUsers.length === 0 && (
                                                <div className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
                                                    No users found
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                Press Enter to send, Shift+Enter for new line
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    setShowMentionNotifications(
                                        !showMentionNotifications,
                                    )
                                }
                                className={`flex items-center gap-1 text-xs ${
                                    showMentionNotifications
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-gray-500 dark:text-gray-400"
                                }`}
                            >
                                {showMentionNotifications ? (
                                    <Bell className="w-3 h-3" />
                                ) : (
                                    <BellOff className="w-3 h-3" />
                                )}
                                Notifications
                            </button>
                        </div>
                        <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                            Comment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CommentsSection;
