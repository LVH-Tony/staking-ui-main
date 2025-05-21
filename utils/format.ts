export const formatNumber = (
  num: number | string | null | undefined,
  decimals: number = 2,
): string => {
  if (num === null || num === undefined) return "0";

  // Convert string to number if needed
  const number = typeof num === "string" ? parseFloat(num) : num;

  // Check if it's a valid number
  if (isNaN(number)) return "0";

  const parts = number.toFixed(decimals).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join('.');
};

export const formatTaoValue = (
  value: number | string | null | undefined,
): string => {
  if (value === null || value === undefined) return "0";

  // Convert string to number if needed
  const number = typeof value === "string" ? parseFloat(value) : value;

  // Check if it's a valid number
  if (isNaN(number)) return "0";

  return formatNumber(number);
};

export const formatAlphaValue = (
  value: number | string | null | undefined,
): string => {
  if (value === null || value === undefined) return "0";

  // Convert string to number if needed
  const number = typeof value === "string" ? parseFloat(value) : value;

  // Check if it's a valid number
  if (isNaN(number)) return "0";

  // Format large numbers with commas and 2 decimal places
  return number.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatAlphaPrice = (
  value: number | string | null | undefined,
): string => {
  if (value === null || value === undefined) return "0";

  // Convert string to number if needed
  const number = typeof value === "string" ? parseFloat(value) : value;

  // Check if it's a valid number
  if (isNaN(number)) return "0";

  if (number === 0) return "0";
  if (number < 0.000001) return number.toExponential(6);
  return number.toFixed(6);
};

export const formatTransactionCount = (
  num: number | string | null | undefined,
): string => {
  if (num === null || num === undefined) return "0";

  // Convert string to number if needed
  const number = typeof num === "string" ? parseFloat(num) : num;

  // Check if it's a valid number
  if (isNaN(number)) return "0";

  return Math.round(number).toLocaleString("en-US");
};
