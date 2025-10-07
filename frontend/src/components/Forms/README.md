# TransactionForm Component

A reusable React component for creating and editing financial transactions in the Money Tracker application.

## Features

- ✅ **Complete Form Fields**: Type, Amount, Category, Date, Payment Method, Notes, Attachment
- ✅ **Validation**: Required field validation with error messages
- ✅ **File Upload**: Support for JPG, PNG, PDF files with size validation (5MB limit)
- ✅ **Modern UI**: Clean design using Chakra UI components
- ✅ **Responsive**: Works on desktop and mobile devices
- ✅ **Reusable**: Can be used in modals, standalone pages, or embedded components
- ✅ **Dark Mode**: Supports light/dark theme switching

## Installation

The component is already included in the project. No additional installation required.

## Usage

### Basic Usage

```jsx
import TransactionForm from 'components/Forms/TransactionForm';

function MyComponent() {
  const handleSubmit = async (formData) => {
    console.log('Transaction data:', formData);
    // Send to API or handle as needed
  };

  const handleCancel = () => {
    console.log('Form cancelled');
  };

  return (
    <TransactionForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
```

### With Initial Data (Edit Mode)

```jsx
const existingTransaction = {
  type: 'expense',
  amount: 50.00,
  category: 'food',
  date: '2024-01-15',
  paymentMethod: 'card',
  notes: 'Lunch at restaurant'
};

<TransactionForm
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  initialData={existingTransaction}
/>
```

### In a Modal

```jsx
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody } from '@chakra-ui/react';

<Modal isOpen={isOpen} onClose={onClose} size="lg">
  <ModalOverlay />
  <ModalContent>
    <ModalHeader>Add New Transaction</ModalHeader>
    <ModalBody pb={6}>
      <TransactionForm
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </ModalBody>
  </ModalContent>
</Modal>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onSubmit` | `function` | Yes | - | Callback function called when form is submitted with valid data |
| `onCancel` | `function` | No | - | Callback function called when cancel button is clicked |
| `initialData` | `object` | No | `{}` | Initial form data for editing existing transactions |

### onSubmit Function

The `onSubmit` function receives a single parameter containing the form data:

```jsx
const handleSubmit = async (formData) => {
  // formData structure:
  {
    type: 'income' | 'expense',           // Required
    amount: number,                       // Required, > 0
    category: string,                     // Optional
    date: string,                         // ISO date string
    paymentMethod: string,                // Optional
    notes: string,                        // Optional
    attachment: File | null               // Optional file object
  }
};
```

### initialData Object

```jsx
const initialData = {
  type: 'expense',                        // 'income' or 'expense'
  amount: 25.50,                          // Number
  category: 'food',                       // Category value
  date: '2024-01-15',                     // YYYY-MM-DD format
  paymentMethod: 'card',                  // Payment method value
  notes: 'Optional notes',                // String
  attachment: null                        // File object or null
};
```

## Form Fields

### 1. Type (Required)
- **Options**: Income, Expense
- **Validation**: Required field

### 2. Amount (Required)
- **Type**: Number input
- **Validation**: Required, must be greater than 0
- **Format**: Supports decimal values (e.g., 25.50)

### 3. Category (Optional)
- **Options**: Food, Rent, Travel, Shopping, Bills, Salary, Others
- **Default**: No selection

### 4. Date (Optional)
- **Type**: Date picker
- **Default**: Today's date
- **Format**: YYYY-MM-DD

### 5. Payment Method (Optional)
- **Options**: Cash, Card, UPI, Bank
- **Default**: No selection

### 6. Notes (Optional)
- **Type**: Textarea
- **Max Length**: No limit
- **Placeholder**: "Add any notes (optional)"

### 7. Attachment (Optional)
- **Accepted Types**: JPG, PNG, PDF
- **Size Limit**: 5MB
- **Validation**: File type and size validation with user feedback

## Validation

The component includes built-in validation:

- **Required Fields**: Type and Amount must be filled
- **Amount Validation**: Must be a positive number
- **File Validation**: Checks file type and size
- **Real-time Feedback**: Errors clear as user corrects them

## Styling

The component uses Chakra UI for styling and supports:

- **Light/Dark Mode**: Automatically adapts to current color mode
- **Responsive Design**: Works on all screen sizes
- **Consistent Spacing**: Uses Chakra UI spacing system
- **Accessible**: Proper ARIA labels and keyboard navigation

## Error Handling

The component handles various error scenarios:

- **Validation Errors**: Displayed inline with red text
- **File Upload Errors**: Toast notifications for invalid files
- **Submission Errors**: Can be handled in the `onSubmit` callback

## Example Implementation

See `views/Dashboard/AddTransaction.js` for a complete example showing:

- Standalone form usage
- Modal integration
- Data handling
- Error management

## API Integration

To integrate with your backend API:

```jsx
const handleSubmit = async (formData) => {
  try {
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      // Success handling
      toast({
        title: 'Success',
        description: 'Transaction saved successfully',
        status: 'success'
      });
    }
  } catch (error) {
    // Error handling
    toast({
      title: 'Error',
      description: 'Failed to save transaction',
      status: 'error'
    });
  }
};
```

## Customization

The component can be customized by:

1. **Modifying Options**: Edit the dropdown options in the component
2. **Styling**: Override Chakra UI theme or add custom CSS
3. **Validation**: Extend the validation logic
4. **Fields**: Add or remove form fields as needed

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## Dependencies

- React 17+
- Chakra UI 1.8+
- React Hook Form (built-in state management)
