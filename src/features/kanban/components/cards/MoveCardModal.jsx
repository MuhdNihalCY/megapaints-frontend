/**
 * MoveCardModal
 * Destination picker for moving a card: list columns and subcolumns;
 * respects move rules (e.g. restricted < 7 Days / > 7 Days).
 */

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Move } from "lucide-react";

const MoveCardModal = ({
    card,
    columns = [],
    onMove,
    onClose,
    getCardsByColumn,
    getCardsBySubcolumn,
    isMoveAllowed,
}) => {
    const cardId = card?.id || card?._id;
    const fromColumnId = card?.columnId || card?.column_id;
    const fromSubcolumnId = card?.subcolumnId ?? card?.subcolumn_id ?? null;

    const isMoveAllowedTo = (toColumnId, toSubcolumnId) => {
        if (!isMoveAllowed) return true;
        const fromCol = columns.find(
            (c) => String(c.id || c._id) === String(fromColumnId),
        );
        const toCol = columns.find(
            (c) => String(c.id || c._id) === String(toColumnId),
        );
        return isMoveAllowed(fromCol, toCol, fromSubcolumnId, toSubcolumnId);
    };

    const destinations = useMemo(() => {
        const list = [];
        const colList = Array.isArray(columns) ? columns : [];
        colList.forEach((col) => {
            const colId = col.id || col._id;
            const colName = col.name ?? col.title ?? colId;
            const subs = col.subcolumns || col.sub_columns || [];

            const hasSubcolumns = subs.length > 0;

            // If column has subcolumns, only show subcolumn options (do not show parent column)
            if (hasSubcolumns) {
                subs.forEach((sub) => {
                    const subId = sub.id || sub._id;
                    const subName = sub.name ?? sub.title ?? subId;
                    if (isMoveAllowedTo(colId, subId)) {
                        list.push({
                            type: "subcolumn",
                            columnId: colId,
                            subcolumnId: subId,
                            label: `${colName} › ${subName}`,
                        });
                    }
                });
            } else {
                const allowedNoSub = isMoveAllowedTo(colId, null);
                if (allowedNoSub) {
                    list.push({
                        type: "column",
                        columnId: colId,
                        subcolumnId: null,
                        label: colName,
                    });
                }
            }
        });
        return list;
    }, [columns, isMoveAllowed, fromColumnId, fromSubcolumnId]);

    const handleSelect = (dest) => {
        if (!cardId || !onMove) return;
        let position = 0;
        if (dest.subcolumnId) {
            const cards = getCardsBySubcolumn
                ? getCardsBySubcolumn(dest.columnId, dest.subcolumnId)
                : [];
            position = cards.length * 1000;
        } else {
            const cards = getCardsByColumn
                ? getCardsByColumn(dest.columnId)
                : [];
            position = cards.length * 1000;
        }
        onMove(cardId, {
            toColumnId: dest.columnId,
            toSubColumnId: dest.subcolumnId,
            position,
        });
        onClose();
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
                            <Move className="w-4 h-4" />
                            Move card
                        </h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto p-2">
                        {destinations.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                                No destinations available (move rules may restrict this card).
                            </p>
                        ) : (
                            <ul className="space-y-0.5">
                                {destinations.map((dest) => {
                                    const isCurrent =
                                        fromColumnId === dest.columnId &&
                                        (card?.subcolumnId || card?.subcolumn_id) === dest.subcolumnId;
                                    return (
                                        <li key={`${dest.columnId}-${dest.subcolumnId || "col"}`}>
                                            <button
                                                type="button"
                                                onClick={() => handleSelect(dest)}
                                                disabled={isCurrent}
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left text-sm transition-colors ${
                                                    isCurrent
                                                        ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                                                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                                                }`}
                                            >
                                                {dest.label}
                                                {isCurrent && (
                                                    <span className="text-xs ml-auto">(current)</span>
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default MoveCardModal;
