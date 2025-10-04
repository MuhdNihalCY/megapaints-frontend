# 🐛 Debug Guide: Card Action Buttons

## ✅ **Debug Logging Added**

Comprehensive debug logging has been added to all card action buttons to help identify issues.

---

## 🔍 **Debug Logs Available**

### **ADD TO CARD Section**

All buttons now log when clicked:

1. **🔵 Members** - Logs activeSection state change
2. **🏷️ Labels** - Logs activeSection state change
3. **✅ Checklist** - Logs activeSection state change
4. **📅 Dates** - Logs activeSection state change
5. **📎 Attachment** - Logs activeSection state change
6. **🖼️ Cover** - Logs activeSection state change
7. **⚙️ Custom Fields** - Logs activeSection state change

### **ACTIONS Section**

All buttons now log when clicked:

1. **🚀 Move** - Logs if callback exists and formData
2. **📋 Copy** - Logs if callback exists and formData
3. **👁️ Watch/Unwatch** - Logs watching status and user data
4. **📦 Archive/Unarchive** - Logs archive status
5. **🔗 Share** - Logs activeSection state change

### **State Monitor**

Added a useEffect that monitors `activeSection` state changes:
- Logs: `🔍 activeSection changed to: <value>`

---

## 📋 **How to Debug**

### **Step 1: Open Browser Console**

1. Open your browser (Chrome/Firefox/Edge)
2. Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
3. Go to the "Console" tab

### **Step 2: Open Card Modal**

1. Click on any card to open the TrelloCardModal
2. You should see initial logs in the console

### **Step 3: Click Action Buttons**

Click each button and observe the console output:

#### **Example: Clicking "Members" Button**

Expected console output:
```
🔵 Members button clicked
Current activeSection: null
Set activeSection to: members
🔍 activeSection changed to: members
```

#### **Example: Clicking "Watch" Button**

Expected console output:
```
👁️ Watch/Unwatch button clicked
isWatching: false
formData.watchers: []
formData.subscriptions: []
currentUser: {id: "123", name: "John Doe", ...}
```

#### **Example: Clicking "Move" Button**

Expected console output:
```
🚀 Move button clicked
onMove function exists: false
formData: {id: "card-123", title: "My Card", ...}
⚠️ onMove callback not provided
```

---

## 🐛 **Common Issues & Solutions**

### **Issue 1: Buttons Don't Show Any Logs**

**Symptoms**: Clicking buttons does nothing, no console logs appear

**Possible Causes**:
1. Console is not open
2. Console is filtered (check filter settings)
3. JavaScript is disabled
4. Modal is not actually open

**Solutions**:
```javascript
// Verify modal is open
console.log('Is modal open?', isOpen);
console.log('Card data:', card);
```

---

### **Issue 2: Popup Menus Don't Appear**

**Symptoms**: Logs show button clicked and activeSection changed, but no popup appears

**Possible Causes**:
1. Popup is rendered but z-index is wrong
2. Popup is outside viewport
3. AnimatePresence is not working
4. Popup condition is not met

**Debug Steps**:
1. Check console for activeSection value:
   ```
   🔍 activeSection changed to: members
   ```

2. Inspect HTML to see if popup element exists:
   ```javascript
   // In console, run:
   document.querySelectorAll('[class*="absolute"][class*="right-4"]')
   ```

3. Check if popup is rendered but hidden:
   - Look for elements with `opacity: 0` or `display: none`
   - Check z-index values

**Solutions**:

**A. If popup element exists but not visible:**
```css
/* Check CSS in DevTools, popup should have: */
.popup-menu {
  position: absolute;
  z-index: 10;
  opacity: 1;
}
```

**B. If popup element doesn't exist:**
- Check if condition is correct:
```javascript
{activeSection === 'members' && (
  <motion.div>...</motion.div>
)}
```

---

### **Issue 3: Actions Return "Callback Not Provided"**

**Symptoms**: Logs show `⚠️ onMove callback not provided`

**Possible Causes**:
- Parent component is not passing the callback prop

**Solutions**:

**Check how TrelloCardModal is called:**
```javascript
// In parent component (KanbanBoard.jsx, KanbanCard.jsx, etc.)
<TrelloCardModal
  card={card}
  isOpen={isOpen}
  onClose={handleClose}
  onUpdate={handleUpdate}
  onDelete={handleDelete}
  onMove={handleMove}  // ← Must be provided
  onCopy={handleCopy}  // ← Must be provided
/>
```

**Add missing callbacks:**
```javascript
const handleMove = (card) => {
  console.log('Moving card:', card);
  // Implement move logic
  setActiveSection('move-selector');
};

const handleCopy = (card) => {
  console.log('Copying card:', card);
  // Implement copy logic
  const copiedCard = { ...card, id: generateNewId() };
  createCard(copiedCard);
};
```

---

### **Issue 4: Watch Button Doesn't Work**

**Symptoms**: Clicking Watch shows logs but nothing happens

**Debug Output Example**:
```
👁️ Watch/Unwatch button clicked
isWatching: undefined
formData.watchers: undefined
formData.subscriptions: undefined
currentUser: null
```

**Possible Causes**:
1. `currentUser` is null/undefined
2. `formData.watchers` is not initialized
3. `contextWatchCard` is not available

**Solutions**:

**A. Check if user is logged in:**
```javascript
// In console
console.log('Current user:', currentUser);
```

