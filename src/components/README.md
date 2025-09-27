# Common Components

This directory contains reusable components that can be used across all pages of the application.

## LoadingOverlay

A full-screen loading overlay with animated loader that can be used to show loading states during server calls, data fetching, or any async operations.

### Usage

```jsx
import { LoadingOverlay } from '../components';

// Basic usage
<LoadingOverlay isLoading={true} />

// With custom message
<LoadingOverlay isLoading={isLoading} message="Saving data..." />

// Multiple loading states
<LoadingOverlay 
  isLoading={loadingMasters || isSaving || isUploading} 
  message={
    loadingMasters ? "Loading masters..." :
    isSaving ? "Saving formula..." :
    isUploading ? "Uploading file..." :
    "Loading..."
  }
/>
```

### Props

- `isLoading` (boolean): Whether to show the loading overlay
- `message` (string, optional): Custom loading message (defaults to "Loading...")

### Features

- **High z-index**: Appears above all other elements (z-index: 9999)
- **Full screen coverage**: Covers entire viewport
- **Animated loader**: Smooth rotation animation
- **Dark mode support**: Automatically adapts to theme
- **Responsive design**: Works on all screen sizes
- **Accessible**: Proper contrast and readable text

### Example Use Cases

1. **Data Loading**: Show while fetching categories, products, etc.
2. **Form Submission**: Show while saving forms or submitting data
3. **File Upload**: Show during file upload operations
4. **API Calls**: Show during any server communication
5. **Page Transitions**: Show during route changes or page loads

### Implementation in Components

```jsx
const MyComponent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const result = await api.getData();
      setData(result);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <LoadingOverlay isLoading={isLoading} message="Fetching data..." />
      {/* Your component content */}
    </div>
  );
};
```
