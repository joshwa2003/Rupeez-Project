const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Demo billing data
const demoBillingInfo = [
  {
    id: '1',
    name: 'Oliver Liam',
    company: 'Viking Burrito',
    email: 'oliver@burrito.com',
    number: 'FRB1235476',
    address: '123 Main St, New York, NY 10001',
    phone: '+1 (555) 123-4567',
    isDefault: true
  },
  {
    id: '2',
    name: 'Lucas Harper',
    company: 'Stone Tech Zone',
    email: 'lucas@stone-tech.com',
    number: 'FRB1235477',
    address: '456 Tech Ave, San Francisco, CA 94105',
    phone: '+1 (555) 987-6543',
    isDefault: false
  },
  {
    id: '3',
    name: 'Ethan James',
    company: 'Fiber Notion',
    email: 'ethan@fiber.com',
    number: 'FRB1235478',
    address: '789 Innovation Blvd, Austin, TX 73301',
    phone: '+1 (555) 456-7890',
    isDefault: false
  }
];

const demoPaymentMethods = [
  {
    id: '1',
    type: 'credit_card',
    brand: 'mastercard',
    last4: 'XXXX',
    cardNumber: '7812 2139 0823 XXXX',
    expiryMonth: '05',
    expiryYear: '24',
    cvv: '09X',
    holderName: 'Argon x Chakra',
    isDefault: true,
    isActive: true
  },
  {
    id: '2',
    type: 'credit_card',
    brand: 'visa',
    last4: 'XXXX',
    cardNumber: '4532 1234 5678 XXXX',
    expiryMonth: '12',
    expiryYear: '25',
    cvv: '123',
    holderName: 'John Doe',
    isDefault: false,
    isActive: true
  }
];

const demoPaymentHistory = [
  {
    id: '1',
    type: 'income',
    source: 'Salary',
    company: 'Belong Interactive',
    amount: 2000,
    date: '2024-03-15',
    status: 'completed',
    method: 'bank_transfer'
  },
  {
    id: '2',
    type: 'income',
    source: 'Paypal',
    company: 'Freelance Payment',
    amount: 455,
    date: '2024-03-10',
    status: 'completed',
    method: 'paypal'
  },
  {
    id: '3',
    type: 'expense',
    source: 'Netflix Subscription',
    company: 'Netflix',
    amount: -15.99,
    date: '2024-03-01',
    status: 'completed',
    method: 'credit_card'
  }
];

// @route   GET /api/billing/info
// @desc    Get billing information
// @access  Private
router.get('/info', authenticateToken, (req, res) => {
  try {
    res.json({
      status: 'success',
      data: {
        billingInfo: demoBillingInfo
      }
    });

  } catch (error) {
    console.error('Get billing info error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching billing information'
    });
  }
});

// @route   POST /api/billing/info
// @desc    Add new billing information
// @access  Private
router.post('/info', authenticateToken, (req, res) => {
  try {
    const { name, company, email, number, address, phone, isDefault } = req.body;

    // Basic validation
    if (!name || !email) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide name and email'
      });
    }

    // If this is set as default, update others
    if (isDefault) {
      demoBillingInfo.forEach(info => info.isDefault = false);
    }

    const newBillingInfo = {
      id: (demoBillingInfo.length + 1).toString(),
      name,
      company: company || '',
      email,
      number: number || '',
      address: address || '',
      phone: phone || '',
      isDefault: isDefault || false,
      userId: req.user.id,
      createdAt: new Date().toISOString()
    };

    demoBillingInfo.push(newBillingInfo);

    res.status(201).json({
      status: 'success',
      message: 'Billing information added successfully',
      data: {
        billingInfo: newBillingInfo
      }
    });

  } catch (error) {
    console.error('Add billing info error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while adding billing information'
    });
  }
});

// @route   PUT /api/billing/info/:id
// @desc    Update billing information
// @access  Private
router.put('/info/:id', authenticateToken, (req, res) => {
  try {
    const billingIndex = demoBillingInfo.findIndex(info => info.id === req.params.id);

    if (billingIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Billing information not found'
      });
    }

    const { name, company, email, number, address, phone, isDefault } = req.body;

    // If this is set as default, update others
    if (isDefault) {
      demoBillingInfo.forEach(info => info.isDefault = false);
    }

    const updatedBillingInfo = {
      ...demoBillingInfo[billingIndex],
      name: name || demoBillingInfo[billingIndex].name,
      company: company !== undefined ? company : demoBillingInfo[billingIndex].company,
      email: email || demoBillingInfo[billingIndex].email,
      number: number !== undefined ? number : demoBillingInfo[billingIndex].number,
      address: address !== undefined ? address : demoBillingInfo[billingIndex].address,
      phone: phone !== undefined ? phone : demoBillingInfo[billingIndex].phone,
      isDefault: isDefault !== undefined ? isDefault : demoBillingInfo[billingIndex].isDefault,
      updatedAt: new Date().toISOString()
    };

    demoBillingInfo[billingIndex] = updatedBillingInfo;

    res.json({
      status: 'success',
      message: 'Billing information updated successfully',
      data: {
        billingInfo: updatedBillingInfo
      }
    });

  } catch (error) {
    console.error('Update billing info error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating billing information'
    });
  }
});

