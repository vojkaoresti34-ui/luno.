
export enum Screen {
  SPLASH = 'SPLASH',
  WALKTHROUGH = 'WALKTHROUGH',
  AUTH = 'AUTH',
  ONBOARDING = 'ONBOARDING',
  GENERATING = 'GENERATING',
  PRESENTING = 'PRESENTING',
  HOME = 'HOME',
  DAY_DETAIL = 'DAY_DETAIL',
  INSIGHTS = 'INSIGHTS',
  PROFILE = 'PROFILE',
  MAP = 'MAP',
  QUIZ = 'QUIZ',
  PRICING = 'PRICING'
}

export type SubscriptionTier = 'FREE' | 'PLUS' | 'PRO';
export type BillingCycle = 'MONTHLY' | 'YEARLY';

export interface UserPreferences {
  vibes: string[];
  energy: number; // 0-100
  toggles: {
    busyPlaces: boolean;
    avoidNightlife: boolean;
    dayOnly: boolean;
    firstTime: boolean;
  };
  destination?: string;
  character?: {
    morning: string;
    navigation: string;
  };
  subscription?: SubscriptionTier;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'main' | 'food' | 'rest' | 'social';
  location: string;
}

export interface DayPlan {
  id: string;
  date: string; // e.g., "Day 1"
  vibeLabel: string; // e.g., "Chill Exploration"
  summary: string;
  mainActivities: Activity[];
  alternatives: Activity[];
}

export interface Trip {
  id: string;
  destination: string;
  days: DayPlan[];
}