import { Booking, TimeSlot, UserDetails, Consultant, Service } from "../types";
import { CONSULTANTS, SERVICES } from "../constants";

// Mock Database in LocalStorage
const STORAGE_KEY = 'consultai_bookings';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export const MockBackend = {
  // 1. Fetch Slots (Simulates Google Calendar / Appointy availability)
  getAvailableSlots: async (consultantId: string, date: Date): Promise<TimeSlot[]> => {
    await sleep(800); // Simulate network latency
    
    // Deterministic mock generation based on date
    const day = date.getDay();
    if (day === 0 || day === 6) return []; // Weekend closed

    const slots: TimeSlot[] = [
      { id: 's1', time: '09:00', available: true },
      { id: 's2', time: '10:00', available: Math.random() > 0.3 },
      { id: 's3', time: '11:00', available: true },
      { id: 's4', time: '14:00', available: Math.random() > 0.5 },
      { id: 's5', time: '15:00', available: true },
      { id: 's6', time: '16:00', available: true },
    ];
    return slots;
  },

  // 2. OTP Service
  sendOTP: async (phone: string): Promise<boolean> => {
    await sleep(1000);
    console.log(`[Mock SMS Gateway] OTP sent to ${phone}: 1234`);
    return true;
  },

  verifyOTP: async (otp: string): Promise<boolean> => {
    await sleep(600);
    return otp === '1234';
  },

  // 3. Payment Processing (Stripe/Razorpay Mock)
  processPayment: async (amount: number, token: string): Promise<{ success: boolean; transactionId: string }> => {
    await sleep(2000);
    if (token === 'fail') return { success: false, transactionId: '' };
    return { success: true, transactionId: `txn_${Math.random().toString(36).substr(2, 9)}` };
  },

  // 4. Booking Management
  createBooking: async (
    service: Service,
    consultant: Consultant,
    date: Date,
    slot: TimeSlot,
    user: UserDetails,
    transactionId: string
  ): Promise<Booking> => {
    await sleep(1000);
    
    const newBooking: Booking = {
      id: `BK-${Math.floor(Math.random() * 10000)}`,
      service,
      consultant,
      date,
      slot,
      user,
      status: 'CONFIRMED',
      paymentId: transactionId
    };

    // Save to local storage
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existing.push(newBooking);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

    return newBooking;
  },

  getBooking: async (bookingId: string): Promise<Booking | null> => {
    await sleep(800);
    const existing: Booking[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return existing.find(b => b.id === bookingId) || null;
  },

  cancelBooking: async (bookingId: string): Promise<boolean> => {
    await sleep(1000);
    const existing: Booking[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const index = existing.findIndex(b => b.id === bookingId);
    if (index === -1) return false;
    
    existing[index].status = 'CANCELLED'; // Soft delete
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return true;
  },

  rescheduleBooking: async (bookingId: string, newDate: Date, newSlot: TimeSlot): Promise<Booking | null> => {
    await sleep(1000);
    const existing: Booking[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const index = existing.findIndex(b => b.id === bookingId);
    if (index === -1) return null;

    existing[index].date = newDate;
    existing[index].slot = newSlot;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return existing[index];
  }
};
