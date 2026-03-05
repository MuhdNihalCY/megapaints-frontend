/**
 * CopyCardModal
 * Copy a card into the Sales column (or first column on the board). No destination picker.
 */

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Loader2 } from "lucide-react";
import { kanbanService } from "../../services/kanbanService";

const CopyCardModal = ({
    card,
    columns = [],
    boardId,
    onConfirm,
    onClose,
    getCardsByColumn,
    createCard,
    copyCard,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Sales column, or first column by position
    const targetColumn = useMemo(() => {
        const colList = Array.isArray(columns) ? columns : [];
        const sales = colList.find(
            (col) =>
                col.type === "sales" ||
                (col.id && String(col.id).toLowerCase() === "sales") ||
                (col.name && String(col.name).toLowerCase() === "sales") ||
                (col.title && String(col.title).toLowerCase() === "sales"),
        );
        if (sales) return sales;
        const byPosition = [...colList].sort(
            (a, b) => (a.position ?? 0) - (b.position ?? 0),
        );
        return byPosition[0] || null;
    }, [columns]);

    const targetColumnId = targetColumn?.id || targetColumn?._id;
    const targetColumnName =
        targetColumn?.name ?? targetColumn?.title ?? "Sales";

    const handleCreateCopy = async () => {
        if (!boardId) return;
        const sourceCardId = card?._id || card?.id;
        if (!sourceCardId) {
            setError("Card ID is required to copy");
            return;
        }
        if (copyCard) {
            setLoading(true);
            setError(null);
            try {
                const created = await copyCard(sourceCardId);
                onConfirm?.(created);
                onClose();
            } catch (err) {
                setError(err?.message ?? "Failed to create copy");
            } finally {
                setLoading(false);
            }
            return;
        }
        if (!targetColumnId || !createCard) return;
        setLoading(true);
        setError(null);
        try {
            const res = await kanbanService.reserveIdentifier(boardId);
            const identifier =
                res?.data?.identifier ?? res?.identifier;
            const reservationId =
                res?.data?.reservation_id ?? res?.reservation_id;
            if (!identifier || !reservationId) {
                throw new Error("Failed to reserve identifier");
            }

            const cards = getCardsByColumn
                ? getCardsByColumn(targetColumnId)
                : [];
            const position = cards.length * 1000;

            const title =
                card?.title?.trim() ?
                    card.title.trim() :
                    identifier;
            const copyData = {
                title,
                description: card?.description ?? "",
                board_id: boardId,
                boardId,
                column_id: targetColumnId,
                columnId: targetColumnId,
                subcolumn_id: null,
                subcolumnId: null,
                position,
                priority: card?.priority ?? "medium",
                due_date:
                    card?.dueDate?.date ??
                    card?.due_date ??
                    null,
                labels: Array.isArray(card?.labels) ? card.labels : [],
                identifier,
                reservation_id: reservationId,
                reservationId,
            };
            const created = await createCard(copyData);
            onConfirm?.(created);
            onClose();
        } catch (err) {
            setError(err?.message ?? "Failed to create copy");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-md rounded-lg bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Copy className="w-4 h-4" />
                            Copy card
                        </h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="p-4 space-y-4">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            {copyCard
                                ? "The new card will be created in the first column (Sales) with a new identifier. Ready products, production items (all unchecked), comments, and attachments will be copied."
                                : <>The new card will be created in <strong>{targetColumnName}</strong> (first column) with the same title as the original.</>}
                        </p>
                        {!targetColumnId && !copyCard && (
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                                No target column available. Please try again.
                            </p>
                        )}
                        {error && (
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        )}
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-3 py-1.5 text-sm rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleCreateCopy}
                                disabled={loading || (!copyCard && !targetColumnId)}
                                className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating…
                                    </>
                                ) : (
                                    "Create copy"
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CopyCardModal;
