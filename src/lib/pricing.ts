interface PriceTier {
  valid_until: string;
  price: number;
  sort_order: number;
}

interface TicketType {
  price_scaling: 'fixed' | 'by_date' | 'by_stock';
  base_price: number;
  stock_total: number;
  stock_sold: number;
  price_tiers?: PriceTier[];
}

export function getCurrentPrice(ticket: TicketType): number {
  if (ticket.price_scaling === 'fixed' || !ticket.price_tiers?.length) {
    return Number(ticket.base_price);
  }

  if (ticket.price_scaling === 'by_date') {
    const now = new Date();
    const sorted = [...ticket.price_tiers].sort((a, b) => a.sort_order - b.sort_order);

    for (const tier of sorted) {
      if (now <= new Date(tier.valid_until)) {
        return Number(tier.price);
      }
    }
    // All tiers expired → use base_price as final price
    return Number(ticket.base_price);
  }

  if (ticket.price_scaling === 'by_stock') {
    const sold = ticket.stock_sold;
    const sorted = [...ticket.price_tiers].sort((a, b) => a.sort_order - b.sort_order);

    for (const tier of sorted) {
      if (sold < Number(tier.valid_until)) { // valid_until = threshold count for stock scaling
        return Number(tier.price);
      }
    }
    return Number(ticket.base_price);
  }

  return Number(ticket.base_price);
}

export function isTicketAvailable(ticket: TicketType & {
  available_from?: string | null;
  available_until?: string | null;
  visibility: string;
}): boolean {
  if (ticket.visibility === 'hidden') return false;

  const now = new Date();
  if (ticket.available_from && now < new Date(ticket.available_from)) return false;
  if (ticket.available_until && now > new Date(ticket.available_until)) return false;

  const remaining = ticket.stock_total - ticket.stock_sold;
  return remaining > 0;
}

export function formatPrice(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
