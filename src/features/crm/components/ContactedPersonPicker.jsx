import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Searchable single-select for "Contacted person": "Me" + branch users.
 * value: "" | "Me" | user._id (string)
 */
const ME_VALUE = "Me";

const displayName = (u) =>
    u === ME_VALUE ? "Me" : ([u?.first_name, u?.last_name].filter(Boolean).join(" ") || u?.username || u?.email || "—");

const ContactedPersonPicker = ({
    users = [],
    value = "",
    onChange,
    placeholder = "Search and select person…",
    label = "Contacted person",
}) => {
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 192 });
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    const filteredUsers = useMemo(() => {
        const q = (search || "").toLowerCase().trim();
        if (!q) return users.slice(0, 20);
        return users.filter(
            (u) =>
                (u.username || "").toLowerCase().includes(q) ||
                (u.first_name || "").toLowerCase().includes(q) ||
                (u.last_name || "").toLowerCase().includes(q) ||
                (u.email || "").toLowerCase().includes(q)
        );
    }, [users, search]);

    const showMe = useMemo(() => {
        const q = (search || "").toLowerCase().trim();
        if (!q) return true;
        return "me".includes(q) || q.includes("me");
    }, [search]);

    const options = useMemo(() => {
        const list = [];
        if (showMe) list.push({ type: "me", value: ME_VALUE, label: "Me" });
        filteredUsers.forEach((u) => list.push({ type: "user", value: u._id, user: u, label: displayName(u) }));
        return list;
    }, [showMe, filteredUsers]);

    const selectedLabel = useMemo(() => {
        if (!value) return "";
        if (value === ME_VALUE) return "Me";
        const u = users.find((x) => String(x._id) === String(value));
        return u ? displayName(u) : "";
    }, [value, users]);

    useEffect(() => {
        if (!open) return;
        if (options.length === 0) setActiveIndex(0);
        else setActiveIndex((i) => Math.min(Math.max(i, 0), options.length - 1));
    }, [open, options.length]);

    // Position dropdown in viewport when open (for use inside modals with overflow)
    useEffect(() => {
        if (!open || !inputRef.current) return;
        const updatePosition = () => {
            if (inputRef.current) {
                const rect = inputRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom - 4;
                setDropdownPosition({
                    top: rect.bottom + 4,
                    left: rect.left,
                    width: rect.width,
                    maxHeight: Math.max(80, Math.min(192, spaceBelow - 16)),
                });
            }
        };
        updatePosition();
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);
        return () => {
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const el = listRef.current?.querySelector?.(`[data-option-index="${activeIndex}"]`);
        if (el?.scrollIntoView) el.scrollIntoView({ block: "nearest" });
    }, [open, activeIndex]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target) && !e.target.closest("[data-contact-picker-list]")) {
                setOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const close = () => {
        setOpen(false);
        setSearch("");
    };

    const select = (val) => {
        onChange(val);
        close();
    };

    const onKeyDown = (e) => {
        if (e.key === "Escape") {
            if (open) e.preventDefault();
            close();
            return;
        }
        if (e.key === "Tab") {
            close();
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (!open) setOpen(true);
            else if (options.length > 0) setActiveIndex((i) => Math.min(i + 1, options.length - 1));
            return;
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            if (!open) setOpen(true);
            else if (options.length > 0) setActiveIndex((i) => Math.max(i - 1, 0));
            return;
        }
        if (e.key === "Enter") {
            if (!open) {
                setOpen(true);
                return;
            }
            e.preventDefault();
            const opt = options[activeIndex];
            if (opt) select(opt.value);
        }
    };

    const inputValue = open ? search : selectedLabel;
    const showDropdown = open && options.length > 0;

    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}
                </label>
            )}
            <div className="relative" ref={containerRef}>
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        const v = e.target.value;
                        setSearch(v);
                        setOpen(true);
                        if (!v.trim() && value) onChange("");
                    }}
                    onFocus={() => {
                        setOpen(true);
                        if (selectedLabel) setSearch(selectedLabel);
                    }}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                    autoComplete="off"
                />
                {showDropdown && (
                    <>
                        <div className="fixed inset-0 z-[9998]" onClick={close} aria-hidden="true" />
                        {createPortal(
                            <ul
                                ref={listRef}
                                role="listbox"
                                data-contact-picker-list
                                className="fixed z-[9999] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg overflow-y-auto"
                                style={{
                                    top: dropdownPosition.top,
                                    left: dropdownPosition.left,
                                    width: dropdownPosition.width,
                                    maxHeight: dropdownPosition.maxHeight,
                                }}
                            >
                                {options.map((opt, idx) => (
                                    <li key={opt.type === "me" ? "me" : opt.value} role="option" aria-selected={value === opt.value}>
                                        <button
                                            type="button"
                                            data-option-index={idx}
                                            onClick={() => select(opt.value)}
                                            onMouseEnter={() => setActiveIndex(idx)}
                                            className={`w-full text-left px-3 py-2 text-sm ${
                                                idx === activeIndex
                                                    ? "bg-gray-100 dark:bg-gray-700"
                                                    : "hover:bg-gray-50 dark:hover:bg-gray-700/60"
                                            } ${value === opt.value ? "text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-white"}`}
                                        >
                                            {opt.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>,
                            document.body
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ContactedPersonPicker;
