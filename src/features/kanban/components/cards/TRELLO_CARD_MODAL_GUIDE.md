# TrelloCardModal - How It Should Work

## Overview
The `TrelloCardModal` is a comprehensive card management interface that follows Trello's design patterns. It provides a 768px wide modal (552px left column + 168px sidebar) with full card editing capabilities.

## Key Features

### 1. Card Title System (Primary Feature)

#### Format
- **Storage Format**: `DD-MM-YY-XXX-customername` (e.g., `02-12-25-004-john-doe`)
- **Display Format**: `DD-MM-YY XXX - Customer Name` (e.g., `02-12-25 004 - John Doe`)

#### Components
1. **Primary Identifier** (Read-only, auto-generated)
   - Format: `DD-MM-YY-XXX`
   - Example: `02-12-25-004`
   - Displayed with `#` icon
   - Shows as: `02-12-25 004` (with space for readability)
   - Labeled as "(Auto-generated)"

2. **Customer Selection**
   - Dropdown to select existing customer
   - "Manage" button to open customer management modal
   - When customer is selected:
     - Card title is automatically updated to: `identifier-customername-slug`
     - Customer object is stored in `formData.customer`
     - Title components are updated

3. **Complete Title Display**
   - Shows the full formatted title
   - Clickable to edit (enters edit mode)
   - In edit mode: textarea allows manual editing
   - On save: validates and enforces format

#### Workflow
```
1. Card opens with title "02-12-25-004"
   → Identifier is extracted and displayed
   → Customer dropdown shows "Select customer..."

2. User selects customer "John Doe"
   → Title becomes "02-12-25-004-john-doe"
   → Display shows "02-12-25 004 - John Doe"
   → Customer object is stored

3. User clicks title to edit
   → Textarea appears with full title
   → User can modify (but format is enforced on save)
   → On blur/Enter: title is saved and formatted
```

#### State Management
- `titleComponents`: `{ identifier, customerName, customerSlug }`
- `selectedCustomer`: Customer object from selection
- `formData.title`: Complete title in storage format

---

### 2. Members Management

#### Display
- Shows assigned members as avatars with names
- "+" button to add more members

#### Workflow
1. Click "Members" in sidebar or "+" button
2. Popup menu appears with all users
3. Check/uncheck users to add/remove
4. Changes are saved immediately
5. Activity log entry is created

#### Features
- Visual avatars (initials in colored circles)
- Hover shows full name/email
- Activity tracking for member changes

---

### 3. Labels Management

#### Display
- Shows assigned labels as colored badges
- "+" button to add more labels

#### Workflow
1. Click "Labels" in sidebar or "+" button
2. Popup menu appears with all labels
3. Check/uncheck labels to add/remove
4. Changes are saved immediately
5. Activity log entry is created

#### Features
- Color-coded labels
- Text color adjusts for contrast (white/black)
- Activity tracking for label changes

---

### 4. Due Date Management

#### Display
- Shows date with status badge:
  - Green: Complete
  - Red: Overdue
  - Yellow: Due Soon
  - Gray: Upcoming

#### Workflow
1. Click "Dates" in sidebar
2. Popup appears with datetime picker
3. Select date/time or click "Remove"
4. Changes are saved immediately
5. Activity log entry is created

#### Features
- Checkbox to mark as complete
- Visual status indicators
- Automatic overdue detection
- Activity tracking

---

### 5. Description Editing

#### Display
- Shows description or placeholder text
- "Edit" button when description exists

#### Workflow
1. Click description area or "Edit" button
2. Textarea appears with current description
3. Edit and click "Save" or "Cancel"
4. Changes are saved on "Save"
5. Activity log entry is created

#### Features
- Multi-line support
- Placeholder text when empty
- Cancel to revert changes
- Activity tracking

---

### 6. Attachments

#### Display
- List of attached files
- Thumbnails for images
- File names and sizes

#### Workflow
1. Click "Attachment" in sidebar
2. Upload file(s)
3. Files are uploaded to backend
4. Attachments list updates
5. Can set attachment as cover image
6. Can delete attachments

#### Features
- File upload via `contextAddAttachment`
- Image thumbnails
- Set as cover image
- Delete attachments
- Activity tracking

---

### 7. Checklists

#### Display
- List of checklists with progress
- Each checklist shows: `X/Y items complete`

