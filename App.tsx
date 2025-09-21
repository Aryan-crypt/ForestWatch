
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { ResultsDisplay } from './components/ResultsDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { LiveCounter } from './components/LiveCounter';
import { ImageModal } from './components/ImageModal';
import { fetchDeforestationData, generateVisualEvidence, fetchDeepResearchData } from './services/geminiService';
import type { DeforestationData } from './types';
import { DeforestationStatus } from './types';

const awarenessMessages = [
  { text: "Did you know? Planting trees is one of the most effective ways to combat deforestation. A single tree can absorb up to 48 pounds of CO2 per year.", duration: 8000 },
  { text: "Fun Fact: The Amazon Rainforest produces more than 20% of the world's oxygen.", duration: 6000 },
  { text: "You can help! Support companies committed to sustainable, deforestation-free supply chains.", duration: 7000 },
  { text: "Awareness: Deforestation is a major driver of climate change, second only to burning fossil fuels.", duration: 7000 },
  { text: "Fun Fact: More than half of the world's species of plants and animals live in rainforests.", duration: 6000 },
  { text: "How to prevent deforestation? Reduce your consumption of paper and wood products. Recycle and buy recycled products.", duration: 8000 },
  { text: "Awareness: Agriculture, particularly for palm oil, soy, and beef, is the leading cause of deforestation worldwide.", duration: 8000 },
  { text: "You can help! Donate to or volunteer with organizations like the Rainforest Alliance or the World Wildlife Fund.", duration: 8000 },
];

const App: React.FC = () => {
  const [forestName, setForestName] = useState<string>('');
  const [deforestationData, setDeforestationData] = useState<DeforestationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isGeneratingVisuals, setIsGeneratingVisuals] = useState<boolean>(false);
  const [visualEvidenceImageUrl, setVisualEvidenceImageUrl] = useState<string | null>(null);
  const [visualsError, setVisualsError] = useState<string | null>(null);

  const [isDeepSearching, setIsDeepSearching] = useState<boolean>(false);
  const [deepSearchResult, setDeepSearchResult] = useState<string | null>(null);
  const [deepSearchError, setDeepSearchError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalImageUrl, setModalImageUrl] = useState<string>('');
  const [awarenessMessage, setAwarenessMessage] = useState(awarenessMessages[0]);

  useEffect(() => {
    // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> for browser compatibility.
    let timeout: ReturnType<typeof setTimeout>;
    if (isLoading) {
      let messageIndex = 0;
      setAwarenessMessage(awarenessMessages[0]); // Start with the first message
      const cycleMessages = () => {
        messageIndex = (messageIndex + 1) % awarenessMessages.length;
        const newMessage = awarenessMessages[messageIndex];
        setAwarenessMessage(newMessage);
        timeout = setTimeout(cycleMessages, newMessage.duration);
      };
      // Start the first cycle
      timeout = setTimeout(cycleMessages, awarenessMessages[0].duration);
    }
    return () => clearTimeout(timeout);
  }, [isLoading]);


  const handleSearch = useCallback(async () => {
    if (!forestName.trim()) {
      setError('Please enter a forest name.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setDeforestationData(null);
    setVisualEvidenceImageUrl(null);
    setVisualsError(null);
    setDeepSearchResult(null);
    setDeepSearchError(null);

    try {
      const data = await fetchDeforestationData(forestName);
      setDeforestationData(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred. Please check the console.');
    } finally {
      setIsLoading(false);
    }
  }, [forestName]);

  const handleGenerateVisuals = useCallback(async (startYear: number, endYear: number) => {
    if (!deforestationData) return;

    setIsGeneratingVisuals(true);
    setVisualsError(null);
    setVisualEvidenceImageUrl(null);

    try {
      const imageUrl = await generateVisualEvidence(deforestationData, startYear, endYear);
      setVisualEvidenceImageUrl(imageUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during image generation.';
      console.error(err);
      setVisualsError(errorMessage);
    } finally {
      setIsGeneratingVisuals(false);
    }
  }, [deforestationData]);

  const handleDeepSearch = useCallback(async () => {
    if (!deforestationData) return;

    setIsDeepSearching(true);
    setDeepSearchError(null);
    setDeepSearchResult(null);

    try {
        const result = await fetchDeepResearchData(deforestationData);
        setDeepSearchResult(result);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during deep research.';
        console.error(err);
        setDeepSearchError(errorMessage);
    } finally {
        setIsDeepSearching(false);
    }
  }, [deforestationData]);

  const handleOpenModal = (imageUrl: string) => {
    setModalImageUrl(imageUrl);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalImageUrl('');
  };

  const getInitialViewState = () => {
    return (
      <div className="text-center">
        <div className="w-24 h-24 mx-auto text-green-300">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-800 dark:text-white">Detect Deforestation with AI</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          Enter the name of a forest to get the latest analysis on its status, powered by real-time data.
        </p>
        <LiveCounter />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-12 flex-grow">
        <div className="max-w-3xl mx-auto">
          <SearchBar 
            forestName={forestName}
            setForestName={setForestName}
            onSearch={handleSearch}
            isLoading={isLoading}
          />
          
          <div className="mt-8 min-h-[400px] p-4 flex items-center justify-center">
            {isLoading ? (
              <LoadingSpinner message={awarenessMessage} />
            ) : error ? (
              <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/20 p-4 rounded-lg">
                <h3 className="font-bold text-lg">Analysis Failed</h3>
                <p>{error}</p>
              </div>
            ) : deforestationData ? (
              <ResultsDisplay 
                data={deforestationData}
                onGenerateVisuals={handleGenerateVisuals}
                isGeneratingVisuals={isGeneratingVisuals}
                visualEvidenceImageUrl={visualEvidenceImageUrl}
                visualsError={visualsError}
                onDeepSearch={handleDeepSearch}
                isDeepSearching={isDeepSearching}
                deepSearchResult={deepSearchResult}
                deepSearchError={deepSearchError}
                onOpenVisualsModal={handleOpenModal}
              />
            ) : (
              getInitialViewState()
            )}
          </div>
        </div>
      </main>
      {isModalOpen && modalImageUrl && (
        <ImageModal imageUrl={modalImageUrl} onClose={handleCloseModal} />
      )}
      <footer className="text-center py-4 text-xs text-gray-500 dark:text-gray-400">
        by Aditya sahani
      </footer>
    </div>
  );
};

export default App;
