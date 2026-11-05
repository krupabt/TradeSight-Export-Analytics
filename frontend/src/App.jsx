import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp, Truck, RotateCcw, Users, ShieldAlert, Package,
  Download, Filter, RefreshCw, AlertTriangle, CheckCircle,
  FileText, Calendar, Box, Database, Layers, ArrowUpRight,
  Info, Search, HelpCircle
} from 'lucide-react';

import ordersRaw from './data/orders.json';
import productsRaw from './data/products.json';
import customersRaw from './data/customers.json';
import buyersRaw from './data/buyers_aggregated.json';

// Unique filters supported by orders dataset
const ALL_CATEGORIES = [...new Set(ordersRaw.map(o => o.category))].sort();
const ALL_TERMS = [...new Set(ordersRaw.map(o => o.payment_terms))].sort();

// Color scheme: Dark navy background with Teal & Cyan highlights
const COLORS = {
  teal: '#14B8A6',
  cyan: '#06B6D4',
  blue: '#3B82F6',
  amber: '#F59E0B',
  rose: '#F43F5E',
  emerald: '#10B981',
  slate: '#64748B',
  pie: ['#14B8A6', '#06B6D4', '#3B82F6', '#F59E0B', '#8B5CF6']
};

export default function App() {
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('section');
      if (p) return p;
      const h = window.location.hash.replace('#', '');
      if (h) return h;
    }
    return 'overview';
  });

  const handleSelectSection = (s) => {
    setActiveSection(s);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location);
      url.searchParams.set('section', s);
      window.history.replaceState({}, '', url);
    }
  };

  // Interactive Filters
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedTerm, setSelectedTerm] = useState('ALL');
  const [quickFilter, setQuickFilter] = useState('ALL');
  const [buyerSearch, setBuyerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  // Filtered Orders Data
  const filteredOrders = useMemo(() => {
    return ordersRaw.filter(order => {
      if (selectedCategory !== 'ALL' && order.category !== selectedCategory) return false;
      if (selectedTerm !== 'ALL' && order.payment_terms !== selectedTerm) return false;
      if (quickFilter === 'DELAYED' && order.on_time_delivery !== 0) return false;
      if (quickFilter === 'REPEAT' && order.repeat_buyer !== 1) return false;
      if (quickFilter === 'HIGH_VALUE' && (order.total_value_inr || 0) < 10000000) return false;
      if (quickFilter === 'RETURNS' && (order.return_qty || 0) <= 0) return false;
      if (orderSearch) {
        const q = orderSearch.toLowerCase();
        return (
          order.order_id.toLowerCase().includes(q) ||
          order.buyer_id.toLowerCase().includes(q) ||
          order.seller_id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedCategory, selectedTerm, quickFilter, orderSearch]);

  // Orders Aggregations
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
    const uniqueSellers = new Set(filteredOrders.map(o => o.seller_id)).size;

    // Anomalous orders where returned units exceed shipped units
    const invalidReturns = filteredOrders.filter(o => o.return_qty > o.quantity_units);

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
      uniqueSellers,
      invalidReturns
    };
  }, [filteredOrders]);

  // Product Catalogue Stats (from da_product_catalogue.csv)
  const productStats = useMemo(() => {
    const totalProducts = productsRaw.length;
    const totalStock = productsRaw.reduce((sum, p) => sum + (p.Stock_Units || 0), 0);
    const avgMRP = totalProducts ? productsRaw.reduce((sum, p) => sum + p.MRP, 0) / totalProducts : 0;
    const avgCOGS = totalProducts ? productsRaw.reduce((sum, p) => sum + p.COGS, 0) / totalProducts : 0;
    const avgMarginPct = totalProducts ? productsRaw.reduce((sum, p) => sum + p.Margin_Pct, 0) / totalProducts : 0;
    const totalMonthlySales = productsRaw.reduce((sum, p) => sum + (p.Avg_Monthly_Sales || 0), 0);
    return { totalProducts, totalStock, avgMRP, avgCOGS, avgMarginPct, totalMonthlySales };
  }, []);

  // Customer Profile Stats (from da_customer_profiles.csv)
  const customerStats = useMemo(() => {
    const count = customersRaw.length;
    const totalRev = customersRaw.reduce((sum, c) => sum + (c.Total_Revenue || 0), 0);
    const totalOrders = customersRaw.reduce((sum, c) => sum + (c.Total_Orders || 0), 0);
    const churnedCount = customersRaw.filter(c => c.Churned === 1).length;
    const churnRate = count ? (churnedCount / count) * 100 : 0;
    const dateAnomalies = customersRaw.filter(c => new Date(c.First_Purchase_Date) > new Date(c.Last_Purchase_Date));
    return { count, totalRev, totalOrders, churnedCount, churnRate, dateAnomalies };
  }, []);

  // Monthly Revenue & Orders Trend
  const monthlyData = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      const ym = o.order_year_month || o.order_date.substring(0, 7);
      if (!map[ym]) map[ym] = { month: ym, revenueCr: 0, orders: 0, units: 0 };
      map[ym].revenueCr += (o.total_value_inr || 0) / 10000000;
      map[ym].orders += 1;
      map[ym].units += o.quantity_units || 0;
    });
    return Object.values(map).map(m => ({
      ...m,
      revenueCr: parseFloat(m.revenueCr.toFixed(2))
    })).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredOrders]);

  // Category Aggregations
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
      revenueCr: parseFloat(c.revenueCr.toFixed(2)),
      returnRate: c.ordered ? parseFloat(((c.returned / c.ordered) * 100).toFixed(2)) : 0,
      slaRate: c.total ? parseFloat(((c.onTime / c.total) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.revenueCr - a.revenueCr);
  }, [filteredOrders]);

  // Payment Terms Distribution
  const paymentTermsData = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      if (!map[o.payment_terms]) map[o.payment_terms] = { name: o.payment_terms, orders: 0, revenueCr: 0 };
      map[o.payment_terms].orders += 1;
      map[o.payment_terms].revenueCr += (o.total_value_inr || 0) / 10000000;
    });
    return Object.values(map).map(p => ({
      ...p,
      revenueCr: parseFloat(p.revenueCr.toFixed(2))
    }));
  }, [filteredOrders]);

  // Delivery Days Histogram Bins
  const transitHistogram = useMemo(() => {
    const bins = [
      { range: '1-10 Days', count: 0 },
      { range: '11-20 Days', count: 0 },
      { range: '21-30 Days', count: 0 },
      { range: '31-40 Days', count: 0 },
      { range: '41-50 Days', count: 0 }
    ];
    filteredOrders.forEach(o => {
      const d = o.delivery_days;
      if (d <= 10) bins[0].count++;
      else if (d <= 20) bins[1].count++;
      else if (d <= 30) bins[2].count++;
      else if (d <= 40) bins[3].count++;
      else bins[4].count++;
    });
    return bins;
  }, [filteredOrders]);

  // Order Value Tiers
  const orderValueTiers = useMemo(() => {
    const tiers = [
      { tier: '< ₹10 Lakh', count: 0, revCr: 0 },
      { tier: '₹10L - ₹50L', count: 0, revCr: 0 },
      { tier: '₹50L - ₹1 Cr', count: 0, revCr: 0 },
      { tier: '> ₹1 Crore', count: 0, revCr: 0 }
    ];
    filteredOrders.forEach(o => {
      const v = o.total_value_inr || 0;
      if (v < 1000000) { tiers[0].count++; tiers[0].revCr += v/1e7; }
      else if (v < 5000000) { tiers[1].count++; tiers[1].revCr += v/1e7; }
      else if (v < 10000000) { tiers[2].count++; tiers[2].revCr += v/1e7; }
      else { tiers[3].count++; tiers[3].revCr += v/1e7; }
    });
    return tiers.map(t => ({ ...t, revCr: parseFloat(t.revCr.toFixed(2)) }));
  }, [filteredOrders]);

  // Filtered Buyers Search
  const filteredBuyers = useMemo(() => {
    return buyersRaw.filter(b => {
      if (buyerSearch) {
        const q = buyerSearch.toLowerCase();
        return b.buyer_id.toLowerCase().includes(q) || b.primary_category.toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => b.total_spend_inr - a.total_spend_inr);
  }, [buyerSearch]);

  // Filtered Products Search
  const filteredProducts = useMemo(() => {
    return productsRaw.filter(p => {
      if (productSearch) {
        const q = productSearch.toLowerCase();
        return p.Product_ID.toLowerCase().includes(q) || p.Name.toLowerCase().includes(q) || p.Category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [productSearch]);

  // Reset Filters
  const resetFilters = () => {
    setSelectedCategory('ALL');
    setSelectedTerm('ALL');
    setQuickFilter('ALL');
    setOrderSearch('');
  };

  // Export Filtered Orders to CSV
  const handleExportCSV = () => {
    if (!filteredOrders.length) return;
    const headers = [
      'order_id', 'buyer_id', 'seller_id', 'category', 'order_date',
      'quantity_units', 'unit_price_inr', 'total_value_inr', 'payment_terms',
      'delivery_days', 'on_time_delivery', 'return_qty', 'repeat_buyer'
    ];
    const rows = filteredOrders.map(o => 
      headers.map(h => o[h] !== undefined ? `"${o[h]}"` : '""').join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tradesight_orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app-layout">
      {/* SIDEBAR NAVIGATION */}
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">TS</div>
          <div>
            <div className="brand-title">TradeSight</div>
            <div className="brand-subtitle">Export Analytics</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => handleSelectSection('overview')}
          >
            <TrendingUp size={16} /> 1. Executive Overview
          </button>
          <button
            className={`nav-item ${activeSection === 'revenue' ? 'active' : ''}`}
            onClick={() => handleSelectSection('revenue')}
          >
            <Layers size={16} /> 2. Export Revenue
          </button>
          <button
            className={`nav-item ${activeSection === 'logistics' ? 'active' : ''}`}
            onClick={() => handleSelectSection('logistics')}
          >
            <Truck size={16} /> 3. Logistics & SLA
          </button>
          <button
            className={`nav-item ${activeSection === 'returns' ? 'active' : ''}`}
            onClick={() => handleSelectSection('returns')}
          >
            <RotateCcw size={16} /> 4. Returns & Quality
          </button>
          <button
            className={`nav-item ${activeSection === 'buyers' ? 'active' : ''}`}
            onClick={() => handleSelectSection('buyers')}
          >
            <Users size={16} /> 5. Buyer Analytics
          </button>
          <button
            className={`nav-item ${activeSection === 'products' ? 'active' : ''}`}
            onClick={() => handleSelectSection('products')}
          >
            <Package size={16} /> 6. Product Catalogue
          </button>
          <button
            className={`nav-item ${activeSection === 'governance' ? 'active' : ''}`}
            onClick={() => handleSelectSection('governance')}
          >
            <ShieldAlert size={16} /> 7. Data Governance
          </button>
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: '#CBD5E1', fontWeight: 600 }}>
            <Database size={13} color="#14B8A6" /> 3 Source Datasets Loaded
          </div>
          <div style={{ color: '#64748B' }}>
            600 Orders • 50 Products • 200 Profiles
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="app-main">
        {/* TOP BAR */}
        <header className="top-bar">
          <div className="page-heading">
            <h1 className="page-title">
              {activeSection === 'overview' && 'Executive Overview & Enterprise KPIs'}
              {activeSection === 'revenue' && 'Export Revenue & Commercial Performance'}
              {activeSection === 'logistics' && 'Logistics, Transit & Delivery SLA Performance'}
              {activeSection === 'returns' && 'Cargo Returns & Data Quality Exception Audit'}
              {activeSection === 'buyers' && 'Commercial Buyer Analytics & Order History'}
              {activeSection === 'products' && 'Master Product Catalogue & Stock Margins'}
              {activeSection === 'governance' && 'Enterprise Data Governance & Schema Boundaries'}
            </h1>
            <span className="page-badge">Source: da_b2b_orders.csv</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="action-btn primary" onClick={handleExportCSV}>
              <Download size={14} /> Export CSV
            </button>
          </div>
        </header>

        {/* FILTER TOOLBAR (Supported across orders) */}
        <div className="filter-toolbar">
          <div className="filter-label">
            <Filter size={14} /> Filters:
          </div>

          <div>
            <select
              className="filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="ALL">All Categories ({ALL_CATEGORIES.length})</option>
              {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <select
              className="filter-select"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
            >
              <option value="ALL">All Terms ({ALL_TERMS.length})</option>
              {ALL_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Presets:</span>
            <button 
              className={`preset-btn ${quickFilter === 'ALL' ? 'active' : ''}`} 
              onClick={() => setQuickFilter('ALL')}
            >
              All (600)
            </button>
            <button 
              className={`preset-btn ${quickFilter === 'DELAYED' ? 'active' : ''}`} 
              onClick={() => setQuickFilter('DELAYED')}
            >
              Delayed (135)
            </button>
            <button 
              className={`preset-btn ${quickFilter === 'REPEAT' ? 'active' : ''}`} 
              onClick={() => setQuickFilter('REPEAT')}
            >
              Repeat (227)
            </button>
            <button 
              className={`preset-btn ${quickFilter === 'HIGH_VALUE' ? 'active' : ''}`} 
              onClick={() => setQuickFilter('HIGH_VALUE')}
            >
              &gt; ₹1 Cr (148)
            </button>
            <button 
              className={`preset-btn ${quickFilter === 'RETURNS' ? 'active' : ''}`} 
              onClick={() => setQuickFilter('RETURNS')}
            >
              Returns (591)
            </button>
          </div>

          {(selectedCategory !== 'ALL' || selectedTerm !== 'ALL' || quickFilter !== 'ALL') && (
            <button className="action-btn" onClick={resetFilters}>
              <RefreshCw size={12} /> Reset
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#94A3B8' }}>
            Displaying <strong style={{ color: '#F8FAFC' }}>{filteredOrders.length}</strong> of 600 orders
          </div>
        </div>

        {/* HORIZONTAL SECTION QUICK-NAV BAR */}
        <div className="section-quick-nav">
          <span className="quick-nav-label">Sections:</span>
          {[
            { id: 'overview', num: '1', label: 'Executive Overview' },
            { id: 'revenue', num: '2', label: 'Export Revenue' },
            { id: 'logistics', num: '3', label: 'Logistics & SLA' },
            { id: 'returns', num: '4', label: 'Returns & Quality' },
            { id: 'buyers', num: '5', label: 'Buyer Analytics' },
            { id: 'products', num: '6', label: 'Product Catalogue' },
            { id: 'governance', num: '7', label: 'Data Governance' },
          ].map(s => (
            <button
              key={s.id}
              className={`quick-nav-pill ${activeSection === s.id ? 'active' : ''}`}
              onClick={() => handleSelectSection(s.id)}
            >
              <span className="pill-num">{s.num}</span> {s.label}
            </button>
          ))}
        </div>

        {/* CONTENT BODY */}
        <div className="content-body">

          {/* ============================================================== */}
          {/* SECTION 1: EXECUTIVE OVERVIEW */}
          {/* ============================================================== */}
          {activeSection === 'overview' && (
            <>
              {/* TOP 8 KPI CARDS */}
              <div className="kpi-grid">
                <div className="kpi-card teal-top">
                  <div className="kpi-header">
                    <div className="kpi-title-wrap">
                      <span className="kpi-title">Gross Export Value</span>
                      <span className="kpi-info-btn" title="Formula: SUM(total_value_inr)&#10;Dataset: da_b2b_orders.csv&#10;Exact Verified: ₹3,968,829,214.20 INR"><HelpCircle size={13} /></span>
                    </div>
                    <div className="kpi-icon"><TrendingUp size={16} color="#14B8A6" /></div>
                  </div>
                  <div className="kpi-value mono">₹{(stats.totalRevenue / 10000000).toFixed(2)} Cr</div>
                  <div className="kpi-sub">₹3,968,829,214.20 INR exact</div>
                </div>

                <div className="kpi-card cyan-top">
                  <div className="kpi-header">
                    <div className="kpi-title-wrap">
                      <span className="kpi-title">Total Orders Placed</span>
                      <span className="kpi-info-btn" title="Formula: COUNT(order_id)&#10;Dataset: da_b2b_orders.csv&#10;Exact Verified: 600 orders"><HelpCircle size={13} /></span>
                    </div>
                    <div className="kpi-icon"><FileText size={16} color="#06B6D4" /></div>
                  </div>
                  <div className="kpi-value mono">{stats.totalOrders}</div>
                  <div className="kpi-sub">Across 2023–2024 order log</div>
                </div>

                <div className="kpi-card teal-top">
                  <div className="kpi-header">
                    <div className="kpi-title-wrap">
                      <span className="kpi-title">Average Order Value</span>
                      <span className="kpi-info-btn" title="Formula: SUM(total_value_inr) / COUNT(order_id)&#10;Dataset: da_b2b_orders.csv&#10;Exact Verified: ₹6,614,715.36 INR"><HelpCircle size={13} /></span>
                    </div>
                    <div className="kpi-icon"><Box size={16} color="#14B8A6" /></div>
                  </div>
                  <div className="kpi-value mono">₹{(stats.aov / 100000).toFixed(2)} L</div>
                  <div className="kpi-sub">Median: ₹48.17 Lakh</div>
                </div>

                <div className="kpi-card amber-top">
                  <div className="kpi-header">
                    <div className="kpi-title-wrap">
                      <span className="kpi-title">On-Time Delivery Rate</span>
                      <span className="kpi-info-btn" title="Formula: COUNT(on_time_delivery=1) / COUNT(order_id) * 100&#10;Dataset: da_b2b_orders.csv&#10;Exact Verified: 77.50% (465 of 600)"><HelpCircle size={13} /></span>
                    </div>
                    <div className="kpi-icon"><Truck size={16} color="#F59E0B" /></div>
                  </div>
                  <div className="kpi-value mono">{stats.onTimeRate.toFixed(2)}%</div>
                  <div className="kpi-sub">465 On-Time vs 135 Delayed</div>
                </div>

                <div className="kpi-card rose-top">
                  <div className="kpi-header">
                    <div className="kpi-title-wrap">
                      <span className="kpi-title">Unit Return Rate</span>
                      <span className="kpi-info-btn" title="Formula: SUM(return_qty) / SUM(quantity_units) * 100&#10;Dataset: da_b2b_orders.csv&#10;Exact Verified: 1.0100% (15,242 of 1,509,070)"><HelpCircle size={13} /></span>
                    </div>
                    <div className="kpi-icon"><RotateCcw size={16} color="#F43F5E" /></div>
                  </div>
                  <div className="kpi-value mono">{stats.returnRate.toFixed(2)}%</div>
                  <div className="kpi-sub">{stats.returnUnits.toLocaleString()} returned units</div>
                </div>

                <div className="kpi-card cyan-top">
                  <div className="kpi-header">
                    <div className="kpi-title-wrap">
                      <span className="kpi-title">Active B2B Buyers</span>
                      <span className="kpi-info-btn" title="Formula: COUNT(DISTINCT buyer_id)&#10;Dataset: da_b2b_orders.csv&#10;Exact Verified: 187 unique buyers"><HelpCircle size={13} /></span>
                    </div>
                    <div className="kpi-icon"><Users size={16} color="#06B6D4" /></div>
                  </div>
                  <div className="kpi-value mono">{stats.uniqueBuyers}</div>
                  <div className="kpi-sub">{stats.repeatBuyerPct.toFixed(1)}% repeat buyer orders</div>
                </div>

                <div className="kpi-card purple-top">
                  <div className="kpi-header">
                    <div className="kpi-title-wrap">
                      <span className="kpi-title">Catalogue SKUs</span>
                      <span className="kpi-info-btn" title="Formula: COUNT(Product_ID)&#10;Dataset: da_product_catalogue.csv&#10;Exact Verified: 50 master SKUs"><HelpCircle size={13} /></span>
                    </div>
                    <div className="kpi-icon"><Package size={16} color="#8B5CF6" /></div>
                  </div>
                  <div className="kpi-value mono">{productStats.totalProducts}</div>
                  <div className="kpi-sub">Gross margin: {productStats.avgMarginPct.toFixed(1)}%</div>
                </div>

                <div className="kpi-card blue-top">
                  <div className="kpi-header">
                    <div className="kpi-title-wrap">
                      <span className="kpi-title">Customer Profiles</span>
                      <span className="kpi-info-btn" title="Formula: COUNT(Customer_ID)&#10;Dataset: da_customer_profiles.csv&#10;Exact Verified: 200 consumer profiles"><HelpCircle size={13} /></span>
                    </div>
                    <div className="kpi-icon"><Users size={16} color="#3B82F6" /></div>
                  </div>
                  <div className="kpi-value mono">{customerStats.count}</div>
                  <div className="kpi-sub">Total rev: ₹{(customerStats.totalRev/1e5).toFixed(1)} L</div>
                </div>
              </div>

              {/* CHARTS ROW 1 */}
              <div className="charts-grid-2">
                <div className="chart-card">
                  <div className="chart-card-header">
                    <div>
                      <h2 className="chart-card-title">Monthly Export Revenue (₹ Cr) & Orders Placed</h2>
                      <p className="chart-card-desc">Actual monthly volume and gross order value across the 24-month horizon (2023–2024).</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E2E4F" />
                      <XAxis dataKey="month" angle={-45} textAnchor="end" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <YAxis yAxisId="left" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111C33', borderColor: '#1E2E4F', borderRadius: '8px' }} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="revenueCr" name="Revenue (₹ Cr)" fill="#14B8A6" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="orders" name="Order Count" stroke="#38BDF8" strokeWidth={2.5} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <div className="chart-card-header">
                    <div>
                      <h2 className="chart-card-title">Export Revenue by Product Category (₹ Cr)</h2>
                      <p className="chart-card-desc">Contribution of each commodity classification in da_b2b_orders.csv.</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1E2E4F" />
                      <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <YAxis type="category" dataKey="category" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111C33', borderColor: '#1E2E4F', borderRadius: '8px' }} formatter={(val) => `₹${val} Cr`} />
                      <Bar dataKey="revenueCr" fill="#06B6D4" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* CHARTS ROW 2 */}
              <div className="charts-grid-2">
                <div className="chart-card">
                  <div className="chart-card-header">
                    <div>
                      <h2 className="chart-card-title">Commercial Payment Terms Breakdown</h2>
                      <p className="chart-card-desc">Distribution of orders by payment terms (Advance, 30 Days Net, COD, LC, 60 Days Net).</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={paymentTermsData}
                        dataKey="orders"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        innerRadius={50}
                        paddingAngle={4}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {paymentTermsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS.pie[index % COLORS.pie.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#111C33', borderColor: '#1E2E4F', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <div className="chart-card-header">
                    <div>
                      <h2 className="chart-card-title">Repeat Buyer Order Proportion</h2>
                      <p className="chart-card-desc">Verified orders placed by repeat buyers (repeat_buyer = 1) vs first-time commercial buyers.</p>
                    </div>
                  </div>
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
                        outerRadius={85}
                        innerRadius={50}
                        paddingAngle={4}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        <Cell fill="#14B8A6" />
                        <Cell fill="#334155" />
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#111C33', borderColor: '#1E2E4F', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* SECTION 2: EXPORT REVENUE ANALYTICS */}
          {/* ============================================================== */}
          {activeSection === 'revenue' && (
            <>
              <div className="kpi-grid">
                <div className="kpi-card teal-top">
                  <div className="kpi-header"><span className="kpi-title">Gross Export Revenue</span><TrendingUp size={16} color="#14B8A6" /></div>
                  <div className="kpi-value mono">₹{(stats.totalRevenue/1e7).toFixed(2)} Cr</div>
                  <div className="kpi-sub">Total across filtered orders</div>
                </div>

                <div className="kpi-card cyan-top">
                  <div className="kpi-header"><span className="kpi-title">Total Units Shipped</span><Box size={16} color="#06B6D4" /></div>
                  <div className="kpi-value mono">{stats.totalUnits.toLocaleString()}</div>
                  <div className="kpi-sub">Commodity export units</div>
                </div>

                <div className="kpi-card teal-top">
                  <div className="kpi-header"><span className="kpi-title">Average Order Value</span><Box size={16} color="#14B8A6" /></div>
                  <div className="kpi-value mono">₹{(stats.aov/1e5).toFixed(2)} L</div>
                  <div className="kpi-sub">Median: ₹48.17 Lakh</div>
                </div>

                <div className="kpi-card amber-top">
                  <div className="kpi-header"><span className="kpi-title">Max Single Order</span><ArrowUpRight size={16} color="#F59E0B" /></div>
                  <div className="kpi-value mono">₹2.44 Cr</div>
                  <div className="kpi-sub">Min order: ₹28,360.80</div>
                </div>
              </div>

              {/* REVENUE VELOCITY CHART */}
              <div className="chart-card">
                <div className="chart-card-header">
                  <div>
                    <h2 className="chart-card-title">Longitudinal Monthly Revenue Velocity (₹ Cr)</h2>
                    <p className="chart-card-desc">Monthly transaction values demonstrating consistent ₹14M - ₹24M run-rate across 2023–2024.</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#14B8A6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E2E4F" />
                    <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#111C33', borderColor: '#1E2E4F', borderRadius: '8px' }} formatter={(val) => `₹${val} Cr`} />
                    <Area type="monotone" dataKey="revenueCr" stroke="#14B8A6" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* REVENUE BY PAYMENT TERMS & VALUE TIERS */}
              <div className="charts-grid-2">
                <div className="chart-card">
                  <div className="chart-card-header">
                    <div>
                      <h2 className="chart-card-title">Export Revenue by Payment Terms (₹ Cr)</h2>
                      <p className="chart-card-desc">Total contract value realization across commercial credit terms.</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={paymentTermsData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E2E4F" />
                      <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111C33', borderColor: '#1E2E4F', borderRadius: '8px' }} formatter={(val) => `₹${val} Cr`} />
                      <Bar dataKey="revenueCr" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <div className="chart-card-header">
                    <div>
                      <h2 className="chart-card-title">Order Value Size Tiers (Order Count)</h2>
                      <p className="chart-card-desc">Number of shipments segmented by total commercial transaction value.</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={orderValueTiers} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E2E4F" />
                      <XAxis dataKey="tier" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111C33', borderColor: '#1E2E4F', borderRadius: '8px' }} />
                      <Bar dataKey="count" fill="#14B8A6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* CATEGORY REVENUE PERFORMANCE TABLE */}
              <div className="table-card">
                <div className="table-toolbar">
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>Category Commercial Performance</h3>
                    <p style={{ fontSize: '12px', color: '#94A3B8' }}>Aggregated volume, revenue, and units per commodity category in da_b2b_orders.csv</p>
                  </div>
                </div>
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Orders Count</th>
                        <th>Total Value (₹ Cr)</th>
                        <th>Revenue Share %</th>
                        <th>Total Units Shipped</th>
                        <th>Avg Units / Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryData.map(c => {
                        const share = stats.totalRevenue ? ((c.revenueCr * 1e7) / stats.totalRevenue * 100).toFixed(2) : 0;
                        const avgUnits = c.total ? Math.round(c.ordered / c.total) : 0;
                        return (
                          <tr key={c.category}>
                            <td style={{ fontWeight: 600, color: '#38BDF8' }}>{c.category}</td>
                            <td>{c.total}</td>
                            <td className="mono" style={{ fontWeight: 700 }}>₹{c.revenueCr.toFixed(2)} Cr</td>
                            <td><span className="badge badge-teal">{share}%</span></td>
                            <td className="mono">{c.ordered.toLocaleString()}</td>
                            <td className="mono">{avgUnits} units</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* UNAVAILABLE METRICS CALLOUTS */}
              <div className="charts-grid-2">
                <div className="na-card">
                  <div className="na-header">
                    <span className="na-name">Foreign Exchange (FX) Impact</span>
                    <span className="na-tag">NOT AVAILABLE</span>
                  </div>
                  <p className="na-reason">
                    <strong>Reason:</strong> All 600 orders in <code>da_b2b_orders.csv</code> are denominated purely in Indian Rupees (<code>total_value_inr</code>). 
                    No multi-currency codes (e.g., USD, EUR), spot rates, or settlement currency rates exist in the dataset.
                  </p>
                </div>

                <div className="na-card">
                  <div className="na-header">
                    <span className="na-name">Client Gross & Net Profit Margin</span>
                    <span className="na-tag">NOT AVAILABLE</span>
                  </div>
                  <p className="na-reason">
                    <strong>Reason:</strong> Transaction records contain gross sales prices (<code>unit_price_inr</code>) but lack Cost of Goods Sold (COGS), freight shipping charges, or port tariffs. 
                    The retail product catalogue contains COGS but cannot be joined to B2B orders without SKU keys.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* SECTION 3: LOGISTICS & SLA PERFORMANCE */}
          {/* ============================================================== */}
          {activeSection === 'logistics' && (
            <>
              <div className="kpi-grid">
                <div className="kpi-card teal-top">
                  <div className="kpi-header"><span className="kpi-title">On-Time Fulfillment Rate</span><CheckCircle size={16} color="#14B8A6" /></div>
                  <div className="kpi-value mono">{stats.onTimeRate.toFixed(2)}%</div>
                  <div className="kpi-sub">{stats.onTimeOrders} on-time orders (77.50%)</div>
                </div>

                <div className="kpi-card rose-top">
                  <div className="kpi-header"><span className="kpi-title">Delayed Shipments</span><AlertTriangle size={16} color="#F43F5E" /></div>
                  <div className="kpi-value mono">{stats.delayedOrders}</div>
                  <div className="kpi-sub">{(100 - stats.onTimeRate).toFixed(2)}% delayed orders (22.50%)</div>
                </div>

                <div className="kpi-card cyan-top">
                  <div className="kpi-header"><span className="kpi-title">Mean Transit Duration</span><Truck size={16} color="#06B6D4" /></div>
                  <div className="kpi-value mono">{stats.avgDeliveryDays.toFixed(2)} Days</div>
                  <div className="kpi-sub">Std Dev: 7.97 days</div>
                </div>

                <div className="kpi-card teal-top">
                  <div className="kpi-header"><span className="kpi-title">Median Transit Duration</span><Calendar size={16} color="#14B8A6" /></div>
                  <div className="kpi-value mono">{stats.medianDeliveryDays.toFixed(1)} Days</div>
                  <div className="kpi-sub">Range: 3 to 45 Days</div>
                </div>
              </div>

              {/* SLA BENCHMARK & TRANSIT HISTOGRAM */}
              <div className="charts-grid-2">
                <div className="chart-card">
                  <div className="chart-card-header">
                    <div>
                      <h2 className="chart-card-title">Category On-Time SLA % vs 80% Benchmark</h2>
                      <p className="chart-card-desc">Red dashed reference line indicates enterprise 80% on-time fulfillment SLA.</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={categoryData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E2E4F" />
                      <XAxis dataKey="category" tick={{ fill: '#94A3B8', fontSize: 10.5 }} />
                      <YAxis domain={[50, 100]} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111C33', borderColor: '#1E2E4F', borderRadius: '8px' }} formatter={(val) => `${val}%`} />
                      <ReferenceLine y={80} stroke="#F43F5E" strokeDasharray="4 4" label={{ value: '80% Target SLA', fill: '#F43F5E', fontSize: 11 }} />
                      <Bar dataKey="slaRate" fill="#14B8A6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <div className="chart-card-header">
                    <div>
                      <h2 className="chart-card-title">Transit Duration Binned Histogram (Days)</h2>
                      <p className="chart-card-desc">Frequency distribution of elapsed transit days from order placement to customer delivery.</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={transitHistogram} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E2E4F" />
                      <XAxis dataKey="range" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111C33', borderColor: '#1E2E4F', borderRadius: '8px' }} />
                      <Bar dataKey="count" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* PAYMENT TERMS LOGISTICS FRICTION TABLE */}
              <div className="table-card">
                <div className="table-toolbar">
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>Delivery Performance by Commercial Payment Terms</h3>
                    <p style={{ fontSize: '12px', color: '#94A3B8' }}>Evaluating whether credit term extensions correlate with fulfillment delays.</p>
                  </div>
                </div>
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Payment Terms</th>
                        <th>Total Orders</th>
                        <th>On-Time Deliveries</th>
                        <th>Delayed Deliveries</th>
                        <th>On-Time SLA %</th>
                        <th>Mean Transit (Days)</th>
                        <th>Fulfillment Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ALL_TERMS.map(term => {
                        const subset = filteredOrders.filter(o => o.payment_terms === term);
                        const total = subset.length;
                        const onTime = subset.filter(o => o.on_time_delivery === 1).length;
                        const delayed = total - onTime;
                        const pct = total ? (onTime / total) * 100 : 0;
                        const avgDays = total ? subset.reduce((s, o) => s + o.delivery_days, 0) / total : 0;
                        return (
                          <tr key={term}>
                            <td style={{ fontWeight: 600, color: '#38BDF8' }}>{term}</td>
                            <td>{total}</td>
                            <td>{onTime}</td>
                            <td style={{ color: delayed > 25 ? '#F43F5E' : '#F1F5F9' }}>{delayed}</td>
                            <td className="mono" style={{ fontWeight: 700 }}>{pct.toFixed(2)}%</td>
                            <td className="mono">{avgDays.toFixed(2)} d</td>
                            <td>
                              <span className={`badge ${pct >= 77.5 ? 'badge-teal' : 'badge-amber'}`}>
                                {pct >= 77.5 ? 'Baseline Compliant' : 'SLA Lagging'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* SECTION 4: RETURNS AND DATA QUALITY */}
          {/* ============================================================== */}
          {activeSection === 'returns' && (
            <>
              <div className="kpi-grid">
                <div className="kpi-card teal-top">
                  <div className="kpi-header"><span className="kpi-title">Total Units Shipped</span><Box size={16} color="#14B8A6" /></div>
                  <div className="kpi-value mono">{stats.totalUnits.toLocaleString()}</div>
                  <div className="kpi-sub">Across 600 recorded shipments</div>
                </div>

                <div className="kpi-card rose-top">
                  <div className="kpi-header"><span className="kpi-title">Total Returned Units</span><RotateCcw size={16} color="#F43F5E" /></div>
                  <div className="kpi-value mono">{stats.returnUnits.toLocaleString()}</div>
                  <div className="kpi-sub">Reported buyer cargo returns</div>
                </div>

                <div className="kpi-card cyan-top">
                  <div className="kpi-header"><span className="kpi-title">Unit Return Rate</span><TrendingUp size={16} color="#06B6D4" /></div>
                  <div className="kpi-value mono">{stats.returnRate.toFixed(2)}%</div>
                  <div className="kpi-sub">1.0100% exact benchmark</div>
                </div>

                <div className="kpi-card rose-top">
                  <div className="kpi-header"><span className="kpi-title">Return Overrun Anomalies</span><ShieldAlert size={16} color="#F43F5E" /></div>
                  <div className="kpi-value mono">{stats.invalidReturns.length} Orders</div>
                  <div className="kpi-sub">return_qty &gt; quantity_units</div>
                </div>
              </div>

              {/* CRITICAL ANOMALY ALERT BANNER */}
              <div className="banner-alert">
                <AlertTriangle size={20} color="#F43F5E" />
                <div>
                  <div className="banner-title">CRITICAL DATA QUALITY EXCEPTION: RETURN OVERRUN ANOMALIES</div>
                  <div className="banner-text">
                    The automated data audit detected 2 order records where <code>return_qty</code> strictly exceeds <code>quantity_units</code>. 
                    These represents an impossible physical condition (more units returned than shipped), indicating upstream ERP data entry transposition errors.
                  </div>
                </div>
              </div>

              {/* CRITICAL ANOMALIES TABLE */}
              <div className="table-card">
                <div className="table-toolbar">
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>Flagged Return Overrun Records</h3>
                    <p style={{ fontSize: '12px', color: '#94A3B8' }}>Identified records preserved for audit trail analysis (not fabricated or altered).</p>
                  </div>
                </div>
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Buyer ID</th>
                        <th>Seller ID</th>
                        <th>Category</th>
                        <th>Order Date</th>
                        <th>Shipped Units</th>
                        <th>Returned Units</th>
                        <th>Unit Price</th>
                        <th>Total Value (₹)</th>
                        <th>Audit Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.invalidReturns.map(row => (
                        <tr key={row.order_id} style={{ backgroundColor: 'rgba(244, 63, 94, 0.08)' }}>
                          <td style={{ fontWeight: 700, color: '#F43F5E' }}>{row.order_id}</td>
                          <td>{row.buyer_id}</td>
                          <td>{row.seller_id}</td>
                          <td>{row.category}</td>
                          <td>{row.order_date}</td>
                          <td className="mono" style={{ fontWeight: 700 }}>{row.quantity_units}</td>
                          <td className="mono" style={{ color: '#F43F5E', fontWeight: 700 }}>{row.return_qty}</td>
                          <td className="mono">₹{row.unit_price_inr.toLocaleString()}</td>
                          <td className="mono">₹{row.total_value_inr.toLocaleString()}</td>
                          <td><span className="badge badge-rose">SUSPICIOUS_RETURN_OVERRUN</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RETURNS BY CATEGORY CHARTS */}
              <div className="charts-grid-2">
                <div className="chart-card">
                  <div className="chart-card-header">
                    <div>
                      <h2 className="chart-card-title">Unit Return Rate (%) by Category</h2>
                      <p className="chart-card-desc">Proportion of physical units returned across commodity categories.</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E2E4F" />
                      <XAxis dataKey="category" tick={{ fill: '#94A3B8', fontSize: 10.5 }} />
                      <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111C33', borderColor: '#1E2E4F', borderRadius: '8px' }} formatter={(val) => `${val}%`} />
                      <Bar dataKey="returnRate" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <div className="chart-card-header">
                    <div>
                      <h2 className="chart-card-title">Shipped vs Returned Physical Units (Thousands)</h2>
                      <p className="chart-card-desc">Absolute cargo volume compared against returned units.</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E2E4F" />
                      <XAxis dataKey="category" tick={{ fill: '#94A3B8', fontSize: 10.5 }} />
                      <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111C33', borderColor: '#1E2E4F', borderRadius: '8px' }} />
                      <Legend />
                      <Bar dataKey="ordered" name="Shipped Units" fill="#334155" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="returned" name="Returned Units" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* CUSTOMER PROFILE DATE ANOMALIES TABLE */}
              <div className="table-card">
                <div className="table-toolbar">
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>Customer Profiles Chronological Anomalies ({customerStats.dateAnomalies.length} Records)</h3>
                    <p style={{ fontSize: '12px', color: '#94A3B8' }}>Records in da_customer_profiles.csv where First_Purchase_Date is chronologically later than Last_Purchase_Date.</p>
                  </div>
                </div>
                <div className="data-table-wrapper" style={{ maxHeight: '240px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Customer ID</th>
                        <th>City</th>
                        <th>Channel</th>
                        <th>First Purchase Date</th>
                        <th>Last Purchase Date</th>
                        <th>Total Orders</th>
                        <th>Total Revenue (₹)</th>
                        <th>Integrity Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerStats.dateAnomalies.slice(0, 10).map(c => (
                        <tr key={c.Customer_ID}>
                          <td style={{ fontWeight: 600, color: '#38BDF8' }}>{c.Customer_ID}</td>
                          <td>{c.City}</td>
                          <td>{c.Acquisition_Channel}</td>
                          <td className="mono" style={{ color: '#F43F5E' }}>{c.First_Purchase_Date}</td>
                          <td className="mono">{c.Last_Purchase_Date}</td>
                          <td>{c.Total_Orders}</td>
                          <td className="mono">₹{c.Total_Revenue.toLocaleString()}</td>
                          <td><span className="badge badge-amber">DATE_INVERSION</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* SECTION 5: BUYER ANALYTICS */}
          {/* ============================================================== */}
          {activeSection === 'buyers' && (
            <>
              <div className="kpi-grid">
                <div className="kpi-card teal-top">
                  <div className="kpi-header"><span className="kpi-title">Unique Commercial Buyers</span><Users size={16} color="#14B8A6" /></div>
                  <div className="kpi-value mono">{buyersRaw.length}</div>
                  <div className="kpi-sub">BUY-0001 to BUY-0187</div>
                </div>

                <div className="kpi-card cyan-top">
                  <div className="kpi-header"><span className="kpi-title">Repeat Buyer Order Share</span><TrendingUp size={16} color="#06B6D4" /></div>
                  <div className="kpi-value mono">{stats.repeatBuyerPct.toFixed(2)}%</div>
                  <div className="kpi-sub">227 repeat orders / 600 total</div>
                </div>

                <div className="kpi-card teal-top">
                  <div className="kpi-header"><span className="kpi-title">Mean Buyer Total Spend</span><Box size={16} color="#14B8A6" /></div>
                  <div className="kpi-value mono">₹2.12 Cr</div>
                  <div className="kpi-sub">Total revenue / 187 buyers</div>
                </div>

                <div className="kpi-card amber-top">
                  <div className="kpi-header"><span className="kpi-title">Top Buyer Spend</span><ArrowUpRight size={16} color="#F59E0B" /></div>
                  <div className="kpi-value mono">₹4.87 Cr</div>
                  <div className="kpi-sub">BUY-0130 (6 orders)</div>
                </div>
              </div>

              {/* TOP BUYERS BAR CHART */}
              <div className="chart-card">
                <div className="chart-card-header">
                  <div>
                    <h2 className="chart-card-title">Top 10 Commercial Buyers by Gross Spend (₹ Lakh)</h2>
                    <p className="chart-card-desc">Ranked by cumulative purchase value directly from da_b2b_orders.csv.</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={buyersRaw.slice(0, 10).map(b => ({
                      buyer_id: b.buyer_id,
                      spendLakh: parseFloat((b.total_spend_inr / 100000).toFixed(2)),
                      orders: b.orders_count
                    }))}
                    margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E2E4F" />
                    <XAxis dataKey="buyer_id" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#111C33', borderColor: '#1E2E4F', borderRadius: '8px' }} formatter={(val) => `₹${val} Lakh`} />
                    <Bar dataKey="spendLakh" fill="#14B8A6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* SEARCHABLE BUYER DIRECTORY TABLE */}
              <div className="table-card">
                <div className="table-toolbar">
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>Commercial Buyer Directory ({filteredBuyers.length} Accounts)</h3>
                    <p style={{ fontSize: '12px', color: '#94A3B8' }}>Aggregated strictly from order transactions with primary categories and SLA track records.</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search size={14} color="#94A3B8" />
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search Buyer ID or Category..."
                      value={buyerSearch}
                      onChange={(e) => setBuyerSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="data-table-wrapper" style={{ maxHeight: '420px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Buyer ID</th>
                        <th>Order Count</th>
                        <th>Total Spend (₹)</th>
                        <th>AOV (₹)</th>
                        <th>Shipped Units</th>
                        <th>Returned Units</th>
                        <th>Return Rate %</th>
                        <th>On-Time SLA %</th>
                        <th>Mean Transit</th>
                        <th>Primary Category</th>
                        <th>Primary Terms</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBuyers.slice(0, 25).map(b => (
                        <tr key={b.buyer_id}>
                          <td style={{ fontWeight: 600, color: '#38BDF8' }}>{b.buyer_id}</td>
                          <td><span className="badge badge-teal">{b.orders_count} orders</span></td>
                          <td className="mono" style={{ fontWeight: 700 }}>₹{(b.total_spend_inr/1e5).toFixed(2)} L</td>
                          <td className="mono">₹{(b.aov_inr/1e5).toFixed(2)} L</td>
                          <td className="mono">{b.total_ordered_units.toLocaleString()}</td>
                          <td className="mono">{b.total_returned_units.toLocaleString()}</td>
                          <td className="mono">{b.return_rate}%</td>
                          <td className="mono">{b.on_time_rate}%</td>
                          <td className="mono">{b.avg_delivery_days.toFixed(1)} d</td>
                          <td>{b.primary_category}</td>
                          <td>{b.primary_terms}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* SECTION 6: PRODUCT CATALOGUE ANALYSIS */}
          {/* ============================================================== */}
          {activeSection === 'products' && (
            <>
              <div className="kpi-grid">
                <div className="kpi-card teal-top">
                  <div className="kpi-header"><span className="kpi-title">Documented SKUs</span><Package size={16} color="#14B8A6" /></div>
                  <div className="kpi-value mono">{productStats.totalProducts} Items</div>
                  <div className="kpi-sub">P1 to P50 master items</div>
                </div>

                <div className="kpi-card cyan-top">
                  <div className="kpi-header"><span className="kpi-title">Warehouse Stock Units</span><Box size={16} color="#06B6D4" /></div>
                  <div className="kpi-value mono">{productStats.totalStock.toLocaleString()}</div>
                  <div className="kpi-sub">Sum of Stock_Units in catalogue</div>
                </div>

                <div className="kpi-card teal-top">
                  <div className="kpi-header"><span className="kpi-title">Mean Retail MRP</span><TrendingUp size={16} color="#14B8A6" /></div>
                  <div className="kpi-value mono">₹{productStats.avgMRP.toFixed(2)}</div>
                  <div className="kpi-sub">Mean COGS: ₹{productStats.avgCOGS.toFixed(2)}</div>
                </div>

                <div className="kpi-card emerald-top">
                  <div className="kpi-header"><span className="kpi-title">Average Gross Margin</span><CheckCircle size={16} color="#10B981" /></div>
                  <div className="kpi-value mono">{productStats.avgMarginPct.toFixed(2)}%</div>
                  <div className="kpi-sub">((MRP - COGS) / MRP) * 100</div>
                </div>
              </div>

              {/* CATALOGUE BOUNDARY CALLOUT */}
              <div className="banner-alert info">
                <Info size={20} color="#06B6D4" />
                <div>
                  <div className="banner-title">SCHEMA BOUNDARY: MASTER PRODUCT CATALOGUE (STANDALONE REFERENCE)</div>
                  <div className="banner-text">
                    <code>da_product_catalogue.csv</code> documents 50 retail SKU products across Beauty, Home, Fashion, Electronics, and Grocery. 
                    It is an independent master reference table. Because <code>da_b2b_orders.csv</code> does not record SKU-level <code>Product_ID</code> foreign keys, 
                    these catalogue metrics are presented strictly within their supported domain without unsupported joins.
                  </div>
                </div>
              </div>

              {/* PRODUCT MARGIN CHARTS */}
              <div className="charts-grid-2">
                <div className="chart-card">
                  <div className="chart-card-header">
                    <div>
                      <h2 className="chart-card-title">Average Gross Margin % by Category</h2>
                      <p className="chart-card-desc">Margin percentage derived from MRP and COGS columns in da_product_catalogue.csv.</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={['Beauty', 'Home', 'Apparel', 'Electronics', 'Grocery'].map(cat => {
                        const subset = productsRaw.filter(p => p.Category === cat);
                        const avgMargin = subset.length ? subset.reduce((s, p) => s + p.Margin_Pct, 0) / subset.length : 0;
                        return { category: cat, margin: parseFloat(avgMargin.toFixed(2)) };
                      })}
                      margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E2E4F" />
                      <XAxis dataKey="category" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111C33', borderColor: '#1E2E4F', borderRadius: '8px' }} formatter={(val) => `${val}%`} />
                      <Bar dataKey="margin" fill="#14B8A6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <div className="chart-card-header">
                    <div>
                      <h2 className="chart-card-title">Warehouse Stock Units by Category</h2>
                      <p className="chart-card-desc">Total inventory stock across product classifications.</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={['Beauty', 'Home', 'Apparel', 'Electronics', 'Grocery'].map(cat => {
                        const subset = productsRaw.filter(p => p.Category === cat);
                        const stock = subset.reduce((s, p) => s + p.Stock_Units, 0);
                        return { category: cat, stock };
                      })}
                      margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E2E4F" />
                      <XAxis dataKey="category" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111C33', borderColor: '#1E2E4F', borderRadius: '8px' }} />
                      <Bar dataKey="stock" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* SEARCHABLE PRODUCT TABLE */}
              <div className="table-card">
                <div className="table-toolbar">
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>Master Product Catalogue ({filteredProducts.length} Items)</h3>
                    <p style={{ fontSize: '12px', color: '#94A3B8' }}>Original master product inventory from da_product_catalogue.csv.</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search size={14} color="#94A3B8" />
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search Product or Category..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="data-table-wrapper" style={{ maxHeight: '400px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product ID</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>MRP (₹)</th>
                        <th>COGS (₹)</th>
                        <th>Unit Margin (₹)</th>
                        <th>Gross Margin %</th>
                        <th>Stock Units</th>
                        <th>Avg Monthly Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(p => (
                        <tr key={p.Product_ID}>
                          <td style={{ fontWeight: 600, color: '#38BDF8' }}>{p.Product_ID}</td>
                          <td>{p.Name}</td>
                          <td><span className="badge badge-cyan">{p.Category}</span></td>
                          <td className="mono">₹{p.MRP.toLocaleString()}</td>
                          <td className="mono">₹{p.COGS.toLocaleString()}</td>
                          <td className="mono">₹{p.Unit_Margin_INR.toLocaleString()}</td>
                          <td className="mono" style={{ fontWeight: 700, color: p.Margin_Pct >= 60 ? '#10B981' : '#F1F5F9' }}>
                            {p.Margin_Pct}%
                          </td>
                          <td className="mono">{p.Stock_Units.toLocaleString()}</td>
                          <td className="mono">{p.Avg_Monthly_Sales.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* SECTION 7: DATA GOVERNANCE */}
          {/* ============================================================== */}
          {activeSection === 'governance' && (
            <>
              {/* RELATIONAL ARCHITECTURE SUMMARY */}
              <div className="chart-card">
                <div className="chart-card-header">
                  <div>
                    <h2 className="chart-card-title">Enterprise Data Architecture & Disjunct Schema Audit</h2>
                    <p className="chart-card-desc">Integrity audit of the three original files and boundary conditions governing relational joins.</p>
                  </div>
                </div>

                <div className="charts-grid-3" style={{ marginTop: '12px' }}>
                  <div style={{ background: '#0D1527', padding: '16px', borderRadius: '8px', border: '1px solid #1E2E4F' }}>
                    <div style={{ color: '#14B8A6', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                      Table 1: da_b2b_orders.csv
                    </div>
                    <ul style={{ fontSize: '11.5px', color: '#94A3B8', listStyleType: 'disc', paddingLeft: '16px', lineHeight: 1.6 }}>
                      <li><strong>Primary Key:</strong> <code>order_id</code> (600 rows)</li>
                      <li><strong>Entities:</strong> <code>buyer_id</code> (187), <code>seller_id</code> (80)</li>
                      <li><strong>Domain:</strong> 2023–2024 B2B bulk export commodities</li>
                      <li><strong>Linking Keys:</strong> None to Product Catalogue or Customer Profiles</li>
                    </ul>
                  </div>

                  <div style={{ background: '#0D1527', padding: '16px', borderRadius: '8px', border: '1px solid #1E2E4F' }}>
                    <div style={{ color: '#06B6D4', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                      Table 2: da_product_catalogue.csv
                    </div>
                    <ul style={{ fontSize: '11.5px', color: '#94A3B8', listStyleType: 'disc', paddingLeft: '16px', lineHeight: 1.6 }}>
                      <li><strong>Primary Key:</strong> <code>Product_ID</code> (50 rows: P1–P50)</li>
                      <li><strong>Domain:</strong> Master warehouse stock & retail product catalogue</li>
                      <li><strong>Attributes:</strong> MRP, COGS, Stock_Units, Avg_Monthly_Sales</li>
                      <li><strong>Boundary:</strong> Standalone reference (no foreign key in orders)</li>
                    </ul>
                  </div>

                  <div style={{ background: '#0D1527', padding: '16px', borderRadius: '8px', border: '1px solid #1E2E4F' }}>
                    <div style={{ color: '#3B82F6', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                      Table 3: da_customer_profiles.csv
                    </div>
                    <ul style={{ fontSize: '11.5px', color: '#94A3B8', listStyleType: 'disc', paddingLeft: '16px', lineHeight: 1.6 }}>
                      <li><strong>Primary Key:</strong> <code>Customer_ID</code> (200 rows: C1–C200)</li>
                      <li><strong>Domain:</strong> 2024–2026 retail consumer accounts</li>
                      <li><strong>Attributes:</strong> City, Acquisition_Channel, Churn, Dates</li>
                      <li><strong>Boundary:</strong> Disjunct from B2B wholesale buyers</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* UNAVAILABLE BUSINESS METRICS MATRIX */}
              <div className="table-card">
                <div className="table-toolbar">
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>Audit of Unavailable Business Metrics & Engineering Fixes</h3>
                    <p style={{ fontSize: '12px', color: '#94A3B8' }}>Strictly distinguishing calculated numbers from requirements unsupported by raw data.</p>
                  </div>
                </div>
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Required Business Metric</th>
                        <th>Current Availability Status</th>
                        <th>Root Cause & Missing Dataset Attributes</th>
                        <th>Recommended Schema Fix</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Foreign Exchange (FX) Gain/Loss</td>
                        <td><span className="badge badge-rose">NOT AVAILABLE</span></td>
                        <td>All orders are denominated exclusively in INR; no foreign currency code, exchange spot rate, or destination country tag.</td>
                        <td>Add <code>currency_code</code>, <code>booking_spot_rate</code>, and <code>country_iso</code> to ERP transactions.</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Client Gross & Net Profit Margin</td>
                        <td><span className="badge badge-rose">NOT AVAILABLE</span></td>
                        <td>Orders contain selling price but lack landed production cost, carrier freight tariffs, or export duties.</td>
                        <td>Implement transactional <code>order_line_items</code> table linking <code>order_id</code> to product SKUs with landed costs.</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Export Regulatory Compliance Logs</td>
                        <td><span className="badge badge-rose">NOT AVAILABLE</span></td>
                        <td>Zero customs clearance documents, Shipping Bill IDs, Port of Loading, or GST Export inspection flags exist.</td>
                        <td>Deploy a customs compliance module tracking Port of Loading clearance milestones.</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Cross-Dataset Joins (Buyer ↔ Customer)</td>
                        <td><span className="badge badge-rose">NOT SUPPORTED</span></td>
                        <td>Customer profiles represent retail consumers (C1–C200), whereas orders represent B2B wholesale entities (BUY-0001).</td>
                        <td>Maintain strict domain boundaries; do not create synthetic or forced relationships.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 12-METRIC ENTERPRISE VERIFIED SCORECARD */}
              <div className="table-card">
                <div className="table-toolbar">
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>12-Metric Enterprise Verified Scorecard</h3>
                    <p style={{ fontSize: '12px', color: '#94A3B8' }}>Every metric validated directly against the raw CSV datasets without fabrication.</p>
                  </div>
                </div>
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Domain</th>
                        <th>Metric Name</th>
                        <th>Verified Source Value</th>
                        <th>Calculation Formula / Source Column</th>
                        <th>Validation Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Commercial</td>
                        <td>Total Gross Export Value</td>
                        <td className="mono" style={{ fontWeight: 700 }}>₹3,968,829,214.20 INR</td>
                        <td>SUM(total_value_inr) across all 600 orders</td>
                        <td><span className="badge badge-teal">VERIFIED 100%</span></td>
                      </tr>
                      <tr>
                        <td>Commercial</td>
                        <td>Total Export Orders</td>
                        <td className="mono">600 Transactions</td>
                        <td>COUNT(order_id) across 2023–2024</td>
                        <td><span className="badge badge-teal">VERIFIED 100%</span></td>
                      </tr>
                      <tr>
                        <td>Commercial</td>
                        <td>Average Order Value (AOV)</td>
                        <td className="mono">₹6,614,715.36 INR</td>
                        <td>Total Revenue / Total Orders</td>
                        <td><span className="badge badge-teal">VERIFIED 100%</span></td>
                      </tr>
                      <tr>
                        <td>Commercial</td>
                        <td>Median Order Value</td>
                        <td className="mono">₹4,817,483.05 INR</td>
                        <td>MEDIAN(total_value_inr)</td>
                        <td><span className="badge badge-teal">VERIFIED 100%</span></td>
                      </tr>
                      <tr>
                        <td>Logistics</td>
                        <td>On-Time Delivery Rate</td>
                        <td className="mono">77.50% (465/600)</td>
                        <td>COUNT(on_time_delivery=1) / Total Orders</td>
                        <td><span className="badge badge-teal">VERIFIED 100%</span></td>
                      </tr>
                      <tr>
                        <td>Logistics</td>
                        <td>Mean Transit Duration</td>
                        <td className="mono">23.49 Days</td>
                        <td>MEAN(delivery_days)</td>
                        <td><span className="badge badge-teal">VERIFIED 100%</span></td>
                      </tr>
                      <tr>
                        <td>Logistics</td>
                        <td>Median Transit Duration</td>
                        <td className="mono">23.50 Days</td>
                        <td>MEDIAN(delivery_days)</td>
                        <td><span className="badge badge-teal">VERIFIED 100%</span></td>
                      </tr>
                      <tr>
                        <td>Quality</td>
                        <td>Physical Unit Return Rate</td>
                        <td className="mono">1.0100% (15,242 units)</td>
                        <td>SUM(return_qty) / SUM(quantity_units)</td>
                        <td><span className="badge badge-teal">VERIFIED 100%</span></td>
                      </tr>
                      <tr>
                        <td>Quality</td>
                        <td>Return Overrun Anomalies</td>
                        <td className="mono" style={{ color: '#F43F5E' }}>2 Orders (B2B-00131/188)</td>
                        <td>WHERE return_qty &gt; quantity_units</td>
                        <td><span className="badge badge-rose">FLAGGED AUDIT</span></td>
                      </tr>
                      <tr>
                        <td>Buyers</td>
                        <td>Unique Commercial Buyers</td>
                        <td className="mono">187 Accounts</td>
                        <td>DISTINCTCOUNT(buyer_id)</td>
                        <td><span className="badge badge-teal">VERIFIED 100%</span></td>
                      </tr>
                      <tr>
                        <td>Catalogue</td>
                        <td>Master Product SKUs</td>
                        <td className="mono">50 Items (P1–P50)</td>
                        <td>COUNT(Product_ID) in da_product_catalogue.csv</td>
                        <td><span className="badge badge-teal">VERIFIED 100%</span></td>
                      </tr>
                      <tr>
                        <td>Customers</td>
                        <td>Retail Customer Profiles</td>
                        <td className="mono">200 Accounts (C1–C200)</td>
                        <td>COUNT(Customer_ID) in da_customer_profiles.csv</td>
                        <td><span className="badge badge-teal">VERIFIED 100%</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
