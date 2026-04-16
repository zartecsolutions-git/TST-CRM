"""
CSV export utility functions
"""
import csv
import io
from datetime import datetime, timezone
from typing import Dict, List, Any
from utils.datetime_helpers import format_date_for_display, parse_iso_to_datetime


def calculate_warranty_status(warranty_end_date: Any, current_time: datetime) -> str:
    """Calculate warranty status based on end date"""
    if not warranty_end_date:
        return 'N/A'
    
    warranty_date = parse_iso_to_datetime(warranty_end_date)
    if not warranty_date:
        return 'N/A'
    
    return 'Active' if warranty_date > current_time else 'Expired'


def format_serial_for_csv(
    product: Dict[str, Any],
    serial: Dict[str, Any],
    customer_map: Dict[str, str],
    current_time: datetime
) -> Dict[str, str]:
    """
    Format a product serial number entry for CSV export
    
    Args:
        product: Product document
        serial: Serial number object
        customer_map: Mapping of customer IDs to names
        current_time: Current UTC time
    
    Returns:
        Dictionary with formatted CSV row data
    """
    # Get customer name
    customer_name = customer_map.get(serial.get('customer_id'), 'Unassigned')
    
    # Calculate warranty status and format end date
    warranty_end_date = serial.get('customer_warranty_end_date')
    warranty_status = calculate_warranty_status(warranty_end_date, current_time)
    warranty_end_formatted = format_date_for_display(warranty_end_date)
    
    # Format dates
    sales_date = format_date_for_display(serial.get('sales_date'))
    purchase_date = format_date_for_display(serial.get('purchase_date'))
    
    # Next maintenance date (from serial or product level)
    next_maintenance = serial.get('next_maintenance_date') or product.get('next_maintenance_date')
    next_maintenance_formatted = format_date_for_display(next_maintenance)
    
    return {
        'Product Name': product.get('name', ''),
        'Category': product.get('category', ''),
        'Model': product.get('model', ''),
        'Serial Number': serial.get('serial_number', ''),
        'Customer': customer_name,
        'Warranty Period (Months)': serial.get('warranty_period_months', 0),
        'Warranty End Date': warranty_end_formatted,
        'Warranty Status': warranty_status,
        'Next Maintenance Date': next_maintenance_formatted,
        'License Code': serial.get('license_code', ''),
        'Sales Date': sales_date,
        'Purchase Date': purchase_date
    }


def export_products_to_csv(
    products: List[Dict[str, Any]],
    customer_map: Dict[str, str]
) -> str:
    """
    Export products with serial numbers to CSV format
    
    Args:
        products: List of product documents
        customer_map: Mapping of customer IDs to names
    
    Returns:
        CSV content as string
    """
    output = io.StringIO()
    fieldnames = [
        'Product Name', 'Category', 'Model', 'Serial Number', 'Customer',
        'Warranty Period (Months)', 'Warranty End Date', 'Warranty Status',
        'Next Maintenance Date', 'License Code', 'Sales Date', 'Purchase Date'
    ]
    
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    current_time = datetime.now(timezone.utc)
    
    for product in products:
        serial_numbers = product.get('serial_numbers', [])
        
        if serial_numbers:
            # Export each serial number as a separate row
            for serial in serial_numbers:
                row_data = format_serial_for_csv(product, serial, customer_map, current_time)
                writer.writerow(row_data)
        else:
            # Product without serial numbers - export basic info
            writer.writerow({
                'Product Name': product.get('name', ''),
                'Category': product.get('category', ''),
                'Model': product.get('model', ''),
                'Serial Number': '',
                'Customer': 'Unassigned',
                'Warranty Period (Months)': 0,
                'Warranty End Date': '',
                'Warranty Status': 'N/A',
                'Next Maintenance Date': format_date_for_display(product.get('next_maintenance_date')),
                'License Code': '',
                'Sales Date': '',
                'Purchase Date': format_date_for_display(product.get('purchase_date'))
            })
    
    return output.getvalue()
