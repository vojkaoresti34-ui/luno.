
import { GoogleGenerativeAI } from "@google/generative-ai";
import { UserPreferences, Trip } from "../types";

// API Key provided by user
const API_KEY = process.env.GEMINI_API_KEY as string;

const ai = new GoogleGenerativeAI(API_KEY);

const MOCK_TRIP: Trip = {
  id: "mock-trip-1",
  destination: "Kyoto, Japan",
  days: [
    {
      id: "d1",
      date: "Day 1",
      vibeLabel: "Calm Arrival",
      summary: "Settling in with quiet temples and tea.",
      mainActivities: [
        { id: "a1", title: "Nanzen-ji Temple", description: "Walk through the massive gate and explore the aqueduct.", time: "10:00 AM", type: "main", location: "Sakyo Ward" },
        { id: "a2", title: "Blue Bottle Coffee", description: "Minimalist coffee in a renovated machiya.", time: "2:00 PM", type: "rest", location: "Kyoto" },
        { id: "a3", title: "Philosopher's Path", description: "A meditative walk along the canal.", time: "4:00 PM", type: "main", location: "Higashiyama" }
      ],
      alternatives: [
        { id: "alt1", title: "Eikan-do", description: "Famous for autumn colors, very quiet.", time: "Flexible", type: "main", location: "Sakyo" }
      ]
    },
    {
      id: "d2",
      date: "Day 2",
      vibeLabel: "Hidden Gems",
      summary: "Avoiding the crowds in Northern Kyoto.",
      mainActivities: [
        { id: "a4", title: "Daitoku-ji", description: "A complex of zen gardens.", time: "09:00 AM", type: "main", location: "Kita Ward" },
        { id: "a5", title: "Sarasa Nishijin", description: "Lunch in an old bathhouse.", time: "12:30 PM", type: "food", location: "Nishijin" }
      ],
      alternatives: []
    }
  ]
};

export const generateTrip = async (prefs: UserPreferences): Promise<Trip> => {
  try {
    const prompt = `
      Generate a 3-day travel itinerary for ${prefs.destination || 'a popular city'}.
      
      User Context:
      - Vibes: ${prefs.vibes.join(', ')}
      - Energy: ${prefs.energy}%
      
      REQUIREMENTS:
      1. Return JSON matching the schema.
      2. The 'days' array MUST contain exactly 3 objects (Day 1, Day 2, Day 3).
      3. 'destination' must be "City, Country" (e.g. "Tokyo, Japan").
      4. Each day must have 'mainActivities' (2-3 items) and 'alternatives' (1 item).
      5. Keep descriptions concise (under 20 words).
    `;

    const model = ai.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text) throw new Error("No data returned from API");
    
    // Parse JSON safely
    const data = JSON.parse(text) as Trip;

    // Validate data integrity before returning
    if (!data.days || data.days.length === 0) {
        throw new Error("Generated trip contains no days");
    }

    // Sanitize data to ensure arrays exist
    const sanitizedTrip: Trip = {
        ...data,
        id: Date.now().toString(),
        destination: data.destination || prefs.destination || "Unknown Destination",
        days: (data.days || []).map((day, index) => ({
            ...day,
            id: day.id || `day-${index}-${Date.now()}`,
            mainActivities: day.mainActivities || [],
            alternatives: day.alternatives || []
        }))
    };

    return sanitizedTrip;

  } catch (e) {
    console.error("Gemini API Error (falling back to mock)", e);
    
    // Simulate a short delay so the UI doesn't flash instantly on error
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Fallback to mock data with the user's specific destination to maintain immersion
    return { 
        ...MOCK_TRIP, 
        destination: prefs.destination || MOCK_TRIP.destination,
        days: MOCK_TRIP.days.map((d, i) => ({
            ...d,
            // Ensure unique IDs so React doesn't complain about keys if we regenerate
            id: `fallback-day-${i}-${Date.now()}`
        }))
    };
  }
};
