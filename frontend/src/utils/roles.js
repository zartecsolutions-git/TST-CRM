// Role helpers — single source of truth for who can do what in the UI.
// Backend RBAC is the security boundary; these helpers just hide/show controls.

export const isAdminLike = (role) =>
  role === 'admin' || role === 'super_admin';

// Roles that can create/edit/delete in Customers, Products, Leads,
// Sales Invoices, Payments. Excludes 'employee' (Daily Tasks only) and
// 'support' (read-mostly for these modules).
export const canManageRecords = (role) =>
  role === 'admin' || role === 'super_admin' || role === 'data_entry' || role === 'sales';

// Used for product/customer record edits (data entry has full edit rights
// per the role brief).
export const canEditRecord = (role) =>
  role === 'admin' || role === 'super_admin' || role === 'data_entry';

export const isDataEntry = (role) => role === 'data_entry';
