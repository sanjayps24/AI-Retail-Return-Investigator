import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Clock, 
  PlusCircle, 
  Search, 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  RefreshCw, 
  ArrowRight,
  TrendingUp,
  Percent,
  AlertTriangle,
  ShoppingBag,
  Send,
  BookOpen
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

// Interface definitions
interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  purchase_date: string;
  product_name: string;
  product_category: string;
  price: number;
  status: string;
}

interface Policy {
  id: number;
  code: string;
  title: string;
  content: string;
  return_window_days: number | null;
}

interface Investigation {
  id: number;
  order_number: string;
  product_name: string;
  purchase_date: string | null;
  return_reason: string;
  customer_description: string;
  requested_resolution: string;
  decision: 'APPROVE' | 'REJECT' | 'REQUEST_INFORMATION' | 'MANUAL_REVIEW';
  confidence: number;
  category: string;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  policy_references: string[] | null;
  reasoning_summary: string;
  missing_information: string | null;
  recommended_action: string;
  customer_response: string;
  created_at: string;
}

interface Analytics {
  total_requests: number;
  total_orders: number;
  decisions: Record<string, number>;
  risks: Record<string, number>;
  categories: Record<string, number>;
  avg_confidence: number;
}

export default function App() {
  // Navigation & Core States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'new-request' | 'history' | 'policies' | 'orders'>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    total_requests: 0,
    total_orders: 0,
    decisions: { APPROVE: 0, REJECT: 0, REQUEST_INFORMATION: 0, MANUAL_REVIEW: 0 },
    risks: { LOW: 0, MEDIUM: 0, HIGH: 0 },
    categories: {},
    avg_confidence: 0
  });

  // Request Form States
  const [formOrderNum, setFormOrderNum] = useState('');
  const [formProduct, setFormProduct] = useState('');
  const [formReason, setFormReason] = useState('Wrong size');
  const [formDesc, setFormDesc] = useState('');
  const [formResolution, setFormResolution] = useState('REFUND');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Detail Modal / Pipeline view
  const [currentResult, setCurrentResult] = useState<Investigation | null>(null);
  const [showResultPanel, setShowResultPanel] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState<'audit' | 'llm' | 'email'>('audit');

  // Search filter
  const [historySearch, setHistorySearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [policySearch, setPolicySearch] = useState('');
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, policiesRes, investigationsRes, analyticsRes] = await Promise.all([
        fetch(`${API_BASE}/orders`),
        fetch(`${API_BASE}/policies`),
        fetch(`${API_BASE}/investigations`),
        fetch(`${API_BASE}/analytics`)
      ]);

      if (!ordersRes.ok || !policiesRes.ok || !investigationsRes.ok || !analyticsRes.ok) {
        throw new Error('Failed to retrieve API payloads from backend server.');
      }

      const ordersData = await ordersRes.json();
      const policiesData = await policiesRes.json();
      const investigationsData = await investigationsRes.json();
      const analyticsData = await analyticsRes.json();

      setOrders(ordersData);
      setPolicies(policiesData);
      setInvestigations(investigationsData);
      setAnalytics(analyticsData);
      setFetchError(null);
    } catch (err: any) {
      setFetchError(err.message || 'Connecting to backend FastAPI server failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync product name when selected order changes in the form
  const handleOrderChange = (ordNum: string) => {
    setFormOrderNum(ordNum);
    const matched = orders.find((o: Order) => o.order_number === ordNum);
    if (matched) {
      setFormProduct(matched.product_name);
    } else {
      setFormProduct('');
    }
  };

  // Submit new return claim
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOrderNum || !formProduct || !formDesc) {
      setSubmitError('Please fill out all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      const res = await fetch(`${API_BASE}/investigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: formOrderNum,
          product_name: formProduct,
          return_reason: formReason,
          customer_description: formDesc,
          requested_resolution: formResolution
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Investigation pipeline execution error.');
      }

      const data: Investigation = await res.json();
      setCurrentResult(data);
      setShowResultPanel(true);
      setActiveResultTab('audit');
      
      // Clear form
      setFormOrderNum('');
      setFormProduct('');
      setFormDesc('');
      
      // Refresh list & analytics
      fetchData();
    } catch (err: any) {
      setSubmitError(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Rendering Helpers
  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'APPROVE':
        return <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.3)' }} className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit"><CheckCircle size={14} /> Approved</span>;
      case 'REJECT':
        return <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.3)' }} className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit"><XCircle size={14} /> Rejected</span>;
      case 'REQUEST_INFORMATION':
        return <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)', border: '1px solid rgba(245, 158, 11, 0.3)' }} className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit"><HelpCircle size={14} /> Info Needed</span>;
      case 'MANUAL_REVIEW':
        return <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--color-info)', border: '1px solid rgba(59, 130, 246, 0.3)' }} className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit"><Clock size={14} /> Manual Review</span>;
      default:
        return null;
    }
  };

  const getRiskBadge = (level: string, score: number) => {
    let color = 'var(--color-success)';
    let bg = 'rgba(16, 185, 129, 0.1)';
    if (level === 'HIGH') {
      color = 'var(--color-danger)';
      bg = 'rgba(239, 68, 68, 0.1)';
    } else if (level === 'MEDIUM') {
      color = 'var(--color-warning)';
      bg = 'rgba(245, 158, 11, 0.1)';
    }
    return (
      <span style={{ color, background: bg, border: `1px solid ${color}30` }} className="px-2 py-0.5 rounded text-xs font-bold">
        {level} ({Math.round(score)}%)
      </span>
    );
  };

  // Filtered Lists
  const filteredHistory = investigations.filter((inv: Investigation) => 
    inv.order_number.toLowerCase().includes(historySearch.toLowerCase()) ||
    inv.product_name.toLowerCase().includes(historySearch.toLowerCase()) ||
    inv.category.toLowerCase().includes(historySearch.toLowerCase()) ||
    inv.decision.toLowerCase().includes(historySearch.toLowerCase())
  );

  const filteredOrders = orders.filter((ord: Order) =>
    ord.order_number.toLowerCase().includes(orderSearch.toLowerCase()) ||
    ord.customer_name.toLowerCase().includes(orderSearch.toLowerCase()) ||
    ord.product_name.toLowerCase().includes(orderSearch.toLowerCase())
  );

  const filteredPolicies = policies.filter((pol: Policy) =>
    pol.title.toLowerCase().includes(policySearch.toLowerCase()) ||
    pol.code.toLowerCase().includes(policySearch.toLowerCase()) ||
    pol.content.toLowerCase().includes(policySearch.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased text-gray-100 bg-[#080b11]">
      {/* Top Header Navigation */}
      <header className="glass-panel sticky top-0 z-50 flex items-center justify-between px-8 py-4 border-b border-white/5 rounded-none rounded-b-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldAlert className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
              AI Retail Return Investigator
            </h1>
            <p className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">GenAI Return Fraud Shield</p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <button 
            onClick={() => { setActiveTab('dashboard'); setShowResultPanel(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/35' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => { setActiveTab('new-request'); setShowResultPanel(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'new-request' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/35' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            New Return Request
          </button>
          <button 
            onClick={() => { setActiveTab('history'); setShowResultPanel(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/35' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Audit History
          </button>
          <button 
            onClick={() => { setActiveTab('orders'); setShowResultPanel(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/35' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Order DB
          </button>
          <button 
            onClick={() => { setActiveTab('policies'); setShowResultPanel(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'policies' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/35' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Policies
          </button>
          
          <button 
            onClick={fetchData} 
            className="p-2 ml-4 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={`${loading ? 'animate-spin' : ''}`} />
          </button>
        </nav>
      </header>

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-8 animate-fade-in">
        {fetchError && (
          <div className="glass-panel border-red-500/20 bg-red-950/15 p-4 rounded-xl flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-400" />
              <div>
                <h4 className="font-semibold text-red-200">Backend Connection Error</h4>
                <p className="text-xs text-red-300/80">{fetchError}. Please make sure your FastAPI backend dev server is running on port 8000.</p>
              </div>
            </div>
            <button onClick={fetchData} className="px-4 py-1.5 bg-red-800 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors">
              Retry Connection
            </button>
          </div>
        )}

        {/* 1. DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Analytics Header Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="glass-panel p-6 flex items-center justify-between relative overflow-hidden">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Claims Investigated</span>
                  <h3 className="text-3xl font-extrabold text-white">{analytics.total_requests}</h3>
                  <p className="text-[11px] text-gray-500">Across order database</p>
                </div>
                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400"><Activity size={24} /></div>
              </div>

              <div className="glass-panel p-6 flex items-center justify-between relative overflow-hidden">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Approval Rate</span>
                  <h3 className="text-3xl font-extrabold text-green-400">
                    {analytics.total_requests > 0 
                      ? `${Math.round(((analytics.decisions.APPROVE || 0) / analytics.total_requests) * 100)}%`
                      : '0%'}
                  </h3>
                  <p className="text-[11px] text-gray-500">({analytics.decisions.APPROVE || 0} claims approved)</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-xl text-green-400"><TrendingUp size={24} /></div>
              </div>

              <div className="glass-panel p-6 flex items-center justify-between relative overflow-hidden">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Average Confidence</span>
                  <h3 className="text-3xl font-extrabold text-cyan-400">
                    {Math.round(analytics.avg_confidence * 100)}%
                  </h3>
                  <p className="text-[11px] text-gray-500">LLM structured confidence</p>
                </div>
                <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400"><Percent size={24} /></div>
              </div>

              <div className="glass-panel p-6 flex items-center justify-between relative overflow-hidden">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Security Audits Queue</span>
                  <h3 className="text-3xl font-extrabold text-amber-500">
                    {(analytics.decisions.MANUAL_REVIEW || 0)}
                  </h3>
                  <p className="text-[11px] text-gray-500">Claims flagged for manual inspection</p>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400"><ShieldAlert size={24} /></div>
              </div>
            </div>

            {/* Middle Section: Submit Fast Claim & Risk Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form card */}
              <div className="glass-panel p-6 lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <PlusCircle className="text-indigo-400" size={20} /> File Return Investigation Request
                  </h3>
                  <p className="text-sm text-gray-400">Enter a customer's refund or return claim details to run the automated investigation pipeline.</p>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {submitError && (
                    <div className="bg-red-950/20 border border-red-500/30 text-red-300 text-xs p-3 rounded-lg">
                      {submitError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-400">Select Order</label>
                      <select 
                        value={formOrderNum} 
                        onChange={(e) => handleOrderChange(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        required
                      >
                        <option value="">-- Choose Order Number --</option>
                        {orders.map((o: Order) => (
                          <option key={o.id} value={o.order_number}>
                            {o.order_number} - {o.customer_name} ({o.product_name})
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-gray-500">Provides deterministic parameters & date logs</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-400">Product Name</label>
                      <input 
                        type="text" 
                        value={formProduct}
                        onChange={(e) => setFormProduct(e.target.value)}
                        placeholder="Select an order or type name..."
                        className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-400">Return Reason</label>
                      <select 
                        value={formReason} 
                        onChange={(e) => setFormReason(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Wrong size">Wrong size</option>
                        <option value="Defective">Defective / Damaged</option>
                        <option value="Changed mind">Changed mind / Buyer Remorse</option>
                        <option value="Incorrect item received">Incorrect item received</option>
                        <option value="Clearance item remorse">Clearance item buyer remorse</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-400">Requested Resolution</label>
                      <select 
                        value={formResolution} 
                        onChange={(e) => setFormResolution(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="REFUND">REFUND</option>
                        <option value="REPLACEMENT">REPLACEMENT</option>
                        <option value="STORE_CREDIT">STORE CREDIT</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400">Customer Claim Description</label>
                    <textarea 
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      placeholder="Paste customer email description or comments explaining why they are requesting the return..."
                      rows={3}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Running Pipeline, Policy RAG & Decision Logic...
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Run Automated Claim Investigation
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Status Breakdown & Details */}
              <div className="glass-panel p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Risk & Decisions Metrics</h3>
                  <p className="text-sm text-gray-400">Breakdown of return claims outcomes.</p>
                </div>

                <div className="space-y-4">
                  {/* Decision list */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Outcome Distribution</span>
                    <div className="space-y-2">
                      {Object.entries(analytics.decisions).map(([decision, count]: [string, number]) => {
                        const total = analytics.total_requests || 1;
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={decision} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span>{decision}</span>
                              <span className="text-gray-400">{count} ({pct}%)</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-1.5">
                              <div 
                                style={{ width: `${pct}%`, background: decision === 'APPROVE' ? 'var(--color-success)' : decision === 'REJECT' ? 'var(--color-danger)' : 'var(--accent-indigo)' }} 
                                className="h-1.5 rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Risk categories */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Risk Levels</span>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-green-500/5 border border-green-500/10 p-2.5 rounded-lg">
                        <span className="text-xs block text-gray-400">LOW</span>
                        <span className="text-lg font-bold text-green-400">{analytics.risks.LOW || 0}</span>
                      </div>
                      <div className="bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg">
                        <span className="text-xs block text-gray-400">MEDIUM</span>
                        <span className="text-lg font-bold text-amber-400">{analytics.risks.MEDIUM || 0}</span>
                      </div>
                      <div className="bg-red-500/5 border border-red-500/10 p-2.5 rounded-lg">
                        <span className="text-xs block text-gray-400">HIGH</span>
                        <span className="text-lg font-bold text-red-400">{analytics.risks.HIGH || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Investigation Result Box */}
            {showResultPanel && currentResult && (
              <div className="glass-panel p-6 border-indigo-500/30 bg-indigo-950/5 space-y-6 animate-fade-in">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Investigation Report</span>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      Order: {currentResult.order_number} <ArrowRight size={16} /> {currentResult.product_name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    {getDecisionBadge(currentResult.decision)}
                    {getRiskBadge(currentResult.risk_level, currentResult.risk_score)}
                  </div>
                </div>

                {/* Sub Tab buttons */}
                <div className="flex gap-2 border-b border-white/5">
                  <button 
                    onClick={() => setActiveResultTab('audit')}
                    className={`pb-2 px-4 text-sm font-semibold border-b-2 transition-all ${activeResultTab === 'audit' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                  >
                    Workflow Steps & Audit
                  </button>
                  <button 
                    onClick={() => setActiveResultTab('llm')}
                    className={`pb-2 px-4 text-sm font-semibold border-b-2 transition-all ${activeResultTab === 'llm' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                  >
                    LLM Reasoning & Rules
                  </button>
                  <button 
                    onClick={() => setActiveResultTab('email')}
                    className={`pb-2 px-4 text-sm font-semibold border-b-2 transition-all ${activeResultTab === 'email' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                  >
                    Generated Customer Email
                  </button>
                </div>

                {/* Content based on sub tabs */}
                {activeResultTab === 'audit' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    {/* Left: Claim Data */}
                    <div className="space-y-4 bg-slate-900/40 p-4 rounded-xl border border-white/5">
                      <h4 className="font-bold text-white flex items-center gap-1.5 text-xs uppercase tracking-wider text-gray-400"><ShoppingBag size={14} /> Claim Info</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-400">Order:</span> <span className="font-semibold text-white">{currentResult.order_number}</span></div>
                        <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-400">Product:</span> <span className="font-semibold text-white text-right">{currentResult.product_name}</span></div>
                        <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-400">Category:</span> <span className="font-semibold text-white">{currentResult.category}</span></div>
                        <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-400">Reason:</span> <span className="font-semibold text-white">{currentResult.return_reason}</span></div>
                        <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-400">Resolution:</span> <span className="font-semibold text-white">{currentResult.requested_resolution}</span></div>
                        <div className="flex flex-col gap-1 pt-1">
                          <span className="text-gray-400">Customer Description:</span>
                          <p className="bg-black/35 p-2 rounded text-gray-300 italic">{currentResult.customer_description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Middle: RAG Matches */}
                    <div className="space-y-4 bg-slate-900/40 p-4 rounded-xl border border-white/5">
                      <h4 className="font-bold text-white flex items-center gap-1.5 text-xs uppercase tracking-wider text-gray-400"><BookOpen size={14} /> RAG Retrieved Policies</h4>
                      <div className="space-y-3">
                        {currentResult.policy_references && currentResult.policy_references.length > 0 ? (
                          currentResult.policy_references.map((pCode: string, idx: number) => (
                            <div key={idx} className="bg-slate-900/80 p-2.5 rounded border border-white/5">
                              <div className="flex justify-between text-[11px] font-bold text-indigo-300 mb-1">
                                <span>Code: {pCode}</span>
                                <span>Match Priority #{idx+1}</span>
                              </div>
                              <p className="text-[10px] text-gray-400 line-clamp-3">Retrieved policy references were passed to the structured decision model engine.</p>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-gray-500 italic">No direct policy matches indexed.</div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="space-y-4 bg-slate-900/40 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                      <div className="space-y-2">
                        <h4 className="font-bold text-white flex items-center gap-1.5 text-xs uppercase tracking-wider text-gray-400"><CheckCircle size={14} /> Recommended Action</h4>
                        <p className="text-xs font-semibold text-white bg-indigo-500/10 border border-indigo-500/25 p-3 rounded-lg">
                          {currentResult.recommended_action}
                        </p>
                      </div>

                      {currentResult.missing_information && (
                        <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-lg text-xs space-y-1">
                          <span className="font-bold text-amber-400 flex items-center gap-1"><AlertTriangle size={12} /> Missing Information Required:</span>
                          <p className="text-gray-300">{currentResult.missing_information}</p>
                        </div>
                      )}

                      <button 
                        onClick={() => { setActiveTab('history'); setShowResultPanel(false); }}
                        className="w-full bg-white/5 hover:bg-white/10 text-xs font-bold py-2 rounded-lg transition-colors border border-white/10 flex items-center justify-center gap-1"
                      >
                        View Full History Log <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                )}

                {activeResultTab === 'llm' && (
                  <div className="space-y-4 text-sm">
                    <div className="space-y-1 bg-slate-900/60 p-4 rounded-xl border border-white/5">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Internal Decision Reasoning Breakdown</span>
                      <p className="text-gray-300 leading-relaxed font-mono text-xs whitespace-pre-wrap">{currentResult.reasoning_summary}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/5">
                        <span className="text-[11px] text-gray-400 font-bold block mb-1">DETERMINISTIC CHECKS</span>
                        <ul className="text-xs space-y-1.5 text-gray-300">
                          <li className="flex items-center gap-2"><CheckCircle size={12} className="text-green-400" /> Order Verification Status: <span className="font-semibold text-white">Verified</span></li>
                          <li className="flex items-center gap-2"><CheckCircle size={12} className="text-green-400" /> Catalog Matches: <span className="font-semibold text-white">Completed</span></li>
                        </ul>
                      </div>
                      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/5">
                        <span className="text-[11px] text-gray-400 font-bold block mb-1">PROBABILISTIC MODEL CHECKS</span>
                        <ul className="text-xs space-y-1.5 text-gray-300">
                          <li className="flex items-center gap-2"><CheckCircle size={12} className="text-indigo-400" /> Confidence Level: <span className="font-semibold text-white">{Math.round(currentResult.confidence * 100)}%</span></li>
                          <li className="flex items-center gap-2"><CheckCircle size={12} className="text-indigo-400" /> Classifier Risk: <span className="font-semibold text-white">{currentResult.risk_level} ({Math.round(currentResult.risk_score)}%)</span></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {activeResultTab === 'email' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Generated Customer-Facing Reply</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(currentResult.customer_response)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                    <div className="bg-slate-900 border border-white/5 p-4 rounded-xl text-xs font-mono text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {currentResult.customer_response}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. NEW REQUEST VIEW */}
        {activeTab === 'new-request' && (
          <div className="max-w-2xl mx-auto glass-panel p-8 space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <PlusCircle className="text-indigo-400" /> Launch Investigation Pipeline
              </h2>
              <p className="text-sm text-gray-400">File a retail claim against active orders to retrieve policies, check risk levels and decide resolution.</p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {submitError && (
                <div className="bg-red-950/20 border border-red-500/30 text-red-300 text-xs p-3 rounded-lg">
                  {submitError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Verify against Customer Order</label>
                <select 
                  value={formOrderNum} 
                  onChange={(e) => handleOrderChange(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="">-- Choose Order Number --</option>
                  {orders.map((o: Order) => (
                    <option key={o.id} value={o.order_number}>
                      {o.order_number} - {o.customer_name} ({o.product_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Product Name</label>
                <input 
                  type="text" 
                  value={formProduct}
                  onChange={(e) => setFormProduct(e.target.value)}
                  placeholder="E.g. Wireless headphones..."
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">Return Reason Category</label>
                  <select 
                    value={formReason} 
                    onChange={(e) => setFormReason(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Wrong size">Wrong size / Fit issue</option>
                    <option value="Defective">Defective or Damaged</option>
                    <option value="Changed mind">Changed mind / Buyer Remorse</option>
                    <option value="Incorrect item received">Incorrect item received</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">Requested Resolution</label>
                  <select 
                    value={formResolution} 
                    onChange={(e) => setFormResolution(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="REFUND">REFUND</option>
                    <option value="REPLACEMENT">REPLACEMENT</option>
                    <option value="STORE_CREDIT">STORE CREDIT</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Customer description of the claim</label>
                <textarea 
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Paste details of customer comments..."
                  rows={4}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold py-3 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Analyzing policies & generating decision...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Execute Claim Analysis
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* 3. HISTORY LOG VIEW */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Audit Trail History</h2>
                <p className="text-sm text-gray-400">Review all previously processed return investigations.</p>
              </div>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Search order number or category..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="glass-panel overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/60 text-gray-400 font-semibold border-b border-white/5">
                    <th className="p-4">Order Code</th>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">Risk Level</th>
                    <th className="p-4">Workflow Category</th>
                    <th className="p-4">Decision Result</th>
                    <th className="p-4">Confidence</th>
                    <th className="p-4">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((item: Investigation) => (
                      <tr 
                        key={item.id} 
                        className="hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => {
                          setCurrentResult(item);
                          setActiveTab('dashboard');
                          setShowResultPanel(true);
                          setActiveResultTab('audit');
                        }}
                      >
                        <td className="p-4 font-bold text-indigo-400">{item.order_number}</td>
                        <td className="p-4 text-white font-medium">{item.product_name}</td>
                        <td className="p-4">{getRiskBadge(item.risk_level, item.risk_score)}</td>
                        <td className="p-4 text-gray-300">{item.category}</td>
                        <td className="p-4">{getDecisionBadge(item.decision)}</td>
                        <td className="p-4 font-bold text-cyan-400">{Math.round(item.confidence * 100)}%</td>
                        <td className="p-4 text-gray-500">{new Date(item.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500 italic">No return investigations logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. ORDERS VIEW */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Seeded Purchase Orders Database</h2>
                <p className="text-sm text-gray-400">View orders available in database for claim matching.</p>
              </div>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Search client, email or order..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="glass-panel overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/60 text-gray-400 font-semibold border-b border-white/5">
                    <th className="p-4">Order Number</th>
                    <th className="p-4">Client Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Purchase Date</th>
                    <th className="p-4">Product Category</th>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">Item Price</th>
                    <th className="p-4">Delivery Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((ord: Order) => (
                      <tr key={ord.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-bold text-indigo-400">{ord.order_number}</td>
                        <td className="p-4 text-white font-medium">{ord.customer_name}</td>
                        <td className="p-4 text-gray-400">{ord.customer_email}</td>
                        <td className="p-4 text-gray-400">{new Date(ord.purchase_date).toLocaleDateString()}</td>
                        <td className="p-4 text-gray-300">{ord.product_category}</td>
                        <td className="p-4 text-white">{ord.product_name}</td>
                        <td className="p-4 text-cyan-400 font-bold">${ord.price}</td>
                        <td className="p-4">
                          <span className="bg-green-500/10 border border-green-500/25 px-2 py-0.5 rounded text-green-400 font-bold text-[10px]">
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500 italic">No purchase orders seeded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. POLICIES VIEW */}
        {activeTab === 'policies' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Active Returns Policy Database</h2>
                <p className="text-sm text-gray-400">RAG knowledge base parsed during decision making.</p>
              </div>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Search policy index..."
                  value={policySearch}
                  onChange={(e) => setPolicySearch(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPolicies.length > 0 ? (
                filteredPolicies.map((pol: Policy) => (
                  <div key={pol.id} className="glass-panel p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <h3 className="font-extrabold text-white text-base">{pol.title}</h3>
                      <span className="bg-indigo-500/10 border border-indigo-500/35 text-indigo-400 font-bold px-2.5 py-0.5 rounded text-[11px]">
                        Code: {pol.code}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed font-medium">{pol.content}</p>
                    <div className="text-[11px] text-gray-500 flex justify-between">
                      <span>Return Window Limit:</span>
                      <span className="text-gray-300 font-bold">
                        {pol.return_window_days !== null ? `${pol.return_window_days} Days` : 'N/A'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-8 text-center text-gray-500 italic">No returns policies indexed.</div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-6 text-center text-xs text-gray-500 border-t border-white/5">
        AI Retail Return Investigator Dashboard • Powered by FastAPI & Gemini API
      </footer>
    </div>
  );
}
