'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Home() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-20 bg-black/80 backdrop-blur border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xl font-bold tracking-wide">SnapIntel Web</span>
          <span className="text-xs text-neutral-400">OSINT Snapchat Tool</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div>
            <h1 className="text-4xl font-bold mb-2">Analyse un compte Snapchat</h1>
            <p className="text-neutral-400 text-sm">
              Entre un username pour récupérer stories, highlights, spotlights, lenses
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="snap_username"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white/80 transition-colors"
            />
            
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 32px rgba(255,255,255,0.15)' }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              type="submit"
              className="relative inline-flex items-center justify-center px-8 py-3 rounded-full bg-white text-black text-sm font-semibold overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && (
                <span className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/5 animate-pulse" />
              )}
              <span className="relative z-10">
                {loading ? 'Analyse en cours...' : "Lancer l'OSINT"}
              </span>
            </motion.button>
          </form>
        </motion.section>

        {(result || error) && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold">Résultats</h2>

            {error && (
              <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 text-red-400 text-sm">
                {error}
              </div>
            )}

            {result && (
              <div className="grid gap-4">
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-3">
                  <h3 className="text-lg font-semibold">Compte</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-neutral-400">Username:</span> {result.username}</p>
                    <p><span className="text-neutral-400">Display Name:</span> {result.displayName}</p>
                    <p><span className="text-neutral-400">Status:</span> {result.accountType === 'public_profile' ? 'Public ✓' : result.accountType === 'mixed_public' ? 'Public partiel 🔓' : 'Privé 🔒'}</p>
                    {result.subscriberCount && (
                      <p><span className="text-neutral-400">Abonnés:</span> {result.subscriberCount.toLocaleString()}</p>
                    )}
                    {result.bio && (
                      <p><span className="text-neutral-400">Bio:</span> {result.bio}</p>
                    )}
                  </div>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Statistiques</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Stories', value: result.stats.stories },
                      { label: 'Highlights', value: result.stats.highlights },
                      { label: 'Spotlights', value: result.stats.spotlights },
                      { label: 'Lenses', value: result.stats.lenses },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-black/50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-neutral-400 mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.section>
        )}
      </main>
    </div>
  );
}
