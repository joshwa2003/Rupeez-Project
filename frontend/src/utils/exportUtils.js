import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

/**
 * Export transaction data to Excel format
 * @param {Array} transactions - Array of transaction objects
 * @param {string} filename - Name of the exported file (without extension)
 */
export const exportToExcel = (transactions, filename = 'expense_categories') => {
  try {
    // Prepare data for Excel export
    const exportData = transactions.map(transaction => ({
      'Transaction ID': transaction.id,
      'Type': transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
      'Amount': parseFloat(transaction.amount),
      'Category': transaction.category,
      'Date': new Date(transaction.date).toLocaleDateString(),
      'Payment Method': transaction.paymentMethod || 'N/A',
      'Notes': transaction.notes || 'N/A'
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const columnWidths = [
      { wch: 20 }, // Transaction ID
      { wch: 10 }, // Type
      { wch: 12 }, // Amount
      { wch: 15 }, // Category
      { wch: 12 }, // Date
      { wch: 15 }, // Payment Method
      { wch: 30 }  // Notes
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expense Categories');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Download file
    saveAs(blob, `${filename}.xlsx`);

    return { success: true, message: 'Excel file exported successfully' };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return { success: false, message: 'Failed to export Excel file' };
  }
};

/**
 * Export transaction data to PDF format
 * @param {Array} transactions - Array of transaction objects
 * @param {string} filename - Name of the exported file (without extension)
 */
export const exportToPDF = (transactions, filename = 'expense_categories', options = {}) => {
  try {
    // Create new PDF document
    const pdf = new jsPDF();

    // Add title
    pdf.setFontSize(20);
    const title = options.title || 'Expense Categories Report';
    pdf.text(title, 20, 30);

    // Add report generation date
    pdf.setFontSize(10);
    if (options.subtitle) {
      pdf.text(options.subtitle, 20, 38);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 46);
    } else {
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 40);
    }

    // Prepare table data
    const tableData = transactions.map(transaction => [
      transaction.id,
      transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
      `$${parseFloat(transaction.amount).toFixed(2)}`,
      transaction.category,
      new Date(transaction.date).toLocaleDateString(),
      transaction.paymentMethod || 'N/A'
    ]);

    // Add summary statistics
    const totalTransactions = transactions.length;
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    pdf.setFontSize(12);
    pdf.text(`Total Transactions: ${totalTransactions}`, 20, 50);
    pdf.text(`Total Income: $${totalIncome.toFixed(2)}`, 20, 60);
    pdf.text(`Total Expenses: $${totalExpenses.toFixed(2)}`, 20, 70);

    // Define table columns
    const columns = [
      { header: 'Transaction ID', dataKey: 'id' },
      { header: 'Type', dataKey: 'type' },
      { header: 'Amount', dataKey: 'amount' },
      { header: 'Category', dataKey: 'category' },
      { header: 'Date', dataKey: 'date' },
      { header: 'Payment Method', dataKey: 'payment' }
    ];

    // Add table to PDF using autoTable plugin
    autoTable(pdf, {
      columns: columns,
      body: tableData,
      startY: options.subtitle ? 86 : 80,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [66, 139, 202], // Blue header
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245], // Light gray for alternate rows
      },
      margin: { top: options.subtitle ? 86 : 80 },
    });

    // Save PDF
    pdf.save(`${filename}.pdf`);

    return { success: true, message: 'PDF file exported successfully' };
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return { success: false, message: 'Failed to export PDF file' };
  }
};

/**
 * Format transaction data for export
 * @param {Array} transactions - Array of transaction objects
 * @returns {Array} Formatted transaction data
 */
export const formatTransactionData = (transactions) => {
  return transactions.map(transaction => ({
    id: transaction.id,
    type: transaction.type,
    amount: parseFloat(transaction.amount),
    category: transaction.category,
    date: transaction.date,
    paymentMethod: transaction.paymentMethod || 'N/A',
    notes: transaction.notes || 'N/A'
  }));
};

/**
 * Get export summary statistics
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Summary statistics
 */
export const getExportSummary = (transactions) => {
  const totalTransactions = transactions.length;
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return {
    totalTransactions,
    totalIncome,
    totalExpenses,
    netAmount: totalIncome - totalExpenses
  };
};
