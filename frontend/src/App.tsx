import { useEffect, useState } from 'react';
import ListingCard from './components/ListingCard';
import type { Listing } from './components/ListingCard';
import ChatWidget from './components/ChatWidget';
import { API_BASE_URL } from './config';
import { fallbackListings } from './data/fallbackListings';

export default function App() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [usingFallbackData, setUsingFallbackData] = useState(false);

  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/listings`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('No listings returned');
        }
        setListings(data);
        setUsingFallbackData(false);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('Using showcase listings because the API is unavailable:', err);
        }
        setListings(fallbackListings);
        setUsingFallbackData(true);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, []);

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        backgroundColor: darkMode ? '#121212' : '#f9f9f9',
        minHeight: '100vh',
        color: darkMode ? '#fff' : '#000',
        padding: '2rem',
        position: 'relative',
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <h1>Blacksburg Apartments</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: darkMode ? '#fff' : '#333',
            color: darkMode ? '#000' : '#fff',
          }}
        >
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </header>

      {loading ? (
        <p>Loading listings...</p>
      ) : listings.length === 0 ? (
        <p>No listings found.</p>
      ) : (
        <>
          {usingFallbackData && (
            <p
              style={{
                margin: '0 0 1rem',
                color: darkMode ? '#c8d1dc' : '#5f6368',
                maxWidth: '760px',
              }}
            >
              Showcase mode: sample listings are loaded locally for this public demo.
            </p>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
            }}
          >
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} darkMode={darkMode} />
            ))}
          </div>
        </>
      )}

      {/* AI Chat Widget at bottom-right */}
      <ChatWidget darkMode={darkMode} />
    </div>
  );
}
