import Link from 'next/link';
import Image from 'next/image';

interface Event {
  id: string;
  slug: string;
  name_en: string;
  name_es: string;
  date: string;
  location_name: string;
  location_city: string;
  cover_image_url: string;
  tickets_sold: number;
}

async function getEvents(): Promise<Event[]> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/events`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function formatEventDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default async function HomePage() {
  const events = await getEvents();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="cl-gradient px-4 pt-10 pb-8 text-white text-center">
        <h1 className="text-3xl font-bold tracking-tight">Casa Luna</h1>
        <p className="mt-1 text-white/80 text-sm">Upcoming Events</p>
      </header>

      {/* Events */}
      <section className="px-4 py-6 max-w-2xl mx-auto">
        {events.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🎭</p>
            <p className="font-medium">No upcoming events</p>
            <p className="text-sm mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Link key={event.id} href={`/event/${event.slug}`} className="block">
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer">
                  {event.cover_image_url ? (
                    <div className="relative h-44 bg-gray-100">
                      <Image
                        src={event.cover_image_url}
                        alt={event.name_en || event.name_es}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-44 cl-gradient flex items-center justify-center">
                      <span className="text-5xl">🎶</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h2 className="font-bold text-lg leading-tight">{event.name_en || event.name_es}</h2>
                    <p className="text-gray-500 text-sm mt-1">📅 {formatEventDate(event.date)}</p>
                    {event.location_name && (
                      <p className="text-gray-500 text-sm">
                        📍 {event.location_name}{event.location_city ? `, ${event.location_city}` : ''}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-400">{event.tickets_sold} tickets sold</span>
                      <span className="cl-gradient text-white text-sm font-semibold px-4 py-1.5 rounded-full">
                        Get Tickets →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="text-center text-xs text-gray-400 pb-8 pt-4">
        © Casa Luna AB · <a href="mailto:info@casaluna.se" className="underline">info@casaluna.se</a>
      </footer>
    </main>
  );
}
