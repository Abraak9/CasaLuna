'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewEventPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', description: '',
    slug: '', date: '', end_date: '',
    location_name: '', location_address: '', location_city: '',
    cover_image_url: '', checkin_pin: '', max_capacity: '',
    status: 'draft',
  });

  const set = (field: string, value: string) => {
    setForm(f => {
      const next = { ...f, [field]: value };
      if (field === 'name') {
        next.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const res = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name_en: form.name,
        name_es: form.name,
        description_en: form.description,
        description_es: form.description,
        slug: form.slug,
        date: form.date,
        end_date: form.end_date || null,
        location_name: form.location_name,
        location_address: form.location_address,
        location_city: form.location_city,
        cover_image_url: form.cover_image_url,
        checkin_pin: form.checkin_pin,
        max_capacity: form.max_capacity ? Number(form.max_capacity) : null,
        status: form.status,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to create event');
      setSaving(false);
    } else {
      const event = await res.json();
      router.push(`/admin/events/${event.id}/tickets`);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/events" className="text-gray-400 hover:text-gray-600">← Events</Link>
        <h1 className="text-2xl font-bold">New Event</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700">Event Info</h2>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Event Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required
              placeholder="e.g. La Luna Social Night"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">URL Slug *</label>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-pink-400">
              <span className="text-gray-400 text-xs px-3 py-2.5 bg-gray-50 border-r border-gray-200">/event/</span>
              <input value={form.slug} onChange={e => set('slug', e.target.value)} required
                className="flex-1 px-3 py-2.5 text-sm focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4}
              placeholder="Tell attendees what to expect..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 resize-none" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700">Date & Location</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Start date & time *</label>
              <input type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">End date & time</label>
              <input type="datetime-local" value={form.end_date} onChange={e => set('end_date', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Venue name</label>
            <input value={form.location_name} onChange={e => set('location_name', e.target.value)}
              placeholder="e.g. Studio 54"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Address</label>
              <input value={form.location_address} onChange={e => set('location_address', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">City</label>
              <input value={form.location_city} onChange={e => set('location_city', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700">Settings</h2>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Cover Image URL</label>
            <input type="url" value={form.cover_image_url} onChange={e => set('cover_image_url', e.target.value)}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Check-in PIN</label>
              <input value={form.checkin_pin} onChange={e => set('checkin_pin', e.target.value)}
                placeholder="e.g. 1234"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Max capacity</label>
              <input type="number" value={form.max_capacity} onChange={e => set('max_capacity', e.target.value)}
                placeholder="300"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 bg-white">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3">
          <Link href="/admin/events" className="flex-none border border-gray-200 text-gray-600 font-medium py-3 px-5 rounded-xl text-sm">
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="flex-1 cl-gradient text-white font-bold py-3 rounded-xl text-sm disabled:opacity-70">
            {saving ? 'Creating...' : 'Create Event & Add Tickets →'}
          </button>
        </div>
      </form>
    </div>
  );
}
