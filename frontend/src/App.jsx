import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp, Truck, RotateCcw, Users, ShieldAlert, Package,
  Download, Filter, RefreshCw, AlertTriangle, CheckCircle,
  FileText, Calendar, Box, Database, Layers, ArrowUpRight,
  Info, Search, HelpCircle, Globe, DollarSign, AlertOctagon,
  Sun, Moon, ExternalLink, X, Printer, Clock, FileSpreadsheet,
  CheckCircle2, AlertCircle, ArrowDownRight, Sliders
} from 'lucide-react';

import ordersRaw from './data/orders.json';
import productsRaw from './data/products.json';
import customersRaw from './data/customers.json';
import buyersRaw from './data/buyers_aggregated.json';
import exceptionsRaw from './data/exceptions.json';

// Unique filters supported by orders dataset
const ALL_CATEGORIES = [...new Set(ordersRaw.map(o => o.category))].sort();
const ALL_TERMS = [...new Set(ordersRaw.map(o => o.payment_terms))].sort();
const ALL_YEARS = ['ALL', '2023', '2024'];

// Color palette
const COLORS = {
  teal: '#0D9488',
  tealLight: '#14B8A6',
  cyan: '#0284C7',
  blue: '#2563EB',
  amber: '#D97706',
  rose: '#DC2626',
  emerald: '#059669',
  slate: '#64748B',
  pie: ['#0D9488', '#0284C7', '#2563EB', '#D97706', '#7C3AED', '#E11D48']
};

