/**
 * CreateCardButton Component - Card Creation with Fallback Support
 * Implements card creation with identifier system when backend APIs are available,
 * falls back to simple card creation when APIs are not implemented yet.
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";
import { useKanban } from "../../contexts/KanbanContext";
import TrelloCardModal from "../cards/TrelloCardModal";
import { createEmptyCard } from "../../types/cardModel";
import { kanbanService } from "../../services/kanbanService";

const CreateCardButton = ({ columnId, onCreateCard, boardId }) => {
    const { currentUser, columns, addAttachment } = useKanban();
    const [showModal, setShowModal] = useState(false);
    const [newCard, setNewCard] = useState(null);
    const [reservation, setReservation] = useState(null);
    const [reserving, setReserving] = useState(false);
    const [error, setError] = useState(null);

    // Helper function to resolve column ID to MongoDB ObjectId
    // If columnId is already a valid ObjectId, return it
    // Otherwise, find the column by matching frontend ID to backend column name
    const resolveColumnId = async (frontendColumnId) => {
        // Check if it's already a valid MongoDB ObjectId (24 hex characters)
        const objectIdPattern = /^[0-9a-fA-F]{24}$/;
        if (objectIdPattern.test(frontendColumnId)) {
            return frontendColumnId;
        }

        // If not, try to find the column from context columns first
        // Check both id and _id properties

        const frontendColumn = columns?.find(
            (col) =>
                col.id === frontendColumnId ||
                col._id === frontendColumnId ||
                col.id?.toString() === frontendColumnId?.toString() ||
                col._id?.toString() === frontendColumnId?.toString() ||
                // Also match by name/title for backend columns
                col.name?.toLowerCase() === frontendColumnId?.toLowerCase() ||
                col.title?.toLowerCase() === frontendColumnId?.toLowerCase(),
        );

        if (frontendColumn) {
            // Prefer _id (backend ObjectId) over id (frontend string)
            const columnId =
                frontendColumn._id?.toString() || frontendColumn.id?.toString();
            if (columnId && objectIdPattern.test(columnId)) {
                return columnId;
            } else {
                // Frontend column doesn't have backend _id, will need to map it
            }
        } else {
        }

        // Map frontend column IDs to backend column names
        // Since frontend uses hardcoded columns (sales, office, etc.) but backend has different columns
        // We need to map them appropriately
        const frontendToBackendColumnMap = {
            sales: "To Do", // Sales is where new cards are created, map to first backend column
            office: "In Progress", // Office processing maps to In Progress
            production: "In Progress",
            ready: "Review",
            drivers: "Review",
            done: "Done",
        };

        // If still not found, fetch columns from backend and find by name
        if (boardId) {
            try {
                const columnsResponse = await kanbanService.getColumns(boardId);

                // Handle different response structures
                let backendColumns = [];
                if (columnsResponse?.status === "success") {
                    backendColumns =
                        columnsResponse.data?.columns ||
                        columnsResponse.data ||
                        [];
                } else if (columnsResponse?.data?.columns) {
                    backendColumns = columnsResponse.data.columns;
                } else if (columnsResponse?.columns) {
                    backendColumns = columnsResponse.columns;
                } else if (Array.isArray(columnsResponse)) {
                    backendColumns = columnsResponse;
                }

                // Use the mapping defined above
                const mappedName =
                    frontendToBackendColumnMap[frontendColumnId?.toLowerCase()];
                const columnName = mappedName || frontendColumnId;

                // Try multiple matching strategies
                let backendColumn = null;

                // Strategy 1: Exact name match
                backendColumn = backendColumns.find(
                    (col) => col.name === columnName,
                );

                // Strategy 2: Case-insensitive name match
                if (!backendColumn) {
                    backendColumn = backendColumns.find(
                        (col) =>
                            col.name?.toLowerCase() ===
                                frontendColumnId?.toLowerCase() ||
                            col.name?.toLowerCase() ===
                                columnName?.toLowerCase(),
                    );
                }

                // Strategy 3: Partial match (contains)
                if (!backendColumn) {
                    backendColumn = backendColumns.find(
                        (col) =>
                            col.name
                                ?.toLowerCase()
                                .includes(frontendColumnId?.toLowerCase()) ||
                            frontendColumnId
                                ?.toLowerCase()
                                .includes(col.name?.toLowerCase()),
                    );
                }

                if (backendColumn) {
                    // Columns are subdocuments, so they have _id
                    const columnId =
                        backendColumn._id?.toString() ||
                        backendColumn.id?.toString();

                    // Validate it's a proper ObjectId
                    if (columnId && objectIdPattern.test(columnId)) {
                        return columnId;
                    }
                } else {
                    // Fallback: Use the first available column
                    if (backendColumns.length > 0) {
                        const firstColumn = backendColumns[0];
                        const firstColumnId =
                            firstColumn._id?.toString() ||
                            firstColumn.id?.toString();
                        if (
                            firstColumnId &&
                            objectIdPattern.test(firstColumnId)
                        ) {
                            return firstColumnId;
                        }
                    }
                }
            } catch (err) {
                console.error("🔴 Error fetching columns:", err);
                // If fetching fails, we'll throw an error below
            }
        }

        // If we couldn't resolve, throw an error with helpful message
        const availableColumns =
            columns?.map((c) => c.name || c.id).join(", ") || "none";
        throw new Error(
            `Could not find column "${frontendColumnId}" (mapped to "${columnNameMap[frontendColumnId] || frontendColumnId}") in board. ` +
                `Available columns in context: ${availableColumns}. ` +
                `Please ensure the column exists in the board or create it first.`,
        );
    };

    // Generate a simple identifier for fallback
    const generateFallbackIdentifier = () => {
        const now = new Date();
        const dateStr = now.toISOString().slice(2, 10).replace(/-/g, "");
        const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
        return `${dateStr}-${timeStr}`;
    };

    // Handle button click - reserve identifier and create card
    const handleClick = async () => {
        if (!boardId) {
            setError("Board ID is required");
            return;
        }

        setReserving(true);
        setError(null);

        try {
            // Step 1: Reserve primary identifier
            const reservationResponse =
                await kanbanService.reserveIdentifier(boardId);
            // handleResponse returns { status: 'success', data: { identifier, reservation_id, ... }, message: '...' }
            const reservedIdentifier =
                reservationResponse?.data?.identifier ||
                reservationResponse?.identifier;
            const reservationId =
                reservationResponse?.data?.reservation_id ||
                reservationResponse?.reservation_id;

            if (!reservedIdentifier || !reservationId) {
                throw new Error(
                    "Invalid reservation response: missing identifier or reservation_id",
                );
            }

            // Step 2: Create card with reserved identifier
            const defaultCard = createEmptyCard({
                listId: columnId,
                createdBy: currentUser?.id || currentUser?._id,
                author: {
                    id: currentUser?.id || currentUser?._id,
                    name: currentUser?.name || currentUser?.username,
                    email: currentUser?.email,
                    designation: currentUser?.designation,
                },
                identifier: reservedIdentifier, // Add reserved identifier
                title: reservedIdentifier, // Set initial title to identifier
                isNewCard: true, // Flag to indicate this is a new card
                reservationId: reservationId, // Store reservation ID for later use
            });

            setReservation({
                id: reservationId,
                identifier: reservedIdentifier,
            });
            setNewCard(defaultCard);
            setShowModal(true);
        } catch (err) {
            setError("Failed to reserve card identifier. Please try again.");
        } finally {
            setReserving(false);
        }
    };

    // Handle card save - create the card and use reservation (if available)
    const handleSave = async (cardData) => {
        if (!cardData.title || !cardData.title.trim()) {
            const error = new Error("Card title is required");
            setError("Card title is required");
            throw error;
        }

        if (!boardId) {
            const error = new Error("Board ID is required");
            setError("Board ID is required");
            throw error;
        }

        try {
            setError(null);

            // Validate boardId is a valid MongoDB ObjectId
            const objectIdPattern = /^[0-9a-fA-F]{24}$/;
            if (!objectIdPattern.test(boardId)) {
                const error = new Error(
                    `No valid board found. Please ensure a board exists in the system. Current board ID: ${boardId}`,
                );
                setError(error.message);
                console.error("🔴 Invalid board ID:", boardId);
                throw error;
            }

            // Resolve the actual MongoDB column ID from the frontend column ID
            let resolvedColumnId;
            try {
                resolvedColumnId = await resolveColumnId(columnId);
            } catch (resolveError) {
                const error = new Error(
                    resolveError.message ||
                        "Could not resolve column ID. Please try again.",
                );
                setError(error.message);
                throw error;
            }

            if (!resolvedColumnId) {
                const error = new Error(
                    "Could not resolve column ID. Please try again.",
                );
                setError(error.message);
                throw error;
            }

            // Validate resolved columnId is a valid MongoDB ObjectId
            if (!objectIdPattern.test(resolvedColumnId)) {
                const error = new Error(
                    `Invalid column ID format: ${resolvedColumnId}. Column might not exist in the board.`,
                );
                setError(error.message);
                throw error;
            }

            // Import card title utilities to ensure format
            const { generateCardTitle } =
                await import("../../utils/cardTitleUtils");

            // Ensure title follows format: DD-MM-YY-XXX-customername
            let finalTitle = cardData.title;
            const identifier = cardData.identifier || reservation?.identifier;

            // If we have a customer in the card data, ensure format is correct
            if (cardData.customer && identifier) {
                finalTitle = generateCardTitle(
                    identifier,
                    cardData.customer.name || cardData.customer,
                );
            } else if (identifier && !finalTitle.includes("-")) {
                // If title doesn't have customer part but we have identifier, keep identifier only
                // (customer will be added when selected)
                finalTitle = identifier;
            }

            // Create the card with the complete title in correct format
            // Ensure all IDs are strings (not objects) for API
            const cardToCreate = {
                ...cardData,
                listId: String(resolvedColumnId),
                columnId: String(resolvedColumnId),
                column_id: String(resolvedColumnId), // Backend expects column_id as MongoDB ObjectId string
                boardId: String(boardId),
                board_id: String(boardId), // Backend expects board_id as MongoDB ObjectId string
                identifier: identifier,
                title: finalTitle.trim(), // Always in format: DD-MM-YY-XXX-customername, trimmed
                position: cardData.position || 0, // Ensure position is set
                reservationId:
                    reservation?.id || cardData.reservationId || null, // Include reservation ID so backend can mark it as used
            };

            // Call the parent's onCreateCard function
            if (!onCreateCard || typeof onCreateCard !== "function") {
                throw new Error(
                    "onCreateCard is not available or is not a function",
                );
            }

            const createdCard = await onCreateCard(cardToCreate);

            if (!createdCard) {
                throw new Error("Card creation failed: No card was returned");
            }

            // Upload attachments that were added before save (new-card flow stores them in formData)
            const cardId = createdCard.id ?? createdCard._id;
            const attachmentsToUpload =
                Array.isArray(cardToCreate.attachments) ? cardToCreate.attachments : [];
            if (cardId && addAttachment && attachmentsToUpload.length > 0) {
                for (const att of attachmentsToUpload) {
                    if (att && att.file && att.file instanceof File) {
                        try {
                            await addAttachment(cardId, {
                                file: att.file,
                                description: att.name || att.description || att.file.name,
                            });
                        } catch (attachErr) {
                            console.warn("Failed to upload attachment after card create:", attachErr);
                            // Don't fail the whole save; card was created
                        }
                    }
                }
            }

            // Note: Reservation is already marked as used by the backend during card creation
            // (if reservationId was included in cardToCreate). No need to call useReservation again.

            // Close modal and reset state only on success
            setShowModal(false);
            setNewCard(null);
            setReservation(null);
            setError(null);
        } catch (err) {
            // Show error to user with detailed validation errors
            let errorMessage = "Failed to save card. ";

            if (err?.response?.data) {
                const errorData = err.response.data;
                // Handle validation errors (array of error messages)
                if (Array.isArray(errorData.details)) {
                    errorMessage += errorData.details.join(". ");
                } else if (errorData.details) {
                    errorMessage += errorData.details;
                } else if (errorData.message) {
                    errorMessage += errorData.message;
                }
            } else if (err?.message) {
                errorMessage += err.message;
            } else {
                errorMessage += "Unknown error occurred.";
            }

            // Re-throw the error so it can be caught by handleSaveNewCard in the modal
            const errorWithMessage = new Error(errorMessage);
            errorWithMessage.response = err?.response;
            throw errorWithMessage;
        }
    };

    // Handle modal close - release reservation if not used (only if reservation exists)
    const handleClose = async () => {
        // Release reservation if it exists and wasn't used
        if (reservation && reservation.id) {
            try {
                await kanbanService.releaseReservation(reservation.id);
            } catch (err) {
                // Failed to release reservation
            }
        }

        setShowModal(false);
        setNewCard(null);
        setReservation(null);
        setError(null);
    };

    return (
        <>
            {/* Add Card Button */}
            <motion.button
                onClick={handleClick}
                disabled={reserving}
                className={`w-full flex items-center justify-center gap-2 p-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 transition-colors ${
                    reserving ? "opacity-50 cursor-not-allowed" : ""
                }`}
                whileHover={!reserving ? { scale: 1.02 } : {}}
                whileTap={!reserving ? { scale: 0.98 } : {}}
            >
                {reserving ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-medium">
                            Reserving identifier...
                        </span>
                    </>
                ) : (
                    <>
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Add a card</span>
                    </>
                )}
            </motion.button>

            {/* Error Display */}
            {error && (
                <div className="mt-2 p-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded">
                    {error}
                </div>
            )}

            {/* Card Creation Modal */}
            {showModal && newCard && (
                <TrelloCardModal
                    card={newCard}
                    isOpen={showModal}
                    onClose={handleClose}
                    onUpdate={handleSave}
                    onDelete={null}
                    onMove={null}
                    onCopy={null}
                    isNewCard={true}
                    reservation={reservation}
                />
            )}
        </>
    );
};

export default CreateCardButton;
