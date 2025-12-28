import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, X } from "lucide-react";

const SearchableSelect = ({
    options = [],
    value = "",
    onChange,
    placeholder = "Search and select...",
    disabled = false,
    searchKey = "name",
    displayKey = "name",
    secondaryKey = null,
    className = "",
    label = "",
    required = false,
    error = null,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredOptions, setFilteredOptions] = useState(options);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        setFilteredOptions(options);
    }, [options]);

    useEffect(() => {
        if (searchTerm) {
            const filtered = options.filter((option) => {
                const searchValue = searchTerm.toLowerCase();
                const primaryText = String(
                    option[searchKey] || "",
                ).toLowerCase();
                const secondaryText = secondaryKey
                    ? String(option[secondaryKey] || "").toLowerCase()
                    : "";
                return (
                    primaryText.includes(searchValue) ||
                    secondaryText.includes(searchValue)
                );
            });
            setFilteredOptions(filtered);
        } else {
            setFilteredOptions(options);
        }
    }, [searchTerm, options, searchKey, secondaryKey]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
                setSearchTerm("");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(
        (opt) => opt._id === value || opt.id === value,
    );

    const handleSelect = (option) => {
        const optionValue = option._id || option.id;
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm("");
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange("");
        setSearchTerm("");
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {label}{" "}
                    {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div
                className={`relative w-full border rounded-lg cursor-pointer transition-colors ${
                    error
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                } ${disabled ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700" : "bg-white dark:bg-gray-700"}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <div className="flex items-center px-4 py-2">
                    {selectedOption ? (
                        <div className="flex-1 text-gray-900 dark:text-white">
                            {selectedOption[displayKey] ||
                                selectedOption[searchKey]}
                            {secondaryKey && selectedOption[secondaryKey] && (
                                <span className="text-gray-500 dark:text-gray-400 ml-2">
                                    ({selectedOption[secondaryKey]})
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 text-gray-500 dark:text-gray-400">
                            {placeholder}
                        </div>
                    )}
                    <div className="flex items-center space-x-2">
                        {value && !disabled && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        )}
                        <ChevronDown
                            className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                    </div>
                </div>
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-hidden">
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto max-h-48">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option, idx) => {
                                const optionValue = option._id || option.id;
                                const isSelected = value === optionValue;

                                // Ensure key is always a valid string
                                let keyValue = "";
                                if (optionValue) {
                                    if (typeof optionValue === "string") {
                                        keyValue = optionValue;
                                    } else if (
                                        optionValue.toString &&
                                        typeof optionValue.toString ===
                                            "function"
                                    ) {
                                        const str = optionValue.toString();
                                        keyValue =
                                            str !== "[object Object]"
                                                ? str
                                                : `option-${idx}`;
                                    } else {
                                        keyValue = `option-${idx}`;
                                    }
                                } else {
                                    keyValue = `option-${idx}`;
                                }

                                return (
                                    <div
                                        key={keyValue}
                                        onClick={() => handleSelect(option)}
                                        className={`px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${
                                            isSelected
                                                ? "bg-blue-100 dark:bg-blue-900/30"
                                                : ""
                                        }`}
                                    >
                                        <div className="text-sm text-gray-900 dark:text-white">
                                            {option[displayKey] ||
                                                option[searchKey]}
                                        </div>
                                        {secondaryKey &&
                                            option[secondaryKey] && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {option[secondaryKey]}
                                                </div>
                                            )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                                No options found
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
};

export default SearchableSelect;
