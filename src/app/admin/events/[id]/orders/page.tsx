'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface OrderItem {
  ticket_name: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: string;
  email: string;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  paid_at: string;
  items: OrderItem[];
  attendee_count: number;
  checked_in_count: number;
}

export default function OrdersPage() {
  const { id } = useParams<{ id: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('paid');

  useEffect(() => {
    fetch(`/api/admin/events/${id}/orders`)
      .then(r => r.json())
      .then(setOrders);
  }, [id]);

  const filtered = orders.filter(o => filter === 'all' || o.status === filter);

  const statusColors: Record<string, string> = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-600',
    refunded: 'bg-gray-100 text-gray-600',
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/events" className="text-gray-400 hover:text-gray-600">← Events</Link>
        <h1 className="text-2xl font-bold">Orders</h1>
      </div>

      <div className="flex gap-2 mb-4">
        {['all', 'paid', 'pending', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors
              ${filter === f ? 'cl-gradient text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
            {f}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400 self-center">{filtered.length} orders</span>
      </div>

      <div className="space-y-3">
        {filtered.map(order => (
          <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-gray-400">#{order.id.slice(0, 8).toUpperCase()}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-500'}`}>
                    {order.status}
                  </span>
                </div>
                <p className="font-medium text-sm">{order.email}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {order.items?.map(i => `${i.ticket_name} ×${i.quantity}`).join(', ')}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(order.created_at).toLocaleString('en-GB')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">€{Number(order.total_amount).toFixed(0)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {order.checked_in_count}/{order.attendee_count} checked in
                </p>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
            No orders found
          </div>
        )}
      </div>
    </div>
  );
}
