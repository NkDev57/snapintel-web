'use client';

import { useState } from 'react';
import AnimatedButton from './AnimatedButton';

interface SearchBarProps {
  onSearch: (username: string) => void;
  placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder = 'Enter Snapchat username...' }: SearchBarProps) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onSearch(username.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl animate-slide-up">
      <div className="flex gap-4">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-6 py-4 bg-secondary text-primary border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
        />
        <AnimatedButton type="submit" variant="primary">
          Search
        </AnimatedButton>
      </div>
    </form>
  );
}
