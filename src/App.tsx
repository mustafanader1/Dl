import React, { useState, useEffect } from 'react';
import { Debt, Priority, DebtStatus } from './types';
import DashboardStats from './components/DashboardStats';
import DebtCard from './components/DebtCard';
import AddDebtModal from './components/AddDebtModal';
import PaymentModal from './components/PaymentModal';
import HistoryModal from './components/HistoryModal';
import { 
  Plus, Search, Filter, ArrowUpDown, RefreshCw, 
  UserX, ShieldCheck, AlertCircle, Coins, HelpCircle,
  Smartphone, Download, ShieldAlert, CheckCircle, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('dueDate');

  // Modal controls
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // Selected items for edit/pay/history
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  // PWA installation states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect if app is already running in standalone mode (PWA installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleiOS = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleiOS);

    // If on iOS and not standalone, show prompt
    if (isAppleiOS && !isStandalone) {
      setShowInstallPrompt(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e);
      // Update UI notify the user they can install
      setIsInstallable(true);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      console.log('PWA was installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again
    setDeferredPrompt(null);
    setIsInstallable(false);
    setShowInstallPrompt(false);
  };

  // Fetch initial data from LocalStorage
  const fetchData = () => {
    setIsLoading(true);
    try {
      const savedDebts = localStorage.getItem('eejaz_debts');
      if (savedDebts) {
        setDebts(JSON.parse(savedDebts));
      } else {
        // First-time load initial placeholder/empty state
        setDebts([]);
      }
    } catch (error) {
      console.error('Error fetching offline data:', error);
    } finally {
      // Simulate small smooth loading transition
      setTimeout(() => {
        setIsLoading(false);
      }, 350);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Add or Update Debt (pure client-side with LocalStorage sync)
  const handleSaveDebt = async (debtData: any) => {
    const isEditing = !!debtData.id;
    
    let savedDebt: Debt;
    let updatedDebts: Debt[];

    if (isEditing) {
      savedDebt = {
        ...debtData,
        updatedAt: new Date().toISOString()
      };
      updatedDebts = debts.map(d => d.id === debtData.id ? savedDebt : d);
    } else {
      savedDebt = {
        ...debtData,
        id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        paidAmount: 0,
        status: 'unpaid',
        history: []
      };
      updatedDebts = [...debts, savedDebt];
    }

    setDebts(updatedDebts);
    localStorage.setItem('eejaz_debts', JSON.stringify(updatedDebts));
  };

  // Delete Debt
  const handleDeleteDebt = async (id: string) => {
    const updatedDebts = debts.filter(d => d.id !== id);
    setDebts(updatedDebts);
    localStorage.setItem('eejaz_debts', JSON.stringify(updatedDebts));
  };

  // Record a payment offline
  const handleAddPayment = async (debtId: string, amount: number, date: string, notes?: string) => {
    const updatedDebts = debts.map(debt => {
      if (debt.id !== debtId) return debt;

      const newPaidAmount = debt.paidAmount + amount;
      let newStatus: DebtStatus = 'partial';
      if (newPaidAmount >= debt.amount) {
        newStatus = 'paid';
      } else if (newPaidAmount <= 0) {
        newStatus = 'unpaid';
      }

      const newPayment = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        amount,
        date,
        notes
      };

      return {
        ...debt,
        paidAmount: newPaidAmount,
        status: newStatus,
        history: [...(debt.history || []), newPayment],
        updatedAt: new Date().toISOString()
      };
    });

    setDebts(updatedDebts);
    localStorage.setItem('eejaz_debts', JSON.stringify(updatedDebts));
  };

  // Delete payment offline
  const handleDeletePayment = async (debtId: string, paymentId: string) => {
    const updatedDebts = debts.map(debt => {
      if (debt.id !== debtId) return debt;

      const paymentToDelete = debt.history.find(p => p.id === paymentId);
      if (!paymentToDelete) return debt;

      const newPaidAmount = debt.paidAmount - paymentToDelete.amount;
      let newStatus: DebtStatus = 'unpaid';
      if (newPaidAmount >= debt.amount) {
        newStatus = 'paid';
      } else if (newPaidAmount > 0) {
        newStatus = 'partial';
      }

      const updatedHistory = debt.history.filter(p => p.id !== paymentId);

      return {
        ...debt,
        paidAmount: newPaidAmount,
        status: newStatus,
        history: updatedHistory,
        updatedAt: new Date().toISOString()
      };
    });

    setDebts(updatedDebts);
    localStorage.setItem('eejaz_debts', JSON.stringify(updatedDebts));
  };

  // Filtering & Sorting Logic
  const filteredDebts = debts
    .filter(debt => {
      // Search text
      const matchesSearch = 
        debt.debtorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (debt.description && debt.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (debt.phone && debt.phone.includes(searchQuery)) ||
        (debt.telegramUsername && debt.telegramUsername.toLowerCase().includes(searchQuery.toLowerCase()));

      // Priority
      const matchesPriority = filterPriority === 'all' || debt.priority === filterPriority;

      // Status
      let matchesStatus = true;
      if (filterStatus === 'all') {
        matchesStatus = true;
      } else if (filterStatus === 'overdue') {
        // Calculate due status
        const todayDate = new Date();
        todayDate.setHours(0,0,0,0);
        const dueDate = new Date(debt.dueDate);
        dueDate.setHours(0,0,0,0);
        matchesStatus = dueDate.getTime() < todayDate.getTime() && debt.status !== 'paid';
      } else {
        matchesStatus = debt.status === filterStatus;
      }

      return matchesSearch && matchesPriority && matchesStatus;
    })
    .sort((a, b) => {
      // Sorters
      if (sortBy === 'dueDate') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === 'amount') {
        return b.amount - a.amount;
      }
      if (sortBy === 'debtorName') {
        return a.debtorName.localeCompare(b.debtorName, 'ar');
      }
      if (sortBy === 'createdAt') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] flex flex-col font-sans" dir="rtl">
      {/* Top Header */}
      <header className="bg-white border-b border-[#1A1A1A] py-6 px-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#1A1A1A] text-white rounded-none border border-[#1A1A1A]">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-serif italic font-black text-[#1A1A1A] tracking-tighter leading-none">إيجاز</h1>
              <p className="text-xs uppercase tracking-wider font-bold text-[#1A1A1A]/60 mt-1">مُذكّر الديون والالتزامات الأولوية</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setEditingDebt(null);
                setIsAddOpen(true);
              }}
              className="flex items-center gap-1.5 bg-[#1A1A1A] hover:bg-neutral-800 text-white px-5 py-3 rounded-none text-xs font-bold uppercase tracking-wider border border-[#1A1A1A] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل دين جديد</span>
            </button>

            <button
              onClick={fetchData}
              disabled={isLoading}
              className="p-3 hover:bg-[#F7F3F0] rounded-none text-[#1A1A1A] transition-colors cursor-pointer border border-[#1A1A1A] bg-white"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-8">
        {/* PWA Installation Banner */}
        <AnimatePresence>
          {showInstallPrompt && (isInstallable || isIOS) && !isInstalled && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#F7F3F0] border border-[#1A1A1A] p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-none"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-[#1A1A1A] text-white rounded-none border border-[#1A1A1A] shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-serif font-black text-[#1A1A1A]">تثبيت تطبيق "إيجاز" على هاتفك أو حاسوبك</h4>
                  <p className="text-xs text-[#1A1A1A]/70 leading-relaxed font-sans">
                    {isIOS 
                      ? 'للحصول على وصول سريع وسلس للديون بدون متصفح: اضغط على زر "مشاركة" (Share) في أسفل الشاشة ثم اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).'
                      : 'قم بتثبيت التطبيق الآن على سطح المكتب أو الشاشة الرئيسية لهاتفك للوصول السريع ومتابعة الالتزامات المالية في أي وقت بسهولة وبضغطة زر واحدة.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
                {!isIOS && (
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-[#1A1A1A] hover:bg-neutral-800 text-white px-4 py-2.5 rounded-none text-xs font-bold uppercase tracking-wider border border-[#1A1A1A] transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تثبيت التطبيق الآن</span>
                  </button>
                )}
                <button
                  onClick={() => setShowInstallPrompt(false)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-white hover:bg-neutral-50 text-[#1A1A1A] px-4 py-2.5 text-xs font-bold border border-[#1A1A1A] transition-all cursor-pointer"
                >
                  <span>إغلاق</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Statistics Dashboard Section */}
        <DashboardStats debts={debts} />

        {/* Dynamic Bento Split-pane */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Right Column (w-2/3): Debts Search, Filter and Card List */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Filter controls panel */}
            <div className="bg-white rounded-none border border-[#1A1A1A] p-5 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search query input */}
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-3 w-4 h-4 text-[#1A1A1A]/50" />
                  <input
                    type="text"
                    placeholder="ابحث باسم المدين، الملاحظات، الهاتف أو تليجرام..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#F7F3F0]/50 border border-[#1A1A1A]/30 rounded-none pr-10 pl-4 py-2.5 text-xs focus:bg-white focus:border-[#1A1A1A] outline-none transition-all"
                  />
                </div>

                {/* Sorter select */}
                <div className="relative shrink-0">
                  <div className="absolute right-3 top-3.5 pointer-events-none">
                    <ArrowUpDown className="w-3.5 h-3.5 text-[#1A1A1A]/50" />
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-[#F7F3F0]/50 border border-[#1A1A1A]/30 rounded-none pr-10 pl-4 py-2.5 text-xs focus:bg-white focus:border-[#1A1A1A] outline-none transition-all cursor-pointer font-sans appearance-none min-w-[150px]"
                  >
                    <option value="dueDate">الأقرب استحقاقاً</option>
                    <option value="amount">قيمة الدين (أعلى)</option>
                    <option value="debtorName">الاسم تصاعدياً</option>
                    <option value="createdAt">الأحدث تسجيلاً</option>
                  </select>
                </div>
              </div>

              {/* Filtering Selectors */}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#1A1A1A]/10">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/50 flex items-center gap-1 ml-1">
                  <Filter className="w-3.5 h-3.5" />
                  <span>تصفية حسب:</span>
                </span>

                {/* Priority Filters */}
                <div className="flex gap-1 bg-[#F7F3F0] border border-[#1A1A1A]/10 p-0.5 rounded-none">
                  <button
                    onClick={() => setFilterPriority('all')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-none transition-all cursor-pointer ${
                      filterPriority === 'all' ? 'bg-[#1A1A1A] text-white' : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
                    }`}
                  >
                    الكل
                  </button>
                  <button
                    onClick={() => setFilterPriority('high')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-none transition-all cursor-pointer ${
                      filterPriority === 'high' ? 'bg-red-800 text-white' : 'text-red-800/80 hover:bg-red-100'
                    }`}
                  >
                    حرجة
                  </button>
                  <button
                    onClick={() => setFilterPriority('medium')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-none transition-all cursor-pointer ${
                      filterPriority === 'medium' ? 'bg-amber-800 text-white' : 'text-amber-800/80 hover:bg-amber-100'
                    }`}
                  >
                    عادية
                  </button>
                  <button
                    onClick={() => setFilterPriority('low')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-none transition-all cursor-pointer ${
                      filterPriority === 'low' ? 'bg-emerald-800 text-white' : 'text-emerald-800/80 hover:bg-emerald-100'
                    }`}
                  >
                    منخفضة
                  </button>
                </div>

                {/* Status Filters */}
                <div className="flex gap-1 bg-[#F7F3F0] border border-[#1A1A1A]/10 p-0.5 rounded-none">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-none transition-all cursor-pointer ${
                      filterStatus === 'all' ? 'bg-[#1A1A1A] text-white' : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
                    }`}
                  >
                    كل الحالات
                  </button>
                  <button
                    onClick={() => setFilterStatus('unpaid')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-none transition-all cursor-pointer ${
                      filterStatus === 'unpaid' ? 'bg-red-900 text-white' : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
                    }`}
                  >
                    غير مسدد
                  </button>
                  <button
                    onClick={() => setFilterStatus('partial')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-none transition-all cursor-pointer ${
                      filterStatus === 'partial' ? 'bg-blue-900 text-white' : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
                    }`}
                  >
                    سداد جزئي
                  </button>
                  <button
                    onClick={() => setFilterStatus('paid')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-none transition-all cursor-pointer ${
                      filterStatus === 'paid' ? 'bg-emerald-900 text-white' : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
                    }`}
                  >
                    تم سداده
                  </button>
                  <button
                    onClick={() => setFilterStatus('overdue')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-none transition-all cursor-pointer ${
                      filterStatus === 'overdue' ? 'bg-red-600 text-white' : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    ⚠️ متأخرات
                  </button>
                </div>
              </div>
            </div>

            {/* Debt Cards Grid container */}
            {isLoading ? (
              <div className="bg-white rounded-none border border-[#1A1A1A] py-20 text-center space-y-4">
                <RefreshCw className="w-8 h-8 text-[#1A1A1A] animate-spin mx-auto" />
                <p className="text-xs uppercase tracking-widest font-bold text-[#1A1A1A]/60">جاري تحميل سجلات الديون المفتوحة...</p>
              </div>
            ) : filteredDebts.length === 0 ? (
              <div className="bg-white rounded-none border border-[#1A1A1A] py-16 text-center max-w-2xl mx-auto p-6 space-y-5">
                <div className="w-14 h-14 border border-[#1A1A1A]/20 bg-[#F7F3F0] rounded-none flex items-center justify-center mx-auto text-[#1A1A1A]">
                  <UserX className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-serif font-bold text-[#1A1A1A]">لا توجد ديون مطابقة لخيارات التصفية</h4>
                  <p className="text-xs text-[#1A1A1A]/60 mt-1 leading-relaxed">
                    لا يوجد أي أشخاص مدينين يطابقون بحثك الحالي أو أن الجدول فارغ تماماً. اضغط على زر "تسجيل دين جديد" للبدء في تتبع التزاماتك المالية.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterPriority('all');
                    setFilterStatus('all');
                  }}
                  className="text-xs font-bold text-[#1A1A1A] bg-[#F7F3F0] hover:bg-white border border-[#1A1A1A] px-4 py-2 rounded-none transition-colors cursor-pointer"
                >
                  إعادة تعيين مرشحات البحث
                </button>
              </div>
            ) : (
              <motion.div 
                layout 
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <AnimatePresence mode="popLayout">
                  {filteredDebts.map((debt) => (
                    <DebtCard
                      key={debt.id}
                      debt={debt}
                      onEdit={(d) => {
                        setEditingDebt(d);
                        setIsAddOpen(true);
                      }}
                      onDelete={handleDeleteDebt}
                      onOpenPayment={(d) => {
                        setSelectedDebt(d);
                        setIsPaymentOpen(true);
                      }}
                      onOpenHistory={(d) => {
                        setSelectedDebt(d);
                        setIsHistoryOpen(true);
                      }}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          {/* Left Column (w-1/3): Local Storage & PWA Support Guidance */}
          <div className="space-y-6">
            {/* Offline Storage Status Card */}
            <div className="bg-white border border-[#1A1A1A] rounded-none p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#1A1A1A]/10 text-[#1A1A1A]">
                <Database className="w-5 h-5 text-[#1A1A1A]" />
                <h4 className="text-sm font-serif font-black">حالة التخزين والخصوصية</h4>
              </div>
              <div className="space-y-3 text-xs leading-relaxed text-[#1A1A1A]/80">
                <p>
                  نظام <strong>"إيجاز"</strong> يعمل الآن بنمط <strong>التخزين المحلي الآمن (Offline Mode)</strong> بالكامل.
                </p>
                <div className="p-3 bg-[#F7F3F0] border border-[#1A1A1A]/10 text-[11px] space-y-1.5 rounded-none">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>البيانات آمنة ومحفوظة محلياً</span>
                  </div>
                  <p className="text-[#1A1A1A]/70">
                    يتم تشفير وتخزين جميع السجلات المالية، الديون، الدفعات، والتواريخ مباشرة داخل ذاكرة متصفحك الخاص (LocalStorage).
                  </p>
                </div>
                <p className="text-[#1A1A1A]/70 text-[11px]">
                  لا يتم إرسال أو مزامنة أي من ديونك أو بيانات الأشخاص مع أي خوادم خارجية، مما يمنحك خصوصية مطلقة 100% دون أي فرصة لتسريب البيانات المالية.
                </p>
              </div>
            </div>

            {/* PWA / Device Installation Card */}
            <div className="bg-[#1A1A1A] text-[#FDFCFB] rounded-none p-6 border border-[#1A1A1A] space-y-4">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#FDFCFB]/10 text-white">
                <Smartphone className="w-5 h-5 text-white" />
                <h4 className="text-sm font-serif font-black">تثبيت التطبيق على الجوال</h4>
              </div>
              <div className="space-y-3 text-xs leading-relaxed text-[#FDFCFB]/80 font-sans">
                <p>
                  بفضل دعم تقنية PWA، يمكنك تثبيت تطبيق "إيجاز" على هاتفك ليعمل كـ تطبيق محلي مستقل تماماً حتى في حال انقطاع الإنترنت بالكامل.
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-[11px] text-[#FDFCFB]/70 pr-1">
                  <li>سرعة استجابة فائقة للواجهات.</li>
                  <li>سهولة الوصول عبر أيقونة على الشاشة الرئيسية.</li>
                  <li>إمكانية تصوير بطاقات الديون وإرسالها للأشخاص بكل يسر.</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-[#1A1A1A] py-8 mt-16 text-center text-xs text-[#1A1A1A]/40 font-mono">
        <p>© 2026 مُذكّر الديون والالتزامات الذكي (إيجاز). جميع الحقوق محفوظة.</p>
        <p className="text-[10px] mt-1 text-[#1A1A1A]/30 font-sans">تطبيق ويب تقدمي (PWA) يعمل بالكامل دون اتصال بالإنترنت لموثوقية وحماية قصوى لبياناتك</p>
      </footer>

      {/* Modal Components */}
      <AnimatePresence>
        {isAddOpen && (
          <AddDebtModal
            isOpen={isAddOpen}
            onClose={() => {
              setIsAddOpen(false);
              setEditingDebt(null);
            }}
            onSave={handleSaveDebt}
            editingDebt={editingDebt}
          />
        )}

        {isPaymentOpen && selectedDebt && (
          <PaymentModal
            isOpen={isPaymentOpen}
            onClose={() => {
              setIsPaymentOpen(false);
              setSelectedDebt(null);
            }}
            debt={selectedDebt}
            onAddPayment={handleAddPayment}
          />
        )}

        {isHistoryOpen && selectedDebt && (
          <HistoryModal
            isOpen={isHistoryOpen}
            onClose={() => {
              setIsHistoryOpen(false);
              setSelectedDebt(null);
            }}
            debt={selectedDebt}
            onDeletePayment={handleDeletePayment}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