// @route   DELETE /api/billing/info/:id
// @desc    Delete billing information
// @access  Private
router.delete('/info/:id', authenticateToken, (req, res) => {
  try {
    const billingIndex = demoBillingInfo.findIndex(info => info.id === req.params.id);

    if (billingIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Billing information not found'
      });
    }

    demoBillingInfo.splice(billingIndex, 1);

    res.json({
      status: 'success',
      message: 'Billing information deleted successfully'
    });

  } catch (error) {
    console.error('Delete billing info error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while deleting billing information'
    });
  }
});

// @route   GET /api/billing/payment-methods
// @desc    Get payment methods
// @access  Private
router.get('/payment-methods', authenticateToken, (req, res) => {
  try {
    res.json({
      status: 'success',
      data: {
        paymentMethods: demoPaymentMethods
      }
    });

  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching payment methods'
    });
  }
});

// @route   POST /api/billing/payment-methods
// @desc    Add new payment method
// @access  Private
router.post('/payment-methods', authenticateToken, (req, res) => {
  try {
    const { 
      type, 
      brand, 
      cardNumber, 
      expiryMonth, 
      expiryYear, 
      cvv, 
      holderName, 
      isDefault 
    } = req.body;

    // Basic validation
    if (!type || !cardNumber || !expiryMonth || !expiryYear || !cvv || !holderName) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required payment method details'
      });
    }

    // If this is set as default, update others
    if (isDefault) {
      demoPaymentMethods.forEach(method => method.isDefault = false);
    }

    // Mask card number for security
    const last4 = cardNumber.slice(-4);
    const maskedCardNumber = cardNumber.replace(/\d(?=\d{4})/g, 'X');

    const newPaymentMethod = {
      id: (demoPaymentMethods.length + 1).toString(),
      type,
      brand: brand || 'unknown',
      last4,
      cardNumber: maskedCardNumber,
      expiryMonth,
      expiryYear,
      cvv: 'XXX', // Never store real CVV
      holderName,
      isDefault: isDefault || false,
      isActive: true,
      userId: req.user.id,
      createdAt: new Date().toISOString()
    };

    demoPaymentMethods.push(newPaymentMethod);

    res.status(201).json({
      status: 'success',
      message: 'Payment method added successfully',
      data: {
        paymentMethod: newPaymentMethod
      }
    });

  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while adding payment method'
    });
  }
});

// @route   DELETE /api/billing/payment-methods/:id
// @desc    Delete payment method
// @access  Private
router.delete('/payment-methods/:id', authenticateToken, (req, res) => {
  try {
    const methodIndex = demoPaymentMethods.findIndex(method => method.id === req.params.id);

    if (methodIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment method not found'
      });
    }

    demoPaymentMethods.splice(methodIndex, 1);

    res.json({
      status: 'success',
      message: 'Payment method deleted successfully'
    });

  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while deleting payment method'
    });
  }
});

// @route   GET /api/billing/history
// @desc    Get payment history
// @access  Private
router.get('/history', authenticateToken, (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    
    let filteredHistory = [...demoPaymentHistory];

    // Apply filters
    if (type) {
      filteredHistory = filteredHistory.filter(payment => payment.type === type);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

    res.json({
      status: 'success',
      data: {
        paymentHistory: paginatedHistory,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(filteredHistory.length / limit),
          totalItems: filteredHistory.length,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching payment history'
    });
  }
});

// @route   GET /api/billing/summary
// @desc    Get billing summary
// @access  Private
router.get('/summary', authenticateToken, (req, res) => {
  try {
    const totalIncome = demoPaymentHistory
      .filter(payment => payment.type === 'income')
      .reduce((sum, payment) => sum + payment.amount, 0);

    const totalExpenses = demoPaymentHistory
      .filter(payment => payment.type === 'expense')
      .reduce((sum, payment) => sum + Math.abs(payment.amount), 0);

    const summary = {
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      totalPaymentMethods: demoPaymentMethods.length,
      activeBillingInfo: demoBillingInfo.length,
      defaultPaymentMethod: demoPaymentMethods.find(method => method.isDefault),
      defaultBillingInfo: demoBillingInfo.find(info => info.isDefault)
    };

    res.json({
      status: 'success',
      data: {
        summary
      }
    });

  } catch (error) {
    console.error('Get billing summary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching billing summary'
    });
  }
});

module.exports = router;