**B. Initialize watchers array:**
```javascript
// In formData initialization
const [formData, setFormData] = useState({
  ...card,
  watchers: card.watchers || [],
  subscriptions: card.subscriptions || []
});
```

**C. Verify context method exists:**
```javascript
console.log('Watch function exists:', !!contextWatchCard);
console.log('Unwatch function exists:', !!contextUnwatchCard);
```

---

### **Issue 5: Archive Button Doesn't Update UI**

**Symptoms**: Archive button logs correctly but card status doesn't change

**Debug Output**:
```
📦 Archive/Unarchive button clicked
formData.closed: false
formData: {id: "card-123", closed: false, ...}
```

**Possible Causes**:
1. `onUpdate` callback not updating parent state
2. `formData` local state not synced with card prop
3. Backend API not responding

**Solutions**:

**A. Check if onUpdate is called:**
```javascript
const handleArchive = () => {
  console.log('📦 Archiving card...');
  const updatedCard = {
    ...formData,
    closed: !formData.closed,
    archived_at: new Date().toISOString()
  };
  console.log('Updated card:', updatedCard);
  onUpdate(updatedCard);
  console.log('onUpdate called');
};
```

**B. Verify parent receives update:**
```javascript
// In parent component
const handleUpdate = (updatedCard) => {
  console.log('Parent received update:', updatedCard);
  // Update local state
  setCards(cards.map(c => c.id === updatedCard.id ? updatedCard : c));
};
```

---

## 📊 **Debug Checklist**

Use this checklist to systematically debug issues:

### **Before Clicking Buttons**

- [ ] Open browser console (F12)
- [ ] Clear console (click trash icon)
- [ ] Verify modal is open
- [ ] Check initial state logs

### **When Clicking "ADD TO CARD" Buttons**

- [ ] Click button
- [ ] Check for button click log (with emoji)
- [ ] Check for "Current activeSection" log
- [ ] Check for "Set activeSection to" log
- [ ] Check for "activeSection changed to" log
- [ ] Look for popup menu to appear
- [ ] If popup doesn't appear, inspect HTML

### **When Clicking "ACTIONS" Buttons**

- [ ] Click button
- [ ] Check for button click log (with emoji)
- [ ] Check if callback exists (for Move/Copy)
- [ ] Check data being passed
- [ ] Check if action executes
- [ ] Check if UI updates

---

## 🎯 **Expected Behavior**

### **ADD TO CARD Buttons**

**Working Correctly:**
1. Click button → Console log appears
2. Popup menu appears near button
3. Can interact with popup (select members, labels, etc.)
4. Closing popup works (X button or outside click)

### **ACTIONS Buttons**

**Watch:**
1. Click → Console shows current watch status
2. Button text changes: "Watch" ↔ "Unwatch"
3. Eye icon changes: 👁️ ↔ 🚫
4. `formData.watchers` array updated

**Archive:**
1. Click → Console shows current closed status
2. Button text changes: "Archive" ↔ "Unarchive"
3. `formData.closed` toggles: false ↔ true
4. Card might grey out or show archived badge

**Move/Copy:**
1. Click → Console shows if callback exists
2. If callback exists: popup or action happens
3. If callback missing: warning in console

---

## 🔧 **Advanced Debugging**

### **Method 1: Add Breakpoints**

1. Open DevTools → Sources tab
2. Find `TrelloCardModal.jsx`
3. Add breakpoint on button click handler
4. Click button
5. Inspect variables when paused

### **Method 2: React DevTools**

1. Install React DevTools extension
2. Open Components tab
3. Find `TrelloCardModal` component
4. Inspect props and state
5. Check if `activeSection` updates
6. Check if callbacks are passed

### **Method 3: Network Tab**

For actions that call APIs:
1. Open DevTools → Network tab
2. Click Watch/Archive/etc.
3. Look for API calls
4. Check request/response
5. Verify status codes

---

## 📝 **Reporting Issues**

If you find a bug, provide these details:

### **Issue Template**

```
**Button**: [e.g., Members / Watch / Archive]
**Action**: [e.g., Clicked "Members" button]
**Expected**: [e.g., Popup menu should appear]
**Actual**: [e.g., Nothing happened]

**Console Logs**:
```
[Paste console output here]
```

**Screenshots**: [Attach if helpful]

**Environment**:
- Browser: [e.g., Chrome 120]
- OS: [e.g., Windows 11]
- Modal State: [e.g., Editing existing card]
```

---

## ✅ **Summary**

### **What's Been Added**

1. ✅ Debug logs for all 7 "ADD TO CARD" buttons
2. ✅ Debug logs for all 5 "ACTIONS" buttons
3. ✅ State change monitor for `activeSection`
4. ✅ Detailed logging of:
   - Button clicks
   - State values
   - Callback availability
   - User data
   - Form data

### **How to Use**

1. Open console
2. Click buttons
3. Read logs
4. Identify issue
5. Apply solution from this guide

### **Next Steps**

1. Test all buttons with console open
2. Note any that don't work as expected
3. Use logs to identify root cause
4. Apply fixes from solutions section
5. Report any new issues found

---

**🎉 Happy Debugging!**

All buttons now have comprehensive logging to help identify and fix issues quickly!

---

**Debug Version**: 1.0.0  
**Date**: October 4, 2025  
**File**: `TrelloCardModal.jsx`  
**Status**: ✅ Debug Logs Active  

**Check your console now!** 🔍

