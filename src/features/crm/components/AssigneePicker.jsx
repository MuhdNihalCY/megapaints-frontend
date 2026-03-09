import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X, UserPlus } from "lucide-react";

/**
 * Simple assignee picker: search input + list of users (click to toggle).
 * Selected users shown as removable chips above the list.
 */
const AssigneePicker = ({ users = [], value = [], onChange, placeholder = "Search and select users...", label = "Assignees" }) => {
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 300 });
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const triggerRef = useRef(null);

    const filtered = useMemo(() => {
        const q = (search || "").toLowerCase().trim();
        if (!q) return users.slice(0, 15);
        return users.filter(
            (u) =>
                (u.username || "").toLowerCase().includes(q) ||
                (u.first_name || "").toLowerCase().includes(q) ||
                (u.last_name || "").toLowerCase().includes(q) ||
                (u.email || "").toLowerCase().includes(q)
        );
    }, [users, search]);

    const selectedIds = useMemo(
        () => new Set((Array.isArray(value) ? value : []).map((id) => String(id))),
        [value]
    );
    const selectedUsers = users.filter((u) => selectedIds.has(String(u._id)));

    const toggle = (userId) => {
        const id = String(userId);
        const next = selectedIds.has(id) ? value.filter((v) => String(v) !== id) : [...value, id];
        onChange(next);
    };

    const displayName = (u) => [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || u.email || "—";

    useEffect(() => {
        if (!open) return;
        if (filtered.length === 0) setActiveIndex(0);
        else setActiveIndex((i) => Math.min(Math.max(i, 0), filtered.length - 1));
    }, [open, filtered.length]);

    // Position dropdown in viewport when open (for use inside modals with overflow)
    useEffect(() => {
        if (!open || !triggerRef.current) return;
        const updatePosition = () => {
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom - 4;
                setDropdownPosition({
                    top: rect.bottom + 4,
                    left: rect.left,
                    width: Math.max(rect.width, 280),
                    maxHeight: Math.max(120, Math.min(448, spaceBelow - 16)),
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
        if (el && typeof el.scrollIntoView === "function") {
            el.scrollIntoView({ block: "nearest" });
        }
    }, [open, activeIndex]);

    const close = () => {
        setOpen(false);
        setSearch("");
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
            if (!open) {
                setOpen(true);
                return;
            }
            if (filtered.length > 0) setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
            return;
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            if (!open) {
                setOpen(true);
                return;
            }
            if (filtered.length > 0) setActiveIndex((i) => Math.max(i - 1, 0));
            return;
        }

        if (e.key === "Enter") {
            if (!open) return;
            e.preventDefault();
            const u = filtered[activeIndex];
            if (u?._id) toggle(u._id);
            return;
        }

        if (e.key === "Backspace") {
            const q = (search || "").trim();
            if (!q && Array.isArray(value) && value.length > 0) {
                const last = value[value.length - 1];
                toggle(last);
            }
        }
    };

    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            )}
            <div className="relative">
                {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {selectedUsers.map((u) => (
                            <span
                                key={u._id}
                                className="inline-flex max-w-full items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/25 text-blue-800 dark:text-blue-200"
                            >
                                <span className="truncate">{displayName(u)}</span>
                                <button
                                    type="button"
                                    onClick={() => toggle(u._id)}
                                    className="p-0.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/40"
                                    aria-label={`Remove ${displayName(u)}`}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
                <div className="relative">
                    <button
                        ref={triggerRef}
                        type="button"
                        onClick={() => {
                            setOpen((v) => !v);
                            setTimeout(() => inputRef.current?.focus?.(), 0);
                        }}
                        className="w-full flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                        <UserPlus className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className={selectedUsers.length ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}>
                            {selectedUsers.length ? `${selectedUsers.length} selected` : placeholder}
                        </span>
                    </button>
                    {open && (
                        <>
                            <div className="fixed inset-0 z-[9998]" onClick={close} aria-hidden="true" />
                            {createPortal(
                                <div
                                    className="fixed z-[9999] flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black/5 overflow-hidden"
                                    style={{
                                        top: dropdownPosition.top,
                                        left: dropdownPosition.left,
                                        width: dropdownPosition.width,
                                        maxHeight: dropdownPosition.maxHeight,
                                    }}
                                >
                                    <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                                        <div className="flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-700 px-2">
                                            <Search className="w-4 h-4 text-gray-400 shrink-0" />
                                            <input
                                                type="text"
                                                ref={inputRef}
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                onKeyDown={onKeyDown}
                                                onFocus={() => setOpen(true)}
                                                placeholder="Search by name or username..."
                                                className="flex-1 min-w-0 py-1.5 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none"
                                                aria-expanded={open}
                                                aria-controls="assignee-picker-listbox"
                                                aria-activedescendant={open && filtered[activeIndex]?._id ? `assignee-opt-${String(filtered[activeIndex]._id)}` : undefined}
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <ul
                                        id="assignee-picker-listbox"
                                        ref={listRef}
                                        role="listbox"
                                        className="min-h-0 flex-1 overflow-y-auto py-1"
                                    >
                                        {filtered.length === 0 ? (
                                            <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No users match</li>
                                        ) : (
                                            filtered.map((u, idx) => (
                                                <li key={u._id} role="option" aria-selected={selectedIds.has(String(u._id))}>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggle(u._id)}
                                                        onMouseEnter={() => setActiveIndex(idx)}
                                                        data-option-index={idx}
                                                        id={`assignee-opt-${String(u._id)}`}
                                                        className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 outline-none ${
                                                            idx === activeIndex
                                                                ? "bg-gray-100 dark:bg-gray-700"
                                                                : "hover:bg-gray-50 dark:hover:bg-gray-700/60"
                                                        } ${
                                                            selectedIds.has(String(u._id))
                                                                ? "text-blue-700 dark:text-blue-300"
                                                                : "text-gray-800 dark:text-gray-200"
                                                        }`}
                                                    >
                                                        <span>{displayName(u)}</span>
                                                        {selectedIds.has(String(u._id)) && <span className="text-xs">✓</span>}
                                                    </button>
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                </div>,
                                document.body
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssigneePicker;
