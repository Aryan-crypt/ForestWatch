import React, { useState, useEffect, useCallback } from 'react';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newZoom = zoom - e.deltaY * 0.005;
    setZoom(Math.min(Math.max(0.5, newZoom), 5)); // Clamp zoom between 0.5x and 5x
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y
    });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleClose = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  useEffect(() => {
      if (zoom === 1) {
          setPosition({ x: 0, y: 0 });
      }
  }, [zoom]);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={handleClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/80 transition-colors z-10"
        aria-label="Close image viewer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

       <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 text-white p-2 rounded-lg text-xs md:text-sm">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 hidden md:block" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
        <span>Scroll to Zoom / Drag to Pan</span>
         <button onClick={(e) => { e.stopPropagation(); setZoom(1); }} className="ml-2 bg-white/20 px-2 py-1 rounded hover:bg-white/40">Reset</button>
      </div>

      <div
        className="relative overflow-hidden w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()} 
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      >
        <img
          src={imageUrl}
          alt="Deforestation visual evidence, enlarged view"
          className={`max-w-[90vw] max-h-[90vh] object-contain ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
        />
      </div>
    </div>
  );
};
