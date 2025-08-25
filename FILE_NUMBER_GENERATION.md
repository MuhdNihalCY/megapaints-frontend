# File Number Generation System

## Overview

The file number generation system implements the same logic as the server-side `generateFileNo` function, providing automatic and manual file number management for paint formulas. This system ensures unique file numbers while providing meaningful information about the formula's characteristics.

## Features

### 🔢 **Automatic File Number Generation**
- Generates unique file numbers on component load
- Increments from the latest existing file number
- Handles concurrent users with duplicate prevention
- Fallback to timestamp-based numbers if API fails

### ✏️ **Manual File Number Editing**
- Click-to-edit modal interface
- Real-time validation and duplicate checking
- Preview of formatted file number
- Format validation (numbers only or with suffix)

### 🔄 **Dynamic File Number Updates**
- Automatically updates when subcategory changes
- Updates when gloss level changes
- Updates when additive information changes
- Maintains internal file number while updating formatted display

### 🛡️ **Duplicate Prevention**
- Checks existing file numbers in database
- Increments with suffix system (A → B → C → ... → Z → AA → AB)
- Validates uniqueness before saving
- Handles edge cases and API failures

## File Structure

```
src/
├── formula/
│   └── services/
│       ├── fileNumberService.js          # Core file number logic
│       └── __tests__/
│           └── fileNumberService.test.js # Unit tests
└── features/
    └── user/
        ├── CreateFormula.jsx             # Main component
        └── components/
            └── FileNumberModal.jsx       # Edit modal
```

## File Number Format

### Basic Format
```
[Number]-[SubcategorySuffix]-[Gloss]-[AdditiveSuffix][AdditivePercentage]
```

### Examples
- `100000-ABC-05` (Number 100000, Subcategory suffix ABC, Gloss 05)
- `100000-ABC-05-XY10` (With additive XY at 10%)
- `100000.A-ABC-05` (With suffix increment)

### Suffix System
- **A → B → C → ... → Z → AA → AB → AC → ... → AZ → BA → BB → ...**
- Handles unlimited suffix combinations
- Prevents duplicate file numbers

## Implementation Details

### 1. File Number Service (`fileNumberService.js`)

#### Core Functions

**`generateFileNo(data, isNewFormula)`**
- Generates new file numbers or validates manual updates
- Fetches existing formulas to check for duplicates
- Returns both internal and formatted file numbers

**`formulaFileFormat(fileNo, subcategoryID, gloss, additiveID, additivePercentage, subcategories, additives)`**
- Formats file number with subcategory, gloss, and additive information
- Ensures two-digit formatting for gloss and percentage values
- Handles missing or invalid data gracefully

**`incrementSuffix(fileNo)`**
- Increments file number suffixes (100000 → 100000.A → 100000.B)
- Uses alphabetic incrementing system

**`validateFileNumber(fileNo)`**
- Checks if file number is unique in database
- Returns boolean indicating uniqueness

### 2. File Number Modal (`FileNumberModal.jsx`)

#### Features
- **Real-time validation**: Checks format and uniqueness as user types
- **Preview**: Shows formatted file number before saving
- **Error handling**: Displays validation errors clearly
- **Keyboard shortcuts**: Enter to save, Escape to cancel

#### Validation Rules
- Must be numeric (e.g., 100000) or with suffix (e.g., 100000.A)
- Must be unique in database
- Cannot be empty

### 3. CreateFormula Integration

#### State Management
```javascript
const [isFileNumberModalOpen, setIsFileNumberModalOpen] = useState(false);
const [isGeneratingFileNumber, setIsGeneratingFileNumber] = useState(false);
const [labelFileNo, setLabelFileNo] = useState(''); // Internal number
const [formattedFileNo, setFormattedFileNo] = useState(''); // Display number
```

#### Key Functions
- **`generateFileNumber()`**: Generates initial file number on load
- **`handleFileNumberUpdate()`**: Updates file number from modal
- **`openFileNumberModal()`**: Opens edit modal

#### Auto-regeneration
- Triggers when subcategory, gloss, or additive information changes
- Maintains internal file number while updating formatted display
- Prevents unnecessary API calls

## Usage

### Automatic Generation
File numbers are automatically generated when the CreateFormula component loads:

```javascript
// Called automatically in useEffect after master data loads
await generateFileNumber();
```

