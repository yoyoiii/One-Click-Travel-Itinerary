import React, { createContext, useContext, useState, useEffect } from 'react';
import { TravelItinerary } from '../types';

interface TravelContextType {
  savedItineraries: TravelItinerary[];
  fetchItineraries: () => Promise<void>;
  saveItinerary: (item: TravelItinerary, name?: string) => Promise<TravelItinerary | null>;
  deleteItinerary: (id: string) => Promise<void>;
  currentItinerary: TravelItinerary | null;
  setCurrentItinerary: (itinerary: TravelItinerary | null) => void;
}

const TravelContext = createContext<TravelContextType | undefined>(undefined);

export const TravelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedItineraries, setSavedItineraries] = useState<TravelItinerary[]>([]);
  const [currentItinerary, setCurrentItinerary] = useState<TravelItinerary | null>(null);

  const fetchItineraries = async () => {
    try {
      const response = await fetch('/api/itineraries');
      if (response.ok) {
        const data = await response.json();
        setSavedItineraries(data);
      }
    } catch (e) {
      console.error("Failed to load saved itineraries", e);
    }
  };

  const saveItinerary = async (item: TravelItinerary, name?: string) => {
    const newItinerary = { 
      ...item, 
      id: item.id || Date.now().toString(),
      name: name || item.name || `${item.destination}之旅 (${(item.arrivalTime || (item as any).startDate || '').split('T')[0]})`
    };
    try {
      const response = await fetch('/api/itineraries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItinerary)
      });
      if (response.ok) {
        const saved = await response.json();
        setSavedItineraries(prev => [saved, ...prev.filter(i => i.id !== saved.id)]);
        return saved;
      }
    } catch (e) {
      console.error("Failed to save itinerary", e);
    }
    return null;
  };

  const deleteItinerary = async (id: string) => {
    try {
      const response = await fetch(`/api/itineraries/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setSavedItineraries(prev => prev.filter(i => i.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete itinerary", e);
    }
  };

  useEffect(() => {
    fetchItineraries();
  }, []);

  return (
    <TravelContext.Provider value={{ 
      savedItineraries, 
      fetchItineraries, 
      saveItinerary, 
      deleteItinerary,
      currentItinerary,
      setCurrentItinerary
    }}>
      {children}
    </TravelContext.Provider>
  );
};

export const useTravel = () => {
  const context = useContext(TravelContext);
  if (context === undefined) {
    throw new Error('useTravel must be used within a TravelProvider');
  }
  return context;
};
