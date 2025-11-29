/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React from 'react';
import { format, addDays, startOfToday } from 'date-fns';
import { Service, Consultant, TimeSlot, Booking } from '../types';
import { Calendar, Clock, CreditCard, ShieldCheck, RefreshCw, AlertCircle, Check, Mail } from 'lucide-react';

// --- Error Message Widget ---
interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => (
  <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 animate-fade-in-up w-full max-w-sm mt-2">
    <div className="flex items-start gap-3">
      <div className="text-red-500 mt-0.5"><AlertCircle size={18} /></div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-red-400">Error Occurred</h4>
        <p className="text-xs text-red-200 mt-1 leading-relaxed">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            type="button"
            className="mt-3 text-xs bg-zinc-800 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-900/30 transition-colors font-medium flex items-center gap-1"
          >
            <RefreshCw size={12} /> Try Again
          </button>
        )}
      </div>
    </div>
  </div>
);

// --- Suggestion Chips ---
interface SuggestionChipsProps {
  options: string[];
  onSelect: (text: string) => void;
}

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({ options, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2 mt-3 animate-fade-in-up">
      {options.map((option, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(option)}
          type="button"
          className="bg-zinc-800 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500 hover:text-zinc-900 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 uppercase tracking-wider"
        >
          {option}
        </button>
      ))}
    </div>
  );
};

// --- Service Carousel ---
interface ServiceCarouselProps {
  services: Service[];
  onSelect: (service: Service) => void;
}

export const ServiceCarousel: React.FC<ServiceCarouselProps> = ({ services, onSelect }) => {
  return (
    <div className="flex overflow-x-auto gap-4 py-2 px-1 scrollbar-hide snap-x">
      {services.map((service) => (
        <button 
          key={service.id}
          onClick={() => onSelect(service)}
          type="button"
          className="snap-center min-w-[200px] bg-zinc-800 p-4 rounded-xl border border-zinc-700 shadow-lg hover:shadow-red-900/20 hover:border-red-600 cursor-pointer transition-all flex flex-col items-start gap-2 animate-fade-in-up text-left focus:outline-none focus:ring-2 focus:ring-red-500/50 group"
        >
          <div className="p-2 bg-zinc-900 rounded-lg text-red-500 group-hover:text-red-400 group-hover:bg-zinc-950 transition-colors border border-zinc-700">
            <span className="font-bold text-lg">{service.name.charAt(0)}</span>
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100 group-hover:text-red-400 transition-colors">{service.name}</h3>
            <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{service.description}</p>
          </div>
          <div className="mt-auto pt-2 w-full flex justify-between items-center text-sm">
            <span className="font-bold text-yellow-400">${service.price}</span>
            <span className="text-zinc-500 font-medium group-hover:text-zinc-300">Select &rarr;</span>
          </div>
        </button>
      ))}
    </div>
  );
};

// --- Consultant Picker ---
interface ConsultantPickerProps {
  consultants: Consultant[];
  onSelect: (c: Consultant) => void;
}

