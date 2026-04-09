import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const ExcelImport = ({ onImport, onClose }) => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState('');
  const [editableData, setEditableData] = useState([]);

  // Download Excel Template
  const downloadTemplate = () => {
    const template = [
      {
        'Invoice Number': 'INV-2026-001',
        'Invoice Date': '2026-04-09',
        'Customer Name': 'Customer ABC',
        'Product Name': 'Product XYZ',
        'Division': 'Industrial',
        'Category': 'CIJ',
        'Brand': 'Leadtech',
        'Model': 'LT800',
        'Quantity': 5,
        'Unit Price': 100
      },
      {
        'Invoice Number': 'INV-2026-001',
        'Invoice Date': '2026-04-09',
        'Customer Name': 'Customer ABC',
        'Product Name': 'Another Product',
        'Division': 'Retail',
        'Category': 'POS',
        'Brand': 'Brand X',
        'Model': '',
        'Quantity': 10,
        'Unit Price': 50
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
    
    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 25 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 10 }, { wch: 12 }
    ];
    
    XLSX.writeFile(wb, 'Sales_Invoice_Template.xlsx');
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        console.log('=== EXCEL FILE DEBUG ===');
        console.log('Workbook sheet names:', workbook.SheetNames);
        
        const sheetName = workbook.SheetNames[0];
        console.log('Reading sheet:', sheetName);
        
        const worksheet = workbook.Sheets[sheetName];
        console.log('Worksheet range:', worksheet['!ref']);
        
        // Try different parsing options
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        console.log('Parsed rows count:', jsonData.length);
        
        if (jsonData.length > 0) {
          console.log('First row keys:', Object.keys(jsonData[0]));
          console.log('First row values:', jsonData[0]);
          console.log('Second row (if exists):', jsonData[1]);
          console.log('Third row (if exists):', jsonData[2]);
        } else {
          // Try alternative parsing without headers
          const jsonDataNoHeaders = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          console.log('Raw data (no headers):', jsonDataNoHeaders.slice(0, 5));
        }

        if (jsonData.length === 0) {
          setError('Excel file appears empty or could not be parsed. Check console for details.');
          return;
        }

        // Parse and group by invoice number
        const groupedInvoices = parseExcelData(jsonData);
        setPreviewData(groupedInvoices);
        setEditableData(JSON.parse(JSON.stringify(groupedInvoices))); // Deep copy
      } catch (err) {
        console.error('Excel parsing error:', err);
        setError('Error parsing Excel file: ' + err.message);
      }
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  // Parse Excel data and group by invoice
  const parseExcelData = (data) => {
    const invoiceMap = new Map();
    const skippedRows = [];
    const warnings = [];

    console.log('Starting parse - Total rows:', data.length);
    console.log('First row columns:', data[0] ? Object.keys(data[0]) : 'No data');

    data.forEach((row, index) => {
      // Debug: Show first few rows
      if (index < 3) {
        console.log(`Row ${index + 2} raw data:`, row);
      }

      // Flexible column name matching (case-insensitive)
      const getColumnValue = (possibleNames) => {
        for (const name of possibleNames) {
          const key = Object.keys(row).find(k => {
            const normalizedKey = k.toLowerCase().replace(/\s+/g, '').replace(/[_-]/g, '');
            const normalizedName = name.toLowerCase().replace(/\s+/g, '').replace(/[_-]/g, '');
            return normalizedKey.includes(normalizedName) || normalizedName.includes(normalizedKey);
          });
          if (key !== undefined) {
            const value = row[key];
            // Handle various empty values
            if (value !== null && value !== undefined && value !== '' && value !== ' ') {
              return String(value).trim();
            }
          }
        }
        return '';
      };

      // Map user's columns to our fields
      let invoiceNum = getColumnValue(['INV NUMBER', 'INVNUMBER', 'Invoice Number', 'invoice_number', 'InvoiceNumber']);
      const dateValue = getColumnValue(['DATE', 'Invoice Date', 'invoice_date', 'InvoiceDate']);
      const date = dateValue || new Date().toISOString().split('T')[0];
      let customer = getColumnValue(['CUSTOMER NAME', 'Customer Name', 'customer_name', 'Customer', 'CustomerName']);
      const product = getColumnValue(['ITEM DETAILS', 'Product Name', 'product_name', 'Item', 'Product', 'ItemDetails']);
      const division = getColumnValue(['Division', 'division', 'DIV']);
      const categoryValue = getColumnValue(['Category', 'Prodcut Category', 'Product Category', 'category', 'ProductCategory']);
      const brand = getColumnValue(['Brand', 'brand', 'BRAND']);
      const model = getColumnValue(['Model', 'model', 'MODEL']);
      
      // Handle quantity and price
      const quantityStr = getColumnValue(['Qty', 'Quantity', 'quantity', 'QTY', 'Quantity (pieces)']);
      const quantity = parseFloat(quantityStr) || 0;
      
      // Calculate unit price from invoice amount or use direct unit price
      const unitPriceStr = getColumnValue(['Unit Price', 'unit_price', 'Price', 'price', 'UnitPrice']);
      let unitPrice = parseFloat(unitPriceStr) || 0;
      
      const invoiceAmountStr = getColumnValue(['INVOICE AMOUNT', 'Invoice Amount', 'Amount', 'Total Amount', 'InvoiceAmount']);
      const invoiceAmount = parseFloat(invoiceAmountStr) || 0;
      
      // If we have invoice amount but no unit price, calculate it
      if (invoiceAmount > 0 && unitPrice === 0 && quantity > 0) {
        unitPrice = invoiceAmount / quantity;
      }

      // Skip completely empty rows (but be lenient - check for ANY data)
      const allValues = Object.values(row);
      const hasAnyData = allValues.some(v => {
        if (v === null || v === undefined) return false;
        const str = String(v).trim();
        return str !== '' && str !== ' ' && str !== 'null' && str !== 'undefined';
      });
      
      if (!hasAnyData) {
        if (index < 10) console.log(`Row ${index + 2}: Completely empty, skipping`);
        return;
      }
      
      console.log(`Row ${index + 2}: Has data, processing...`);

      // Generate invoice number if missing but has data
      if (!invoiceNum && product) {
        invoiceNum = `AUTO-INV-${Date.now()}-${index}`;
        warnings.push(`Row ${index + 2}: No invoice number, generated ${invoiceNum}`);
      }

      // Use generic customer name if missing
      if (!customer) {
        customer = 'Unknown Customer';
        warnings.push(`Row ${index + 2}: No customer name, using "Unknown Customer"`);
      }

      // Use generic product name if missing (LENIENT - don't skip)
      let productName = product && product.trim() !== '' ? product : 'Unknown Product';
      if (productName === 'Unknown Product') {
        warnings.push(`Row ${index + 2}: No product name, using "Unknown Product"`);
      }

      // Use quantity = 1 if zero or missing (LENIENT - don't skip)
      let finalQuantity = quantity;
      if (quantity <= 0) {
        finalQuantity = 1;
        warnings.push(`Row ${index + 2}: Quantity missing or zero, defaulting to 1`);
      }

      if (!invoiceMap.has(invoiceNum)) {
        invoiceMap.set(invoiceNum, {
          invoice_number: invoiceNum,
          invoice_date: date,
          customer_name: customer,
          items: [],
          validation: { isValid: true, errors: [] }
        });
      }

      const invoice = invoiceMap.get(invoiceNum);
      
      // Validate item
      const itemErrors = [];
      if (unitPrice < 0) itemErrors.push('Unit price cannot be negative');

      invoice.items.push({
        product_name: product,
        division: division || '',
        category: categoryValue || '',
        brand: brand || '',
        model: model || '',
        quantity: quantity,
        unit_price: parseFloat(unitPrice.toFixed(2)),
        total: parseFloat((quantity * unitPrice).toFixed(2)),
        validation: { isValid: itemErrors.length === 0, errors: itemErrors }
      });

      if (invoice.items.some(item => !item.validation.isValid)) {
        invoice.validation.isValid = false;
      }
    });

    console.log('Parse complete - Found invoices:', invoiceMap.size);
    console.log('Warnings:', warnings.length);
    if (warnings.length > 0 && warnings.length <= 20) {
      console.log('All warnings:', warnings);
    } else if (warnings.length > 20) {
      console.log('First 20 warnings:', warnings.slice(0, 20));
    }

    const result = Array.from(invoiceMap.values());
    
    // Show user feedback
    if (result.length === 0) {
      setError(`No data found in Excel file. All rows were empty. Please check that the file has data.`);
    } else if (warnings.length > 0) {
      // Clear error and show as success with warnings
      setError('');
    }

    return result;
  };

  // Handle cell edit
  const handleCellEdit = (invoiceIndex, field, value, itemIndex = null) => {
    const updated = [...editableData];
    
    if (itemIndex !== null) {
      // Editing item field
      updated[invoiceIndex].items[itemIndex][field] = value;
      
      // Recalculate total if quantity or price changed
      if (field === 'quantity' || field === 'unit_price') {
        const item = updated[invoiceIndex].items[itemIndex];
        item.total = parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0);
      }
    } else {
      // Editing invoice header field
      updated[invoiceIndex][field] = value;
    }
    
    setEditableData(updated);
  };

  // Handle import
  const handleImport = () => {
    // Validate all data
    const hasErrors = editableData.some(inv => 
      !inv.validation.isValid || inv.items.some(item => !item.validation.isValid)
    );

    if (hasErrors) {
      setError('Please fix validation errors before importing');
      return;
    }

    onImport(editableData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle>Import Invoices from Excel</CardTitle>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto">
          {!previewData ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <h3 className="font-medium text-blue-900 mb-2">📋 Instructions:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Download the Excel template (optional - you can use your own format too)</li>
                  <li>Fill in your invoice data (multiple rows per invoice supported)</li>
                  <li>Upload the completed file</li>
                  <li>Review and edit data before importing</li>
                </ol>
                <div className="mt-3 p-3 bg-white rounded border border-blue-100">
                  <p className="text-xs font-medium text-blue-900 mb-1">✨ Smart Column Detection:</p>
                  <p className="text-xs text-blue-700">
                    Automatically recognizes columns like: INV NUMBER, INVOICE AMOUNT, ITEM DETAILS, 
                    Qty, CUSTOMER NAME, etc. Unit price calculated from invoice amount if needed.
                  </p>
                </div>
              </div>

              <Button onClick={downloadTemplate} className="bg-green-600 hover:bg-green-700">
                📥 Download Excel Template
              </Button>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-upload"
                />
                <label htmlFor="excel-upload" className="cursor-pointer">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-lg font-medium mb-2">Click to upload Excel file</p>
                  <p className="text-sm text-gray-500">Supports .xlsx and .xls formats</p>
                </label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded">
                <div>
                  <h3 className="font-medium">Preview: {editableData.length} Invoice(s) Found</h3>
                  <p className="text-sm text-gray-600">
                    Review and edit before importing. Click cells to edit.
                  </p>
                </div>
                <div className="space-x-2">
                  <Button onClick={() => setPreviewData(null)} variant="outline">
                    Cancel
                  </Button>
                  <Button onClick={handleImport} className="bg-blue-600 hover:bg-blue-700">
                    Import {editableData.length} Invoice(s)
                  </Button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {editableData.map((invoice, invIndex) => (
                  <div key={invIndex} className="border rounded-lg overflow-hidden">
                    <div className={`p-4 ${invoice.validation.isValid ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="grid grid-cols-3 gap-4 mb-2">
                        <div>
                          <label className="text-xs font-medium text-gray-600">Invoice Number</label>
                          <input
                            type="text"
                            value={invoice.invoice_number}
                            onChange={(e) => handleCellEdit(invIndex, 'invoice_number', e.target.value)}
                            className="w-full p-2 border rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">Date</label>
                          <input
                            type="date"
                            value={invoice.invoice_date}
                            onChange={(e) => handleCellEdit(invIndex, 'invoice_date', e.target.value)}
                            className="w-full p-2 border rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">Customer</label>
                          <input
                            type="text"
                            value={invoice.customer_name}
                            onChange={(e) => handleCellEdit(invIndex, 'customer_name', e.target.value)}
                            className="w-full p-2 border rounded text-sm"
                          />
                        </div>
                      </div>
                      {!invoice.validation.isValid && (
                        <div className="text-xs text-red-600">
                          {invoice.validation.errors.join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="p-2 text-left">Product</th>
                            <th className="p-2 text-left">Division</th>
                            <th className="p-2 text-left">Category</th>
                            <th className="p-2 text-left">Brand</th>
                            <th className="p-2 text-left">Model</th>
                            <th className="p-2 text-right">Qty</th>
                            <th className="p-2 text-right">Price</th>
                            <th className="p-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.items.map((item, itemIndex) => (
                            <tr key={itemIndex} className={!item.validation.isValid ? 'bg-red-50' : ''}>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.product_name}
                                  onChange={(e) => handleCellEdit(invIndex, 'product_name', e.target.value, itemIndex)}
                                  className="w-full p-1 border rounded text-xs"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.division}
                                  onChange={(e) => handleCellEdit(invIndex, 'division', e.target.value, itemIndex)}
                                  className="w-full p-1 border rounded text-xs"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.category}
                                  onChange={(e) => handleCellEdit(invIndex, 'category', e.target.value, itemIndex)}
                                  className="w-full p-1 border rounded text-xs"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.brand}
                                  onChange={(e) => handleCellEdit(invIndex, 'brand', e.target.value, itemIndex)}
                                  className="w-full p-1 border rounded text-xs"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.model}
                                  onChange={(e) => handleCellEdit(invIndex, 'model', e.target.value, itemIndex)}
                                  className="w-full p-1 border rounded text-xs"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleCellEdit(invIndex, 'quantity', parseFloat(e.target.value) || 0, itemIndex)}
                                  className="w-full p-1 border rounded text-xs text-right"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={item.unit_price}
                                  onChange={(e) => handleCellEdit(invIndex, 'unit_price', parseFloat(e.target.value) || 0, itemIndex)}
                                  className="w-full p-1 border rounded text-xs text-right"
                                />
                              </td>
                              <td className="p-2 text-right font-medium">
                                {item.total.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50 font-medium">
                          <tr>
                            <td colSpan="7" className="p-2 text-right">Invoice Total:</td>
                            <td className="p-2 text-right">
                              {invoice.items.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExcelImport;
