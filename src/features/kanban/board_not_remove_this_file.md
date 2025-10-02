Create a Trello-style Kanban dashboard that is the default/home view for all non-admin users. Use a separate, well-organized folder structure. The system must be stable, extensible, and maintainable for years.
Board Layout
* Non-grouped columns: Sales, Office.
* Grouped columns (with subcolumns):
    * Production: one column per production-designated user.
    * Ready: For Dispatch, For Customer Collection.
    * Drivers: one column per driver-designated user.
    * Done: Done Today, < 7 Days, > 7 Days (with a search bar).
Column Activation (NEW)
* For Production and Drivers, add a lightweight tick-mark toggle (checkbox) per designated person to activate/deactivate their column.
* Deactivated columns are hidden from the board but preserved in data (no deletion).
* Toggling is permission-gated and logged in activity.
Drag & Drop Rules
* Cards can be dragged between any columns except:
    * from or to < 7 Days
    * from or to > 7 Days
* Moves must pass server-side permission checks; UI uses optimistic updates with rollback.
Cards
* Create new card only in Sales (button in Sales column).
* Modal popup for create/edit (same form).
* Core fields: attachment image(s), title, description, card ID, tasks (subtasks), checklist items, assignees, labels, due date, priority, custom fields (extensible), comments, activity log.
* Click card → open modal in view/edit mode (fields enabled based on permissions).
Comments & Mentions
* Add/view comments per card.
* @mention any user with autocomplete.
* Store author, timestamp, mentions, edits/deletes.
Activity Log
* Immutable per-card audit: who/what/when (+ before/after payload).
* Log create, edit, move, assign, label/due changes, attachment add/remove, comment events, checklist/task updates, column activation toggles.
Trello-like Essentials
* Labels, due dates (overdue/soon indicators), filters (label, assignee, due, text), options menus for cards & columns (copy, archive, move, share link).
* Power-ups scaffolding: pluggable slots & feature flags (no heavy add-ons yet).
Permissions (Code-Defined; RBAC/ABAC)
* Enforce server-side, mirror client for UX (server is source of truth).
* Example rules (adjustable):
    * VIEW_BOARD: all non-admin.
    * CREATE_CARD (Sales only): Sales, SalesLead, Admin.
    * EDIT_CARD: creator OR assignee OR roles SalesLead, ProductionLead, DriverLead, Admin.
    * MOVE_CARD: requires EDIT_CARD and DnD rule compliance.
    * ASSIGN_USERS / CHANGE_DUE / CHANGE_LABELS: Leads + Admin.
    * MANAGE_COLUMNS (rename/reorder/toggle Production/Driver columns): Leads of that group + Admin.
    * COMMENT / MENTION: all non-admin (configurable).
* All permission decisions are logged.
Behaviors & UX
* > 7 Days column has a debounced search (server-backed) scoped to that column.
* Filters panel with URL-shareable state (text, labels, assignees, due ranges, groups/columns).
* Performance: virtualized lists for large boards; background prefetch; incremental loading.
* Accessibility: keyboard DnD, ARIA roles, focus-managed modals.

1. Non-admin users land on the Kanban dashboard.
2. Columns/groups match the spec (Production/Ready/Drivers/Done + Sales/Office).
3. Tick-mark toggles activate/deactivate Production/Driver columns and persist.
4. Cards can be created only from Sales via modal; clicking a card opens the same modal for edit.
5. DnD works except to/from < 7 Days and > 7 Days.
6. > 7 Days column search returns correct results.
7. Comments support @mentions; activity log records all actions incl. toggles.
8. Labels, due dates, filters, and options menus function as described.
9. Server-side permissions prevent unauthorized changes.
Create a Trello-style Kanban dashboard that is the default/home view for all non-admin users. Use a separate, well-organized folder structure. The system must be stable, extensible, and maintainable for years.
Board Layout
* Non-grouped columns: Sales, Office.
* Grouped columns (with subcolumns):
    * Production: one column per production-designated user.
    * Ready: For Dispatch, For Customer Collection.
    * Drivers: one column per driver-designated user.
    * Done: Done Today, < 7 Days, > 7 Days (with a search bar).
Column Activation (NEW)
* For Production and Drivers, add a lightweight tick-mark toggle (checkbox) per designated person to activate/deactivate their column.
* Deactivated columns are hidden from the board but preserved in data (no deletion).
* Toggling is permission-gated and logged in activity.
Drag & Drop Rules
* Cards can be dragged between any columns except:
    * from or to < 7 Days
    * from or to > 7 Days
* Moves must pass server-side permission checks; UI uses optimistic updates with rollback.
Cards
* Create new card only in Sales (button in Sales column).
* Modal popup for create/edit (same form).
* Core fields: attachment image(s), title, description, card ID, tasks (subtasks), checklist items, assignees, labels, due date, priority, custom fields (extensible), comments, activity log.
* Click card → open modal in view/edit mode (fields enabled based on permissions).
Comments & Mentions
* Add/view comments per card.
* @mention any user with autocomplete.
* Store author, timestamp, mentions, edits/deletes.
Activity Log
* Immutable per-card audit: who/what/when (+ before/after payload).
* Log create, edit, move, assign, label/due changes, attachment add/remove, comment events, checklist/task updates, column activation toggles.
Trello-like Essentials
* Labels, due dates (overdue/soon indicators), filters (label, assignee, due, text), options menus for cards & columns (copy, archive, move, share link).
* Power-ups scaffolding: pluggable slots & feature flags (no heavy add-ons yet).
Permissions (Code-Defined; RBAC/ABAC)
* Enforce server-side, mirror client for UX (server is source of truth).
* Example rules (adjustable):
    * VIEW_BOARD: all non-admin.
    * CREATE_CARD (Sales only): Sales, SalesLead, Admin.
    * EDIT_CARD: creator OR assignee OR roles SalesLead, ProductionLead, DriverLead, Admin.
    * MOVE_CARD: requires EDIT_CARD and DnD rule compliance.
    * ASSIGN_USERS / CHANGE_DUE / CHANGE_LABELS: Leads + Admin.
    * MANAGE_COLUMNS (rename/reorder/toggle Production/Driver columns): Leads of that group + Admin.
    * COMMENT / MENTION: all non-admin (configurable).
* All permission decisions are logged.
Behaviors & UX
* > 7 Days column has a debounced search (server-backed) scoped to that column.
* Filters panel with URL-shareable state (text, labels, assignees, due ranges, groups/columns).
* Performance: virtualized lists for large boards; background prefetch; incremental loading.
* Accessibility: keyboard DnD, ARIA roles, focus-managed modals.

1. Non-admin users land on the Kanban dashboard.
2. Columns/groups match the spec (Production/Ready/Drivers/Done + Sales/Office).
3. Tick-mark toggles activate/deactivate Production/Driver columns and persist.
4. Cards can be created only from Sales via modal; clicking a card opens the same modal for edit.
5. DnD works except to/from < 7 Days and > 7 Days.
6. > 7 Days column search returns correct results.
7. Comments support @mentions; activity log records all actions incl. toggles.
8. Labels, due dates, filters, and options menus function as described.
9. Server-side permissions prevent unauthorized changes.
