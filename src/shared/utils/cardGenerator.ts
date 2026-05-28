import crypto from 'crypto';

/**
 * Genera un número de tarjeta RC de 16 dígitos único.
 * Prefijo 5890 = Cinépolis Perú (formato propietario, no bancario).
 * Los 11 dígitos restantes son pseudoaleatorios con dígito de control Luhn.
 */
export function generateCardNumber(): string {
  const prefix = '5890';
  const random = crypto.randomInt(10_000_000_000, 99_999_999_999).toString();
  const partial = prefix + random;
  const checkDigit = luhnCheckDigit(partial);
  return partial + checkDigit;
}

function luhnCheckDigit(number: string): string {
  let sum = 0;
  let isEven = true;
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return ((10 - (sum % 10)) % 10).toString();
}

export function formatCardNumber(cardNumber: string): string {
  return cardNumber.replace(/(\d{4})/g, '$1 ').trim();
}

export function validateCardNumber(cardNumber: string): boolean {
  const clean = cardNumber.replace(/\s/g, '');
  if (!/^\d{16}$/.test(clean)) return false;

  let sum = 0;
  let isEven = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}
