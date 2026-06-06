/**
 * Format a number as Indian currency (INR).
 * e.g. 185000 → "₹1,85,000"
 */
export const formatCurrency = (amount, options = {}) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(num);
};

/**
 * Format a date string or Date object.
 * e.g. "2025-05-21" → "21 May 2025"
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(new Date(date));
};

/**
 * Format a datetime string to readable time.
 * e.g. → "21 May 2025, 10:32 AM"
 */
export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
};

/**
 * Truncate text to a max character count.
 */
export const truncate = (text, max = 60) => {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

/**
 * Get initials from a name.
 * e.g. "Harshal Patel" → "HP"
 */
export const getInitials = (name = '') => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Extract a readable API error message from an Axios error.
 */
export const getApiError = (error) => {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong.'
  );
};

/**
 * Status badge config — maps status strings to colors.
 */
export const STATUS_CONFIG = {
  // Vendor statuses
  active:    { label: 'Active',    color: 'success' },
  pending:   { label: 'Pending',   color: 'warning' },
  blocked:   { label: 'Blocked',   color: 'danger'  },

  // RFQ statuses
  draft:     { label: 'Draft',     color: 'muted'   },
  published: { label: 'Published', color: 'info'    },
  closed:    { label: 'Closed',    color: 'muted'   },
  cancelled: { label: 'Cancelled', color: 'danger'  },

  // Quotation statuses
  submitted: { label: 'Submitted', color: 'info'    },
  selected:  { label: 'Selected',  color: 'success' },
  rejected:  { label: 'Rejected',  color: 'danger'  },

  // Approval statuses
  approved:  { label: 'Approved',  color: 'success' },
  awaiting:  { label: 'Awaiting',  color: 'warning' },

  // Invoice statuses
  pending_payment: { label: 'Pending Payment', color: 'warning' },
  paid:            { label: 'Paid',            color: 'success' },
  overdue:         { label: 'Overdue',         color: 'danger'  },
};
