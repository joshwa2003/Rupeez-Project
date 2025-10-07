const express = require('express');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const router = express.Router();

// Import transaction service
const transactionService = require('../services/transactionService');

/**
 * Export transactions to Excel
 * GET /api/export/transactions/excel
 */
router.get('/transactions/excel', async (req, res) => {
  try {
    // Get all transactions from the database
    const transactions = await transactionService.getAllTransactions();

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No transactions found to export'
      });
    }

    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Money Tracker App';
    workbook.lastModifiedBy = 'Money Tracker App';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Add worksheet
    const worksheet = workbook.addWorksheet('Expense Categories', {
      properties: { tabColor: { argb: 'FF4287CA' } }
    });

    // Define columns
    worksheet.columns = [
      { header: 'Transaction ID', key: 'id', width: 25 },
      { header: 'Type', key: 'type', width: 10 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Payment Method', key: 'paymentMethod', width: 20 },
      { header: 'Notes', key: 'notes', width: 40 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4287CA' }
    };
    worksheet.getRow(1).font.color = { argb: 'FFFFFFFF' };

    // Add data rows
    transactions.forEach((transaction, index) => {
      const row = worksheet.addRow({
        id: transaction.id,
        type: transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
        amount: parseFloat(transaction.amount),
        category: transaction.category,
        date: new Date(transaction.date).toLocaleDateString(),
        paymentMethod: transaction.paymentMethod || 'N/A',
        notes: transaction.notes || 'N/A'
      });

      // Alternate row colors
      if (index % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' }
        };
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=expense_categories.xlsx');

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error exporting to Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export Excel file',
      error: error.message
    });
  }
});

/**
 * Export transactions to PDF
 * GET /api/export/transactions/pdf
 */
router.get('/transactions/pdf', async (req, res) => {
  try {
    // Get all transactions from the database
    const transactions = await transactionService.getAllTransactions();

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No transactions found to export'
      });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=expense_categories.pdf');

    // Pipe PDF to response
    doc.pipe(res);

    // Add title
    doc.fontSize(20).text('Expense Categories Report', { align: 'center' });
    doc.moveDown(2);

    // Add report generation info
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Calculate summary statistics
    const totalTransactions = transactions.length;
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Add summary
    doc.fontSize(12).text(`Total Transactions: ${totalTransactions}`, { align: 'left' });
    doc.text(`Total Income: $${totalIncome.toFixed(2)}`, { align: 'left' });
    doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`, { align: 'left' });
    doc.moveDown(2);

    // Prepare table data
    const tableData = transactions.map(transaction => [
      transaction.id,
      transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
      `$${parseFloat(transaction.amount).toFixed(2)}`,
      transaction.category,
      new Date(transaction.date).toLocaleDateString(),
      transaction.paymentMethod || 'N/A'
    ]);

    // Define table headers
    const headers = ['Transaction ID', 'Type', 'Amount', 'Category', 'Date', 'Payment Method'];

    // Draw table
    let yPosition = doc.y;
    const rowHeight = 25;
    const colWidths = [120, 60, 80, 100, 80, 100];

    // Draw headers
    doc.font('Helvetica-Bold');
    headers.forEach((header, i) => {
      doc.rect(50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), yPosition, colWidths[i], rowHeight)
         .fillAndStroke('#4287CA', '#000000');
      doc.fillColor('white').text(header, 55 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), yPosition + 8);
    });

    yPosition += rowHeight;

    // Draw data rows
    doc.font('Helvetica');
    tableData.forEach((row, rowIndex) => {
      // Alternate row colors
      if (rowIndex % 2 === 0) {
        doc.rect(50, yPosition, colWidths.reduce((a, b) => a + b, 0), rowHeight)
           .fill('#f5f5f5');
      }

      row.forEach((cell, colIndex) => {
        const x = 55 + colWidths.slice(0, colIndex).reduce((a, b) => a + b, 0);
        doc.fillColor('black').text(cell.toString(), x, yPosition + 8);
      });

      yPosition += rowHeight;
    });

    // Add page break if needed
    if (yPosition > 700) {
      doc.addPage();
    }

    // Add footer
    doc.fontSize(8).text('Generated by Money Tracker App', { align: 'center' });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error exporting to PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export PDF file',
      error: error.message
    });
  }
});

/**
 * Get export summary statistics
 * GET /api/export/transactions/summary
 */
router.get('/transactions/summary', async (req, res) => {
  try {
    const transactions = await transactionService.getAllTransactions();

    const summary = {
      totalTransactions: transactions.length,
      totalIncome: transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0),
      totalExpenses: transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0),
      netAmount: transactions
        .reduce((sum, t) => sum + (t.type === 'income' ? parseFloat(t.amount) : -parseFloat(t.amount)), 0),
      categories: [...new Set(transactions.map(t => t.category))],
      dateRange: {
        earliest: transactions.length > 0 ? new Date(Math.min(...transactions.map(t => new Date(t.date)))).toISOString().split('T')[0] : null,
        latest: transactions.length > 0 ? new Date(Math.max(...transactions.map(t => new Date(t.date)))).toISOString().split('T')[0] : null
      }
    };

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error getting export summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get export summary',
      error: error.message
    });
  }
});

module.exports = router;