#### Workflow
1. Click "Checklist" in sidebar
2. Popup appears to create new checklist
3. Enter title and press Enter or click "Add"
4. Checklist is added to card
5. Click checklist items to check/uncheck
6. Can delete checklists

#### Features
- Multiple checklists per card
- Progress tracking
- Item-level completion
- Activity tracking

---

### 8. Custom Fields

#### Display
- Shows custom field values
- Different field types (text, number, date, etc.)

#### Workflow
1. Click "Custom Fields" in sidebar
2. CustomFieldsManager component handles editing
3. Values are saved to `formData.customFields`
4. Changes are saved immediately

#### Features
- Multiple field types
- Field definitions from `DEFAULT_CUSTOM_FIELDS`
- Value persistence
- Activity tracking

---

### 9. Activity & Comments

#### Display
- Comments section at top
- Activity log (toggleable with "Show Details")

#### Workflow
1. Add comment in comments section
2. Comments are saved via `contextAddComment`
3. Activity log shows all card changes
4. Toggle "Show Details" to see full activity log

#### Features
- Real-time comments
- Activity tracking for all changes
- User attribution
- Timestamps
- Rich activity descriptions

---

### 10. Sidebar Actions

#### "ADD TO CARD" Section
- Members
- Labels
- Checklist
- Dates
- Attachment
- Cover
- Custom Fields

#### "ACTIONS" Section
- **Move**: Move card to different column
- **Copy**: Duplicate card
- **Watch/Unwatch**: Subscribe to card notifications
- **Archive/Unarchive**: Archive or restore card
- **Share**: Share card (opens share menu)
- **Delete**: Permanently delete card (only if archived)

---

## Modal Behavior

### Opening/Closing
- Opens when `isOpen={true}` and `card` prop is provided
- Closes on:
  - Click outside modal (backdrop)
  - ESC key
  - Close button (X)
  - `onClose()` callback

### Responsive Design
- Desktop: 768px width, centered modal
- Mobile: Full screen, no rounded corners
- Scrollable content area

### Keyboard Shortcuts
- `ESC`: Close modal
- `Enter` (in title): Save title
- `Enter` (in description): New line (use Save button)

---

## Data Flow

### State Updates
1. User makes change → `setFormData()` updates local state
2. Change is validated
3. `onUpdate()` callback is called with updated card
4. Activity log entry is added via `addActivity()`
5. Backend is updated (via context methods)

### Context Integration
- Uses `useKanban()` context for:
  - Users, labels, columns
  - Attachment operations
  - Checklist operations
  - Watch/unwatch operations
  - Comment operations

### Activity Tracking
- All changes create activity log entries
- Activities include:
  - User who made change
  - Timestamp
  - Change type
  - Description
  - Field changes (from/to values)

---

## Important Notes

### Title Format Enforcement
- Title format is **always** enforced: `DD-MM-YY-XXX-customername`
- Identifier cannot be edited (read-only)
- Customer selection automatically updates title
- Manual title editing still enforces format on save

### Customer Integration
- Customer is stored in `formData.customer`
- Customer selection updates both title and customer field
- Customer dropdown loads customers from backend
- Customer management modal can be opened for full CRUD

### Activity Log
- All changes are tracked
- Activity log is stored in `card.activityLog`
- Activities show user, timestamp, and description
- Can be toggled on/off with "Show Details"

### Error Handling
- Failed operations log to console
- User sees error messages for failed operations
- State is not updated if backend operation fails

---

## Component Props

```javascript
{
  card: Card,              // Card object to display/edit
  isOpen: boolean,        // Whether modal is open
  onClose: function,      // Callback to close modal
  onUpdate: function,     // Callback when card is updated
  onDelete: function,     // Callback to delete card
  onMove: function,       // Callback to move card
  onCopy: function,       // Callback to copy card
  isNewCard: boolean,     // Whether this is a new card
  reservation: object     // Identifier reservation (for new cards)
}
```

---

## Best Practices

1. **Always validate** before calling `onUpdate()`
2. **Add activity entries** for all user actions
3. **Update local state** before backend calls
4. **Handle errors gracefully** with user feedback
5. **Maintain format consistency** for card titles
6. **Use context methods** for backend operations
7. **Track all changes** in activity log



