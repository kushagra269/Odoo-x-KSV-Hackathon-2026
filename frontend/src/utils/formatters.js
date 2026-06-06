export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

export const formatCompactCurrency = (value) => {
  const amount = Number(value ?? 0);

  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(1)}L`;
  }

  return formatCurrency(amount);
};

export const formatDate = (value, options = {}) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(new Date(value));

export const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase())
    .join("");
