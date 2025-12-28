import { useState, useEffect } from "react";
import { FileNumberService } from "../../../formula/services/fileNumberService";

/**
 * File Number Edit Modal Component
 *
 * This modal allows users to edit the file number with validation and duplicate checking.
 * It prevents duplicate file numbers and provides feedback to the user.
 */
const FileNumberModal = ({
    isOpen,
    onClose,
    currentFileNo,
    onSave,
    subcategoryId,
    gloss,
    additiveId,
    additivePercentage,
    subcategories,
    additives,
    isLoading = false,
}) => {
    const [fileNumber, setFileNumber] = useState(String(currentFileNo || ""));
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState("");
    const [isValid, setIsValid] = useState(true);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setFileNumber(String(currentFileNo || ""));
            setValidationError("");
            setIsValid(true);
        }
    }, [isOpen, currentFileNo]);

    // Validate file number format
    const validateFormat = (value) => {
        // Allow empty value
        if (!value.trim()) return true;

        // Check if it's a valid number or number with suffix (e.g., 100000, 100000.A, 100000.AA)
        const formatRegex = /^\d+(\.\w+)?$/;
        return formatRegex.test(value.trim());
    };

    // Handle file number input change
    const handleFileNumberChange = (e) => {
        const value = e.target.value;
        setFileNumber(value);

        // Clear validation error when user starts typing
        if (validationError) {
            setValidationError("");
        }

        // Validate format
        const formatValid = validateFormat(value);
        setIsValid(formatValid);
    };

    // Validate file number uniqueness
    const validateUniqueness = async (value) => {
        if (!value.trim()) return true;

        setIsValidating(true);
        try {
            const isUnique = await FileNumberService.validateFileNumber(
                value.trim(),
            );
            return isUnique;
        } catch (error) {
            console.error("Error validating file number:", error);
            return true; // Assume unique if validation fails
        } finally {
            setIsValidating(false);
        }
    };

    // Handle save
    const handleSave = async () => {
        const trimmedValue = fileNumber.trim();

        // Validate format
        if (!validateFormat(trimmedValue)) {
            setValidationError(
                "Invalid file number format. Use numbers only (e.g., 100000) or with suffix (e.g., 100000.A)",
            );
            return;
        }

        // Check if it's the same as current
        if (trimmedValue === currentFileNo) {
            onClose();
            return;
        }

        // Validate uniqueness
        const isUnique = await validateUniqueness(trimmedValue);
        if (!isUnique) {
            setValidationError(
                "This file number already exists. Please choose a different number.",
            );
            return;
        }

        // Generate formatted file number
        try {
            const formattedFileNo = FileNumberService.formulaFileFormat(
                String(trimmedValue || ""),
                String(subcategoryId || ""),
                Number(gloss) || 0,
                String(additiveId || ""),
                Number(additivePercentage) || 0,
                Array.isArray(subcategories) ? subcategories : [],
                Array.isArray(additives) ? additives : [],
            );

            onSave(trimmedValue, formattedFileNo);
            onClose();
        } catch (error) {
            console.error("Error formatting file number:", error);
            setValidationError(
                "Error formatting file number. Please try again.",
            );
        }
    };

    // Handle cancel
    const handleCancel = () => {
        setFileNumber(String(currentFileNo || ""));
        setValidationError("");
        setIsValid(true);
        onClose();
    };

    // Handle key press
    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleSave();
        } else if (e.key === "Escape") {
            handleCancel();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Edit File Number
                    </h3>
                    <button
                        onClick={handleCancel}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            File Number
                        </label>
                        <input
                            type="text"
                            value={fileNumber}
                            onChange={handleFileNumberChange}
                            onKeyDown={handleKeyPress}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                !isValid || validationError
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                            placeholder="e.g., 100000 or 100000.A"
                            disabled={isLoading || isValidating}
                        />

                        {/* Help text */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Enter a number (e.g., 100000) or with suffix (e.g.,
                            100000.A)
                        </p>

                        {/* Validation error */}
                        {validationError && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                {validationError}
                            </p>
                        )}
                    </div>

                    {/* Preview */}
                    {fileNumber &&
                        fileNumber.trim() &&
                        isValid &&
                        !validationError && (
                            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                    Preview:
                                </p>
                                <p className="text-sm font-mono text-gray-900 dark:text-white">
                                    {FileNumberService.formulaFileFormat(
                                        String(fileNumber.trim() || ""),
                                        String(subcategoryId || ""),
                                        Number(gloss) || 0,
                                        String(additiveId || ""),
                                        Number(additivePercentage) || 0,
                                        Array.isArray(subcategories)
                                            ? subcategories
                                            : [],
                                        Array.isArray(additives)
                                            ? additives
                                            : [],
                                    )}
                                </p>
                            </div>
                        )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        disabled={isLoading || isValidating}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={
                            !fileNumber ||
                            !fileNumber.trim() ||
                            !isValid ||
                            !!validationError ||
                            isLoading ||
                            isValidating
                        }
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isValidating ? "Validating..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FileNumberModal;
