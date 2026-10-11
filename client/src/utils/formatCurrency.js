/**
 * Format an integer or float amount into Indian Rupee (INR - ₹) representation
 * Example: 5000 -> ₹5,000, 100000 -> ₹1,00,000
 */
export const formatINR = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};
