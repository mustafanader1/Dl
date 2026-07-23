import React, { useState, useEffect } from 'react';
import { Debt } from '../types';
import { X, DollarSign, Calendar, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt | null;
  onAddPayment: (debtId: string, amount: number, date: string, notes?: string) => Promise<void>;
}

export default function PaymentModal({ isOpen, onClose, debt, onAddPayment }: PaymentModalProps) {
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remaining = debt ? debt.amount - debt.paidAmount : 0;

  useEffect(() => {
    if (debt) {
      setAmount(remaining);
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [debt, isOpen]);

  if (!isOpen || !debt) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert('الرجاء إدخال مبلغ صحيح أكبر من الصفر.');
      return;
    }

    if (Number(amount) > remaining) {
      const confirmOverpay = window.confirm(`مبلغ الدفعة (${amount}) يتجاوز المبلغ المتبقي المستحق (${remaining}). هل تريد تسجيل دفعة زائدة؟`);
      if (!confirmOverpay) return;
    }

    setIsSubmitting(true);
    try {
      await onAddPayment(debt.id, Number(amount), date, notes);
      onClose();
    } catch (error) {
      console.error('Error logging payment:', error);
      alert('حدث خطأ أثناء تسجيل الدفعة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50" id="payment-modal-container">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-none w-full max-w-md overflow-hidden border border-[#1A1A1A]"
      >
        <div className="bg-[#F7F3F0] border-b border-[#1A1A1A]/20 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">تسجيل دفعة سداد جديدة</h3>
            <p className="text-xs text-[#1A1A1A]/60 mt-1 font-serif italic">تسجيل تسوية كاملة أو جزء من ديون المدين</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-200 text-[#1A1A1A] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Debtor details summary */}
          <div className="bg-[#F7F3F0]/50 border border-[#1A1A1A]/10 rounded-none p-4 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[#1A1A1A]/50 font-bold">اسم المدين:</span>
              <span className="font-serif font-bold text-[#1A1A1A]">{debt.debtorName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#1A1A1A]/50 font-bold">إجمالي الدين:</span>
              <span className="font-serif font-bold text-[#1A1A1A]">{debt.amount.toLocaleString()} {debt.currency}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#1A1A1A]/50 font-bold">المدفوع سابقاً:</span>
              <span className="font-serif font-bold text-emerald-800">{debt.paidAmount.toLocaleString()} {debt.currency}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[#1A1A1A]/10">
              <span className="text-[#1A1A1A]/70 font-bold">المتبقي المطلوب:</span>
              <span className="font-serif font-extrabold text-red-800">{remaining.toLocaleString()} {debt.currency}</span>
            </div>
          </div>

          {/* Amount to pay */}
          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#1A1A1A]/40" />
              <span>مبلغ السداد المستلم ({debt.currency}) <span className="text-red-600">*</span></span>
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
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setAmount(remaining)}
                className="text-[10px] text-[#1A1A1A] bg-[#F7F3F0] hover:bg-white border border-[#1A1A1A]/20 px-2.5 py-1.5 rounded-none font-bold transition-colors cursor-pointer"
              >
                دفع كامل المبلغ المتبقي
              </button>
              <button
                type="button"
                onClick={() => setAmount(remaining / 2)}
                className="text-[10px] text-[#1A1A1A] bg-[#F7F3F0] hover:bg-white border border-[#1A1A1A]/20 px-2.5 py-1.5 rounded-none font-bold transition-colors cursor-pointer"
              >
                دفع نصف المتبقي
              </button>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#1A1A1A]/40" />
              <span>تاريخ استلام الدفعة <span className="text-red-600">*</span></span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#F7F3F0]/50 border border-[#1A1A1A]/20 rounded-none px-4 py-2.5 text-xs focus:bg-white focus:border-[#1A1A1A] outline-none transition-all font-mono"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#1A1A1A]/40" />
              <span>ملاحظات وطريقة الدفع</span>
            </label>
            <input
              type="text"
              placeholder="مثال: حوالة الكترونية، كاش باليد، شيك رقم..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#F7F3F0]/50 border border-[#1A1A1A]/20 rounded-none px-4 py-2.5 text-xs focus:bg-white focus:border-[#1A1A1A] outline-none transition-all"
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
              {isSubmitting ? 'جاري الحفظ...' : 'تأكيد السداد'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
