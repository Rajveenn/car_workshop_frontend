// File: lib/utils.ts
export function formatCurrency(value: number): string {
    return `RM ${value.toFixed(2)}`;
  }
  
  export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
  