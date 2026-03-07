/**
 * TrelloCardFront Component
 * Card display in list view matching Trello specifications
 * - Cover image/color support
 * - Label display (up to 6, then "+X more")
 * - Card badges (description, comments, attachments, due date, members)
 * - Hover and drag states
 */

import React from "react";
import {
    FileText,
    MessageSquare,
    Paperclip,
    Clock,
    Eye,
} from "lucide-react";
import { calculateCardBadges } from "../../types/cardModel";
import { getBackendOrigin } from "../../../../config/api";

const TrelloCardFront = ({
    card,
    users = [],
    labels = [],
    isDragging = false,
    isHovered = false,
    onClick,
    dragHandleProps,
}) => {
    const badges = calculateCardBadges(card);

    // Get label details
    const cardLabels = (card.labels || [])
        .map((labelId) =>
            labels.find((l) => l.id === labelId || l._id === labelId),
        )
        .filter(Boolean);

    // Get member details
    const cardMembers = (card.members || [])
        .map((memberId) =>
            users.find((u) => u.id === memberId || u._id === memberId),
        )
        .filter(Boolean);

    // Cover image/color - use coverImage if set, otherwise use first image attachment (Trello behavior)
    let coverImage = card.coverImage;

    // If no explicit cover, use first image attachment
    if (!coverImage || (!coverImage.url && !coverImage.color)) {
        const attachments = card.attachments || [];
        const firstImageAttachment = attachments.find((att) => {
            // Check if attachment is an image
            const mimeType = att.mime_type || att.mimeType || "";
            const fileName = att.original_name || att.name || "";
            const type = att.type || "";
            return (
                type === "image" ||
                mimeType.startsWith("image/") ||
                /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(fileName)
            );
        });

        if (firstImageAttachment) {
            const baseURL = getBackendOrigin();
            let imageUrl = firstImageAttachment.url || "";

            // Construct full URL if needed
            if (imageUrl && !imageUrl.startsWith("http")) {
                if (!imageUrl.startsWith("/")) {
                    imageUrl = "/" + imageUrl;
                }
                imageUrl = `${baseURL}${imageUrl}`;
            }

            coverImage = {
                attachment_id:
                    firstImageAttachment.id || firstImageAttachment._id || null,
                url: imageUrl,
                color: null,
                size: "normal",
            };
        }
    }

    const hasCover = coverImage && (coverImage.url || coverImage.color);
    const coverStyle = coverImage?.color
        ? { backgroundColor: coverImage.color }
        : coverImage?.url
          ? {
                backgroundImage: `url(${coverImage.url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }
          : {};

    const coverHeight = coverImage?.size === "full" ? "260px" : "32px";

    // Due date colors
    const getDueDateColor = () => {
        if (!badges.dueDate) return "";
        if (badges.dueDate.isComplete)
            return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
        if (badges.dueDate.isOverdue)
            return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
        if (badges.dueDate.isDueSoon)
            return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    };

    return (
        <div
            {...dragHandleProps}
            onClick={onClick}
            className={`
        bg-white dark:bg-gray-800 
        rounded-lg 
        cursor-pointer
        transition-all duration-150
        ${isDragging ? "opacity-70 rotate-3 shadow-2xl" : "shadow-sm hover:shadow-md"}
        ${isHovered && !isDragging ? "shadow-md" : ""}
        ${card.closed ? "opacity-50" : ""}
        min-h-[32px]
      `}
            style={{
                padding: hasCover ? "0" : "8px",
            }}
        >
            {/* Cover Image/Color */}
            {hasCover && (
                <div
                    className="w-full rounded-t-lg"
                    style={{ ...coverStyle, height: coverHeight }}
                />
            )}

            <div className={hasCover ? "p-2" : ""}>
                {/* Labels */}
                {cardLabels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {cardLabels.slice(0, 6).map((label) => (
                            <div
                                key={label.id || label._id}
                                className={`
                  rounded
                  ${
                      label.color === "gray" || !label.color
                          ? "px-2 text-xs text-gray-700 dark:text-gray-300"
                          : "h-2 w-10"
                  }
                `}
                                style={{
                                    backgroundColor:
                                        label.color && label.color !== "gray"
                                            ? label.color
                                            : "transparent",
                                }}
                                title={label.name}
                            >
                                {(label.color === "gray" || !label.color) &&
                                    label.name}
                            </div>
                        ))}
                        {cardLabels.length > 6 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                +{cardLabels.length - 6} more
                            </span>
                        )}
                    </div>
                )}

                {/* Card Title */}
                <div className="text-sm text-gray-900 dark:text-white mb-2 break-words">
                    {card.title}
                </div>

                {/* Card Badges */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* Description indicator */}
                    {badges.hasDescription && (
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <FileText className="w-3 h-3" />
                        </div>
                    )}

                    {/* Comments */}
                    {badges.comments > 0 && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                            <MessageSquare className="w-3 h-3" />
                            <span>{badges.comments}</span>
                        </div>
                    )}

                    {/* Attachments */}
                    {badges.attachments > 0 && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                            <Paperclip className="w-3 h-3" />
                            <span>{badges.attachments}</span>
                        </div>
                    )}

                    {/* Due Date */}
                    {badges.dueDate && (
                        <div
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${getDueDateColor()}`}
                        >
                            <Clock className="w-3 h-3" />
                            <span>{badges.dueDate.text}</span>
                            {badges.dueDate.isComplete && (
                                <span className="ml-0.5">✓</span>
                            )}
                        </div>
                    )}

                    {/* Watching indicator */}
                    {card.subscriptions && card.subscriptions.length > 0 && (
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Eye className="w-3 h-3" />
                        </div>
                    )}

                    {/* Members */}
                    {cardMembers.length > 0 && (
                        <div className="flex items-center -space-x-2 ml-auto">
                            {cardMembers.slice(0, 5).map((member, index) => (
                                <div
                                    key={member.id || member._id || index}
                                    className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-medium"
                                    title={member.name || member.email}
                                    style={{ zIndex: 10 - index }}
                                >
                                    {(member.name || member.email || "U")
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>
                            ))}
                            {cardMembers.length > 5 && (
                                <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-medium">
                                    +{cardMembers.length - 5}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrelloCardFront;
