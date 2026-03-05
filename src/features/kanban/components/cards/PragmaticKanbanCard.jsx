/**
 * Pragmatic Drag and Drop Kanban Card
 * Enhanced card component using Pragmatic DND for better drag experience
 */

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar,
    Clock,
    User,
    CheckCircle2,
    AlertCircle,
    Circle,
    Square,
    Star,
    Tag,
} from "lucide-react";

import { usePriorityDisplay, useLabelsDisplay } from "../../hooks/useKanban";
import { useKanban } from "../../contexts/KanbanContext";

/**
 * Pragmatic Drag and Drop Kanban Card Component
 * Note: Drag functionality is now handled by @hello-pangea/dnd Draggable wrapper in KanbanColumn
 */
const PragmaticKanbanCard = ({
    card,
    onCardClick,
    isDragging = false,
    isSelected = false,
    onSelect = null,
    getDragStyles = () => ({}),
    getDropZoneStyles = () => ({}),
    onDragEnd = null,
    labels: labelsProp,
}) => {
    const cardRef = useRef(null);
    const { labels: boardLabels } = useKanban();
    const [isHovered, setIsHovered] = useState(false);

    // Get priority configuration
    const priorityConfig = usePriorityDisplay(card.priority);

    // Get label configurations: use embedded labelObjects when present, else label ids; resolve names from board labels (prop or context)
    const availableLabels = labelsProp ?? boardLabels ?? [];
    const labelConfigs = useLabelsDisplay(
        card.labelObjects?.length ? card.labelObjects : (card.labels || []),
        availableLabels,
    );

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
            const baseURL = import.meta.env.DEV ? "http://localhost:3000" : "";
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

    const coverHeight = coverImage?.size === "full" ? "260px" : "116px"; // Standard card cover height

    // Handle card click
    const handleCardClick = (e) => {
        e.stopPropagation();
        if (onCardClick) {
            onCardClick(card);
        }
    };

    // Handle card select
    const handleSelect = (e) => {
        e.stopPropagation();
        if (onSelect) {
            onSelect(card.id, e.ctrlKey || e.metaKey);
        }
    };

    // Handle mouse enter
    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    // Handle mouse leave
    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    // Get drag styles
    const dragStyles = getDragStyles(card.id);
    const dropZoneStyles = getDropZoneStyles(card.id);

    return (
        <motion.div
            ref={cardRef}
            className={`
        relative bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm rounded-xl shadow-sm border border-blue-100 dark:border-gray-600
        cursor-pointer transition-all duration-200 ease-in-out
        hover:shadow-md hover:border-blue-200 dark:hover:border-gray-500 hover:bg-white dark:hover:bg-gray-700
        ${isDragging ? "opacity-50 scale-95" : ""}
        ${isSelected ? "ring-2 ring-blue-400 ring-opacity-50 dark:ring-blue-500" : ""}
        ${isHovered ? "shadow-lg shadow-blue-100 dark:shadow-gray-800" : ""}
        overflow-hidden
      `}
            style={{
                ...dragStyles,
                ...dropZoneStyles,
            }}
            onClick={handleCardClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            whileHover={{
                y: -2,
                scale: 1.02,
                transition: { duration: 0.2 },
            }}
            whileTap={{
                scale: 0.98,
                transition: { duration: 0.1 },
            }}
            layout
        >
            {/* Cover Image/Color - Display above title */}
            {hasCover && (
                <div
                    className="w-full"
                    style={{
                        ...coverStyle,
                        height: coverHeight,
                        minHeight: coverHeight,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                    }}
                />
            )}

            {/* Card Header */}
            <div className="p-4 pb-3">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-800 dark:text-white line-clamp-2 flex-1">
                        {card.title}
                    </h3>
                </div>

                {/* Description */}
                {card.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                        {card.description}
                    </p>
                )}

                {/* Labels */}
                {labelConfigs.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {labelConfigs.labels.map((label, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                style={{
                                    backgroundColor: label.color + "20",
                                    color: label.color,
                                    border: `1px solid ${label.color}40`,
                                }}
                            >
                                <Tag className="w-3 h-3 mr-1" />
                                {label.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Priority */}
                {card.priority && priorityConfig && (
                    <div className="flex items-center mb-2">
                        <div
                            className="flex items-center px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm"
                            style={{
                                backgroundColor: priorityConfig.color + "15",
                                color: priorityConfig.color,
                                border: `1px solid ${priorityConfig.color}30`,
                                boxShadow: `0 1px 3px ${priorityConfig.color}20`,
                            }}
                        >
                            {priorityConfig.icon && (
                                <span className="mr-1.5">
                                    {priorityConfig.icon}
                                </span>
                            )}
                            {priorityConfig.label}
                        </div>
                    </div>
                )}
            </div>

            {/* Card Footer */}
            <div className="px-4 pb-4 pt-0">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    {/* Due Date */}
                    {(() => {
                        const dateValue = card.dueDate?.date ?? card.due_date ?? card.dueDate;
                        const isValid = dateValue != null && !isNaN(new Date(dateValue).getTime());
                        return isValid ? (
                            <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                <span>
                                    {new Date(dateValue).toLocaleDateString()}
                                </span>
                            </div>
                        ) : null;
                    })()}

                    {/* Assignee */}
                    {card.assignee && (
                        <div className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            <span className="truncate max-w-20">
                                {card.assignee.name ||
                                    card.assignee.username ||
                                    "Unknown"}
                            </span>
                        </div>
                    )}

                    </div>

                {/* Comments Count */}
                {card.comments && card.comments.length > 0 && (
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                        <div className="flex items-center">
                            <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center mr-1">
                                <span className="text-xs font-medium">
                                    {card.comments.length}
                                </span>
                            </div>
                            <span>Comments</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Selection Indicator */}
            {isSelected && (
                <div className="absolute top-2 left-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
            )}

            {/* Drag Indicator */}
            {isDragging && (
                <div className="absolute inset-0 bg-blue-50 border-2 border-blue-300 rounded-lg flex items-center justify-center">
                    <div className="text-blue-600 text-sm font-medium">
                        Moving...
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default PragmaticKanbanCard;
