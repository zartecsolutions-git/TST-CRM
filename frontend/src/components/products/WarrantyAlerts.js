import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const WarrantyAlerts = ({ products, formatAmount }) => {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Find products with expiring warranties
  const expiringWarranties = [];
  const expiredWarranties = [];

  products.forEach(product => {
    if (product.serial_numbers && product.serial_numbers.length > 0) {
      product.serial_numbers.forEach(serial => {
        if (serial.customer_warranty_end_date) {
          const warrantyEndDate = new Date(serial.customer_warranty_end_date);
          
          if (warrantyEndDate < today) {
            expiredWarranties.push({
              productName: product.name,
              serialNumber: serial.serial_number,
              warrantyEndDate: warrantyEndDate,
              daysAgo: Math.floor((today - warrantyEndDate) / (1000 * 60 * 60 * 24))
            });
          } else if (warrantyEndDate <= thirtyDaysFromNow) {
            expiringWarranties.push({
              productName: product.name,
              serialNumber: serial.serial_number,
              warrantyEndDate: warrantyEndDate,
              daysRemaining: Math.floor((warrantyEndDate - today) / (1000 * 60 * 60 * 24))
            });
          }
        }
      });
    }
  });

  if (expiringWarranties.length === 0 && expiredWarranties.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-3">
      {expiredWarranties.length > 0 && (
        <Alert variant="destructive" className="bg-red-50 border-red-300">
          <AlertTitle className="text-red-800 font-bold flex items-center">
            ⚠️ Expired Warranties ({expiredWarranties.length})
          </AlertTitle>
          <AlertDescription className="text-red-700">
            <div className="mt-2 space-y-1">
              {expiredWarranties.slice(0, 3).map((item, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium">{item.productName}</span> 
                  {' '}- SN: {item.serialNumber}
                  {' '}- Expired {item.daysAgo} days ago
                </div>
              ))}
              {expiredWarranties.length > 3 && (
                <div className="text-xs mt-1">
                  ... and {expiredWarranties.length - 3} more
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {expiringWarranties.length > 0 && (
        <Alert className="bg-amber-50 border-amber-300">
          <AlertTitle className="text-amber-800 font-bold flex items-center">
            ⏰ Warranties Expiring Soon ({expiringWarranties.length})
          </AlertTitle>
          <AlertDescription className="text-amber-700">
            <div className="mt-2 space-y-1">
              {expiringWarranties.slice(0, 3).map((item, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium">{item.productName}</span> 
                  {' '}- SN: {item.serialNumber}
                  {' '}- {item.daysRemaining} days remaining
                </div>
              ))}
              {expiringWarranties.length > 3 && (
                <div className="text-xs mt-1">
                  ... and {expiringWarranties.length - 3} more
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default WarrantyAlerts;
