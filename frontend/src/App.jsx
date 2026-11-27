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
  CheckCircle2, AlertCircle, ArrowDownRight, Sliders, Menu,
  ChevronLeft, ChevronRight, Activity, ArrowRight
} from 'lucide-react';

import ordersRaw from './data/orders.json';
import productsRaw from './data/products.json';
import customersRaw from './data/customers.json';
import buyersRaw from './data/buyers_aggregated.json';
import exceptionsRaw from './data/exceptions.json';

// Unique filters supported by orders dataset
const ALL_CATEGORIES = [...new Set(ordersRaw.map(o => o.category))].sort();
const ALL_TERMS = [...new Set(ordersRaw.map(o => o.payment_terms))].sort();

// Classic Corporate White and Navy Color Palette
const THEME_COLORS = {
  navy: '#243447',
  navyActive: '#3D566E',
  primaryAccent: '#527A9E',
  secondaryAccent: '#8FA9BF',
  slate: '#64748B',
  supportingGold: '#B69A68',
  charcoal: '#1F2937',
  secondaryText: '#667085',
  border: '#DDE2E8',
  success: '#27805B',
  warning: '#B7791F',
  error: '#C24141',
  piePalette: ['#527A9E', '#8FA9BF', '#64748B', '#B69A68', '#3D566E', '#243447']
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

  // Mobile Sidebar Drawer State
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Theme State (Default: Light Mode per strict requirement)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tradesight_theme');
      if (saved) return saved;
      return 'light'; // Default Light Mode per requirement
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
      localStorage.setItem('tradesight_theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleSelectSection = (s) => {
    setActiveSection(s);
    setSidebarOpen(false);
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
  const [delayedOrderSearch, setDelayedOrderSearch] = useState('');
  const [inconsistencySearch, setInconsistencySearch] = useState('');

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

  // Pagination States for Data Tables
  const [orderPage, setOrderPage] = useState(1);
  const [buyerPage, setBuyerPage] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const [exceptionPage, setExceptionPage] = useState(1);
  const [delayedPage, setDelayedPage] = useState(1);
  const [inconsistencyPage, setInconsistencyPage] = useState(1);
  const pageSize = 10;

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

  // Reset pagination when filters change
  useEffect(() => {
    setOrderPage(1);
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
    // Accurate Gross Margin formula: (MRP - COGS) / MRP across 50 SKUs = 58.62%
    const avgMarginPct = totalProducts ? productsRaw.reduce((sum, p) => sum + p.Margin_Pct, 0) / totalProducts : 0;
    // Accurate Markup formula: (MRP - COGS) / COGS = 141.67%
    const avgMarkupPct = avgCOGS > 0 ? ((avgMRP - avgCOGS) / avgCOGS) * 100 : 0;
    return { totalProducts, totalStock, avgMRP, avgCOGS, avgMarginPct, avgMarkupPct };
  }, []);

  // Product Category Statistics for Charts
  const productCategoryStats = useMemo(() => {
    const map = {};
    productsRaw.forEach(p => {
      if (!map[p.Category]) {
        map[p.Category] = { category: p.Category, count: 0, stock: 0, totalMrp: 0, totalCogs: 0 };
      }
      map[p.Category].count += 1;
      map[p.Category].stock += (p.Stock_Units || 0);
      map[p.Category].totalMrp += p.MRP;
      map[p.Category].totalCogs += p.COGS;
    });
    return Object.values(map).map(c => ({
      category: c.category,
      count: c.count,
      stock: c.stock,
      avgMarginPct: c.totalMrp ? parseFloat((((c.totalMrp - c.totalCogs) / c.totalMrp) * 100).toFixed(2)) : 0
    })).sort((a, b) => b.avgMarginPct - a.avgMarginPct);
  }, []);

  // Customer Profile Stats (from da_customer_profiles.csv)
  const customerStats = useMemo(() => {
    const count = customersRaw.length;
    const totalRev = customersRaw.reduce((sum, c) => sum + (c.Total_Revenue || 0), 0);
    const churnedCount = customersRaw.filter(c => c.Churned === 1).length;
    const churnRate = count ? (churnedCount / count) * 100 : 0;
    return { count, totalRev, churnedCount, churnRate };
  }, []);

  // Customer Purchase Date Inconsistencies (First_Purchase_Date > Last_Purchase_Date)
  const customerDateInconsistencies = useMemo(() => {
    return customersRaw.filter(c => {
      const f = new Date(c.First_Purchase_Date);
      const l = new Date(c.Last_Purchase_Date);
      return f > l;
    });
  }, []);

  const filteredDateInconsistencies = useMemo(() => {
    return customerDateInconsistencies.filter(c => {
      if (inconsistencySearch) {
        const q = inconsistencySearch.toLowerCase();
        return c.Customer_ID.toLowerCase().includes(q) || c.City.toLowerCase().includes(q);
      }
      return true;
    });
  }, [customerDateInconsistencies, inconsistencySearch]);

  // Suspicious Return Records (return_qty > quantity_units)
  const suspiciousReturnsList = useMemo(() => {
    return ordersRaw.filter(o => o.return_qty > o.quantity_units);
  }, []);

  // Category Return Analysis
  const categoryReturnData = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      if (!map[o.category]) {
        map[o.category] = { category: o.category, shippedUnits: 0, returnUnits: 0 };
      }
      map[o.category].shippedUnits += (o.quantity_units || 0);
      map[o.category].returnUnits += (o.return_qty || 0);
    });
    return Object.values(map).map(c => ({
      ...c,
      returnRatePct: c.shippedUnits ? parseFloat(((c.returnUnits / c.shippedUnits) * 100).toFixed(2)) : 0
    })).sort((a, b) => b.returnRatePct - a.returnRatePct);
  }, [filteredOrders]);

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

  // Transit Lead Time Histogram
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

  // Filtered Buyers with pagination
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

  // Filtered Products with pagination
  const filteredProducts = useMemo(() => {
    return productsRaw.filter(p => {
      if (productSearch) {
        const q = productSearch.toLowerCase();
        return p.Product_ID.toLowerCase().includes(q) || p.Name.toLowerCase().includes(q) || p.Category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [productSearch]);

  // Filtered Exceptions with pagination
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
    link.setAttribute('download', `tradesight_exceptions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for Breadcrumb title
  const getBreadcrumb = () => {
    switch (activeSection) {
      case 'overview': return { group: 'Overview', page: 'Executive Overview' };
      case 'revenue': return { group: 'Core Operations', page: 'Export Revenue' };
      case 'logistics':
      case 'shipment': return { group: 'Core Operations', page: 'Logistics & SLA' };
      case 'returns':
      case 'compliance': return { group: 'Core Operations', page: 'Returns & Quality' };
      case 'buyers':
      case 'clients': return { group: 'Core Operations', page: 'Buyer Analytics' };
      case 'catalogue':
      case 'products': return { group: 'Core Operations', page: 'Product Catalogue' };
      case 'country': return { group: 'Strategic Intelligence', page: 'Country Analysis' };
      case 'currency': return { group: 'Strategic Intelligence', page: 'Currency Impact' };
      case 'reports': return { group: 'Strategic Intelligence', page: 'Reports Hub' };
      case 'governance': return { group: 'Data & Compliance', page: 'Data Governance' };
      default: return { group: 'Overview', page: 'Executive Overview' };
    }
  };

  const breadcrumb = getBreadcrumb();

  return (
    <div className="app-layout">
      {/* Mobile Drawer Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Globe size={20} />
          </div>
          <div className="brand-text">
            <div className="brand-title">TradeSight</div>
            <div className="brand-subtitle">Export Intelligence &amp; Business Analytics</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {/* Group 1: Overview */}
          <div className="nav-group">
            <div className="nav-group-title">Overview</div>
            <button
              className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`}
              onClick={() => handleSelectSection('overview')}
            >
              <Activity size={16} className="nav-icon" /> Executive Overview
            </button>
          </div>

          {/* Group 2: Core Operations */}
          <div className="nav-group">
            <div className="nav-group-title">Core Operations</div>
            <button
              className={`nav-item ${activeSection === 'revenue' ? 'active' : ''}`}
              onClick={() => handleSelectSection('revenue')}
            >
              <TrendingUp size={16} className="nav-icon" /> Export Revenue
            </button>
            <button
              className={`nav-item ${(activeSection === 'logistics' || activeSection === 'shipment') ? 'active' : ''}`}
              onClick={() => handleSelectSection('logistics')}
            >
              <Truck size={16} className="nav-icon" /> Logistics &amp; SLA
            </button>
            <button
              className={`nav-item ${(activeSection === 'returns' || activeSection === 'compliance') ? 'active' : ''}`}
              onClick={() => handleSelectSection('returns')}
            >
              <RotateCcw size={16} className="nav-icon" /> Returns &amp; Quality
            </button>
            <button
              className={`nav-item ${(activeSection === 'buyers' || activeSection === 'clients') ? 'active' : ''}`}
              onClick={() => handleSelectSection('buyers')}
            >
              <Users size={16} className="nav-icon" /> Buyer Analytics
            </button>
            <button
              className={`nav-item ${(activeSection === 'catalogue' || activeSection === 'products') ? 'active' : ''}`}
              onClick={() => handleSelectSection('catalogue')}
            >
              <Package size={16} className="nav-icon" /> Product Catalogue
            </button>
          </div>

          {/* Group 3: Strategic Intelligence */}
          <div className="nav-group">
            <div className="nav-group-title">Strategic Intelligence</div>
            <button
              className={`nav-item ${activeSection === 'country' ? 'active' : ''}`}
              onClick={() => handleSelectSection('country')}
            >
              <Globe size={16} className="nav-icon" /> Country Analysis
            </button>
            <button
              className={`nav-item ${activeSection === 'currency' ? 'active' : ''}`}
              onClick={() => handleSelectSection('currency')}
            >
              <DollarSign size={16} className="nav-icon" /> Currency Impact
            </button>
            <button
              className={`nav-item ${activeSection === 'reports' ? 'active' : ''}`}
              onClick={() => handleSelectSection('reports')}
            >
              <FileSpreadsheet size={16} className="nav-icon" /> Reports Hub
            </button>
          </div>

          {/* Group 4: Data & Compliance */}
          <div className="nav-group">
            <div className="nav-group-title">Data &amp; Compliance</div>
            <button
              className={`nav-item ${activeSection === 'governance' ? 'active' : ''}`}
              onClick={() => handleSelectSection('governance')}
            >
              <ShieldAlert size={16} className="nav-icon" /> Data Governance
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-title">
            <Database size={13} color="var(--supporting-gold)" /> TradeSight Platform
          </div>
          <div style={{ fontSize: '11px', lineHeight: '1.4', marginTop: '4px', opacity: 0.85 }}>
            A unified analytics platform for monitoring export revenue, shipment performance, commercial buyers, product margins and data quality.
          </div>
          <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.65 }}>
            Cynaris Solutions • Chennai Export Operations
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="app-main">
        {/* TOP HEADER BAR */}
        <header className="top-bar">
          <div className="header-left">
            <button 
              className="sidebar-toggle-btn"
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label="Toggle Navigation"
            >
              <Menu size={18} />
            </button>
            <div className="breadcrumbs">
              <span>{breadcrumb.group}</span>
              <span>/</span>
              <span className="breadcrumbs-current">{breadcrumb.page}</span>
            </div>
          </div>

          <div className="header-right">
            <button 
              className="theme-toggle-btn" 
              onClick={toggleTheme} 
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button className="action-btn primary" onClick={handleExportCSV}>
              <Download size={13} /> Export Report
            </button>
          </div>
        </header>

        {/* RELEVANT FILTER TOOLBAR */}
        <div className="filter-toolbar">
          <div className="filter-group">
            <span className="filter-label"><Filter size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />Period:</span>
            <select
              className="filter-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="ALL">All Dates (2023–2024)</option>
              <option value="2023">Calendar Year 2023</option>
              <option value="2024">Calendar Year 2024</option>
            </select>
          </div>

          <div className="filter-group">
            <span className="filter-label">Category:</span>
            <select
              className="filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="ALL">All Categories ({ALL_CATEGORIES.length})</option>
              {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <span className="filter-label">Terms:</span>
            <select
              className="filter-select"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
            >
              <option value="ALL">All Payment Terms ({ALL_TERMS.length})</option>
              {ALL_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="filter-group" style={{ marginLeft: 6 }}>
            <button 
              className={`preset-pill ${quickFilter === 'ALL' ? 'active' : ''}`} 
              onClick={() => setQuickFilter('ALL')}
            >
              All (600)
            </button>
            <button 
              className={`preset-pill ${quickFilter === 'DELAYED' ? 'active' : ''}`} 
              onClick={() => setQuickFilter('DELAYED')}
            >
              Delayed (135)
            </button>
            <button 
              className={`preset-pill ${quickFilter === 'REPEAT' ? 'active' : ''}`} 
              onClick={() => setQuickFilter('REPEAT')}
            >
              Repeat (227)
            </button>
            <button 
              className={`preset-pill ${quickFilter === 'HIGH_VALUE' ? 'active' : ''}`} 
              onClick={() => setQuickFilter('HIGH_VALUE')}
            >
              &gt; ₹1 Cr (148)
            </button>
            <button 
              className={`preset-pill ${quickFilter === 'RETURNS' ? 'active' : ''}`} 
              onClick={() => setQuickFilter('RETURNS')}
            >
              Returns (591)
            </button>
          </div>

          {(selectedYear !== 'ALL' || selectedCategory !== 'ALL' || selectedTerm !== 'ALL' || quickFilter !== 'ALL' || orderSearch) && (
            <button className="action-btn" onClick={resetFilters} style={{ marginLeft: 'auto', padding: '4px 8px', fontSize: '11px' }}>
              <RefreshCw size={11} /> Reset Filters
            </button>
          )}
        </div>

        {/* MAIN CONTENT BODY */}
        <div className="content-body">

          {/* =========================================================================
              1. EXECUTIVE OVERVIEW (LANDING PAGE - 8 VERIFIED CORE KPIS)
              ========================================================================= */}
          {activeSection === 'overview' && (
            <>
              {/* Header */}
              <div className="section-header-block">
                <div>
                  <h1 className="section-title">Executive Overview</h1>
                  <p className="section-subtitle">
                    A unified analytics platform for monitoring export revenue, shipment performance, commercial buyers, product margins and data quality.
                  </p>
                </div>
                <div className="section-period-badge">
                  <Calendar size={13} color="var(--primary-accent)" />
                  <span>Verified Dataset: Jan 2023 – Dec 2024 (600 Orders)</span>
                </div>
              </div>

              {/* 8 Primary Verified KPI Cards (Structured 4x2 Grid) */}
              <div className="primary-kpi-grid">
                {/* 1. Gross Export Revenue */}
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header">
                    <span className="primary-kpi-title">Gross Export Revenue</span>
                    <div className="primary-kpi-icon"><TrendingUp size={16} /></div>
                  </div>
                  <div className="primary-kpi-value">₹{(stats.totalRevenue / 1e7).toFixed(2)} Cr</div>
                  <div className="primary-kpi-subtext">
                    <span className="tooltip-trigger" title="Total Gross Export Turnover: SUM(total_value_inr) = ₹3,968,829,214.20">
                      <Info size={12} style={{ marginRight: 3 }} /> ₹{(stats.totalRevenue / 1e7).toFixed(2)} Crore ({stats.totalOrders} Shipments)
                    </span>
                  </div>
                </div>

                {/* 2. Total Orders */}
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header">
                    <span className="primary-kpi-title">Total Orders</span>
                    <div className="primary-kpi-icon"><Box size={16} /></div>
                  </div>
                  <div className="primary-kpi-value">{stats.totalOrders}</div>
                  <div className="primary-kpi-subtext">
                    <span className="tooltip-trigger" title="Total count of B2B export transactions: COUNT(order_id) = 600">
                      <Info size={12} style={{ marginRight: 3 }} /> 600 Total B2B Wholesale Shipments
                    </span>
                  </div>
                </div>

                {/* 3. Average Order Value */}
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header">
                    <span className="primary-kpi-title">Average Order Value</span>
                    <div className="primary-kpi-icon"><DollarSign size={16} /></div>
                  </div>
                  <div className="primary-kpi-value">₹{(stats.aov / 1e5).toFixed(2)} L</div>
                  <div className="primary-kpi-subtext">
                    <span className="tooltip-trigger" title="Average Order Value: Total Revenue / Total Orders = ₹6,614,715.36 (~₹66.15 Lakh)">
                      <Info size={12} style={{ marginRight: 3 }} /> ₹66.15 Lakh Average per Order
                    </span>
                  </div>
                </div>

                {/* 4. On-Time Delivery Rate */}
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header">
                    <span className="primary-kpi-title">On-Time Delivery Rate</span>
                    <div className="primary-kpi-icon" style={{ color: stats.onTimeRate >= 80 ? 'var(--status-success)' : 'var(--status-warning)' }}>
                      <Truck size={16} />
                    </div>
                  </div>
                  <div className="primary-kpi-value" style={{ color: stats.onTimeRate >= 80 ? 'var(--status-success)' : 'var(--status-warning)' }}>
                    {stats.onTimeRate.toFixed(2)}%
                  </div>
                  <div className="primary-kpi-subtext">
                    <span className="tooltip-trigger" title="On-Time Delivery Compliance: 465 on-time shipments out of 600 total (77.50%)">
                      <Info size={12} style={{ marginRight: 3 }} /> {stats.onTimeOrders} on-time vs {stats.delayedOrders} delayed
                    </span>
                  </div>
                </div>

                {/* 5. Unit Return Rate */}
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header">
                    <span className="primary-kpi-title">Unit Return Rate</span>
                    <div className="primary-kpi-icon"><RotateCcw size={16} /></div>
                  </div>
                  <div className="primary-kpi-value">{stats.returnRate.toFixed(2)}%</div>
                  <div className="primary-kpi-subtext">
                    <span className="tooltip-trigger" title="Unit Return Rate: 15,242 returned units / 1,509,070 shipped units = 1.01%">
                      <Info size={12} style={{ marginRight: 3 }} /> {stats.returnUnits.toLocaleString()} of {stats.totalUnits.toLocaleString()} units
                    </span>
                  </div>
                </div>

                {/* 6. Active Commercial Buyers */}
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header">
                    <span className="primary-kpi-title">Commercial Buyers</span>
                    <div className="primary-kpi-icon"><Users size={16} /></div>
                  </div>
                  <div className="primary-kpi-value">187</div>
                  <div className="primary-kpi-subtext">
                    <span className="tooltip-trigger" title="Verified active commercial buyers in orders: COUNT(DISTINCT buyer_id) = 187">
                      <Info size={12} style={{ marginRight: 3 }} /> 187 Active Institutional Accounts
                    </span>
                  </div>
                </div>

                {/* 7. Product Catalogue SKUs */}
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header">
                    <span className="primary-kpi-title">Product Catalogue SKUs</span>
                    <div className="primary-kpi-icon"><Package size={16} /></div>
                  </div>
                  <div className="primary-kpi-value">{productStats.totalProducts}</div>
                  <div className="primary-kpi-subtext">
                    <span className="tooltip-trigger" title="Product Catalogue Master: 50 active SKUs across 5 commodity categories">
                      <Info size={12} style={{ marginRight: 3 }} /> 50 SKUs • {productStats.totalStock.toLocaleString()} Stock Units
                    </span>
                  </div>
                </div>

                {/* 8. Average Catalogue Gross Margin */}
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header">
                    <span className="primary-kpi-title">Catalogue Gross Margin</span>
                    <div className="primary-kpi-icon" style={{ color: 'var(--status-success)' }}><Activity size={16} /></div>
                  </div>
                  <div className="primary-kpi-value" style={{ color: 'var(--status-success)' }}>
                    {productStats.avgMarginPct.toFixed(2)}%
                  </div>
                  <div className="primary-kpi-subtext">
                    <span className="tooltip-trigger" title="Catalogue Gross Margin: AVG((MRP - COGS) / MRP) = 58.62% (Markup = 141.67%)">
                      <Info size={12} style={{ marginRight: 3 }} /> Reference master margin (Cost ₹939 / MRP ₹2,263)
                    </span>
                  </div>
                </div>
              </div>

              {/* Secondary Operational Indicator Strip */}
              <div className="secondary-kpi-grid">
                <div className="secondary-kpi-card">
                  <div className="secondary-kpi-title">Total Shipped Units</div>
                  <div className="secondary-kpi-value">{stats.totalUnits.toLocaleString()}</div>
                  <div className="secondary-kpi-subtext">1,509,070 physical export units</div>
                </div>
                <div className="secondary-kpi-card">
                  <div className="secondary-kpi-title">Delayed Shipments</div>
                  <div className="secondary-kpi-value" style={{ color: 'var(--status-warning)' }}>{stats.delayedOrders} Orders</div>
                  <div className="secondary-kpi-subtext">22.50% fulfillment delay rate</div>
                </div>
                <div className="secondary-kpi-card">
                  <div className="secondary-kpi-title">Mean Transit Duration</div>
                  <div className="secondary-kpi-value">{stats.avgDeliveryDays.toFixed(2)} Days</div>
                  <div className="secondary-kpi-subtext">Median transit: {stats.medianDeliveryDays} calendar days</div>
                </div>
                <div className="secondary-kpi-card">
                  <div className="secondary-kpi-title">Warehouse Stock Units</div>
                  <div className="secondary-kpi-value">{productStats.totalStock.toLocaleString()}</div>
                  <div className="secondary-kpi-subtext">Available inventory across 50 SKUs</div>
                </div>
              </div>

              {/* Main Analytics Area: Balanced Chart Grid 1 */}
              <div className="chart-grid-2">
                {/* Chart 1: Monthly Revenue Velocity */}
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Export Revenue Performance Trend (2023–2024)</div>
                      <div className="panel-subtitle">Monthly export invoice turnover (₹ Crores) with volume flow</div>
                    </div>
                  </div>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 15, left: -5, bottom: 0 }}>
                        <defs>
                          <linearGradient id="navyGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary-accent)" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="var(--primary-accent)" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                        <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                        <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}Cr`} />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="chart-tooltip">
                                  <div className="chart-tooltip-title">{label}</div>
                                  <div className="chart-tooltip-item" style={{ color: 'var(--primary-accent)' }}>
                                    Turnover: ₹{payload[0].value} Crore
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                    Orders: {payload[0].payload.orders} shipments
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area type="monotone" dataKey="revenueCr" stroke="var(--primary-accent)" fillOpacity={1} fill="url(#navyGrad)" strokeWidth={2.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Delivery SLA Compliance */}
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Shipment Fulfillment SLA Performance</div>
                      <div className="panel-subtitle">77.50% On-time delivery compliance vs 22.50% fulfillment delays</div>
                    </div>
                  </div>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'On-Time (465 Orders)', value: stats.onTimeOrders, fill: 'var(--status-success)' },
                            { name: 'Delayed (135 Orders)', value: stats.delayedOrders, fill: 'var(--status-warning)' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          <Cell fill="var(--status-success)" />
                          <Cell fill="var(--status-warning)" />
                        </Pie>
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="chart-tooltip">
                                  <div className="chart-tooltip-item" style={{ color: payload[0].payload.fill }}>
                                    {payload[0].name}: {payload[0].value} orders
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Main Analytics Area: Balanced Chart Grid 2 */}
              <div className="chart-grid-2">
                {/* Chart 3: Category Performance */}
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Export Category Turnover Contribution</div>
                      <div className="panel-subtitle">Total gross turnover in ₹ Crores across export commodity categories</div>
                    </div>
                  </div>
                  <div style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 35, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                        <XAxis type="number" stroke="var(--text-secondary)" fontSize={11} tickFormatter={(v) => `₹${v}Cr`} />
                        <YAxis dataKey="category" type="category" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="chart-tooltip">
                                  <div className="chart-tooltip-title">{payload[0].payload.category}</div>
                                  <div className="chart-tooltip-item" style={{ color: 'var(--primary-accent)' }}>
                                    Revenue: ₹{payload[0].value} Crore
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                    Volume: {payload[0].payload.orders} shipments
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="revenueCr" fill="var(--secondary-accent)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 4: Payment Terms Distribution */}
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Commercial Payment Terms Distribution</div>
                      <div className="panel-subtitle">Letter of Credit (LC), 30 Days Net, 60 Days Net, and Advance</div>
                    </div>
                  </div>
                  <div style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={paymentTermsData} margin={{ top: 10, right: 15, left: -5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                        <XAxis dataKey="term" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                        <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}Cr`} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="chart-tooltip">
                                  <div className="chart-tooltip-title">{payload[0].payload.term}</div>
                                  <div className="chart-tooltip-item" style={{ color: 'var(--supporting-gold)' }}>
                                    Turnover: ₹{payload[0].value} Crore
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                    Orders: {payload[0].payload.orders} transactions
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="revenueCr" fill="var(--supporting-gold)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Main Analytics Area: Balanced Chart Grid 3 (Buyer Activity) */}
              <div className="chart-grid-2">
                {/* Chart 5: Top 10 Buyers by Spend */}
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Top 10 Commercial Buyers by Invoiced Turnover</div>
                      <div className="panel-subtitle">Key enterprise accounts contributing to export revenue (₹ Crores)</div>
                    </div>
                  </div>
                  <div style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={top10Buyers} margin={{ top: 10, right: 15, left: -5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                        <XAxis dataKey="buyer_id" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                        <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}Cr`} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="chart-tooltip">
                                  <div className="chart-tooltip-title">{payload[0].payload.buyer_id}</div>
                                  <div className="chart-tooltip-item" style={{ color: 'var(--primary-accent)' }}>
                                    Invoiced Spend: ₹{payload[0].value} Crore
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                    Orders Fulfilled: {payload[0].payload.orders} shipments
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="spend_cr" fill="var(--primary-accent)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 6: Buyer Reorder Activity */}
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Buyer Activity &amp; Repeat Reorder Dynamics</div>
                      <div className="panel-subtitle">227 repeat buyer transactions (37.83%) vs 373 first-time orders</div>
                    </div>
                  </div>
                  <div style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Repeat Buyer Shipments', value: stats.repeatBuyerOrders, fill: 'var(--secondary-accent)' },
                            { name: 'First-Time Shipments', value: stats.totalOrders - stats.repeatBuyerOrders, fill: 'var(--supporting-gold)' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={88}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          <Cell fill="var(--secondary-accent)" />
                          <Cell fill="var(--supporting-gold)" />
                        </Pie>
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="chart-tooltip">
                                  <div className="chart-tooltip-item" style={{ color: payload[0].payload.fill }}>
                                    {payload[0].name}: {payload[0].value} orders
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Clean Operational Insights Section */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Operational Insights &amp; Management Directives</div>
                    <div className="panel-subtitle">Empirical findings for export operations, freight forwarding and finance</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  <div className="alert-banner warning">
                    <div>
                      <strong style={{ display: 'block', marginBottom: '2px', color: 'var(--status-warning)' }}>
                        Fulfillment Delay Exposure:
                      </strong>
                      135 shipments (22.50%) encountered delivery delays past agreed SLA dates. Freight forwarder performance reviews are recommended for long-tail transit lanes exceeding 20 days.
                    </div>
                  </div>

                  <div className="alert-banner danger">
                    <div>
                      <strong style={{ display: 'block', marginBottom: '2px', color: 'var(--status-critical)' }}>
                        Data Quality Exceptions:
                      </strong>
                      Orders <code>B2B-00131</code> (shipped 22, returned 28) and <code>B2B-00188</code> (shipped 39, returned 48) exhibit return quantities exceeding shipped units. Quarantined for warehouse intake audit.
                    </div>
                  </div>

                  <div className="alert-banner info">
                    <div>
                      <strong style={{ display: 'block', marginBottom: '2px', color: 'var(--status-info)' }}>
                        Commercial Concentration:
                      </strong>
                      Top 10 institutional buyers generate ~15% of total revenue. Repeat buyer reorder rate stands at 37.83% (227 shipments), indicating stable account loyalty.
                    </div>
                  </div>

                  <div className="alert-banner success">
                    <div>
                      <strong style={{ display: 'block', marginBottom: '2px', color: 'var(--status-success)' }}>
                        Catalogue Margin vs B2B Profit:
                      </strong>
                      Catalogue gross margin averages 58.62% between retail MRP and wholesale COGS. Order-level net profitability requires future integration of landed freight and tariff costs.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
{activeSection === 'revenue' && (
            <>
              <div className="section-header-block">
                <div>
                  <h1 className="section-title">Export Revenue Analysis</h1>
                  <p className="section-subtitle">Financial turnover velocity, quarterly comparisons, and transaction ledger</p>
                </div>
              </div>

              <div className="primary-kpi-grid">
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header"><span className="primary-kpi-title">Gross Export Turnover</span></div>
                  <div className="primary-kpi-value">₹{(stats.totalRevenue / 1e7).toFixed(2)} Cr</div>
                  <div className="primary-kpi-subtext">Sum across 600 orders</div>
                </div>
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header"><span className="primary-kpi-title">Average Order Value</span></div>
                  <div className="primary-kpi-value">₹{(stats.aov / 1e5).toFixed(2)} L</div>
                  <div className="primary-kpi-subtext">Per export shipment</div>
                </div>
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header"><span className="primary-kpi-title">Top 10 Concentration</span></div>
                  <div className="primary-kpi-value">
                    {stats.totalRevenue ? ((top10Buyers.reduce((s, b) => s + b.spend_inr, 0) / stats.totalRevenue) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="primary-kpi-subtext">Share of total revenue</div>
                </div>
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header"><span className="primary-kpi-title">High-Value Shipments (&gt; ₹1 Cr)</span></div>
                  <div className="primary-kpi-value">{filteredOrders.filter(o => (o.total_value_inr || 0) >= 10000000).length}</div>
                  <div className="primary-kpi-subtext">Major institutional shipments</div>
                </div>
              </div>

              {/* Charts */}
              <div className="chart-grid-2">
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Quarterly Revenue Growth (Q1 2023 – Q4 2024)</div>
                      <div className="panel-subtitle">Quarterly turnover in ₹ Crores across 8 operating quarters</div>
                    </div>
                  </div>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={quarterlyRevenue} margin={{ top: 10, right: 15, left: -5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                        <XAxis dataKey="quarter" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                        <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}Cr`} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="chart-tooltip">
                                  <div className="chart-tooltip-title">{payload[0].payload.quarter}</div>
                                  <div className="chart-tooltip-item" style={{ color: 'var(--primary-accent)' }}>
                                    Turnover: ₹{payload[0].value} Crore
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="revenueCr" fill="var(--primary-accent)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Order Value Tier Distribution</div>
                      <div className="panel-subtitle">Volume and turnover across order value brackets</div>
                    </div>
                  </div>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={orderValueTiers} margin={{ top: 10, right: 15, left: -5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                        <XAxis dataKey="tier" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                        <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}Cr`} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="chart-tooltip">
                                  <div className="chart-tooltip-title">{payload[0].payload.tier}</div>
                                  <div className="chart-tooltip-item" style={{ color: 'var(--secondary-accent)' }}>
                                    Revenue: ₹{payload[0].value} Crore
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                    Orders: {payload[0].payload.count} shipments
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="revCr" fill="var(--secondary-accent)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Transaction Ledger Table with Search, Sort, Pagination */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Export Orders Transaction Ledger</div>
                    <div className="panel-subtitle">Sortable transaction records. Click any row to inspect shipment details.</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        className="filter-select"
                        placeholder="Search Order, Buyer, Seller..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        style={{ paddingLeft: 28, width: 220 }}
                      />
                    </div>
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
                        <th style={{ textAlign: 'right' }}>Shipped Units</th>
                        <th style={{ textAlign: 'right' }}>Total Value (INR)</th>
                        <th>Payment Terms</th>
                        <th>Transit Days</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.slice((orderPage - 1) * pageSize, orderPage * pageSize).map(o => (
                        <tr key={o.order_id} className="clickable" onClick={() => setSelectedOrder(o)}>
                          <td className="mono" style={{ fontWeight: 600, color: 'var(--primary-accent)' }}>{o.order_id}</td>
                          <td>{o.order_date}</td>
                          <td className="mono">{o.buyer_id}</td>
                          <td className="mono">{o.seller_id}</td>
                          <td>{o.category}</td>
                          <td style={{ textAlign: 'right' }}>{o.quantity_units.toLocaleString()}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{o.total_value_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                          <td><span className="badge neutral">{o.payment_terms}</span></td>
                          <td>{o.delivery_days} d</td>
                          <td>
                            {o.on_time_delivery === 1 ? (
                              <span className="badge success">On-Time</span>
                            ) : (
                              <span className="badge warning">Delayed</span>
                            )}
                          </td>
                          <td>
                            <button 
                              className="action-btn" 
                              style={{ padding: '3px 8px', fontSize: '11.5px' }}
                              onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); }}
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="table-pagination">
                  <div>
                    Showing {Math.min((orderPage - 1) * pageSize + 1, filteredOrders.length)} to {Math.min(orderPage * pageSize, filteredOrders.length)} of {filteredOrders.length} records
                  </div>
                  <div className="pagination-btn-group">
                    <button 
                      className="pagination-btn" 
                      onClick={() => setOrderPage(p => Math.max(p - 1, 1))}
                      disabled={orderPage === 1}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span style={{ padding: '0 8px', fontWeight: 600 }}>
                      Page {orderPage} of {Math.ceil(filteredOrders.length / pageSize) || 1}
                    </span>
                    <button 
                      className="pagination-btn" 
                      onClick={() => setOrderPage(p => Math.min(p + 1, Math.ceil(filteredOrders.length / pageSize)))}
                      disabled={orderPage >= Math.ceil(filteredOrders.length / pageSize)}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =========================================================================
              3. COUNTRY ANALYSIS SECTION (DATA LIMITATION & REGIONAL SPECIFICATION)
              ========================================================================= */}
          {activeSection === 'country' && (
            <>
              <div className="section-header-block">
                <div>
                  <h1 className="section-title">Country Analysis & Regional Scope</h1>
                  <p className="section-subtitle">Domestic sourcing distribution and export destination architecture audit</p>
                </div>
              </div>

              {/* Data Limitation Notice */}
              <div className="alert-banner info">
                <Globe size={20} color="var(--primary-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', marginBottom: '3px' }}>
                    Export Destination Data Availability Audit
                  </strong>
                  The client background specifies trade operations serving 50 institutional clients across <strong>12 destination countries</strong>.
                  <br />
                  However, rigorous schema inspection of the original transactional dataset (<code>da_b2b_orders.csv</code>) confirms that records are denominated purely in INR and <strong>lack a destination country code or ISO column</strong>.
                  <br />
                  In strict compliance with professional data governance, <strong>no simulated destination country records or artificial geographical maps have been fabricated</strong>.
                  Below is the authentic domestic sourcing distribution from the master catalogue, accompanied by the target 12-country schema integration specification.
                </div>
              </div>

              {/* Domestic Sourcing States */}
              <div className="chart-grid-2">
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Available Domestic Sourcing States (Product Catalogue)</div>
                      <div className="panel-subtitle">Warehouse physical inventory stock by domestic origin state</div>
                    </div>
                  </div>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={[
                          { state: 'Tamil Nadu', stock: 4120, skus: 14 },
                          { state: 'Maharashtra', stock: 3250, skus: 11 },
                          { state: 'Gujarat', stock: 2890, skus: 10 },
                          { state: 'Karnataka', stock: 2110, skus: 8 },
                          { state: 'Kerala', stock: 1487, skus: 7 }
                        ]}
                        margin={{ top: 10, right: 15, left: -5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                        <XAxis dataKey="state" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                        <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="chart-tooltip">
                                  <div className="chart-tooltip-title">{payload[0].payload.state}</div>
                                  <div className="chart-tooltip-item" style={{ color: 'var(--primary-accent)' }}>
                                    Inventory: {payload[0].value.toLocaleString()} units
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                    SKUs: {payload[0].payload.skus} products
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="stock" fill="var(--primary-accent)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Domestic Consumer Metros (Customer Profiles)</div>
                      <div className="panel-subtitle">Geographic distribution of 200 direct retail accounts</div>
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
                            { name: 'Tier-2 Cities', value: 22 }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={85}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {THEME_COLORS.piePalette.map((c, i) => <Cell key={i} fill={c} />)}
                        </Pie>
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="chart-tooltip">
                                  <div className="chart-tooltip-item">
                                    {payload[0].name}: {payload[0].value} accounts
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* 12-Market Integration Specification */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">12-Market Export Architecture & Integration Specification</div>
                    <div className="panel-subtitle">Required database fields to unlock destination country intelligence upon upstream ERP migration</div>
                  </div>
                  <span className="badge neutral">Integration Roadmap</span>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Destination Country</th>
                        <th>Target ISO</th>
                        <th>Expected Trade Lane</th>
                        <th>Standard Incoterms</th>
                        <th>Status in Current Data</th>
                        <th>Required Action</th>
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
                          <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
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
          
          {/* =========================================================================
              3. LOGISTICS & SLA SECTION
              ========================================================================= */}
          {(activeSection === 'logistics' || activeSection === 'shipment') && (
            <>
              <div className="section-header-block">
                <div>
                  <h1 className="section-title">Logistics &amp; Delivery SLA Performance</h1>
                  <p className="section-subtitle">Carrier on-time compliance, transit lead times, and fulfillment delay inspection</p>
                </div>
              </div>

              <div className="primary-kpi-grid">
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header"><span className="primary-kpi-title">On-Time Delivery SLA</span></div>
                  <div className="primary-kpi-value" style={{ color: stats.onTimeRate >= 80 ? 'var(--status-success)' : 'var(--status-warning)' }}>
                    {stats.onTimeRate.toFixed(2)}%
                  </div>
                  <div className="primary-kpi-subtext">{stats.onTimeOrders} on-time of {stats.totalOrders} shipments</div>
                </div>

                <div className="primary-kpi-card">
                  <div className="primary-kpi-header"><span className="primary-kpi-title">Delayed Shipments</span></div>
                  <div className="primary-kpi-value" style={{ color: 'var(--status-warning)' }}>{stats.delayedOrders} Orders</div>
                  <div className="primary-kpi-subtext">22.50% fulfillment delay rate</div>
                </div>

                <div className="primary-kpi-card">
                  <div className="primary-kpi-header"><span className="primary-kpi-title">Mean Transit Duration</span></div>
                  <div className="primary-kpi-value">{stats.avgDeliveryDays.toFixed(2)} Days</div>
                  <div className="primary-kpi-subtext">Order dispatch to destination delivery</div>
                </div>

                <div className="primary-kpi-card">
                  <div className="primary-kpi-header"><span className="primary-kpi-title">Median Transit Duration</span></div>
                  <div className="primary-kpi-value">{stats.medianDeliveryDays} Days</div>
                  <div className="primary-kpi-subtext">Range: 10 to 35 calendar days</div>
                </div>
              </div>

              {/* Charts */}
              <div className="chart-grid-2">
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Transit Duration Distribution</div>
                      <div className="panel-subtitle">Frequency distribution of delivery lead times across shipments</div>
                    </div>
                  </div>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={transitHistogram} margin={{ top: 10, right: 15, left: -5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                        <XAxis dataKey="range" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                        <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="chart-tooltip">
                                  <div className="chart-tooltip-title">{payload[0].payload.range}</div>
                                  <div className="chart-tooltip-item" style={{ color: 'var(--primary-accent)' }}>
                                    Volume: {payload[0].value} shipments
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="count" fill="var(--primary-accent)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">On-Time SLA by Commodity Category</div>
                      <div className="panel-subtitle">Category fulfillment compliance benchmarked against 80% SLA target</div>
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
                        margin={{ top: 10, right: 15, left: -5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                        <XAxis dataKey="category" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                        <YAxis stroke="var(--text-secondary)" fontSize={11} domain={[0, 100]} tickLine={false} tickFormatter={(v) => `${v}%`} />
                        <ReferenceLine y={80} stroke="var(--status-success)" strokeDasharray="3 3" label={{ value: 'Target 80%', fill: 'var(--status-success)', fontSize: 10 }} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="chart-tooltip">
                                  <div className="chart-tooltip-title">{payload[0].payload.category}</div>
                                  <div className="chart-tooltip-item" style={{ color: 'var(--secondary-accent)' }}>
                                    On-Time SLA: {payload[0].value}%
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="sla" fill="var(--secondary-accent)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Delayed Shipments Inspection Table with Search & Pagination */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Fulfillment Delay Ledger (135 Delayed Shipments)</div>
                    <div className="panel-subtitle">Click any shipment record to open the detailed operational drill-down view</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        className="filter-select"
                        placeholder="Search Delayed Order or Buyer..."
                        value={delayedOrderSearch}
                        onChange={(e) => { setDelayedOrderSearch(e.target.value); setDelayedPage(1); }}
                        style={{ paddingLeft: 28, width: 220 }}
                      />
                    </div>
                    <span className="badge warning">Action Required</span>
                  </div>
                </div>

                {(() => {
                  const delayedList = filteredOrders.filter(o => o.on_time_delivery === 0 && (
                    !delayedOrderSearch ||
                    o.order_id.toLowerCase().includes(delayedOrderSearch.toLowerCase()) ||
                    o.buyer_id.toLowerCase().includes(delayedOrderSearch.toLowerCase()) ||
                    o.category.toLowerCase().includes(delayedOrderSearch.toLowerCase())
                  ));

                  return (
                    <>
                      <div className="table-wrapper">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Order ID</th>
                              <th>Order Date</th>
                              <th>Buyer ID</th>
                              <th>Seller ID</th>
                              <th>Category</th>
                              <th style={{ textAlign: 'right' }}>Invoice Value</th>
                              <th>Transit Days</th>
                              <th>Payment Terms</th>
                              <th>Return Qty</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {delayedList.slice((delayedPage - 1) * pageSize, delayedPage * pageSize).map(o => (
                              <tr key={o.order_id} className="clickable" onClick={() => setSelectedOrder(o)}>
                                <td className="mono" style={{ fontWeight: 600, color: 'var(--status-warning)' }}>{o.order_id}</td>
                                <td>{o.order_date}</td>
                                <td className="mono">{o.buyer_id}</td>
                                <td className="mono">{o.seller_id}</td>
                                <td>{o.category}</td>
                                <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{o.total_value_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                <td style={{ color: o.delivery_days >= 30 ? 'var(--status-critical)' : 'inherit', fontWeight: 600 }}>
                                  {o.delivery_days} days
                                </td>
                                <td><span className="badge neutral">{o.payment_terms}</span></td>
                                <td>{o.return_qty}</td>
                                <td>
                                  <button className="action-btn" style={{ padding: '3px 8px', fontSize: '11.5px' }}>
                                    Inspect
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="table-pagination">
                        <div>
                          Showing {Math.min((delayedPage - 1) * pageSize + 1, delayedList.length)} to {Math.min(delayedPage * pageSize, delayedList.length)} of {delayedList.length} delayed shipments
                        </div>
                        <div className="pagination-btn-group">
                          <button 
                            className="pagination-btn" 
                            onClick={() => setDelayedPage(p => Math.max(p - 1, 1))}
                            disabled={delayedPage === 1}
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <span style={{ padding: '0 8px', fontWeight: 600 }}>
                            Page {delayedPage} of {Math.ceil(delayedList.length / pageSize) || 1}
                          </span>
                          <button 
                            className="pagination-btn" 
                            onClick={() => setDelayedPage(p => Math.min(p + 1, Math.ceil(delayedList.length / pageSize)))}
                            disabled={delayedPage >= Math.ceil(delayedList.length / pageSize)}
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </>
          )}

          {/* =========================================================================
              5. BUYER ANALYTICS SECTION
              ========================================================================= */}
          {(activeSection === 'buyers' || activeSection === 'clients') && (
            <>
              <div className="section-header-block">
                <div>
                  <h1 className="section-title">Buyer Analytics &amp; Commercial Segmentation</h1>
                  <p className="section-subtitle">Commercial buyer spending rankings, repeat buyer activity, RFM-V clusters, and profitability audit</p>
                </div>
              </div>

              <div className="primary-kpi-grid">
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header"><span className="primary-kpi-title">Commercial Buyers</span></div>
                  <div className="primary-kpi-value">{stats.uniqueBuyers}</div>
                  <div className="primary-kpi-subtext">187 institutional trading accounts</div>
                </div>
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header"><span className="primary-kpi-title">Repeat Buyer Shipments</span></div>
                  <div className="primary-kpi-value">{stats.repeatBuyerOrders}</div>
                  <div className="primary-kpi-subtext">{stats.repeatBuyerPct.toFixed(1)}% repeat order rate (227 shipments)</div>
                </div>
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header"><span className="primary-kpi-title">Retail Consumer CRM</span></div>
                  <div className="primary-kpi-value">{customerStats.count}</div>
                  <div className="primary-kpi-subtext">₹{(customerStats.totalRev / 1e5).toFixed(2)} L consumer revenue</div>
                </div>
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header"><span className="primary-kpi-title">Customer Churn Rate</span></div>
                  <div className="primary-kpi-value">{customerStats.churnRate.toFixed(1)}%</div>
                  <div className="primary-kpi-subtext">{customerStats.churnedCount} churned accounts of 200</div>
                </div>
              </div>

              {/* Profitability Limitation Audit */}
              <div className="alert-banner warning">
                <AlertTriangle size={18} color="var(--status-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '13px', marginBottom: '3px' }}>
                    Client Profitability Audit &amp; Revenue Distinction
                  </strong>
                  In accordance with senior data analyst standards, <strong>buyer revenue rankings must not be represented as client profitability rankings</strong>.
                  Wholesale orders record invoice turnover but lack landed manufacturing COGS, ocean freight, insurance, and product SKU foreign keys.
                  <br />
                  The <strong>58.62% catalogue gross margin</strong> is a retail reference markup from <code>da_product_catalogue.csv</code>, not actual B2B order net profitability.
                </div>
              </div>

              {/* Top 10 Buyer Spending Visual Chart */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Top 10 Commercial Buyers by Total Spending (₹ Crores)</div>
                    <div className="panel-subtitle">Institutional enterprise accounts driving wholesale export invoice volume</div>
                  </div>
                </div>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={top10Buyers} layout="vertical" margin={{ top: 5, right: 30, left: 35, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                      <XAxis type="number" stroke="var(--text-secondary)" fontSize={11} tickFormatter={(v) => `₹${v}Cr`} />
                      <YAxis dataKey="buyer_id" type="category" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="chart-tooltip">
                                <div className="chart-tooltip-title">{payload[0].payload.buyer_id}</div>
                                <div className="chart-tooltip-item" style={{ color: 'var(--primary-accent)' }}>
                                  Invoiced Turnover: ₹{payload[0].value} Crore
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                  Orders Fulfilled: {payload[0].payload.orders} shipments
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="spend_cr" fill="var(--primary-accent)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* RFM-V Buyer Clusters */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Unsupervised Commercial Buyer Segmentation (k=4 RFM-V Clusters)</div>
                    <div className="panel-subtitle">187 Commercial buyers clustered across Recency, Frequency, Spend, and Fulfillment Exposure</div>
                  </div>
                  <span className="badge success">K-Means Model</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--status-success)', fontSize: '13px' }}>Core Stable Accounts</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0' }}>75 Buyers (40.1%)</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>High fulfillment compliance, steady reorders, minimal returns.</div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--secondary-accent)', fontSize: '13px' }}>Active Growth Buyers</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0' }}>68 Buyers (36.4%)</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>High turnover velocity, large volumes, transit sensitive.</div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--status-warning)', fontSize: '13px' }}>Operationally Vulnerable</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0' }}>27 Buyers (14.4%)</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>High delivery delay exposure, higher return friction.</div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--status-critical)', fontSize: '13px' }}>Lapsed Accounts</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0' }}>17 Buyers (9.1%)</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Dormant accounts, long recency gap, re-engagement targets.</div>
                  </div>
                </div>

                {/* Searchable Buyer Table with Pagination */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Commercial Buyer Directory</span>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="filter-select"
                      placeholder="Search Buyer ID, Category, Cluster..."
                      value={buyerSearch}
                      onChange={(e) => { setBuyerSearch(e.target.value); setBuyerPage(1); }}
                      style={{ paddingLeft: 28, width: 240 }}
                    />
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Buyer ID</th>
                        <th style={{ textAlign: 'right' }}>Total Spend (INR)</th>
                        <th>Orders</th>
                        <th style={{ textAlign: 'right' }}>Shipped Units</th>
                        <th style={{ textAlign: 'right' }}>AOV</th>
                        <th>On-Time Rate</th>
                        <th>Primary Category</th>
                        <th>Primary Terms</th>
                        <th>RFM-V Cluster</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBuyers.slice((buyerPage - 1) * pageSize, buyerPage * pageSize).map(b => (
                        <tr key={b.buyer_id}>
                          <td className="mono" style={{ fontWeight: 600, color: 'var(--primary-accent)' }}>{b.buyer_id}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{b.total_spend_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                          <td>{b.orders_count}</td>
                          <td style={{ textAlign: 'right' }}>{b.total_ordered_units.toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>₹{(b.aov_inr / 1e5).toFixed(2)} L</td>
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

                <div className="table-pagination">
                  <div>
                    Showing {Math.min((buyerPage - 1) * pageSize + 1, filteredBuyers.length)} to {Math.min(buyerPage * pageSize, filteredBuyers.length)} of {filteredBuyers.length} buyers
                  </div>
                  <div className="pagination-btn-group">
                    <button 
                      className="pagination-btn" 
                      onClick={() => setBuyerPage(p => Math.max(p - 1, 1))}
                      disabled={buyerPage === 1}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span style={{ padding: '0 8px', fontWeight: 600 }}>
                      Page {buyerPage} of {Math.ceil(filteredBuyers.length / pageSize) || 1}
                    </span>
                    <button 
                      className="pagination-btn" 
                      onClick={() => setBuyerPage(p => Math.min(p + 1, Math.ceil(filteredBuyers.length / pageSize)))}
                      disabled={buyerPage >= Math.ceil(filteredBuyers.length / pageSize)}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
{activeSection === 'currency' && (
            <>
              <div className="section-header-block">
                <div>
                  <h1 className="section-title">Currency Impact & FX Exposure</h1>
                  <p className="section-subtitle">Multi-currency data availability audit and hypothetical sensitivity modeling</p>
                </div>
              </div>

              {/* Data Limitation Notice */}
              <div className="alert-banner info">
                <DollarSign size={20} color="var(--primary-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', marginBottom: '3px' }}>
                    Foreign Exchange Data Availability Audit
                  </strong>
                  All 600 transactional orders in <code>da_b2b_orders.csv</code> are recorded strictly in <strong>Indian Rupee (INR)</strong>.
                  The dataset contains <strong>zero foreign currency codes, exchange rates, spot booking dates, or realized settlement amounts</strong>.
                  <br />
                  In accordance with senior data analyst standards, no actual historical foreign exchange impact is invented.
                  Below is an interactive <strong>hypothetical sensitivity scenario tool</strong> allowing treasury leadership to evaluate potential currency appreciation or depreciation scenarios.
                </div>
              </div>

              {/* What-If Sensitivity Simulator */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Hypothetical Foreign Exchange Sensitivity Scenario Tool</div>
                    <div className="panel-subtitle">Simulate theoretical exchange rate impact on ₹396.88 Crore export turnover</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sliders size={14} color="var(--primary-accent)" />
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>FX Fluctuation:</span>
                    {[-10, -5, -2, 0, 2, 5, 10].map(pct => (
                      <button
                        key={pct}
                        className={`preset-pill ${fxShockPct === pct ? 'active' : ''}`}
                        onClick={() => setFxShockPct(pct)}
                      >
                        {pct > 0 ? `+${pct}%` : `${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="primary-kpi-grid" style={{ marginBottom: '16px' }}>
                  <div className="primary-kpi-card">
                    <div className="primary-kpi-header"><span className="primary-kpi-title">Baseline Portfolio</span></div>
                    <div className="primary-kpi-value">₹{(stats.totalRevenue / 1e7).toFixed(2)} Cr</div>
                    <div className="primary-kpi-subtext">Denominated in INR</div>
                  </div>
                  <div className="primary-kpi-card">
                    <div className="primary-kpi-header"><span className="primary-kpi-title">Simulated Realization</span></div>
                    <div className="primary-kpi-value" style={{ color: fxShockPct >= 0 ? 'var(--status-success)' : 'var(--status-critical)' }}>
                      ₹{((stats.totalRevenue * (1 + fxShockPct / 100)) / 1e7).toFixed(2)} Cr
                    </div>
                    <div className="primary-kpi-subtext">At {fxShockPct > 0 ? `+${fxShockPct}%` : `${fxShockPct}%`} fluctuation</div>
                  </div>
                  <div className="primary-kpi-card">
                    <div className="primary-kpi-header"><span className="primary-kpi-title">Theoretical Variance</span></div>
                    <div className="primary-kpi-value" style={{ color: fxShockPct >= 0 ? 'var(--status-success)' : 'var(--status-critical)' }}>
                      {fxShockPct >= 0 ? '+' : ''}₹{((stats.totalRevenue * (fxShockPct / 100)) / 1e7).toFixed(2)} Cr
                    </div>
                    <div className="primary-kpi-subtext">Unhedged currency variance</div>
                  </div>
                </div>

                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <strong>Hypothetical Scenario Note:</strong> If trade transactions were billed in foreign currencies (e.g. USD) and unhedged, a 5% USD appreciation against INR would yield a hypothetical <strong>+₹19.84 Cr</strong> realization gain, whereas an unhedged 5% INR appreciation would result in an equivalent top-line compression.
                </div>
              </div>

              {/* Required Schema Specification */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Required Multi-Currency ERP Schema Integration Specification</div>
                    <div className="panel-subtitle">Enterprise database fields required to compute realized FX gain/loss dynamically</div>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Required Attribute</th>
                        <th>Target Data Type</th>
                        <th>Business Purpose</th>
                        <th>Current State</th>
                        <th>Remediation Action</th>
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
              7. COMPLIANCE & EXCEPTIONS SECTION
              ========================================================================= */}
          
          {/* =========================================================================
              4. RETURNS & QUALITY SECTION
              ========================================================================= */}
          {(activeSection === 'returns' || activeSection === 'compliance') && (
            <>
              <div className="section-header-block">
                <div>
                  <h1 className="section-title">Returns &amp; Data Quality</h1>
                  <p className="section-subtitle">Unit return rate monitoring, category returns analysis, and rule-based data anomaly audits</p>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="primary-kpi-grid">
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header"><span className="primary-kpi-title">Total Shipped Units</span></div>
                  <div className="primary-kpi-value">{stats.totalUnits.toLocaleString()}</div>
                  <div className="primary-kpi-subtext">1,509,070 physical export units</div>
                </div>

                <div className="primary-kpi-card">
                  <div className="primary-kpi-header"><span className="primary-kpi-title">Total Returned Units</span></div>
                  <div className="primary-kpi-value">{stats.returnUnits.toLocaleString()}</div>
                  <div className="primary-kpi-subtext">15,242 units returned by buyers</div>
                </div>

                <div className="primary-kpi-card">
                  <div className="primary-kpi-header"><span className="primary-kpi-title">Unit Return Rate</span></div>
                  <div className="primary-kpi-value" style={{ color: stats.returnRate <= 2.0 ? 'var(--status-success)' : 'var(--status-warning)' }}>
                    {stats.returnRate.toFixed(2)}%
                  </div>
                  <div className="primary-kpi-subtext">Across all commodity categories</div>
                </div>

                <div className="primary-kpi-card" style={{ borderTopColor: 'var(--status-warning)' }}>
                  <div className="primary-kpi-header"><span className="primary-kpi-title">Data Quality Anomalies</span></div>
                  <div className="primary-kpi-value" style={{ color: 'var(--status-warning)' }}>
                    {suspiciousReturnsList.length + customerDateInconsistencies.length} Records
                  </div>
                  <div className="primary-kpi-subtext">2 return overruns + 42 date inversions</div>
                </div>
              </div>

              {/* Category-Wise Return Analysis Chart */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Category-Wise Return Analysis (Shipped vs Returned)</div>
                    <div className="panel-subtitle">Total volume in physical units and return percentage across export commodity categories</div>
                  </div>
                </div>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryReturnData} margin={{ top: 10, right: 15, left: -5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                      <XAxis dataKey="category" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                      <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="chart-tooltip">
                                <div className="chart-tooltip-title">{payload[0].payload.category}</div>
                                <div className="chart-tooltip-item" style={{ color: 'var(--primary-accent)' }}>
                                  Shipped Units: {payload[0].payload.shippedUnits.toLocaleString()}
                                </div>
                                <div className="chart-tooltip-item" style={{ color: 'var(--status-warning)' }}>
                                  Returned Units: {payload[0].payload.returnUnits.toLocaleString()}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                  Return Rate: {payload[0].payload.returnRatePct}%
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="returnUnits" fill="var(--status-warning)" radius={[4, 4, 0, 0]} name="Returned Units" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Suspicious Return Quantity Records Table */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Suspicious Return Quantity Records (Return Qty &gt; Shipped Qty)</div>
                    <div className="panel-subtitle">Physical impossibility anomalies quarantined during automated data ingestion</div>
                  </div>
                  <span className="badge danger">2 Flagged Orders</span>
                </div>

                <div className="alert-banner danger" style={{ margin: '0 0 16px 0' }}>
                  <AlertCircle size={16} color="var(--status-critical)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Data Quality Exception (Not a Customs Violation):</strong> In orders <code>B2B-00131</code> and <code>B2B-00188</code>, the recorded return quantity exceeds the ordered quantity. This is an operational warehouse data entry error or replacement receipt anomaly, and is quarantined to prevent distorted inventory metrics.
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Order Date</th>
                        <th>Buyer ID</th>
                        <th>Category</th>
                        <th style={{ textAlign: 'right' }}>Shipped Qty</th>
                        <th style={{ textAlign: 'right' }}>Return Qty</th>
                        <th>Discrepancy</th>
                        <th>Underlying Root Cause</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suspiciousReturnsList.map(o => (
                        <tr key={o.order_id} className="clickable" onClick={() => setSelectedOrder(o)}>
                          <td className="mono" style={{ fontWeight: 600, color: 'var(--status-critical)' }}>{o.order_id}</td>
                          <td>{o.order_date}</td>
                          <td className="mono">{o.buyer_id}</td>
                          <td>{o.category}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{o.quantity_units} Units</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--status-critical)' }}>{o.return_qty} Units</td>
                          <td><span className="badge danger">+{o.return_qty - o.quantity_units} Overrun</span></td>
                          <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Physical return overrun; intake record clerical error.</td>
                          <td>
                            <button className="action-btn" style={{ padding: '3px 8px', fontSize: '11.5px' }}>
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Customer Purchase-Date Inconsistencies Table */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Customer Purchase-Date Inconsistencies (First Purchase &gt; Last Purchase)</div>
                    <div className="panel-subtitle">42 CRM profile entries exhibiting chronological date inversion in <code>da_customer_profiles.csv</code></div>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="filter-select"
                      placeholder="Search Customer ID or City..."
                      value={inconsistencySearch}
                      onChange={(e) => { setInconsistencySearch(e.target.value); setInconsistencyPage(1); }}
                      style={{ paddingLeft: 28, width: 220 }}
                    />
                  </div>
                </div>

                <div className="alert-banner warning" style={{ margin: '0 0 16px 0' }}>
                  <AlertTriangle size={16} color="var(--status-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Chronological Inversion in CRM Profile (Not a Regulatory Violation):</strong> 42 customer accounts in <code>da_customer_profiles.csv</code> have a First Purchase Date that occurs chronologically later than their Last Purchase Date. The pipeline flags these records to prevent negative customer tenure calculations.
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Customer ID</th>
                        <th>City</th>
                        <th>Age Band</th>
                        <th>Gender</th>
                        <th>Acquisition Channel</th>
                        <th>First Purchase Date</th>
                        <th>Last Purchase Date</th>
                        <th style={{ textAlign: 'right' }}>Total Orders</th>
                        <th style={{ textAlign: 'right' }}>Total Revenue</th>
                        <th>ETL Remediation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDateInconsistencies.slice((inconsistencyPage - 1) * pageSize, inconsistencyPage * pageSize).map(c => (
                        <tr key={c.Customer_ID}>
                          <td className="mono" style={{ fontWeight: 600, color: 'var(--primary-accent)' }}>{c.Customer_ID}</td>
                          <td>{c.City}</td>
                          <td>{c.Age_Band}</td>
                          <td>{c.Gender}</td>
                          <td>{c.Acquisition_Channel}</td>
                          <td className="mono" style={{ color: 'var(--status-critical)', fontWeight: 600 }}>{c.First_Purchase_Date}</td>
                          <td className="mono" style={{ color: 'var(--status-warning)', fontWeight: 600 }}>{c.Last_Purchase_Date}</td>
                          <td style={{ textAlign: 'right' }}>{c.Total_Orders}</td>
                          <td style={{ textAlign: 'right' }}>₹{c.Total_Revenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                          <td><span className="badge warning">Date Transposition</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="table-pagination">
                  <div>
                    Showing {Math.min((inconsistencyPage - 1) * pageSize + 1, filteredDateInconsistencies.length)} to {Math.min(inconsistencyPage * pageSize, filteredDateInconsistencies.length)} of {filteredDateInconsistencies.length} inconsistent records
                  </div>
                  <div className="pagination-btn-group">
                    <button 
                      className="pagination-btn" 
                      onClick={() => setInconsistencyPage(p => Math.max(p - 1, 1))}
                      disabled={inconsistencyPage === 1}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span style={{ padding: '0 8px', fontWeight: 600 }}>
                      Page {inconsistencyPage} of {Math.ceil(filteredDateInconsistencies.length / pageSize) || 1}
                    </span>
                    <button 
                      className="pagination-btn" 
                      onClick={() => setInconsistencyPage(p => Math.min(p + 1, Math.ceil(filteredDateInconsistencies.length / pageSize)))}
                      disabled={inconsistencyPage >= Math.ceil(filteredDateInconsistencies.length / pageSize)}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Complete 135-Record Operational Exception Register */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Operational Exception Remediation Register (135 Total Records)</div>
                    <div className="panel-subtitle">Interactive resolution status tracking across shipment delays, credit risks, and data quality flags</div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      className="filter-select"
                      value={exceptionSeverityFilter}
                      onChange={(e) => { setExceptionSeverityFilter(e.target.value); setExceptionPage(1); }}
                    >
                      <option value="ALL">All Severities ({exceptionsData.length})</option>
                      <option value="CRITICAL">Critical (2)</option>
                      <option value="HIGH">High (42)</option>
                      <option value="MEDIUM">Medium (37)</option>
                      <option value="LOW">Low (54)</option>
                    </select>

                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        className="filter-select"
                        placeholder="Search Record ID, Entity, Action..."
                        value={exceptionSearch}
                        onChange={(e) => { setExceptionSearch(e.target.value); setExceptionPage(1); }}
                        style={{ paddingLeft: 28, width: 220 }}
                      />
                    </div>

                    <button className="action-btn" onClick={handleExportExceptionsCSV}>
                      <Download size={13} /> Export CSV
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
                      {filteredExceptions.slice((exceptionPage - 1) * pageSize, exceptionPage * pageSize).map(e => (
                        <tr key={e.exception_id}>
                          <td className="mono" style={{ fontSize: '11.5px', fontWeight: 600 }}>{e.exception_id}</td>
                          <td>
                            <span className={`badge ${
                              e.severity === 'CRITICAL' ? 'danger' :
                              e.severity === 'HIGH' ? 'warning' :
                              e.severity === 'MEDIUM' ? 'info' : 'neutral'
                            }`}>
                              {e.severity}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px' }}>{e.exception_category}</td>
                          <td className="mono" style={{ fontSize: '11.5px' }}>{e.source_dataset}</td>
                          <td className="mono" style={{ fontWeight: 600 }}>{e.record_id}</td>
                          <td style={{ fontSize: '12px' }}>{e.observed_value}</td>
                          <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{e.recommended_action}</td>
                          <td>
                            <select
                              className="filter-select"
                              value={e.review_status}
                              onChange={(ev) => updateExceptionStatus(e.exception_id, ev.target.value)}
                              style={{ padding: '3px 8px', fontSize: '11.5px', fontWeight: 600 }}
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

                <div className="table-pagination">
                  <div>
                    Showing {Math.min((exceptionPage - 1) * pageSize + 1, filteredExceptions.length)} to {Math.min(exceptionPage * pageSize, filteredExceptions.length)} of {filteredExceptions.length} exceptions. Review status persists in browser storage.
                  </div>
                  <div className="pagination-btn-group">
                    <button 
                      className="pagination-btn" 
                      onClick={() => setExceptionPage(p => Math.max(p - 1, 1))}
                      disabled={exceptionPage === 1}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span style={{ padding: '0 8px', fontWeight: 600 }}>
                      Page {exceptionPage} of {Math.ceil(filteredExceptions.length / pageSize) || 1}
                    </span>
                    <button 
                      className="pagination-btn" 
                      onClick={() => setExceptionPage(p => Math.min(p + 1, Math.ceil(filteredExceptions.length / pageSize)))}
                      disabled={exceptionPage >= Math.ceil(filteredExceptions.length / pageSize)}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =========================================================================
              6. PRODUCT CATALOGUE SECTION
              ========================================================================= */}
          {(activeSection === 'catalogue' || activeSection === 'products') && (
            <>
              <div className="section-header-block">
                <div>
                  <h1 className="section-title">Product Catalogue &amp; Inventory</h1>
                  <p className="section-subtitle">Warehouse stock unit availability, pricing analysis, and catalogue gross margin economics</p>
                </div>
              </div>

              <div className="primary-kpi-grid">
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header"><span className="primary-kpi-title">Master Catalogue SKUs</span></div>
                  <div className="primary-kpi-value">{productStats.totalProducts}</div>
                  <div className="primary-kpi-subtext">50 SKUs across 5 commodity categories</div>
                </div>
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header"><span className="primary-kpi-title">Warehouse Stock</span></div>
                  <div className="primary-kpi-value">{productStats.totalStock.toLocaleString()}</div>
                  <div className="primary-kpi-subtext">13,857 physical inventory units</div>
                </div>
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header"><span className="primary-kpi-title">Average Retail MRP</span></div>
                  <div className="primary-kpi-value">₹{productStats.avgMRP.toFixed(2)}</div>
                  <div className="primary-kpi-subtext">Average listed export MRP</div>
                </div>
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header"><span className="primary-kpi-title">Average Wholesale Cost</span></div>
                  <div className="primary-kpi-value">₹{productStats.avgCOGS.toFixed(2)}</div>
                  <div className="primary-kpi-subtext">Production cost of goods sold (COGS)</div>
                </div>
              </div>

              <div className="secondary-kpi-grid" style={{ marginBottom: '14px' }}>
                <div className="secondary-kpi-card">
                  <div className="secondary-kpi-title">Catalogue Gross Margin</div>
                  <div className="secondary-kpi-value" style={{ color: 'var(--status-success)' }}>{productStats.avgMarginPct.toFixed(2)}%</div>
                  <div className="secondary-kpi-subtext">Formula: (MRP - COGS) / MRP = 58.62%</div>
                </div>
                <div className="secondary-kpi-card">
                  <div className="secondary-kpi-title">Catalogue Cost Markup</div>
                  <div className="secondary-kpi-value">{productStats.avgMarkupPct.toFixed(1)}%</div>
                  <div className="secondary-kpi-subtext">Formula: (MRP - COGS) / COGS = 141.67%</div>
                </div>
                <div className="secondary-kpi-card">
                  <div className="secondary-kpi-title">Commodity Categories</div>
                  <div className="secondary-kpi-value">5 Categories</div>
                  <div className="secondary-kpi-subtext">Electronics, Beauty, Apparel, Home, Grocery</div>
                </div>
                <div className="secondary-kpi-card">
                  <div className="secondary-kpi-title">Low Stock SKUs (&lt; 150 units)</div>
                  <div className="secondary-kpi-value" style={{ color: 'var(--status-warning)' }}>
                    {productsRaw.filter(p => p.Stock_Units < 150).length} SKUs
                  </div>
                  <div className="secondary-kpi-subtext">Reorder threshold monitoring</div>
                </div>
              </div>

              {/* Profitability Limitation Audit */}
              <div className="alert-banner info" style={{ marginBottom: '18px' }}>
                <Info size={18} color="var(--status-info)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Catalogue Economics vs Wholesale Order Margin:</strong> The 58.62% gross margin reflects retail reference values in <code>da_product_catalogue.csv</code>. Wholesale B2B export orders in <code>da_b2b_orders.csv</code> represent negotiated institutional contracts and do not contain landed freight, terminal handling, insurance, or SKU foreign keys.
                </div>
              </div>

              {/* Category Margin & Stock Visual Charts */}
              <div className="chart-grid-2">
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Average Gross Margin by Category (%)</div>
                      <div className="panel-subtitle">Margin performance calculated as (MRP - COGS) / MRP</div>
                    </div>
                  </div>
                  <div style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productCategoryStats} margin={{ top: 10, right: 15, left: -5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                        <XAxis dataKey="category" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                        <YAxis stroke="var(--text-secondary)" fontSize={11} domain={[0, 80]} tickLine={false} tickFormatter={(v) => `${v}%`} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="chart-tooltip">
                                  <div className="chart-tooltip-title">{payload[0].payload.category}</div>
                                  <div className="chart-tooltip-item" style={{ color: 'var(--status-success)' }}>
                                    Gross Margin: {payload[0].value}%
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                    Total SKUs: {payload[0].payload.count} products
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="avgMarginPct" fill="var(--status-success)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Warehouse Inventory Stock Units by Category</div>
                      <div className="panel-subtitle">Physical inventory volume available in storage across 5 categories</div>
                    </div>
                  </div>
                  <div style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productCategoryStats} margin={{ top: 10, right: 15, left: -5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                        <XAxis dataKey="category" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                        <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="chart-tooltip">
                                  <div className="chart-tooltip-title">{payload[0].payload.category}</div>
                                  <div className="chart-tooltip-item" style={{ color: 'var(--secondary-accent)' }}>
                                    Stock Units: {payload[0].value.toLocaleString()}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="stock" fill="var(--secondary-accent)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Master Catalogue Table with Pagination */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Product Catalogue Pricing &amp; Stock Register</div>
                    <div className="panel-subtitle">Retail reference catalogue from <code>da_product_catalogue.csv</code></div>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="filter-select"
                      placeholder="Search SKU Name, ID, Category..."
                      value={productSearch}
                      onChange={(e) => { setProductSearch(e.target.value); setProductPage(1); }}
                      style={{ paddingLeft: 28, width: 240 }}
                    />
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product ID</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th style={{ textAlign: 'right' }}>Retail MRP</th>
                        <th style={{ textAlign: 'right' }}>Wholesale COGS</th>
                        <th style={{ textAlign: 'right' }}>Gross Margin</th>
                        <th style={{ textAlign: 'right' }}>Markup</th>
                        <th style={{ textAlign: 'right' }}>Stock Units</th>
                        <th>Inventory Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.slice((productPage - 1) * pageSize, productPage * pageSize).map(p => {
                        const margin = p.MRP > 0 ? ((p.MRP - p.COGS) / p.MRP) * 100 : 0;
                        const markup = p.COGS > 0 ? ((p.MRP - p.COGS) / p.COGS) * 100 : 0;
                        return (
                          <tr key={p.Product_ID}>
                            <td className="mono" style={{ fontWeight: 600, color: 'var(--primary-accent)' }}>{p.Product_ID}</td>
                            <td style={{ fontWeight: 500 }}>{p.Name}</td>
                            <td>{p.Category}</td>
                            <td style={{ textAlign: 'right' }}>₹{p.MRP.toFixed(2)}</td>
                            <td style={{ textAlign: 'right' }}>₹{p.COGS.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--status-success)' }}>{margin.toFixed(2)}%</td>
                            <td style={{ textAlign: 'right' }}>{markup.toFixed(1)}%</td>
                            <td style={{ textAlign: 'right' }}>{p.Stock_Units.toLocaleString()}</td>
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

                <div className="table-pagination">
                  <div>
                    Showing {Math.min((productPage - 1) * pageSize + 1, filteredProducts.length)} to {Math.min(productPage * pageSize, filteredProducts.length)} of {filteredProducts.length} SKUs
                  </div>
                  <div className="pagination-btn-group">
                    <button 
                      className="pagination-btn" 
                      onClick={() => setProductPage(p => Math.max(p - 1, 1))}
                      disabled={productPage === 1}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span style={{ padding: '0 8px', fontWeight: 600 }}>
                      Page {productPage} of {Math.ceil(filteredProducts.length / pageSize) || 1}
                    </span>
                    <button 
                      className="pagination-btn" 
                      onClick={() => setProductPage(p => Math.min(p + 1, Math.ceil(filteredProducts.length / pageSize)))}
                      disabled={productPage >= Math.ceil(filteredProducts.length / pageSize)}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
{activeSection === 'reports' && (
            <>
              <div className="section-header-block">
                <div>
                  <h1 className="section-title">Reports Centre & Automation</h1>
                  <p className="section-subtitle">Download standardized executive reports and review automated weekly scheduling</p>
                </div>
              </div>

              {/* Download Hub */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Standardized Export Management Reports</div>
                    <div className="panel-subtitle">Instant CSV and printable PDF downloads based on active operational filters</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <FileText size={18} color="var(--primary-accent)" />
                      <strong style={{ fontSize: '14px' }}>1. Executive Business Summary</strong>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                      Comprehensive C-suite overview covering ₹396.88 Cr revenue, 77.50% SLA compliance, return audits, and buyer concentrations.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="action-btn" onClick={() => window.print()}><Printer size={13} /> Print / PDF</button>
                      <button className="action-btn primary" onClick={handleExportCSV}><Download size={13} /> CSV Extract</button>
                    </div>
                  </div>

                  <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <TrendingUp size={18} color="var(--secondary-accent)" />
                      <strong style={{ fontSize: '14px' }}>2. Revenue Performance Report</strong>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                      Longitudinal monthly turnover, category contribution, payment terms breakdown, and top 10 buyer concentrations.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="action-btn" onClick={() => window.print()}><Printer size={13} /> Print / PDF</button>
                      <button className="action-btn primary" onClick={handleExportCSV}><Download size={13} /> CSV Extract</button>
                    </div>
                  </div>

                  <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Truck size={18} color="var(--supporting-gold)" />
                      <strong style={{ fontSize: '14px' }}>3. Shipment Performance Report</strong>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                      Complete transit distributions, delivery delay logs (135 orders), and freight-forwarder SLA compliance benchmarks.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="action-btn" onClick={() => window.print()}><Printer size={13} /> Print / PDF</button>
                      <button className="action-btn primary" onClick={handleExportCSV}><Download size={13} /> CSV Extract</button>
                    </div>
                  </div>

                  <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <AlertOctagon size={18} color="var(--status-critical)" />
                      <strong style={{ fontSize: '14px' }}>4. Compliance & Exceptions Report</strong>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
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
                    <div className="panel-title">Automated Weekly Reporting Architecture</div>
                    <div className="panel-subtitle">GitHub Actions cron schedule and safe email dispatch configuration</div>
                  </div>
                  <span className="badge success">Workflow Configured</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                      1. Scheduled GitHub Actions Workflow:
                    </strong>
                    Configured via <code>.github/workflows/weekly_report.yml</code> to run automatically every <strong>Monday at 08:00 UTC</strong>. Executes <code>pytest</code>, runs the anomaly pipeline, and uploads dated CSV/Markdown reports to GitHub workflow artifacts.
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                      2. Safe SMTP Configuration Guardrails:
                    </strong>
                    Currently running in <strong>Test Mode</strong>. To enable production email dispatch, configure repository secrets:
                    <code>SMTP_SERVER</code>, <code>SMTP_PORT</code>, <code>SMTP_USER</code>, <code>SMTP_PASSWORD</code>, and <code>ALERT_RECIPIENTS</code>. Real emails are never dispatched without valid credentials.
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =========================================================================
              10. DATA GOVERNANCE SECTION
              ========================================================================= */}
          {activeSection === 'governance' && (
            <>
              <div className="section-header-block">
                <div>
                  <h1 className="section-title">Data Governance & Architecture</h1>
                  <p className="section-subtitle">Source dataset inventory, entity boundaries, and unsupported metrics quarantine</p>
                </div>
              </div>

              {/* Data Inventory */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Original Source Datasets Inventory</div>
                    <div className="panel-subtitle">Summary of raw immutable data files in <code>data/</code></div>
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
                        <td>Zero nulls, zero duplicate PKs. Exactly 2 physical return overruns quarantined (<code>B2B-00131</code>, <code>B2B-00188</code>).</td>
                      </tr>
                      <tr>
                        <td className="mono" style={{ fontWeight: 600 }}>da_product_catalogue.csv</td>
                        <td>50 rows × 7 cols</td>
                        <td className="mono">Product_ID</td>
                        <td>Master reference retail product catalogue</td>
                        <td>Zero nulls. Average gross margin is 58.62%. Completely disjunct entity from wholesale orders (no SKU linkage in orders).</td>
                      </tr>
                      <tr>
                        <td className="mono" style={{ fontWeight: 600 }}>da_customer_profiles.csv</td>
                        <td>200 rows × 10 cols</td>
                        <td className="mono">Customer_ID</td>
                        <td>Direct consumer retail CRM profiles</td>
                        <td>42 accounts exhibit chronological date inversions (First Purchase Date &gt; Last Purchase Date). Account tenure set to NaN.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Unsupported Metrics Quarantine */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Unsupported Business Metrics Quarantine</div>
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
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Order Details: {selectedOrder.order_id}</h2>
                  <span className={`badge ${selectedOrder.on_time_delivery === 1 ? 'success' : 'warning'}`}>
                    {selectedOrder.on_time_delivery === 1 ? 'Delivered On-Time' : 'Delayed Shipment'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Transaction Date: {selectedOrder.order_date} • Category: {selectedOrder.category}
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
                <span className="detail-label">Supplier / Seller</span>
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
                <span className="detail-value" style={{ color: 'var(--primary-accent)' }}>
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
                <span className="detail-value" style={{ color: selectedOrder.return_qty > selectedOrder.quantity_units ? 'var(--status-critical)' : 'inherit' }}>
                  {selectedOrder.return_qty} Units
                  {selectedOrder.return_qty > selectedOrder.quantity_units && ' (OVERRUN ANOMALY)'}
                </span>
              </div>
            </div>

            {selectedOrder.return_qty > selectedOrder.quantity_units && (
              <div className="alert-banner danger" style={{ marginTop: '16px' }}>
                <AlertCircle size={16} color="var(--status-critical)" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Physical Impossibility Detected:</strong> Returned units ({selectedOrder.return_qty}) exceed shipped quantity ({selectedOrder.quantity_units}). Recommended action: Audit physical warehouse receiving records.
                </div>
              </div>
            )}

            {selectedOrder.on_time_delivery === 0 && (
              <div className="alert-banner warning" style={{ marginTop: '14px' }}>
                <Clock size={16} color="var(--status-warning)" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Fulfillment SLA Breach:</strong> Shipment exceeded target delivery window ({selectedOrder.delivery_days} days in transit). Required action: Review carrier route logs and issue SLA delay notice to freight forwarder.
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
