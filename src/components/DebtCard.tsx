import React, { useState } from 'react';
import { Debt } from '../types';
import { 
  Calendar, AlertCircle, Phone, MessageSquare, 
  Trash2, Edit, CreditCard, History, Clock, Check, MoreVertical,
  Download, Image
} from 'lucide-react';
import { motion } from 'motion/react';

interface DebtCardProps {
  key?: any;
  debt: Debt;
  onEdit: (debt: Debt) => void;
  onDelete: (id: string) => void | Promise<void>;
  onOpenPayment: (debt: Debt) => void;
  onOpenHistory: (debt: Debt) => void;
}

export default function DebtCard({ debt, onEdit, onDelete, onOpenPayment, onOpenHistory }: DebtCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const remaining = debt.amount - debt.paidAmount;
  const percentage = debt.amount > 0 ? Math.round((debt.paidAmount / debt.amount) * 100) : 0;

  // Calculate days remaining or overdue
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(debt.dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isOverdue = diffDays < 0 && debt.status !== 'paid';
  const isDueToday = diffDays === 0 && debt.status !== 'paid';

  const getPriorityStyle = (p: string) => {
    switch (p) {
      case 'high':
        return { bg: 'bg-red-50 text-red-900 border-red-300', label: 'عالية جداً' };
      case 'medium':
        return { bg: 'bg-amber-50 text-amber-900 border-amber-300', label: 'متوسطة' };
      case 'low':
      default:
        return { bg: 'bg-emerald-50 text-emerald-950 border-emerald-300', label: 'منخفضة' };
    }
  };

  const getStatusStyle = (s: string) => {
    switch (s) {
      case 'paid':
        return { bg: 'bg-emerald-100 text-emerald-950 border-emerald-300', label: 'كامل التسديد' };
      case 'partial':
        return { bg: 'bg-blue-100 text-blue-950 border-blue-300', label: 'تسديد جزئي' };
      case 'unpaid':
      default:
        return { bg: 'bg-rose-100 text-rose-950 border-rose-300', label: 'غير مسدد' };
    }
  };

  const priorityStyle = getPriorityStyle(debt.priority);
  const statusStyle = getStatusStyle(debt.status);

  const downloadDebtImage = () => {
    setIsDownloading(true);

    setTimeout(() => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 650;
        canvas.height = 580;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Background
        ctx.fillStyle = '#FDFCFB';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Thick Outer Border
        ctx.lineWidth = 12;
        ctx.strokeStyle = '#1A1A1A';
        ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

        // 3. Thin Inner Border
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#1A1A1A';
        ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);

        // 4. RTL setup
        ctx.direction = 'rtl';
        ctx.textAlign = 'right';

        // 5. App Title & Subtitle (Right aligned)
        ctx.fillStyle = '#1A1A1A';
        ctx.font = 'bold 32px Georgia, serif';
        ctx.fillText('إيجاز', canvas.width - 45, 65);

        ctx.font = '12px sans-serif';
        ctx.fillStyle = 'rgba(26, 26, 26, 0.6)';
        ctx.fillText('نظام إدارة وجدولة الديون والالتزامات الذكي', canvas.width - 45, 88);

        // Left aligned badge
        ctx.textAlign = 'left';
        ctx.fillStyle = '#1A1A1A';
        ctx.font = 'italic bold 16px Georgia, serif';
        ctx.fillText('بطاقة تذكير مالي', 45, 70);

        // Divider Line
        ctx.beginPath();
        ctx.moveTo(40, 110);
        ctx.lineTo(canvas.width - 40, 110);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#1A1A1A';
        ctx.stroke();

        // 6. Grid / Content Rows
        ctx.textAlign = 'right';
        ctx.direction = 'rtl';

        const startY = 160;
        const rowHeight = 48;

        const pStyle = getPriorityStyle(debt.priority);
        const sStyle = getStatusStyle(debt.status);

        const rows = [
          ['المدين المستحق:', debt.debtorName, true],
          ['قيمة الدين الأصلية:', `${debt.amount.toLocaleString()} ${debt.currency}`, false],
          ['المسدد حتى الآن:', `${debt.paidAmount.toLocaleString()} ${debt.currency}`, false],
          ['المتبقي الواجب سداده:', `${(debt.amount - debt.paidAmount).toLocaleString()} ${debt.currency}`, true],
          ['تاريخ الاستحقاق:', new Date(debt.dueDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }), false],
          ['حالة الدين الحالية:', `${sStyle.label} (${pStyle.label})`, false],
        ];

        rows.forEach((row, idx) => {
          const y = startY + idx * rowHeight;

          // Draw custom soft row background for highlighted rows (e.g. debtor name and remaining balance)
          if (row[2]) {
            ctx.fillStyle = 'rgba(26, 26, 26, 0.05)';
            ctx.fillRect(40, y - 28, canvas.width - 80, rowHeight - 6);
          }

          // Label text
          ctx.fillStyle = 'rgba(26, 26, 26, 0.55)';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(row[0] as string, canvas.width - 55, y);

          // Value text
          ctx.fillStyle = row[2] ? '#B91C1C' : '#1A1A1A';
          ctx.font = row[2] ? 'bold 16px sans-serif' : '14px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(row[1] as string, 55, y);
        });

        // Notes Divider
        ctx.beginPath();
        ctx.moveTo(40, 440);
        ctx.lineTo(canvas.width - 40, 440);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(26, 26, 26, 0.15)';
        ctx.stroke();

        // Notes section
        if (debt.description) {
          ctx.textAlign = 'right';
          ctx.fillStyle = 'rgba(26, 26, 26, 0.45)';
          ctx.font = 'italic 11px sans-serif';
          ctx.fillText('ملاحظات إضافية:', canvas.width - 55, 465);

          ctx.fillStyle = '#1A1A1A';
          ctx.font = 'italic 13px sans-serif';
          const desc = debt.description.length > 70 ? debt.description.substring(0, 70) + '...' : debt.description;
          ctx.fillText(desc, canvas.width - 55, 488);
        }

        // Footer
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(26, 26, 26, 0.4)';
        ctx.font = '9px monospace';
        const formattedTime = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        ctx.fillText(`تاريخ التوثيق: ${formattedTime}`, canvas.width - 45, 540);

        ctx.textAlign = 'left';
        ctx.fillText('تم التوثيق عبر تطبيق إيجاز لإدارة الديون الذكية', 45, 540);

        // Save as image
        const url = canvas.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.download = `eejaz-${debt.debtorName.replace(/\s+/g, '_')}.jpg`;
        link.href = url;
        link.click();
      } catch (err) {
        console.error('Error generating image:', err);
      } finally {
        setIsDownloading(false);
      }
    }, 800);
  };

  const handleDelete = () => {
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف ديون المدين "${debt.debtorName}" نهائياً؟`)) {
      onDelete(debt.id);
    }
  };

  const formattedDueDate = new Date(debt.dueDate).toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 100 }}
      className={`bg-white border p-6 rounded-none transition-all relative ${
        isOverdue 
          ? 'border-red-600 shadow-sm' 
          : 'border-[#1A1A1A] hover:shadow-md'
      }`}
      id={`debt-card-${debt.id}`}
    >
      {/* Upper row: Debtor Name, Priority and Status */}
      <div className="flex items-start justify-between gap-2 mb-4 pb-3 border-b border-[#1A1A1A]/10">
        <div className="space-y-1">
          <h4 className="text-xl font-serif font-bold text-[#1A1A1A]">{debt.debtorName}</h4>
          
          <div className="flex flex-wrap gap-1.5 items-center pt-1">
            <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-none border ${priorityStyle.bg}`}>
              {priorityStyle.label}
            </span>
            <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-none border ${statusStyle.bg}`}>
              {statusStyle.label}
            </span>
          </div>
        </div>

        {/* Action Menu Toggle */}
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-1.5 hover:bg-[#F7F3F0] rounded-none border border-transparent hover:border-[#1A1A1A]/20 text-[#1A1A1A] cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>
              <div className="absolute left-0 mt-1 bg-white border border-[#1A1A1A] rounded-none shadow-lg py-1.5 w-36 z-20 text-xs">
                <button
                  onClick={() => { onEdit(debt); setShowDropdown(false); }}
                  className="w-full text-right px-4 py-2 hover:bg-[#F7F3F0] text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5 text-[#1A1A1A]" />
                  <span className="font-sans">تعديل البيانات</span>
                </button>
                <button
                  onClick={() => { handleDelete(); setShowDropdown(false); }}
                  className="w-full text-right px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer border-t border-[#1A1A1A]/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="font-sans">حذف الدين</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Due Date Indicator with customized styling for Overdue / Today / Safe */}
      <div className="flex items-center gap-2 mb-4 p-3 bg-[#F7F3F0] border border-[#1A1A1A]/10 rounded-none text-xs">
        {isOverdue ? (
          <div className="flex items-center gap-1.5 text-red-900 font-bold w-full">
            <AlertCircle className="w-4 h-4 shrink-0 animate-pulse text-red-600" />
            <span>متأخر في الدفع منذ {Math.abs(diffDays)} يوم! (تاريخ: {formattedDueDate})</span>
          </div>
        ) : isDueToday ? (
          <div className="flex items-center gap-1.5 text-amber-900 font-bold w-full">
            <Clock className="w-4 h-4 shrink-0 text-amber-600 animate-bounce" />
            <span>يوم الاستحقاق هو اليوم! (يرجى الاتصال بالمدين)</span>
          </div>
        ) : debt.status === 'paid' ? (
          <div className="flex items-center gap-1.5 text-emerald-900 font-bold w-full">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>تم تسوية هذا الالتزام بالكامل.</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[#1A1A1A]/70 w-full">
            <Calendar className="w-4 h-4 shrink-0 text-[#1A1A1A]/40" />
            <span>يستحق بعد {diffDays} يوم (تاريخ: {formattedDueDate})</span>
          </div>
        )}
      </div>

      {/* Description */}
      {debt.description && (
        <p className="text-xs text-[#1A1A1A]/70 bg-[#F7F3F0]/40 border-l border-[#1A1A1A]/20 p-3 mb-4 line-clamp-2 italic font-serif">
          {debt.description}
        </p>
      )}

      {/* Financial Numbers with Custom Visual Progress bar */}
      <div className="space-y-3 mb-4 border-t border-b border-[#1A1A1A]/10 py-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] text-[#1A1A1A]/50 uppercase tracking-wider font-bold">مبلغ الدين</p>
            <p className="text-base font-serif font-black text-[#1A1A1A] mt-1">
              {debt.amount.toLocaleString()} <span className="text-[9px] font-sans not-italic font-bold text-[#1A1A1A]/50">{debt.currency}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-emerald-800 uppercase tracking-wider font-bold">المدفوع</p>
            <p className="text-base font-serif font-black text-emerald-800 mt-1">
              {debt.paidAmount.toLocaleString()} <span className="text-[9px] font-sans not-italic font-bold text-emerald-800/80">{debt.currency}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-red-800 uppercase tracking-wider font-bold">المتبقي</p>
            <p className="text-base font-serif font-black text-red-800 mt-1">
              {remaining.toLocaleString()} <span className="text-[9px] font-sans not-italic font-bold text-red-800/85">{debt.currency}</span>
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1 pt-1">
          <div className="w-full bg-[#F7F3F0] border border-[#1A1A1A]/10 h-2 rounded-none overflow-hidden">
            <div 
              className={`h-full rounded-none transition-all duration-300 ${
                debt.status === 'paid' ? 'bg-[#1A1A1A]' : 'bg-[#1A1A1A]'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[9px] text-[#1A1A1A]/50 font-bold uppercase tracking-wider">
            <span>نسبة السداد</span>
            <span className="font-mono">{percentage}%</span>
          </div>
        </div>
      </div>

      {/* Contact Info (WhatsApp/Phone and Telegram Username) */}
      <div className="flex items-center gap-4 mb-4 text-xs bg-[#F7F3F0] p-3 border border-[#1A1A1A]/10 rounded-none justify-between">
        <span className="font-bold text-[10px] text-[#1A1A1A]/60 uppercase tracking-wider">قنوات التواصل:</span>
        <div className="flex items-center gap-3">
          {debt.phone ? (
            <a 
              href={`tel:${debt.phone}`}
              className="flex items-center gap-1 hover:underline text-[#1A1A1A] transition-colors cursor-pointer"
              title="اتصال هاتفي"
            >
              <Phone className="w-3.5 h-3.5 text-[#1A1A1A]" />
              <span className="font-mono text-[10px]">{debt.phone}</span>
            </a>
          ) : (
            <span className="text-[10px] text-[#1A1A1A]/30 select-none">لا يوجد هاتف</span>
          )}

          {debt.telegramUsername ? (
            <a 
              href={`https://t.me/${debt.telegramUsername.replace("@", "")}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:underline text-[#1A1A1A] transition-colors cursor-pointer"
              title="مراسلة عبر تليجرام"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#1A1A1A]" />
              <span className="font-mono text-[10px]">@{debt.telegramUsername}</span>
            </a>
          ) : (
            <span className="text-[10px] text-[#1A1A1A]/30 select-none">لا يوجد حساب</span>
          )}
        </div>
      </div>

      {/* Primary Actions: Pay, Logs, and Image Download */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onOpenPayment(debt)}
            disabled={debt.status === 'paid'}
            className="flex items-center justify-center gap-1.5 text-xs text-white bg-[#1A1A1A] hover:bg-neutral-800 px-3 py-3 rounded-none font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>تسجيل سداد</span>
          </button>

          <button
            onClick={() => onOpenHistory(debt)}
            className="flex items-center justify-center gap-1.5 text-xs text-[#1A1A1A] bg-transparent hover:bg-[#F7F3F0] border border-[#1A1A1A] px-3 py-3 rounded-none font-bold transition-all cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-[#1A1A1A]" />
            <span>سجل الدفعات</span>
          </button>
        </div>

        {/* Download Reminder Card as Image */}
        <button
          onClick={downloadDebtImage}
          disabled={isDownloading}
          className="w-full flex items-center justify-center gap-1.5 text-xs px-3 py-3 rounded-none font-bold transition-all cursor-pointer bg-[#F7F3F0] hover:bg-white text-[#1A1A1A] border border-[#1A1A1A] hover:border-[#1A1A1A] disabled:opacity-65"
        >
          {isDownloading ? (
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>جاري توليد وحفظ بطاقة الدين كصورة...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>تنزيل بطاقة التذكير كصورة</span>
            </span>
          )}
        </button>
      </div>
    </motion.div>
  );
}
