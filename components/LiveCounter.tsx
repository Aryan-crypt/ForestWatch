import React, { useState, useEffect } from 'react';

// Based on 2023 WRI data: 3.7 million hectares of tropical primary forest loss.
// 3,700,000 hectares / 365 days / 24 hours / 60 mins / 60 secs = ~0.117 hectares per second.
const HECTARES_PER_SECOND = 0.117;

export const LiveCounter: React.FC = () => {
  const [hectaresLost, setHectaresLost] = useState(0);

  useEffect(() => {
    // Calculate initial loss since the beginning of the current year for a more realistic counter
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const secondsSinceYearStart = (now.getTime() - startOfYear.getTime()) / 1000;
    const initialHectaresLost = secondsSinceYearStart * HECTARES_PER_SECOND;
    
    setHectaresLost(initialHectaresLost);

    const interval = setInterval(() => {
      setHectaresLost(prevHectares => prevHectares + HECTARES_PER_SECOND);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-12 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg max-w-sm mx-auto animate-fade-in">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Estimated Global Primary Forest Lost This Year
        </p>
        <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {hectaresLost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Hectares
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Based on average rates from recent global satellite data.
        </p>
    </div>
  );
};