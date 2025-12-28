/**
 * Keyboard Shortcuts Component
 * Provides Trello-like keyboard shortcuts and enhanced interactions
 */

import { useEffect, useRef, useState } from "react";
import { useKanban } from "../../contexts/KanbanContext";
import { LoadingOverlay } from "../../../../components";

/**
 * Keyboard Shortcuts Component
 */
const KeyboardShortcuts = () => {
    const {
        createCard,
        updateCard,
        deleteCard,
        moveCard,
        columns,
        cards,
        setFilters,
        filters,
    } = useKanban();

    const lastKeyTime = useRef(0);
    const cardSetupInterval = useRef(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event) => {
            // Prevent multiple rapid key events
            const now = Date.now();
            if (now - lastKeyTime.current < 50) {
                return;
            }
            lastKeyTime.current = now;

            // Don't trigger shortcuts when typing in input fields
            if (
                event.target.tagName === "INPUT" ||
                event.target.tagName === "TEXTAREA" ||
                event.target.tagName === "SELECT" ||
                event.target.contentEditable === "true"
            ) {
                return;
            }

            // Build key combination for logging
            const modifiers = [];
            if (event.ctrlKey) modifiers.push("Ctrl");
            if (event.metaKey) modifiers.push("Cmd");
            if (event.shiftKey) modifiers.push("Shift");
            if (event.altKey) modifiers.push("Alt");

            const keyComboString = [...modifiers, event.key.toUpperCase()].join(
                "+",
            );

            // Ctrl/Cmd + S: Quick search (Search)
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "s"
            ) {
                event.preventDefault();
                const searchInput = document.querySelector(
                    'input[placeholder*="Search"], input[placeholder*="search"]',
                );
                if (searchInput) {
                    searchInput.focus();
                }
                return;
            }

            // Ctrl/Cmd + T: Create new card in Sales column (Task)
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "t"
            ) {
                event.preventDefault();
                const salesColumn = columns.find((col) => col.type === "sales");
                if (salesColumn) {
                    // Try to find create button in sales column using multiple approaches
                    const columnElement = document.querySelector(
                        `[data-column-id="${salesColumn.id}"]`,
                    );
                    if (columnElement) {
                        // Try different selectors to find the create button
                        let createButton =
                            columnElement.querySelector(
                                ".create-card-button button",
                            ) ||
                            columnElement.querySelector(
                                'button[title*="Add"]',
                            ) ||
                            columnElement.querySelector(
                                'button[title*="Create"]',
                            ) ||
                            columnElement.querySelector(
                                'button[title*="New"]',
                            ) ||
                            columnElement.querySelector(
                                'button[title="Add new card"]',
                            );

                        // If still not found, try to find by text content
                        if (!createButton) {
                            const buttons =
                                columnElement.querySelectorAll("button");
                            createButton = Array.from(buttons).find(
                                (button) =>
                                    button.textContent
                                        .toLowerCase()
                                        .includes("add card") ||
                                    button.textContent
                                        .toLowerCase()
                                        .includes("add") ||
                                    button.textContent
                                        .toLowerCase()
                                        .includes("create") ||
                                    button.textContent
                                        .toLowerCase()
                                        .includes("new"),
                            );
                        }

                        if (createButton) {
                            createButton.click();
                        }
                    }
                }
                return;
            }

            // Escape: Close modals, dropdowns, clear selections, etc.
            if (event.key === "Escape") {
                // Handle DOM elements
                const dropdowns = document.querySelectorAll(
                    ".dropdown-menu, .modal-overlay, .help-panel",
                );
                dropdowns.forEach((dropdown) => {
                    if (dropdown.style.display !== "none") {
                        dropdown.style.display = "none";
                    }
                });

                // Close any React modals by dispatching a close event
                const modals = document.querySelectorAll(
                    '[data-modal="true"], [role="dialog"]',
                );
                modals.forEach((modal) => {
                    // Try to find a close button and click it
                    const closeButton = modal.querySelector(
                        '[data-close="true"], .close-button, [aria-label*="close" i]',
                    );
                    if (closeButton) {
                        closeButton.click();
                    }
                });

                return;
            }

            // Arrow keys: Navigate between cards
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                const selectedCard = document.querySelector(
                    "[data-card-id].selected, .kanban-card.selected, .card.selected",
                );
                if (selectedCard) {
                    const currentColumn = selectedCard.closest(
                        "[data-column-id], .kanban-column",
                    );
                    const cardIndex = Array.from(
                        currentColumn.querySelectorAll(
                            "[data-card-id], .kanban-card, .card",
                        ),
                    ).indexOf(selectedCard);

                    if (event.key === "ArrowLeft") {
                        // Move to previous column
                        const prevColumn = currentColumn.previousElementSibling;
                        if (
                            prevColumn &&
                            (prevColumn.hasAttribute("data-column-id") ||
                                prevColumn.classList.contains("kanban-column"))
                        ) {
                            const targetCard = prevColumn.querySelectorAll(
                                "[data-card-id], .kanban-card, .card",
                            )[cardIndex];
                            if (targetCard) {
                                selectedCard.classList.remove("selected");
                                targetCard.classList.add("selected");
                                targetCard.scrollIntoView({
                                    behavior: "smooth",
                                    block: "center",
                                });
                            }
                        }
                    } else if (event.key === "ArrowRight") {
                        // Move to next column
                        const nextColumn = currentColumn.nextElementSibling;
                        if (
                            nextColumn &&
                            (nextColumn.hasAttribute("data-column-id") ||
                                nextColumn.classList.contains("kanban-column"))
                        ) {
                            const targetCard = nextColumn.querySelectorAll(
                                "[data-card-id], .kanban-card, .card",
                            )[cardIndex];
                            if (targetCard) {
                                selectedCard.classList.remove("selected");
                                targetCard.classList.add("selected");
                                targetCard.scrollIntoView({
                                    behavior: "smooth",
                                    block: "center",
                                });
                            }
                        }
                    }
                }
                return;
            }

            // Space: Open selected card (more intuitive than Enter)
            if (event.key === " ") {
                event.preventDefault();
                const selectedCard = document.querySelector(
                    "[data-card-id].selected, .kanban-card.selected, .card.selected",
                );
                if (selectedCard) {
                    selectedCard.click();
                }
                return;
            }

            // Ctrl/Cmd + Delete: Delete selected card (with confirmation)
            if (
                (event.ctrlKey || event.metaKey) &&
                (event.key === "Delete" || event.key === "Backspace")
            ) {
                const selectedCard = document.querySelector(
                    "[data-card-id].selected, .kanban-card.selected, .card.selected",
                );
                if (selectedCard) {
                    event.preventDefault();
                    const cardId = selectedCard.dataset.cardId;
                    if (
                        cardId &&
                        confirm("Are you sure you want to delete this card?")
                    ) {
                        setIsDeleting(true);
                        deleteCard(cardId).finally(() => {
                            setIsDeleting(false);
                        });
                    }
                }
                return;
            }

            // Number keys: Quick priority setting
            if (event.key >= "1" && event.key <= "4") {
                const selectedCard = document.querySelector(
                    "[data-card-id].selected, .kanban-card.selected, .card.selected",
                );
                if (selectedCard) {
                    const priorities = ["low", "medium", "high", "urgent"];
                    const priority = priorities[parseInt(event.key) - 1];
                    const cardId = selectedCard.dataset.cardId;
                    if (cardId) {
                        updateCard(cardId, { priority });
                    }
                }
                return;
            }

            // Ctrl/Cmd + F: Toggle filters panel (Filter)
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "f"
            ) {
                event.preventDefault();
                const filtersPanel = document.querySelector(
                    '.filters-panel, [data-testid="filters-panel"]',
                );
                if (filtersPanel) {
                    const isExpanded =
                        filtersPanel.classList.contains("expanded");
                    if (isExpanded) {
                        filtersPanel.classList.remove("expanded");
                    } else {
                        filtersPanel.classList.add("expanded");
                    }
                }
                return;
            }

            // Ctrl/Cmd + H: Toggle help/shortcuts panel (Help)
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "h"
            ) {
                event.preventDefault();
                const helpPanel = document.querySelector(
                    '.help-panel, [data-testid="help-panel"]',
                );
                if (helpPanel) {
                    helpPanel.classList.toggle("hidden");
                }
                return;
            }

            // Ctrl/Cmd + R: Refresh board data (Refresh)
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "r"
            ) {
                event.preventDefault();
                // Trigger a board refresh - you might want to add this to your context
                window.location.reload();
                return;
            }

            // Ctrl/Cmd + E: Edit selected card (Edit)
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "e"
            ) {
                event.preventDefault();
                const selectedCard = document.querySelector(
                    "[data-card-id].selected, .kanban-card.selected, .card.selected",
                );
                if (selectedCard) {
                    // Get the card ID and trigger edit mode
                    const cardId = selectedCard.dataset.cardId;
                    if (cardId) {
                        // Find the card data and trigger edit modal
                        const cardData = cards.find(
                            (card) => card.id === cardId,
                        );
                        if (cardData) {
                            // Dispatch a custom event to trigger edit mode
                            const editEvent = new CustomEvent("editCard", {
                                detail: { card: cardData },
                            });
                            document.dispatchEvent(editEvent);
                        }
                    }
                }
                return;
            }

            // Ctrl/Cmd + M: Move selected card to next column (Move)
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "m"
            ) {
                event.preventDefault();
                const selectedCard = document.querySelector(
                    "[data-card-id].selected, .kanban-card.selected, .card.selected",
                );
                if (selectedCard) {
                    const cardId = selectedCard.dataset.cardId;
                    const currentColumn = selectedCard.closest(
                        "[data-column-id], .kanban-column",
                    );
                    const nextColumn = currentColumn.nextElementSibling;

                    if (
                        nextColumn &&
                        (nextColumn.hasAttribute("data-column-id") ||
                            nextColumn.classList.contains("kanban-column"))
                    ) {
                        const targetColumnId = nextColumn.dataset.columnId;
                        if (cardId && targetColumnId) {
                            moveCard(cardId, targetColumnId);
                        }
                    }
                }
                return;
            }

            // Ctrl/Cmd + B: Move selected card to previous column (Back)
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "b"
            ) {
                event.preventDefault();
                const selectedCard = document.querySelector(
                    "[data-card-id].selected, .kanban-card.selected, .card.selected",
                );
                if (selectedCard) {
                    const cardId = selectedCard.dataset.cardId;
                    const currentColumn = selectedCard.closest(
                        "[data-column-id], .kanban-column",
                    );
                    const prevColumn = currentColumn.previousElementSibling;

                    if (
                        prevColumn &&
                        (prevColumn.hasAttribute("data-column-id") ||
                            prevColumn.classList.contains("kanban-column"))
                    ) {
                        const targetColumnId = prevColumn.dataset.columnId;
                        if (cardId && targetColumnId) {
                            moveCard(cardId, targetColumnId);
                        }
                    }
                }
                return;
            }
        };

        // Add keyboard event listener
        document.addEventListener("keydown", handleKeyDown);

        // Cleanup
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [
        columns,
        cards,
        createCard,
        updateCard,
        deleteCard,
        moveCard,
        setFilters,
        filters,
    ]);

    // Setup card selection with polling to handle dynamic content
    useEffect(() => {
        const setupCards = () => {
            // Find all cards in the DOM
            const cards = document.querySelectorAll(
                "[data-card-id], .kanban-card, .card",
            );

            cards.forEach((card, index) => {
                // Ensure card has proper data attributes
                if (!card.dataset.cardId) {
                    card.setAttribute("data-card-id", `card-${index}`);
                }
                card.setAttribute("tabindex", "0");

                // Add click handler for selection
                const handleCardClick = (e) => {
                    // Don't select if clicking on interactive elements
                    if (e.target.closest("button, input, textarea, select")) {
                        return;
                    }

                    // Remove selection from other cards
                    document
                        .querySelectorAll("[data-card-id], .kanban-card, .card")
                        .forEach((c) => c.classList.remove("selected"));
                    // Add selection to clicked card
                    card.classList.add("selected");
                };

                // Remove existing listener to prevent duplicates
                card.removeEventListener("click", handleCardClick);
                card.addEventListener("click", handleCardClick);
            });
        };

        // Initial setup
        setupCards();

        // Set up polling to handle dynamic content
        cardSetupInterval.current = setInterval(setupCards, 2000); // Check every 2 seconds

        return () => {
            if (cardSetupInterval.current) {
                clearInterval(cardSetupInterval.current);
            }
        };
    }, [cards]);

    return (
        <>
            {/* Loading Overlay for delete operations */}
            {isDeleting && <LoadingOverlay message="Deleting card..." />}
        </>
    );
};

export default KeyboardShortcuts;
