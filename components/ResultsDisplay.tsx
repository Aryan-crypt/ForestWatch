import React, { useState, useEffect, useRef } from 'react';
import type { DeforestationData } from '../types';
import { DeforestationStatus } from '../types';
import { DeforestationChart } from './DeforestationChart';
import { DeforestationPieChart } from './DeforestationPieChart';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ResultsDisplayProps {
  data: DeforestationData;
  onGenerateVisuals: (startYear: number, endYear: number) => void;
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
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const pieChartContainerRef = useRef<HTMLDivElement>(null);
  
  const availableYears = data.chartData?.map(d => d.year).sort((a, b) => a - b) || [];
  const [startYear, setStartYear] = useState<number>(availableYears[0]);
  const [endYear, setEndYear] = useState<number>(availableYears[availableYears.length - 1]);

  useEffect(() => {
    if (availableYears.length > 0) {
      setStartYear(availableYears[0]);
      setEndYear(availableYears[availableYears.length - 1]);
    }
  }, [data.chartData]);

  const handleStartYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStartYear = parseInt(e.target.value, 10);
    setStartYear(newStartYear);
    if (newStartYear >= endYear) {
      const newEndYear = availableYears.find(y => y > newStartYear);
      setEndYear(newEndYear || availableYears[availableYears.length - 1]);
    }
  };

  const handleEndYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEndYear = parseInt(e.target.value, 10);
    if (newEndYear > startYear) {
      setEndYear(newEndYear);
    }
  };
  
  const isCustomYearsValid = startYear < endYear;

  const handleGenerateClick = () => {
    if (isCustomYearsValid) {
      onGenerateVisuals(startYear, endYear);
    }
  };

  const handleExport = async () => {
    if (!data || !chartContainerRef.current) {
        console.error("Data or chart reference not available for export.");
        return;
    };
    setIsExporting(true);

    try {
        const doc = new jsPDF('p', 'pt', 'a4');
        const margin = 40;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const contentWidth = pageWidth - margin * 2;
        let yPos = margin;

        const addText = (text: string, size: number, style: 'normal' | 'bold' = 'normal', color: string = '#000000', x: number = margin) => {
            doc.setFontSize(size);
            doc.setFont('helvetica', style);
            doc.setTextColor(color);
            const lines = doc.splitTextToSize(text, contentWidth);
            if (yPos + lines.length * size * 0.7 > pageHeight - margin) {
                doc.addPage();
                yPos = margin;
            }
            doc.text(lines, x, yPos);
            yPos += (lines.length * size * 0.7) + (size / 2);
        };

        addText(`ForestWatch AI Report`, 24, 'bold', '#16a34a');
        yPos += 10;
        addText(data.forestName, 18, 'bold');
        yPos += 10;

        addText('AI Summary', 14, 'bold', '#374151');
        addText(data.summary, 10);
        yPos += 10;

        addText('Key Statistics', 14, 'bold', '#374151');
        addText(`- Time Period Analyzed: ${data.timePeriod}`, 10);
        addText(`- Total Area Lost: ${data.areaLost}`, 10);
        addText(`- Estimated Initial Area: ${data.estimatedInitialArea}`, 10);
        yPos += 10;
        
        // Add Bar Chart
        addText('Annual Tree Cover Loss (sq km)', 14, 'bold', '#374151');
        const chartCanvas = await html2canvas(chartContainerRef.current, { scale: 2, backgroundColor: '#ffffff' });
        const chartImgData = chartCanvas.toDataURL('image/png');
        const imgProps = doc.getImageProperties(chartImgData);
        const imgHeight = (imgProps.height * contentWidth) / imgProps.width;
        if (yPos + imgHeight > pageHeight - margin) {
            doc.addPage();
            yPos = margin;
        }
        doc.addImage(chartImgData, 'PNG', margin, yPos, contentWidth, imgHeight);
        yPos += imgHeight + 20;

        // Add Pie Chart if available
        if (data.deforestationDrivers && data.deforestationDrivers.length > 0 && pieChartContainerRef.current) {
             if (yPos + 250 > pageHeight - margin) { // Approximate height for title and pie chart
                doc.addPage();
                yPos = margin;
            }
            addText('Primary Deforestation Drivers (Overall)', 14, 'bold', '#374151');
            const pieCanvas = await html2canvas(pieChartContainerRef.current, { scale: 2, backgroundColor: '#ffffff' });
            const pieImgData = pieCanvas.toDataURL('image/png');
            const pieProps = doc.getImageProperties(pieImgData);
            const pieHeight = (pieProps.height * contentWidth) / pieProps.width;
            doc.addImage(pieImgData, 'PNG', margin, yPos, contentWidth, pieHeight);
            yPos += pieHeight + 20;
        }

        // Add Conclusion
        addText('AI Conclusion', 14, 'bold', '#374151');
        addText(data.conclusion, 10);
        yPos += 10;

        // Add Sources
        if (data.sources && data.sources.length > 0) {
            if (yPos + 40 > pageHeight - margin) {
                doc.addPage();
                yPos = margin;
            }
            addText('Data Sources', 14, 'bold', '#374151');
            data.sources.forEach(source => {
                addText(`- ${source.title}: ${source.url}`, 8, 'normal', '#1d4ed8');
            });
        }
        
        doc.save(`${data.forestName.replace(/\s+/g, '_')}_Report.pdf`);
    } catch (error) {
        console.error("Error generating PDF:", error);
    } finally {
        setIsExporting(false);
    }
  };


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
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Annual Tree Cover Loss (sq km)</h3>
            <div ref={chartContainerRef} className="h-64 w-full bg-gray-50 dark:bg-gray-700/30 p-2 rounded-lg">
              <DeforestationChart data={data.chartData} />
            </div>
          </div>
        )}
        {data.deforestationDrivers && data.deforestationDrivers.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Primary Deforestation Drivers (Overall)</h3>
            <div ref={pieChartContainerRef} className="h-80 w-full bg-gray-50 dark:bg-gray-700/30 p-2 rounded-lg">
              <DeforestationPieChart data={data.deforestationDrivers} />
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
          <div className="flex flex-wrap gap-4 items-start">
            {!visualEvidenceImageUrl && !isGeneratingVisuals && (
                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg flex-grow">
                  <div className="flex flex-wrap items-center gap-4">
                     <button
                        onClick={handleGenerateClick}
                        disabled={isGeneratingVisuals || isDeepSearching || !isCustomYearsValid || isExporting}
                        className="flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex-grow sm:flex-grow-0"
                        aria-label={`Generate satellite comparison from ${startYear} to ${endYear}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                        Generate Satellite Comparison
                      </button>
                      <button
                        onClick={() => setIsAdvancedSettingsOpen(!isAdvancedSettingsOpen)}
                        disabled={isGeneratingVisuals || isDeepSearching || isExporting}
                        className="flex items-center justify-center gap-2 p-2 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 font-semibold rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        aria-label="Toggle advanced image generation settings"
                        aria-expanded={isAdvancedSettingsOpen}
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                      </button>
                    </div>
                    {isAdvancedSettingsOpen && (
                       <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 animate-fade-in">
                          <h5 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">Custom Year Comparison</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                  <label htmlFor="start-year" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Start Year</label>
                                  <select
                                    id="start-year"
                                    value={startYear}
                                    onChange={handleStartYearChange}
                                    className="block w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500"
                                  >
                                    {availableYears.slice(0, -1).map(year => (
                                      <option key={year} value={year}>{year}</option>
                                    ))}
                                  </select>
                              </div>
                              <div>
                                  <label htmlFor="end-year" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">End Year</label>
                                  <select
                                    id="end-year"
                                    value={endYear}
                                    onChange={handleEndYearChange}
                                    className="block w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500"
                                  >
                                    {availableYears.filter(y => y > startYear).map(year => (
                                      <option key={year} value={year}>{year}</option>
                                    ))}
                                  </select>
                              </div>
                          </div>
                          {!isCustomYearsValid && <p className="text-xs text-red-500 mt-2">End year must be after start year.</p>}
                       </div>
                    )}
                </div>
            )}
            
            <div className="flex flex-col gap-4">
                {!deepSearchResult && (
                   <button
                      onClick={onDeepSearch}
                      disabled={isDeepSearching || isGeneratingVisuals || isExporting}
                      className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z" clipRule="evenodd" />
                      </svg>
                      Deep Research
                    </button>
                )}

                <button
                  onClick={handleExport}
                  disabled={isDeepSearching || isGeneratingVisuals || isExporting}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-purple-600 text-white font-semibold rounded-full hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                    </svg>
                  {isExporting ? 'Exporting...' : 'Export Report'}
                </button>
            </div>
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