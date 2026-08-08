export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a YYYY-MM-DD date string into Indonesian reverse pyramid format: DD MMM YYYY (e.g. 8 Agu 2026)
 * Avoids UTC timezone shifts by parsing year, month, day components directly.
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const clean = dateString.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }
  return dateString;
}

/**
 * Formats a YYYY-MM-DD date string into numeric reverse pyramid format: DD/MM/YYYY (e.g. 08/08/2026)
 */
export function formatDateNumeric(dateString: string): string {
  if (!dateString) return '';
  const clean = dateString.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  return dateString;
}
