/**
 * BoardStats Component
 * Statistics panel for the Kanban board
 */

import React from "react";
import { useKanban } from "../../contexts/KanbanContext";

const BoardStats = ({ cards, columns, users }) => {
    const { isLoading } = useKanban();

    // Calculate statistics
    const stats = React.useMemo(() => {
        if (!cards || !columns) {
            return {
                totalCards: 0,
                activeCards: 0,
                completedCards: 0,
                overdueCards: 0,
                totalColumns: 0,
                activeColumns: 0,
                totalUsers: users?.length || 0,
                completionRate: 0,
                averageCardsPerColumn: 0,
                mostActiveColumn: null,
                leastActiveColumn: null,
            };
        }

        const totalCards = cards.length;
        const activeCards = cards.filter(
            (card) => card.isActive && !card.isArchived,
        ).length;
        const completedCards = cards.filter(
            (card) =>
                card.columnId === "done" || card.columnId === "done-today",
        ).length;

        // Calculate overdue cards
        const now = new Date();
        const overdueCards = cards.filter((card) => {
            if (!card.dueDate) return false;
            const dueDate = new Date(card.dueDate);
            return dueDate < now && !card.isArchived;
        }).length;

        const totalColumns = columns.length;
        const activeColumns = columns.filter((col) => col.isActive).length;
        const totalUsers = users?.length || 0;

        // Calculate completion rate
        const completionRate =
            totalCards > 0
                ? Math.round((completedCards / totalCards) * 100)
                : 0;

        // Calculate average cards per column
        const averageCardsPerColumn =
            totalColumns > 0 ? Math.round(totalCards / totalColumns) : 0;

        // Find most and least active columns
        const columnStats = columns.map((column) => ({
            id: column._id,
            name: column.name,
            cardCount: cards.filter((card) => card.columnId === column._id)
                .length,
        }));

        const mostActiveColumn = columnStats.reduce(
            (max, col) => (col.cardCount > max.cardCount ? col : max),
            columnStats[0] || { name: "N/A", cardCount: 0 },
        );

        const leastActiveColumn = columnStats.reduce(
            (min, col) => (col.cardCount < min.cardCount ? col : min),
            columnStats[0] || { name: "N/A", cardCount: 0 },
        );

        return {
            totalCards,
            activeCards,
            completedCards,
            overdueCards,
            totalColumns,
            activeColumns,
            totalUsers,
            completionRate,
            averageCardsPerColumn,
            mostActiveColumn,
            leastActiveColumn,
        };
    }, [cards, columns, users]);

    if (isLoading) {
        return (
            <div className="board-stats bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="h-16 bg-gray-200 dark:bg-gray-700 rounded"
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="board-stats bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Board Statistics
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Last updated: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* Total Cards */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                            <svg
                                className="w-6 h-6 text-blue-600 dark:text-blue-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                Total Cards
                            </p>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                {stats.totalCards}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Active Cards */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                            <svg
                                className="w-6 h-6 text-green-600 dark:text-green-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                Active Cards
                            </p>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                {stats.activeCards}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Completed Cards */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                            <svg
                                className="w-6 h-6 text-purple-600 dark:text-purple-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                Completed
                            </p>
                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                {stats.completedCards}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Overdue Cards */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 dark:bg-red-800 rounded-lg">
                            <svg
                                className="w-6 h-6 text-red-600 dark:text-red-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">
                                Overdue
                            </p>
                            <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                                {stats.overdueCards}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Completion Rate */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Completion Rate
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats.completionRate}%
                            </p>
                        </div>
                        <div className="w-12 h-12">
                            <svg
                                className="w-12 h-12 text-gray-400"
                                viewBox="0 0 36 36"
                            >
                                <path
                                    d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeDasharray={`${stats.completionRate}, 100`}
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Average Cards per Column */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Avg Cards/Column
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {stats.averageCardsPerColumn}
                        </p>
                    </div>
                </div>

                {/* Most Active Column */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Most Active Column
                        </p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {stats.mostActiveColumn.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {stats.mostActiveColumn.cardCount} cards
                        </p>
                    </div>
                </div>
            </div>

            {/* Column Breakdown */}
            <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Column Breakdown
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {columns.map((column) => {
                        const columnCards = cards.filter(
                            (card) => card.columnId === column._id,
                        ).length;
                        const percentage =
                            stats.totalCards > 0
                                ? Math.round(
                                      (columnCards / stats.totalCards) * 100,
                                  )
                                : 0;

                        return (
                            <div key={column._id} className="text-center">
                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                    {columnCards}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {column.name}
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {percentage}%
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BoardStats;
