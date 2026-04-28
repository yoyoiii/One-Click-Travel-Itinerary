import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  orderBy,
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { TravelItinerary, PlanFormState } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface TravelContextType {
  savedItineraries: TravelItinerary[];
  fetchItineraries: () => Promise<void>;
  saveItinerary: (item: TravelItinerary, name?: string) => Promise<TravelItinerary | null>;
  deleteItinerary: (id: string) => Promise<void>;
  currentItinerary: TravelItinerary | null;
  setCurrentItinerary: (itinerary: TravelItinerary | null) => void;
  draftParams: PlanFormState | null;
  setDraftParams: (params: PlanFormState | null) => void;
}

const TravelContext = createContext<TravelContextType | undefined>(undefined);

export const TravelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [savedItineraries, setSavedItineraries] = useState<TravelItinerary[]>([]);
  const [currentItinerary, setCurrentItinerary] = useState<TravelItinerary | null>(null);
  const [draftParams, setDraftParams] = useState<PlanFormState | null>(null);

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: user?.uid,
        email: user?.email,
        emailVerified: user?.emailVerified,
        isAnonymous: user?.isAnonymous,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  const fetchItineraries = async () => {
    if (!user) {
      setSavedItineraries([]);
      return;
    }
    const path = 'itineraries';
    try {
      const q = query(
        collection(db, path), 
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TravelItinerary));
      data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setSavedItineraries(data);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
  };

  const saveItinerary = async (item: TravelItinerary, name?: string) => {
    if (!user) return null;
    const path = 'itineraries';
    const newItinerary = { 
      ...item, 
      userId: user.uid,
      name: name || item.name || `${item.destination}之旅 (${(item.arrivalTime || (item as any).startDate || '').split('T')[0]})`,
      createdAt: item.createdAt || new Date().toISOString()
    };
    
    try {
      let docRef;
      if (item.id) {
        docRef = doc(db, path, item.id);
        await setDoc(docRef, newItinerary, { merge: true });
      } else {
        docRef = await addDoc(collection(db, path), newItinerary);
      }
      const saved = { ...newItinerary, id: docRef.id } as TravelItinerary;
      setSavedItineraries(prev => [saved, ...prev.filter(i => i.id !== saved.id)]);
      return saved;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
      return null;
    }
  };

  const deleteItinerary = async (id: string) => {
    if (!user) return;
    const path = `itineraries/${id}`;
    try {
      await deleteDoc(doc(db, 'itineraries', id));
      setSavedItineraries(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  useEffect(() => {
    if (user) {
      fetchItineraries();
      
      // Real-time updates
      const q = query(
        collection(db, 'itineraries'), 
        where('userId', '==', user.uid)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TravelItinerary));
        data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setSavedItineraries(data);
      }, (error) => {
        console.error("Snapshot error:", error);
      });
      return unsubscribe;
    } else {
      setSavedItineraries([]);
    }
  }, [user]);

  return (
    <TravelContext.Provider value={{ 
      savedItineraries, 
      fetchItineraries, 
      saveItinerary, 
      deleteItinerary,
      currentItinerary,
      setCurrentItinerary,
      draftParams,
      setDraftParams
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
