import React, { useEffect, useState } from 'react';
import { useFPAStore } from './store';
import { 
  LayoutDashboard, 
  Building2, 
  TrendingUp, 
  AlertCircle, 
  FileText, 
  Mail, 
  Activity as ActivityIcon,
  ChevronRight,
  Search,
  Bell
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COMPANIES = [
  { id: 'cloudcrm_inc', name: 'CloudCRM Inc', industry: 'SaaS' },
  { id: 'manufacturetech_co', name: 'ManufactureTech Co', industry: 'Manufacturing' },
  { id: 'healthcaretech', name: 'HealthcareTech Solutions', industry: 'Healthcare IT' },
  { id: 'ecommerce_logistics', name: 'E-commerce Logistics', industry: 'Logistics' },
  { id: 'fintech_payments', name: 'FinTech Payments', industry: 'FinTech' },
  { id: 'industrial_services', name: 'Industrial Services Group', industry: 'Services' },
];

export default function App() {
  const { 
    activities, 
    portfolioData, 
    currentCompany, 
    fetchPortfolio, 
    fetchCompany, 
    fetchActivities 
  } = useFPAStore();

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [view, setView] = useState<'portfolio' | 'company'>('portfolio');

  useEffect(() => {
    fetchPortfolio();
    fetchActivities();
  }, []);

  const handleCompanySelect = (id: string) => {
    setSelectedCompanyId(id);
    fetchCompany(id);
    setView('company');
  };

  return (
    <div className="flex h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans selection:bg-emerald-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-black/5 flex flex-col">
        <div className="p-6 border-b border-black/5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
            <h1 className="font-semibold text-lg tracking-tight">Summit Growth</h1>
          </div>
          <p className="text-xs text-black/40 font-medium uppercase tracking-widest">FP&A Command Center</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button 
            onClick={() => setView('portfolio')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200",
              view === 'portfolio' ? "bg-emerald-50 text-emerald-700 font-medium" : "hover:bg-black/5 text-black/60"
            )}
          >
            <LayoutDashboard size={18} />
            <span>Portfolio Overview</span>
          </button>
          
          <div className="pt-4 pb-2 px-3">
            <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest">Portfolio Companies</p>
          </div>
          
          {COMPANIES.map(company => (
            <button 
              key={company.id}
              onClick={() => handleCompanySelect(company.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 text-sm",
                selectedCompanyId === company.id && view === 'company' ? "bg-emerald-50 text-emerald-700 font-medium" : "hover:bg-black/5 text-black/60"
              )}
            >
              <div className="flex items-center gap-3">
                <Building2 size={16} />
                <span>{company.name}</span>
              </div>
              {selectedCompanyId === company.id && view === 'company' && <ChevronRight size={14} />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-black/5">
          <div className="bg-black/5 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Agent Status</p>
            </div>
            <p className="text-xs font-medium text-black/70">10 Agents Active</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-black/5 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" size={16} />
              <input 
                type="text" 
                placeholder="Search metrics, companies, or agent insights..." 
                className="w-full pl-10 pr-4 py-2 bg-black/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-black/5 rounded-full relative transition-colors">
              <Bell size={20} className="text-black/60" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-[1px] bg-black/5 mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold">Deepika P.</p>
                <p className="text-[10px] text-black/40 font-bold uppercase tracking-wider">CFO Partner</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold border border-emerald-200">DP</div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {view === 'portfolio' ? (
              <PortfolioView data={portfolioData} onCompanySelect={handleCompanySelect} />
            ) : (
              <CompanyView company={currentCompany} id={selectedCompanyId} />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Activity Sidebar */}
      <aside className="w-80 bg-white border-l border-black/5 flex flex-col shrink-0">
        <div className="p-6 border-b border-black/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ActivityIcon size={18} className="text-emerald-600" />
            <h2 className="font-semibold tracking-tight">Agent Activity</h2>
          </div>
          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full uppercase tracking-wider">Live</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activities.map((activity, i) => (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              key={activity.id || `activity-${i}`} 
              className="p-4 bg-black/5 rounded-2xl space-y-2 border border-transparent hover:border-black/5 transition-all"
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">{activity.agent_name}</p>
                <p className="text-[10px] text-black/30">{new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <p className="text-sm font-medium leading-snug">{activity.action}</p>
              {activity.details && (
                <p className="text-xs text-black/50 line-clamp-2 italic">"{activity.details}"</p>
              )}
            </motion.div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function PortfolioView({ data, onCompanySelect }: { data: any[], onCompanySelect: (id: string) => void }) {
  const aggregated = data.reduce((acc: any, curr: any) => {
    if (!acc[curr.metric]) acc[curr.metric] = 0;
    acc[curr.metric] += curr.total;
    return acc;
  }, {});

  const chartData = COMPANIES.map(c => {
    const companyData = data.filter(d => d.company === c.id);
    return {
      name: c.name,
      revenue: companyData.find(d => d.metric === 'revenue')?.total || 0,
      ebitda: companyData.find(d => d.metric === 'ebitda')?.total || 0,
    };
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-1">Portfolio Performance</h2>
          <p className="text-black/40 font-medium">Aggregated metrics across 6 portfolio companies (FY 2025)</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-black/5 rounded-xl text-sm font-medium hover:bg-black/5 transition-colors">Export Report</button>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20">Planning Cycle: Active</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <StatCard label="Total Revenue" value={`$${((aggregated.revenue || 0) / 1e6).toFixed(1)}M`} trend="+12.4%" />
        <StatCard label="Total EBITDA" value={`$${((aggregated.ebitda || 0) / 1e6).toFixed(1)}M`} trend="+8.2%" />
        <StatCard label="EBITDA Margin" value={`${(((aggregated.ebitda || 0) / (aggregated.revenue || 1)) * 100).toFixed(1)}%`} trend="+1.2%" />
        <StatCard label="Active Initiatives" value="18" trend="+3" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg tracking-tight">Revenue vs EBITDA by Company</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span className="text-xs font-medium text-black/50">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full" />
                <span className="text-xs font-medium text-black/50">EBITDA</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999' }} tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} />
                <Tooltip 
                  cursor={{ fill: '#F9F9F9' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="ebitda" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm flex flex-col">
          <h3 className="font-bold text-lg tracking-tight mb-6">Portfolio Health</h3>
          <div className="flex-1 space-y-6">
            {COMPANIES.map(c => {
              const cData = chartData.find(d => d.name === c.name);
              const margin = cData ? (cData.ebitda / cData.revenue) * 100 : 0;
              return (
                <div key={c.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-black/40 font-bold">{margin.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${margin * 2}%` }}
                      className={cn(
                        "h-full rounded-full",
                        margin > 20 ? "bg-emerald-500" : margin > 10 ? "bg-amber-500" : "bg-red-500"
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CompanyView({ company, id }: { company: any, id: string | null }) {
  if (!company) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto animate-spin">
          <ActivityIcon className="text-black/20" />
        </div>
        <p className="text-black/40 font-medium">Loading company intelligence...</p>
      </div>
    </div>
  );

  const revenueData = company.financials.filter((f: any) => f.metric === 'revenue');
  const kpiData = company.kpis.filter((k: any) => k.kpi_name === 'arr' || k.kpi_name === 'gross_margin');

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-white rounded-3xl border border-black/5 shadow-sm flex items-center justify-center text-3xl">
            {COMPANIES.find(c => c.id === id)?.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-bold tracking-tight">{COMPANIES.find(c => c.id === id)?.name}</h2>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-widest">High Growth</span>
            </div>
            <p className="text-black/40 font-medium">{COMPANIES.find(c => c.id === id)?.industry} • Portfolio Company since 2023</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-6 py-3 bg-white border border-black/5 rounded-2xl text-sm font-semibold hover:bg-black/5 transition-all">Scenario Builder</button>
          <button className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">Run Forecast Agent</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm">
            <h3 className="font-bold text-lg tracking-tight mb-8">Revenue Performance (LTM)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData.slice(-12)}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999' }} tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm">
              <h3 className="font-bold text-sm uppercase tracking-widest text-black/30 mb-6">Key Performance Indicators</h3>
              <div className="space-y-6">
                {kpiData.slice(-3).map((k: any, i: number) => (
                  <div key={k.id || `kpi-${i}`} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-black/50 uppercase tracking-wider">{k.kpi_name}</p>
                      <p className="text-xl font-bold">{k.kpi_name === 'arr' ? `$${(k.value / 1e6).toFixed(1)}M` : `${(k.value * 100).toFixed(1)}%`}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest">Target</p>
                      <p className="text-xs font-bold text-emerald-600">{k.kpi_name === 'arr' ? `$${(k.target / 1e6).toFixed(1)}M` : `${(k.target * 100).toFixed(1)}%`}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm">
              <h3 className="font-bold text-sm uppercase tracking-widest text-black/30 mb-6">Agent Insights</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <TrendingUp size={14} className="text-indigo-600" />
                  </div>
                  <p className="text-xs leading-relaxed text-black/70">
                    <span className="font-bold text-black">Revenue Agent:</span> Seasonality in Q4 expected to be 15% higher than previous years based on current pipeline.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <AlertCircle size={14} className="text-red-600" />
                  </div>
                  <p className="text-xs leading-relaxed text-black/70">
                    <span className="font-bold text-black">KPI Agent:</span> Churn risk detected in Enterprise segment. 3 key accounts showing low utilization.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm">
            <h3 className="font-bold text-lg tracking-tight mb-6">Strategic Initiatives</h3>
            <div className="space-y-4">
              <InitiativeItem name="Enterprise Tier Launch" status="In Progress" value="$8.0M" />
              <InitiativeItem name="International Expansion" status="Planning" value="$12.5M" />
              <InitiativeItem name="Cost Optimization" status="Completed" value="$2.1M" />
            </div>
          </div>
          <div className="bg-emerald-900 p-8 rounded-[32px] text-white shadow-xl shadow-emerald-900/20">
            <h3 className="font-bold text-lg mb-4">Autonomous Reforecast</h3>
            <p className="text-emerald-100/60 text-xs mb-6 leading-relaxed">The system automatically updates your 12-month rolling forecast every time new actuals arrive.</p>
            <button className="w-full py-3 bg-emerald-500 rounded-2xl text-sm font-bold hover:bg-emerald-400 transition-all">View Latest Forecast</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, trend }: { label: string, value: string, trend: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-2">
      <p className="text-xs font-bold text-black/30 uppercase tracking-widest">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">{trend}</span>
      </div>
    </div>
  );
}

function InitiativeItem({ name, status, value }: { name: string, status: string, value: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-black/5 rounded-2xl">
      <div>
        <p className="text-sm font-bold">{name}</p>
        <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest">{status}</p>
      </div>
      <p className="text-sm font-bold text-emerald-600">{value}</p>
    </div>
  );
}
