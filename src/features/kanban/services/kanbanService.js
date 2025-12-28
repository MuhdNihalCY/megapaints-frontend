/**
 * Kanban Board API Service
 * Handles all API calls for the Kanban board using live backend APIs
 */

import api from "../../../utils/api";

/**
 * Kanban Board Service Class
 */
class KanbanService {
    constructor() {
        this.baseURL = "";
    }

    /**
     * Handle API response and extract data
     */
    handleResponse(response, endpoint = "unknown") {
        // Check if response is HTML (indicates API endpoint doesn't exist)
        if (
            typeof response.data === "string" &&
            response.data.includes("<!doctype html>")
        ) {
            return null;
        }

        // Handle backend response format: { status: 'success'|'error', data: {...}, message: '...' }
        if (response.data?.status === "error") {
            const errorMessage =
                response.data?.message ||
                response.data?.details?.[0] ||
                "API request failed";
            const error = new Error(errorMessage);
            error.response = response;
            error.details = response.data?.details;
            throw error;
        }

        // Return the data object from response
        if (response.data?.status === "success") {
            return response.data; // Return full response object with status, data, message
        }

        // Fallback for other response formats (legacy support)
        if (response.data?.success !== false) {
            const result = response.data?.data || response.data;
            return result;
        }

        throw new Error(response.data?.message || "API request failed");
    }

    /**
     * Handle API errors
     */
    handleError(error, endpoint = "unknown") {
        // Preserve the original error with response data
        if (error.response?.data) {
            // Extract error message from response
            let errorMessage = error.response.data.message || error.message;

            // If there are details, use the first one or append them
            if (
                error.response.data.details &&
                Array.isArray(error.response.data.details) &&
                error.response.data.details.length > 0
            ) {
                errorMessage = error.response.data.details[0] || errorMessage;
            } else if (
                error.response.data.details &&
                typeof error.response.data.details === "string"
            ) {
                errorMessage = error.response.data.details;
            }

            const newError = new Error(errorMessage);
            // Attach original error and response for debugging
            newError.originalError = error;
            newError.response = error.response;
            newError.status = error.response.status;
            newError.details = error.response.data.details;
            throw newError;
        }
        throw error;
    }

    // ==================== BOARD MANAGEMENT ====================

