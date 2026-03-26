import React, { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Bell, 
  Calendar, 
  ShoppingBag, 
  ChevronRight,
  Info,
  CheckCircle2,
  AlertCircle,
  Search,
  User,
  Settings,
  Edit2,
  Save,
  X,
  Calculator,
  Home,
  Utensils,
  Fuel,
  Plane,
  HeartPulse,
  Coffee,
  Palette,
  Check,
  Smile,
  Zap,
  Star,
  Ghost,
  Cat,
  Dog,
  Gamepad2,
  Music,
  Smartphone,
  Download,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, Benefit, Reminder } from './types';
import { BENEFITS_DATABASE } from './data/benefitsData';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_ES: Record<string, string> = {
  'Sunday': 'Domingo',
  'Monday': 'Lunes',
  'Tuesday': 'Martes',
  'Wednesday': 'Miércoles',
  'Thursday': 'Jueves',
  'Friday': 'Viernes',
  'Saturday': 'Sábado',
  'Everyday': 'Todos los días'
};

interface UserProfile {
  id: number;
  name: string;
  email: string;
  main_bank?: string;
  favorite_categories?: string;
  profile_color?: string;
  profile_icon?: string;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// --- Sub-components ---

type AppTab = 'benefits' | 'cards' | 'reminders' | 'calculator';

interface CalculatorTabProps {
  calcPrice: string;
  setCalcPrice: (val: string) => void;
  calcDiscount: string;
  setCalcDiscount: (val: string) => void;
}

const CalculatorTab: React.FC<CalculatorTabProps> = ({ calcPrice, setCalcPrice, calcDiscount, setCalcDiscount }) => (
  <section className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm max-w-lg mx-auto">
    <div className="text-center mb-8">
      <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <ShoppingBag className="w-8 h-8 text-indigo-600" />
      </div>
      <h2 className="text-2xl font-bold">Calculadora de Descuentos</h2>
      <p className="text-neutral-500 text-sm mt-1">Descubre cuánto pagarás realmente</p>
    </div>

    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Precio Original ($)</label>
        <input 
          type="number"
          placeholder="Ej: 50000"
          className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-medium"
          value={calcPrice}
          onChange={e => setCalcPrice(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Descuento (%)</label>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[10, 20, 30, 40].map(pct => (
            <button 
              key={pct}
              onClick={() => setCalcDiscount(pct.toString())}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${calcDiscount === pct.toString() ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
            >
              {pct}%
            </button>
          ))}
        </div>
        <input 
          type="number"
          placeholder="Ej: 30"
          className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-medium"
          value={calcDiscount}
          onChange={e => setCalcDiscount(e.target.value)}
        />
      </div>

      <div className="pt-6 border-t border-neutral-100">
        <div className="bg-indigo-50 p-6 rounded-2xl text-center">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Precio Final a Pagar</p>
          <p className="text-4xl font-black text-indigo-900">
            ${(Number(calcPrice) * (1 - (Number(calcDiscount) || 0) / 100)).toLocaleString('es-CL', { maximumFractionDigits: 0 })}
          </p>
          {calcPrice && calcDiscount && (
            <p className="text-xs text-indigo-400 mt-2 italic">
              Ahorraste ${(Number(calcPrice) * (Number(calcDiscount) / 100)).toLocaleString('es-CL', { maximumFractionDigits: 0 })}
            </p>
          )}
        </div>
      </div>
      
      <button 
        onClick={() => { setCalcPrice(''); setCalcDiscount(''); }}
        className="w-full py-3 text-neutral-400 text-sm font-medium hover:text-neutral-600 transition-colors"
      >
        Limpiar Calculadora
      </button>
    </div>
  </section>
);

interface BenefitsTabProps {
  viewMode: string;
  setViewMode: (mode: string) => void;
  today: string;
  selectedCard: Card | undefined;
  setSelectedCardId: (id: number | null) => void;
  benefits: Benefit[];
  cards: Card[];
  setActiveTab: (tab: AppTab) => void;
  setShowAddCard: (show: boolean) => void;
  profile: UserProfile | null;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  handleReportBenefit: (id: number) => void;
}

const BenefitsTab: React.FC<BenefitsTabProps> = ({ 
  viewMode, setViewMode, today, selectedCard, setSelectedCardId, benefits, cards, setActiveTab, setShowAddCard, profile, searchTerm, setSearchTerm, handleReportBenefit 
}) => {
  const [reportingBenefitId, setReportingBenefitId] = useState<number | null>(null);
  const bestBenefitIds = useMemo(() => {
    const bestMap: Record<string, Benefit> = {};
    
    benefits.forEach(benefit => {
      const currentBest = bestMap[benefit.store_name];
      if (!currentBest) {
        bestMap[benefit.store_name] = benefit;
      } else {
        if (benefit.discount_percentage > currentBest.discount_percentage) {
          bestMap[benefit.store_name] = benefit;
        } else if (benefit.discount_percentage === currentBest.discount_percentage) {
          // Tie-breaker: Main Bank
          if (profile?.main_bank && benefit.bank_name === profile.main_bank && currentBest.bank_name !== profile.main_bank) {
            bestMap[benefit.store_name] = benefit;
          }
        }
      }
    });
    
    return new Set(Object.values(bestMap).map(b => b.id));
  }, [benefits, profile]);

  return (
  <section id="benefits-section">
    <div className="mb-6 relative sticky top-[73px] md:top-0 z-20 bg-neutral-50/80 backdrop-blur-md py-2">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
      <input 
        type="text"
        placeholder="Buscar por tienda o categoría..."
        className="w-full pl-12 pr-10 py-4 bg-white border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />
      {searchTerm && (
        <button 
          onClick={() => setSearchTerm('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-neutral-400" />
        </button>
      )}
    </div>

    <div className="flex flex-col mb-6 gap-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          {viewMode === 'today' ? `Beneficios de Hoy (${DAYS_ES[today]})` : `Beneficios: ${DAYS_ES[viewMode] || viewMode}`}
        </h2>
        {selectedCard && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              Filtrado por: {selectedCard.bank_name} - {selectedCard.card_name}
              <button onClick={() => setSelectedCardId(null)} className="hover:text-indigo-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <button 
          onClick={() => setViewMode('today')}
          className={`flex-shrink-0 px-4 py-2 text-xs font-bold rounded-xl transition-all border-2 ${viewMode === 'today' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-neutral-100 text-neutral-500 hover:border-neutral-200'}`}
        >
          Hoy
        </button>
        {(() => {
          const daysOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const todayIndex = daysOrder.indexOf(today);
          const orderedDays = [];
          for (let i = 1; i < 7; i++) {
            orderedDays.push(daysOrder[(todayIndex + i) % 7]);
          }
          return orderedDays.map((day) => (
            <button 
              key={day}
              onClick={() => setViewMode(day)}
              className={`flex-shrink-0 px-4 py-2 text-xs font-bold rounded-xl transition-all border-2 ${viewMode === day ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-neutral-100 text-neutral-500 hover:border-neutral-200'}`}
            >
              {DAYS_ES[day]}
            </button>
          ));
        })()}
      </div>
    </div>
    
    <AnimatePresence mode="wait">
      {benefits.length > 0 ? (
        <motion.div 
          key={selectedCard?.id || 'all'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {benefits.map(benefit => {
            const isBest = bestBenefitIds.has(benefit.id);
            const isReported = (benefit.reports || 0) > 3;
            
            return (
              <motion.div 
                key={benefit.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: isReported ? 0.6 : 1, scale: 1 }}
                className={`bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all relative overflow-hidden ${isBest ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-neutral-200'}`}
              >
                {isBest && (
                  <div className="absolute top-0 left-0 bg-emerald-500 text-white px-3 py-1 text-[9px] font-black rounded-br-xl z-10 shadow-sm flex items-center gap-1 uppercase tracking-tighter">
                    <Zap className="w-2.5 h-2.5 fill-white" />
                    MEJOR OPCIÓN
                  </div>
                )}
                {isReported && (
                  <div className="absolute top-0 left-0 bg-red-500 text-white px-3 py-1 text-[9px] font-black rounded-br-xl z-10 shadow-sm flex items-center gap-1 uppercase tracking-tighter">
                    <ShieldAlert className="w-2.5 h-2.5 fill-white" />
                    EN REVISIÓN
                  </div>
                )}
                {viewMode !== 'today' && viewMode !== benefit.day_of_week && (
                  <div className="absolute top-0 right-0 bg-neutral-100 px-3 py-1 text-[10px] font-bold text-neutral-500 rounded-bl-xl border-l border-b border-neutral-200">
                    {DAYS_ES[benefit.day_of_week]}
                  </div>
                )}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col gap-1">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase tracking-wider w-fit">
                      {benefit.bank_name}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded w-fit ${
                      benefit.card_type === 'credit' ? 'bg-amber-100 text-amber-700' : 
                      benefit.card_type === 'debit' ? 'bg-blue-100 text-blue-700' : 
                      'bg-neutral-100 text-neutral-600'
                    }`}>
                      {benefit.card_type === 'credit' ? 'CRÉDITO' : 
                       benefit.card_type === 'debit' ? 'DÉBITO' : 'CRÉDITO/DÉBITO'}
                    </span>
                  </div>
                  <span className="text-2xl font-black text-indigo-600">
                    {benefit.discount_percentage}%
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1">{benefit.store_name}</h3>
                <p className="text-neutral-600 text-sm mb-4">{benefit.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <ShoppingBag className="w-3 h-3" />
                    <span>{benefit.category}</span>
                  </div>
                  <button 
                    onClick={() => setReportingBenefitId(benefit.id)}
                    className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 hover:text-red-500 transition-colors"
                  >
                    <ShieldAlert className="w-3 h-3" />
                    ¿No funcionó?
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <motion.div 
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-white border border-dashed border-neutral-300 rounded-2xl p-12 text-center"
        >
          <div className="bg-neutral-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-neutral-400" />
          </div>
          <p className="text-neutral-500 font-medium">
            {searchTerm 
              ? `No encontramos resultados para "${searchTerm}"`
              : cards.length === 0 
                ? "Agrega tus tarjetas para descubrir tus beneficios." 
                : `No hay beneficios específicos para tus tarjetas ${viewMode === 'today' ? 'hoy' : `el día ${DAYS_ES[viewMode] || viewMode}`}.`}
          </p>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-4 text-indigo-600 font-bold text-sm hover:underline"
            >
              Limpiar búsqueda
            </button>
          )}
          {cards.length === 0 && !searchTerm && (
            <button 
              onClick={() => {
                setActiveTab('cards');
                setShowAddCard(true);
              }}
              className="mt-4 text-indigo-600 font-bold text-sm hover:underline"
            >
              + Agregar mi primera tarjeta
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>

    {/* Report Modal */}
    <AnimatePresence>
      {reportingBenefitId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center"
          >
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">¿Reportar beneficio?</h3>
            <p className="text-neutral-500 text-sm mb-8">
              Si este descuento no funcionó o la información es incorrecta, avísanos para revisarlo.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setReportingBenefitId(null)}
                className="flex-1 py-3 font-bold text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  handleReportBenefit(reportingBenefitId);
                  setReportingBenefitId(null);
                }}
                className="flex-[2] bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-100"
              >
                Reportar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </section>
  );
};

interface CardsTabProps {
  cards: Card[];
  selectedCardId: number | null;
  setSelectedCardId: (id: number | null) => void;
  setActiveTab: (tab: AppTab) => void;
  setViewMode: (mode: string) => void;
  setEditingCardId: (id: number | null) => void;
  setNewCard: (card: { bank_name: string; card_type: string; card_name: string }) => void;
  setShowAddCard: (show: boolean) => void;
  openEditCard: (card: Card) => void;
  deleteCard: (id: number) => void;
}

const CardsTab: React.FC<CardsTabProps> = ({ 
  cards, selectedCardId, setSelectedCardId, setActiveTab, setViewMode, setEditingCardId, setNewCard, setShowAddCard, openEditCard, deleteCard 
}) => {
  const getBankCardStyle = (bankName: string) => {
    switch (bankName) {
      case 'Banco de Chile':
        return 'bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900 border-yellow-400/30';
      case 'Santander':
        return 'bg-gradient-to-br from-red-600 to-red-700 border-white/20';
      case 'BCI':
        return 'bg-gradient-to-br from-sky-600 to-sky-800 border-white/20';
      case 'Banco Estado':
        return 'bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 border-yellow-400/40';
      case 'Scotiabank':
        return 'bg-gradient-to-br from-red-700 to-neutral-800 border-white/20';
      case 'Itaú':
        return 'bg-gradient-to-br from-orange-500 to-orange-600 border-white/20';
      case 'Falabella':
        return 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-white/20';
      case 'Ripley':
        return 'bg-gradient-to-br from-purple-700 to-neutral-900 border-white/20';
      case 'Cencosud':
        return 'bg-gradient-to-br from-blue-600 to-emerald-500 border-white/20';
      case 'Lider BCI':
        return 'bg-gradient-to-br from-blue-700 to-blue-800 border-yellow-400/30';
      case 'Tenpo':
        return 'bg-gradient-to-br from-purple-600 to-pink-500 border-white/20';
      case 'Mach':
        return 'bg-gradient-to-br from-indigo-600 to-purple-600 border-white/20';
      default:
        return 'bg-gradient-to-br from-neutral-800 to-neutral-900 border-white/10';
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-indigo-600" />
          Mis Tarjetas
        </h2>
        <button 
          onClick={() => {
            setEditingCardId(null);
            setNewCard({ bank_name: '', card_type: 'credit', card_name: '' });
            setShowAddCard(true);
          }}
          className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Agregar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(card => (
          <motion.div 
            key={card.id}
            layout
            onClick={() => {
              const newId = selectedCardId === card.id ? null : card.id;
              setSelectedCardId(newId);
              if (newId) {
                setActiveTab('benefits');
                setViewMode('all');
              }
            }}
            className={`${getBankCardStyle(card.bank_name)} text-white p-5 rounded-2xl shadow-lg relative overflow-hidden group cursor-pointer transition-all border-2 ${
              selectedCardId === card.id ? 'ring-4 ring-indigo-500/40 scale-[1.02] border-white' : 'border-transparent'
            }`}
          >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CreditCard className="w-24 h-24" />
          </div>
          {selectedCardId === card.id && (
            <div className="absolute top-2 right-2 z-20">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
            </div>
          )}
          <div className="relative z-10 flex flex-col h-full justify-between min-h-[120px]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-60 mb-1">{card.bank_name}</p>
              <h3 className="font-bold text-lg leading-tight">{card.card_name}</h3>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-xs opacity-60 capitalize">{card.card_type === 'credit' ? 'Crédito' : 'Débito'}</span>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditCard(card);
                  }}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCard(card.id);
                  }}
                  className="p-1.5 bg-white/10 hover:bg-red-500/80 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
      {cards.length === 0 && (
        <div className="col-span-full bg-white border border-dashed border-neutral-300 rounded-2xl p-8 text-center">
          <p className="text-neutral-500">Aún no has agregado tarjetas.</p>
        </div>
      )}
    </div>
    </section>
  );
};

interface ReminderWithMatch extends Reminder {
  match?: Benefit;
}

interface RemindersTabProps {
  reminders: ReminderWithMatch[];
  deleteReminder: (id: number) => void;
  setShowAddReminder: (show: boolean) => void;
}

const RemindersTab: React.FC<RemindersTabProps> = ({ reminders, deleteReminder, setShowAddReminder }) => (
  <section>
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Bell className="w-5 h-5 text-indigo-600" />
        Lista de Deseos y Recordatorios
      </h2>
      <button 
        onClick={() => setShowAddReminder(true)}
        className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1"
      >
        <Plus className="w-4 h-4" /> Nuevo
      </button>
    </div>

    <div className="space-y-3">
      {reminders.map(reminder => (
        <motion.div 
          key={reminder.id}
          className="bg-white p-4 rounded-xl border border-neutral-200 flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-full ${reminder.match ? 'bg-green-50' : 'bg-neutral-50'}`}>
              {reminder.match ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-neutral-400" />
              )}
            </div>
            <div>
              <h4 className="font-bold">{reminder.item_name}</h4>
              <p className="text-sm text-neutral-500">{reminder.store_name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {reminder.match ? (
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-green-600 uppercase">¡Descuento Disponible!</p>
                <p className="text-[10px] text-neutral-400">Los {DAYS_ES[reminder.match.day_of_week]}</p>
              </div>
            ) : (
              <div className="text-right hidden sm:block">
                <p className="text-xs text-neutral-400 italic">Esperando descuento...</p>
              </div>
            )}
            <button 
              onClick={() => deleteReminder(reminder.id)}
              className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ))}
      {reminders.length === 0 && (
        <div className="bg-white border border-dashed border-neutral-300 rounded-2xl p-8 text-center">
          <p className="text-neutral-500">No tienes recordatorios pendientes.</p>
        </div>
      )}
    </div>
  </section>
);

interface AddCardModalProps {
  showAddCard: boolean;
  setShowAddCard: (show: boolean) => void;
  editingCardId: number | null;
  newCard: { bank_name: string; card_type: string; card_name: string };
  setNewCard: (card: { bank_name: string; card_type: string; card_name: string }) => void;
  handleSaveCard: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

const AddCardModal: React.FC<AddCardModalProps> = ({ 
  showAddCard, setShowAddCard, editingCardId, newCard, setNewCard, handleSaveCard, isSubmitting 
}) => (
  <AnimatePresence>
    {showAddCard && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">{editingCardId ? 'Editar Tarjeta' : 'Agregar Nueva Tarjeta'}</h3>
            <button onClick={() => setShowAddCard(false)} className="p-2 hover:bg-neutral-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSaveCard} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Banco</label>
              <select 
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                value={newCard.bank_name}
                onChange={e => setNewCard({ ...newCard, bank_name: e.target.value })}
                required
              >
                <option value="">Selecciona un banco</option>
                <option value="Banco de Chile">Banco de Chile</option>
                <option value="Santander">Santander</option>
                <option value="BCI">BCI</option>
                <option value="Scotiabank">Scotiabank</option>
                <option value="Itaú">Itaú</option>
                <option value="Banco Estado">Banco Estado</option>
                <option value="Falabella">Falabella</option>
                <option value="Ripley">Ripley</option>
                <option value="Cencosud">Cencosud</option>
                <option value="Lider BCI">Lider BCI</option>
                <option value="Tenpo">Tenpo</option>
                <option value="Mach">Mach</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre de la Tarjeta</label>
              <input 
                type="text"
                placeholder="Ej: Visa Signature"
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                value={newCard.card_name}
                onChange={e => setNewCard({ ...newCard, card_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={() => setNewCard({ ...newCard, card_type: 'credit' })}
                  className={`py-2 rounded-xl text-sm font-bold transition-all ${newCard.card_type === 'credit' ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-600'}`}
                >
                  Crédito
                </button>
                <button 
                  type="button"
                  onClick={() => setNewCard({ ...newCard, card_type: 'debit' })}
                  className={`py-2 rounded-xl text-sm font-bold transition-all ${newCard.card_type === 'debit' ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-600'}`}
                >
                  Débito
                </button>
              </div>
            </div>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold mt-4 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                editingCardId ? 'Guardar Cambios' : 'Agregar Tarjeta'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

interface AddReminderModalProps {
  showAddReminder: boolean;
  setShowAddReminder: (show: boolean) => void;
  newReminder: { item_name: string; store_name: string };
  setNewReminder: (rem: { item_name: string; store_name: string }) => void;
  addReminder: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

const AddReminderModal: React.FC<AddReminderModalProps> = ({ 
  showAddReminder, setShowAddReminder, newReminder, setNewReminder, addReminder, isSubmitting 
}) => (
  <AnimatePresence>
    {showAddReminder && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Nuevo Recordatorio</h3>
            <button onClick={() => setShowAddReminder(false)} className="p-2 hover:bg-neutral-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={addReminder} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">¿Qué quieres comprar?</label>
              <input 
                type="text"
                placeholder="Ej: Zapatillas"
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                value={newReminder.item_name}
                onChange={e => setNewReminder({ ...newReminder, item_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">¿En qué tienda?</label>
              <input 
                type="text"
                placeholder="Ej: Adidas"
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                value={newReminder.store_name}
                onChange={e => setNewReminder({ ...newReminder, store_name: e.target.value })}
                required
              />
            </div>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold mt-4 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Recordatorio'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

interface ProfileModalProps {
  showProfile: boolean;
  setShowProfile: (show: boolean) => void;
  editProfile: UserProfile;
  setEditProfile: (profile: UserProfile) => void;
  handleSaveProfile: (e?: React.FormEvent) => void;
  handleResetData: () => void;
  getProfileIcon: (name: string | undefined, className?: string) => React.ReactNode;
  isSubmitting: boolean;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ 
  showProfile, setShowProfile, editProfile, setEditProfile, handleSaveProfile, handleResetData, getProfileIcon, isSubmitting 
}) => (
  <AnimatePresence>
    {showProfile && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Mi Perfil</h3>
            <button onClick={() => setShowProfile(false)} className="p-2 hover:bg-neutral-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex flex-col items-center mb-8">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center text-white shadow-lg mb-4 relative group"
              style={{ backgroundColor: editProfile.profile_color }}
            >
              {getProfileIcon(editProfile.profile_icon, "w-12 h-12")}
            </div>
            <h4 className="font-bold text-lg">{editProfile.name}</h4>
            <p className="text-sm text-neutral-500">{editProfile.email}</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">Estilo de Perfil</label>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {['User', 'Smile', 'Zap', 'Star', 'Ghost', 'Cat', 'Dog', 'Gamepad2'].map(icon => (
                  <button 
                    key={icon}
                    onClick={() => setEditProfile({ ...editProfile, profile_icon: icon })}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center ${editProfile.profile_icon === icon ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-neutral-100 text-neutral-400 hover:border-neutral-200'}`}
                  >
                    {getProfileIcon(icon, "w-6 h-6")}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {['#4F46E5', '#EF4444', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#111827'].map(color => (
                  <button 
                    key={color}
                    onClick={() => setEditProfile({ ...editProfile, profile_color: color })}
                    className={`w-8 h-8 rounded-full flex-shrink-0 border-2 transition-all ${editProfile.profile_color === color ? 'border-white ring-2 ring-indigo-500 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre</label>
              <input 
                type="text"
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                value={editProfile.name}
                onChange={e => setEditProfile({ ...editProfile, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Banco Principal</label>
              <input 
                type="text"
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                value={editProfile.main_bank}
                onChange={e => setEditProfile({ ...editProfile, main_bank: e.target.value })}
              />
            </div>
            
            <div className="pt-4 space-y-3">
              <button 
                onClick={() => handleSaveProfile()}
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Guardar Cambios
                  </>
                )}
              </button>
              <button 
                onClick={handleResetData}
                className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" /> Borrar Todos los Datos
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

interface OnboardingFlowProps {
  showWelcome: boolean;
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
  editProfile: UserProfile;
  setEditProfile: (profile: UserProfile) => void;
  rememberMe: boolean;
  setRememberMe: (rem: boolean) => void;
  handleSaveProfile: () => void;
  getProfileIcon: (name: string | undefined, className?: string) => React.ReactNode;
  isSubmitting: boolean;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ 
  showWelcome, onboardingStep, setOnboardingStep, editProfile, setEditProfile, rememberMe, setRememberMe, handleSaveProfile, getProfileIcon, isSubmitting 
}) => (
  <AnimatePresence>
    {showWelcome && (
      <div className="fixed inset-0 bg-white z-[60] flex flex-col overflow-y-auto">
        <div className="max-w-md mx-auto w-full px-8 py-12 flex flex-col min-h-screen">
          <div className="flex justify-center mb-12">
            <div className="bg-indigo-600 p-4 rounded-3xl shadow-xl shadow-indigo-200">
              <CreditCard className="text-white w-10 h-10" />
            </div>
          </div>

          <div className="flex-1">
            <AnimatePresence mode="wait">
              {onboardingStep === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-neutral-900 mb-2">¡Bienvenido!</h2>
                    <p className="text-neutral-500">Comencemos configurando tu perfil para ahorrar más.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-2">¿Cómo te llamas?</label>
                    <input 
                      type="text"
                      placeholder="Tu nombre"
                      className="w-full p-5 bg-neutral-100 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none text-xl font-bold transition-all"
                      value={editProfile.name}
                      onChange={e => setEditProfile({ ...editProfile, name: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                    <input 
                      type="checkbox" 
                      id="remember"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="remember" className="text-sm text-neutral-600 font-medium">Recordar mi usuario en este dispositivo</label>
                  </div>
                  <button 
                    onClick={() => setOnboardingStep(2)}
                    disabled={!editProfile.name}
                    className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 disabled:opacity-50 disabled:shadow-none transition-all"
                  >
                    Continuar
                  </button>
                </motion.div>
              )}

              {onboardingStep === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-neutral-900 mb-2">Tu Banco</h2>
                    <p className="text-neutral-500">¿Cuál es tu banco principal?</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {['Banco de Chile', 'Santander', 'BCI', 'Scotiabank', 'Itaú', 'Banco Estado', 'Falabella', 'Ripley', 'Cencosud', 'Lider BCI', 'Tenpo', 'Mach'].map(bank => (
                      <button 
                        key={bank}
                        onClick={() => setEditProfile({ ...editProfile, main_bank: bank })}
                        className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all ${editProfile.main_bank === bank ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-neutral-100 hover:border-neutral-200 text-neutral-500'}`}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-8">
                    <button onClick={() => setOnboardingStep(1)} className="flex-1 py-5 font-bold text-neutral-400">Atrás</button>
                    <button 
                      onClick={() => setOnboardingStep(3)}
                      disabled={!editProfile.main_bank}
                      className="flex-[2] bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 disabled:opacity-50 transition-all"
                    >
                      Siguiente
                    </button>
                  </div>
                </motion.div>
              )}

              {onboardingStep === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-neutral-900 mb-2">Tus Gustos</h2>
                    <p className="text-neutral-500">¿En qué categorías sueles comprar más?</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'food', label: 'Comida', icon: <Utensils className="w-5 h-5" /> },
                      { id: 'fuel', label: 'Bencina', icon: <Fuel className="w-5 h-5" /> },
                      { id: 'travel', label: 'Viajes', icon: <Plane className="w-5 h-5" /> },
                      { id: 'health', label: 'Salud', icon: <HeartPulse className="w-5 h-5" /> },
                      { id: 'coffee', label: 'Café', icon: <Coffee className="w-5 h-5" /> },
                      { id: 'shopping', label: 'Shopping', icon: <ShoppingBag className="w-5 h-5" /> }
                    ].map(cat => (
                      <button 
                        key={cat.id}
                        onClick={() => {
                          const cats = editProfile.favorite_categories?.split(',').filter(Boolean) || [];
                          const newCats = cats.includes(cat.id) ? cats.filter(c => c !== cat.id) : [...cats, cat.id];
                          setEditProfile({ ...editProfile, favorite_categories: newCats.join(',') });
                        }}
                        className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all flex flex-col items-center gap-2 ${editProfile.favorite_categories?.includes(cat.id) ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-neutral-100 hover:border-neutral-200 text-neutral-500'}`}
                      >
                        {cat.icon}
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-8">
                    <button onClick={() => setOnboardingStep(2)} className="flex-1 py-5 font-bold text-neutral-400">Atrás</button>
                    <button 
                      onClick={() => setOnboardingStep(4)}
                      className="flex-[2] bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 transition-all"
                    >
                      Siguiente
                    </button>
                  </div>
                </motion.div>
              )}

              {onboardingStep === 4 && (
                <motion.div 
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-neutral-900 mb-2">Tu Estilo</h2>
                    <p className="text-neutral-500">Personaliza cómo te verás en la app.</p>
                  </div>
                  
                  <div className="flex justify-center mb-8">
                    <div 
                      className="w-24 h-24 rounded-full flex items-center justify-center text-white shadow-xl"
                      style={{ backgroundColor: editProfile.profile_color }}
                    >
                      {getProfileIcon(editProfile.profile_icon, "w-12 h-12")}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-3">Elige un Icono</label>
                    <div className="grid grid-cols-4 gap-3">
                      {['User', 'Smile', 'Zap', 'Star', 'Ghost', 'Cat', 'Dog', 'Gamepad2'].map(icon => (
                        <button 
                          key={icon}
                          onClick={() => setEditProfile({ ...editProfile, profile_icon: icon })}
                          className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center ${editProfile.profile_icon === icon ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-neutral-100 text-neutral-400 hover:border-neutral-200'}`}
                        >
                          {getProfileIcon(icon, "w-6 h-6")}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-3">Elige un Color</label>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {['#4F46E5', '#EF4444', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#111827'].map(color => (
                        <button 
                          key={color}
                          onClick={() => setEditProfile({ ...editProfile, profile_color: color })}
                          className={`w-10 h-10 rounded-full flex-shrink-0 border-4 transition-all ${editProfile.profile_color === color ? 'border-white ring-2 ring-indigo-500 scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button onClick={() => setOnboardingStep(3)} className="flex-1 py-5 font-bold text-neutral-400">Atrás</button>
                    <button 
                      onClick={() => handleSaveProfile()}
                      disabled={isSubmitting}
                      className="flex-[2] bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        '¡Listo!'
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    )}
  </AnimatePresence>
);

export default function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [showAddCard, setShowAddCard] = useState(false);
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [newCard, setNewCard] = useState({ bank_name: '', card_type: 'credit', card_name: '' });
  
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminder, setNewReminder] = useState({ item_name: '', store_name: '' });

  const [showProfile, setShowProfile] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [rememberMe, setRememberMe] = useState(true);
  const [editProfile, setEditProfile] = useState<UserProfile>({ 
    id: 1,
    name: '', 
    email: '', 
    main_bank: '', 
    favorite_categories: '', 
    profile_color: '#4F46E5',
    profile_icon: 'User'
  });
  const [viewMode, setViewMode] = useState<string>('today');
  const [activeTab, setActiveTab] = useState<AppTab>('benefits');

  // PWA State
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Calculator State
  const [calcPrice, setCalcPrice] = useState<string>('');
  const [calcDiscount, setCalcDiscount] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = DAYS[new Date().getDay()];

  const selectedCard = cards.find(c => c.id === selectedCardId);

  useEffect(() => {
    fetchData();

    // PWA Install Logic
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      const dismissed = localStorage.getItem('beneficard_pwa_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install');
    }
    
    setDeferredPrompt(null);
    setShowInstallBanner(false);
    localStorage.setItem('beneficard_pwa_dismissed', 'true');
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('beneficard_pwa_dismissed', 'true');
  };

  useEffect(() => {
    const remembered = localStorage.getItem('beneficard_remember_user') === 'true';
    if (profile && (profile.name === 'Usuario Demo' || !remembered)) {
      setShowWelcome(true);
    }
  }, [profile]);

  useEffect(() => {
    if (selectedCardId) {
      const element = document.getElementById('benefits-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [selectedCardId]);

  const getProfileIcon = (iconName: string | undefined, className: string = "w-5 h-5") => {
    switch (iconName) {
      case 'Smile': return <Smile className={className} />;
      case 'Zap': return <Zap className={className} />;
      case 'Star': return <Star className={className} />;
      case 'Ghost': return <Ghost className={className} />;
      case 'Cat': return <Cat className={className} />;
      case 'Dog': return <Dog className={className} />;
      case 'Gamepad2': return <Gamepad2 className={className} />;
      case 'Music': return <Music className={className} />;
      default: return <User className={className} />;
    }
  };

  const fetchData = async () => {
    try {
      const [cardsRes, remindersRes, profileRes, benefitsRes] = await Promise.all([
        fetch('/api/user/cards'),
        fetch('/api/user/reminders'),
        fetch('/api/user/profile'),
        fetch('/api/benefits')
      ]);
      
      const cardsData = await cardsRes.json();
      const remindersData = await remindersRes.json();
      const profileData = await profileRes.json();
      const benefitsData = await benefitsRes.json();
      
      setCards(cardsData);
      setBenefits(benefitsData);
      setReminders(remindersData);
      setProfile(profileData);
      setEditProfile({ 
        name: profileData.name, 
        email: profileData.email,
        main_bank: profileData.main_bank || '',
        favorite_categories: profileData.favorite_categories || '',
        profile_color: profileData.profile_color || '#4F46E5',
        profile_icon: profileData.profile_icon || 'User'
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingCardId ? `/api/user/cards/${editingCardId}` : '/api/user/cards';
      const method = editingCardId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCard)
      });

      if (res.ok) {
        fetchData();
        setShowAddCard(false);
        setEditingCardId(null);
        setNewCard({ bank_name: '', card_type: 'credit', card_name: '' });
      }
    } catch (err) {
      console.error("Error saving card:", err);
      alert("Error al guardar la tarjeta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditCard = (card: Card) => {
    setEditingCardId(card.id);
    setNewCard({ 
      bank_name: card.bank_name, 
      card_type: card.card_type, 
      card_name: card.card_name 
    });
    setShowAddCard(true);
  };

  const deleteCard = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta tarjeta?')) {
      // Optimistic update for immediate UI response
      const previousCards = [...cards];
      setCards(prev => prev.filter(c => c.id !== id));
      if (selectedCardId === id) setSelectedCardId(null);

      try {
        const res = await fetch(`/api/user/cards/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          // Rollback on failure
          setCards(previousCards);
          alert("No se pudo eliminar la tarjeta en el servidor.");
        }
      } catch (err) {
        console.error("Error deleting card:", err);
        setCards(previousCards);
        alert("Error de red al intentar eliminar la tarjeta.");
      }
    }
  };

  const addReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/user/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReminder)
      });
      if (res.ok) {
        fetchData();
        setShowAddReminder(false);
        setNewReminder({ item_name: '', store_name: '' });
      }
    } catch (err) {
      console.error("Error adding reminder:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteReminder = async (id: number) => {
    try {
      const res = await fetch(`/api/user/reminders/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Error deleting reminder:", err);
    }
  };

  const handleReportBenefit = async (id: number) => {
    try {
      // Optimistic update
      setBenefits(prev => prev.map(b => b.id === id ? { ...b, reports: (b.reports || 0) + 1 } : b));
      
      const res = await fetch(`/api/benefits/${id}/report`, { method: 'POST' });
      if (!res.ok) {
        // Rollback or just fetch again
        fetchData();
      }
    } catch (err) {
      console.error("Error reporting benefit:", err);
      fetchData();
    }
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProfile)
      });
      if (res.ok) {
        // Automatically add the main bank as a card if the user has no cards yet
        if (cards.length === 0 && editProfile.main_bank) {
          try {
            const cardRes = await fetch('/api/user/cards', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bank_name: editProfile.main_bank,
                card_type: 'credit', // Default to credit as it's common for benefits
                card_name: `Mi Tarjeta ${editProfile.main_bank}`
              })
            });
            if (cardRes.ok) {
              const cardData = await cardRes.json();
              if (cardData.id) {
                setSelectedCardId(cardData.id);
              }
            }
          } catch (cardErr) {
            console.error("Error auto-adding card:", cardErr);
          }
        }

        if (rememberMe) {
          localStorage.setItem('beneficard_remember_user', 'true');
        } else {
          localStorage.removeItem('beneficard_remember_user');
        }
        fetchData();
        setActiveTab('benefits');
        setShowProfile(false);
        setShowWelcome(false);
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Error al guardar el perfil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetData = async () => {
    if (confirm('¿Estás seguro de que quieres borrar todos tus datos? Esta acción no se puede deshacer.')) {
      localStorage.removeItem('beneficard_remember_user');
      await fetch('/api/user/reset', { method: 'POST' });
      setOnboardingStep(1);
      fetchData();
      setShowProfile(false);
    }
  };

  const myBenefits = useMemo(() => {
    let filtered = benefits;

    // Filter by search term
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(b => 
        b.store_name.toLowerCase().includes(lowerTerm) || 
        b.category.toLowerCase().includes(lowerTerm)
      );
    }

    if (selectedCardId) {
      const selectedCard = cards.find(c => c.id === selectedCardId);
      if (!selectedCard) return [];
      return filtered.filter(b => 
        b.bank_name === selectedCard.bank_name && 
        (b.card_type === 'both' || b.card_type === selectedCard.card_type)
      );
    }
    return filtered.filter(b => 
      cards.some(card => 
        card.bank_name === b.bank_name && 
        (b.card_type === 'both' || b.card_type === card.card_type)
      )
    );
  }, [selectedCardId, cards, benefits, searchTerm]);

  const todayBenefits = useMemo(() => {
    const targetDay = viewMode === 'today' ? today : viewMode;
    return myBenefits.filter(b => b.day_of_week === targetDay || b.day_of_week === 'Everyday');
  }, [myBenefits, today, viewMode]);

  const remindersWithMatches = useMemo(() => {
    return reminders.map(r => {
      const match = myBenefits.find(b => b.store_name.toLowerCase() === r.store_name.toLowerCase());
      return { ...r, match };
    });
  }, [reminders, myBenefits]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans pb-20">
      {/* PWA Install Banner */}
      <AnimatePresence>
        {showInstallBanner && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="bg-indigo-600 text-white px-4 py-3 sticky top-0 z-50 flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Smartphone className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium">
                Instala BenefiCard en tu pantalla de inicio para acceso rápido.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleInstallClick}
                className="bg-white text-indigo-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-neutral-100 transition-colors flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> Instalar
              </button>
              <button 
                onClick={dismissInstallBanner}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <CreditCard className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">BenefiCard</h1>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center bg-neutral-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('benefits')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'benefits' ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              Inicio
            </button>
            <button 
              onClick={() => setActiveTab('cards')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'cards' ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              Tarjetas
            </button>
            <button 
              onClick={() => setActiveTab('calculator')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'calculator' ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              Calculadora
            </button>
            <button 
              onClick={() => setActiveTab('reminders')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'reminders' ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              Deseos
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-neutral-100 transition-colors border border-neutral-200"
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden text-white"
                style={{ backgroundColor: profile?.profile_color || '#4F46E5' }}
              >
                {getProfileIcon(profile?.profile_icon, "w-5 h-5")}
              </div>
              <span className="text-sm font-medium hidden sm:block">{profile?.name}</span>
            </button>
            <button className="p-2 rounded-full hover:bg-neutral-100 relative">
              <Bell className="w-6 h-6 text-neutral-600" />
              {reminders.length > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 w-2 h-2 rounded-full border-2 border-white"></span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <AnimatePresence mode="wait">
          {activeTab === 'benefits' && (
            <motion.div
              key="benefits-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-8"
            >
              <BenefitsTab 
                viewMode={viewMode}
                setViewMode={setViewMode}
                today={today}
                selectedCard={selectedCard}
                setSelectedCardId={setSelectedCardId}
                benefits={todayBenefits}
                cards={cards}
                setActiveTab={setActiveTab}
                setShowAddCard={setShowAddCard}
                profile={profile}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                handleReportBenefit={handleReportBenefit}
              />
            </motion.div>
          )}

          {activeTab === 'cards' && (
            <motion.div
              key="cards-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-8"
            >
              <CardsTab 
                cards={cards}
                selectedCardId={selectedCardId}
                setSelectedCardId={setSelectedCardId}
                setActiveTab={setActiveTab}
                setViewMode={setViewMode}
                setEditingCardId={setEditingCardId}
                setNewCard={setNewCard}
                setShowAddCard={setShowAddCard}
                openEditCard={openEditCard}
                deleteCard={deleteCard}
              />
            </motion.div>
          )}

          {activeTab === 'reminders' && (
            <motion.div
              key="reminders-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-8"
            >
              <RemindersTab 
                reminders={remindersWithMatches}
                deleteReminder={deleteReminder}
                setShowAddReminder={setShowAddReminder}
              />
            </motion.div>
          )}

          {activeTab === 'calculator' && (
            <motion.div
              key="calculator-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-8"
            >
              <CalculatorTab 
                calcPrice={calcPrice}
                setCalcPrice={setCalcPrice}
                calcDiscount={calcDiscount}
                setCalcDiscount={setCalcDiscount}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AddCardModal 
        showAddCard={showAddCard}
        setShowAddCard={setShowAddCard}
        editingCardId={editingCardId}
        newCard={newCard}
        setNewCard={setNewCard}
        handleSaveCard={handleSaveCard}
        isSubmitting={isSubmitting}
      />

      <AddReminderModal 
        showAddReminder={showAddReminder}
        setShowAddReminder={setShowAddReminder}
        newReminder={newReminder}
        setNewReminder={setNewReminder}
        addReminder={addReminder}
        isSubmitting={isSubmitting}
      />

      <ProfileModal 
        showProfile={showProfile}
        setShowProfile={setShowProfile}
        editProfile={editProfile}
        setEditProfile={setEditProfile}
        handleSaveProfile={handleSaveProfile}
        handleResetData={handleResetData}
        getProfileIcon={getProfileIcon}
        isSubmitting={isSubmitting}
      />

      <OnboardingFlow 
        showWelcome={showWelcome}
        onboardingStep={onboardingStep}
        setOnboardingStep={setOnboardingStep}
        editProfile={editProfile}
        setEditProfile={setEditProfile}
        rememberMe={rememberMe}
        setRememberMe={setRememberMe}
        handleSaveProfile={handleSaveProfile}
        getProfileIcon={getProfileIcon}
        isSubmitting={isSubmitting}
      />

      {/* Bottom Nav (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-6 py-3 flex justify-around items-center md:hidden z-40">
        <button 
          onClick={() => setActiveTab('benefits')}
          className={`p-2 transition-colors ${activeTab === 'benefits' ? 'text-indigo-600' : 'text-neutral-400'}`}
        >
          <Home className="w-6 h-6" />
        </button>
        <button 
          onClick={() => setActiveTab('cards')}
          className={`p-2 transition-colors ${activeTab === 'cards' ? 'text-indigo-600' : 'text-neutral-400'}`}
        >
          <CreditCard className="w-6 h-6" />
        </button>
        <button 
          onClick={() => setActiveTab('calculator')}
          className={`p-2 transition-colors ${activeTab === 'calculator' ? 'text-indigo-600' : 'text-neutral-400'}`}
        >
          <Calculator className="w-6 h-6" />
        </button>
        <button 
          onClick={() => setActiveTab('reminders')}
          className={`p-2 transition-colors ${activeTab === 'reminders' ? 'text-indigo-600' : 'text-neutral-400'}`}
        >
          <Bell className="w-6 h-6" />
        </button>
      </nav>
    </div>
  );
}
