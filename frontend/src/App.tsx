import { useEffect, useState } from 'react';
import ListingCard from './components/ListingCard';
import ChatWidget from './components/ChatWidget';

export default function App() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await fetch('http://localhost:4000/api/listings');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setListings(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error('Failed to fetch listings:', err);
        setError('Could not load listings. Please try again later.');
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
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : listings.length === 0 ? (
        <p>No listings found.</p>
      ) : (
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
      )}

      {/* AI Chat Widget at bottom-right */}
      <ChatWidget darkMode={darkMode} />
    </div>
  );
}
