export function formatPrice(price: number): string {
  return `${price.toFixed(2)} lei`;
}

export function formatDate(input: string | Date): string {
  const date = input instanceof Date ? input : new Date(input);

  if (isNaN(date.getTime())) {
    return ''; // fallback safe
  }

  return new Intl.DateTimeFormat('ro-RO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatShortDate(input: string | Date): string {
  const date = input instanceof Date ? input : new Date(input);

  if (isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('ro-RO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function generateOrderId(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `SKY${timestamp.slice(-6)}${random}`;
}
