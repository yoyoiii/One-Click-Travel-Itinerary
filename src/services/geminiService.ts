import { GoogleGenAI, Type } from "@google/genai";
import { TravelItinerary } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface GenerateParams {
  destination: string;
  arrivalTime: string;
  departureTime: string;
  transport: string;
  foodPrefs?: string;
  sightseeingPrefs?: string;
  accommodationType: 'hotel' | 'homestay' | 'car';
  budget?: number;
  pace: string;
  flexible: boolean;
}

export async function generateItinerary(params: GenerateParams): Promise<TravelItinerary> {
  const model = "gemini-3-flash-preview";

  const prompt = `Generate a detailed travel itinerary for a trip to ${params.destination}.
  Arrival Time: ${params.arrivalTime}
  Departure Time: ${params.departureTime}
  Transportation: ${params.transport}
  Pace: ${params.pace} (Strategy: ${
    params.pace === 'low' ? 'Leisure - Start after 10:00, return before 21:00' : 
    params.pace === 'high' ? 'Compact - Start before 08:00, return after 22:00' : 
    'Medium - Balanced pace'
  })
  Food Preferences: ${params.foodPrefs || "None specified"}
  Sightseeing Preferences: ${params.sightseeingPrefs || "None specified"}
  Accommodation Type: ${params.accommodationType === 'car' ? 'Sleeping in the car (Suggest campsites/parking)' : params.accommodationType}
  Accommodation Budget: ${params.budget ? params.budget + ' RMB' : 'Not specified'}
  Flexible Generation: ${params.flexible ? "Yes (The AI can add, remove, or adjust activities based on preferences and logical routing to make the itinerary more reasonable and optimized, even if it differs slightly from the exact input list)" : "No (Strictly follow the user's input as much as possible)"}

  IMPORTANT: 
  1. All text content in the response MUST be in Chinese (Simplified).
  2. The itinerary MUST strictly respect the arrival and departure times. Do not plan activities before arrival or after departure.
  3. For each day, provide an "accommodation" object. If "Stay in car" was selected, suggest a safe and legal "campsite" or parking spot for that night.
  4. If the arrival/departure times or the user's preferences conflict with the chosen "Pace" strategy (e.g., arriving late but choosing 'high' pace), provide a friendly "paceWarning" message in the root of the JSON.
  5. Ensure all times in activities are realistic and follow the pace strategy if possible.
  6. You MUST consider the user's "Food Preferences" when planning the three meals (breakfast, lunch, dinner) each day. Instead of putting detailed restaurant recommendations inside the 'activities' array, you MUST put the recommended restaurants for the three meals into the 'restaurants' array (which represents the "美食推荐" / Food Recommendations module). For each restaurant, specify the 'mealType' (e.g., "早餐", "午餐", "晚餐"). You can still include a brief 'food' type activity in the 'activities' array (e.g., "前往餐厅享用午餐"), but the actual restaurant details MUST go into the 'restaurants' array.
  7. Provide recommendations for destination specialty milk tea and coffee shops ("cafesAndTea"), and specialty bakeries and dessert shops ("bakeriesAndDesserts") at the root level of the JSON. If there are no good recommendations, omit the arrays or leave them empty.

  Please provide the response strictly in the following JSON format:
  {
    "destination": "string",
    "arrivalTime": "string",
    "departureTime": "string",
    "paceWarning": "string (optional, only if conflicts exist)",
    "cafesAndTea": [
      {
        "name": "string",
        "description": "string",
        "address": "string",
        "rating": number
      }
    ],
    "bakeriesAndDesserts": [
      {
        "name": "string",
        "description": "string",
        "address": "string",
        "rating": number
      }
    ],
    "days": [
      {
        "day": number,
        "date": "string",
        "weather": {
          "temp": "string",
          "condition": "string",
          "description": "string"
        },
        "accommodation": {
          "name": "string",
          "type": "hotel | homestay | campsite",
          "priceRange": "string",
          "description": "string",
          "address": "string"
        },
        "routeDescription": "string",
        "mapQuery": "string (A search query for Baidu Maps to show this day's route)",
        "activities": [
          {
            "time": "string",
            "location": "string",
            "description": "string",
            "type": "sightseeing | transport | food | rest"
          }
        ],
        "restaurants": [
          {
            "name": "string",
            "rating": number,
            "reviews": number,
            "cuisine": "string",
            "description": "string",
            "address": "string",
            "mealType": "string (e.g., 早餐, 午餐, 晚餐)"
          }
        ]
      }
    ],
    "overallRouteSummary": "string"
  }

  Ensure all activities have logical time allocations and routes.`;

  const response = await ai.models.generateContent({
    model: model,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      tools: [
        { googleSearch: {} }
      ],
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  try {
    // Extract JSON from potential markdown code blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    return JSON.parse(jsonStr) as TravelItinerary;
  } catch (e) {
    console.error("Failed to parse itinerary JSON", text);
    throw new Error("Invalid itinerary format received from AI. Please try again.");
  }
}
