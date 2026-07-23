import React, { useState, useEffect } from 'react';
import { Debt, Priority } from '../types';
import { X, User, DollarSign, Calendar, AlertTriangle, MessageSquare, Phone, AlignLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (debt: Omit<Debt, 'id' | 'createdAt' | 'history'> & { id?: string }) => Promise<void>;
  editingDebt?: Debt | null;
}

const CURRENCIES = ['USD', 'IQD', 'SAR', 'AED', 'EGP', 'QAR', 'KWD'];

export default function AddDebtModal({ isOpen, onClose, onSave, editingDebt }: AddDebtModalProps) {
  const [debtorName, setDebtorName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState('IQD');
  const [customCurrency, setCustomCurrency] = useState('');
  const [showCustomCurrency, setShowCustomCurrency] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingDebt) {
      setDebtorName(editingDebt.debtorName);
      setAmount(editingDebt.amount);
      if (CURRENCIES.includes(editingDebt.currency)) {
        setCurrency(editingDebt.currency);
        setShowCustomCurrency(false);
      } else {
        setCurrency('OTHER');
        setCustomCurrency(editingDebt.currency);
        setShowCustomCurrency(true);
      }
      // Extract YYYY-MM-DD from ISO or parseable due date
      const dateStr = editingDebt.dueDate ? new Date(editingDebt.dueDate).toISOString().split('T')[0] : '';
      setDueDate(dateStr);
      setPriority(editingDebt.priority);
      setDescription(editingDebt.description || '');
      setPhone(editingDebt.phone || '');
      setTelegramUsername(editingDebt.telegramUsername || '');
    } else {
      // Reset form
      setDebtorName('');
      setAmount('');
      setCurrency('IQD');
      setCustomCurrency('');
      setShowCustomCurrency(false);
      // Set default due date to 1 month from now
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setDueDate(nextMonth.toISOString().split('T')[0]);
      setPriority('medium');
      setDescription('');
      setPhone('');
      setTelegramUsername('');
    }
  }, [editingDebt, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtorName || !amount || !dueDate) {
      alert('الرجاء تعبئة كافة الحقول المطلوبة (اسم المدين، المبلغ، وتاريخ الاستحقاق).');
      return;
    }

    setIsSubmitting(true);
    const finalCurrency = currency === 'OTHER' ? customCurrency || 'USD' : currency;

    try {
      await onSave({
        id: editingDebt?.id,
        debtorName,
        amount: Number(amount),
        paidAmount: editingDebt ? editingDebt.paidAmount : 0,
        currency: finalCurrency,
        dueDate,
        priority,
        status: editingDebt ? editingDebt.status : 'unpaid',
        description,
        phone,
        telegramUsername: telegramUsername.trim().replace(/^@/, ''), // Strip @ prefix if entered
      });
      onClose();
    } catch (error) {
      console.error('Error saving debt:', error);
      alert('حدث خطأ أثناء حفظ الدين. يرجى المحاولة مجدداً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCurrencyChange = (val: string) => {
    setCurrency(val);
    if (val === 'OTHER') {
      setShowCustomCurrency(true);
    } else {
      setShowCustomCurrency(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" id="add-debt-modal-container">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-none w-full max-w-lg overflow-hidden border border-[#1A1A1A]"
      >
        {/* Header */}
        <div className="bg-[#F7F3F0] border-b border-[#1A1A1A]/20 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">
              {editingDebt ? 'تعديل تفاصيل الالتزام / الدين' : 'تسجيل دين أو التزام مالي جديد'}
            </h3>
            <p className="text-xs text-[#1A1A1A]/60 mt-1 font-serif italic">أدخل البيانات بعناية لجدولة الإشعارات والتحصيلات</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-200 text-[#1A1A1A] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Debtor Name */}
          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#1A1A1A]/40" />
              <span>اسم المدين (المستحق عليه) <span className="text-red-600">*</span></span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: أحمد محمد علي"
              value={debtorName}
              onChange={(e) => setDebtorName(e.target.value)}
              className="w-full bg-[#F7F3F0]/50 border border-[#1A1A1A]/20 rounded-none px-4 py-2.5 text-xs focus:bg-white focus:border-[#1A1A1A] outline-none transition-all"
            />
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#1A1A1A]/40" />
                <span>المبلغ المستحق <span className="text-red-600">*</span></span>
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#F7F3F0]/50 border border-[#1A1A1A]/20 rounded-none px-4 py-2.5 text-xs focus:bg-white focus:border-[#1A1A1A] outline-none transition-all font-serif italic"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5">العملة</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="bg-[#F7F3F0]/50 border border-[#1A1A1A]/20 rounded-none px-3 py-2.5 text-xs focus:bg-white focus:border-[#1A1A1A] outline-none transition-all cursor-pointer"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="OTHER">أخرى...</option>
                </select>

                {showCustomCurrency ? (
                  <input
                    type="text"
                    required
                    placeholder="مثال: ل.س"
                    value={customCurrency}
                    onChange={(e) => setCustomCurrency(e.target.value)}
                    className="w-full bg-[#F7F3F0]/50 border border-[#1A1A1A]/20 rounded-none px-3 py-2.5 text-xs focus:bg-white focus:border-[#1A1A1A] outline-none transition-all"
                  />
                ) : (
                  <div className="text-[10px] text-[#1A1A1A]/50 flex items-center justify-center bg-[#F7F3F0]/30 border border-[#1A1A1A]/10 rounded-none px-1 text-center select-none font-bold">
                    عملة افتراضية
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Due Date & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#1A1A1A]/40" />
                <span>تاريخ الاستحقاق والسداد <span className="text-red-600">*</span></span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#F7F3F0]/50 border border-[#1A1A1A]/20 rounded-none px-4 py-2.5 text-xs focus:bg-white focus:border-[#1A1A1A] outline-none transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#1A1A1A]/40" />
                <span>الأولوية / مستوى الأهمية</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-[#F7F3F0]/50 border border-[#1A1A1A]/20 rounded-none px-3 py-2.5 text-xs focus:bg-white focus:border-[#1A1A1A] outline-none transition-all cursor-pointer"
              >
                <option value="high">أولوية عالية جداً (حرجة)</option>
                <option value="medium">أولوية متوسطة (عادية)</option>
                <option value="low">أولوية منخفضة (غير مستعجلة)</option>
              </select>
            </div>
          </div>

          {/* Contact Details (Telegram & Phone) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#1A1A1A]/40" />
                <span>اسم مستخدم التليجرام (اختياري)</span>
              </label>
              <div className="relative">
                <span className="absolute right-3.5 top-2.5 text-xs text-[#1A1A1A]/40 select-none">@</span>
                <input
                  type="text"
                  placeholder="username"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  className="w-full bg-[#F7F3F0]/50 border border-[#1A1A1A]/20 rounded-none pr-8 pl-4 py-2.5 text-xs focus:bg-white focus:border-[#1A1A1A] outline-none transition-all"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#1A1A1A]/40" />
                <span>رقم هاتف المدين (اختياري)</span>
              </label>
              <input
                type="text"
                placeholder="مثال: 07701234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#F7F3F0]/50 border border-[#1A1A1A]/20 rounded-none px-4 py-2.5 text-xs focus:bg-white focus:border-[#1A1A1A] outline-none transition-all font-mono"
                dir="ltr"
              />
            </div>
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-[#1A1A1A]/40" />
              <span>ملاحظات وتفاصيل إضافية عن الدين</span>
            </label>
            <textarea
              placeholder="مثال: دين شراء أثاث مكتبي أو سلفة شخصية مؤقتة..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-[#F7F3F0]/50 border border-[#1A1A1A]/20 rounded-none px-4 py-2.5 text-xs focus:bg-white focus:border-[#1A1A1A] outline-none transition-all resize-none font-serif italic"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1A1A1A]/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-none border border-[#1A1A1A] text-xs font-bold text-[#1A1A1A] hover:bg-[#F7F3F0] transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#1A1A1A] hover:bg-neutral-800 text-white rounded-none text-xs font-bold uppercase tracking-wider border border-[#1A1A1A] transition-all disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ وتسجيل البيانات'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
