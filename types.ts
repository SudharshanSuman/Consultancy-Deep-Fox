
import React from 'react';

// Bot Conversation States
export enum BotState {
  IDLE,
  ANALYZING_INTENT,
  SELECT_SERVICE,
  SELECT_CONSULTANT,
  SELECT_DATE,
  FETCHING_SLOTS,
  SELECT_SLOT,
  COLLECT_DETAILS, // Name, Email, Phone
  VERIFY_OTP,
  PROCESSING_PAYMENT,
  CONFIRMED,
  RESCHEDULE_FIND, // Ask for Booking ID
  RESCHEDULE_SELECT_NEW,
  CANCEL_FIND,
  CANCEL_CONFIRM,
  ERROR
}

// Data Models
export interface Service {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  price: number;
}

export interface Consultant {
  id: string;
  name: string;
  specialty: string;
  serviceId: string;
  avatarUrl: string;
}

export interface TimeSlot {
  id: string;
  time: string; // HH:mm format
  available: boolean;
}

export interface UserDetails {
  name: string;
  email: string;
  phone: string;
}

export interface Booking {
  id: string;
  service: Service;
  consultant: Consultant;
  date: Date;
  slot: TimeSlot;
  user: UserDetails;
  status: 'CONFIRMED' | 'CANCELLED';
  paymentId?: string;
}

// Chat UI Models
export interface Message {
  id: string;
  sender: 'user' | 'bot';
  text?: string;
  component?: React.ReactNode; // For widgets like Calendars, Cards
  timestamp: Date;
  isTyping?: boolean;
}

// Gemini AI Response Schema
export interface AIAnalysisResult {
  intent: 'BOOK' | 'RESCHEDULE' | 'CANCEL' | 'GENERAL_QUERY' | 'UNKNOWN';
  recommendedServiceId?: string; // If user describes a problem
  extractedDate?: string; // ISO string if found
  sentiment?: string;
  replyText: string; // A conversational reply from the AI
}
