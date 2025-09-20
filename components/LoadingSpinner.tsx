import React from 'react';

interface LoadingSpinnerProps {
  message: { text: string; duration: number };
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <div className="text-center">
      <svg
        className="animate-spin h-12 w-12 text-green-600 mx-auto"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">
        AI is searching the web for the latest data...
      </p>
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 h-24 flex items-center justify-center p-2">
        <p key={message.text} className="animate-fade-in-out max-w-md" style={{ animationDuration: `${message.duration}ms` }}>
          {message.text}
        </p>
      </div>
    </div>
  );
};