
import React from 'react';

interface SearchBarProps {
  forestName: string;
  setForestName: (name: string) => void;
  onSearch: () => void;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ forestName, setForestName, onSearch, isLoading }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="w-full">
      <div className="relative">
        <input
          type="search"
          value={forestName}
          onChange={(e) => setForestName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., Amazon Rainforest, Congo Forest..."
          className="block w-full p-4 pl-6 text-md text-gray-900 border border-gray-300 rounded-full bg-gray-50 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500 transition-shadow duration-200"
          disabled={isLoading}
        />
        <button
          onClick={onSearch}
          disabled={isLoading}
          className="text-white absolute right-2.5 bottom-2.5 bg-green-600 hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-full text-sm px-6 py-2 dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
    </div>
  );
};
