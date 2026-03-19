export interface ItineraryDay {
  day: number;
  date: string;
  weather: WeatherInfo;
  activities: Activity[];
  restaurants: Restaurant[];
  accommodation?: AccommodationInfo;
  routeDescription: string;
  mapQuery: string;
}

export interface AccommodationInfo {
  name: string;
  type: 'hotel' | 'homestay' | 'campsite';
  priceRange?: string;
  description: string;
  address: string;
}

export interface Activity {
  time: string;
  location: string;
  description: string;
  type: 'sightseeing' | 'transport' | 'food' | 'rest';
  coordinates?: { lat: number; lng: number };
}

export interface Restaurant {
  name: string;
  rating: number;
  reviews: number;
  cuisine: string;
  description: string;
  address: string;
  mapUrl?: string;
  mealType?: string;
}

export interface WeatherInfo {
  temp: string;
  condition: string;
  description: string;
}

export interface ShopRecommendation {
  name: string;
  description: string;
  address?: string;
  rating?: number;
}

export interface TravelItinerary {
  id?: string;
  userId?: string;
  name?: string;
  destination: string;
  arrivalTime: string;
  departureTime: string;
  days: ItineraryDay[];
  overallRouteSummary: string;
  paceWarning?: string;
  cafesAndTea?: ShopRecommendation[];
  bakeriesAndDesserts?: ShopRecommendation[];
  createdAt?: string;
}
