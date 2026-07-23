import React from 'react';
import { Debt } from '../types';
import { AlertCircle, Clock, CheckCircle2, Percent } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardStatsProps {
  debts: Debt[];
}

export default function DashboardStats({ debts }: DashboardStatsProps) {
  // Extract all unique currencies
  const currencies = Array.from(new Set(debts.map(d => d.currency || 'USD')));

  // Calculate totals per currency
  const currencyStats = currencies.map(currency => {
    const matchingDebts = debts.filter(d => d.currency === currency);
    const totalAmount = matchingDebts.reduce((sum, d) => sum + d.amount, 0);
    const totalPaid = matchingDebts.reduce((sum, d) => sum + d.paidAmount, 0);
    const totalRemaining = totalAmount - totalPaid;
    
    return {
      currency,
      totalAmount,
      totalPaid,
      totalRemaining,
      percentage: totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0
    };
  });

  const unpaidCount = debts.filter(d => d.status === 'unpaid').length;
  const partialCount = debts.filter(d => d.status === 'partial').length;
  const paidCount = debts.filter(d => d.status === 'paid').length;

  const getPriorityCount = (priority: 'high' | 'medium' | 'low') => {
    return debts.filter(d => d.priority === priority && d.status !== 'paid').length;
  };

  const highPriorityCount = getPriorityCount('high');

  // Stagger animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120 } }
  };

  return (
    <div className="space-y-6" id="dashboard-stats-section">
      {/* Quick overview of priorities and statuses */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#F7F3F0] border border-[#1A1A1A]/20 rounded-sm p-4 flex items-center gap-3.5">
          <div className="p-2 bg-red-100 text-red-800 rounded-xs border border-red-200">
            <AlertCircle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/60 font-bold">عالية الأولوية</p>
            <h3 className="text-2xl font-serif italic font-black text-red-800 mt-0.5">
              {highPriorityCount} <span className="text-xs font-sans not-italic font-normal text-[#1A1A1A]/70">ديون</span>
            </h3>
          </div>
        </div>

        <div className="bg-[#F7F3F0] border border-[#1A1A1A]/20 rounded-sm p-4 flex items-center gap-3.5">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-xs border border-amber-200">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/60 font-bold">غير مدفوعة بالكامل</p>
            <h3 className="text-2xl font-serif italic font-black text-amber-800 mt-0.5">
              {unpaidCount + partialCount} <span className="text-xs font-sans not-italic font-normal text-[#1A1A1A]/70">التزام</span>
            </h3>
          </div>
        </div>

        <div className="bg-[#F7F3F0] border border-[#1A1A1A]/20 rounded-sm p-4 flex items-center gap-3.5">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xs border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/60 font-bold">تمت تسويتها</p>
            <h3 className="text-2xl font-serif italic font-black text-emerald-800 mt-0.5">
              {paidCount} <span className="text-xs font-sans not-italic font-normal text-[#1A1A1A]/70">ديون</span>
            </h3>
          </div>
        </div>

        <div className="bg-[#F7F3F0] border border-[#1A1A1A]/20 rounded-sm p-4 flex items-center gap-3.5">
          <div className="p-2 bg-blue-100 text-blue-800 rounded-xs border border-blue-200">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/60 font-bold">إجمالي المدينين</p>
            <h3 className="text-2xl font-serif italic font-black text-blue-800 mt-0.5">
              {debts.length} <span className="text-xs font-sans not-italic font-normal text-[#1A1A1A]/70">أشخاص</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Breakdowns per currency */}
      {currencyStats.length === 0 ? (
        <div className="bg-[#F7F3F0] border border-dashed border-[#1A1A1A]/30 rounded-sm py-10 text-center text-[#1A1A1A]/60 text-xs font-serif italic">
          لا توجد مبالغ ديون مسجلة حالياً لعرض الملخص المالي المحاسبي.
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {currencyStats.map((stat) => (
            <motion.div
              variants={cardVariants}
              key={stat.currency}
              className="bg-[#F7F3F0] border border-[#1A1A1A] rounded-sm p-6 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Currency Badge Graphic */}
              <div className="absolute top-0 left-0 text-[#1A1A1A] text-7xl font-serif font-black opacity-5 px-4 py-1 pointer-events-none select-none italic">
                {stat.currency}
              </div>

              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[10px] uppercase tracking-widest font-bold bg-[#1A1A1A] text-white px-3 py-1.5 rounded-none">
                    ملخص عملة {stat.currency}
                  </span>
                  <span className="text-xs font-serif font-bold italic text-blue-800 bg-blue-50 border border-blue-100 px-3 py-1 rounded-sm">
                    تحصيل {stat.percentage}%
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[#1A1A1A]/50 uppercase tracking-wider font-bold">إجمالي الديون المطلوبة</p>
                    <h4 className="text-4xl font-serif italic font-black text-[#1A1A1A] tracking-tighter mt-1">
                      {stat.totalAmount.toLocaleString()} <span className="text-sm font-sans not-italic font-bold text-[#1A1A1A]/60">{stat.currency}</span>
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#1A1A1A]/10">
                    <div>
                      <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">تم تحصيله (المدفوع)</p>
                      <p className="text-lg font-serif italic font-bold text-emerald-800 mt-1">
                        {stat.totalPaid.toLocaleString()} <span className="text-[10px] font-sans not-italic font-semibold text-emerald-800/80">{stat.currency}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-red-800 font-bold uppercase tracking-wider">المتبقي المطلوب</p>
                      <p className="text-lg font-serif italic font-bold text-red-800 mt-1">
                        {stat.totalRemaining.toLocaleString()} <span className="text-[10px] font-sans not-italic font-semibold text-red-800/80">{stat.currency}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Styled Progress Bar */}
              <div className="mt-6 pt-3 border-t border-[#1A1A1A]/10">
                <div className="w-full bg-white/60 border border-[#1A1A1A]/10 h-2.5 rounded-none overflow-hidden">
                  <div 
                    className="bg-[#1A1A1A] h-full transition-all duration-500"
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
