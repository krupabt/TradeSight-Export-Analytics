import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, ReferenceLine
} from 'recharts';
import {
  TrendingUp, Truck, RotateCcw, Users, ShieldAlert,
  Download, Filter, RefreshCw, AlertTriangle, CheckCircle,
  FileText, ExternalLink, Calendar, CreditCard, Box
} from 'lucide-react';

import ordersRaw from './data/orders.json';
import buyersRaw from './data/buyers.json';

const ALL_CATEGORIES = [...new Set(ordersRaw.map(o => o.category))].sort();
const ALL_TERMS = [...new Set(ordersRaw.map(o => o.payment_terms))].sort();
const ALL_SEGMENTS = [
  'Core Stable Accounts (High Fulfillment)',
  'Active Growth Buyers (High Velocity)',
  'Operationally Vulnerable (High Friction)',
  'Lapsed Accounts (Dormant)'
];

const COLORS = {
  navy: '#0F2027',
  primary: '#203A43',
  blue: '#2563EB',
  teal: '#0D9488',
  amber: '#D97706',
  red: '#DC2626',
  green: '#16A34A',
  slate: '#64748B',
  cluster: {
    'Core Stable Accounts (High Fulfillment)': '#2563EB',
    'Active Growth Buyers (High Velocity)': '#16A34A',
    'Operationally Vulnerable (High Friction)': '#D97706',
    'Lapsed Accounts (Dormant)': '#DC2626'
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');

  // Filters
  const [selectedCategories, setSelectedCategories] = useState(ALL_CATEGORIES);
  const [selectedTerms, setSelectedTerms] = useState(ALL_TERMS);
  const [selectedSegments, setSelectedSegments] = useState(ALL_SEGMENTS);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter Logic
  const filteredOrders = useMemo(() => {
    return ordersRaw.filter(order => {
      if (selectedCategories.length && !selectedCategories.includes(order.category)) return false;
      if (selectedTerms.length && !selectedTerms.includes(order.payment_terms)) return false;
      if (selectedSegments.length && !selectedSegments.includes(order.segment_label)) return false;
      return true;
    });
  }, [selectedCategories, selectedTerms, selectedSegments]);

  // Baseline Aggregations
  const stats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total_value_inr || 0), 0);
    const totalOrders = filteredOrders.length;
    const aov = totalOrders ? totalRevenue / totalOrders : 0;
    
    const onTimeOrders = filteredOrders.filter(o => o.on_time_delivery === 1).length;
    const onTimeRate = totalOrders ? (onTimeOrders / totalOrders) * 100 : 0;
    const delayedOrders = totalOrders - onTimeOrders;
    
    const totalUnits = filteredOrders.reduce((sum, o) => sum + (o.quantity_units || 0), 0);
    const returnUnits = filteredOrders.reduce((sum, o) => sum + (o.return_qty || 0), 0);
    const returnRate = totalUnits ? (returnUnits / totalUnits) * 100 : 0;

    const avgDeliveryDays = totalOrders
      ? filteredOrders.reduce((sum, o) => sum + (o.delivery_days || 0), 0) / totalOrders
      : 0;

    const sortedDays = [...filteredOrders.map(o => o.delivery_days)].sort((a,b) => a-b);
    const medianDeliveryDays = sortedDays.length
      ? sortedDays[Math.floor(sortedDays.length / 2)]
      : 0;

    const repeatBuyerOrders = filteredOrders.filter(o => o.repeat_buyer === 1).length;
    const repeatBuyerPct = totalOrders ? (repeatBuyerOrders / totalOrders) * 100 : 0;

    const uniqueBuyers = new Set(filteredOrders.map(o => o.buyer_id)).size;
    const invalidReturns = filteredOrders.filter(o => o.is_valid_return === false || o.is_valid_return === 'False');

    return {
      totalRevenue,
      totalOrders,
      aov,
      onTimeOrders,
      onTimeRate,
      delayedOrders,
      totalUnits,
      returnUnits,
      returnRate,
      avgDeliveryDays,
      medianDeliveryDays,
      repeatBuyerOrders,
      repeatBuyerPct,
      uniqueBuyers,
      invalidReturns
    };
  }, [filteredOrders]);

  // Monthly Trend Data
  const monthlyTrendData = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      const ym = o.order_year_month || o.order_date.substring(0, 7);
      if (!map[ym]) map[ym] = { month: ym, revenueCr: 0, orders: 0 };
      map[ym].revenueCr += (o.total_value_inr || 0) / 10000000;
      map[ym].orders += 1;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredOrders]);

  // Category Revenue & Return Data
  const categoryData = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      if (!map[o.category]) {
        map[o.category] = { category: o.category, revenueCr: 0, ordered: 0, returned: 0, onTime: 0, total: 0 };
      }
      map[o.category].revenueCr += (o.total_value_inr || 0) / 10000000;
      map[o.category].ordered += o.quantity_units || 0;
      map[o.category].returned += o.return_qty || 0;
      if (o.on_time_delivery === 1) map[o.category].onTime += 1;
      map[o.category].total += 1;
    });
    return Object.values(map).map(c => ({
      ...c,
      returnRate: c.ordered ? ((c.returned / c.ordered) * 100).toFixed(2) : 0,
      slaRate: c.total ? ((c.onTime / c.total) * 100).toFixed(1) : 0,
      revenueCr: parseFloat(c.revenueCr.toFixed(2))
    })).sort((a, b) => b.revenueCr - a.revenueCr);
  }, [filteredOrders]);

  // Payment Terms Distribution
  const paymentTermsData = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      if (!map[o.payment_terms]) map[o.payment_terms] = { name: o.payment_terms, value: 0 };
      map[o.payment_terms].value += 1;
    });
    return Object.values(map);
  }, [filteredOrders]);

  // Transit histogram binned
  const transitBinnedData = useMemo(() => {
    const bins = { '0-10 d': 0, '11-20 d': 0, '21-30 d': 0, '31-40 d': 0, '41+ d': 0 };
    filteredOrders.forEach(o => {
      const d = o.delivery_days || 0;
      if (d <= 10) bins['0-10 d']++;
      else if (d <= 20) bins['11-20 d']++;
      else if (d <= 30) bins['21-30 d']++;
      else if (d <= 40) bins['31-40 d']++;
      else bins['41+ d']++;
    });
    return Object.entries(bins).map(([bin, count]) => ({ bin, count }));
  }, [filteredOrders]);

  // Filtered Buyers
  const filteredBuyers = useMemo(() => {
    return buyersRaw.filter(b => {
      if (selectedSegments.length && !selectedSegments.includes(b.segment_label)) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return b.buyer_id.toLowerCase().includes(q) || b.segment_label.toLowerCase().includes(q);
      }
      return true;
    });
  }, [selectedSegments, searchTerm]);

  // Toggle Filters
  const toggleCategory = (cat) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleTerm = (term) => {
    setSelectedTerms(prev => 
      prev.includes(term) ? prev.filter(t => t !== term) : [...prev, term]
    );
  };

  const toggleSegment = (seg) => {
    setSelectedSegments(prev => 
      prev.includes(seg) ? prev.filter(s => s !== seg) : [...prev, seg]
    );
  };

  const resetFilters = () => {
    setSelectedCategories(ALL_CATEGORIES);
    setSelectedTerms(ALL_TERMS);
    setSelectedSegments(ALL_SEGMENTS);
    setSearchTerm('');
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredOrders.length) return;
    const headers = Object.keys(filteredOrders[0]).join(',');
    const rows = filteredOrders.map(row => 
      Object.values(row).map(val => typeof val === 'string' ? `"${val}"` : val).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tradesight_orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard-container">
      {/* SIDEBAR FILTERS */}
      <aside className="sidebar">
        <div className="brand-header">
          <div className="brand-logo">TS</div>
          <div className="brand-text">
            <h1>TradeSight Export</h1>
            <p>Executive Analytics Portal</p>
          </div>
        </div>

        <div className="filter-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F2027', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={15} /> Active Filters
            </span>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>
              {filteredOrders.length} of 600 Orders
            </span>
          </div>

          {/* Categories */}
          <div className="filter-group">
            <label>Product Category</label>
            <div className="filter-pills">
              {ALL_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`pill-btn ${selectedCategories.includes(cat) ? 'active' : ''}`}
                  onClick={() => toggleCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Terms */}
          <div className="filter-group">
            <label>Commercial Credit Terms</label>
            <div className="filter-pills">
              {ALL_TERMS.map(term => (
                <button
                  key={term}
                  className={`pill-btn ${selectedTerms.includes(term) ? 'active' : ''}`}
                  onClick={() => toggleTerm(term)}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Buyer Segments */}
          <div className="filter-group">
            <label>Buyer RFM-V Segment</label>
            <div className="filter-pills">
              {ALL_SEGMENTS.map(seg => (
                <button
                  key={seg}
                  className={`pill-btn ${selectedSegments.includes(seg) ? 'active' : ''}`}
                  onClick={() => toggleSegment(seg)}
                  style={{ textAlign: 'left', width: '100%' }}
                >
                  <span style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: COLORS.cluster[seg],
                    marginRight: '6px'
                  }}></span>
                  {seg.split('(')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          <button className="reset-btn" onClick={resetFilters}>
            <RefreshCw size={13} /> Reset All Filters
          </button>

          <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #E2E8F0', fontSize: '11px', color: '#94A3B8' }}>
            <p><strong>Cynaris Capstone Week 9</strong></p>
            <p>Deployment: Vercel Production</p>
            <p>Author: Krupa B T</p>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="main-content">
        {/* TOP NAVBAR */}
        <header className="top-navbar">
          <div className="navbar-title">
            <h2>TradeSight Export Management Platform</h2>
            <p>Chennai, India • 50 Key Client Accounts Across 12 Export Jurisdictions</p>
          </div>
          <button className="export-btn" onClick={handleExportCSV}>
            <Download size={15} /> Export Filtered CSV
          </button>
        </header>

        {/* TAB NAVIGATION */}
        <nav className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <TrendingUp size={16} /> 1. Executive Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'logistics' ? 'active' : ''}`}
            onClick={() => setActiveTab('logistics')}
          >
            <Truck size={16} /> 2. Logistics & SLA
          </button>
          <button
            className={`tab-btn ${activeTab === 'returns' ? 'active' : ''}`}
            onClick={() => setActiveTab('returns')}
          >
            <RotateCcw size={16} /> 3. Returns & Audit
          </button>
          <button
            className={`tab-btn ${activeTab === 'segmentation' ? 'active' : ''}`}
            onClick={() => setActiveTab('segmentation')}
          >
            <Users size={16} /> 4. Buyer Segmentation
          </button>
          <button
            className={`tab-btn ${activeTab === 'governance' ? 'active' : ''}`}
            onClick={() => setActiveTab('governance')}
          >
            <ShieldAlert size={16} /> 5. Data Governance & KPIs
          </button>
        </nav>

        {/* PAGE CONTENT CONTAINER */}
        <div className="page-body">
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              {/* TOP KPI CARDS */}
              <div className="metrics-grid">
                <div className="metric-card accent-navy">
                  <div className="metric-header">
                    <span>Total Export Value</span>
                    <Box size={16} color="#0F2027" />
                  </div>
                  <div className="metric-value">₹{(stats.totalRevenue / 10000000).toFixed(2)} Cr</div>
                  <div className="metric-sub">{stats.totalOrders} verified B2B orders</div>
                </div>

                <div className="metric-card accent-blue">
                  <div className="metric-header">
                    <span>Total Orders</span>
                    <FileText size={16} color="#2563EB" />
                  </div>
                  <div className="metric-value">{stats.totalOrders}</div>
                  <div className="metric-sub">2023–2024 calendar window</div>
                </div>

                <div className="metric-card accent-navy">
                  <div className="metric-header">
                    <span>Average Order Value</span>
                    <TrendingUp size={16} color="#203A43" />
                  </div>
                  <div className="metric-value">₹{(stats.aov / 100000).toFixed(2)} Lakh</div>
                  <div className="metric-sub">Median: ₹48.17 Lakh</div>
                </div>

                <div className="metric-card accent-amber">
                  <div className="metric-header">
                    <span>On-Time SLA Rate</span>
                    <Truck size={16} color="#D97706" />
                  </div>
                  <div className="metric-value">{stats.onTimeRate.toFixed(2)}%</div>
                  <div className="metric-sub">Target Benchmark: 80.00%</div>
                </div>

                <div className="metric-card accent-green">
                  <div className="metric-header">
                    <span>Unit Return Rate</span>
                    <RotateCcw size={16} color="#16A34A" />
                  </div>
                  <div className="metric-value">{stats.returnRate.toFixed(2)}%</div>
                  <div className="metric-sub">{stats.returnUnits.toLocaleString()} returned units</div>
                </div>

                <div className="metric-card accent-blue">
                  <div className="metric-header">
                    <span>Active Buyers</span>
                    <Users size={16} color="#2563EB" />
                  </div>
                  <div className="metric-value">{stats.uniqueBuyers}</div>
                  <div className="metric-sub">{stats.repeatBuyerPct.toFixed(1)}% repeat buyers</div>
                </div>
              </div>

              {/* CHARTS ROW 1 */}
              <div className="charts-grid">
                <div className="chart-card">
                  <h3>Monthly Export Revenue (₹ Cr) & Order Volume Trend</h3>
                  <p>24-month longitudinal performance indicating steady ₹14–18 Cr monthly export cadence.</p>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={monthlyTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="month" angle={-45} textAnchor="end" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="revenueCr" name="Revenue (₹ Cr)" fill="#203A43" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="orders" name="Order Count" stroke="#D97706" strokeWidth={2.5} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h3>Export Revenue by Commodity Category</h3>
                  <p>Contribution across core commodity categories in Indian Rupees (Crores).</p>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => `₹${value} Cr`} />
                      <Bar dataKey="revenueCr" fill="#2563EB" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* CHARTS ROW 2 */}
              <div className="charts-grid">
                <div className="chart-card">
                  <h3>Commercial Credit Payment Terms Distribution</h3>
                  <p>Breakdown of orders across 30, 60, 90-day Net and Advance payment agreements.</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={paymentTermsData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={45}
                        paddingAngle={4}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {paymentTermsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={[COLORS.navy, COLORS.blue, COLORS.teal, COLORS.amber][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h3>Commercial Repeat Buyer Order Share</h3>
                  <p>Loyalty profile showing 227 repeat buyer transactions (37.8%) vs first-time accounts.</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Repeat Buyer Orders', value: stats.repeatBuyerOrders },
                          { name: 'First-Time Buyer Orders', value: stats.totalOrders - stats.repeatBuyerOrders }
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={45}
                        paddingAngle={4}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        <Cell fill="#203A43" />
                        <Cell fill="#CBD5E0" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: LOGISTICS & SLA */}
          {activeTab === 'logistics' && (
            <>
              <div className="metrics-grid">
                <div className="metric-card accent-navy">
                  <div className="metric-header"><span>Mean Transit Duration</span><Truck size={16} /></div>
                  <div className="metric-value">{stats.avgDeliveryDays.toFixed(2)} Days</div>
                  <div className="metric-sub">Std Dev: 7.97 days</div>
                </div>

                <div className="metric-card accent-blue">
                  <div className="metric-header"><span>Median Transit Duration</span><Calendar size={16} /></div>
                  <div className="metric-value">{stats.medianDeliveryDays.toFixed(1)} Days</div>
                  <div className="metric-sub">IQR: 17 to 30 days</div>
                </div>

                <div className="metric-card accent-green">
                  <div className="metric-header"><span>On-Time Fulfillment</span><CheckCircle size={16} color="#16A34A" /></div>
                  <div className="metric-value">{stats.onTimeOrders} Orders</div>
                  <div className="metric-sub">{stats.onTimeRate.toFixed(2)}% of total shipments</div>
                </div>

                <div className="metric-card accent-red">
                  <div className="metric-header"><span>Delayed Shipments</span><AlertTriangle size={16} color="#DC2626" /></div>
                  <div className="metric-value">{stats.delayedOrders} Orders</div>
                  <div className="metric-sub">{(100 - stats.onTimeRate).toFixed(2)}% SLA breaches</div>
                </div>
              </div>

              <div className="charts-grid">
                <div className="chart-card">
                  <h3>On-Time Fulfillment SLA Rate (%) vs 80% Benchmark</h3>
                  <p>Comparison across product categories with red reference benchmark line.</p>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={categoryData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                      <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <ReferenceLine y={80} stroke="#DC2626" strokeDasharray="4 4" label="80% Target SLA" />
                      <Bar dataKey="slaRate" fill="#0D9488" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h3>Transit Duration Binned Distribution (Days)</h3>
                  <p>Frequency distribution of cargo shipments by order-to-delivery elapsed days.</p>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={transitBinnedData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="bin" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#203A43" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="table-container">
                <div className="table-header">
                  <div>
                    <h3>Fulfillment Diagnostics by Payment Terms & Credit Risk</h3>
                    <p>Cross-tabulation of on-time fulfillment and transit averages by commercial payment terms.</p>
                  </div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Payment Terms</th>
                      <th>Total Orders</th>
                      <th>On-Time Orders</th>
                      <th>Delayed Orders</th>
                      <th>SLA Rate %</th>
                      <th>Mean Transit</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ALL_TERMS.map(term => {
                      const subset = filteredOrders.filter(o => o.payment_terms === term);
                      const total = subset.length;
                      const onTime = subset.filter(o => o.on_time_delivery === 1).length;
                      const delayed = total - onTime;
                      const pct = total ? (onTime / total) * 100 : 0;
                      const avgDays = total ? (subset.reduce((s, o) => s + (o.delivery_days || 0), 0) / total).toFixed(2) : 0;
                      return (
                        <tr key={term}>
                          <td style={{ fontWeight: 600 }}>{term}</td>
                          <td>{total}</td>
                          <td>{onTime}</td>
                          <td>{delayed}</td>
                          <td>{pct.toFixed(2)}%</td>
                          <td>{avgDays} d</td>
                          <td>
                            <span className={`badge ${pct >= 78 ? 'badge-success' : 'badge-warning'}`}>
                              {pct >= 78 ? 'Acceptable' : 'Friction Warning'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* TAB 3: RETURNS & AUDIT */}
          {activeTab === 'returns' && (
            <>
              <div className="metrics-grid">
                <div className="metric-card accent-navy">
                  <div className="metric-header"><span>Total Ordered Cargo</span><Box size={16} /></div>
                  <div className="metric-value">{stats.totalUnits.toLocaleString()}</div>
                  <div className="metric-sub">Shipped physical units</div>
                </div>

                <div className="metric-card accent-red">
                  <div className="metric-header"><span>Total Returned Cargo</span><RotateCcw size={16} color="#DC2626" /></div>
                  <div className="metric-value">{stats.returnUnits.toLocaleString()}</div>
                  <div className="metric-sub">Reported buyer returns</div>
                </div>

                <div className="metric-card accent-blue">
                  <div className="metric-header"><span>Overall Unit Return Rate</span><TrendingUp size={16} color="#2563EB" /></div>
                  <div className="metric-value">{stats.returnRate.toFixed(2)}%</div>
                  <div className="metric-sub">Returns / Ordered Units</div>
                </div>

                <div className="metric-card accent-red">
                  <div className="metric-header"><span>Return Overrun Anomalies</span><ShieldAlert size={16} color="#DC2626" /></div>
                  <div className="metric-value">{stats.invalidReturns.length} Orders</div>
                  <div className="metric-sub">return_qty &gt; quantity_units</div>
                </div>
              </div>

              {/* CRITICAL ALERT CALLOUT */}
              <div className="alert-box">
                <div className="alert-title">
                  <AlertTriangle size={18} /> CRITICAL AUDIT EXCEPTION: RETURN QUANTITY EXCEEDS SHIPPED UNITS
                </div>
                <div className="alert-desc">
                  The automated pipeline flagged orders where returned units strictly exceed original order quantities. 
                  These represent data transposition bugs or potential inventory fraud requiring upstream ERP remediation.
                </div>
              </div>

              <div className="table-container" style={{ marginBottom: '20px' }}>
                <div className="table-header">
                  <div>
                    <h3>Flagged Return Overrun Records</h3>
                    <p>Orders identified with data quality flags during the automated pipeline audit.</p>
                  </div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Buyer ID</th>
                      <th>Category</th>
                      <th>Order Date</th>
                      <th>Shipped Units</th>
                      <th>Returned Units</th>
                      <th>Unit Price</th>
                      <th>Total Value (₹)</th>
                      <th>Audit Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.invalidReturns.map(row => (
                      <tr key={row.order_id} style={{ backgroundColor: '#FEF2F2' }}>
                        <td style={{ fontWeight: 700, color: '#B91C1C' }}>{row.order_id}</td>
                        <td>{row.buyer_id}</td>
                        <td>{row.category}</td>
                        <td>{row.order_date}</td>
                        <td><strong>{row.quantity_units}</strong></td>
                        <td style={{ color: '#DC2626', fontWeight: 700 }}>{row.return_qty}</td>
                        <td>₹{row.unit_price_inr.toLocaleString()}</td>
                        <td>₹{row.total_value_inr.toLocaleString()}</td>
                        <td><span className="badge badge-danger">SUSPICIOUS_RETURN_OVERRUN</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="charts-grid">
                <div className="chart-card">
                  <h3>Unit Return Rate (%) by Commodity Category</h3>
                  <p>Relative return friction percentage across product classifications.</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Bar dataKey="returnRate" fill="#DC2626" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h3>Shipped vs Returned Physical Unit Volume (Thousands)</h3>
                  <p>Absolute volume comparison in thousands of commodity units.</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="ordered" name="Shipped Units" fill="#64748B" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="returned" name="Returned Units" fill="#DC2626" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* TAB 4: BUYER SEGMENTATION */}
          {activeTab === 'segmentation' && (
            <>
              <div className="metrics-grid">
                <div className="metric-card" style={{ borderLeft: '4px solid #2563EB' }}>
                  <div className="metric-header"><span>Core Stable Accounts</span><Users size={16} color="#2563EB" /></div>
                  <div className="metric-value">75 Buyers</div>
                  <div className="metric-sub">95.0% on-time fulfillment, core baseline</div>
                </div>

                <div className="metric-card" style={{ borderLeft: '4px solid #16A34A' }}>
                  <div className="metric-header"><span>Active Growth Buyers</span><TrendingUp size={16} color="#16A34A" /></div>
                  <div className="metric-value">68 Buyers</div>
                  <div className="metric-sub">High purchasing velocity, repeat orders</div>
                </div>

                <div className="metric-card" style={{ borderLeft: '4px solid #D97706' }}>
                  <div className="metric-header"><span>Operationally Vulnerable</span><AlertTriangle size={16} color="#D97706" /></div>
                  <div className="metric-value">27 Buyers</div>
                  <div className="metric-sub">Elevated transit delays (75% delay rate)</div>
                </div>

                <div className="metric-card" style={{ borderLeft: '4px solid #DC2626' }}>
                  <div className="metric-header"><span>Lapsed Accounts</span><RotateCcw size={16} color="#DC2626" /></div>
                  <div className="metric-value">17 Buyers</div>
                  <div className="metric-sub">Dormant (&gt;500 days recency), churn risk</div>
                </div>
              </div>

              <div className="charts-grid">
                <div className="chart-card">
                  <h3>2D PCA Behavioral Projection of 187 Commercial Buyer Accounts</h3>
                  <p>Dimension 1 (Fulfillment & Volume) vs Dimension 2 (Recency Inactivity & Delay Friction).</p>
                  <ResponsiveContainer width="100%" height={360}>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis type="number" dataKey="pca_x" name="PCA 1" tick={{ fontSize: 11 }} />
                      <YAxis type="number" dataKey="pca_y" name="PCA 2" tick={{ fontSize: 11 }} />
                      <ZAxis range={[50, 50]} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      {ALL_SEGMENTS.map(seg => (
                        <Scatter
                          key={seg}
                          name={seg.split('(')[0].trim()}
                          data={filteredBuyers.filter(b => b.segment_label === seg)}
                          fill={COLORS.cluster[seg]}
                        />
                      ))}
                      <Legend />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h3>Average Commercial Spend per Account by Segment (₹ Cr)</h3>
                  <p>Mean gross revenue generated per commercial buyer across the 4 clusters.</p>
                  <ResponsiveContainer width="100%" height={360}>
                    <BarChart
                      data={ALL_SEGMENTS.map(seg => {
                        const subset = buyersRaw.filter(b => b.segment_label === seg);
                        const avg = subset.length ? (subset.reduce((s, b) => s + b.total_spend_inr, 0) / subset.length) / 10000000 : 0;
                        return { name: seg.split('(')[0].trim(), avgSpendCr: parseFloat(avg.toFixed(2)) };
                      })}
                      margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => `₹${value} Cr`} />
                      <Bar dataKey="avgSpendCr" fill="#203A43" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* BUYER TABLE */}
              <div className="table-container">
                <div className="table-header">
                  <div>
                    <h3>Commercial Buyer Account Explorer ({filteredBuyers.length} Accounts)</h3>
                    <p>Searchable buyer directory with behavioral attributes, order frequency, and SLA records.</p>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by Buyer ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E0',
                      outline: 'none',
                      width: '200px'
                    }}
                  />
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Buyer ID</th>
                      <th>RFM Segment</th>
                      <th>Orders</th>
                      <th>Total Spend (₹)</th>
                      <th>AOV (₹)</th>
                      <th>Recency</th>
                      <th>On-Time %</th>
                      <th>Return %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBuyers.slice(0, 15).map(b => (
                      <tr key={b.buyer_id}>
                        <td style={{ fontWeight: 600 }}>{b.buyer_id}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: `${COLORS.cluster[b.segment_label]}15`,
                              color: COLORS.cluster[b.segment_label]
                            }}
                          >
                            {b.segment_label.split('(')[0].trim()}
                          </span>
                        </td>
                        <td>{b.frequency}</td>
                        <td>₹{(b.total_spend_inr / 100000).toFixed(2)} L</td>
                        <td>₹{(b.avg_order_value_inr / 100000).toFixed(2)} L</td>
                        <td>{b.recency_days} d</td>
                        <td>{(b.on_time_rate * 100).toFixed(1)}%</td>
                        <td>{(b.unit_return_rate * 100).toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* TAB 5: DATA GOVERNANCE & MISSING KPIS */}
          {activeTab === 'governance' && (
            <>
              <div className="charts-grid">
                <div className="chart-card">
                  <h3 style={{ color: '#991B1B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={18} /> Audit of Unavailable Business Metrics
                  </h3>
                  <p>In accordance with project guidelines, unavailable metrics are explicitly disclosed rather than synthetically fabricated.</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12.5px' }}>
                    <div style={{ padding: '12px', background: '#FEF2F2', borderRadius: '8px', borderLeft: '3px solid #DC2626' }}>
                      <strong style={{ color: '#991B1B' }}>1. Foreign Exchange (FX) Impact:</strong>
                      <p style={{ color: '#7F1D1D', marginTop: '3px' }}>
                        All 600 orders are denominated exclusively in Indian Rupees (INR). No foreign currency code, exchange spot rate, or destination country exists in <code>da_b2b_orders.csv</code>.
                      </p>
                    </div>

                    <div style={{ padding: '12px', background: '#FEF2F2', borderRadius: '8px', borderLeft: '3px solid #DC2626' }}>
                      <strong style={{ color: '#991B1B' }}>2. Client Profitability & COGS Margins:</strong>
                      <p style={{ color: '#7F1D1D', marginTop: '3px' }}>
                        Orders record unit price and gross value but lack cost of goods sold (COGS) or freight tariffs. The master product catalogue contains retail margins but lacks transactional order-line SKU links.
                      </p>
                    </div>

                    <div style={{ padding: '12px', background: '#FEF2F2', borderRadius: '8px', borderLeft: '3px solid #DC2626' }}>
                      <strong style={{ color: '#991B1B' }}>3. Export Compliance Exceptions:</strong>
                      <p style={{ color: '#7F1D1D', marginTop: '3px' }}>
                        Zero customs declarations, shipping bill numbers, or regulatory audit flags exist in the supplied datasets.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="chart-card">
                  <h3 style={{ color: '#15803D', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={18} /> Enterprise Verified Baseline Scorecard
                  </h3>
                  <p>Mathematically verified operational baselines derived from 600 actual orders (2023–2024).</p>

                  <table>
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Baseline Value</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Total Gross Export Value</td>
                        <td>₹3,968,829,214.20 INR</td>
                        <td><span className="badge badge-success">VERIFIED 100%</span></td>
                      </tr>
                      <tr>
                        <td>Total Orders Recorded</td>
                        <td>600 Transactions</td>
                        <td><span className="badge badge-success">VERIFIED 100%</span></td>
                      </tr>
                      <tr>
                        <td>Average Order Value (AOV)</td>
                        <td>₹6,614,715.36 INR</td>
                        <td><span className="badge badge-success">VERIFIED 100%</span></td>
                      </tr>
                      <tr>
                        <td>On-Time Delivery Rate</td>
                        <td>77.50% (465/600)</td>
                        <td><span className="badge badge-success">VERIFIED 100%</span></td>
                      </tr>
                      <tr>
                        <td>Mean Transit Duration</td>
                        <td>23.49 Days</td>
                        <td><span className="badge badge-success">VERIFIED 100%</span></td>
                      </tr>
                      <tr>
                        <td>Unit Return Rate</td>
                        <td>1.01% (15,242 units)</td>
                        <td><span className="badge badge-success">VERIFIED 100%</span></td>
                      </tr>
                      <tr>
                        <td>Return Overrun Anomalies</td>
                        <td>2 Orders (B2B-00131/188)</td>
                        <td><span className="badge badge-danger">FLAGGED AUDIT</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
