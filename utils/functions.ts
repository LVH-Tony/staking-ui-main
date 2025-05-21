export const truncateAddress = (address: string, letterToShow = 4) => {
  if (!address) return "";
  const first = address.slice(0, letterToShow);
  const last = address.slice(-letterToShow);
  return `${first}...${last}`;
};

export const formatBalance = (balance: number | undefined | null) => {
  if (balance === undefined || balance === null) return "0.00";
  return balance.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export function parseFixedU128(
  input: string | number | { bits: string },
): number {
  let hexString: string;

  // Handle object input with bits property
  if (typeof input === "object" && input !== null && "bits" in input) {
    hexString = input.bits;
  }
  // Handle numeric input
  else if (typeof input === "number") {
    // Convert number to hex string
    hexString = input.toString(16);
  }
  // Handle string input
  else if (typeof input === "string") {
    hexString = input;
  }
  // Handle other invalid types
  else {
    console.error("parseFixedU128: Invalid input type", input);
    return 0;
  }

  // Ensure hexString is now a string (even if derived from number/object)
  if (typeof hexString !== "string") {
    console.error("parseFixedU128: Failed to convert input to string", input);
    return 0;
  }

  // Remove '0x' prefix and ensure it's 16 bytes (128 bits)
  hexString = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
  hexString = hexString.padStart(32, "0");

  // Split into two 64-bit parts
  const highBits = Number(BigInt("0x" + hexString.slice(0, 16))); // First 64 bits as u64
  const lowBits = BigInt("0x" + hexString.slice(16)); // Last 64 bits as u64

  // Convert to float by dividing the lower 64 bits by the max value of u64
  const u64Max = BigInt(2) ** BigInt(64) - BigInt(1);

  const lb_val = Number(lowBits) / Number(u64Max);

  return Number(highBits + lb_val);
}
