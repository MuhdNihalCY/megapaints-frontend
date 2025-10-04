<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Complete Card Model Implementation Prompt

## Objective

Build a card-based task management system that replicates Trello's card functionality with pixel-perfect accuracy in features, interactions, and user experience.

***

## 1. CARD DATA MODEL

### Core Card Properties

```javascript
Card {
  id: string (unique identifier)
  title: string (required, displayed on front)
  description: string (rich text, markdown support)
  listId: string (parent list reference)
  boardId: string (parent board reference)
  position: number (for drag-drop ordering)
  closed: boolean (archive status)
  dateCreated: timestamp
  dateLastActivity: timestamp
  url: string (permanent card link)
  
  // Visual & Organization
  coverImage: {
    attachmentId: string,
    url: string,
    color: string (if no image)
  }
  labels: Array<{
    id: string,
    color: string,
    name: string (max 25 chars)
  }>
  
  // Assignment & Scheduling
  members: Array<userId>
  dueDate: {
    date: datetime,
    completed: boolean
  }
  startDate: datetime (optional)
  
  // Content
  attachments: Array<{
    id: string,
    name: string,
    url: string,
    type: string (image/pdf/link/file),
    size: number,
    dateAdded: timestamp
  }>
  
  checklists: Array<{
    id: string,
    title: string,
    position: number,
    items: Array<{
      id: string,
      name: string,
      completed: boolean,
      position: number,
      dueDate: datetime (Premium only),
      assignedMember: userId (Premium only)
    }>
  }>
  
  customFields: Array<{
    fieldId: string,
    value: any (string/number/date/dropdown)
  }>
  
  comments: Array<{
    id: string,
    authorId: userId,
    text: string (markdown),
    dateCreated: timestamp,
    dateEdited: timestamp
  }>
  
  // Activity
  activityLog: Array<{
    id: string,
    type: string (comment/edit/move/etc),
    authorId: userId,
    timestamp: timestamp,
    data: object
  }>
  
  // Automation
  stickers: Array<object>
  subscriptions: Array<userId>
}
```


***

## 2. CARD FRONT (LIST VIEW)

### Visual Display Requirements

**Mandatory elements that always show:**

- Card title (text, word-wrap enabled)
- White background with subtle shadow on hover
- Rounded corners (3px border-radius)
- 8px padding on all sides
- Minimum height: 32px

**Conditional elements (show only when present):**

1. **Cover Image/Color** (top of card, full width)
    - Image: auto-scale to width, max height 260px
    - Color: solid bar, 32px height
2. **Labels** (below cover, above title)
    - Colored horizontal bars, 8px height, 4px border-radius
    - Up to 6 visible, then "+X more" indicator
    - Gray labels show text only, no color bar
3. **Card Badges** (bottom row, icon + count format)
    - Description indicator: if description exists, show text-lines icon
    - Comments: speech bubble icon + comment count
    - Attachments: paperclip icon + attachment count
    - Checklist: checkbox icon + "X/Y" completion ratio
    - Due date: clock icon + date (color-coded: green=complete, yellow=approaching, red=overdue)
    - Members: avatar circles, max 5 visible, overlapping style
    - Custom fields: show as small badges if configured

### Interaction States

- **Hover**: Slightly darker shadow, cursor pointer
- **Dragging**: Rotated 5 degrees, increased shadow, 70% opacity
- **Selected**: Blue border highlight

***

## 3. CARD BACK (MODAL VIEW)

### Modal Overlay Specifications

