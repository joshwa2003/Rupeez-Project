# Category Management System

A complete React component system for managing expense and income categories in the Money Tracker application.

## Components

### 1. CategoryManager
The main component that handles the complete category management interface.

**Location**: `components/Categories/CategoryManager.js`

### 2. CategoryForm
A reusable form component for creating and editing categories.

**Location**: `components/Categories/CategoryForm.js`

### 3. Categories Page
A demo page showcasing the CategoryManager component.

**Location**: `views/Dashboard/Categories.js`

## Features

- ✅ **Create Categories**: Add new income or expense categories
- ✅ **Edit Categories**: Modify existing category names and types
- ✅ **Delete Categories**: Remove categories with confirmation dialog
- ✅ **List View**: Display all categories in a clean table format
- ✅ **Type Badges**: Visual indicators for income (green) and expense (red) categories
- ✅ **Statistics**: Show count of income, expense, and total categories
- ✅ **Form Validation**: Ensure category names are valid and required
- ✅ **Modal Interface**: Clean modal dialogs for create/edit operations
- ✅ **Responsive Design**: Works on desktop and mobile devices
- ✅ **Dark Mode Support**: Adapts to light/dark theme

## Usage

### Basic Usage

```jsx
import CategoryManager from 'components/Categories/CategoryManager';

function MyComponent() {
  return (
    <CategoryManager />
  );
}
```

### Using CategoryForm Separately

```jsx
import CategoryForm from 'components/Categories/CategoryForm';

function MyComponent() {
  const handleSubmit = (categoryData) => {
    console.log('Category data:', categoryData);
    // Handle category creation/update
  };

  const handleCancel = () => {
    console.log('Form cancelled');
  };

  return (
    <CategoryForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      initialData={existingCategory} // Optional for editing
    />
  );
}
```

## Data Structure

### Category Object

```javascript
{
  id: number,           // Unique identifier
  name: string,         // Category name (2-50 characters)
  type: 'income' | 'expense'  // Category type
}
```

### Example Categories

```javascript
const categories = [
  { id: 1, name: 'Food & Dining', type: 'expense' },
  { id: 2, name: 'Transportation', type: 'expense' },
  { id: 3, name: 'Salary', type: 'income' },
  { id: 4, name: 'Freelance', type: 'income' }
];
```

## Component Props

### CategoryManager Props

The CategoryManager component doesn't require any props and manages its own state internally.

### CategoryForm Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onSubmit` | `function` | Yes | - | Callback function called when form is submitted |
| `onCancel` | `function` | No | - | Callback function called when cancel button is clicked |
| `initialData` | `object` | No | `null` | Initial category data for editing |

## State Management

The system uses React's `useState` hook to manage categories locally:

```javascript
const [categories, setCategories] = useState([
  // Initial categories array
]);
```

### State Operations

1. **Create Category**: Adds new category to the array with auto-generated ID
2. **Update Category**: Updates existing category by ID
3. **Delete Category**: Removes category from array by ID

## Form Validation

The CategoryForm includes comprehensive validation:

- **Name Required**: Category name cannot be empty
- **Name Length**: Must be 2-50 characters
- **Type Required**: Must select either 'income' or 'expense'
- **Real-time Validation**: Errors clear as user corrects them

## API Integration Ready

The components are designed to be easily connected to a backend API:

```javascript
// Example API integration
const handleCreateCategory = async (categoryData) => {
  try {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(categoryData)
    });
    
    if (response.ok) {
      const newCategory = await response.json();
      setCategories(prev => [...prev, newCategory]);
    }
  } catch (error) {
    console.error('Error creating category:', error);
  }
};

const handleUpdateCategory = async (categoryId, categoryData) => {
  try {
    const response = await fetch(`/api/categories/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(categoryData)
    });
    
    if (response.ok) {
      const updatedCategory = await response.json();
      setCategories(prev => 
        prev.map(cat => cat.id === categoryId ? updatedCategory : cat)
      );
    }
  } catch (error) {
    console.error('Error updating category:', error);
  }
};

const handleDeleteCategory = async (categoryId) => {
  try {
    const response = await fetch(`/api/categories/${categoryId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    }
  } catch (error) {
    console.error('Error deleting category:', error);
  }
};
```

## Styling

The components use Chakra UI for styling and include:

- **Responsive Tables**: Automatically adapt to screen size
- **Color-coded Badges**: Green for income, red for expense
- **Hover Effects**: Interactive buttons and table rows
- **Loading States**: Button loading indicators during operations
- **Toast Notifications**: Success/error feedback for user actions

## Accessibility

- **Keyboard Navigation**: Full keyboard support for all interactions
- **ARIA Labels**: Proper labels for screen readers
- **Focus Management**: Logical tab order and focus indicators
- **Color Contrast**: Meets WCAG guidelines for text contrast

## Error Handling

The system includes comprehensive error handling:

- **Form Validation Errors**: Inline error messages
- **Network Errors**: Toast notifications for API failures
- **Empty States**: Helpful messages when no categories exist
- **Confirmation Dialogs**: Prevent accidental deletions

## Customization

### Adding New Category Types

To add new category types beyond 'income' and 'expense':

1. Update the CategoryForm select options
2. Add new badge colors in CategoryManager
3. Update validation logic if needed

### Styling Customization

Override Chakra UI theme or add custom CSS:

```javascript
// Custom theme
const customTheme = {
  colors: {
    income: '#48BB78',
    expense: '#F56565'
  }
};
```

## Navigation

The Categories page is accessible via:
- **URL**: `/admin/categories`
- **Navigation**: "Categories" menu item in the sidebar

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## Dependencies

- React 17+
- Chakra UI 1.8+
- @chakra-ui/icons

## Future Enhancements

Potential improvements for the category system:

1. **Category Icons**: Add icon selection for categories
2. **Category Colors**: Allow custom color assignment
3. **Subcategories**: Support for nested category structures
4. **Import/Export**: Bulk category management
5. **Usage Statistics**: Show which categories are used most
6. **Category Templates**: Predefined category sets for different user types