export default function App() {
  // Navigation State
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('section');
      if (p) return p;
      const h = window.location.hash.replace('#', '');
      if (h) return h;
    }
    return 'overview';
  });

  // Theme State (Dark / Light)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tradesight_theme');
      if (saved) return saved;
      return 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'light') {
        document.body.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
      }
      localStorage.setItem('tradesight_theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleSelectSection = (s) => {
    setActiveSection(s);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location);
      url.searchParams.set('section', s);
      window.history.replaceState({}, '', url);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Global Interactive Filters
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedTerm, setSelectedTerm] = useState('ALL');
  const [quickFilter, setQuickFilter] = useState('ALL');
  const [orderSearch, setOrderSearch] = useState('');
  const [buyerSearch, setBuyerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Selected Order for Drill-down Modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Exception Review Status State (Persisted in localStorage)
  const [exceptionsData, setExceptionsData] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tradesight_exceptions_status');
      if (saved) {
        try {
          const map = JSON.parse(saved);
          return exceptionsRaw.map(e => ({
            ...e,
            review_status: map[e.exception_id] || e.review_status
          }));
        } catch (err) {
          console.error('Error loading exceptions state:', err);
        }
      }
    }
    return exceptionsRaw;
  });

  const [exceptionSeverityFilter, setExceptionSeverityFilter] = useState('ALL');
  const [exceptionSearch, setExceptionSearch] = useState('');

  const updateExceptionStatus = (exceptionId, newStatus) => {
    setExceptionsData(prev => {
      const updated = prev.map(e => e.exception_id === exceptionId ? { ...e, review_status: newStatus } : e);
      if (typeof window !== 'undefined') {
        const map = updated.reduce((acc, cur) => { acc[cur.exception_id] = cur.review_status; return acc; }, {});
        localStorage.setItem('tradesight_exceptions_status', JSON.stringify(map));
      }
      return updated;
    });
  };

  // What-If FX Sensitivity Scenario State
  const [fxShockPct, setFxShockPct] = useState(0);

  // Filtered Orders Data
  const filteredOrders = useMemo(() => {
    return ordersRaw.filter(order => {
      if (selectedYear !== 'ALL' && String(order.order_year) !== selectedYear) return false;
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
          order.seller_id.toLowerCase().includes(q) ||
          order.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedYear, selectedCategory, selectedTerm, quickFilter, orderSearch]);

  // Aggregate Stats from Filtered Orders
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
    const avgMarkupPct = avgCOGS > 0 ? ((avgMRP - avgCOGS) / avgCOGS) * 100 : 0;
    return { totalProducts, totalStock, avgMRP, avgCOGS, avgMarginPct, avgMarkupPct };
  }, []);

  // Customer Profile Stats (from da_customer_profiles.csv)
  const customerStats = useMemo(() => {
    const count = customersRaw.length;
    const totalRev = customersRaw.reduce((sum, c) => sum + (c.Total_Revenue || 0), 0);
    const churnedCount = customersRaw.filter(c => c.Churned === 1).length;
    const churnRate = count ? (churnedCount / count) * 100 : 0;
    return { count, totalRev, churnedCount, churnRate };
  }, []);

  // Monthly Revenue Trends
  const monthlyRevenue = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      const ym = o.order_year_month;
      if (!map[ym]) {
        map[ym] = { month: ym, revenueCr: 0, orders: 0, units: 0 };
      }
      map[ym].revenueCr += (o.total_value_inr || 0) / 10000000;
      map[ym].orders += 1;
      map[ym].units += (o.quantity_units || 0);
    });
    return Object.keys(map).sort().map(k => ({
      ...map[k],
      revenueCr: parseFloat(map[k].revenueCr.toFixed(2))
    }));
  }, [filteredOrders]);

  // Quarterly Revenue Trends
  const quarterlyRevenue = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      const ym = o.order_year_month;
      const [year, month] = ym.split('-');
      const q = Math.ceil(parseInt(month, 10) / 3);
      const key = `${year} Q${q}`;
      if (!map[key]) {
        map[key] = { quarter: key, revenueCr: 0, orders: 0 };
      }
      map[key].revenueCr += (o.total_value_inr || 0) / 10000000;
      map[key].orders += 1;
    });
    return Object.keys(map).sort().map(k => ({
      ...map[k],
      revenueCr: parseFloat(map[k].revenueCr.toFixed(2))
    }));
  }, [filteredOrders]);

  // Category Breakdown
  const categoryData = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      if (!map[o.category]) {
        map[o.category] = { category: o.category, revenueCr: 0, orders: 0, units: 0 };
      }
      map[o.category].revenueCr += (o.total_value_inr || 0) / 10000000;
      map[o.category].orders += 1;
      map[o.category].units += (o.quantity_units || 0);
    });
    return Object.values(map)
      .sort((a, b) => b.revenueCr - a.revenueCr)
      .map(c => ({
        ...c,
        revenueCr: parseFloat(c.revenueCr.toFixed(2))
      }));
  }, [filteredOrders]);

  // Payment Terms Breakdown
  const paymentTermsData = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      if (!map[o.payment_terms]) {
        map[o.payment_terms] = { term: o.payment_terms, orders: 0, revenueCr: 0 };
      }
      map[o.payment_terms].orders += 1;
      map[o.payment_terms].revenueCr += (o.total_value_inr || 0) / 10000000;
    });
    return Object.values(map).map(p => ({
      ...p,
      revenueCr: parseFloat(p.revenueCr.toFixed(2))
    }));
  }, [filteredOrders]);

  // Transit Duration Histogram Bins
  const transitHistogram = useMemo(() => {
    const bins = [
      { range: '1-10 Days', count: 0 },
      { range: '11-20 Days', count: 0 },
      { range: '21-30 Days', count: 0 },
      { range: '31-40 Days', count: 0 }
    ];
    filteredOrders.forEach(o => {
      const d = o.delivery_days;
      if (d <= 10) bins[0].count++;
      else if (d <= 20) bins[1].count++;
      else if (d <= 30) bins[2].count++;
      else bins[3].count++;
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

  // Top 10 Buyers by Revenue
  const top10Buyers = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      if (!map[o.buyer_id]) {
        map[o.buyer_id] = { buyer_id: o.buyer_id, spend_inr: 0, orders: 0, units: 0 };
      }
      map[o.buyer_id].spend_inr += o.total_value_inr || 0;
      map[o.buyer_id].orders += 1;
      map[o.buyer_id].units += o.quantity_units || 0;
    });
    return Object.values(map)
      .sort((a, b) => b.spend_inr - a.spend_inr)
      .slice(0, 10)
      .map(b => ({
        ...b,
        spend_cr: parseFloat((b.spend_inr / 1e7).toFixed(2))
      }));
  }, [filteredOrders]);

  // Filtered Buyers
  const filteredBuyers = useMemo(() => {
    return buyersRaw.filter(b => {
      if (buyerSearch) {
        const q = buyerSearch.toLowerCase();
        return (
          b.buyer_id.toLowerCase().includes(q) ||
          (b.primary_category && b.primary_category.toLowerCase().includes(q)) ||
          (b.segment_label && b.segment_label.toLowerCase().includes(q))
        );
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

  // Filtered Exceptions
  const filteredExceptions = useMemo(() => {
    return exceptionsData.filter(e => {
      if (exceptionSeverityFilter !== 'ALL' && e.severity !== exceptionSeverityFilter) return false;
      if (exceptionSearch) {
        const q = exceptionSearch.toLowerCase();
        return (
          e.exception_id.toLowerCase().includes(q) ||
          e.record_id.toLowerCase().includes(q) ||
          e.exception_category.toLowerCase().includes(q) ||
          e.buyer_or_entity.toLowerCase().includes(q) ||
          e.recommended_action.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [exceptionsData, exceptionSeverityFilter, exceptionSearch]);

  // Reset Filters
  const resetFilters = () => {
    setSelectedYear('ALL');
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
    link.setAttribute('download', `tradesight_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Exceptions Report to CSV
  const handleExportExceptionsCSV = () => {
    if (!filteredExceptions.length) return;
    const headers = [
      'exception_id', 'severity', 'exception_category', 'source_dataset',
      'record_id', 'buyer_or_entity', 'observed_value', 'threshold_or_rule',
      'recommended_action', 'review_status'
    ];
    const rows = filteredExceptions.map(e => 
      headers.map(h => e[h] !== undefined ? `"${e[h]}"` : '""').join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tradesight_exceptions_audit_${new Date().toISOString().split('T')[0]}.csv`);
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
            <div className="brand-subtitle">Export Analytics Platform</div>
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
            className={`nav-item ${activeSection === 'country' ? 'active' : ''}`}
            onClick={() => handleSelectSection('country')}
          >
            <Globe size={16} /> 3. Country Analysis
          </button>
          <button
            className={`nav-item ${activeSection === 'shipment' ? 'active' : ''}`}
            onClick={() => handleSelectSection('shipment')}
          >
            <Truck size={16} /> 4. Shipment Performance
          </button>
          <button
            className={`nav-item ${activeSection === 'clients' ? 'active' : ''}`}
            onClick={() => handleSelectSection('clients')}
          >
            <Users size={16} /> 5. Client Analytics
          </button>
          <button
            className={`nav-item ${activeSection === 'currency' ? 'active' : ''}`}
            onClick={() => handleSelectSection('currency')}
          >
            <DollarSign size={16} /> 6. Currency Impact
          </button>
          <button
            className={`nav-item ${activeSection === 'compliance' ? 'active' : ''}`}
            onClick={() => handleSelectSection('compliance')}
          >
            <AlertOctagon size={16} /> 7. Compliance & Exceptions
          </button>
          <button
            className={`nav-item ${activeSection === 'products' ? 'active' : ''}`}
            onClick={() => handleSelectSection('products')}
          >
            <Package size={16} /> 8. Product & Inventory
          </button>
          <button
            className={`nav-item ${activeSection === 'reports' ? 'active' : ''}`}
            onClick={() => handleSelectSection('reports')}
          >
            <FileSpreadsheet size={16} /> 9. Reports Hub
          </button>
          <button
            className={`nav-item ${activeSection === 'governance' ? 'active' : ''}`}
            onClick={() => handleSelectSection('governance')}
          >
            <ShieldAlert size={16} /> 10. Data Governance
          </button>
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: '#CBD5E1', fontWeight: 600 }}>
            <Database size={13} color="#14B8A6" /> Enterprise Data Sources
          </div>
          <div style={{ color: '#94A3B8' }}>
            600 Orders • 50 SKUs • 200 Profiles
          </div>
          <div style={{ marginTop: '8px', fontSize: '10px', color: '#64748B' }}>
            TradeSight Export Management (Chennai, IN)
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="app-main">
        {/* TOP BAR */}
        <header className="top-bar">
          <div className="page-heading">
            <h1 className="page-title">
              {activeSection === 'overview' && 'Executive Overview & Strategic KPIs'}
              {activeSection === 'revenue' && 'Export Revenue & Commercial Turnover'}
              {activeSection === 'country' && 'Destination Country Analysis & Regional Coverage'}
              {activeSection === 'shipment' && 'Shipment Performance & Delivery SLA'}
              {activeSection === 'clients' && 'Client Analytics, RFM-V Segments & Profitability'}
              {activeSection === 'currency' && 'Currency Impact & Foreign Exchange Exposure'}
              {activeSection === 'compliance' && 'Compliance & Operational Exception Management'}
              {activeSection === 'products' && 'Product Catalogue & Inventory Analytics'}
              {activeSection === 'reports' && 'Management Reports & Weekly Automation'}
              {activeSection === 'governance' && 'Enterprise Data Governance & System Health'}
            </h1>
            <span className="page-badge">Live System • Nov 2026</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="theme-toggle-btn" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}>
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button className="action-btn primary" onClick={handleExportCSV}>
              <Download size={14} /> Export CSV
            </button>
          </div>
        </header>

        {/* GLOBAL FILTER TOOLBAR */}
        <div className="filter-toolbar">
          <div className="filter-label">
            <Filter size={14} /> Filters:
          </div>

          <div>
            <select
              className="filter-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              title="Filter by Year"
            >
              <option value="ALL">All Years (2023–2024)</option>
              <option value="2023">Year 2023</option>
              <option value="2024">Year 2024</option>
            </select>
          </div>

          <div>
            <select
              className="filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              title="Filter by Product Category"
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
              title="Filter by Payment Terms"
            >
              <option value="ALL">All Terms ({ALL_TERMS.length})</option>
              {ALL_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>Presets:</span>
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

          {(selectedYear !== 'ALL' || selectedCategory !== 'ALL' || selectedTerm !== 'ALL' || quickFilter !== 'ALL' || orderSearch) && (
            <button className="action-btn" onClick={resetFilters} style={{ marginLeft: 'auto', padding: '4px 8px', fontSize: '11px' }}>
              <RefreshCw size={12} /> Reset
            </button>
          )}
        </div>

        {/* CONTENT VIEWPORT */}
        <div className="content-body">

          {/* =========================================================================
              1. EXECUTIVE OVERVIEW SECTION
              ========================================================================= */}
          {activeSection === 'overview' && (
            <>
              {/* Headline KPI Cards */}
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">Export Revenue</span>
                    <span className="tooltip-trigger" title="Total export invoice turnover: SUM(total_value_inr)"><Info size={13} /></span>
                  </div>
                  <div className="kpi-value">₹{(stats.totalRevenue / 1e7).toFixed(2)} Cr</div>
                  <div className="kpi-subtext positive">
                    <TrendingUp size={12} /> {stats.totalOrders} Shipments
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">Average Order Value</span>
                    <span className="tooltip-trigger" title="AOV: Total Export Revenue / Total Orders"><Info size={13} /></span>
                  </div>
                  <div className="kpi-value">₹{(stats.aov / 1e5).toFixed(2)} L</div>
                  <div className="kpi-subtext">
                    Median: ₹48.17 L
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">On-Time SLA</span>
                    <span className="tooltip-trigger" title="Percentage of orders delivered on time: COUNT(on_time_delivery=1) / Total Orders"><Info size={13} /></span>
                  </div>
                  <div className="kpi-value" style={{ color: stats.onTimeRate >= 80 ? 'var(--emerald)' : 'var(--amber)' }}>
                    {stats.onTimeRate.toFixed(2)}%
                  </div>
                  <div className="kpi-subtext warning">
                    {stats.delayedOrders} Delayed Orders
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">Average Transit</span>
                    <span className="tooltip-trigger" title="Mean delivery transit days: MEAN(delivery_days)"><Info size={13} /></span>
                  </div>
                  <div className="kpi-value">{stats.avgDeliveryDays.toFixed(2)} d</div>
                  <div className="kpi-subtext">
                    Median: {stats.medianDeliveryDays} Days
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">Return Rate</span>
                    <span className="tooltip-trigger" title="Unit Return Rate: Total Returned Units / Total Shipped Units"><Info size={13} /></span>
                  </div>
                  <div className="kpi-value">{stats.returnRate.toFixed(2)}%</div>
                  <div className="kpi-subtext">
                    {stats.returnUnits.toLocaleString()} / {stats.totalUnits.toLocaleString()} Units
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">Repeat Buyer Rate</span>
                    <span className="tooltip-trigger" title="Share of orders placed by repeat commercial buyers"><Info size={13} /></span>
                  </div>
                  <div className="kpi-value">{stats.repeatBuyerPct.toFixed(2)}%</div>
                  <div className="kpi-subtext positive">
                    {stats.repeatBuyerOrders} Repeat Orders
                  </div>
                </div>
              </div>

              {/* Operational Exception Alert */}
              {stats.invalidReturns.length > 0 && (
                <div className="alert-banner warning">
                  <AlertTriangle size={18} color="var(--amber)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Data Quality Exception Detected:</strong> Orders <code>B2B-00131</code> (shipped 22, returned 28) and <code>B2B-00188</code> (shipped 39, returned 48) have returned quantities exceeding shipped units. Quarantined in Compliance & Exceptions tab for root-cause audit.
                  </div>
                </div>
              )}

              {/* Executive Charts Grid */}
              <div className="chart-grid-2">
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Monthly Export Revenue Velocity (2023–2024)</div>
                      <div className="panel-subtitle">Longitudinal gross turnover (₹ Crores) with order volume trend</div>
                    </div>
                  </div>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--teal)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="var(--teal)" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis dataKey="month" stroke="var(--text-dim)" fontSize={11} />
                        <YAxis stroke="var(--text-dim)" fontSize={11} tickFormatter={(v) => `₹${v}Cr`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderRadius: 6, color: 'var(--text-main)' }}
                          formatter={(v) => [`₹${v} Crore`, 'Revenue']}
                        />
                        <Area type="monotone" dataKey="revenueCr" stroke="var(--teal)" fillOpacity={1} fill="url(#revGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Fulfillment SLA & Delayed Shipment Impact</div>
                      <div className="panel-subtitle">77.50% On-time compliance vs. 22.50% delayed shipments</div>
                    </div>
                  </div>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'On-Time (465 Orders)', value: stats.onTimeOrders, fill: 'var(--emerald)' },
                            { name: 'Delayed (135 Orders)', value: stats.delayedOrders, fill: 'var(--amber)' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          <Cell fill="var(--emerald)" />
                          <Cell fill="var(--amber)" />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderRadius: 6, color: 'var(--text-main)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Category Breakdown & Payment Terms */}
              <div className="chart-grid-2">
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Export Revenue by Commodity Category</div>
                      <div className="panel-subtitle">Total gross turnover in ₹ Crores across 5 export sectors</div>
                    </div>
                  </div>
                  <div style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis type="number" stroke="var(--text-dim)" fontSize={11} tickFormatter={(v) => `₹${v}Cr`} />
                        <YAxis dataKey="category" type="category" stroke="var(--text-dim)" fontSize={11} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderRadius: 6, color: 'var(--text-main)' }}
                          formatter={(v) => [`₹${v} Crore`, 'Revenue']}
                        />
                        <Bar dataKey="revenueCr" fill="var(--teal)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Turnover by Commercial Payment Terms</div>
                      <div className="panel-subtitle">Letter of Credit (LC), 30 Days Net, 60 Days Net, and Advance</div>
                    </div>
                  </div>
                  <div style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={paymentTermsData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis dataKey="term" stroke="var(--text-dim)" fontSize={11} />
                        <YAxis stroke="var(--text-dim)" fontSize={11} tickFormatter={(v) => `₹${v}Cr`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderRadius: 6, color: 'var(--text-main)' }}
                          formatter={(v) => [`₹${v} Crore`, 'Revenue']}
                        />
                        <Bar dataKey="revenueCr" fill="var(--cyan)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Strategic Management Recommendations */}
              <div className="panel-card" style={{ borderLeft: '4px solid var(--teal)' }}>
                <div className="panel-header">
                  <div className="panel-title">Executive Action Items for Operations & Commercial Leadership</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  <div>
                    <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>1. Carrier SLA Intervention:</strong>
                    Investigate the 135 delayed orders (22.50% delay rate). Establish 48-hour exception escalation protocols with freight forwarders for shipments exceeding 20 days in transit.
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>2. Upstream ERP Constraint:</strong>
                    Implement strict warehouse intake validation rejecting return quantities that exceed original shipped volumes (remediating B2B-00131 and B2B-00188).
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>3. Export Schema Modernization:</strong>
                    Extend ERP database schema with line-item SKU linkages and foreign currency booking rates to unlock true order net profitability and FX risk hedging.
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =========================================================================
              2. EXPORT REVENUE SECTION
              ========================================================================= */}
          {activeSection === 'revenue' && (
            <>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-header"><span className="kpi-title">Export Revenue</span></div>
                  <div className="kpi-value">₹{(stats.totalRevenue / 1e7).toFixed(2)} Cr</div>
                  <div className="kpi-subtext">Sum of 600 orders</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-header"><span className="kpi-title">Average Order Value</span></div>
                  <div className="kpi-value">₹{(stats.aov / 1e5).toFixed(2)} L</div>
                  <div className="kpi-subtext">Per export shipment</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-header"><span className="kpi-title">Top 10 Buyer Concentration</span></div>
                  <div className="kpi-value">
                    {stats.totalRevenue ? ((top10Buyers.reduce((s, b) => s + b.spend_inr, 0) / stats.totalRevenue) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="kpi-subtext">Top 10 of 187 buyers</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-header"><span className="kpi-title">High-Value Orders (&gt; ₹1 Cr)</span></div>
                  <div className="kpi-value">{filteredOrders.filter(o => (o.total_value_inr || 0) >= 10000000).length}</div>
                  <div className="kpi-subtext positive">Major institutional shipments</div>
                </div>
              </div>

              {/* Quarterly Comparison */}
              <div className="chart-grid-2">
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Quarterly Revenue Growth (Q1 2023 – Q4 2024)</div>
                      <div className="panel-subtitle">Quarterly turnover in ₹ Crores with seasonal peaks</div>
                    </div>
                  </div>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={quarterlyRevenue} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis dataKey="quarter" stroke="var(--text-dim)" fontSize={11} />
                        <YAxis stroke="var(--text-dim)" fontSize={11} tickFormatter={(v) => `₹${v}Cr`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderRadius: 6, color: 'var(--text-main)' }}
                          formatter={(v) => [`₹${v} Crore`, 'Turnover']}
                        />
                        <Bar dataKey="revenueCr" fill="var(--teal)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Order Value Tier Distribution</div>
                      <div className="panel-subtitle">Shipment count and turnover across transaction value brackets</div>
                    </div>
                  </div>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={orderValueTiers} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis dataKey="tier" stroke="var(--text-dim)" fontSize={11} />
                        <YAxis stroke="var(--text-dim)" fontSize={11} tickFormatter={(v) => `₹${v}Cr`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderRadius: 6, color: 'var(--text-main)' }}
                          formatter={(v, name) => [name === 'revCr' ? `₹${v} Cr` : `${v} Orders`, name === 'revCr' ? 'Revenue' : 'Count']}
                        />
                        <Bar dataKey="revCr" fill="var(--cyan)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Top 10 Buyers & Transaction Table */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Recent Export Orders Transaction Ledger</div>
                    <div className="panel-subtitle">Click any order row to inspect full shipment details & drill-down</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="filter-select"
                      placeholder="Search Order, Buyer, Seller..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      style={{ width: '220px' }}
                    />
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Order Date</th>
                        <th>Buyer ID</th>
                        <th>Seller ID</th>
                        <th>Category</th>
                        <th>Shipped Units</th>
                        <th>Total Value (INR)</th>
                        <th>Payment Terms</th>
                        <th>Transit Days</th>
                        <th>Delivery Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.slice(0, 15).map(o => (
                        <tr key={o.order_id} className="clickable" onClick={() => setSelectedOrder(o)}>
                          <td className="mono" style={{ fontWeight: 600, color: 'var(--teal)' }}>{o.order_id}</td>
                          <td>{o.order_date}</td>
                          <td className="mono">{o.buyer_id}</td>
                          <td className="mono">{o.seller_id}</td>
                          <td>{o.category}</td>
                          <td>{o.quantity_units.toLocaleString()}</td>
                          <td style={{ fontWeight: 600 }}>₹{o.total_value_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                          <td><span className="badge neutral">{o.payment_terms}</span></td>
                          <td>{o.delivery_days} days</td>
                          <td>
                            {o.on_time_delivery === 1 ? (
                              <span className="badge success">On-Time</span>
                            ) : (
                              <span className="badge warning">Delayed</span>
                            )}
                          </td>
                          <td>
                            <button className="action-btn" style={{ padding: '2px 6px', fontSize: '11px' }} onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); }}>
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: '10px', fontSize: '11.5px', color: 'var(--text-dim)', textAlign: 'right' }}>
                  Showing 15 of {filteredOrders.length} orders matching active filters.
                </div>
              </div>
            </>
          )}

          {/* =========================================================================
              3. COUNTRY ANALYSIS SECTION (12-Country Limitation Audit)
              ========================================================================= */}
          {activeSection === 'country' && (
            <>
              {/* Executive Notice on Country Data Limitation */}
              <div className="alert-banner info">
                <Globe size={20} color="var(--teal)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '13.5px', marginBottom: '4px' }}>
                    Destination Country Data Availability Audit & Regional Architecture
                  </strong>
                  TradeSight Export Management operates as a simulated Chennai-based export management enterprise serving 50 institutional clients across <strong>12 destination countries</strong> (as outlined in client requirements).
                  <br />
                  However, our schema audit of the original transactional source file (<code>da_b2b_orders.csv</code>) confirms that order records are denominated purely in INR and <strong>lack a destination country ISO or country code column</strong>.
                  <br />
                  In compliance with enterprise data governance, <strong>no synthetic country records or artificial geography have been fabricated</strong>. Below is the empirical domestic origin distribution available in the catalogue, alongside the target 12-country schema migration blueprint.
                </div>
              </div>

              {/* Domestic Origin State Analysis (from Product Catalogue) */}
              <div className="chart-grid-2">
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Available Domestic Sourcing States (Product Catalogue)</div>
                      <div className="panel-subtitle">Inventory stock distribution across domestic origin manufacturing hubs</div>
                    </div>
                  </div>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={[
                          { state: 'Tamil Nadu', skus: 14, stock: 4120 },
                          { state: 'Maharashtra', skus: 11, stock: 3250 },
                          { state: 'Gujarat', skus: 10, stock: 2890 },
                          { state: 'Karnataka', skus: 8, stock: 2110 },
                          { state: 'Kerala', skus: 7, stock: 1487 }
                        ]}
                        margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis dataKey="state" stroke="var(--text-dim)" fontSize={11} />
                        <YAxis stroke="var(--text-dim)" fontSize={11} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderRadius: 6, color: 'var(--text-main)' }}
                        />
                        <Bar dataKey="stock" fill="var(--teal)" radius={[4, 4, 0, 0]} name="Stock Units" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Domestic Consumer Origin Cities (Customer Profiles)</div>
                      <div className="panel-subtitle">Direct retail customer profile concentration across major metro hubs</div>
                    </div>
                  </div>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Chennai', value: 45 },
                            { name: 'Mumbai', value: 38 },
                            { name: 'Bangalore', value: 35 },
                            { name: 'Delhi NCR', value: 32 },
                            { name: 'Hyderabad', value: 28 },
                            { name: 'Other Cities', value: 22 }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={85}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {COLORS.pie.map((c, i) => <Cell key={i} fill={c} />)}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderRadius: 6, color: 'var(--text-main)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* 12-Country Target Architecture Blueprint */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">12-Market Export Architecture & Integration Specification</div>
                    <div className="panel-subtitle">Required database fields to unlock destination country intelligence upon upstream ERP migration</div>
                  </div>
                  <span className="badge info">Roadmap Requirement</span>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Destination Country</th>
                        <th>Target ISO Code</th>
                        <th>Expected Trade Lane</th>
                        <th>Incoterms Required</th>
                        <th>Status in Current Raw Data</th>
                        <th>Required Upstream Schema Fix</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { country: 'United Arab Emirates (UAE)', iso: 'ARE', port: 'Port of Jebel Ali (AEJEA)', incoterm: 'CIF / FOB' },
                        { country: 'United States of America', iso: 'USA', port: 'Port of New York / Newark (USNYC)', incoterm: 'FOB / CFR' },
                        { country: 'United Kingdom', iso: 'GBR', port: 'Port of Felixstowe (GBFXT)', incoterm: 'CIF / DDP' },
                        { country: 'Germany', iso: 'DEU', port: 'Port of Hamburg (DEHAM)', incoterm: 'FOB / CIF' },
                        { country: 'Singapore', iso: 'SGP', port: 'Port of Singapore (SGSIN)', incoterm: 'CIF / CFR' },
                        { country: 'Saudi Arabia', iso: 'SAU', port: 'Jeddah Islamic Port (SAJED)', incoterm: 'CIF' },
                        { country: 'Netherlands', iso: 'NLD', port: 'Port of Rotterdam (NLRTM)', incoterm: 'FOB / CIF' },
                        { country: 'Japan', iso: 'JPN', port: 'Port of Yokohama (JPYOK)', incoterm: 'FOB / CFR' },
                        { country: 'Australia', iso: 'AUS', port: 'Port of Sydney (AUSYD)', incoterm: 'CIF' },
                        { country: 'France', iso: 'FRA', port: 'Port of Le Havre (FRLEH)', incoterm: 'FOB / CIF' },
                        { country: 'Italy', iso: 'ITA', port: 'Port of Genoa (ITGOA)', incoterm: 'CIF' },
                        { country: 'South Africa', iso: 'ZAF', port: 'Port of Durban (ZADUR)', incoterm: 'CIF / CFR' },
                      ].map((c) => (
                        <tr key={c.iso}>
                          <td style={{ fontWeight: 600 }}>{c.country}</td>
                          <td className="mono">{c.iso}</td>
                          <td>{c.port}</td>
                          <td>{c.incoterm}</td>
                          <td><span className="badge warning">Missing in Raw CSV</span></td>
                          <td style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                            Add <code>destination_country_iso</code> and <code>port_of_discharge</code> to order manifest.
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* =========================================================================
              4. SHIPMENT PERFORMANCE SECTION
              ========================================================================= */}
          {activeSection === 'shipment' && (
            <>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-header"><span className="kpi-title">On-Time SLA Rate</span></div>
                  <div className="kpi-value" style={{ color: stats.onTimeRate >= 80 ? 'var(--emerald)' : 'var(--amber)' }}>
                    {stats.onTimeRate.toFixed(2)}%
                  </div>
                  <div className="kpi-subtext positive">{stats.onTimeOrders} on-time shipments</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-header"><span className="kpi-title">Delayed Shipments</span></div>
                  <div className="kpi-value" style={{ color: 'var(--amber)' }}>{stats.delayedOrders}</div>
                  <div className="kpi-subtext warning">22.50% fulfillment delay rate</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-header"><span className="kpi-title">Mean Transit Time</span></div>
                  <div className="kpi-value">{stats.avgDeliveryDays.toFixed(2)} Days</div>
                  <div className="kpi-subtext">Order to customer receipt</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-header"><span className="kpi-title">Median Transit Time</span></div>
                  <div className="kpi-value">{stats.medianDeliveryDays} Days</div>
                  <div className="kpi-subtext">Range: 10 to 35 days</div>
                </div>
              </div>

              {/* Shipment Charts */}
              <div className="chart-grid-2">
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Transit Duration Distribution</div>
                      <div className="panel-subtitle">Frequency distribution of shipment delivery lead times</div>
                    </div>
                  </div>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={transitHistogram} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis dataKey="range" stroke="var(--text-dim)" fontSize={11} />
                        <YAxis stroke="var(--text-dim)" fontSize={11} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderRadius: 6, color: 'var(--text-main)' }}
                          formatter={(v) => [`${v} Shipments`, 'Volume']}
                        />
                        <Bar dataKey="count" fill="var(--teal)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">On-Time SLA by Commodity Category</div>
                      <div className="panel-subtitle">Fulfillment compliance rate across product sectors</div>
                    </div>
                  </div>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={categoryData.map(c => {
                          const catOrders = filteredOrders.filter(o => o.category === c.category);
                          const onTime = catOrders.filter(o => o.on_time_delivery === 1).length;
                          const sla = catOrders.length ? (onTime / catOrders.length) * 100 : 0;
                          return { category: c.category, sla: parseFloat(sla.toFixed(1)) };
                        })}
                        margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis dataKey="category" stroke="var(--text-dim)" fontSize={10} />
                        <YAxis stroke="var(--text-dim)" fontSize={11} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <ReferenceLine y={80} stroke="var(--emerald)" strokeDasharray="3 3" label={{ value: 'Target 80%', fill: 'var(--emerald)', fontSize: 10 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderRadius: 6, color: 'var(--text-main)' }}
                          formatter={(v) => [`${v}%`, 'SLA Rate']}
                        />
                        <Bar dataKey="sla" fill="var(--cyan)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Delayed Shipments Inspection Table */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Fulfillment Delay Ledger (135 Delayed Shipments)</div>
                    <div className="panel-subtitle">Orders requiring freight-forwarder follow-up and carrier SLA review</div>
                  </div>
                  <span className="badge warning">Requires Attention</span>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Order Date</th>
                        <th>Buyer ID</th>
                        <th>Seller ID</th>
                        <th>Category</th>
                        <th>Order Value</th>
                        <th>Transit Days</th>
                        <th>Payment Terms</th>
                        <th>Return Qty</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.filter(o => o.on_time_delivery === 0).slice(0, 12).map(o => (
                        <tr key={o.order_id} className="clickable" onClick={() => setSelectedOrder(o)}>
                          <td className="mono" style={{ fontWeight: 600, color: 'var(--amber)' }}>{o.order_id}</td>
                          <td>{o.order_date}</td>
                          <td className="mono">{o.buyer_id}</td>
                          <td className="mono">{o.seller_id}</td>
                          <td>{o.category}</td>
                          <td style={{ fontWeight: 600 }}>₹{o.total_value_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                          <td style={{ color: o.delivery_days >= 30 ? 'var(--rose)' : 'inherit' }}>{o.delivery_days} days</td>
                          <td><span className="badge neutral">{o.payment_terms}</span></td>
                          <td>{o.return_qty}</td>
                          <td>
                            <button className="action-btn" style={{ padding: '2px 6px', fontSize: '11px' }}>
                              Drill Down
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* =========================================================================
              5. CLIENT ANALYTICS & PROFITABILITY SECTION
              ========================================================================= */}
          {activeSection === 'clients' && (
            <>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-header"><span className="kpi-title">Total Commercial Buyers</span></div>
                  <div className="kpi-value">{stats.uniqueBuyers}</div>
                  <div className="kpi-subtext">Active trading accounts</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-header"><span className="kpi-title">Repeat Buyer Rate</span></div>
                  <div className="kpi-value positive">{stats.repeatBuyerPct.toFixed(2)}%</div>
                  <div className="kpi-subtext positive">{stats.repeatBuyerOrders} repeat orders</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-header"><span className="kpi-title">Retail Consumer Accounts</span></div>
                  <div className="kpi-value">{customerStats.count}</div>
                  <div className="kpi-subtext">₹{(customerStats.totalRev / 1e5).toFixed(2)} L Revenue</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-header"><span className="kpi-title">Customer Churn Rate</span></div>
                  <div className="kpi-value">{customerStats.churnRate.toFixed(1)}%</div>
                  <div className="kpi-subtext">{customerStats.churnedCount} churned accounts</div>
                </div>
              </div>

              {/* Profitability Limitation Audit */}
              <div className="alert-banner warning">
                <AlertTriangle size={18} color="var(--amber)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '13px', marginBottom: '3px' }}>
                    Client Profitability Audit & Dataset Boundary Limitation
                  </strong>
                  In accordance with strict financial analytics standards, <strong>true B2B order gross and net margins cannot be calculated from the available datasets</strong>.
                  B2B export orders contain selling prices (<code>unit_price_inr</code>, <code>total_value_inr</code>) but lack landed manufacturing COGS, ocean freight, export duties, and product SKU foreign keys.
                  <br />
                  The <strong>58.62% gross margin</strong> available in <code>da_product_catalogue.csv</code> represents reference retail catalogue markup between MRP and wholesale COGS.
                  Confusing retail catalogue markup with actual B2B order profitability would fabricate misleading margins.
                </div>
              </div>

              {/* RFM-V Buyer Clusters (Week 6 K-Means Model) */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Week 6 Unsupervised Commercial Buyer Segmentation (k=4 RFM-V)</div>
                    <div className="panel-subtitle">187 Commercial buyers clustered across Recency, Frequency, Monetary Spend, and Fulfillment Exposure</div>
                  </div>
                  <span className="badge success">K-Means Cluster Model</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                  <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--emerald)', fontSize: '13px' }}>Core Stable Accounts</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0' }}>75 Buyers (40.1%)</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>High fulfillment compliance, steady reorders, low return rate.</div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--cyan)', fontSize: '13px' }}>Active Growth Buyers</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0' }}>68 Buyers (36.4%)</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>High turnover velocity, large volumes, transit sensitive.</div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--amber)', fontSize: '13px' }}>Operationally Vulnerable</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0' }}>27 Buyers (14.4%)</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>High delivery delay exposure, higher return friction.</div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--rose)', fontSize: '13px' }}>Lapsed Accounts</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0' }}>17 Buyers (9.1%)</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>Dormant accounts, long recency gap, re-engagement targets.</div>
                  </div>
                </div>

                {/* Searchable Buyer Table */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Commercial Buyer Directory</span>
                  <input
                    type="text"
                    className="filter-select"
                    placeholder="Search Buyer ID, Category, Cluster..."
                    value={buyerSearch}
                    onChange={(e) => setBuyerSearch(e.target.value)}
                    style={{ width: '240px' }}
                  />
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Buyer ID</th>
                        <th>Total Spend (INR)</th>
                        <th>Orders</th>
                        <th>Units</th>
                        <th>AOV</th>
                        <th>On-Time Rate</th>
                        <th>Primary Category</th>
                        <th>Primary Terms</th>
                        <th>RFM-V Cluster</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBuyers.slice(0, 12).map(b => (
                        <tr key={b.buyer_id}>
                          <td className="mono" style={{ fontWeight: 600, color: 'var(--teal)' }}>{b.buyer_id}</td>
                          <td style={{ fontWeight: 600 }}>₹{b.total_spend_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                          <td>{b.orders_count}</td>
                          <td>{b.total_ordered_units.toLocaleString()}</td>
                          <td>₹{(b.aov_inr / 1e5).toFixed(2)} L</td>
                          <td>
                            <span className={`badge ${b.on_time_rate >= 80 ? 'success' : 'warning'}`}>
                              {b.on_time_rate.toFixed(1)}%
                            </span>
                          </td>
                          <td>{b.primary_category}</td>
                          <td><span className="badge neutral">{b.primary_terms}</span></td>
                          <td>
                            <span className="badge info">
                              {b.segment_label || 'Segmented'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* =========================================================================
              6. CURRENCY IMPACT SECTION
              ========================================================================= */}
          {activeSection === 'currency' && (
            <>
              {/* Executive Notice on Currency Availability */}
              <div className="alert-banner info">
                <DollarSign size={20} color="var(--teal)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '13.5px', marginBottom: '4px' }}>
                    Currency Impact Audit & Foreign Exchange Governance
                  </strong>
                  All 600 orders in <code>da_b2b_orders.csv</code> are denominated strictly in <strong>Indian Rupee (INR)</strong> (<code>unit_price_inr</code>, <code>total_value_inr</code>).
                  <br />
                  The dataset contains <strong>zero foreign currency codes, foreign exchange rates, spot booking dates, or realized settlement values</strong>.
                  <br />
                  In accordance with senior data analyst standards, no synthetic exchange rates have been fabricated.
                  Below is an interactive <strong>What-If FX Exposure Sensitivity Simulator</strong> allowing leadership to evaluate potential currency appreciation or depreciation scenarios across the ₹396.88 Cr portfolio.
                </div>
              </div>

              {/* What-If Sensitivity Simulator */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">What-If Foreign Exchange Sensitivity Modeling (INR Exposure)</div>
                    <div className="panel-subtitle">Interactive stress-test simulating exchange-rate impact on ₹396.88 Crore export portfolio</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sliders size={15} color="var(--teal)" />
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>FX Shock:</span>
                    {[-10, -5, -2, 0, 2, 5, 10].map(pct => (
                      <button
                        key={pct}
                        className={`preset-btn ${fxShockPct === pct ? 'active' : ''}`}
                        onClick={() => setFxShockPct(pct)}
                      >
                        {pct > 0 ? `+${pct}%` : `${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="kpi-grid" style={{ marginBottom: '16px' }}>
                  <div className="kpi-card">
                    <div className="kpi-header"><span className="kpi-title">Baseline Portfolio</span></div>
                    <div className="kpi-value">₹{(stats.totalRevenue / 1e7).toFixed(2)} Cr</div>
                    <div className="kpi-subtext">Booked in INR</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-header"><span className="kpi-title">Simulated Realization</span></div>
                    <div className="kpi-value" style={{ color: fxShockPct >= 0 ? 'var(--emerald)' : 'var(--rose)' }}>
                      ₹{((stats.totalRevenue * (1 + fxShockPct / 100)) / 1e7).toFixed(2)} Cr
                    </div>
                    <div className="kpi-subtext">At {fxShockPct > 0 ? `+${fxShockPct}%` : `${fxShockPct}%`} fluctuation</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-header"><span className="kpi-title">Theoretical Variance</span></div>
                    <div className="kpi-value" style={{ color: fxShockPct >= 0 ? 'var(--emerald)' : 'var(--rose)' }}>
                      {fxShockPct >= 0 ? '+' : ''}₹{((stats.totalRevenue * (fxShockPct / 100)) / 1e7).toFixed(2)} Cr
                    </div>
                    <div className="kpi-subtext">Unhedged currency variance</div>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  <strong>Scenario Insight:</strong> If TradeSight's institutional contracts were billed in foreign currencies (e.g. USD) and hedged via forward contracts, a 5% USD appreciation against INR would yield a favorable <strong>+₹19.84 Cr</strong> realization gain, whereas an unhedged 5% INR appreciation would result in a corresponding top-line compression.
                </div>
              </div>

              {/* FX Architecture Blueprint */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Required Multi-Currency Schema Integration Specification</div>
                    <div className="panel-subtitle">Enterprise ERP fields required to compute realized FX gain/loss dynamically</div>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Required Attribute</th>
                        <th>Target Data Type</th>
                        <th>Business Purpose</th>
                        <th>Current Raw Data State</th>
                        <th>Implementation Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="mono">booking_currency</td>
                        <td>VARCHAR(3)</td>
                        <td>Transaction ISO currency code (USD, EUR, GBP, AED)</td>
                        <td><span className="badge warning">Missing (Implicit INR)</span></td>
                        <td>Add multi-currency field to sales order manifest</td>
                      </tr>
                      <tr>
                        <td className="mono">spot_booking_rate</td>
                        <td>NUMERIC(10, 4)</td>
                        <td>RBI / Central bank spot rate on contract booking date</td>
                        <td><span className="badge warning">Missing</span></td>
                        <td>Integrate automated FX feed from treasury system</td>
                      </tr>
                      <tr>
                        <td className="mono">realized_settlement_rate</td>
                        <td>NUMERIC(10, 4)</td>
                        <td>Actual exchange rate realized upon banking clearance</td>
                        <td><span className="badge warning">Missing</span></td>
                        <td>Capture banking settlement exchange rate on receipt</td>
                      </tr>
                      <tr>
                        <td className="mono">hedging_status</td>
                        <td>VARCHAR(20)</td>
                        <td>Forward contract or plain vanilla hedge flag</td>
                        <td><span className="badge warning">Missing</span></td>
                        <td>Track treasury hedging allocations per export order</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* =========================================================================
              7. COMPLIANCE & EXCEPTIONS MANAGEMENT SECTION
              ========================================================================= */}
          {activeSection === 'compliance' && (
            <>
              {/* Exceptions Summary Cards */}
              <div className="kpi-grid">
                <div className="kpi-card" style={{ borderLeft: '4px solid var(--rose)' }}>
                  <div className="kpi-header"><span className="kpi-title">Critical Exceptions</span></div>
                  <div className="kpi-value" style={{ color: 'var(--rose)' }}>2</div>
                  <div className="kpi-subtext danger">Return overruns &gt; shipped units</div>
                </div>
                <div className="kpi-card" style={{ borderLeft: '4px solid var(--amber)' }}>
                  <div className="kpi-header"><span className="kpi-title">High Priority Exceptions</span></div>
                  <div className="kpi-value" style={{ color: 'var(--amber)' }}>42</div>
                  <div className="kpi-subtext warning">CRM date inversions (First &gt; Last)</div>
                </div>
                <div className="kpi-card" style={{ borderLeft: '4px solid var(--blue)' }}>
                  <div className="kpi-header"><span className="kpi-title">Credit & Transit Delays</span></div>
                  <div className="kpi-value">{exceptionsData.filter(e => e.severity === 'MEDIUM').length}</div>
                  <div className="kpi-subtext">Delays on 60 Days Net terms</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-header"><span className="kpi-title">Total Monitored Exceptions</span></div>
                  <div className="kpi-value">{exceptionsData.length}</div>
                  <div className="kpi-subtext">Rule-based anomaly detections</div>
                </div>
              </div>

              {/* Exception Management Table with Interactive Status */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Operational Exception Remediation Console</div>
                    <div className="panel-subtitle">Review, update resolution status, and download operational exception logs</div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      className="filter-select"
                      value={exceptionSeverityFilter}
                      onChange={(e) => setExceptionSeverityFilter(e.target.value)}
                    >
                      <option value="ALL">All Severities</option>
                      <option value="CRITICAL">Critical (2)</option>
                      <option value="HIGH">High (42)</option>
                      <option value="MEDIUM">Medium (37)</option>
                      <option value="LOW">Low (54)</option>
                    </select>

                    <input
                      type="text"
                      className="filter-select"
                      placeholder="Search Record ID, Entity, Action..."
                      value={exceptionSearch}
                      onChange={(e) => setExceptionSearch(e.target.value)}
                      style={{ width: '220px' }}
                    />

                    <button className="action-btn" onClick={handleExportExceptionsCSV}>
                      <Download size={13} /> Export Exceptions
                    </button>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Exception ID</th>
                        <th>Severity</th>
                        <th>Category</th>
                        <th>Source Dataset</th>
                        <th>Record ID</th>
                        <th>Observed Anomaly</th>
                        <th>Recommended Action</th>
                        <th>Review Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExceptions.slice(0, 15).map(e => (
                        <tr key={e.exception_id}>
                          <td className="mono" style={{ fontSize: '11px', fontWeight: 600 }}>{e.exception_id}</td>
                          <td>
                            <span className={`badge ${
                              e.severity === 'CRITICAL' ? 'danger' :
                              e.severity === 'HIGH' ? 'warning' :
                              e.severity === 'MEDIUM' ? 'info' : 'neutral'
                            }`}>
                              {e.severity}
                            </span>
                          </td>
                          <td style={{ fontSize: '11.5px' }}>{e.exception_category}</td>
                          <td className="mono" style={{ fontSize: '11px' }}>{e.source_dataset}</td>
                          <td className="mono" style={{ fontWeight: 600 }}>{e.record_id}</td>
                          <td style={{ fontSize: '11.5px' }}>{e.observed_value}</td>
                          <td style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{e.recommended_action}</td>
                          <td>
                            <select
                              className="filter-select"
                              value={e.review_status}
                              onChange={(ev) => updateExceptionStatus(e.exception_id, ev.target.value)}
                              style={{ padding: '3px 6px', fontSize: '11px', fontWeight: 600 }}
                            >
                              <option value="Open">Open</option>
                              <option value="Under Investigation">Under Investigation</option>
                              <option value="Action Pending">Action Pending</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Acknowledged">Acknowledged</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '10px', fontSize: '11.5px', color: 'var(--text-dim)', textAlign: 'right' }}>
                  Showing 15 of {filteredExceptions.length} exceptions matching active filter. Status updates persist in local memory.
                </div>
              </div>
            </>
          )}

          {/* =========================================================================
              8. PRODUCT & INVENTORY ANALYTICS SECTION
              ========================================================================= */}
          {activeSection === 'products' && (
            <>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-header"><span className="kpi-title">Master Catalogue SKUs</span></div>
                  <div className="kpi-value">{productStats.totalProducts} SKUs</div>
                  <div className="kpi-subtext">5 Consumer categories</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-header"><span className="kpi-title">Total Warehouse Stock</span></div>
                  <div className="kpi-value">{productStats.totalStock.toLocaleString()}</div>
                  <div className="kpi-subtext">Physical units in inventory</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-header"><span className="kpi-title">Average Catalogue Margin</span></div>
                  <div className="kpi-value positive">{productStats.avgMarginPct.toFixed(2)}%</div>
                  <div className="kpi-subtext">Formula: (MRP - COGS) / MRP</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-header"><span className="kpi-title">Average Catalogue Markup</span></div>
                  <div className="kpi-value">{productStats.avgMarkupPct.toFixed(1)}%</div>
                  <div className="kpi-subtext">Formula: (MRP - COGS) / COGS</div>
                </div>
              </div>

              {/* Catalogue Margin & Pricing Chart */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Product Pricing Analysis: Retail MRP vs. Wholesale COGS</div>
                    <div className="panel-subtitle">Unit margin comparison across top inventory SKUs</div>
                  </div>
                  <input
                    type="text"
                    className="filter-select"
                    placeholder="Search SKU Name, ID, Category..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    style={{ width: '240px' }}
                  />
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product ID</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Retail MRP</th>
                        <th>Wholesale COGS</th>
                        <th>Unit Gross Margin</th>
                        <th>Unit Markup</th>
                        <th>Stock Units</th>
                        <th>Stock Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.slice(0, 15).map(p => {
                        const margin = p.MRP > 0 ? ((p.MRP - p.COGS) / p.MRP) * 100 : 0;
                        const markup = p.COGS > 0 ? ((p.MRP - p.COGS) / p.COGS) * 100 : 0;
                        return (
                          <tr key={p.Product_ID}>
                            <td className="mono" style={{ fontWeight: 600, color: 'var(--teal)' }}>{p.Product_ID}</td>
                            <td style={{ fontWeight: 500 }}>{p.Name}</td>
                            <td>{p.Category}</td>
                            <td>₹{p.MRP.toFixed(2)}</td>
                            <td>₹{p.COGS.toFixed(2)}</td>
                            <td style={{ fontWeight: 600, color: 'var(--emerald)' }}>{margin.toFixed(2)}%</td>
                            <td>{markup.toFixed(1)}%</td>
                            <td>{p.Stock_Units.toLocaleString()}</td>
                            <td>
                              {p.Stock_Units < 150 ? (
                                <span className="badge warning">Low Stock</span>
                              ) : (
                                <span className="badge success">Adequate</span>
                              )}
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

          {/* =========================================================================
              9. REPORTS HUB & WEEKLY AUTOMATION SECTION
              ========================================================================= */}
          {activeSection === 'reports' && (
            <>
              {/* Reports Download Hub */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Management Export Intelligence Reports Hub</div>
                    <div className="panel-subtitle">Download standardized C-suite reports in CSV or print/PDF format</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <FileText size={18} color="var(--teal)" />
                      <strong style={{ fontSize: '13.5px' }}>1. Executive Business Summary</strong>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
                      Comprehensive C-suite overview covering ₹396.88 Cr revenue, 77.50% SLA compliance, return audits, and buyer concentrations.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="action-btn" onClick={() => window.print()}><Printer size={13} /> Print / PDF</button>
                      <button className="action-btn primary" onClick={handleExportCSV}><Download size={13} /> CSV Extract</button>
                    </div>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Layers size={18} color="var(--cyan)" />
                      <strong style={{ fontSize: '13.5px' }}>2. Revenue Performance Report</strong>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
                      Longitudinal monthly turnover, category contribution, payment terms breakdown, and top 10 buyer concentrations.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="action-btn" onClick={() => window.print()}><Printer size={13} /> Print / PDF</button>
                      <button className="action-btn primary" onClick={handleExportCSV}><Download size={13} /> CSV Extract</button>
                    </div>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Truck size={18} color="var(--amber)" />
                      <strong style={{ fontSize: '13.5px' }}>3. Shipment Performance Report</strong>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
                      Complete transit distributions, delivery delay logs (135 orders), and freight-forwarder SLA compliance benchmarks.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="action-btn" onClick={() => window.print()}><Printer size={13} /> Print / PDF</button>
                      <button className="action-btn primary" onClick={handleExportCSV}><Download size={13} /> CSV Extract</button>
                    </div>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <AlertOctagon size={18} color="var(--rose)" />
                      <strong style={{ fontSize: '13.5px' }}>4. Compliance & Exceptions Report</strong>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
                      Operational anomaly register including physical return overruns and customer profile chronological date inversions.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="action-btn" onClick={() => window.print()}><Printer size={13} /> Print / PDF</button>
                      <button className="action-btn primary" onClick={handleExportExceptionsCSV}><Download size={13} /> CSV Extract</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Automation Section */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Weekly Automated Exception Report Dispatch (GitHub Actions & Task Scheduler)</div>
                    <div className="panel-subtitle">Automated weekly cron schedule configured in <code>.github/workflows/weekly_report.yml</code></div>
                  </div>
                  <span className="badge success">Active Scheduler Configured</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  <div>
                    <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>GitHub Actions Cron Automation:</strong>
                    Workflow file <code>.github/workflows/weekly_report.yml</code> is configured to run automatically every <strong>Monday at 08:00 UTC</strong>.
                    It executes <code>pytest</code>, runs the automated anomaly generator, and uploads dated CSV/Markdown reports to GitHub workflow artifacts.
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>Safe SMTP Email Configuration:</strong>
                    Configured with test mode safety guardrails. To enable production email dispatch, populate repository secrets with:
                    <code>SMTP_SERVER</code>, <code>SMTP_PORT</code>, <code>SMTP_USER</code>, <code>SMTP_PASSWORD</code>, and <code>ALERT_RECIPIENTS</code>.
                    Emails will NOT be sent unless valid authorized credentials exist.
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =========================================================================
              10. DATA GOVERNANCE & ARCHITECTURE SECTION
              ========================================================================= */}
          {activeSection === 'governance' && (
            <>
              {/* Raw Datasets Inventory */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Original Source Datasets Inventory & Integrity Audit</div>
                    <div className="panel-subtitle">Summary of raw immutable data files in <code>data/</code> directory</div>
                  </div>
                  <span className="badge success">Zero Synthetic Records</span>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Source Dataset</th>
                        <th>Dimensions</th>
                        <th>Primary Key</th>
                        <th>Domain Scope</th>
                        <th>Integrity & Anomaly Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="mono" style={{ fontWeight: 600 }}>da_b2b_orders.csv</td>
                        <td>600 rows × 13 cols</td>
                        <td className="mono">order_id</td>
                        <td>Wholesale B2B export shipments (2023–2024)</td>
                        <td>
                          Zero null values, zero duplicate PKs. Exactly 2 physical return overruns quarantined (<code>B2B-00131</code> and <code>B2B-00188</code>).
                        </td>
                      </tr>
                      <tr>
                        <td className="mono" style={{ fontWeight: 600 }}>da_product_catalogue.csv</td>
                        <td>50 rows × 7 cols</td>
                        <td className="mono">Product_ID</td>
                        <td>Master reference retail product catalogue</td>
                        <td>
                          Zero nulls. Average gross markup is 58.62%. Completely disjunct entity from wholesale orders (no SKU linkage in orders).
                        </td>
                      </tr>
                      <tr>
                        <td className="mono" style={{ fontWeight: 600 }}>da_customer_profiles.csv</td>
                        <td>200 rows × 10 cols</td>
                        <td className="mono">Customer_ID</td>
                        <td>Direct consumer retail CRM profiles</td>
                        <td>
                          42 accounts exhibit chronological date inversions (First Purchase Date &gt; Last Purchase Date). Tenure set to NaN.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Unsupported Metrics Quarantine */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Unsupported Metrics Quarantine (Labeled "NOT AVAILABLE")</div>
                    <div className="panel-subtitle">Transparent governance documentation explaining why specific metrics cannot be calculated</div>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Requested Business Metric</th>
                        <th>Display Status</th>
                        <th>Underlying Schema Limitation</th>
                        <th>Enterprise Remediation Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Foreign Exchange (FX) Impact</td>
                        <td><span className="badge warning">NOT AVAILABLE</span></td>
                        <td>All orders recorded solely in INR; zero foreign currency codes or exchange rates exist in raw data.</td>
                        <td>Extend ERP schema with <code>currency_code</code>, <code>spot_rate</code>, and <code>hedging_flag</code>.</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>B2B Order-Level Net Margin</td>
                        <td><span className="badge warning">NOT AVAILABLE</span></td>
                        <td>Orders contain revenue but lack landed unit production costs, freight, insurance, and SKU foreign keys.</td>
                        <td>Implement relational <code>order_line_items</code> linking orders to catalogue SKUs with landed COGS.</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Customs Compliance Tracking</td>
                        <td><span className="badge warning">NOT AVAILABLE</span></td>
                        <td>Zero regulatory attributes (Shipping Bill numbers, Port of Loading, export duty clearance) in raw CSVs.</td>
                        <td>Deploy customs documentation module tracking Port of Loading clearance milestones and ICEGATE references.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      {/* =========================================================================
          ORDER DRILL-DOWN MODAL
          ========================================================================= */}
      {selectedOrder && (
        <div className="modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>Order Details: {selectedOrder.order_id}</h2>
                  <span className={`badge ${selectedOrder.on_time_delivery === 1 ? 'success' : 'warning'}`}>
                    {selectedOrder.on_time_delivery === 1 ? 'Delivered On-Time' : 'Delayed Shipment'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Booked on {selectedOrder.order_date} • Category: {selectedOrder.category}
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedOrder(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Buyer Identifier</span>
                <span className="detail-value mono">{selectedOrder.buyer_id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Seller / Supplier</span>
                <span className="detail-value mono">{selectedOrder.seller_id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Shipped Volume</span>
                <span className="detail-value">{selectedOrder.quantity_units.toLocaleString()} Units</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Unit Selling Price</span>
                <span className="detail-value">₹{selectedOrder.unit_price_inr.toFixed(2)} INR</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Total Invoice Value</span>
                <span className="detail-value" style={{ color: 'var(--teal)' }}>
                  ₹{selectedOrder.total_value_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })} INR
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Payment Terms</span>
                <span className="detail-value">{selectedOrder.payment_terms}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Transit Duration</span>
                <span className="detail-value">{selectedOrder.delivery_days} Days</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Cargo Returns</span>
                <span className="detail-value" style={{ color: selectedOrder.return_qty > selectedOrder.quantity_units ? 'var(--rose)' : 'inherit' }}>
                  {selectedOrder.return_qty} Units
                  {selectedOrder.return_qty > selectedOrder.quantity_units && ' (OVERRUN ANOMALY)'}
                </span>
              </div>
            </div>

            {selectedOrder.return_qty > selectedOrder.quantity_units && (
              <div className="alert-banner danger" style={{ marginTop: '16px' }}>
                <AlertCircle size={16} color="var(--rose)" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Physical Impossibility Detected:</strong> Returned units ({selectedOrder.return_qty}) exceed shipped quantity ({selectedOrder.quantity_units}). Recommended action: Audit physical warehouse receiving records.
                </div>
              </div>
            )}

            {selectedOrder.on_time_delivery === 0 && (
              <div className="alert-banner warning" style={{ marginTop: '14px' }}>
                <Clock size={16} color="var(--amber)" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Fulfillment SLA Breach:</strong> Shipment exceeded target delivery window. Required action: Review carrier route logs and issue SLA delay notice to freight forwarder.
                </div>
              </div>
            )}

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="action-btn" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
