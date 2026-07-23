import React, { useState } from 'react';
import { Debt, PaymentHistory } from '../types';
import { X, Trash2, Calendar, FileText, ArrowDownCircle, Info } from 'lucide-react';
import { motion } from 'motion/react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt | null;
  onDeletePayment: (debtId: string, paymentId: string) => Promise<void>;
}

export default function HistoryModal({ isOpen, onClose, debt, onDeletePayment }: HistoryModalProps) {
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  if (!isOpen || !debt) return null;

  const handleDelete = async (paymentId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الدفعة؟ سيتم إعادة حساب المبلغ المتبقي والمدفوع تلقائياً.')) {
      setIsDeletingId(paymentId);
      try {
        await onDeletePayment(debt.id, paymentId);
      } catch (error) {
        console.error('Error deleting payment:', error);
        alert('فشل حذف الدفعة.');
      } finally {
        setIsDeletingId(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50" id="history-modal-container">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-none w-full max-w-md overflow-hidden border border-[#1A1A1A]"
      >
        {/* Header */}
        <div className="bg-[#F7F3F0] border-b border-[#1A1A1A]/20 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">سجل المدفوعات والتسديدات</h3>
            <p className="text-xs text-[#1A1A1A]/60 mt-1 font-serif italic">سجل الدفعات التاريخية للمدين: <span className="font-bold text-[#1A1A1A]">{debt.debtorName}</span></p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-200 text-[#1A1A1A] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* History List */}
        <div className="p-6 max-h-[380px] overflow-y-auto space-y-4">
          {debt.history && debt.history.length > 0 ? (
            <div className="space-y-3">
              {debt.history.map((payment: PaymentHistory) => (
                <div
                  key={payment.id}
                  className="bg-[#F7F3F0]/30 border border-[#1A1A1A]/10 rounded-none p-3.5 flex items-start justify-between gap-3 relative hover:border-[#1A1A1A]/30 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-800 rounded-none shrink-0 mt-0.5 border border-emerald-800/20">
                      <ArrowDownCircle className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-[#1A1A1A]">
                        تم سداد <span className="font-serif italic font-extrabold">{payment.amount.toLocaleString()}</span> <span className="text-[10px] text-[#1A1A1A]/60 font-serif font-bold">{debt.currency}</span>
                      </p>
                      
                      <div className="flex items-center gap-1.5 text-[10px] text-[#1A1A1A]/50 font-mono">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(payment.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>

                      {payment.notes && (
                        <div className="flex items-start gap-1 text-[10px] text-[#1A1A1A]/70 mt-1 bg-white border border-[#1A1A1A]/10 rounded-none p-1.5 px-2 font-serif italic">
                          <FileText className="w-3 h-3 text-[#1A1A1A]/40 shrink-0 mt-0.5" />
                          <span>{payment.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(payment.id)}
                    disabled={isDeletingId === payment.id}
                    className="p-1.5 hover:bg-red-50 text-[#1A1A1A]/50 hover:text-red-700 rounded-none transition-colors cursor-pointer shrink-0"
                    title="حذف الدفعة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#1A1A1A]/50 space-y-3">
              <div className="w-10 h-10 border border-[#1A1A1A]/20 bg-[#F7F3F0] rounded-none flex items-center justify-center mx-auto text-[#1A1A1A]">
                <Info className="w-5 h-5" />
              </div>
              <p className="text-xs font-serif italic">لا يوجد أي دفعات سابقة مسجلة لهذا الدين.</p>
              <p className="text-[10px] text-[#1A1A1A]/40">اضغط على زر "تسجيل سداد" لإضافة دفعة جديدة.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#F7F3F0] border-t border-[#1A1A1A]/20 px-6 py-3.5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1A1A1A] hover:bg-neutral-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>
      </motion.div>
    </div>
  );
}
