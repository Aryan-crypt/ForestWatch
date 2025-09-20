
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h1a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.884 11H10.116M13.884 11H16.116m-10.232 4.143l-1.023.957a.5.5 0 01-.707 0l-1.023-.957M18.116 15.143l1.023.957a.5.5 0 00.707 0l1.023-.957M5.884 7.143l1.023.957a.5.5 0 00.707 0l1.023-.957m6.232 0l1.023.957a.5.5 0 00.707 0l1.023-.957" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                ForestWatch <span className="text-green-600 dark:text-green-400">AI</span>
            </h1>
        </div>
      </div>
    </header>
  );
};