const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Demo invoices data
const demoInvoices = [
  {
    id: '1',
    code: '#MS-415646',
    date: '2024-03-01',
    dueDate: '2024-03-31',
    amount: 180,
    status: 'paid',
    clientName: 'Acme Corporation',
    clientEmail: 'billing@acme.com',
    description: 'Web development services',
    items: [
      { name: 'Frontend Development', quantity: 20, rate: 50, amount: 1000 },
      { name: 'Backend Development', quantity: 15, rate: 60, amount: 900 }
    ],
    format: 'PDF'
  },
  {
    id: '2',
    code: '#RV-126749',
    date: '2024-02-10',
    dueDate: '2024-03-10',
    amount: 250,
    status: 'paid',
    clientName: 'Tech Solutions Inc',
    clientEmail: 'accounts@techsolutions.com',
    description: 'Consulting services',
    items: [
      { name: 'Technical Consultation', quantity: 5, rate: 100, amount: 500 }
    ],
    format: 'PDF'
  },
  {
    id: '3',
    code: '#FB-212562',
    date: '2024-04-05',
    dueDate: '2024-05-05',
    amount: 560,
    status: 'pending',
    clientName: 'Digital Marketing Co',
    clientEmail: 'finance@digitalmarketing.com',
    description: 'Website redesign project',
    items: [
      { name: 'UI/UX Design', quantity: 8, rate: 75, amount: 600 },
      { name: 'Development', quantity: 12, rate: 65, amount: 780 }
    ],
    format: 'PDF'
  },
  {
    id: '4',
    code: '#QW-103578',
    date: '2024-06-25',
    dueDate: '2024-07-25',
    amount: 120,
    status: 'overdue',
    clientName: 'Startup Ventures',
    clientEmail: 'billing@startupventures.com',
    description: 'Mobile app development',
    items: [
      { name: 'App Development', quantity: 2, rate: 200, amount: 400 }
    ],
    format: 'PDF'
  },
  {
    id: '5',
    code: '#AR-803481',
    date: '2024-03-01',
    dueDate: '2024-04-01',
    amount: 300,
    status: 'draft',
    clientName: 'Enterprise Solutions',
    clientEmail: 'payments@enterprise.com',
    description: 'System integration services',
    items: [
      { name: 'Integration Services', quantity: 6, rate: 80, amount: 480 }
    ],
    format: 'PDF'
  }
];

// @route   GET /api/invoices
// @desc    Get all invoices for user
// @access  Private
router.get('/', authenticateToken, (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    
    let filteredInvoices = [...demoInvoices];

    // Apply filters
    if (status) {
      filteredInvoices = filteredInvoices.filter(inv => inv.status === status);
    }
    
    if (search) {
      filteredInvoices = filteredInvoices.filter(inv => 
        inv.code.toLowerCase().includes(search.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
        inv.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

    res.json({
      status: 'success',
      data: {
        invoices: paginatedInvoices,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(filteredInvoices.length / limit),
          totalItems: filteredInvoices.length,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching invoices'
    });
  }
});

// @route   GET /api/invoices/:id
// @desc    Get single invoice
// @access  Private
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const invoice = demoInvoices.find(inv => inv.id === req.params.id);

    if (!invoice) {
      return res.status(404).json({
        status: 'error',
        message: 'Invoice not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        invoice
      }
    });

  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching invoice'
    });
  }
});

// @route   POST /api/invoices
// @desc    Create new invoice
// @access  Private
router.post('/', authenticateToken, (req, res) => {
  try {
    const { 
      clientName, 
      clientEmail, 
      description, 
      items, 
      dueDate 
    } = req.body;

    // Basic validation
    if (!clientName || !clientEmail || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide client name, email, and at least one item'
      });
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);

    // Generate invoice code
    const invoiceCode = `#INV-${Date.now()}`;

    const newInvoice = {
      id: (demoInvoices.length + 1).toString(),
      code: invoiceCode,
      date: new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: totalAmount,
      status: 'draft',
      clientName,
      clientEmail,
      description: description || '',
      items,
      format: 'PDF',
      userId: req.user.id,
      createdAt: new Date().toISOString()
    };

    // Add to demo array (in real app, save to database)
    demoInvoices.unshift(newInvoice);

    res.status(201).json({
      status: 'success',
      message: 'Invoice created successfully',
      data: {
        invoice: newInvoice
      }
    });

  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while creating invoice'
    });
  }
});

// @route   PUT /api/invoices/:id
// @desc    Update invoice
// @access  Private
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const invoiceIndex = demoInvoices.findIndex(inv => inv.id === req.params.id);

    if (invoiceIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Invoice not found'
      });
    }

    const { 
      clientName, 
      clientEmail, 
      description, 
      items, 
      dueDate, 
      status 
    } = req.body;

    // Recalculate amount if items are updated
    let amount = demoInvoices[invoiceIndex].amount;
    if (items && Array.isArray(items)) {
      amount = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    }

    // Update invoice
    const updatedInvoice = {
      ...demoInvoices[invoiceIndex],
      clientName: clientName || demoInvoices[invoiceIndex].clientName,
      clientEmail: clientEmail || demoInvoices[invoiceIndex].clientEmail,
      description: description !== undefined ? description : demoInvoices[invoiceIndex].description,
      items: items || demoInvoices[invoiceIndex].items,
      dueDate: dueDate || demoInvoices[invoiceIndex].dueDate,
      status: status || demoInvoices[invoiceIndex].status,
      amount,
      updatedAt: new Date().toISOString()
    };

    demoInvoices[invoiceIndex] = updatedInvoice;

    res.json({
      status: 'success',
      message: 'Invoice updated successfully',
      data: {
        invoice: updatedInvoice
      }
    });

  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating invoice'
    });
  }
});

// @route   DELETE /api/invoices/:id
// @desc    Delete invoice
// @access  Private
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const invoiceIndex = demoInvoices.findIndex(inv => inv.id === req.params.id);

    if (invoiceIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Invoice not found'
      });
    }

    // Remove invoice from array
    demoInvoices.splice(invoiceIndex, 1);

    res.json({
      status: 'success',
      message: 'Invoice deleted successfully'
    });

  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while deleting invoice'
    });
  }
});

// @route   GET /api/invoices/stats/summary
// @desc    Get invoice statistics
// @access  Private
router.get('/stats/summary', authenticateToken, (req, res) => {
  try {
    const totalInvoices = demoInvoices.length;
    const paidInvoices = demoInvoices.filter(inv => inv.status === 'paid').length;
    const pendingInvoices = demoInvoices.filter(inv => inv.status === 'pending').length;
    const overdueInvoices = demoInvoices.filter(inv => inv.status === 'overdue').length;
    const draftInvoices = demoInvoices.filter(inv => inv.status === 'draft').length;

    const totalAmount = demoInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidAmount = demoInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
    const pendingAmount = demoInvoices
      .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.amount, 0);

    res.json({
      status: 'success',
      data: {
        summary: {
          totalInvoices,
          paidInvoices,
          pendingInvoices,
          overdueInvoices,
          draftInvoices,
          totalAmount,
          paidAmount,
          pendingAmount
        }
      }
    });

  } catch (error) {
    console.error('Get invoice stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching invoice statistics'
    });
  }
});

module.exports = router;
