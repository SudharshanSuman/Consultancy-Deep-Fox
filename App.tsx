
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { BotState, Message, Service, Consultant, TimeSlot, UserDetails, Booking } from './types';
import { SERVICES, CONSULTANTS } from './constants';
import { analyzeUserIntent } from './services/geminiService';
import { MockBackend } from './services/mockBackendService';
import { 
  ServiceCarousel, 
  ConsultantPicker, 
  DatePicker, 
  SlotPicker, 
  PaymentForm, 
  BookingSuccessCard,
  GenericCard,
  ErrorMessage,
  SuggestionChips
} from './components/Widgets';
import { Send, Zap } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [botState, setBotState] = useState<BotState>(BotState.IDLE);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Refs for data accessed in async callbacks (Fixes Stale Closures) ---
  const selectedServiceRef = useRef<Service | null>(null);
  const selectedConsultantRef = useRef<Consultant | null>(null);
  const selectedDateRef = useRef<Date | null>(null);
  const bookingToModifyRef = useRef<Booking | null>(null);

  // --- Booking Flow State Data (for UI rendering if needed) ---
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails>({ name: '', email: '', phone: '' });
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [bookingToModify, setBookingToModify] = useState<Booking | null>(null);

  // --- Scroll to bottom ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // --- Helpers ---
  const addMessage = (sender: 'user' | 'bot', text?: string, component?: React.ReactNode) => {
    const msg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      sender,
      text,
      component,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, msg]);
  };

  const simulateBotTyping = async (ms = 1000) => {
    setIsTyping(true);
    await new Promise(r => setTimeout(r, ms));
    setIsTyping(false);
  };

  // --- Core Logic Handlers ---

  const handleUserMessage = async (textOverride?: string) => {
    const text = typeof textOverride === 'string' ? textOverride : inputValue;
    if (!text.trim()) return;
    
    // Clear input only if it was typed by user
    if (!textOverride) {
      setInputValue('');
    }
    
    addMessage('user', text);

    // State Machine
    switch (botState) {
      case BotState.IDLE:
        await processInitialIntent(text);
        break;
      
      case BotState.COLLECT_DETAILS:
        handleDetailsInput(text);
        break;

      case BotState.VERIFY_OTP:
        handleOTPInput(text);
        break;

      case BotState.RESCHEDULE_FIND:
      case BotState.CANCEL_FIND:
        handleFindBooking(text);
        break;

      case BotState.ERROR:
        // Reset
        setBotState(BotState.IDLE);
        addMessage('bot', "Let's start over. How can I help?");
        break;

      default:
        if (text.toLowerCase() === 'cancel') {
          setBotState(BotState.IDLE);
          addMessage('bot', "Operation cancelled. Is there anything else I can do?", (
            <SuggestionChips 
              options={["Book a new appointment", "Check services", "Contact support"]} 
              onSelect={handleUserMessage} 
            />
          ));
        } else {
          addMessage('bot', "Please use the options above, or type 'cancel' to restart.");
        }
    }
  };

  const processInitialIntent = async (text: string) => {
    setIsTyping(true);
    try {
      const analysis = await analyzeUserIntent(text);
      setIsTyping(false);

      addMessage('bot', analysis.replyText);

      if (analysis.intent === 'BOOK') {
        if (analysis.recommendedServiceId) {
          const service = SERVICES.find(s => s.id === analysis.recommendedServiceId);
          if (service) {
             addMessage('bot', `I've selected ${service.name} based on your request. Is that correct?`, (
               <div className="flex gap-2 mt-2">
                  <button onClick={() => confirmService(service)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors" type="button">Yes, proceed</button>
                  <button onClick={startServiceSelection} className="bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg text-sm hover:bg-zinc-600 transition-colors" type="button">No, show all services</button>
               </div>
             ));
             return;
          }
        }
        startServiceSelection();
      } else if (analysis.intent === 'RESCHEDULE') {
        setBotState(BotState.RESCHEDULE_FIND);
        addMessage('bot', "Please provide your Booking ID (e.g., BK-1234) to proceed.");
      } else if (analysis.intent === 'CANCEL') {
        setBotState(BotState.CANCEL_FIND);
        addMessage('bot', "Please provide your Booking ID to cancel.");
      }
    } catch (error) {
       setIsTyping(false);
       addMessage('bot', "", (
         <ErrorMessage message="I'm having trouble connecting to my brain. Please check your internet connection and try again." onRetry={() => processInitialIntent(text)} />
       ));
    }
  };

  // --- Booking Flow Methods ---

  const startServiceSelection = async () => {
    setBotState(BotState.SELECT_SERVICE);
    await simulateBotTyping(500);
    addMessage('bot', "Please select a service category:", (
      <ServiceCarousel services={SERVICES} onSelect={confirmService} />
    ));
  };

  const confirmService = async (service: Service) => {
    setSelectedService(service);
    selectedServiceRef.current = service; // Update Ref
    
    addMessage('user', `Selected: ${service.name}`); 
    
    const relevantConsultants = CONSULTANTS.filter(c => c.serviceId === service.id);
    
    setBotState(BotState.SELECT_CONSULTANT);
    await simulateBotTyping(600);
    addMessage('bot', "Great choice. Do you have a preferred consultant?", (
      <ConsultantPicker consultants={relevantConsultants} onSelect={confirmConsultant} />
    ));
  };

  const confirmConsultant = async (consultant: Consultant) => {
    setSelectedConsultant(consultant);
    selectedConsultantRef.current = consultant; // Update Ref

    addMessage('user', `Selected: ${consultant.name}`);
    
    setBotState(BotState.SELECT_DATE);
    await simulateBotTyping(600);
    addMessage('bot', "When would you like to meet?", (
      <DatePicker onSelect={confirmDate} />
    ));
  };

  const confirmDate = async (date: Date) => {
    // Critical: Use Ref to access consultant, as state might be stale in this closure
    const currentConsultant = selectedConsultantRef.current;
    
    if (!currentConsultant) {
        console.error("Consultant not selected");
        addMessage('bot', "Something went wrong. Please select a consultant again.");
        return;
    }

    setSelectedDate(date);
    selectedDateRef.current = date; // Update Ref
    
    setBotState(BotState.FETCHING_SLOTS);
    await simulateBotTyping(500);
    addMessage('bot', "Checking availability...");
    
    try {
      const slots = await MockBackend.getAvailableSlots(currentConsultant.id, date);
      setAvailableSlots(slots);
      
      setBotState(BotState.SELECT_SLOT);
      addMessage('bot', `Available slots for ${currentConsultant.name} on ${format(date, 'MMM d')}:`, (
        <SlotPicker slots={slots} onSelect={confirmSlot} />
      ));
    } catch (error) {
      addMessage('bot', "", (
        <ErrorMessage 
          message="Failed to retrieve time slots. Please try again." 
          onRetry={() => confirmDate(date)} 
        />
      ));
      setBotState(BotState.SELECT_DATE);
    }
  };

  const confirmSlot = async (slot: TimeSlot) => {
    setSelectedSlot(slot);
    
    // Check if we are rescheduling using Ref
    if (bookingToModifyRef.current) {
        // Handle Reschedule Finalization
        const booking = bookingToModifyRef.current;
        const newDate = selectedDateRef.current;
        
        if (!newDate) return;

        await simulateBotTyping(800);
        try {
          const updated = await MockBackend.rescheduleBooking(booking.id, newDate, slot);
          if (updated) {
              setBotState(BotState.IDLE);
              // Reset refs
              bookingToModifyRef.current = null;
              setBookingToModify(null);

              addMessage('bot', "Your appointment has been successfully rescheduled.", (
                  <BookingSuccessCard booking={updated} />
              ));
          } else {
              throw new Error("Reschedule failed");
          }
        } catch (e) {
            addMessage('bot', "", (
                <ErrorMessage message="Unable to reschedule at this time." onRetry={() => confirmSlot(slot)} />
            ));
        }
        return;
    }

    // New Booking Flow
    setBotState(BotState.COLLECT_DETAILS);
    await simulateBotTyping(600);
    addMessage('bot', "Almost there! Please enter your full name, email, and phone number separated by commas (e.g., Wade Wilson, wade@xforce.com, 555-0100).");
  };

  const handleDetailsInput = async (text: string) => {
    const parts = text.split(',');
    if (parts.length < 3) {
      addMessage('bot', "I couldn't parse that. Please try format: Name, Email, Phone");
      return;
    }
    
    setUserDetails({
      name: parts[0].trim(),
      email: parts[1].trim(),
      phone: parts[2].trim()
    });

    setBotState(BotState.VERIFY_OTP);
    await simulateBotTyping(600);
    
    try {
        await MockBackend.sendOTP(parts[2].trim()); 
        addMessage('bot', `I've sent an OTP to ${parts[2].trim()}. Please enter the code (Hint: use 1234).`);
    } catch (e) {
        addMessage('bot', "", (
            <ErrorMessage message="Failed to send SMS. Please check the number." onRetry={() => handleDetailsInput(text)} />
        ));
    }
  };

  const handleOTPInput = async (text: string) => {
    try {
        const isValid = await MockBackend.verifyOTP(text.trim());
        if (!isValid) {
          addMessage('bot', "Invalid OTP. Please try again.");
          return;
        }
    
        setBotState(BotState.PROCESSING_PAYMENT);
        await simulateBotTyping(600);
        
        const currentService = selectedServiceRef.current;

        if (currentService) {
            addMessage('bot', "Verification successful. Please complete the payment to confirm.", (
                <PaymentForm 
                  amount={currentService.price} 
                  isProcessing={false} 
                  onPay={handlePaymentSuccess} 
                />
              ));
        }
    } catch (e) {
        addMessage('bot', "", (
            <ErrorMessage message="Verification service unavailable." onRetry={() => handleOTPInput(text)} />
        ));
    }
  };

  const handlePaymentSuccess = async () => {
    addMessage('user', "Payment processed.");
    await simulateBotTyping(1500);

    try {
        const currentService = selectedServiceRef.current;
        const currentConsultant = selectedConsultantRef.current;
        const currentDate = selectedDateRef.current;

        // Ensure we have all necessary data
        if (!currentService || !currentConsultant || !currentDate || !selectedSlot) {
             throw new Error("Missing booking details");
        }

        const { success, transactionId } = await MockBackend.processPayment(currentService.price, "valid_token");
        
        if (!success) {
            throw new Error("Transaction declined");
        }
        
        const booking = await MockBackend.createBooking(
        currentService,
        currentConsultant,
        currentDate,
        selectedSlot,
        userDetails,
        transactionId
        );
        
        setConfirmedBooking(booking);
        setBotState(BotState.CONFIRMED);
        
        addMessage('bot', "", (
        <BookingSuccessCard booking={booking} />
        ));
        
        // Cleanup for next loop
        setTimeout(() => {
            setBotState(BotState.IDLE);
            addMessage('bot', "Is there anything else I can help you with?");
        }, 6000);

    } catch (error) {
        // Payment Error Handling
        const errorMsg = error instanceof Error ? error.message : "Payment processing error";
        addMessage('bot', "", (
            <ErrorMessage 
                message={`${errorMsg}. Please ensure your card details are correct or try a different method.`}
                onRetry={handlePaymentSuccess}
            />
        ));
    }
  };

  // --- Reschedule / Cancel Logic ---

  const handleFindBooking = async (id: string) => {
    await simulateBotTyping(800);
    try {
        const booking = await MockBackend.getBooking(id.trim());
        
        if (!booking) {
          addMessage('bot', "I couldn't find a booking with that ID. Please check and try again, or type 'cancel' to exit.");
          return;
        }
    
        if (botState === BotState.CANCEL_FIND) {
            // Show Card
            addMessage('bot', "Found your booking:", (
                <GenericCard title="Cancel this booking?">
                    <div className="mb-4 text-sm text-zinc-300">
                        <p><strong>Service:</strong> {booking.service.name}</p>
                        <p><strong>Date:</strong> {format(new Date(booking.date), 'PP')} at {booking.slot.time}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => confirmCancellation(booking.id)} className="bg-red-600 hover:bg-red-700 text-white font-bold w-full py-2 rounded-lg" type="button">Yes, Cancel It</button>
                        <button onClick={() => { setBotState(BotState.IDLE); addMessage('bot', "Cancellation aborted."); }} className="bg-zinc-700 text-zinc-200 w-full py-2 rounded-lg hover:bg-zinc-600" type="button">Keep It</button>
                    </div>
                </GenericCard>
            ));
        } else if (botState === BotState.RESCHEDULE_FIND) {
            setBookingToModify(booking);
            bookingToModifyRef.current = booking; // Update Ref
            
            // Pre-fill context
            setSelectedConsultant(booking.consultant); 
            selectedConsultantRef.current = booking.consultant; // Update Ref

            setSelectedService(booking.service);
            selectedServiceRef.current = booking.service; // Update Ref
            
            addMessage('bot', `Rescheduling for ${booking.service.name} with ${booking.consultant.name}. Please select a new date:`, (
                 <DatePicker onSelect={confirmDate} />
            ));
            setBotState(BotState.RESCHEDULE_SELECT_NEW);
        }
    } catch (e) {
        addMessage('bot', "", (
            <ErrorMessage message="Could not retrieve booking details." onRetry={() => handleFindBooking(id)} />
        ));
    }
  };

  const confirmCancellation = async (id: string) => {
     await simulateBotTyping(800);
     try {
         const success = await MockBackend.cancelBooking(id);
         if (success) {
             addMessage('bot', "Your booking has been successfully cancelled. Refund initiated (if applicable).");
         } else {
             throw new Error("Cancellation failed");
         }
     } catch (e) {
         addMessage('bot', "", (
            <ErrorMessage message="Failed to cancel booking." onRetry={() => confirmCancellation(id)} />
         ));
     }
     setBotState(BotState.IDLE);
  };

  const handleOAuthLogin = () => {
    // Mock OAuth
    addMessage('user', "Connecting Google Calendar...");
    setTimeout(() => {
      addMessage('bot', "Google Calendar connected successfully! I can now sync your appointments.");
    }, 1500);
  };

  // --- Initial Render Effect ---
  useEffect(() => {
    if (messages.length > 0) return;
    
    addMessage('bot', "Hello! I'm Consultancy Deep Fox. I can help you book an appointment with our experts, reschedule existing bookings, or answer generic queries. How can I assist you today?", (
      <SuggestionChips 
        options={[
            "I need help with tax filing",
            "Book a legal consultation",
            "Reschedule my appointment",
            "Cancel a booking",
            "What services do you offer?"
        ]}
        onSelect={handleUserMessage} 
      />
    ));
  }, []);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-zinc-900 border-x border-zinc-800 shadow-2xl overflow-hidden">
      {/* Header */}
      <header className="p-4 bg-zinc-900 border-b border-red-600 flex justify-between items-center z-10 shadow-lg relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(220,38,38,0.3)] border border-red-500/30">
            {/* Robotic Fox Logo SVG */}
            <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                    <linearGradient id="foxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#DC2626" />
                        <stop offset="100%" stopColor="#FACC15" />
                    </linearGradient>
                </defs>
                <path d="M12 2L8 9L3 5L6 17L12 22L18 17L21 5L16 9L12 2Z" stroke="url(#foxGradient)" fill="#18181b" />
                <path d="M9 13L10.5 14" stroke="#FACC15" strokeWidth="1.5" />
                <path d="M15 13L13.5 14" stroke="#FACC15" strokeWidth="1.5" />
                <path d="M12 2V9" stroke="#DC2626" strokeWidth="1" />
                <circle cx="12" cy="18" r="1" fill="#DC2626" stroke="none" />
            </svg>
          </div>
          <div>
            <h1 className="font-extrabold text-zinc-100 text-lg tracking-tight uppercase italic">Consultancy <span className="text-red-500">Deep Fox</span></h1>
            <div className="flex items-center gap-1.5">
               <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.8)]"></span>
               <span className="text-xs text-zinc-400 font-medium">System Online</span>
            </div>
          </div>
        </div>
        <button onClick={handleOAuthLogin} className="text-xs font-bold uppercase bg-yellow-500 hover:bg-yellow-400 px-3 py-1.5 rounded-sm text-black transition-colors flex items-center gap-1 shadow-md">
           <Zap size={14} fill="currentColor" />
           Sync Cal
        </button>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-zinc-950 scrollbar-hide">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
            <div className={`max-w-[85%] sm:max-w-[70%] ${msg.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              
              {msg.text && (
                 <div className={`p-4 rounded-xl shadow-md text-sm leading-relaxed font-medium ${
                    msg.sender === 'user' 
                    ? 'bg-red-700 text-white rounded-br-none shadow-red-900/20' 
                    : 'bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-bl-none shadow-zinc-900/50'
                  }`}>
                    {msg.text}
                  </div>
              )}
              
              {/* Render Component Widget if exists */}
              {msg.component && (
                <div className="mt-2 w-full">
                  {msg.component}
                </div>
              )}

              <span className="text-[10px] text-zinc-600 px-1 font-mono uppercase">
                {format(msg.timestamp, 'h:mm a')}
              </span>
            </div>
          </div>
        ))}
        
        {isTyping && (
           <div className="flex justify-start animate-fade-in-up">
              <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1 h-12">
                 <div className="w-2 h-2 rounded-full typing-dot"></div>
                 <div className="w-2 h-2 rounded-full typing-dot"></div>
                 <div className="w-2 h-2 rounded-full typing-dot"></div>
              </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-zinc-900 border-t border-zinc-800">
        <div className="relative flex items-center gap-2 max-w-3xl mx-auto">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUserMessage()}
            placeholder={
                botState === BotState.COLLECT_DETAILS ? "Name, Email, Phone..." :
                botState === BotState.VERIFY_OTP ? "Enter 4-digit OTP..." :
                botState === BotState.RESCHEDULE_FIND ? "Enter Booking ID (e.g. BK-1234)..." :
                "Type a message..."
            }
            className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 text-sm rounded-xl py-3.5 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all placeholder:text-zinc-600"
          />
          <button 
            onClick={() => handleUserMessage()}
            disabled={!inputValue.trim() || isTyping}
            className="absolute right-2 p-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
            type="button"
          >
            <Send size={18} fill="currentColor" strokeWidth={2.5} />
          </button>
        </div>
        <div className="text-center mt-2">
            <p className="text-[10px] text-zinc-600 font-mono">
               {botState === BotState.IDLE ? "TRY: 'I NEED TAX HELP' or 'CANCEL BOOKING'" : "AWAITING INPUT..."}
            </p>
        </div>
      </div>
    </div>
  );
};

export default App;
