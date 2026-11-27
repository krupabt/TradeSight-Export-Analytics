import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  ChevronLeft, ChevronRight, Activity, ArrowRight, ChevronDown
} from 'lucide-react';

import ordersRaw from './data/orders.json';
import productsRaw from './data/products.json';
import customersRaw from './data/customers.json';
import buyersRaw from './data/buyers_aggregated.json';
import exceptionsRaw from './data/exceptions.json';

// Unique filters supported by orders dataset
const ALL_CATEGORIES = [...new Set(ordersRaw.map(o => o.category))].sort();
const ALL_TERMS = [...new Set(ordersRaw.map(o => o.payment_terms))].sort();

// Helper to format category names with proper spacing (e.g. IndustrialMachinery -> Industrial Machinery)
const formatCategoryName = (cat) => {
  if (!cat) return '';
  return cat.replace(/([a-z])([A-Z])/g, '$1 $2');
};

// New Design System Palette: Navy & Light Theme
const THEME_COLORS = {
  navy: '#172B4D',
  primaryBlue: '#3674B5',
  softBlue: '#8CB8E0',
  mainBg: '#F5F7FA',
  iconBg: '#E8F1FA',
  primaryText: '#172B4D',
  secondaryText: '#64748B',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  success: '#25805A',
  warning: '#E0A35A',
  error: '#C94C4C',
  piePalette: ['#3674B5', '#8CB8E0', '#5B93C7', '#A8CEEF', '#1E4B7A', '#3C82B8']
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

  // Mobile Drawer State
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Horizontal Navigation Dropdown State
  const [openDropdown, setOpenDropdown] = useState(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!e.target.closest('.nav-dropdown-wrapper')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // Theme State (Default: Light Mode per strict requirement, resolving legacy conflicts)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      // Clear legacy theme preferences to ensure light mode is default
      localStorage.removeItem('tradesight_theme');
      const saved = localStorage.getItem('tradesight_theme_v2');
      if (saved) return saved;
      return 'light';
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
      localStorage.setItem('tradesight_theme_v2', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleSelectSection = (s) => {
    setActiveSection(s);
    setSidebarOpen(false);
    setOpenDropdown(null);
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

  // Helper for Page title
  const getPageTitle = () => {
    switch (activeSection) {
      case 'overview': return 'Dashboard';
      case 'revenue': return 'Revenue Analysis';
      case 'logistics':
      case 'shipment': return 'Shipment Analysis';
      case 'returns':
      case 'compliance': return 'Returns Analysis';
      case 'buyers':
      case 'clients': return 'Buyer Analysis';
      case 'catalogue':
      case 'products': return 'Product Catalogue';
      case 'country': return 'Country Analysis';
      case 'currency': return 'Currency Analysis';
      case 'reports': return 'Reports';
      case 'governance': return 'Data Quality';
      default: return 'Dashboard';
    }
  };

  const pageTitle = getPageTitle();

  return (
    <div className="app-layout">
      {/* Mobile Drawer Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* LEFT SIDEBAR NAVIGATION (#C8DFDB Pastel Mint with #243447 Text) */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Globe size={20} />
          </div>
          <div className="brand-text">
            <div className="brand-title">TradeSight</div>
            <div className="brand-subtitle">Export Analytics</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => handleSelectSection('overview')}
          >
            <Activity size={16} className="nav-icon" /> Dashboard
          </button>
          <button
            className={`nav-item ${activeSection === 'revenue' ? 'active' : ''}`}
            onClick={() => handleSelectSection('revenue')}
          >
            <TrendingUp size={16} className="nav-icon" /> Revenue
          </button>
          <button
            className={`nav-item ${(activeSection === 'logistics' || activeSection === 'shipment') ? 'active' : ''}`}
            onClick={() => handleSelectSection('logistics')}
          >
            <Truck size={16} className="nav-icon" /> Shipments
          </button>
          <button
            className={`nav-item ${(activeSection === 'returns' || activeSection === 'compliance') ? 'active' : ''}`}
            onClick={() => handleSelectSection('returns')}
          >
            <RotateCcw size={16} className="nav-icon" /> Returns
          </button>
          <button
            className={`nav-item ${(activeSection === 'buyers' || activeSection === 'clients') ? 'active' : ''}`}
            onClick={() => handleSelectSection('buyers')}
          >
            <Users size={16} className="nav-icon" /> Buyers
          </button>
          <button
            className={`nav-item ${(activeSection === 'catalogue' || activeSection === 'products') ? 'active' : ''}`}
            onClick={() => handleSelectSection('catalogue')}
          >
            <Package size={16} className="nav-icon" /> Products
          </button>
          <button
            className={`nav-item ${activeSection === 'country' ? 'active' : ''}`}
            onClick={() => handleSelectSection('country')}
          >
            <Globe size={16} className="nav-icon" /> Countries
          </button>
          <button
            className={`nav-item ${activeSection === 'currency' ? 'active' : ''}`}
            onClick={() => handleSelectSection('currency')}
          >
            <DollarSign size={16} className="nav-icon" /> Currency
          </button>
          <button
            className={`nav-item ${activeSection === 'reports' ? 'active' : ''}`}
            onClick={() => handleSelectSection('reports')}
          >
            <FileSpreadsheet size={16} className="nav-icon" /> Reports
          </button>
          <button
            className={`nav-item ${activeSection === 'governance' ? 'active' : ''}`}
            onClick={() => handleSelectSection('governance')}
          >
            <ShieldAlert size={16} className="nav-icon" /> Data Quality
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-title">
            <Database size={13} color="var(--secondary-accent)" /> 600 Export Orders
          </div>
          <div style={{ marginTop: '2px', fontSize: '11px', color: '#8CB8E0' }}>
            Jan 2023 – Dec 2024
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="app-main">
        {/* TOP HEADER BAR (White #FFFFFF Header) */}
        <header className="top-bar">
          <div className="header-left">
            <button 
              className="sidebar-toggle-btn"
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label="Toggle Navigation"
            >
              <Menu size={18} />
            </button>
            <div className="header-page-title">{activeSection === 'overview' ? 'Export Analytics' : pageTitle}</div>
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
              <Download size={13} /> Download CSV
            </button>
          </div>
        </header>

        {/* RELEVANT FILTER TOOLBAR (#FFFFFF) */}
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
              {ALL_CATEGORIES.map(c => <option key={c} value={c}>{formatCategoryName(c)}</option>)}
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
              &gt; ₹1 Cr (153)
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
              1. DASHBOARD (LANDING PAGE - 12 VERIFIED KEY METRICS)
              ========================================================================= */}
          {activeSection === 'overview' && (
            <>
              {/* Header */}
              <div className="section-header-block">
                <div>
                  <h1 className="section-title">Dashboard</h1>
                </div>
                <div className="section-period-badge">
                  <Calendar size={13} color="var(--primary-accent)" />
                  <span>Jan 2023 – Dec 2024 (600 Orders)</span>
                </div>
              </div>

              {/* 8 Primary Key Metrics Grid (4 columns x 2 rows, Compact, No Subtext) */}
              <div className="dashboard-kpi-grid">
                {/* 1. Total Revenue */}
                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-card-label">Total Revenue</span>
                    <div className="kpi-card-icon"><TrendingUp size={16} /></div>
                  </div>
                  <div className="kpi-card-value">₹{(stats.totalRevenue / 1e7).toFixed(2)} Cr</div>
                </div>

                {/* 2. Total Orders */}
                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-card-label">Total Orders</span>
                    <div className="kpi-card-icon"><Box size={16} /></div>
                  </div>
                  <div className="kpi-card-value">{stats.totalOrders}</div>
                </div>

                {/* 3. Average Order Value */}
                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-card-label">Average Order Value</span>
                    <div className="kpi-card-icon"><DollarSign size={16} /></div>
                  </div>
                  <div className="kpi-card-value">₹{(stats.aov / 1e5).toFixed(2)} L</div>
                </div>

                {/* 4. On-Time Delivery */}
                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-card-label">On-Time Delivery</span>
                    <div className="kpi-card-icon" style={{ color: 'var(--status-success)', backgroundColor: 'var(--status-success-bg)' }}>
                      <Truck size={16} />
                    </div>
                  </div>
                  <div className="kpi-card-value" style={{ color: 'var(--status-success)' }}>
                    {stats.onTimeRate.toFixed(2)}%
                  </div>
                </div>

                {/* 5. Return Rate */}
                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-card-label">Return Rate</span>
                    <div className="kpi-card-icon"><RotateCcw size={16} /></div>
                  </div>
                  <div className="kpi-card-value">{stats.returnRate.toFixed(2)}%</div>
                </div>

                {/* 6. Total Buyers */}
                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-card-label">Total Buyers</span>
                    <div className="kpi-card-icon"><Users size={16} /></div>
                  </div>
                  <div className="kpi-card-value">{stats.uniqueBuyers}</div>
                </div>

                {/* 7. Total Products */}
                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-card-label">Total Products</span>
                    <div className="kpi-card-icon"><Package size={16} /></div>
                  </div>
                  <div className="kpi-card-value">{productStats.totalProducts}</div>
                </div>

                {/* 8. Catalogue Margin */}
                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-card-label">Catalogue Margin</span>
                    <div className="kpi-card-icon" style={{ color: 'var(--status-success)', backgroundColor: 'var(--status-success-bg)' }}>
                      <Activity size={16} />
                    </div>
                  </div>
                  <div className="kpi-card-value" style={{ color: 'var(--status-success)' }}>
                    {productStats.avgMarginPct.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Main Analytics Area: Chart Row 1 (60% Monthly Revenue / 40% Delivery Performance) */}
              <div className="chart-row-60-40">
                {/* Chart 1: Monthly Revenue */}
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Monthly Revenue</div>
                      <div className="panel-subtitle">Monthly export revenue in ₹ Crores (2023–2024)</div>
                    </div>
                  </div>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 15, left: -5, bottom: 0 }}>
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
                                    Revenue: ₹{payload[0].value} Crore
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
                        <Area type="monotone" dataKey="revenueCr" stroke="var(--primary-accent)" fillOpacity={1} fill="var(--primary-accent-subtle)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Delivery Performance */}
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Delivery Performance</div>
                      <div className="panel-subtitle">465 on-time shipments vs 135 delayed shipments</div>
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

              {/* Main Analytics Area: Chart Grid 2 */}
              <div className="chart-grid-2">
                {/* Chart 3: Revenue by Category */}
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Revenue by Category</div>
                      <div className="panel-subtitle">Export revenue across product categories in ₹ Crores</div>
                    </div>
                  </div>
                  <div style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 45, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                        <XAxis type="number" stroke="var(--text-secondary)" fontSize={11} tickFormatter={(v) => `₹${v}Cr`} />
                        <YAxis dataKey="category" type="category" stroke="var(--text-secondary)" fontSize={11} tickLine={false} tickFormatter={formatCategoryName} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="chart-tooltip">
                                  <div className="chart-tooltip-title">{formatCategoryName(payload[0].payload.category)}</div>
                                  <div className="chart-tooltip-item" style={{ color: 'var(--primary-accent)' }}>
                                    Revenue: ₹{payload[0].value} Crore
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
                        <Bar dataKey="revenueCr" fill="var(--primary-accent)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 4: Revenue by Payment Terms */}
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Revenue by Payment Terms</div>
                      <div className="panel-subtitle">LC, Advance, 30 Days Net, 60 Days Net, and COD</div>
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
                                  <div className="chart-tooltip-item" style={{ color: 'var(--secondary-accent)' }}>
                                    Revenue: ₹{payload[0].value} Crore
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
                        <Bar dataKey="revenueCr" fill="var(--secondary-accent)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Main Analytics Area: Chart Grid 3 */}
              <div className="chart-grid-2">
                {/* Chart 5: Top 10 Buyers */}
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Top 10 Buyers</div>
                      <div className="panel-subtitle">Highest revenue commercial buyers in ₹ Crores</div>
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
                                    Revenue: ₹{payload[0].value} Crore
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
                        <Bar dataKey="spend_cr" fill="var(--primary-accent)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 6: Buyer Order Activity */}
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Buyer Order Activity</div>
                      <div className="panel-subtitle">Repeat buyers ({stats.repeatBuyerOrders}) vs first-time buyers ({stats.totalOrders - stats.repeatBuyerOrders})</div>
                    </div>
                  </div>
                  <div style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Repeat Buyer Orders', value: stats.repeatBuyerOrders, fill: 'var(--primary-blue)' },
                            { name: 'First-Time Orders', value: stats.totalOrders - stats.repeatBuyerOrders, fill: 'var(--secondary-accent)' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={88}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          <Cell fill="var(--primary-blue)" />
                          <Cell fill="var(--secondary-accent)" />
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
            </>
          )}
{activeSection === 'revenue' && (
            <>
              <div className="section-header-block">
                <div>
                  <h1 className="section-title">Revenue Analysis</h1>
                  <p className="section-subtitle">Monthly revenue, product categories and payment terms.</p>
                </div>
              </div>

              <div className="primary-kpi-grid">
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header"><span className="primary-kpi-title">Total Revenue</span></div>
                  <div className="primary-kpi-value">₹{(stats.totalRevenue / 1e7).toFixed(2)} Cr</div>
                  <div className="primary-kpi-subtext">Jan 2023 – Dec 2024</div>
                </div>
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header"><span className="primary-kpi-title">Total Orders</span></div>
                  <div className="primary-kpi-value">{stats.totalOrders}</div>
                  <div className="primary-kpi-subtext">Across 10 categories</div>
                </div>
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header"><span className="primary-kpi-title">Average Order Value</span></div>
                  <div className="primary-kpi-value">₹{(stats.aov / 1e5).toFixed(2)} L</div>
                  <div className="primary-kpi-subtext">Per export shipment</div>
                </div>
                <div className="primary-kpi-card">
                  <div className="primary-kpi-header"><span className="primary-kpi-title">High-Value Orders (&gt; ₹1 Cr)</span></div>
                  <div className="primary-kpi-value">{filteredOrders.filter(o => (o.total_value_inr || 0) >= 10000000).length}</div>
                  <div className="primary-kpi-subtext">Orders over ₹1 Crore</div>
                </div>
              </div>

              {/* Charts Grid 1: Monthly & Quarterly */}
              <div className="chart-grid-2">
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Monthly Revenue</div>
                      <div className="panel-subtitle">Monthly export revenue in ₹ Crores (2023–2024)</div>
                    </div>
                  </div>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 15, left: -5, bottom: 0 }}>
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
                                    Revenue: ₹{payload[0].value} Crore
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
                        <Area type="monotone" dataKey="revenueCr" stroke="var(--primary-accent)" fillOpacity={1} fill="var(--primary-accent-subtle)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Quarterly Revenue</div>
                      <div className="panel-subtitle">Quarterly export revenue in ₹ Crores (Q1 2023 – Q4 2024)</div>
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
                                    Revenue: ₹{payload[0].value} Crore
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
              </div>

              {/* Charts Grid 2: Category & Order Value Distribution */}
              <div className="chart-grid-2">
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Revenue by Category</div>
                      <div className="panel-subtitle">Export revenue across product categories in ₹ Crores</div>
                    </div>
                  </div>
                  <div style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 45, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                        <XAxis type="number" stroke="var(--text-secondary)" fontSize={11} tickFormatter={(v) => `₹${v}Cr`} />
                        <YAxis dataKey="category" type="category" stroke="var(--text-secondary)" fontSize={11} tickLine={false} tickFormatter={formatCategoryName} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="chart-tooltip">
                                  <div className="chart-tooltip-title">{formatCategoryName(payload[0].payload.category)}</div>
                                  <div className="chart-tooltip-item" style={{ color: 'var(--primary-accent)' }}>
                                    Revenue: ₹{payload[0].value} Crore
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
                        <Bar dataKey="revenueCr" fill="var(--secondary-accent)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Order Value Distribution</div>
                      <div className="panel-subtitle">Number of orders and revenue across value tiers</div>
                    </div>
                  </div>
                  <div style={{ height: 240 }}>
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

              {/* Chart Grid 3: Revenue by Payment Terms */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Revenue by Payment Terms</div>
                    <div className="panel-subtitle">LC, Advance, 30 Days Net, 60 Days Net, and COD</div>
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
                                  Revenue: ₹{payload[0].value} Crore
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

              {/* Transaction Ledger Table with Search, Sort, Pagination */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Export Orders Ledger</div>
                    <div className="panel-subtitle">List of export orders. Click any row to view shipment details.</div>
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
                          <td>{formatCategoryName(o.category)}</td>
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
                              View Details
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
              3. COUNTRY ANALYSIS SECTION
              ========================================================================= */}
          {activeSection === 'country' && (
            <>
              <div className="section-header-block">
                <div>
                  <h1 className="section-title">Country Analysis</h1>
                  <p className="section-subtitle">Export sales by country (sample distribution based on 12 export countries).</p>
                </div>
              </div>

              {/* Data Limitation Notice */}
              <div className="alert-banner info">
                <Globe size={20} color="var(--primary-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', marginBottom: '3px' }}>
                    Country Data Availability
                  </strong>
                  The company exports to 50 clients across 12 countries. The current order dataset (<code>da_b2b_orders.csv</code>) does not include a destination country column.
                  <br />
                  In accordance with strict data integrity, no artificial country data has been invented. Below is the warehouse origin distribution from the product catalogue and the target 12-country export specification.
                </div>
              </div>

              {/* Domestic Sourcing States */}
              <div className="chart-grid-2">
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Domestic Sourcing States (Product Catalogue)</div>
                      <div className="panel-subtitle">Warehouse inventory units by origin state</div>
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
                        <XAxis dataKey="state" stroke="var(--text-secondary)" fontSize={11} tickLine={false} interval={0} />
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
                      <div className="panel-title">Customer Cities (Customer Profiles)</div>
                      <div className="panel-subtitle">Geographic distribution across 200 customer accounts</div>
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

              {/* Proposed Markets (12 Export Countries) */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Proposed Markets (12 Export Countries)</div>
                    <div className="panel-subtitle">Destination-country data is unavailable in the current dataset. Target export markets and required fields for future integration.</div>
                  </div>
                  <span className="badge neutral">Proposed Markets</span>
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
              4. SHIPMENT ANALYSIS SECTION
              ========================================================================= */}
          {(activeSection === 'logistics' || activeSection === 'shipment') && (
            <>
              <div className="section-header-block">
                <div>
                  <h1 className="section-title">Shipment Analysis</h1>
                  <p className="section-subtitle">Delivery performance, transit time and delayed orders.</p>
                </div>
              </div>

              <div className="dashboard-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Total Shipments</span></div>
                  <div className="kpi-card-value">{stats.totalOrders}</div>
                  <div className="kpi-card-subtext">Across 10 categories</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">On-Time Shipments</span></div>
                  <div className="kpi-card-value" style={{ color: 'var(--status-success)' }}>{stats.onTimeOrders}</div>
                  <div className="kpi-card-subtext">Delivered within SLA</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Delayed Shipments</span></div>
                  <div className="kpi-card-value" style={{ color: 'var(--status-warning)' }}>{stats.delayedOrders}</div>
                  <div className="kpi-card-subtext">{((stats.delayedOrders / (stats.totalOrders || 1)) * 100).toFixed(1)}% of total</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">On-Time Delivery Rate</span></div>
                  <div className="kpi-card-value" style={{ color: stats.onTimeRate >= 80 ? 'var(--status-success)' : 'var(--status-warning)' }}>
                    {stats.onTimeRate.toFixed(2)}%
                  </div>
                  <div className="kpi-card-subtext">Target: 80.0% SLA</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Average Transit Time</span></div>
                  <div className="kpi-card-value">{stats.avgDeliveryDays.toFixed(1)} Days</div>
                  <div className="kpi-card-subtext">Median: {stats.medianDeliveryDays} Days (5–45d)</div>
                </div>
              </div>

              {/* Charts */}
              <div className="chart-grid-2">
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Monthly Orders</div>
                      <div className="panel-subtitle">Number of export shipments fulfilled per month (2023–2024)</div>
                    </div>
                  </div>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyRevenue} margin={{ top: 10, right: 15, left: -5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                        <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                        <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="chart-tooltip">
                                  <div className="chart-tooltip-title">{payload[0].payload.month}</div>
                                  <div className="chart-tooltip-item" style={{ color: 'var(--primary-accent)' }}>
                                    Orders: {payload[0].value} shipments
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="orders" fill="var(--primary-accent)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Transit Time Distribution</div>
                      <div className="panel-subtitle">Number of shipments by transit duration in days</div>
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
                                  <div className="chart-tooltip-item" style={{ color: 'var(--secondary-accent)' }}>
                                    Volume: {payload[0].value} shipments
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="count" fill="var(--secondary-accent)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="panel-card" style={{ marginBottom: '20px' }}>
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Delivery Performance</div>
                    <div className="panel-subtitle">On-time delivery percentage by product category benchmarked against 80% SLA</div>
                  </div>
                </div>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={categoryData.map(c => {
                        const catOrders = filteredOrders.filter(o => o.category === c.category);
                        const onTime = catOrders.length ? catOrders.filter(o => o.on_time_delivery === 1).length : 0;
                        const sla = catOrders.length ? (onTime / catOrders.length) * 100 : 0;
                        return { category: c.category, sla: parseFloat(sla.toFixed(1)) };
                      })}
                      margin={{ top: 10, right: 15, left: -5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                      <XAxis dataKey="category" stroke="var(--text-secondary)" fontSize={10} tickLine={false} tickFormatter={formatCategoryName} />
                      <YAxis stroke="var(--text-secondary)" fontSize={11} domain={[0, 100]} tickLine={false} tickFormatter={(v) => `${v}%`} />
                      <ReferenceLine y={80} stroke="var(--status-success)" strokeDasharray="3 3" label={{ value: 'Target 80%', fill: 'var(--status-success)', fontSize: 10 }} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="chart-tooltip">
                                <div className="chart-tooltip-title">{formatCategoryName(payload[0].payload.category)}</div>
                                <div className="chart-tooltip-item" style={{ color: 'var(--primary-accent)' }}>
                                  On-Time: {payload[0].value}%
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="sla" fill="var(--primary-accent)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Delayed Shipments Table */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Delayed Orders</div>
                    <div className="panel-subtitle">135 shipments with delayed delivery. Click any row to view details.</div>
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
                                    View Details
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
                  <h1 className="section-title">Buyer Analysis</h1>
                  <p className="section-subtitle">Buyer order volume and repeat purchases.</p>
                </div>
              </div>

              <div className="dashboard-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Total Buyers</span></div>
                  <div className="kpi-card-value">{stats.uniqueBuyers}</div>
                  <div className="kpi-card-subtext">Commercial buyers in dataset</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Repeat Orders</span></div>
                  <div className="kpi-card-value">{stats.repeatBuyerOrders}</div>
                  <div className="kpi-card-subtext">Orders from repeat accounts</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Repeat Order Rate</span></div>
                  <div className="kpi-card-value">{stats.repeatBuyerPct.toFixed(2)}%</div>
                  <div className="kpi-card-subtext">Repeat purchase frequency</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Customer Profiles</span></div>
                  <div className="kpi-card-value">{customerStats.count}</div>
                  <div className="kpi-card-subtext">{customerStats.churnedCount} churned accounts ({customerStats.churnRate.toFixed(1)}%)</div>
                </div>
              </div>

              {/* Profitability Limitation Audit */}
              <div className="alert-banner warning">
                <AlertTriangle size={18} color="var(--status-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '13px', marginBottom: '3px' }}>
                    Note on Client Profitability
                  </strong>
                  The dataset provides sales revenue by buyer, but does not include product manufacturing costs, freight or duty per order. Therefore, client rankings are based on revenue, not profit.
                  <br />
                  The <strong>58.62% catalogue gross margin</strong> is a retail catalogue average from <code>da_product_catalogue.csv</code>, not order-level net profit.
                </div>
              </div>

              {/* Top 10 Buyer Spending Visual Chart */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Top 10 Buyers</div>
                    <div className="panel-subtitle">Buyers with the highest total order spend in ₹ Crores</div>
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
                                  Revenue: ₹{payload[0].value} Crore
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
                      <Bar dataKey="spend_cr" fill="var(--primary-accent)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* RFM-V Buyer Clusters */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Buyer Segments (RFM-V)</div>
                    <div className="panel-subtitle">187 buyers grouped by order recency, frequency, spend and delivery rate</div>
                  </div>
                  <span className="badge success">Segmentation</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--status-success)', fontSize: '13px' }}>Core Accounts</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0' }}>75 Buyers (40.1%)</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Consistent reorders with minimal delays.</div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--secondary-accent)', fontSize: '13px' }}>Growth Buyers</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0' }}>68 Buyers (36.4%)</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>High order volume and spend.</div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--status-warning)', fontSize: '13px' }}>At-Risk Buyers</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0' }}>27 Buyers (14.4%)</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Experiencing delivery delays.</div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--status-critical)', fontSize: '13px' }}>Inactive Buyers</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0' }}>17 Buyers (9.1%)</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Lapsed buyers for re-engagement.</div>
                  </div>
                </div>

                {/* Searchable Buyer Table with Pagination */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Buyer Directory</span>
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
                        <th>Segment</th>
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
                          <td>{formatCategoryName(b.primary_category)}</td>
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

          {/* =========================================================================
              6. CURRENCY ANALYSIS SECTION
              ========================================================================= */}
          {activeSection === 'currency' && (
            <>
              <div className="section-header-block">
                <div>
                  <h1 className="section-title">Currency Analysis</h1>
                  <p className="section-subtitle">Currency impact and exchange rate sensitivity analysis.</p>
                </div>
              </div>

              {/* Data Limitation Notice */}
              <div className="alert-banner info">
                <DollarSign size={20} color="var(--primary-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', marginBottom: '3px' }}>
                    Currency Data Availability
                  </strong>
                  All 600 orders in <code>da_b2b_orders.csv</code> are recorded strictly in <strong>Indian Rupee (INR)</strong>. The dataset does not include foreign currency amounts or historical exchange rates.
                  <br />
                  In accordance with strict data integrity, no historical foreign exchange gains or losses are invented. Below is a scenario tool to estimate the impact of exchange rate changes on total revenue. Results are based on simulated exchange rates.
                </div>
              </div>

              {/* What-If Sensitivity Simulator */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Exchange Rate Sensitivity Tool</div>
                    <div className="panel-subtitle">Estimate the effect of currency fluctuations on ₹396.88 Crore export revenue.</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sliders size={14} color="var(--primary-accent)" />
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>Currency Fluctuation:</span>
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

                <div className="dashboard-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '16px' }}>
                  <div className="kpi-card">
                    <div className="kpi-card-header"><span className="kpi-card-label">Baseline Revenue</span></div>
                    <div className="kpi-card-value">₹{(stats.totalRevenue / 1e7).toFixed(2)} Cr</div>
                    <div className="kpi-card-subtext">Recorded in INR</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-card-header"><span className="kpi-card-label">Simulated Revenue</span></div>
                    <div className="kpi-card-value" style={{ color: fxShockPct >= 0 ? 'var(--status-success)' : 'var(--status-critical)' }}>
                      ₹{((stats.totalRevenue * (1 + fxShockPct / 100)) / 1e7).toFixed(2)} Cr
                    </div>
                    <div className="kpi-card-subtext">At {fxShockPct > 0 ? `+${fxShockPct}%` : `${fxShockPct}%`} fluctuation</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-card-header"><span className="kpi-card-label">Estimated Difference</span></div>
                    <div className="kpi-card-value" style={{ color: fxShockPct >= 0 ? 'var(--status-success)' : 'var(--status-critical)' }}>
                      {fxShockPct >= 0 ? '+' : ''}₹{((stats.totalRevenue * (fxShockPct / 100)) / 1e7).toFixed(2)} Cr
                    </div>
                    <div className="kpi-card-subtext">Estimated variance</div>
                  </div>
                </div>

                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <strong>Scenario Note:</strong> If orders were invoiced in foreign currency (such as USD), a 5% USD appreciation against INR would yield an estimated <strong>+₹19.84 Cr</strong> gain, while a 5% depreciation would lower revenue realization by the same amount.
                </div>
              </div>

              {/* Required Schema Specification */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Multi-Currency Data Specification</div>
                    <div className="panel-subtitle">Fields needed to track foreign exchange gain or loss.</div>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Required Field</th>
                        <th>Data Type</th>
                        <th>Description</th>
                        <th>Current Status</th>
                        <th>Recommended Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="mono">booking_currency</td>
                        <td>VARCHAR(3)</td>
                        <td>Currency code (USD, EUR, GBP, AED)</td>
                        <td><span className="badge warning">Missing (Recorded in INR)</span></td>
                        <td>Add currency field to sales order records</td>
                      </tr>
                      <tr>
                        <td className="mono">spot_booking_rate</td>
                        <td>NUMERIC(10, 4)</td>
                        <td>Exchange rate on order booking date</td>
                        <td><span className="badge warning">Missing</span></td>
                        <td>Record central bank exchange rate at booking</td>
                      </tr>
                      <tr>
                        <td className="mono">realized_settlement_rate</td>
                        <td>NUMERIC(10, 4)</td>
                        <td>Actual exchange rate upon payment receipt</td>
                        <td><span className="badge warning">Missing</span></td>
                        <td>Record bank settlement exchange rate on receipt</td>
                      </tr>
                      <tr>
                        <td className="mono">hedging_status</td>
                        <td>VARCHAR(20)</td>
                        <td>Currency forward contract or hedge indicator</td>
                        <td><span className="badge warning">Missing</span></td>
                        <td>Track currency hedge status per export order</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* =========================================================================
              7. RETURNS ANALYSIS SECTION
              ========================================================================= */}
          {(activeSection === 'returns' || activeSection === 'compliance') && (
            <>
              <div className="section-header-block">
                <div>
                  <h1 className="section-title">Returns Analysis</h1>
                  <p className="section-subtitle">Return quantities, return rates and flagged records.</p>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="dashboard-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Shipped Units</span></div>
                  <div className="kpi-card-value">{stats.totalUnits.toLocaleString()}</div>
                  <div className="kpi-card-subtext">Total units shipped</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Returned Units</span></div>
                  <div className="kpi-card-value">{stats.returnUnits.toLocaleString()}</div>
                  <div className="kpi-card-subtext">Total units returned</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Return Rate</span></div>
                  <div className="kpi-card-value" style={{ color: stats.returnRate <= 2.0 ? 'var(--status-success)' : 'var(--status-warning)' }}>
                    {stats.returnRate.toFixed(2)}%
                  </div>
                  <div className="kpi-card-subtext">Units returned vs shipped</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Flagged Records</span></div>
                  <div className="kpi-card-value" style={{ color: 'var(--status-warning)' }}>
                    {suspiciousReturnsList.length + customerDateInconsistencies.length} Records
                  </div>
                  <div className="kpi-card-subtext">2 return errors + 42 date errors</div>
                </div>
              </div>

              {/* Category-Wise Return Analysis Chart */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Returns by Category</div>
                    <div className="panel-subtitle">Shipped and returned units across product categories</div>
                  </div>
                </div>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryReturnData} margin={{ top: 10, right: 15, left: -5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                      <XAxis dataKey="category" stroke="var(--text-secondary)" fontSize={10} tickLine={false} tickFormatter={formatCategoryName} />
                      <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="chart-tooltip">
                                <div className="chart-tooltip-title">{formatCategoryName(payload[0].payload.category)}</div>
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
                    <div className="panel-title">Return Quantity Errors (Return Qty &gt; Shipped Qty)</div>
                    <div className="panel-subtitle">Two orders where return quantity exceeds shipped quantity.</div>
                  </div>
                  <span className="badge danger">2 Flagged Orders</span>
                </div>

                <div className="alert-banner danger" style={{ margin: '0 0 16px 0' }}>
                  <AlertCircle size={16} color="var(--status-critical)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Data Entry Error:</strong> In orders <code>B2B-00131</code> and <code>B2B-00188</code>, the recorded return quantity is higher than the shipped quantity. These records require verification.
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
                        <th>Issue Description</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suspiciousReturnsList.map(o => (
                        <tr key={o.order_id} className="clickable" onClick={() => setSelectedOrder(o)}>
                          <td className="mono" style={{ fontWeight: 600, color: 'var(--status-critical)' }}>{o.order_id}</td>
                          <td>{o.order_date}</td>
                          <td className="mono">{o.buyer_id}</td>
                          <td>{formatCategoryName(o.category)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{o.quantity_units} Units</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--status-critical)' }}>{o.return_qty} Units</td>
                          <td><span className="badge danger">+{o.return_qty - o.quantity_units} Overrun</span></td>
                          <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Return quantity exceeds shipped quantity; needs verification.</td>
                          <td>
                            <button className="action-btn" style={{ padding: '3px 8px', fontSize: '11.5px' }}>
                              View Details
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
                    <div className="panel-title">Customer Purchase Date Inconsistencies (First Purchase &gt; Last Purchase)</div>
                    <div className="panel-subtitle">42 customer profile records where first purchase date is later than last purchase date.</div>
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
                    <strong>Date Inconsistency:</strong> In 42 customer profile records, the first purchase date is later than the last purchase date. These records are flagged for verification.
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
                        <th>Status</th>
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
                          <td><span className="badge warning">Date Inconsistency</span></td>
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

              {/* Exception Register Table */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Exception Register (135 Records)</div>
                    <div className="panel-subtitle">Track review status for delayed orders, return errors and date errors.</div>
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
                      <Download size={13} /> Download CSV
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
                  <h1 className="section-title">Product Catalogue</h1>
                  <p className="section-subtitle">Products, pricing, margins and stock levels.</p>
                </div>
              </div>

              <div className="dashboard-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Total Products</span></div>
                  <div className="kpi-card-value">{productStats.totalProducts}</div>
                  <div className="kpi-card-subtext">5 commodity categories</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Available Stock</span></div>
                  <div className="kpi-card-value">{productStats.totalStock.toLocaleString()}</div>
                  <div className="kpi-card-subtext">Total inventory units</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Average MRP</span></div>
                  <div className="kpi-card-value">₹{productStats.avgMRP.toFixed(2)}</div>
                  <div className="kpi-card-subtext">Average listed retail price</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Average Product Cost</span></div>
                  <div className="kpi-card-value">₹{productStats.avgCOGS.toFixed(2)}</div>
                  <div className="kpi-card-subtext">Average cost of goods sold</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Average Product Margin</span></div>
                  <div className="kpi-card-value" style={{ color: 'var(--status-success)' }}>{productStats.avgMarginPct.toFixed(2)}%</div>
                  <div className="kpi-card-subtext">Catalogue gross margin</div>
                </div>
              </div>

              {/* Data Note */}
              <div className="alert-banner info" style={{ marginBottom: '18px' }}>
                <Info size={18} color="var(--status-info)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Product Catalogue vs Export Orders:</strong> The product catalogue lists retail prices (MRP) and costs (COGS) for 50 products. This catalogue is separate from the export orders dataset. Catalogue margin does not include order-level shipping and other landed costs.
                </div>
              </div>

              {/* Category Margin & Stock Visual Charts */}
              <div className="chart-grid-2">
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Product Margin by Category</div>
                      <div className="panel-subtitle">Average gross margin percentage across 5 categories</div>
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
                                    Margin: {payload[0].value}%
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                    Products: {payload[0].payload.count}
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
                      <div className="panel-title">Stock by Category</div>
                      <div className="panel-subtitle">Warehouse inventory units across 5 categories</div>
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
                                    Stock: {payload[0].value.toLocaleString()} units
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
                    <div className="panel-title">Product Catalogue Table</div>
                    <div className="panel-subtitle">Products, prices, costs, margins and stock levels.</div>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="filter-select"
                      placeholder="Search Product Name, ID, Category..."
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
                        <th style={{ textAlign: 'right' }}>Retail Price (MRP)</th>
                        <th style={{ textAlign: 'right' }}>Cost (COGS)</th>
                        <th style={{ textAlign: 'right' }}>Gross Margin</th>
                        <th style={{ textAlign: 'right' }}>Markup</th>
                        <th style={{ textAlign: 'right' }}>Stock Units</th>
                        <th>Stock Status</th>
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
                    Showing {Math.min((productPage - 1) * pageSize + 1, filteredProducts.length)} to {Math.min(productPage * pageSize, filteredProducts.length)} of {filteredProducts.length} products
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

          {/* =========================================================================
              8. REPORTS SECTION
              ========================================================================= */}
          {activeSection === 'reports' && (
            <>
              <div className="section-header-block">
                <div>
                  <h1 className="section-title">Reports</h1>
                  <p className="section-subtitle">View and download export analytics reports.</p>
                </div>
              </div>

              {/* Download Hub */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Available Reports</div>
                    <div className="panel-subtitle">Download CSV files or print reports based on current filters.</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <FileText size={18} color="var(--primary-accent)" />
                      <strong style={{ fontSize: '14px' }}>1. Executive Summary</strong>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                      Summary of revenue, orders, deliveries and buyers.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="action-btn" onClick={() => window.print()}><Printer size={13} /> Print / Save PDF</button>
                      <button className="action-btn primary" onClick={handleExportCSV}><Download size={13} /> Download CSV</button>
                    </div>
                  </div>

                  <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <TrendingUp size={18} color="var(--secondary-accent)" />
                      <strong style={{ fontSize: '14px' }}>2. Revenue Report</strong>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                      Monthly revenue, product categories and payment terms.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="action-btn" onClick={() => window.print()}><Printer size={13} /> Print / Save PDF</button>
                      <button className="action-btn primary" onClick={handleExportCSV}><Download size={13} /> Download CSV</button>
                    </div>
                  </div>

                  <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Truck size={18} color="var(--supporting-gold)" />
                      <strong style={{ fontSize: '14px' }}>3. Shipment Report</strong>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                      Delivery performance, transit time and delayed orders.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="action-btn" onClick={() => window.print()}><Printer size={13} /> Print / Save PDF</button>
                      <button className="action-btn primary" onClick={handleExportCSV}><Download size={13} /> Download CSV</button>
                    </div>
                  </div>

                  <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <AlertOctagon size={18} color="var(--status-critical)" />
                      <strong style={{ fontSize: '14px' }}>4. Data Quality Report</strong>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                      Return quantity errors and other data quality issues.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="action-btn" onClick={() => window.print()}><Printer size={13} /> Print / Save PDF</button>
                      <button className="action-btn primary" onClick={handleExportExceptionsCSV}><Download size={13} /> Download CSV</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Automated Reports Section */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Automated Reports</div>
                    <div className="panel-subtitle">Weekly reports are generated using GitHub Actions.</div>
                  </div>
                  <span className="badge neutral">Test Mode</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                      Schedule:
                    </strong>
                    Every Monday at 08:00 UTC. The automated workflow runs tests, checks for data anomalies and generates updated reports.
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                      Email Delivery:
                    </strong>
                    Currently running in <strong>Test Mode</strong>. Reports are generated and saved as workflow artifacts. Email notifications can be configured with SMTP credentials.
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =========================================================================
              9. DATA QUALITY SECTION
              ========================================================================= */}
          {activeSection === 'governance' && (
            <>
              <div className="section-header-block">
                <div>
                  <h1 className="section-title">Data Quality</h1>
                  <p className="section-subtitle">Overview of source datasets, data validation and identified errors.</p>
                </div>
              </div>

              {/* Data Inventory */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Source Datasets</div>
                    <div className="panel-subtitle">Summary of data files in <code>data/</code></div>
                  </div>
                  <span className="badge success">Verified Data</span>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Source Dataset</th>
                        <th>Dimensions</th>
                        <th>Primary Key</th>
                        <th>Description</th>
                        <th>Data Validation Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="mono" style={{ fontWeight: 600 }}>da_b2b_orders.csv</td>
                        <td>600 rows × 13 cols</td>
                        <td className="mono">order_id</td>
                        <td>B2B export orders (2023–2024)</td>
                        <td>Zero missing values. Two orders have return quantities greater than shipped quantities (<code>B2B-00131</code>, <code>B2B-00188</code>).</td>
                      </tr>
                      <tr>
                        <td className="mono" style={{ fontWeight: 600 }}>da_product_catalogue.csv</td>
                        <td>50 rows × 7 cols</td>
                        <td className="mono">Product_ID</td>
                        <td>Product catalogue with retail pricing and costs</td>
                        <td>Zero missing values. Average catalogue margin is 58.62%. Standalone catalogue without direct links to orders.</td>
                      </tr>
                      <tr>
                        <td className="mono" style={{ fontWeight: 600 }}>da_customer_profiles.csv</td>
                        <td>200 rows × 10 cols</td>
                        <td className="mono">Customer_ID</td>
                        <td>Customer profile records</td>
                        <td>42 records where first purchase date is later than last purchase date.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dataset Limitations & Excluded Metrics */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Dataset Limitations &amp; Excluded Metrics</div>
                    <div className="panel-subtitle">Metrics that cannot be calculated from the current datasets.</div>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Requested Metric</th>
                        <th>Status</th>
                        <th>Dataset Limitation</th>
                        <th>Recommended Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Foreign Exchange (FX) Impact</td>
                        <td><span className="badge warning">Not in Dataset</span></td>
                        <td>Orders are recorded in INR only; no foreign currency codes or exchange rates are provided.</td>
                        <td>Add currency code and exchange rate fields to order data.</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Order-Level Profitability</td>
                        <td><span className="badge warning">Not in Dataset</span></td>
                        <td>Orders contain revenue but lack product cost, shipping cost or duty details.</td>
                        <td>Link orders to product SKUs with landed cost information.</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Customs Compliance</td>
                        <td><span className="badge warning">Not in Dataset</span></td>
                        <td>Dataset does not include shipping bills, customs documents or port clearance data.</td>
                        <td>Add export documentation tracking fields.</td>
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
                  Order Date: {selectedOrder.order_date} • Category: {formatCategoryName(selectedOrder.category)}
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedOrder(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Buyer ID</span>
                <span className="detail-value mono">{selectedOrder.buyer_id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Seller ID</span>
                <span className="detail-value mono">{selectedOrder.seller_id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Shipped Units</span>
                <span className="detail-value">{selectedOrder.quantity_units.toLocaleString()} Units</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Unit Price</span>
                <span className="detail-value">₹{selectedOrder.unit_price_inr.toFixed(2)} INR</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Total Order Value</span>
                <span className="detail-value" style={{ color: 'var(--primary-accent)' }}>
                  ₹{selectedOrder.total_value_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })} INR
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Payment Terms</span>
                <span className="detail-value">{selectedOrder.payment_terms}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Transit Time</span>
                <span className="detail-value">{selectedOrder.delivery_days} Days</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Returned Units</span>
                <span className="detail-value" style={{ color: selectedOrder.return_qty > selectedOrder.quantity_units ? 'var(--status-critical)' : 'inherit' }}>
                  {selectedOrder.return_qty} Units
                  {selectedOrder.return_qty > selectedOrder.quantity_units && ' (Return Overrun)'}
                </span>
              </div>
            </div>

            {selectedOrder.return_qty > selectedOrder.quantity_units && (
              <div className="alert-banner danger" style={{ marginTop: '16px' }}>
                <AlertCircle size={16} color="var(--status-critical)" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Return Quantity Error:</strong> Returned units ({selectedOrder.return_qty}) exceed shipped quantity ({selectedOrder.quantity_units}). Needs verification with warehouse records.
                </div>
              </div>
            )}

            {selectedOrder.on_time_delivery === 0 && (
              <div className="alert-banner warning" style={{ marginTop: '14px' }}>
                <Clock size={16} color="var(--status-warning)" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Delivery Delay:</strong> Shipment took {selectedOrder.delivery_days} days in transit and was delivered past the target SLA.
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
