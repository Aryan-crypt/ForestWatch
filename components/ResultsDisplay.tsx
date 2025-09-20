import React from 'react';
import type { DeforestationData } from '../types';
import { DeforestationStatus } from '../types';
import { DeforestationChart } from './DeforestationChart';

interface ResultsDisplayProps {
  data: DeforestationData;
  onGenerateVisuals: () => void;
  isGeneratingVisuals: boolean;
  visualEvidenceImageUrl: string | null;
  visualsError: string | null;
  onDeepSearch: () => void;
  isDeepSearching: boolean;
  deepSearchResult: string | null;
  deepSearchError: string | null;
  onOpenVisualsModal: (imageUrl: string) => void;
}

const getStatusPillClass = (status: DeforestationStatus): string => {
  switch (status) {
    case DeforestationStatus.SIGNIFICANT:
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
    case DeforestationStatus.MINOR:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
    case DeforestationStatus.STABLE:
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ 
  data,
  onGenerateVisuals,
  isGeneratingVisuals,
  visualEvidenceImageUrl,
  visualsError,
  onDeepSearch,
  isDeepSearching,
  deepSearchResult,
  deepSearchError,
  onOpenVisualsModal
}) => {
  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 md:mb-0">
          Analysis for <span className="text-green-600 dark:text-green-400">{data.forestName}</span>
        </h2>
        <span className={`px-4 py-1.5 text-sm font-semibold rounded-full ${getStatusPillClass(data.status)}`}>
          {data.status}
        </span>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">AI Summary</h3>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{data.summary}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
          <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Area Lost</h4>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.areaLost}</p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Time Period Analyzed</h4>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.timePeriod}</p>
          </div>
        </div>

        {data.chartData && data.chartData.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Annual Tree Cover Loss (sq km) & Trend</h3>
            <div className="h-64 w-full bg-gray-50 dark:bg-gray-700/30 p-2 rounded-lg">
              <DeforestationChart data={data.chartData} />
            </div>
          </div>
        )}

        <div>
           <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            AI Conclusion
          </h3>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg">{data.conclusion}</p>
        </div>
        
        <div className="border-t dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Advanced Tools</h3>
          <div className="flex flex-wrap gap-4">
            {!visualEvidenceImageUrl && !isGeneratingVisuals && (
              <button
                onClick={onGenerateVisuals}
                disabled={isGeneratingVisuals || isDeepSearching}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                Generate Satellite Comparison
              </button>
            )}

            {!deepSearchResult && (
               <button
                  onClick={onDeepSearch}
                  disabled={isDeepSearching || isGeneratingVisuals}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z" clipRule="evenodd" />
                  </svg>
                  Deep Research
                </button>
            )}
          </div>

          {isGeneratingVisuals && (
            <div className="w-full h-72 mt-4 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700/50 rounded-lg">
               <svg className="animate-spin h-8 w-8 text-green-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-3 text-gray-600 dark:text-gray-300">Generating visual evidence...</p>
               <p className="text-xs text-gray-500 dark:text-gray-400">This may take a moment.</p>
            </div>
          )}

          {visualsError && (
              <div className="mt-4 text-center text-red-500 bg-red-100 dark:bg-red-900/20 p-3 rounded-lg">
                <p><strong>Image Generation Failed:</strong> {visualsError}</p>
              </div>
          )}

          {visualEvidenceImageUrl && (
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">Visual Evidence</h4>
              <button 
                onClick={() => onOpenVisualsModal(visualEvidenceImageUrl)} 
                className="w-full rounded-lg shadow-md overflow-hidden block group focus:outline-none focus:ring-4 focus:ring-green-500/50"
                aria-label="Open visual evidence in full screen viewer"
              >
                <img 
                  src={visualEvidenceImageUrl} 
                  alt={`AI-generated visual evidence for ${data.forestName}`} 
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </button>
              <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
                Click image to zoom. This is an AI-generated representation and may not be a literal satellite photo.
              </p>
            </div>
          )}
        </div>
        
        {(isDeepSearching || deepSearchResult || deepSearchError) && (
            <div className="border-t dark:border-gray-700 pt-6">
                 <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Deep Research Analysis</h3>
                {isDeepSearching && (
                     <div className="w-full flex items-center justify-center bg-gray-100 dark:bg-gray-700/50 rounded-lg p-6">
                        <svg className="animate-spin h-6 w-6 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-gray-600 dark:text-gray-300">AI is conducting a deeper investigation...</p>
                    </div>
                )}
                 {deepSearchError && (
                    <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/20 p-3 rounded-lg">
                        <p><strong>Deep Research Failed:</strong> {deepSearchError}</p>
                    </div>
                )}
                {deepSearchResult && (
                    <div className="text-gray-600 dark:text-gray-300 leading-relaxed bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <p>{deepSearchResult}</p>
                    </div>
                )}
            </div>
        )}


        <div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Data Sources</h3>
          <ul className="space-y-2">
            {data.sources.map((source, index) => (
              <li key={index} className="text-sm">
                <a 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-green-600 dark:text-green-400 hover:underline break-all"
                >
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};