export const ConsultantPicker: React.FC<ConsultantPickerProps> = ({ consultants, onSelect }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in-up">
      {consultants.map(c => (
        <button 
          key={c.id} 
          onClick={() => onSelect(c)} 
          type="button"
          className="flex items-center gap-3 p-3 bg-zinc-800 rounded-xl border border-zinc-700 cursor-pointer hover:bg-zinc-700 hover:border-yellow-500/50 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-yellow-500/30 group"
        >
          <img src={c.avatarUrl} alt={c.name} className="w-12 h-12 rounded-full object-cover border-2 border-zinc-600 group-hover:border-yellow-400 transition-colors" />
          <div>
            <p className="font-bold text-sm text-zinc-100 group-hover:text-yellow-400 transition-colors">{c.name}</p>
            <p className="text-xs text-zinc-400">{c.specialty}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

// --- Date Picker (Simple Horizonatal) ---
interface DatePickerProps {
  onSelect: (date: Date) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({ onSelect }) => {
  const today = startOfToday();
  const dates = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 animate-fade-in-up">
      {dates.map((date) => (
        <button
          key={date.toISOString()}
          onClick={() => onSelect(date)}
          type="button"
          className="flex flex-col items-center justify-center min-w-[60px] p-3 rounded-xl bg-zinc-800 border border-zinc-700 hover:border-red-500 hover:bg-zinc-700 active:bg-red-600 active:text-white active:border-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30 group"
        >
          <span className="text-xs font-medium text-zinc-500 group-hover:text-zinc-300 pointer-events-none">{format(date, 'EEE')}</span>
          <span className="text-lg font-bold text-zinc-200 group-hover:text-white pointer-events-none">{format(date, 'd')}</span>
        </button>
      ))}
    </div>
  );
};

// --- Slot Picker ---
interface SlotPickerProps {
  slots: TimeSlot[];
  onSelect: (slot: TimeSlot) => void;
}

export const SlotPicker: React.FC<SlotPickerProps> = ({ slots, onSelect }) => {
  if (slots.length === 0) {
    return <div className="p-4 text-center text-zinc-500 bg-zinc-800/50 rounded-lg text-sm border border-zinc-800">No slots available for this date.</div>;
  }
  return (
    <div className="grid grid-cols-3 gap-2 animate-fade-in-up">
      {slots.map(slot => (
        <button
          key={slot.id}
          disabled={!slot.available}
          onClick={() => onSelect(slot)}
          type="button"
          className={`py-2 px-3 rounded-lg text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500/30 ${
            slot.available 
              ? 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-yellow-400 hover:text-yellow-400 hover:bg-zinc-700 active:bg-yellow-400 active:text-black' 
              : 'bg-zinc-900/50 text-zinc-600 cursor-not-allowed line-through border border-transparent'
          }`}
        >
          {slot.time}
        </button>
      ))}
    </div>
  );
};

// --- Payment Form (Simulated) ---
interface PaymentFormProps {
  amount: number;
  onPay: () => void;
  isProcessing: boolean;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ amount, onPay, isProcessing }) => {
  return (
    <div className="bg-zinc-800 p-5 rounded-xl border border-zinc-700 shadow-xl w-full max-w-sm animate-fade-in-up relative overflow-hidden">
      {/* Decorative slash */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-red-600/10 to-transparent -mr-10 -mt-10 rounded-full blur-xl"></div>

      <div className="flex justify-between items-center mb-4 relative z-10">
        <h4 className="font-semibold text-zinc-100 flex items-center gap-2">
          <CreditCard size={18} className="text-red-500" /> Secure Payment
        </h4>
        <span className="text-lg font-bold text-yellow-400">${amount}</span>
      </div>
      
      <div className="space-y-3 relative z-10">
        <input type="text" placeholder="Card Number" className="w-full p-2 border border-zinc-600 rounded text-sm bg-zinc-900 text-zinc-300 placeholder-zinc-600 focus:border-red-500 focus:outline-none" disabled value="4242 4242 4242 4242" />
        <div className="flex gap-3">
          <input type="text" placeholder="MM/YY" className="w-1/2 p-2 border border-zinc-600 rounded text-sm bg-zinc-900 text-zinc-300 placeholder-zinc-600" disabled value="12/25" />
          <input type="text" placeholder="CVC" className="w-1/2 p-2 border border-zinc-600 rounded text-sm bg-zinc-900 text-zinc-300 placeholder-zinc-600" disabled value="123" />
        </div>
      </div>

      <button
        onClick={onPay}
        disabled={isProcessing}
        type="button"
        className="w-full mt-4 bg-red-600 text-white py-3 rounded-lg font-bold uppercase tracking-wide hover:bg-red-700 disabled:opacity-50 flex justify-center items-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-red-900/20"
      >
        {isProcessing ? (
          <>Processing...</>
        ) : (
          <>Pay ${amount} Now</>
        )}
      </button>
      
      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-zinc-500 relative z-10">
        <ShieldCheck size={12} /> Encrypted via Stripe (Simulated)
      </div>
    </div>
  );
};

// --- Booking Confirmation Card (Formerly BookingReceipt) ---
interface SuccessCardProps {
  booking: Booking;
}

export const BookingSuccessCard: React.FC<SuccessCardProps> = ({ booking }) => {
  return (
    <div className="bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-700 shadow-2xl animate-fade-in-up max-w-sm w-full mt-2 ring-1 ring-zinc-700/50">
      {/* Success Header - Deadpool/Wolverine Gradient */}
      <div className="bg-gradient-to-r from-red-600 to-yellow-500 p-5 text-white flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Texture */}
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 20px)'}}></div>
        
        <div className="w-12 h-12 bg-zinc-900 text-yellow-400 rounded-full flex items-center justify-center mb-3 shadow-lg z-10 border-2 border-white/20">
          <Check size={28} strokeWidth={4} />
        </div>
        <h3 className="font-bold text-xl z-10 text-white drop-shadow-md uppercase tracking-tight">Mission Confirmed!</h3>
        <p className="text-white/90 text-xs mt-1 z-10 font-mono">ID: {booking.id}</p>
      </div>

      {/* Details Body */}
      <div className="p-5 space-y-5">
        
        {/* Consultant & Service */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={booking.consultant.avatarUrl} className="w-14 h-14 rounded-full object-cover border-2 border-zinc-600 shadow-sm" alt="avatar" />
            <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black p-1 rounded-full border-2 border-zinc-800">
               <ShieldCheck size={10} />
            </div>
          </div>
          <div>
            <h4 className="font-bold text-zinc-100 text-base">{booking.consultant.name}</h4>
            <p className="text-sm text-zinc-400 font-medium">{booking.service.name}</p>
          </div>
        </div>
        
        {/* Date & Time Grid */}
        <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/50 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-zinc-500 font-bold flex items-center gap-1">
              <Calendar size={12}/> Date
            </span>
            <span className="font-bold text-zinc-200 text-sm block">
              {format(new Date(booking.date), 'MMM d, yyyy')}
            </span>
          </div>
          <div className="space-y-1 border-l border-zinc-700 pl-4">
            <span className="text-xs uppercase tracking-wide text-zinc-500 font-bold flex items-center gap-1">
              <Clock size={12}/> Time
            </span>
            <span className="font-bold text-zinc-200 text-sm block">
              {booking.slot.time}
            </span>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center space-y-3 pt-1">
           <p className="text-xs text-zinc-500 flex items-center justify-center gap-1.5">
             <Mail size={12} /> Confirmation sent to <span className="font-medium text-zinc-400">{booking.user.email}</span>
           </p>
           
           <button type="button" className="w-full py-2.5 rounded-lg border border-zinc-600 text-zinc-400 text-sm font-bold uppercase tracking-wide hover:bg-zinc-700 hover:text-white transition-colors">
             Add to Calendar (.ics)
           </button>
        </div>
      </div>
    </div>
  );
};

export const GenericCard: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
    <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 shadow-sm animate-fade-in-up w-full max-w-md">
        <h3 className="font-semibold text-zinc-100 mb-3">{title}</h3>
        {children}
    </div>
);