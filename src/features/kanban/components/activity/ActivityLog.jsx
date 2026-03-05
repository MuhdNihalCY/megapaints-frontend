/**
 * ActivityLog Component
 * Comprehensive activity logging with detailed audit trail
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Clock,
    User,
    Edit3,
    Trash2,
    Move,
    Plus,
    Tag,
    Calendar,
    MessageSquare,
    Paperclip,
    CheckSquare,
    ToggleLeft,
    ToggleRight,
    Filter,
    Search,
    Eye,
    EyeOff,
    Image,
    Archive,
} from "lucide-react";

const ActivityLog = ({ card, users = [] }) => {
    const [filter, setFilter] = useState("all");

    // Use embedded activity from card; resolve user from users when missing
    const activities = useMemo(() => {
        const log = card?.activityLog || card?.activities || [];
        const usersById =
            Array.isArray(users) && users.length > 0
                ? new Map(
                      users.map((u) => [
                          String(u._id || u.id),
                          {
                              _id: u._id || u.id,
                              id: u._id || u.id,
                              name:
                                  [u.first_name, u.last_name]
                                      .filter(Boolean)
                                      .join(" ") ||
                                  u.name ||
                                  u.username ||
                                  u.email ||
                                  "Unknown",
                              username: u.username,
                              email: u.email,
                          },
                      ]),
                  )
                : null;
        return log
            .map((a) => {
                if (!a) return null;
                let user = a.user;
                if (!user && a.user_id && usersById) {
                    const id = String(
                        a.user_id?._id ?? a.user_id?.id ?? a.user_id,
                    );
                    user = usersById.get(id) || null;
                }
                return { ...a, user: user || a.user };
            })
            .filter(Boolean)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [card?.activityLog, card?.activities, users]);

    const filteredActivities = activities.filter((activity) => {
        if (filter === "all") return true;
        return activity.type === filter;
    });

    // Get activity icon
    const getActivityIcon = (type) => {
        switch (type) {
            case "card_created":
                return <Plus className="w-4 h-4" />;
            case "card_updated":
                return <Edit3 className="w-4 h-4" />;
            case "card_moved":
                return <Move className="w-4 h-4" />;
            case "card_deleted":
                return <Trash2 className="w-4 h-4" />;
            case "comment_added":
                return <MessageSquare className="w-4 h-4" />;
            case "comment_updated":
                return <MessageSquare className="w-4 h-4" />;
            case "comment_deleted":
                return <MessageSquare className="w-4 h-4" />;
            case "label_added":
                return <Tag className="w-4 h-4" />;
            case "label_removed":
                return <Tag className="w-4 h-4" />;
            case "due_date_changed":
                return <Calendar className="w-4 h-4" />;
            case "assignee_added":
                return <User className="w-4 h-4" />;
            case "assignee_removed":
                return <User className="w-4 h-4" />;
            case "attachment_added":
                return <Paperclip className="w-4 h-4" />;
            case "attachment_removed":
                return <Paperclip className="w-4 h-4" />;
            case "checklist_item_added":
                return <CheckSquare className="w-4 h-4" />;
            case "checklist_item_completed":
                return <CheckSquare className="w-4 h-4" />;
            case "checklist_item_removed":
                return <CheckSquare className="w-4 h-4" />;
            case "column_toggled":
                return <ToggleRight className="w-4 h-4" />;
            case "priority_changed":
                return <Filter className="w-4 h-4" />;
            case "search_performed":
                return <Search className="w-4 h-4" />;
            case "archive":
                return <Archive className="w-4 h-4" />;
            case "user_watching":
                return <Eye className="w-4 h-4" />;
            case "user_unwatching":
                return <EyeOff className="w-4 h-4" />;
            case "cover_set":
                return <Image className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    // Get activity color
    const getActivityColor = (type) => {
        switch (type) {
            case "card_created":
                return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900";
            case "card_updated":
                return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900";
            case "card_moved":
                return "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900";
            case "card_deleted":
                return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900";
            case "comment_added":
                return "text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900";
            case "comment_updated":
                return "text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900";
            case "comment_deleted":
                return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900";
            case "label_added":
                return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900";
            case "label_removed":
                return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900";
            case "due_date_changed":
                return "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900";
            case "assignee_added":
                return "text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900";
            case "assignee_removed":
                return "text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900";
            case "attachment_added":
                return "text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900";
            case "attachment_removed":
                return "text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900";
            case "checklist_item_added":
                return "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900";
            case "checklist_item_completed":
                return "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900";
            case "checklist_item_removed":
                return "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900";
            case "column_toggled":
                return "text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900";
            case "priority_changed":
                return "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900";
            case "search_performed":
                return "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900";
            case "archive":
                return "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900";
            case "user_watching":
                return "text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900";
            case "user_unwatching":
                return "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900";
            case "cover_set":
                return "text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900";
            default:
                return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900";
        }
    };

    // Format activity description
    const formatActivityDescription = (activity) => {
        const { type, user } = activity;
        const data = activity.data || {};

        switch (type) {
            case "card_created":
                return `Card "${data.title}" was created`;

            case "card_updated":
                // Prefer backend-generated description (includes exact change, e.g. "Production items: added 2 (A, B); removed 1 (C)")
                if (data.description) return data.description;
                const changes = Object.keys(data.changes || {});
                if (changes.length === 1) {
                    return `Card ${changes[0]} was updated`;
                }
                if (changes.length > 1) {
                    return `Card was updated (${changes.length} fields)`;
                }
                return "Card was updated";

            case "card_moved":
                return `Card moved from "${data.fromColumn}" to "${data.toColumn}"`;

            case "card_deleted":
                return `Card "${data.title}" was deleted`;

            case "comment_added": {
                const text = data.text ?? data.content;
                if (text != null && String(text).trim() !== "") {
                    const preview = String(text).substring(0, 50) + (String(text).length > 50 ? "..." : "");
                    return `Comment added: "${preview}"`;
                }
                return activity.description || data.description || "Comment added";
            }

            case "comment_updated":
                return `Comment was updated`;

            case "comment_deleted":
                return `Comment was deleted`;

            case "label_added":
                return `Label "${data.labelName}" was added`;

            case "label_removed":
                return `Label "${data.labelName}" was removed`;

            case "due_date_changed":
                return `Due date changed to ${new Date(data.dueDate).toLocaleDateString()}`;

            case "assignee_added":
                return `Assignee "${data.assigneeName}" was added`;

            case "assignee_removed":
                return `Assignee "${data.assigneeName}" was removed`;

            case "attachment_added":
                return `Attachment "${data.fileName}" was added`;

            case "attachment_removed":
                return `Attachment "${data.fileName}" was removed`;

            case "checklist_item_added":
                return `Checklist item "${data.itemText}" was added`;

            case "checklist_item_completed":
                return `Checklist item "${data.itemText}" was completed`;

            case "checklist_item_removed":
                return `Checklist item "${data.itemText}" was removed`;

            case "column_toggled":
                return `Column "${data.columnName}" was ${data.isActive ? "activated" : "deactivated"}`;

            case "priority_changed":
                return `Priority changed from "${data.fromPriority}" to "${data.toPriority}"`;

            case "search_performed":
                return `Search performed: "${data.query}"`;

            case "archive":
                return data.description || "Card was archived";
            case "user_watching":
                return data.description || "Started watching this card";
            case "user_unwatching":
                return data.description || "Stopped watching this card";
            case "cover_set":
                return data.description || "Card cover was set";

            default:
                return activity.description || data?.description || "Activity occurred";
        }
    };

    // Format timestamp
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString();
    };

    return (
        <div className="space-y-4">
            {/* Filter */}
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                    <option value="all">All Activities</option>
                    <option value="card_created">Card Created</option>
                    <option value="card_updated">Card Updated</option>
                    <option value="card_moved">Card Moved</option>
                    <option value="card_deleted">Card Deleted</option>
                    <option value="comment_added">Comments</option>
                    <option value="label_added">Labels</option>
                    <option value="due_date_changed">Due Dates</option>
                    <option value="assignee_added">Assignees</option>
                    <option value="attachment_added">Attachments</option>
                    <option value="checklist_item_added">Checklist</option>
                    <option value="column_toggled">Column Changes</option>
                    <option value="priority_changed">Priority</option>
                    <option value="archive">Archived</option>
                    <option value="user_watching">Watching</option>
                    <option value="cover_set">Cover</option>
                </select>
            </div>

            {/* Activities List */}
            <div className="space-y-3">
                <AnimatePresence>
                    {filteredActivities.map((activity) => (
                        <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                            {/* Activity Icon */}
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}
                            >
                                {getActivityIcon(activity.type)}
                            </div>

                            {/* Activity Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                                        {activity.user?.name ||
                                            activity.user?.email ||
                                            "System"}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatTimestamp(activity.timestamp)}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    {formatActivityDescription(activity)}
                                </p>

                                {/* Show per-field change details from backend (what exactly was done) */}
                                {activity.type === "card_updated" &&
                                    activity.data?.details &&
                                    Object.keys(activity.data.details).length > 0 && (
                                        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs space-y-1">
                                            {Object.entries(activity.data.details).map(
                                                ([field, detail]) => (
                                                    <div
                                                        key={field}
                                                        className="text-gray-600 dark:text-gray-400"
                                                    >
                                                        {detail && typeof detail === "object" && detail.summary ? (
                                                            detail.summary
                                                        ) : detail && typeof detail === "object" && (detail.before !== undefined || detail.after !== undefined) ? (
                                                            <>
                                                                <span className="font-medium capitalize">
                                                                    {field.replace(/_/g, " ")}:
                                                                </span>{" "}
                                                                {String(detail.before ?? "—")} → {String(detail.after ?? "—")}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="font-medium capitalize">
                                                                    {field.replace(/_/g, " ")}:
                                                                </span>{" "}
                                                                {String(detail ?? "")}
                                                            </>
                                                        )}
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    )}

                                {/* Show changes if available (legacy shape) */}
                                {activity.data?.changes && !activity.data?.details && (
                                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                        <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Changes:
                                        </div>
                                        {Object.entries(
                                            activity.data.changes,
                                        ).map(([field, change]) => (
                                            <div
                                                key={field}
                                                className="text-gray-600 dark:text-gray-400"
                                            >
                                                <span className="font-medium">
                                                    {field}:
                                                </span>{" "}
                                                {change.from} → {change.to}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Show before/after if available */}
                                {activity.data?.before &&
                                    activity.data?.after && (
                                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
                                                <div className="font-medium text-red-700 dark:text-red-300 mb-1">
                                                    Before:
                                                </div>
                                                <div className="text-red-600 dark:text-red-400">
                                                    {JSON.stringify(
                                                        activity.data.before,
                                                        null,
                                                        2,
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                                <div className="font-medium text-green-700 dark:text-green-300 mb-1">
                                                    After:
                                                </div>
                                                <div className="text-green-600 dark:text-green-400">
                                                    {JSON.stringify(
                                                        activity.data.after,
                                                        null,
                                                        2,
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredActivities.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No activities found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityLog;