- **Background**: Semi-transparent dark overlay (rgba(0,0,0,0.64))
- **Modal container**: 768px width, auto height, centered
- **Padding**: 16px all sides
- **Background**: White (\#FFFFFF)
- **Border radius**: 8px
- **Scroll**: Vertical scroll if content exceeds viewport
- **Close behavior**: Click outside modal, press ESC key, or click X button


### Modal Layout Structure

#### HEADER SECTION

```
[Cover Image - full width if present]
[Icon] [Title - editable inline]
     in list "List Name" [move] [copy] [...]
```

- Card icon (credit-card symbol) on far left
- Title: Click to edit, auto-resize, save on blur/Enter
- Subtitle: Shows parent list name
- Quick actions: Move, Copy, 3-dot menu (top right)


#### MAIN CONTENT AREA (Left Column - 552px width)

**1. Members Section**

- Label: "Members"
- Display: Circular avatars (32px diameter)
- Action: Click to add/remove members
- Popup shows: Board member list with search

**2. Labels Section**

- Label: "Labels"
- Display: Colored rectangles with text
- Action: Click to open label picker
- Features: Create new, edit existing, multi-select

**3. Due Date Section**

- Label: "Due Date"
- Display: Date with status indicator checkbox
- Date picker: Calendar popup with time selection
- Status colors: Yellow (approaching), Red (overdue), Green (complete)

**4. Description Section**

- Label: "Description" with edit button
- Default state: "Add a more detailed description..."
- Edit mode: Rich text editor with markdown support
- Formatting: Bold, italic, lists, links, code blocks
- Save/Cancel buttons appear when editing

**5. Attachments Section**

- Label: "Attachments"
- Display: List format with thumbnail/icon, name, date, size
- Actions per attachment: Download, Delete, Make Cover, Edit
- Upload methods: Computer, Link, Google Drive, Dropbox
- Drag-and-drop zone: Entire card back accepts file drops
- Image preview: Click opens lightbox modal

**6. Checklists Section**

- Label: Shows checklist title with progress bar
- Progress bar: Percentage complete, turns green at 100%
- Items: Checkbox + text (click to edit inline)
- Actions per item: Convert to card, delete, assign (Premium)
- Checklist actions: Add item, delete checklist, copy items
- Drag items: Reorder within or between checklists

**7. Custom Fields Section** (if Power-Up enabled)

- Label: "Custom Fields"
- Display: Field name + value (inline editing)
- Field types: Text input, Number input, Date picker, Dropdown select

**8. Activity Section** (Bottom of left column)

- Label: "Activity" with "Show Details/Hide Details" toggle
- Filter: "Comments" vs "All Activity"
- Display: Avatar + Author name + Action + Timestamp
- Comment box: Always visible at top
    - Placeholder: "Write a comment..."
    - @ mention autocomplete for members
    - Markdown formatting support
    - Save button activates when text present


#### SIDEBAR (Right Column - 168px width)

**Add to Card Menu:**

- Members (person icon)
- Labels (tag icon)
- Checklist (checkmark icon)
- Dates (clock icon)
- Attachment (paperclip icon)
- Cover (image icon)
- Custom Fields (if enabled)

**Actions Menu:**

- Move (arrow icon)
- Copy (duplicate icon)
- Make Template (file icon)
- Watch/Unwatch (eye icon)
- Archive (archive icon)
- Share (share icon)

**Automation Section** (if Butler enabled):

- Card Buttons
- Rule suggestions

**Power-Ups Section:**

- Installed Power-Up actions

***

## 4. INTERACTION PATTERNS

### Card Creation

**Method 1: Bottom of list**

1. Click "Add a card" button
2. Inline text field appears
3. Type card title
4. Press Enter = Save and create another
5. Click "Add card" button = Save and close
6. Press ESC = Cancel

**Method 2: Between cards**

1. Double-click empty space between cards
2. Card created at that exact position

**Method 3: Top of list**

1. Click list menu (...)
2. Select "Add card to top"

**Method 4: Keyboard shortcut**

- Desktop: Option/Alt + Control + Space

**Method 5: Bulk creation**

- Paste multi-line text = Each line becomes a card


### Card Opening

- Click anywhere on card front → Opens modal
- Modal loads with fade-in animation (150ms)
- URL updates to /c/[cardId] (shareable)
- Browser back button closes modal


### Card Moving (Drag and Drop)

**Visual Feedback:**

1. **Drag start**: Card rotates 5°, shadow increases, opacity 70%
2. **Valid drop zone**: Gray placeholder box appears
3. **Hover over cards**: Placeholder shows above/below target
4. **Cross-list drag**: Hovering over list activates its drop zones
5. **Drop release**: Card animates smoothly to new position (200ms ease-out)

**Behavior Rules:**

- Horizontal list scroll: Auto-scroll when dragging near edges
- Vertical card scroll: Auto-scroll when dragging near top/bottom
- Drop zones: Between every card + top and bottom of list
- Multi-select: Hold Ctrl/Cmd to drag multiple cards (show count badge)


### Checklist Interaction

**Adding items:**

- Type in "Add an item" field
- Press Enter = Save and add another
- Click "Add" button = Save and close

**Completing items:**

- Single click checkbox = Toggle complete
- Completed items: Strikethrough text, move to bottom (configurable)
- Progress updates immediately with smooth animation

**Advanced actions:**

- Click item text = Edit inline
- Hover item = Show delete and convert buttons on right
- Drag handle (left of checkbox) = Reorder items


### Comment System

**Adding comments:**

1. Click comment box
2. Type with markdown support
3. @ symbol triggers member autocomplete
4. Click "Save" or press Ctrl/Cmd+Enter

**Comment actions:**

- Edit: Pencil icon (visible to author)
- Delete: Trash icon (visible to author)
- React: Emoji reactions (if enabled)


### Label Management

**Quick actions:**

- Click label on card front = Open label editor
- Checkbox in editor = Toggle label on/off
- Color click in editor = Open color + name editing

**Label editor popup:**

- Grid of colors (9 colors + option for no color)
- Text field for label name (25 char max)
- "Create new label" option at bottom


### Attachment Handling

**Upload flow:**

1. Click "Attachment" in sidebar
2. Choose source (Computer/Link/Drive/Dropbox)
3. File upload with progress bar
4. Auto-set as cover if first image

**Attachment actions:**

- Make cover: Set as card cover image
- Download: Direct file download
- Delete: Remove with confirmation
- Edit: Rename or change link

***

## 5. AUTOMATION \& BEHAVIOR

### Real-time Updates

- All changes sync instantly across all open instances
- Activity log updates automatically
- Notifications sent to subscribed/assigned members
- Optimistic UI updates (show change immediately, rollback if fails)


### Due Date Automation

- 24 hours before: Badge turns yellow
- Past due: Badge turns red, shows "overdue"
- Mark complete: Badge turns green with checkmark
- Calendar integration: Sync with Google Calendar/Outlook


### Checklist Progress

- Calculate: (completed items / total items) × 100
- Display on card front: "X/Y" format
- Progress bar: Visual 0-100% bar
- Color change: Green when 100% complete


### Archive Behavior

- Archive = Set closed:true, remove from board view
- Remains searchable
- Accessible via board menu → Archived items
- Restore = Unarchive to original or selected list


### Delete Behavior

- Must archive first
- Delete button only appears after archiving
- Confirmation dialog required
- Permanent deletion (no recovery)

***

## 6. RESPONSIVE \& MOBILE ADAPTATIONS

### Mobile Card Front

- Same information density
- Touch targets minimum 44×44px
- Swipe left on card = Archive
- Long-press = Show quick actions menu


### Mobile Card Back

- Full-screen modal (not centered overlay)
- Single column layout
- Sidebar actions moved to bottom sheet
- Pull-to-refresh updates activity
- Attachment tap = Download or preview
- Keyboard appears: Modal scrolls to keep field visible

***

## 7. PERFORMANCE REQUIREMENTS

### Loading

- Card front renders: <50ms
- Card back opens: <200ms
- Drag feedback: <16ms (60fps)
- Attachment upload: Show progress bar


### Limits

- Cards per list: 5,000 (warn at 1,000)
- Attachments per card: Unlimited
- Attachment size: 10MB (Free), 250MB (Standard)
- Checklist items per card: Unlimited
- Comments per card: Unlimited
- Members per card: No limit
- Labels per card: Unlimited (display optimized for 6)


### Caching

- Cache card data locally
- Offline mode: Allow viewing, queue changes
- Sync on reconnection

***

## 8. ACCESSIBILITY REQUIREMENTS

- Keyboard navigation: Tab through all interactive elements
- Screen reader labels: All icons have aria-labels
- Focus indicators: Visible blue outline on focus
- Color contrast: WCAG AA compliance (4.5:1 minimum)
- Keyboard shortcuts:
    - Enter: Open card
    - ESC: Close modal/cancel edit
    - E: Quick edit title
    - Arrow keys: Navigate between cards
    - Space: Select card (multi-select mode)

***

## 9. ERROR HANDLING

### Network Failures

- Show toast: "Unable to save. Retrying..."
- Retry logic: 3 attempts with exponential backoff
- Offline queue: Store changes, sync when online


### Validation Errors

- Card title: Cannot be empty (required)
- File upload: Show error if exceeds size limit
- Due date: Warn if in past (but allow)
- Custom fields: Validate based on field type


### User Feedback

- Success: Subtle checkmark animation
- Error: Red toast notification with message
- Loading: Spinner or skeleton screen
- Autosave: "Saving..." indicator during edits

***

## 10. IMPLEMENTATION CHECKLIST

**Phase 1: Core Card Structure**

- [ ] Card data model with all properties
- [ ] Card front display component
- [ ] Card back modal overlay
- [ ] Basic CRUD operations

**Phase 2: Content Features**

- [ ] Title editing (inline)
- [ ] Description with markdown
- [ ] Member assignment
- [ ] Label system
- [ ] Due date picker
- [ ] Attachments with upload

**Phase 3: Advanced Features**

- [ ] Checklist system with progress
- [ ] Comments and activity log
- [ ] Custom fields integration
- [ ] Drag-and-drop reordering
- [ ] Archive and delete

**Phase 4: Interactions**

- [ ] All hover states
- [ ] Keyboard shortcuts
- [ ] Mobile touch gestures
- [ ] Real-time sync
- [ ] Notifications

**Phase 5: Polish**

- [ ] Animations and transitions
- [ ] Error handling
- [ ] Accessibility compliance
- [ ] Performance optimization
- [ ] Cross-browser testing

***

This prompt provides complete specifications for building a card model. Every feature, interaction, and behavior is defined with precise technical requirements. Implement each section systematically, testing thoroughly before moving to the next phase.
<span style="display:none">[^1][^10][^11][^12][^13][^14][^15][^16][^17][^18][^2][^3][^4][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://trello.com/tour

[^2]: https://trello.com/guide/trello-101

[^3]: https://support.atlassian.com/trello/docs/card-types/

[^4]: https://trello.com/templates

[^5]: https://www.simplilearn.com/tutorials/project-management-tutorial/what-is-trello

[^6]: https://trello.com/pricing

[^7]: https://www.atlassian.com/blog/trello/trello-features-change-the-way-you-work

[^8]: https://www.sendboard.com/blog/new-trello-personal-productivity

[^9]: https://www.youtube.com/watch?v=LKwMcTFdq80

[^10]: https://trello.com/guide/enterprise/advanced-features

[^11]: https://saufter.io/trello-pricing/

[^12]: https://www.sec.gov/Archives/edgar/data/1650372/000165037225000036/team-20250630.htm

[^13]: https://www.sec.gov/Archives/edgar/data/1845338/000117891325000852/zk2532825.htm

[^14]: https://www.sec.gov/Archives/edgar/data/1650372/000165037224000036/team-20240630.htm

[^15]: https://www.sec.gov/Archives/edgar/data/1650372/000165037223000040/team-20230630.htm

[^16]: https://www.sec.gov/Archives/edgar/data/1954227/000160706224000139/elements042524forms1a3.htm

[^17]: https://www.sec.gov/Archives/edgar/data/1872525/000121390024027282/ea0202559-10k_stran.htm

[^18]: https://www.sec.gov/Archives/edgar/data/1845338/000117891324000943/zk2431098.htm