### Manual Editing
Users can edit file numbers by clicking the file number input:

```javascript
// Opens modal for editing
openFileNumberModal();

// Handles save from modal
handleFileNumberUpdate(newLabelFileNo, newFormattedFileNo);
```

### Dynamic Updates
File numbers automatically update when formula configuration changes:

```javascript
// Triggers when subcategory, gloss, or additives change
useEffect(() => {
  if (labelFileNo && !isGeneratingFileNumber) {
    // Regenerate formatted file number
    const newFormattedFileNo = FileNumberService.formulaFileFormat(...);
    setFormattedFileNo(newFormattedFileNo);
  }
}, [labelFileNo, subCategory, gloss, additives, ...]);
```

## API Integration

### Required Endpoints
- `GET /api/v1/formulations/formula` - Fetch existing formulas for duplicate checking
- Parameters: `page`, `limit`, `sortBy`, `sortOrder`

### Response Format
```javascript
{
  success: true,
  formulas: [
    {
      FileNo: "100000",
      labelFileNo: "100000",
      SubCategory: "Rosner_Acrylic",
      gloss: 5,
      // ... other formula data
    }
  ],
  pagination: {
    page: 1,
    limit: 10000,
    total: 150,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  }
}
```

## Error Handling

### API Failures
- Falls back to timestamp-based file numbers
- Logs errors for debugging
- Continues operation without blocking user

### Validation Errors
- Clear error messages in modal
- Prevents saving invalid file numbers
- Real-time feedback during editing

### Duplicate Prevention
- Checks database before saving
- Increments automatically if duplicate found
- User-friendly error messages

## Testing

### Unit Tests
Run tests for file number service:

```bash
npm test src/formula/services/__tests__/fileNumberService.test.js
```

### Test Coverage
- Alphabetic suffix incrementing
- File number suffix incrementing
- File number formatting
- Duplicate validation
- Error handling

## Configuration

### Default Values
- **Starting number**: 100000
- **Suffix pattern**: A, B, C, ..., Z, AA, AB, ...
- **Gloss formatting**: Two digits (05, 10, 15, etc.)
- **Percentage formatting**: Two digits (05, 10, 15, etc.)

### Customization
Modify `fileNumberService.js` to change:
- Default starting number
- Suffix incrementing logic
- File number formatting rules
- API endpoints

## Security Considerations

### Input Validation
- Sanitizes all user inputs
- Validates file number format
- Prevents injection attacks

### Duplicate Prevention
- Server-side validation recommended
- Client-side validation for UX
- Database constraints for data integrity

### Error Handling
- Graceful degradation on API failures
- User-friendly error messages
- No sensitive data exposure

## Performance Optimizations

### Caching
- Caches existing file numbers during validation
- Minimizes API calls for duplicate checking
- Efficient state updates

### Memoization
- Memoizes formatted file numbers
- Prevents unnecessary recalculations
- Optimizes re-renders

### API Efficiency
- Batches file number queries
- Uses pagination for large datasets
- Implements proper error handling

## Future Enhancements

### Planned Features
- **Bulk file number generation**: Generate multiple file numbers at once
- **File number templates**: Custom formatting templates
- **Advanced validation**: More sophisticated duplicate checking
- **Audit trail**: Track file number changes
- **Import/export**: Bulk file number management

### Potential Improvements
- **Real-time collaboration**: Handle concurrent edits
- **Offline support**: Generate file numbers without internet
- **Advanced formatting**: More complex file number patterns
- **Integration**: Connect with other systems

## Troubleshooting

### Common Issues

**File number not generating**
- Check API connectivity
- Verify master data loading
- Check console for errors

**Duplicate file numbers**
- Verify database constraints
- Check concurrent user access
- Validate incrementing logic

**Formatting issues**
- Check subcategory/additive data
- Verify suffix configurations
- Validate input data types

### Debug Mode
Enable development logging:

```javascript
if (process.env.NODE_ENV === 'development') {
  console.log('File number generation:', result);
}
```

## Support

For issues or questions about the file number generation system:

1. Check the console for error messages
2. Verify API endpoints are accessible
3. Test with minimal data to isolate issues
4. Review the test cases for expected behavior
5. Check the server-side implementation for consistency

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Author**: Megapaints Team
