'use client';

import { useEffect, useState } from 'react';

export default function StatsCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (mounted && typeof data.count === 'number') {
          setCount(data.count);
        }
      })
      .catch(err => console.error('Failed to load stats:', err));

    return () => {
      mounted = false;
    };
  }, []);

  if (count === null || count === 0) {
    return null; // hide entirely if no data yet to keep UI clean
  }

  return (
    <div className="stats-counter reveal reveal-delay-4">
      {count} builder{count === 1 ? '' : 's'} framed so far
    </div>
  );
}