    /**
     * Get all boards
     * GET /api/kanban/boards
     */
    async getBoards(params = {}) {
        const endpoint = "GET /api/kanban/boards";

        try {
            const response = await api.get(`${this.baseURL}/kanban/boards`, {
                params,
            });
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Get board by ID
     * GET /api/kanban/boards/:id
     */
    async getBoard(boardId) {
        const endpoint = `GET /api/kanban/boards/${boardId}`;

        try {
            const response = await api.get(
                `${this.baseURL}/kanban/boards/${boardId}`,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Create a new board
     * POST /api/kanban/boards
     */
    async createBoard(boardData) {
        const endpoint = "POST /api/kanban/boards";

        try {
            const response = await api.post(
                `${this.baseURL}/kanban/boards`,
                boardData,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Update board
     * PUT /api/kanban/boards/:id
     */
    async updateBoard(boardId, boardData) {
        const endpoint = `PUT /api/kanban/boards/${boardId}`;

        try {
            const response = await api.put(
                `${this.baseURL}/kanban/boards/${boardId}`,
                boardData,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Delete board
     * DELETE /api/kanban/boards/:id
     */
    async deleteBoard(boardId) {
        const endpoint = `DELETE /api/kanban/boards/${boardId}`;

        try {
            const response = await api.delete(
                `${this.baseURL}/kanban/boards/${boardId}`,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Get boards by branch (legacy endpoint)
     * GET /api/kanban/boards/v2/board/branch
     */
    async getBoardsByBranch(branchId) {
        const endpoint = `GET /api/kanban/boards/v2/board/branch`;

        try {
            const response = await api.get(
                `${this.baseURL}/kanban/boards/v2/board/branch?branch_id=${branchId}`,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    // ==================== TASK MANAGEMENT ====================

    /**
     * Get all tasks
     * GET /api/kanban/tasks
     */
    async getTasks(params = {}) {
        const endpoint = "GET /api/kanban/tasks";

        try {
            const response = await api.get(`${this.baseURL}/kanban/cards`, {
                params,
            });
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Get task by ID
     * GET /api/kanban/tasks/:id
     */
    async getTask(taskId) {
        const endpoint = `GET /api/kanban/tasks/${taskId}`;

        try {
            const response = await api.get(
                `${this.baseURL}/kanban/cards/${taskId}`,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Create a new task
     * POST /api/kanban/cards
     */
    async createTask(taskData) {
        const endpoint = "POST /api/kanban/cards";

        try {
            // Use transformTaskToApi to properly transform all fields including labels
            const transformedData = this.transformTaskToApi({
                ...taskData,
                _availableLabels: taskData._availableLabels || [],
            });

            // Ensure required fields are set and convert to strings if needed
            const apiData = {
                title: (transformedData.title || taskData.title || "").trim(),
                description:
                    transformedData.description || taskData.description || "",
                board_id: String(
                    transformedData.board_id ||
                        taskData.board_id ||
                        taskData.boardId ||
                        "",
                ),
                column_id: String(
                    transformedData.column_id ||
                        taskData.column_id ||
                        taskData.columnId ||
                        taskData.listId ||
                        "",
                ),
                position:
                    transformedData.position !== undefined
                        ? transformedData.position
                        : taskData.position !== undefined
                          ? taskData.position
                          : 0,
                priority:
                    transformedData.priority || taskData.priority || "medium",
                due_date: transformedData.due_date || null,
                start_date: transformedData.start_date || null,
                estimated_hours:
                    transformedData.estimated_hours ||
                    taskData.estimated_hours ||
                    null,
                assignees:
                    transformedData.assignees || taskData.assignees || [],
                labels: transformedData.labels || [],
                checklists:
                    transformedData.checklists || taskData.checklists || [],
                customer_id:
                    transformedData.customer ||
                    taskData.customer_id ||
                    taskData.customer?.id ||
                    taskData.customer?._id ||
                    null,
                identifier:
                    transformedData.identifier || taskData.identifier || null,
                reservation_id:
                    transformedData.reservation_id ||
                    taskData.reservationId ||
                    taskData.reservation_id ||
                    null,
            };

            // Remove null/undefined values
            Object.keys(apiData).forEach((key) => {
                if (apiData[key] === null || apiData[key] === undefined) {
                    delete apiData[key];
                }
            });

            const response = await api.post(
                `${this.baseURL}/kanban/cards`,
                apiData,
            );
            const result = this.handleResponse(response, endpoint);
            return result;
        } catch (error) {
            console.error("🔴 Error in createTask", error);
            console.error("🔴 Error details:", {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                statusText: error.response?.statusText,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    data: error.config?.data,
                },
            });
            this.handleError(error, endpoint);
        }
    }

    /**
     * Update an existing task
     * PUT /api/kanban/tasks/:id
     */
    async updateTask(taskId, taskData) {
        const endpoint = `PUT /api/kanban/tasks/${taskId}`;

        try {
            const response = await api.put(
                `${this.baseURL}/kanban/cards/${taskId}`,
                taskData,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Delete a task
     * DELETE /api/kanban/tasks/:id
     */
    async deleteTask(taskId) {
        const endpoint = `DELETE /api/kanban/tasks/${taskId}`;

        try {
            const response = await api.delete(
                `${this.baseURL}/kanban/cards/${taskId}`,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Move a task to a different column
     * POST /api/kanban/tasks/:id/move
     */
    async moveTask(taskId, moveData) {
        const endpoint = `POST /api/kanban/tasks/${taskId}/move`;

        try {
            // Transform moveData from frontend format to backend format
            const transformedData = this.transformMoveData(moveData);
            const response = await api.post(
                `${this.baseURL}/kanban/cards/${taskId}/move`,
                transformedData,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Archive a task
     * POST /api/kanban/tasks/:id/archive
     */
    async archiveTask(taskId) {
        const endpoint = `POST /api/kanban/tasks/${taskId}/archive`;

        try {
            const response = await api.post(
                `${this.baseURL}/kanban/cards/${taskId}/archive`,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Assign task to user
     * POST /api/kanban/tasks/:id/assign
     */
    async assignTask(taskId, userId) {
        const endpoint = `POST /api/kanban/tasks/${taskId}/assign`;

        try {
            const response = await api.post(
                `${this.baseURL}/kanban/cards/${taskId}/assign`,
                { user_id: userId },
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Unassign task from user
     * DELETE /api/kanban/tasks/:id/assign/:userId
     */
    async unassignTask(taskId, userId) {
        const endpoint = `DELETE /api/kanban/tasks/${taskId}/assign/${userId}`;

        try {
            const response = await api.delete(
                `${this.baseURL}/kanban/cards/${taskId}/assign/${userId}`,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Watch task (subscribe to updates)
     * POST /api/kanban/tasks/:id/watch
     */
    async watchTask(taskId) {
        const endpoint = `POST /api/kanban/tasks/${taskId}/watch`;

        try {
            const response = await api.post(
                `${this.baseURL}/kanban/cards/${taskId}/watch`,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Unwatch task (unsubscribe from updates)
     * DELETE /api/kanban/tasks/:id/watch
     */
    async unwatchTask(taskId) {
        const endpoint = `DELETE /api/kanban/tasks/${taskId}/watch`;

        try {
            const response = await api.delete(
                `${this.baseURL}/kanban/cards/${taskId}/watch`,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    // ==================== LEGACY CARD METHODS (for backward compatibility) ====================

    /**
     * @deprecated Use getTasks() instead
     */
    async getCards(params = {}) {
        return this.getTasks(params);
    }

    /**
     * @deprecated Use getTask() instead
     */
    async getCard(cardId) {
        return this.getTask(cardId);
    }

    /**
     * @deprecated Use createTask() instead
     */
    async createCard(cardData) {
        // Ensure labels are available for transformation
        const cardDataWithLabels = {
            ...cardData,
            _availableLabels: cardData._availableLabels || [],
        };
        return this.createTask(cardDataWithLabels);
    }

    /**
     * @deprecated Use updateTask() instead
     */
    async updateCard(cardId, cardData) {
        return this.updateTask(cardId, cardData);
    }

    /**
     * @deprecated Use deleteTask() instead
     */
    async deleteCard(cardId) {
        return this.deleteTask(cardId);
    }

    /**
     * @deprecated Use moveTask() instead
     */
    async moveCard(cardId, moveData) {
        return this.moveTask(cardId, moveData);
    }

    /**
     * @deprecated Use archiveTask() instead
     */
    async archiveCard(cardId) {
        return this.archiveTask(cardId);
    }

    /**
     * @deprecated Use watchTask() instead
     */
    async watchCard(cardId) {
        return this.watchTask(cardId);
    }

    /**
     * @deprecated Use unwatchTask() instead
     */
    async unwatchCard(cardId) {
        return this.unwatchTask(cardId);
    }

    // ==================== COLUMN MANAGEMENT ====================

    /**
     * Get all columns for a board
     * GET /api/kanban/boards/:boardId/columns
     */
    async getColumns(boardId) {
        try {
            const response = await api.get(
                `${this.baseURL}/kanban/boards/${boardId}/columns`,
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Create a new column
     * POST /api/kanban/boards/:boardId/columns
     */
    async createColumn(boardId, columnData) {
        try {
            const response = await api.post(
                `${this.baseURL}/kanban/boards/${boardId}/columns`,
                columnData,
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Update a column
     * PUT /api/kanban/boards/:boardId/columns/:id
     */
    async updateColumn(boardId, columnId, columnData) {
        try {
            const response = await api.put(
                `${this.baseURL}/kanban/boards/${boardId}/columns/${columnId}`,
                columnData,
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Delete a column
     * DELETE /api/kanban/boards/:boardId/columns/:id
     */
    async deleteColumn(boardId, columnId) {
        try {
            const response = await api.delete(
                `${this.baseURL}/kanban/boards/${boardId}/columns/${columnId}`,
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Toggle column activation
     * PATCH /api/kanban/boards/:boardId/columns/:id
     */
    async toggleColumnActivation(boardId, columnId, isActive) {
        try {
            const response = await api.patch(
                `${this.baseURL}/kanban/boards/${boardId}/columns/${columnId}`,
                { is_active: isActive },
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Reorder columns
     * PUT /api/kanban/boards/:boardId/columns/reorder/positions
     */
    async reorderColumns(boardId, reorderData) {
        try {
            const response = await api.put(
                `${this.baseURL}/kanban/boards/${boardId}/columns/reorder/positions`,
                reorderData,
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    // ==================== ATTACHMENT MANAGEMENT ====================

    /**
     * Upload attachment to a task
     * POST /api/kanban/tasks/:taskId/attachments
     */
    async addAttachment(taskId, attachmentData) {
        const endpoint = `POST /api/kanban/cards/${taskId}/attachments`;
        try {
            let requestData;
            let config = {};

            // If attachmentData contains a File object, use FormData
            if (attachmentData.file && attachmentData.file instanceof File) {
                const formData = new FormData();
                // Append file with explicit filename
                formData.append(
                    "file",
                    attachmentData.file,
                    attachmentData.file.name,
                );

                // Add optional description if provided
                if (attachmentData.description) {
                    formData.append("description", attachmentData.description);
                }

                requestData = formData;
                // Configure axios to properly handle FormData
                // Don't set transformRequest - let axios handle FormData natively
                // The interceptor will remove Content-Type so browser sets it with boundary
                config = {
                    headers: {},
                };
            } else {
                // For link attachments or other non-file data, send as JSON
                requestData = attachmentData;
            }

            const response = await api.post(
                `${this.baseURL}/kanban/cards/${taskId}/attachments`,
                requestData,
                config,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Get attachments for a task
     * GET /api/kanban/tasks/:taskId/attachments
     */
    async getAttachments(taskId) {
        try {
            const response = await api.get(
                `${this.baseURL}/kanban/cards/${taskId}/attachments`,
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Delete attachment from a task
     * DELETE /api/kanban/tasks/:taskId/attachments/:attachmentId
     */
    async deleteAttachment(taskId, attachmentId) {
        try {
            const response = await api.delete(
                `${this.baseURL}/kanban/cards/${taskId}/attachments/${attachmentId}`,
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Set card cover image
     * POST /api/kanban/tasks/:id/cover
     */
    async setCardCover(taskId, coverData) {
        const endpoint = `POST /api/kanban/cards/${taskId}/attachments/cover`;
        try {
            const response = await api.post(
                `${this.baseURL}/kanban/cards/${taskId}/attachments/cover`,
                coverData,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Download attachment
     * GET /api/kanban/attachments/:attachmentId/download
     */
    async downloadAttachment(attachmentId) {
        try {
            const response = await api.get(
                `${this.baseURL}/kanban/attachments/${attachmentId}/download`,
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    // ==================== CHECKLIST MANAGEMENT ====================

    /**
     * Add checklist to a task
     * POST /api/kanban/checklists/:taskId
     */
    async addChecklist(taskId, checklistData) {
        try {
            const response = await api.post(
                `${this.baseURL}/kanban/checklists/${taskId}`,
                checklistData,
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get all checklists for a task
     * GET /api/kanban/checklists/:taskId
     */
    async getChecklists(taskId) {
        try {
            const response = await api.get(
                `${this.baseURL}/kanban/checklists/${taskId}`,
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Update checklist
     * PUT /api/kanban/checklists/:taskId/:checklistId
     */
    async updateChecklist(taskId, checklistId, checklistData) {
        try {
            const response = await api.put(
                `${this.baseURL}/kanban/checklists/${taskId}/${checklistId}`,
                checklistData,
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Delete checklist from a task
     * DELETE /api/kanban/checklists/:taskId/:checklistId
     */
    async deleteChecklist(taskId, checklistId) {
        try {
            const response = await api.delete(
                `${this.baseURL}/kanban/checklists/${taskId}/${checklistId}`,
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Toggle checklist item completion
     * PUT /api/kanban/checklists/:taskId/:checklistId/items/:itemId
     */
    async toggleChecklistItem(taskId, checklistId, itemId, completed) {
        try {
            const response = await api.put(
                `${this.baseURL}/kanban/checklists/${taskId}/${checklistId}/items/${itemId}`,
                { completed },
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    // ==================== WATCH/SUBSCRIBE ====================

    /**
     * Subscribe to card updates
     */
    async watchCard(cardId) {
        try {
            const response = await api.post(
                `${this.baseURL}/card/${cardId}/watch`,
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Unsubscribe from card updates
     */
    async unwatchCard(cardId) {
        try {
            const response = await api.delete(
                `${this.baseURL}/card/${cardId}/watch`,
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    // ==================== COMMENT MANAGEMENT ====================

    /**
     * Get comments for a task
     * GET /api/kanban/tasks/:id/comments
     */
    async getComments(taskId, params = {}) {
        const endpoint = `GET /api/kanban/tasks/${taskId}/comments`;

        try {
            const response = await api.get(
                `${this.baseURL}/kanban/cards/${taskId}/comments`,
                { params },
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Add a comment to a task
     * POST /api/kanban/tasks/:id/comments
     */
    async addComment(taskId, commentData) {
        const endpoint = `POST /api/kanban/tasks/${taskId}/comments`;

        try {
            if (!taskId) {
                throw new Error("Task ID is required to add a comment");
            }
            const response = await api.post(
                `${this.baseURL}/kanban/cards/${taskId}/comments`,
                commentData,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Update a comment
     * PUT /api/kanban/tasks/:id/comments/:commentId
     */
    async updateComment(taskId, commentId, updates) {
        const endpoint = `PUT /api/kanban/tasks/${taskId}/comments/${commentId}`;

        try {
            if (!taskId || !commentId) {
                throw new Error(
                    "Task ID and Comment ID are required to update a comment",
                );
            }
            const response = await api.put(
                `${this.baseURL}/kanban/cards/${taskId}/comments/${commentId}`,
                updates,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Delete a comment
     * DELETE /api/kanban/tasks/:id/comments/:commentId
     */
    async deleteComment(taskId, commentId) {
        const endpoint = `DELETE /api/kanban/tasks/${taskId}/comments/${commentId}`;

        try {
            if (!taskId || !commentId) {
                throw new Error(
                    "Task ID and Comment ID are required to delete a comment",
                );
            }
            const response = await api.delete(
                `${this.baseURL}/kanban/cards/${taskId}/comments/${commentId}`,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Add reaction to a comment
     * POST /api/kanban/tasks/:id/comments/:commentId/reactions
     */
    async addReaction(taskId, commentId, emoji) {
        const endpoint = `POST /api/kanban/tasks/${taskId}/comments/${commentId}/reactions`;

        try {
            const response = await api.post(
                `${this.baseURL}/kanban/cards/${taskId}/comments/${commentId}/reactions`,
                { emoji },
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Remove reaction from a comment
     * DELETE /api/kanban/tasks/:id/comments/:commentId/reactions
     */
    async removeReaction(taskId, commentId) {
        const endpoint = `DELETE /api/kanban/tasks/${taskId}/comments/${commentId}/reactions`;

        try {
            const response = await api.delete(
                `${this.baseURL}/kanban/cards/${taskId}/comments/${commentId}/reactions`,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    // ==================== LABEL MANAGEMENT ====================

    /**
     * Get all labels
     * GET /api/kanban/labels
     */
    async getLabels() {
        try {
            const response = await api.get(`${this.baseURL}/kanban/labels`);
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get label by ID
     * GET /api/kanban/labels/:id
     */
    async getLabel(labelId) {
        try {
            const response = await api.get(
                `${this.baseURL}/kanban/labels/${labelId}`,
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Create a new label
     * POST /api/kanban/labels
     */
    async createLabel(labelData) {
        const endpoint = "POST /api/kanban/labels";
        try {
            const response = await api.post(
                `${this.baseURL}/kanban/labels`,
                labelData,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
            throw error; // Re-throw to ensure error is propagated
        }
    }

    /**
     * Update a label
     * PUT /api/kanban/labels/:id
     */
    async updateLabel(labelId, labelData) {
        try {
            const response = await api.put(
                `${this.baseURL}/kanban/labels/${labelId}`,
                labelData,
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Delete a label
     * DELETE /api/kanban/labels/:id
     */
    async deleteLabel(labelId) {
        try {
            const response = await api.delete(
                `${this.baseURL}/kanban/labels/${labelId}`,
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get labels by board
     * GET /api/kanban/labels/v2/labels
     */
    async getLabelsByBoard(boardId) {
        try {
            const response = await api.get(
                `${this.baseURL}/kanban/labels/v2/labels?board_id=${boardId}`,
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get labels by branch
     * GET /api/kanban/labels/v2/labels?branch_id=xxx
     */
    async getLabelsByBranch(branchId) {
        try {
            const response = await api.get(
                `${this.baseURL}/kanban/labels/v2/labels`,
                {
                    params: { branch_id: branchId },
                },
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get all labels (with optional branch filter)
     * GET /api/kanban/labels?branch_id=xxx
     */
    async getLabels(params = {}) {
        try {
            const response = await api.get(`${this.baseURL}/kanban/labels`, {
                params,
            });
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    // ==================== CUSTOM FIELDS MANAGEMENT ====================

    /**
     * Get custom field definitions for a board
     * GET /api/kanban/boards/:boardId/custom-fields
     */
    async getCustomFields(boardId) {
        try {
            const response = await api.get(
                `${this.baseURL}/kanban/boards/${boardId}/custom-fields`,
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Create custom field definition
     * POST /api/kanban/boards/:boardId/custom-fields
     */
    async createCustomField(boardId, fieldData) {
        try {
            const response = await api.post(
                `${this.baseURL}/kanban/boards/${boardId}/custom-fields`,
                fieldData,
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Update card custom field value
     * PUT /api/kanban/tasks/:id/custom-fields/:fieldId
     */
    async updateCustomFieldValue(taskId, fieldId, value) {
        try {
            const response = await api.put(
                `${this.baseURL}/kanban/cards/${taskId}/custom-fields/${fieldId}`,
                { value },
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    // ==================== USER MANAGEMENT ====================

    /**
     * Get users (for mentions and assignments)
     * Uses Kanban-specific users API with workspace filtering
     */
    async getUsers() {
        const endpoint = "GET /api/kanban/users";

        try {
            // Use Kanban-specific users endpoint
            const response = await api.get(`${this.baseURL}/kanban/users`);
            response.data = response.data.data.users;
            const result = this.handleResponse(response, endpoint);

            // Ensure we always return an array
            const users = Array.isArray(result) ? result : [];
            return users;
        } catch (error) {
            // Return mock users for development/testing
            // return this.getMockUsers();
            return {
                status: "success",
                data: {
                    users: [],
                    message: "Kanban users endpoint not available",
                },
            };
        }
    }

    /**
     * Get user by ID with memberships
     */
    async getUserById(userId) {
        const endpoint = `GET /api/kanban/users/${userId}`;

        try {
            const response = await api.get(
                `${this.baseURL}/kanban/users/${userId}`,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Create new user
     */
    async createUser(userData) {
        const endpoint = "POST /api/kanban/users";
        // API Call userData });

        try {
            const response = await api.post(
                `${this.baseURL}/kanban/users`,
                userData,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Update user
     */
    async updateUser(userId, userData) {
        const endpoint = `PUT /api/kanban/users/${userId}`;
        // API Call userId, userData });

        try {
            const response = await api.put(
                `${this.baseURL}/kanban/users/${userId}`,
                userData,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Soft delete user
     */
    async deleteUser(userId) {
        const endpoint = `DELETE /api/kanban/users/${userId}`;
        // API Call userId });

        try {
            const response = await api.delete(
                `${this.baseURL}/kanban/users/${userId}`,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Get user activity summary
     */
    async getUserActivity(userId) {
        const endpoint = `GET /api/kanban/users/${userId}/activity`;
        // API Call userId });

        try {
            const response = await api.get(
                `${this.baseURL}/kanban/users/${userId}/activity`,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Invite user to workspace
     */
    async inviteUserToWorkspace(userId, workspaceData) {
        const endpoint = `POST /api/kanban/users/${userId}/invite-to-workspace`;
        // API Call userId, workspaceData });

        try {
            const response = await api.post(
                `${this.baseURL}/kanban/users/${userId}/invite-to-workspace`,
                workspaceData,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Get mock users for development/testing
     */
    getMockUsers() {
        return [
            // Production Users
            {
                id: "prod-1",
                _id: "prod-1",
                name: "John Smith",
                username: "john.smith",
                role: "production",
                department: "production",
                groupType: "production",
                email: "john.smith@megapaints.com",
            },
            {
                id: "prod-2",
                _id: "prod-2",
                name: "Sarah Johnson",
                username: "sarah.johnson",
                role: "production",
                department: "production",
                groupType: "production",
                email: "sarah.johnson@megapaints.com",
            },
            {
                id: "prod-3",
                _id: "prod-3",
                name: "Mike Wilson",
                username: "mike.wilson",
                role: "production",
                department: "production",
                groupType: "production",
                email: "mike.wilson@megapaints.com",
            },
            // Driver Users
            {
                id: "driver-1",
                _id: "driver-1",
                name: "David Brown",
                username: "david.brown",
                role: "driver",
                department: "drivers",
                groupType: "drivers",
                email: "david.brown@megapaints.com",
            },
            {
                id: "driver-2",
                _id: "driver-2",
                name: "Lisa Davis",
                username: "lisa.davis",
                role: "driver",
                department: "drivers",
                groupType: "drivers",
                email: "lisa.davis@megapaints.com",
            },
            {
                id: "driver-3",
                _id: "driver-3",
                name: "Tom Miller",
                username: "tom.miller",
                role: "driver",
                department: "drivers",
                groupType: "drivers",
                email: "tom.miller@megapaints.com",
            },
            // Other Users (won't be used for subcolumns)
            {
                id: "admin-1",
                _id: "admin-1",
                name: "Admin User",
                username: "admin",
                role: "admin",
                department: "management",
                groupType: "admin",
                email: "admin@megapaints.com",
            },
            {
                id: "sales-1",
                _id: "sales-1",
                name: "Sales Rep",
                username: "sales.rep",
                role: "sales",
                department: "sales",
                groupType: "sales",
                email: "sales@megapaints.com",
            },
        ];
    }

    // ==================== ACTIVITY LOGGING ====================

    /**
     * Log activity
     * Note: Activity logging is handled automatically by the backend when cards are created/updated
     * This method is kept for compatibility but does nothing (no API call needed)
     */
    async logActivity(activityData) {
        // Activity logging is handled by backend automatically via Card.logActivity()
        // No separate API endpoint needed - return success immediately
        return {
            status: "success",
            message: "Activity will be logged by backend",
        };
    }

    /**
     * Get activity log for a card
     */
    async getCardActivity(cardId, params = {}) {
        try {
            const response = await api.get(
                `${this.baseURL}/activity/card/${cardId}`,
                { params },
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    // ==================== NOTIFICATION MANAGEMENT ====================

    /**
     * Get notifications for a user
     * GET /api/notification/user/:userId
     */
    async getNotifications(userId, params = {}) {
        const endpoint = `GET /api/notification/user/${userId}`;
        // API Call userId, params });

        try {
            const response = await api.get(
                `${this.baseURL}/notification/user/${userId}`,
                { params },
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            return []; // Return empty array if endpoint doesn't exist yet
        }
    }

    /**
     * Mark notification as read
     * PUT /api/notification/:notificationId/read
     */
    async markNotificationAsRead(notificationId) {
        const endpoint = `PUT /api/notification/${notificationId}/read`;
        // API Call notificationId });

        try {
            const response = await api.put(
                `${this.baseURL}/notification/${notificationId}/read`,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Mark notification as clicked
     * PUT /api/notification/:notificationId/clicked
     */
    async markNotificationAsClicked(notificationId) {
        const endpoint = `PUT /api/notification/${notificationId}/clicked`;
        // API Call notificationId });

        try {
            const response = await api.put(
                `${this.baseURL}/notification/${notificationId}/clicked`,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Mark all notifications as read for a user
     * PUT /api/notification/user/:userId/read-all
     */
    async markAllNotificationsAsRead(userId) {
        const endpoint = `PUT /api/notification/user/${userId}/read-all`;
        // API Call userId });

        try {
            const response = await api.put(
                `${this.baseURL}/notification/user/${userId}/read-all`,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Delete notification
     * DELETE /api/notification/:notificationId
     */
    async deleteNotification(notificationId) {
        const endpoint = `DELETE /api/notification/${notificationId}`;
        // API Call notificationId });

        try {
            const response = await api.delete(
                `${this.baseURL}/notification/${notificationId}`,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Clear all notifications for a user
     * DELETE /api/notification/user/:userId/clear-all
     */
    async clearAllNotifications(userId) {
        const endpoint = `DELETE /api/notification/user/${userId}/clear-all`;
        // API Call userId });

        try {
            const response = await api.delete(
                `${this.baseURL}/notification/user/${userId}/clear-all`,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    /**
     * Create mention notification
     * POST /api/notification/mention
     */
    async createMentionNotification(notificationData) {
        const endpoint = "POST /api/notification/mention";
        // API Call notificationData });

        try {
            const response = await api.post(
                `${this.baseURL}/notification/mention`,
                notificationData,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
        }
    }

    // ==================== SEARCH ====================

    /**
     * Search tasks
     * GET /api/kanban/search/tasks
     */
    async searchTasks(query, params = {}) {
        try {
            const response = await api.get(
                `${this.baseURL}/kanban/search/tasks`,
                {
                    params: { q: query, ...params },
                },
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Search boards
     * GET /api/kanban/search/boards
     */
    async searchBoards(query, params = {}) {
        try {
            const response = await api.get(
                `${this.baseURL}/kanban/search/boards`,
                {
                    params: { q: query, ...params },
                },
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get filter suggestions
     * GET /api/kanban/filters/suggestions
     */
    async getFilterSuggestions(params = {}) {
        try {
            const response = await api.get(
                `${this.baseURL}/kanban/filters/suggestions`,
                { params },
            );
            return this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    // ==================== LEGACY SEARCH METHODS (for backward compatibility) ====================

    /**
     * @deprecated Use searchTasks() instead
     */
    async searchCards(query, params = {}) {
        return this.searchTasks(query, params);
    }

    /**
     * @deprecated Use searchTasks() instead
     */
    async searchCardsInColumn(columnId, query, params = {}) {
        return this.searchTasks(query, { columnId, ...params });
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Transform task data to frontend format
     */
    transformTaskData(apiTask) {
        if (!apiTask) return null;

        // Extract assignees to members (array of user IDs)
        const members = (apiTask.assignees || []).map((assignee) => {
            if (typeof assignee === "object" && assignee.user_id) {
                return (
                    assignee.user_id._id ||
                    assignee.user_id.id ||
                    assignee.user_id
                );
            }
            return assignee._id || assignee.id || assignee;
        });

        // Extract labels to array of label IDs
        const labelIds = (apiTask.labels || []).map((label) => {
            if (
                typeof label === "object" &&
                (label._id || label.id || label.label_id)
            ) {
                return label._id || label.id || label.label_id;
            }
            return label;
        });

        // Handle due date
        let dueDate = null;
        if (apiTask.due_date) {
            dueDate = {
                date: apiTask.due_date,
                completed: apiTask.due_date_completed || false,
            };
        } else if (apiTask.dueDate) {
            dueDate =
                typeof apiTask.dueDate === "object"
                    ? apiTask.dueDate
                    : { date: apiTask.dueDate, completed: false };
        }

        return {
            id: apiTask._id || apiTask.id,
            _id: apiTask._id || apiTask.id, // Keep both for compatibility
            title: apiTask.title || "Untitled Task",
            identifier: apiTask.identifier || null,
            description: apiTask.description || "",
            cardId: apiTask.cardId || apiTask._id || apiTask.id,
            columnId: apiTask.column_id || apiTask.columnId,
            listId: apiTask.column_id || apiTask.columnId, // Alias for compatibility
            column_id: apiTask.column_id || apiTask.columnId, // Keep original field name for consistency
            subcolumnId: apiTask.subcolumn_id || apiTask.subcolumnId || null,
            priority: apiTask.priority || "medium",
            labels: labelIds, // Array of label IDs
            labelObjects: (apiTask.labels || []).map((label) => ({
                id: label._id || label.id || label.label_id,
                name: label.name || label.text || "",
                color: label.color || "#6b7280",
            })),
            members: members, // Array of member/user IDs
            assignees: apiTask.assignees || [], // Keep original for reference
            dueDate: dueDate,
            due_date: apiTask.due_date, // Keep original format
            customer: apiTask.customer || null, // Customer object or ID
            createdAt:
                apiTask.createdAt ||
                apiTask.created_at ||
                new Date().toISOString(),
            updatedAt:
                apiTask.updatedAt ||
                apiTask.updated_at ||
                new Date().toISOString(),
            createdBy: apiTask.created_by || apiTask.createdBy,
            // Additional fields
            attachments: apiTask.attachments || [],
            comments: apiTask.comments || [],
            activities: apiTask.activity_log || apiTask.activities || [],
            activityLog: apiTask.activity_log || apiTask.activities || [],
            checklists: apiTask.checklists || [],
            customFields: apiTask.customFields || apiTask.custom_fields || [],
            contacts: apiTask.contacts || [],
            readyProducts:
                apiTask.ready_products || apiTask.readyProducts || [],
            productionItems:
                apiTask.production_items || apiTask.productionItems || [],
            isDeleted: apiTask.isDeleted || apiTask.is_deleted || false,
            isArchived: apiTask.isArchived || apiTask.is_archived || false,
            closed: apiTask.is_archived || apiTask.isArchived || false,
            position: apiTask.position || 0,
            branchId: apiTask.branch_id || apiTask.branchId,
            watchers: apiTask.watchers || [],
            subscriptions: apiTask.watchers || [], // Alias for compatibility
            // Cover image transformation
            coverImage: (() => {
                // If cover_image exists, use it
                if (apiTask.cover_image) {
                    const baseURL = import.meta.env.DEV
                        ? "http://localhost:3000"
                        : "";
                    let coverUrl = apiTask.cover_image.url;

                    // Construct full URL if needed
                    if (coverUrl && !coverUrl.startsWith("http")) {
                        if (!coverUrl.startsWith("/")) {
                            coverUrl = "/" + coverUrl;
                        }
                        coverUrl = `${baseURL}${coverUrl}`;
                    }

                    return {
                        attachment_id:
                            apiTask.cover_image.attachment_id || null,
                        url: coverUrl || null,
                        color: apiTask.cover_image.color || null,
                        size: apiTask.cover_image.size || "normal",
                    };
                }

                // If no cover_image, use first image attachment (Trello behavior)
                const attachments = apiTask.attachments || [];
                const firstImageAttachment = attachments.find((att) => {
                    const mimeType = att.mime_type || att.mimeType || "";
                    const fileName = att.original_name || att.name || "";
                    return (
                        mimeType.startsWith("image/") ||
                        /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(fileName)
                    );
                });

                if (firstImageAttachment) {
                    const baseURL = import.meta.env.DEV
                        ? "http://localhost:3000"
                        : "";
                    let imageUrl = firstImageAttachment.url || "";

                    // Construct full URL if needed
                    if (imageUrl && !imageUrl.startsWith("http")) {
                        if (!imageUrl.startsWith("/")) {
                            imageUrl = "/" + imageUrl;
                        }
                        imageUrl = `${baseURL}${imageUrl}`;
                    }

                    return {
                        attachment_id:
                            firstImageAttachment._id?.toString() ||
                            firstImageAttachment.id?.toString() ||
                            null,
                        url: imageUrl,
                        color: null,
                        size: "normal",
                    };
                }

                return null;
            })(),
            // Keep original data for debugging
            _originalData: apiTask,
        };
    }

    /**
     * Transform frontend task data to API format
     * @param {Object} frontendTask - Frontend task data
     * @param {Array} frontendTask._availableLabels - Optional array of available labels for lookup
     */
    transformTaskToApi(frontendTask) {
        const apiData = {};

        // Basic fields
        if (frontendTask.title !== undefined)
            apiData.title = frontendTask.title;
        if (frontendTask.description !== undefined)
            apiData.description = frontendTask.description;
        if (frontendTask.priority !== undefined)
            apiData.priority = frontendTask.priority;

        // Date fields - convert to ISO string
        if (frontendTask.dueDate !== undefined) {
            if (
                frontendTask.dueDate &&
                typeof frontendTask.dueDate === "object" &&
                frontendTask.dueDate.date
            ) {
                apiData.due_date = frontendTask.dueDate.date;
            } else if (frontendTask.dueDate) {
                apiData.due_date = frontendTask.dueDate;
            } else {
                apiData.due_date = null;
            }
        }
        if (frontendTask.due_date !== undefined) {
            apiData.due_date = frontendTask.due_date;
        }

        if (frontendTask.startDate !== undefined) {
            if (
                frontendTask.startDate &&
                typeof frontendTask.startDate === "object" &&
                frontendTask.startDate.date
            ) {
                apiData.start_date = frontendTask.startDate.date;
            } else if (frontendTask.startDate) {
                apiData.start_date = frontendTask.startDate;
            } else {
                apiData.start_date = null;
            }
        }
        if (frontendTask.start_date !== undefined) {
            apiData.start_date = frontendTask.start_date;
        }

        // Column/List ID
        if (frontendTask.column_id !== undefined)
            apiData.column_id = frontendTask.column_id;
        if (frontendTask.columnId !== undefined)
            apiData.column_id = frontendTask.columnId;
        if (frontendTask.listId !== undefined)
            apiData.column_id = frontendTask.listId;

        if (frontendTask.subcolumnId !== undefined)
            apiData.subcolumn_id = frontendTask.subcolumnId;
        if (frontendTask.subcolumn_id !== undefined)
            apiData.subcolumn_id = frontendTask.subcolumn_id;

        // Members to Assignees conversion
        if (frontendTask.members !== undefined) {
            apiData.assignees = (frontendTask.members || []).map(
                (memberId) => ({
                    user_id: memberId,
                }),
            );
        }
        if (frontendTask.assignees !== undefined) {
            apiData.assignees = frontendTask.assignees;
        }

        // Labels - handle both IDs and objects, ensure name and color are included
        if (frontendTask.labels !== undefined) {
            // If availableLabels is provided, use it to look up label details
            const availableLabels = frontendTask._availableLabels || [];

            apiData.labels = (frontendTask.labels || []).map((label) => {
                // Normalize label ID
                const normalizeId = (id) => {
                    if (typeof id === "string") return id;
                    if (typeof id === "object" && id)
                        return id.id || id._id || id.label_id;
                    return String(id);
                };

                // If it's already an object with all required fields
                if (
                    typeof label === "object" &&
                    label.label_id &&
                    label.name &&
                    label.color
                ) {
                    return {
                        label_id: label.label_id || label.id || label._id,
                        name: label.name,
                        color: label.color,
                    };
                }

                // If it's an object but missing fields, try to get them
                if (typeof label === "object") {
                    const labelId = label.id || label._id || label.label_id;
                    const foundLabel = availableLabels.find((l) => {
                        const lId = l.id || l._id;
                        return normalizeId(lId) === normalizeId(labelId);
                    });

                    if (foundLabel) {
                        return {
                            label_id: labelId,
                            name: foundLabel.name || label.name,
                            color: foundLabel.color || label.color || "#6b7280",
                        };
                    }

                    return {
                        label_id: labelId,
                        name: label.name || label.text || "",
                        color: label.color || "#6b7280",
                    };
                }

                // If it's just an ID, look it up in availableLabels
                const normalizedId = normalizeId(label);
                const foundLabel = availableLabels.find((l) => {
                    const lId = l.id || l._id;
                    return normalizeId(lId) === normalizedId;
                });

                if (foundLabel) {
                    return {
                        label_id: normalizedId,
                        name: foundLabel.name,
                        color: foundLabel.color || "#6b7280",
                    };
                }

                // Fallback: just label_id if label not found
                return { label_id: normalizedId };
            });
        }

        // Customer field
        if (frontendTask.customer !== undefined) {
            if (
                frontendTask.customer &&
                typeof frontendTask.customer === "object"
            ) {
                apiData.customer =
                    frontendTask.customer._id || frontendTask.customer.id;
            } else {
                apiData.customer = frontendTask.customer;
            }
        }

        // Other fields
        if (frontendTask.contacts !== undefined)
            apiData.contacts = frontendTask.contacts || [];
        if (frontendTask.checklists !== undefined)
            apiData.checklists = frontendTask.checklists || [];
        if (
            frontendTask.readyProducts !== undefined ||
            frontendTask.ready_products !== undefined
        ) {
            apiData.ready_products =
                frontendTask.readyProducts || frontendTask.ready_products || [];
        }
        if (frontendTask.attachments !== undefined)
            apiData.attachments = frontendTask.attachments || [];
        if (frontendTask.customFields !== undefined)
            apiData.customFields = frontendTask.customFields || [];
        if (frontendTask.position !== undefined)
            apiData.position = frontendTask.position || 0;

        // Archive status
        if (frontendTask.closed !== undefined)
            apiData.is_archived = frontendTask.closed;
        if (frontendTask.is_archived !== undefined)
            apiData.is_archived = frontendTask.is_archived;
        if (frontendTask.isArchived !== undefined)
            apiData.is_archived = frontendTask.isArchived;

        return apiData;
    }

    /**
     * Transform move data for API
     * Validates column_id is a valid MongoDB ObjectId and maps frontend format to backend format
     */
    transformMoveData(moveData) {
        // MongoDB ObjectId validation regex (24 hex characters)
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;

        // Get column_id from moveData
        const columnId = moveData.toColumnId || moveData.columnId;

        // Validate column_id is a valid MongoDB ObjectId
        if (!columnId) {
            throw new Error("Column ID is required for card movement");
        }

        if (!objectIdRegex.test(columnId)) {
            throw new Error(
                `Invalid column ID format: "${columnId}". Must be a valid MongoDB ObjectId (24 hex characters)`,
            );
        }

        // Ensure position is a number
        const position =
            typeof moveData.position === "number"
                ? moveData.position
                : parseInt(moveData.position, 10) || 0;
        if (isNaN(position) || position < 0) {
            throw new Error(
                `Invalid position: ${moveData.position}. Must be a non-negative integer`,
            );
        }

        const result = {
            column_id: columnId,
            position: position,
        };

        // Include subcolumn_id if provided (can be null/empty to clear it)
        const subColumnId = moveData.toSubColumnId || moveData.subcolumnId;
        if (subColumnId !== undefined && subColumnId !== null) {
            // If it's a string, trim it; if it's empty string, send empty string to clear
            result.subcolumn_id =
                typeof subColumnId === "string"
                    ? subColumnId.trim()
                    : subColumnId;
        }
        // If undefined, don't include it in the request (backend won't update it)

        return result;
    }

    /**
     * Check if move is allowed based on DnD rules
     */
    isMoveAllowed(
        fromColumn,
        toColumn,
        fromSubColumn = null,
        toSubColumn = null,
    ) {
        // Restrict moves to/from < 7 Days and > 7 Days columns
        const restrictedSubColumns = ["less-than-7-days", "more-than-7-days"];

        if (fromSubColumn && restrictedSubColumns.includes(fromSubColumn)) {
            return false;
        }

        if (toSubColumn && restrictedSubColumns.includes(toSubColumn)) {
            return false;
        }

        return true;
    }

    // ==================== PRIMARY IDENTIFIER SYSTEM ====================
    async reserveIdentifier(boardId, format = "DD-MM-YY-###") {
        const endpoint = "POST /api/kanban/cards/reserve-identifier";
        // API Call boardId, format });
        try {
            const response = await api.post(
                `${this.baseURL}/kanban/cards/reserve-identifier`,
                {
                    board_id: boardId,
                    format: format,
                },
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
            throw error;
        }
    }

    async releaseReservation(reservationId) {
        const endpoint = "DELETE /api/kanban/cards/release-reservation";
        try {
            const response = await api.delete(
                `${this.baseURL}/kanban/cards/release-reservation`,
                {
                    data: { reservation_id: reservationId },
                },
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
            throw error;
        }
    }

    async getActiveReservations(boardId) {
        const endpoint = `GET /api/kanban/cards/reservations/board/${boardId}`;
        // API Call boardId });
        try {
            const response = await api.get(
                `${this.baseURL}/kanban/cards/reservations/board/${boardId}`,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
            throw error;
        }
    }

    async getTaskByIdentifier(identifier) {
        const endpoint = `GET /api/kanban/cards/identifier/${identifier}`;
        // API Call identifier });
        try {
            const response = await api.get(
                `${this.baseURL}/kanban/cards/identifier/${identifier}`,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
            throw error;
        }
    }

    async getBoardIdentifiers(boardId) {
        const endpoint = `GET /api/kanban/cards/identifiers/board/${boardId}`;
        // API Call boardId });
        try {
            const response = await api.get(
                `${this.baseURL}/kanban/cards/identifiers/board/${boardId}`,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
            throw error;
        }
    }

    async updateTaskIdentifier(taskId, identifier) {
        const endpoint = `PUT /api/kanban/cards/${taskId}/identifier`;
        // API Call taskId, identifier });
        try {
            const response = await api.put(
                `${this.baseURL}/kanban/cards/${taskId}/identifier`,
                {
                    identifier: identifier,
                },
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
            throw error;
        }
    }

    // ==================== CUSTOMER MANAGEMENT ====================
    async getCustomers(params = {}) {
        const endpoint = "GET /api/kanban/customers";
        // API Call params });
        try {
            const response = await api.get(`${this.baseURL}/kanban/customers`, {
                params,
            });
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
            throw error;
        }
    }

    // ==================== USER MANAGEMENT FOR SUB-COLUMNS ====================

    /**
     * Get users by designation and branch
     * GET /api/kanban/users/by-designation
     */
    async getUsersByDesignation(branchId, designations) {
        const endpoint = "GET /api/kanban/users/by-designation";

        try {
            const response = await api.get(
                `${this.baseURL}/kanban/users/by-designation`,
                {
                    params: {
                        branch_id: branchId,
                        designations: Array.isArray(designations)
                            ? designations.join(",")
                            : designations,
                    },
                },
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
            throw error;
        }
    }

    /**
     * Get sub-column user statuses for a board
     * GET /api/kanban/boards/:boardId/subcolumn-users
     */
    async getSubColumnUsers(boardId) {
        const endpoint = `GET /api/kanban/boards/${boardId}/subcolumn-users`;

        try {
            const response = await api.get(
                `${this.baseURL}/kanban/boards/${boardId}/subcolumn-users`,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
            throw error;
        }
    }

    /**
     * Toggle sub-column user enabled/disabled status
     * PUT /api/kanban/boards/:boardId/subcolumn-users/:userId/toggle
     */
    async toggleSubColumnUser(boardId, userId, columnId, enabled) {
        const endpoint = `PUT /api/kanban/boards/${boardId}/subcolumn-users/${userId}/toggle`;

        try {
            const response = await api.put(
                `${this.baseURL}/kanban/boards/${boardId}/subcolumn-users/${userId}/toggle`,
                {
                    column_id: columnId,
                    enabled: enabled,
                },
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
            throw error;
        }
    }

    async getCustomerById(customerId) {
        const endpoint = `GET /api/kanban/customers/${customerId}`;
        // API Call customerId });
        try {
            const response = await api.get(
                `${this.baseURL}/kanban/customers/${customerId}`,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            // Handle 403 Forbidden gracefully - this is expected when user doesn't have access
            // Don't log it as an error since it's handled in the UI
            if (error.response?.status === 403) {
                const permissionError = new Error(
                    error.response?.data?.message ||
                        "You can only access customers from your assigned branches",
                );
                permissionError.status = 403;
                permissionError.response = error.response;
                throw permissionError;
            }
            // For other errors, use standard error handling
            this.handleError(error, endpoint);
            throw error;
        }
    }

    async createCustomer(customerData) {
        const endpoint = "POST /api/kanban/customers";
        // API Call customerData });
        try {
            const response = await api.post(
                `${this.baseURL}/kanban/customers`,
                customerData,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
            throw error;
        }
    }

    async updateCustomer(customerId, updates) {
        const endpoint = `PUT /api/kanban/customers/${customerId}`;
        // API Call customerId, updates });
        try {
            const response = await api.put(
                `${this.baseURL}/kanban/customers/${customerId}`,
                updates,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
            throw error;
        }
    }

    async deleteCustomer(customerId) {
        const endpoint = `DELETE /api/kanban/customers/${customerId}`;
        // API Call customerId });
        try {
            const response = await api.delete(
                `${this.baseURL}/kanban/customers/${customerId}`,
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
            throw error;
        }
    }

    async searchCustomers(query, params = {}) {
        const endpoint = "GET /api/kanban/customers/search";
        // API Call query, params });
        try {
            const searchParams = { q: query, ...params };
            const response = await api.get(
                `${this.baseURL}/kanban/customers/search`,
                { params: searchParams },
            );
            return this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error, endpoint);
            throw error;
        }
    }

    // ==================== LEGACY UTILITY METHODS (for backward compatibility) ====================

    /**
     * @deprecated Use transformTaskData() instead
     */
    transformCardData(apiCard) {
        return this.transformTaskData(apiCard);
    }

    /**
     * @deprecated Use transformTaskToApi() instead
     */
    transformCardToApi(frontendCard) {
        return this.transformTaskToApi(frontendCard);
    }
}

// Create singleton instance
const kanbanService = new KanbanService();

export { kanbanService };
