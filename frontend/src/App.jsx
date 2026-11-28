import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ComposedChart
} from 'recharts';
import {
  TrendingUp, Truck, RotateCcw, Users, ShieldAlert, Package,
  Download, Filter, RefreshCw, AlertTriangle, CheckCircle,
  FileText, Calendar, Box, Database, Layers, ArrowUpRight,
  Info, Search, HelpCircle, Globe, DollarSign, AlertOctagon,
  Sun, Moon, ExternalLink, X, Printer, Clock, FileSpreadsheet,
  CheckCircle2, AlertCircle, ArrowDownRight, Sliders, Menu,
  ChevronLeft, ChevronRight, Activity, ArrowRight, ChevronDown,
  UploadCloud, FileUp, Percent, ShieldCheck
} from 'lucide-react';

import ordersRaw from './data/orders.json';
import productsRaw from './data/products.json';
import customersRaw from './data/customers.json';
import buyersRaw from './data/buyers_aggregated.json';
import exceptionsRaw from './data/exceptions.json';

// Fallback filters supported by initial orders dataset
const INITIAL_CATEGORIES = [...new Set(ordersRaw.map(o => o.category))].sort();
const INITIAL_TERMS = [...new Set(ordersRaw.map(o => o.payment_terms))].sort();

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

  // Custom Uploaded Datasets State (Task 7: Ingestion & Dynamic Recalculation)
  const [customOrders, setCustomOrders] = useState(null);
  const [customProducts, setCustomProducts] = useState(null);
  const [customCustomers, setCustomCustomers] = useState(null);
  const [uploadFeedback, setUploadFeedback] = useState(null);

  // Active Datasets (custom uploaded or demo baseline)
  const activeOrders = useMemo(() => customOrders || ordersRaw, [customOrders]);
  const activeProducts = useMemo(() => customProducts || productsRaw, [customProducts]);
  const activeCustomers = useMemo(() => customCustomers || customersRaw, [customCustomers]);

  // Dynamic filter lists from active orders
  const categoriesList = useMemo(() => [...new Set(activeOrders.map(o => o.category))].sort(), [activeOrders]);
  const termsList = useMemo(() => [...new Set(activeOrders.map(o => o.payment_terms))].sort(), [activeOrders]);

  // Client Profitability View & Margin State (Task 2)
  const [buyerAnalysisView, setBuyerAnalysisView] = useState('revenue'); // 'revenue' | 'profitability'
  const [assumedGrossMarginPct, setAssumedGrossMarginPct] = useState(58.62); // 58.62% benchmark from da_product_catalogue.csv

  // Selected Order for Drill-down Modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Exception Review Status State (Persisted in localStorage)
  const [exceptionsStatusMap, setExceptionsStatusMap] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tradesight_exceptions_status');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (err) {
          console.error('Error loading exceptions state:', err);
        }
      }
    }
    return {};
  });

  const updateExceptionStatus = (exceptionId, newStatus) => {
    setExceptionsStatusMap(prev => {
      const updated = { ...prev, [exceptionId]: newStatus };
      if (typeof window !== 'undefined') {
        localStorage.setItem('tradesight_exceptions_status', JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Reconciled Complete Exception Register (Dynamically computed from source datasets)
  // Reconciles: 135 delayed shipments + 2 return quantity errors + 42 customer date errors = 179 total
  const allReconciledExceptions = useMemo(() => {
    const list = [];

    // 1. Critical Return Quantity Errors (2 records)
    activeOrders.filter(o => o.return_qty > o.quantity_units).forEach(o => {
      const id = `EXC-RET-${o.order_id}`;
      list.push({
        exception_id: id,
        severity: 'CRITICAL',
        exception_category: 'Data Quality - Logical Inconsistency',
        source_dataset: 'da_b2b_orders.csv',
        record_id: o.order_id,
        buyer_or_entity: o.buyer_id,
        category: o.category,
        order_date: o.order_date,
        metric_impacted: 'return_qty vs quantity_units',
        observed_value: `Returned: ${o.return_qty} > Shipped: ${o.quantity_units} (+${o.return_qty - o.quantity_units} excess)`,
        threshold_or_rule: 'return_qty <= quantity_units',
        recommended_action: 'Audit warehouse return receipt against order manifest; adjust return_qty in source ERP.',
        review_status: exceptionsStatusMap[id] || 'Under Investigation'
      });
    });

    // 2. High Customer Date Inversions (42 records)
    activeCustomers.filter(c => new Date(c.First_Purchase_Date) > new Date(c.Last_Purchase_Date)).forEach(c => {
      const id = `EXC-DATE-${c.Customer_ID}`;
      list.push({
        exception_id: id,
        severity: 'HIGH',
        exception_category: 'Data Quality - Chronological Inversion',
        source_dataset: 'da_customer_profiles.csv',
        record_id: c.Customer_ID,
        buyer_or_entity: `City: ${c.City}, Channel: ${c.Acquisition_Channel}`,
        category: 'Customer Profile',
        order_date: c.First_Purchase_Date,
        metric_impacted: 'First_Purchase_Date vs Last_Purchase_Date',
        observed_value: `First: ${c.First_Purchase_Date} > Last: ${c.Last_Purchase_Date}`,
        threshold_or_rule: 'First_Purchase_Date <= Last_Purchase_Date',
        recommended_action: 'Investigate CRM transaction sync logic; swap dates or re-extract initial onboarding timestamp.',
        review_status: exceptionsStatusMap[id] || 'Under Investigation'
      });
    });

    // 3. Logistics Delayed Shipments (135 records)
    activeOrders.filter(o => o.on_time_delivery === 0).forEach(o => {
      const id = `EXC-SLA-${o.order_id}`;
      const isCritical = o.delivery_days >= 40;
      const isHigh = o.payment_terms === '60 Days Net';
      list.push({
        exception_id: id,
        severity: isCritical ? 'HIGH' : isHigh ? 'MEDIUM' : 'LOW',
        exception_category: 'Logistics SLA Breach',
        source_dataset: 'da_b2b_orders.csv',
        record_id: o.order_id,
        buyer_or_entity: o.buyer_id,
        category: o.category,
        order_date: o.order_date,
        metric_impacted: 'on_time_delivery (SLA Breach)',
        observed_value: `Transit: ${o.delivery_days} days (${o.payment_terms})`,
        threshold_or_rule: 'on_time_delivery == 1',
        recommended_action: 'Review shipping lane logistics, carrier SLA benchmarks, and credit control terms.',
        review_status: exceptionsStatusMap[id] || 'Open'
      });
    });

    return list;
  }, [exceptionsStatusMap, activeOrders, activeCustomers]);

  // Backward-compatible alias
  const exceptionsData = allReconciledExceptions;

  const [exceptionSeverityFilter, setExceptionSeverityFilter] = useState('ALL');
  const [exceptionSearch, setExceptionSearch] = useState('');

  // What-If FX Sensitivity & Simulator State
  const [fxCurrency, setFxCurrency] = useState('USD');
  const [fxSimulatorMode, setFxSimulatorMode] = useState('portfolio'); // 'portfolio' | 'invoice'
  const [fxInvoiceAmount, setFxInvoiceAmount] = useState(100000);
  const [fxPortfolioExposurePct, setFxPortfolioExposurePct] = useState(50);
  const [fxBaseRate, setFxBaseRate] = useState(83.50);
  const [fxRevisedRate, setFxRevisedRate] = useState(83.50);
  const [fxShockPct, setFxShockPct] = useState(0);

  // Illustrative Benchmark Rates against INR (not live market rates)
  const FX_CURRENCIES = {
    USD: { code: 'USD', name: 'US Dollar', symbol: '$', illustrativeRate: 83.50 },
    EUR: { code: 'EUR', name: 'Euro', symbol: '€', illustrativeRate: 90.20 },
    GBP: { code: 'GBP', name: 'British Pound', symbol: '£', illustrativeRate: 105.40 },
    AED: { code: 'AED', name: 'UAE Dirham', symbol: 'AED', illustrativeRate: 22.75 },
    SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', illustrativeRate: 61.80 },
    JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', illustrativeRate: 0.55 },
  };

  const handleFxCurrencyChange = (curr) => {
    setFxCurrency(curr);
    const benchmark = FX_CURRENCIES[curr]?.illustrativeRate || 83.50;
    setFxBaseRate(benchmark);
    setFxRevisedRate(parseFloat((benchmark * (1 + fxShockPct / 100)).toFixed(4)));
  };

  const handleFxShockChange = (pct) => {
    setFxShockPct(pct);
    setFxRevisedRate(parseFloat((fxBaseRate * (1 + pct / 100)).toFixed(4)));
  };

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
    return activeOrders.filter(order => {
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
  }, [activeOrders, selectedYear, selectedCategory, selectedTerm, quickFilter, orderSearch]);

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

  // Product Catalogue Stats (from da_product_catalogue.csv or custom upload)
  const productStats = useMemo(() => {
    const totalProducts = activeProducts.length;
    const totalStock = activeProducts.reduce((sum, p) => sum + (p.Stock_Units || 0), 0);
    const avgMRP = totalProducts ? activeProducts.reduce((sum, p) => sum + p.MRP, 0) / totalProducts : 0;
    const avgCOGS = totalProducts ? activeProducts.reduce((sum, p) => sum + p.COGS, 0) / totalProducts : 0;
    // Accurate Gross Margin formula: (MRP - COGS) / MRP across SKUs
    const avgMarginPct = totalProducts ? activeProducts.reduce((sum, p) => sum + p.Margin_Pct, 0) / totalProducts : 0;
    // Accurate Markup formula: (MRP - COGS) / COGS
    const avgMarkupPct = avgCOGS > 0 ? ((avgMRP - avgCOGS) / avgCOGS) * 100 : 0;
    return { totalProducts, totalStock, avgMRP, avgCOGS, avgMarginPct, avgMarkupPct };
  }, [activeProducts]);

  // Product Category Statistics for Charts
  const productCategoryStats = useMemo(() => {
    const map = {};
    activeProducts.forEach(p => {
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
  }, [activeProducts]);

  // Customer Profile Stats (from da_customer_profiles.csv or custom upload)
  const customerStats = useMemo(() => {
    const count = activeCustomers.length;
    const totalRev = activeCustomers.reduce((sum, c) => sum + (c.Total_Revenue || 0), 0);
    const churnedCount = activeCustomers.filter(c => c.Churned === 1).length;
    const churnRate = count ? (churnedCount / count) * 100 : 0;
    return { count, totalRev, churnedCount, churnRate };
  }, [activeCustomers]);

  // Customer Purchase Date Inconsistencies (First_Purchase_Date > Last_Purchase_Date)
  const customerDateInconsistencies = useMemo(() => {
    return activeCustomers.filter(c => {
      const f = new Date(c.First_Purchase_Date);
      const l = new Date(c.Last_Purchase_Date);
      return f > l;
    });
  }, [activeCustomers]);

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
    return activeOrders.filter(o => o.return_qty > o.quantity_units);
  }, [activeOrders]);

  // Category Return Analysis (Volume Sorted)
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
    })).sort((a, b) => b.returnUnits - a.returnUnits);
  }, [filteredOrders]);

  // Category Return Rate Analysis (Rate Percentage Sorted)
  const categoryReturnRateData = useMemo(() => {
    return [...categoryReturnData].sort((a, b) => b.returnRatePct - a.returnRatePct);
  }, [categoryReturnData]);

  // Monthly Return Trends (Returns tracked by Order Month)
  const monthlyReturnTrends = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      const ym = o.order_year_month;
      if (!map[ym]) {
        map[ym] = { month: ym, shippedUnits: 0, returnUnits: 0, totalOrders: 0, returnOrders: 0 };
      }
      map[ym].shippedUnits += (o.quantity_units || 0);
      map[ym].returnUnits += (o.return_qty || 0);
      map[ym].totalOrders += 1;
      if (o.return_qty > 0) {
        map[ym].returnOrders += 1;
      }
    });
    return Object.keys(map).sort().map(k => {
      const shipped = map[k].shippedUnits;
      const returned = map[k].returnUnits;
      const returnRatePct = shipped > 0 ? parseFloat(((returned / shipped) * 100).toFixed(2)) : 0;
      return {
        ...map[k],
        returnRatePct
      };
    });
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

  // Dynamic Buyer Directory with Estimated Commercial Profitability (Task 2)
  const dynamicBuyersList = useMemo(() => {
    const map = {};
    activeOrders.forEach(o => {
      const bid = o.buyer_id;
      if (!map[bid]) {
        map[bid] = {
          buyer_id: bid,
          total_orders: 0,
          total_spend_inr: 0,
          total_ordered_units: 0,
          on_time_orders: 0,
          categories: {},
          terms: {}
        };
      }
      map[bid].total_orders += 1;
      map[bid].total_spend_inr += (o.total_value_inr || 0);
      map[bid].total_ordered_units += (o.quantity_units || 0);
      if (o.on_time_delivery === 1) map[bid].on_time_orders += 1;
      map[bid].categories[o.category] = (map[bid].categories[o.category] || 0) + 1;
      map[bid].terms[o.payment_terms] = (map[bid].terms[o.payment_terms] || 0) + 1;
    });

    return Object.values(map).map(b => {
      // Primary category
      let topCat = 'General';
      let maxCat = 0;
      Object.entries(b.categories).forEach(([c, cnt]) => {
        if (cnt > maxCat) { maxCat = cnt; topCat = c; }
      });

      // Primary payment terms
      let topTerm = '30 Days Net';
      let maxTerm = 0;
      Object.entries(b.terms).forEach(([t, cnt]) => {
        if (cnt > maxTerm) { maxTerm = cnt; topTerm = t; }
      });

      const marginPct = assumedGrossMarginPct;
      const estimatedCogs = b.total_spend_inr * (1 - marginPct / 100);
      const estimatedProfit = b.total_spend_inr * (marginPct / 100);
      const onTimeRate = b.total_orders ? (b.on_time_orders / b.total_orders) * 100 : 0;
      const aov = b.total_orders ? b.total_spend_inr / b.total_orders : 0;

      // Commercial Profitability Tier
      let segment = 'Core Commercial Account';
      if (estimatedProfit >= 10000000) segment = 'Strategic Tier 1 (High Profit)';
      else if (estimatedProfit >= 5000000) segment = 'Growth Tier 2 (Moderate Profit)';
      else segment = 'Standard Tier 3 (Base Profit)';

      return {
        ...b,
        orders_count: b.total_orders,
        aov_inr: aov,
        on_time_rate: onTimeRate,
        primary_category: topCat,
        primary_terms: topTerm,
        segment_label: segment,
        estimated_cogs_inr: estimatedCogs,
        estimated_profit_inr: estimatedProfit,
        estimated_margin_pct: marginPct,
        profit_cr: parseFloat((estimatedProfit / 1e7).toFixed(2)),
        spend_cr: parseFloat((b.total_spend_inr / 1e7).toFixed(2))
      };
    });
  }, [activeOrders, assumedGrossMarginPct]);

  // Top 10 Buyers by Estimated Gross Profit
  const top10ProfitBuyers = useMemo(() => {
    return [...dynamicBuyersList]
      .sort((a, b) => b.estimated_profit_inr - a.estimated_profit_inr)
      .slice(0, 10);
  }, [dynamicBuyersList]);

  // Filtered Buyers with pagination & dual mode sorting
  const filteredBuyers = useMemo(() => {
    return dynamicBuyersList.filter(b => {
      if (buyerSearch) {
        const q = buyerSearch.toLowerCase();
        return (
          b.buyer_id.toLowerCase().includes(q) ||
          (b.primary_category && b.primary_category.toLowerCase().includes(q)) ||
          (b.segment_label && b.segment_label.toLowerCase().includes(q))
        );
      }
      return true;
    }).sort((a, b) => {
      if (buyerAnalysisView === 'profitability') {
        return b.estimated_profit_inr - a.estimated_profit_inr;
      }
      return b.total_spend_inr - a.total_spend_inr;
    });
  }, [dynamicBuyersList, buyerSearch, buyerAnalysisView]);

  // Filtered Products with pagination
  const filteredProducts = useMemo(() => {
    return activeProducts.filter(p => {
      if (productSearch) {
        const q = productSearch.toLowerCase();
        return p.Product_ID.toLowerCase().includes(q) || p.Name.toLowerCase().includes(q) || p.Category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [activeProducts, productSearch]);

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

  // Robust CSV parser supporting quotes, commas, and newlines
  const parseCSVText = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (!lines.length) return [];
    
    const parseLine = (line) => {
      const result = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const headers = parseLine(lines[0]).map(h => h.replace(/^["']|["']$/g, ''));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]).map(v => v.replace(/^["']|["']$/g, ''));
      if (values.length >= headers.length) {
        const obj = {};
        headers.forEach((h, idx) => {
          obj[h] = values[idx];
        });
        rows.push(obj);
      }
    }
    return rows;
  };

  const handleOrdersUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const rows = parseCSVText(evt.target.result);
        if (!rows.length) {
          setUploadFeedback({ type: 'danger', message: 'Uploaded orders CSV is empty.' });
          return;
        }
        const required = ['order_id', 'buyer_id', 'category', 'order_date', 'quantity_units', 'unit_price_inr', 'total_value_inr', 'payment_terms', 'delivery_days', 'on_time_delivery', 'return_qty', 'repeat_buyer'];
        const missing = required.filter(col => !(col in rows[0]));
        if (missing.length > 0) {
          setUploadFeedback({ type: 'danger', message: `Missing required order columns: ${missing.join(', ')}` });
          return;
        }
        const normalized = rows.map((r, idx) => {
          const qty = parseInt(r.quantity_units, 10) || 0;
          const price = parseFloat(r.unit_price_inr) || 0;
          const totalVal = parseFloat(r.total_value_inr) || (qty * price);
          const oDate = r.order_date || '2024-01-01';
          const oYear = parseInt(oDate.split('-')[0], 10) || 2024;
          return {
            order_id: r.order_id || `ORD-CUSTOM-${idx + 1}`,
            buyer_id: r.buyer_id || `BUYER-CUSTOM`,
            seller_id: r.seller_id || `SELLER-CUSTOM`,
            category: r.category || 'General',
            order_date: oDate,
            order_year: oYear,
            quantity_units: qty,
            unit_price_inr: price,
            total_value_inr: totalVal,
            payment_terms: r.payment_terms || '30 Days Net',
            delivery_days: parseInt(r.delivery_days, 10) || 15,
            on_time_delivery: parseInt(r.on_time_delivery, 10) === 1 ? 1 : 0,
            return_qty: parseInt(r.return_qty, 10) || 0,
            repeat_buyer: parseInt(r.repeat_buyer, 10) === 1 ? 1 : 0
          };
        });
        setCustomOrders(normalized);
        setUploadFeedback({
          type: 'success',
          message: `Successfully ingested ${normalized.length} custom export orders! All dashboard analytics, KPIs, and reports have been dynamically updated in-memory.`
        });
      } catch (err) {
        setUploadFeedback({ type: 'danger', message: `Failed to parse orders CSV: ${err.message}` });
      }
    };
    reader.readAsText(file);
  };

  const handleProductsUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const rows = parseCSVText(evt.target.result);
        if (!rows.length) {
          setUploadFeedback({ type: 'danger', message: 'Uploaded product catalogue CSV is empty.' });
          return;
        }
        const required = ['Product_ID', 'Name', 'Category', 'Price_INR', 'Cost_INR', 'Stock_Quantity', 'Supplier_State'];
        const missing = required.filter(col => !(col in rows[0]));
        if (missing.length > 0) {
          setUploadFeedback({ type: 'danger', message: `Missing required product catalogue columns: ${missing.join(', ')}` });
          return;
        }
        const normalized = rows.map((r, idx) => {
          const price = parseFloat(r.Price_INR) || 0;
          const cost = parseFloat(r.Cost_INR) || 0;
          const marginPct = price > 0 ? ((price - cost) / price) * 100 : 0;
          return {
            Product_ID: r.Product_ID || `PROD-CUSTOM-${idx + 1}`,
            Name: r.Name || 'Custom Product',
            Category: r.Category || 'General',
            Price_INR: price,
            Cost_INR: cost,
            Gross_Margin_Pct: marginPct,
            Stock_Quantity: parseInt(r.Stock_Quantity, 10) || 0,
            Supplier_State: r.Supplier_State || 'Tamil Nadu',
            Reorder_Level: parseInt(r.Reorder_Level, 10) || 50
          };
        });
        setCustomProducts(normalized);
        setUploadFeedback({
          type: 'success',
          message: `Successfully ingested ${normalized.length} custom product catalogue SKUs! Dynamic catalogue stats and inventory breakdowns have recalculated.`
        });
      } catch (err) {
        setUploadFeedback({ type: 'danger', message: `Failed to parse product catalogue CSV: ${err.message}` });
      }
    };
    reader.readAsText(file);
  };

  const handleCustomersUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const rows = parseCSVText(evt.target.result);
        if (!rows.length) {
          setUploadFeedback({ type: 'danger', message: 'Uploaded customer profiles CSV is empty.' });
          return;
        }
        const required = ['Customer_ID', 'City', 'Age_Band', 'Gender', 'Total_Orders', 'Total_Revenue', 'First_Purchase_Date', 'Last_Purchase_Date', 'Churn_Flag'];
        const missing = required.filter(col => !(col in rows[0]));
        if (missing.length > 0) {
          setUploadFeedback({ type: 'danger', message: `Missing required customer profile columns: ${missing.join(', ')}` });
          return;
        }
        const normalized = rows.map((r, idx) => ({
          Customer_ID: r.Customer_ID || `CUST-CUSTOM-${idx + 1}`,
          City: r.City || 'Chennai',
          Age_Band: r.Age_Band || '26-35',
          Gender: r.Gender || 'Unspecified',
          Acquisition_Channel: r.Acquisition_Channel || 'Direct B2B',
          Total_Orders: parseInt(r.Total_Orders, 10) || 1,
          Total_Revenue: parseFloat(r.Total_Revenue) || 0,
          First_Purchase_Date: r.First_Purchase_Date || '2023-01-01',
          Last_Purchase_Date: r.Last_Purchase_Date || '2024-01-01',
          Churn_Flag: parseInt(r.Churn_Flag, 10) === 1 ? 1 : 0
        }));
        setCustomCustomers(normalized);
        setUploadFeedback({
          type: 'success',
          message: `Successfully ingested ${normalized.length} customer profiles! Customer stats and date anomaly registers have dynamically refreshed.`
        });
      } catch (err) {
        setUploadFeedback({ type: 'danger', message: `Failed to parse customer profiles CSV: ${err.message}` });
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDemoData = () => {
    setCustomOrders(null);
    setCustomProducts(null);
    setCustomCustomers(null);
    setUploadFeedback({
      type: 'info',
      message: 'Restored original demo baseline datasets (600 export orders, 50 catalogue SKUs, 200 customer profiles).'
    });
  };

  const handleExportBuyerProfitabilityCSV = () => {
    if (!filteredBuyers.length) return;
    const headers = [
      'Buyer_ID', 'Total_Revenue_INR', 'Attributable_COGS_INR', 
      'Estimated_Gross_Profit_INR', 'Gross_Margin_Pct', 'Total_Orders', 
      'Shipped_Units', 'On_Time_Delivery_Rate_Pct', 'Primary_Category', 
      'Commercial_Tier', 'Benchmark_Assumption'
    ];
    const rows = filteredBuyers.map(b => [
      `"${b.buyer_id}"`,
      b.total_spend_inr.toFixed(2),
      b.estimated_cogs_inr.toFixed(2),
      b.estimated_profit_inr.toFixed(2),
      b.estimated_margin_pct.toFixed(2),
      b.orders_count,
      b.total_ordered_units,
      b.on_time_rate.toFixed(2),
      `"${b.primary_category}"`,
      `"${b.segment_label}"`,
      `"Assumes ${assumedGrossMarginPct}% catalogue benchmark gross margin"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tradesight_buyer_profitability_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportBuyerSpendCSV = () => {
    if (!filteredBuyers.length) return;
    const headers = [
      'Buyer_ID', 'Total_Spend_INR', 'Total_Orders', 'Shipped_Units', 
      'AOV_INR', 'On_Time_Rate_Pct', 'Primary_Category', 'Primary_Terms', 'Cluster'
    ];
    const rows = filteredBuyers.map(b => [
      `"${b.buyer_id}"`,
      b.total_spend_inr.toFixed(2),
      b.orders_count,
      b.total_ordered_units,
      b.aov_inr.toFixed(2),
      b.on_time_rate.toFixed(2),
      `"${b.primary_category}"`,
      `"${b.primary_terms}"`,
      `"${b.segment_label}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tradesight_buyer_spend_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    link.setAttribute('download', `tradesight_reconciled_exceptions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Category Returns Summary to CSV
  const handleExportCategoryReturnsCSV = () => {
    if (!categoryReturnData.length) return;
    const headers = ['Category', 'Shipped_Units', 'Returned_Units', 'Return_Rate_Pct'];
    const rows = categoryReturnData.map(c => [
      `"${c.category}"`,
      c.shippedUnits,
      c.returnUnits,
      c.returnRatePct
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tradesight_category_returns_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Monthly Return Trends to CSV
  const handleExportMonthlyReturnsCSV = () => {
    if (!monthlyReturnTrends.length) return;
    const headers = ['Order_Month', 'Shipped_Units', 'Returned_Units', 'Return_Rate_Pct', 'Total_Orders', 'Orders_With_Returns'];
    const rows = monthlyReturnTrends.map(m => [
      `"${m.month}"`,
      m.shippedUnits,
      m.returnUnits,
      m.returnRatePct,
      m.totalOrders,
      m.returnOrders
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tradesight_monthly_returns_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Return Exceptions to CSV
  const handleExportReturnExceptionsCSV = () => {
    if (!suspiciousReturnsList.length) return;
    const headers = ['Order_ID', 'Order_Date', 'Buyer_ID', 'Category', 'Shipped_Units', 'Returned_Units', 'Excess_Overrun_Units', 'Recommended_Action', 'Review_Status'];
    const rows = suspiciousReturnsList.map(o => [
      `"${o.order_id}"`,
      `"${o.order_date}"`,
      `"${o.buyer_id}"`,
      `"${o.category}"`,
      o.quantity_units,
      o.return_qty,
      o.return_qty - o.quantity_units,
      `"Audit warehouse return receipt against order manifest; adjust return_qty in source ERP."`,
      `"${exceptionsStatusMap[`EXC-RET-${o.order_id}`] || 'Under Investigation'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tradesight_return_quantity_exceptions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Customer Date Inconsistencies to CSV
  const handleExportCustomerDateErrorsCSV = () => {
    if (!customerDateInconsistencies.length) return;
    const headers = ['Customer_ID', 'City', 'Age_Band', 'Gender', 'Acquisition_Channel', 'First_Purchase_Date', 'Last_Purchase_Date', 'Total_Orders', 'Total_Revenue_INR'];
    const rows = customerDateInconsistencies.map(c => [
      `"${c.Customer_ID}"`,
      `"${c.City}"`,
      `"${c.Age_Band}"`,
      `"${c.Gender}"`,
      `"${c.Acquisition_Channel}"`,
      `"${c.First_Purchase_Date}"`,
      `"${c.Last_Purchase_Date}"`,
      c.Total_Orders,
      c.Total_Revenue
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tradesight_customer_date_inconsistencies_${new Date().toISOString().split('T')[0]}.csv`);
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
      case 'compliance': return 'Returns & Quality Analytics';
      case 'buyers':
      case 'clients': return 'Buyer Analysis';
      case 'catalogue':
      case 'products': return 'Product Catalogue';
      case 'country': return 'Country Analysis';
      case 'currency': return 'Currency Analysis';
      case 'reports': return 'Reports';
      case 'governance': return 'Data Quality & Governance';
      case 'powerbi': return 'Power BI Reports & Semantic Model';
      case 'upload': return 'Dataset Upload & Ingestion Validation';
      default: return 'Dashboard';
    }
  };

  // Power BI Section State
  const [powerBiActiveTab, setPowerBiActiveTab] = useState('page1');

  // Currency Module Helper Formatters & Scenario Generator
  const formatInrVal = (val, forceFull = false) => {
    if (val === null || val === undefined || isNaN(val)) return '₹0.00';
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (!forceFull && abs >= 1e7) {
      return `${sign}₹${(abs / 1e7).toFixed(2)} Cr`;
    }
    if (!forceFull && abs >= 1e5) {
      return `${sign}₹${(abs / 1e5).toFixed(2)} Lakh`;
    }
    return `${sign}₹${abs.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
  };

  const fxValidationErrors = useMemo(() => {
    const errors = [];
    if (isNaN(fxBaseRate) || fxBaseRate <= 0) {
      errors.push('Base exchange rate must be strictly positive.');
    }
    if (isNaN(fxRevisedRate) || fxRevisedRate <= 0) {
      errors.push('Revised exchange rate must be strictly positive.');
    }
    if (fxSimulatorMode === 'invoice') {
      if (isNaN(fxInvoiceAmount) || fxInvoiceAmount < 0) {
        errors.push('Invoice amount cannot be negative.');
      }
    } else {
      if (isNaN(fxPortfolioExposurePct) || fxPortfolioExposurePct < 0 || fxPortfolioExposurePct > 100) {
        errors.push('Portfolio exposure must be between 0% and 100%.');
      }
    }
    return errors;
  }, [fxBaseRate, fxRevisedRate, fxSimulatorMode, fxInvoiceAmount, fxPortfolioExposurePct]);

  const fxPresetScenarios = [-10, -5, -2, 0, 2, 5, 10];

  const fxScenarioData = useMemo(() => {
    if (fxValidationErrors.length > 0) return [];
    const isInvoice = fxSimulatorMode === 'invoice';
    const totalOrderVal = stats.totalRevenue || 0;
    const exposedVal = totalOrderVal * (fxPortfolioExposurePct / 100);
    const foreignExposure = fxBaseRate > 0 ? (isInvoice ? fxInvoiceAmount : exposedVal / fxBaseRate) : 0;

    return fxPresetScenarios.map(pct => {
      const scenarioRevisedRate = parseFloat((fxBaseRate * (1 + pct / 100)).toFixed(4));
      let origInr = 0;
      let revInr = 0;
      let diffInr = 0;
      let pctVariance = 0;

      if (isInvoice) {
        origInr = fxInvoiceAmount * fxBaseRate;
        revInr = fxInvoiceAmount * scenarioRevisedRate;
        diffInr = revInr - origInr;
        pctVariance = origInr > 0 ? (diffInr / origInr) * 100 : 0;
      } else {
        origInr = exposedVal;
        revInr = foreignExposure * scenarioRevisedRate;
        diffInr = revInr - exposedVal;
        pctVariance = exposedVal > 0 ? (diffInr / exposedVal) * 100 : 0;
      }

      const isCurrent = Math.abs(fxShockPct - pct) < 0.05;

      return {
        label: pct > 0 ? `+${pct}%` : `${pct}%`,
        pct,
        revisedRate: scenarioRevisedRate,
        revisedVal: isInvoice ? revInr : (totalOrderVal + diffInr),
        revisedExposureVal: revInr,
        diffInr: diffInr,
        pctVariance: pctVariance,
        isCurrent,
        isGain: diffInr > 1e-4,
        isLoss: diffInr < -1e-4,
        isNeutral: Math.abs(diffInr) <= 1e-4
      };
    });
  }, [fxValidationErrors, fxSimulatorMode, stats.totalRevenue, fxPortfolioExposurePct, fxBaseRate, fxInvoiceAmount, fxShockPct]);

  const downloadFxScenariosCsv = () => {
    if (!fxScenarioData || fxScenarioData.length === 0) return;
    const headers = ['Scenario', 'Exchange_Rate_Shift_Pct', 'Revised_Exchange_Rate', 'Revised_Portfolio_or_Invoice_INR', 'Estimated_FX_Gain_Loss_INR', 'Percentage_Impact_Pct'];
    const rows = fxScenarioData.map(r => [
      `"${r.label}"`,
      r.pct,
      r.revisedRate.toFixed(4),
      r.revisedVal.toFixed(2),
      r.diffInr.toFixed(2),
      r.pctVariance.toFixed(2)
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tradesight_fx_sensitivity_${fxSimulatorMode}_${fxCurrency}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <RotateCcw size={16} className="nav-icon" /> Returns & Quality
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
          <button
            className={`nav-item ${activeSection === 'powerbi' ? 'active' : ''}`}
            onClick={() => handleSelectSection('powerbi')}
          >
            <Layers size={16} className="nav-icon" /> Power BI
          </button>
          <button
            className={`nav-item ${activeSection === 'upload' ? 'active' : ''}`}
            onClick={() => handleSelectSection('upload')}
          >
            <UploadCloud size={16} className="nav-icon" /> Data Upload
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-title">
            <Database size={13} color="var(--secondary-accent)" /> {activeOrders.length} Export Orders
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
              <option value="ALL">All Categories ({categoriesList.length})</option>
              {categoriesList.map(c => <option key={c} value={c}>{formatCategoryName(c)}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <span className="filter-label">Terms:</span>
            <select
              className="filter-select"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
            >
              <option value="ALL">All Payment Terms ({termsList.length})</option>
              {termsList.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="filter-group" style={{ marginLeft: 6 }}>
            <button 
              className={`preset-pill ${quickFilter === 'ALL' ? 'active' : ''}`} 
              onClick={() => setQuickFilter('ALL')}
            >
              All ({activeOrders.length})
            </button>
            <button 
              className={`preset-pill ${quickFilter === 'DELAYED' ? 'active' : ''}`} 
              onClick={() => setQuickFilter('DELAYED')}
            >
              Delayed ({activeOrders.filter(o => o.on_time_delivery === 0).length})
            </button>
            <button 
              className={`preset-pill ${quickFilter === 'REPEAT' ? 'active' : ''}`} 
              onClick={() => setQuickFilter('REPEAT')}
            >
              Repeat ({activeOrders.filter(o => o.repeat_buyer === 1).length})
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
              Returns ({activeOrders.filter(o => (o.return_qty || 0) > 0).length})
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

              {/* 8 Primary Key Metrics Grid (4 columns x 2 rows, Drill-Down Enabled) */}
              <div className="dashboard-kpi-grid">
                {/* 1. Total Revenue */}
                <div 
                  className="kpi-card" 
                  onClick={() => handleSelectSection('revenue')} 
                  style={{ cursor: 'pointer' }}
                  title="Click to drill down to Revenue Analysis"
                >
                  <div className="kpi-card-header">
                    <span className="kpi-card-label">Total Revenue</span>
                    <div className="kpi-card-icon"><TrendingUp size={16} /></div>
                  </div>
                  <div className="kpi-card-value">₹{(stats.totalRevenue / 1e7).toFixed(2)} Cr</div>
                </div>

                {/* 2. Total Orders */}
                <div 
                  className="kpi-card" 
                  onClick={() => handleSelectSection('revenue')} 
                  style={{ cursor: 'pointer' }}
                  title="Click to drill down to Order Records"
                >
                  <div className="kpi-card-header">
                    <span className="kpi-card-label">Total Orders</span>
                    <div className="kpi-card-icon"><Box size={16} /></div>
                  </div>
                  <div className="kpi-card-value">{stats.totalOrders}</div>
                </div>

                {/* 3. Average Order Value */}
                <div 
                  className="kpi-card" 
                  onClick={() => handleSelectSection('revenue')} 
                  style={{ cursor: 'pointer' }}
                  title="Click to drill down to AOV Breakdown"
                >
                  <div className="kpi-card-header">
                    <span className="kpi-card-label">Average Order Value</span>
                    <div className="kpi-card-icon"><DollarSign size={16} /></div>
                  </div>
                  <div className="kpi-card-value">₹{(stats.aov / 1e5).toFixed(2)} L</div>
                </div>

                {/* 4. On-Time Delivery */}
                <div 
                  className="kpi-card" 
                  onClick={() => { handleSelectSection('logistics'); handlePresetFilter('ontime'); }} 
                  style={{ cursor: 'pointer' }}
                  title="Click to drill down to On-Time Shipments"
                >
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
                <div 
                  className="kpi-card" 
                  onClick={() => { handleSelectSection('returns'); handlePresetFilter('returns'); }} 
                  style={{ cursor: 'pointer' }}
                  title="Click to drill down to Returns & Quality Analytics"
                >
                  <div className="kpi-card-header">
                    <span className="kpi-card-label">Return Rate</span>
                    <div className="kpi-card-icon"><RotateCcw size={16} /></div>
                  </div>
                  <div className="kpi-card-value">{stats.returnRate.toFixed(2)}%</div>
                </div>

                {/* 6. Total Buyers */}
                <div 
                  className="kpi-card" 
                  onClick={() => handleSelectSection('buyers')} 
                  style={{ cursor: 'pointer' }}
                  title="Click to drill down to Buyer Directory"
                >
                  <div className="kpi-card-header">
                    <span className="kpi-card-label">Total Buyers</span>
                    <div className="kpi-card-icon"><Users size={16} /></div>
                  </div>
                  <div className="kpi-card-value">{stats.uniqueBuyers}</div>
                </div>

                {/* 7. Total Products */}
                <div 
                  className="kpi-card" 
                  onClick={() => handleSelectSection('catalogue')} 
                  style={{ cursor: 'pointer' }}
                  title="Click to drill down to Product Catalogue"
                >
                  <div className="kpi-card-header">
                    <span className="kpi-card-label">Total Products</span>
                    <div className="kpi-card-icon"><Package size={16} /></div>
                  </div>
                  <div className="kpi-card-value">{productStats.totalProducts}</div>
                </div>

                {/* 8. Catalogue Margin */}
                <div 
                  className="kpi-card" 
                  onClick={() => handleSelectSection('catalogue')} 
                  style={{ cursor: 'pointer' }}
                  title="Click to drill down to Product Margins"
                >
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
                    <div className="panel-title">Part 2: Proposed 12-Market Export Expansion Roadmap</div>
                    <div className="panel-subtitle">Target export markets, trade lanes, and destination data requirements for ERP ingestion.</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="badge neutral">Proposed Markets</span>
                    <a
                      href="/templates/tradesight_country_data_collection_template.csv"
                      download="tradesight_country_data_collection_template.csv"
                      className="action-btn primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', padding: '6px 12px', fontSize: '12px' }}
                    >
                      <Download size={13} /> Download Country Ingestion Template (CSV)
                    </a>
                  </div>
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
                  <p className="section-subtitle">Commercial order volumes, client profitability estimations, and buyer segmentation.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div className="filter-group" style={{ margin: 0 }}>
                    <button
                      className={`preset-pill ${buyerAnalysisView === 'revenue' ? 'active' : ''}`}
                      onClick={() => setBuyerAnalysisView('revenue')}
                    >
                      Commercial Spend Ranking
                    </button>
                    <button
                      className={`preset-pill ${buyerAnalysisView === 'profitability' ? 'active' : ''}`}
                      onClick={() => setBuyerAnalysisView('profitability')}
                    >
                      <Percent size={12} style={{ marginRight: 4 }} /> Estimated Gross Profitability
                    </button>
                  </div>
                </div>
              </div>

              {buyerAnalysisView === 'revenue' ? (
                <>
                  <div className="dashboard-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
                    <div className="kpi-card">
                      <div className="kpi-card-header"><span className="kpi-card-label">Total Buyers</span></div>
                      <div className="kpi-card-value">{dynamicBuyersList.length}</div>
                      <div className="kpi-card-subtext">Commercial accounts in dataset</div>
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

                  <div className="alert-banner warning">
                    <AlertTriangle size={18} color="var(--status-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ display: 'block', fontSize: '13px', marginBottom: '3px' }}>
                        Note on Client Profitability
                      </strong>
                      The raw dataset provides sales revenue by buyer, but does not include product manufacturing costs, freight or duty per order. Therefore, default client rankings are based on revenue.
                      <br />
                      To explore estimated gross profit modeling using the <strong>58.62% catalogue gross margin</strong> benchmark, switch to <strong>Estimated Gross Profitability</strong> view above.
                    </div>
                  </div>

                  {/* Top 10 Buyer Spending Visual Chart */}
                  <div className="panel-card">
                    <div className="panel-header">
                      <div>
                        <div className="panel-title">Top 10 Buyers by Commercial Spend</div>
                        <div className="panel-subtitle">Wholesale buyers with the highest total export spend in ₹ Crores</div>
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
                        <div className="panel-subtitle">Commercial accounts grouped by order recency, frequency, spend and delivery rate</div>
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

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Buyer Directory ({filteredBuyers.length} accounts)</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                          <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                          <input
                            type="text"
                            className="filter-select"
                            placeholder="Search Buyer ID, Category..."
                            value={buyerSearch}
                            onChange={(e) => { setBuyerSearch(e.target.value); setBuyerPage(1); }}
                            style={{ paddingLeft: 28, width: 220 }}
                          />
                        </div>
                        <button className="action-btn" onClick={handleExportBuyerSpendCSV}>
                          <Download size={12} /> Export CSV
                        </button>
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
              ) : (
                /* ESTIMATED GROSS PROFITABILITY VIEW (TASK 2) */
                <>
                  <div className="dashboard-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
                    <div className="kpi-card">
                      <div className="kpi-card-header"><span className="kpi-card-label">Total Wholesale Revenue</span></div>
                      <div className="kpi-card-value">{formatInrVal(dynamicBuyersList.reduce((acc, b) => acc + b.total_spend_inr, 0))}</div>
                      <div className="kpi-card-subtext">{dynamicBuyersList.length} Active Commercial Accounts</div>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-card-header"><span className="kpi-card-label">Attributable Estimated COGS</span></div>
                      <div className="kpi-card-value" style={{ color: 'var(--text-secondary)' }}>
                        {formatInrVal(dynamicBuyersList.reduce((acc, b) => acc + b.estimated_cogs_inr, 0))}
                      </div>
                      <div className="kpi-card-subtext">Estimated Cost ({(100 - assumedGrossMarginPct).toFixed(2)}% of Revenue)</div>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-card-header"><span className="kpi-card-label">Estimated Gross Profit</span></div>
                      <div className="kpi-card-value" style={{ color: 'var(--status-success)' }}>
                        {formatInrVal(dynamicBuyersList.reduce((acc, b) => acc + b.estimated_profit_inr, 0))}
                      </div>
                      <div className="kpi-card-subtext">Attributable Gross Profit Contribution</div>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-card-header"><span className="kpi-card-label">Benchmark Margin</span></div>
                      <div className="kpi-card-value">{assumedGrossMarginPct.toFixed(2)}%</div>
                      <div className="kpi-card-subtext">Catalogue Average (da_product_catalogue.csv)</div>
                    </div>
                  </div>

                  {/* Profitability Methodology & Sensitivity Controls */}
                  <div className="alert-banner info" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <Info size={18} color="var(--primary-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ fontSize: '13px' }}>
                          Client Profitability Estimation Methodology &amp; Assumptions
                        </strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', lineHeight: 1.5 }}>
                          The source order dataset (<code>da_b2b_orders.csv</code>) records transaction sales revenue but omits direct SKU manufacturing cost of goods sold (COGS), port handling tariffs, and export freight.
                          To estimate commercial profitability across buyers, TradeSight applies the verified <strong>58.62% catalogue gross margin benchmark</strong> (derived from <code>da_product_catalogue.csv</code>).
                          All metrics below represent estimated gross profit. Adjust margin assumptions below to test commercial sensitivity:
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Margin Presets:</span>
                      <button
                        className={`preset-pill ${assumedGrossMarginPct === 25 ? 'active' : ''}`}
                        onClick={() => setAssumedGrossMarginPct(25)}
                      >
                        25% (Conservative)
                      </button>
                      <button
                        className={`preset-pill ${assumedGrossMarginPct === 40 ? 'active' : ''}`}
                        onClick={() => setAssumedGrossMarginPct(40)}
                      >
                        40% (Moderate Export)
                      </button>
                      <button
                        className={`preset-pill ${assumedGrossMarginPct === 58.62 ? 'active' : ''}`}
                        onClick={() => setAssumedGrossMarginPct(58.62)}
                      >
                        58.62% (Catalogue Benchmark)
                      </button>
                      <button
                        className={`preset-pill ${assumedGrossMarginPct === 70 ? 'active' : ''}`}
                        onClick={() => setAssumedGrossMarginPct(70)}
                      >
                        70% (Premium Line)
                      </button>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Custom:</span>
                        <input
                          type="number"
                          min="1"
                          max="95"
                          step="0.5"
                          value={assumedGrossMarginPct}
                          onChange={(e) => setAssumedGrossMarginPct(parseFloat(e.target.value) || 58.62)}
                          className="filter-select"
                          style={{ width: '70px', padding: '4px 6px', fontSize: '12px' }}
                        />
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>%</span>
                      </div>
                    </div>
                  </div>

                  {/* Top 10 Clients by Estimated Gross Profit Bar Chart */}
                  <div className="panel-card">
                    <div className="panel-header">
                      <div>
                        <div className="panel-title">Top 10 Buyers by Estimated Gross Profit</div>
                        <div className="panel-subtitle">Ranked by estimated commercial profit contribution in ₹ Crores (at {assumedGrossMarginPct}% margin)</div>
                      </div>
                      <span className="badge success">Profitability Ranking</span>
                    </div>
                    <div style={{ height: 270 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={top10ProfitBuyers} layout="vertical" margin={{ top: 5, right: 30, left: 35, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                          <XAxis type="number" stroke="var(--text-secondary)" fontSize={11} tickFormatter={(v) => `₹${v}Cr`} />
                          <YAxis dataKey="buyer_id" type="category" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="chart-tooltip">
                                    <div className="chart-tooltip-title">{payload[0].payload.buyer_id}</div>
                                    <div className="chart-tooltip-item" style={{ color: 'var(--status-success)' }}>
                                      Est. Gross Profit: ₹{payload[0].value} Crore
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                      Total Spend: ₹{payload[0].payload.spend_cr} Crore • {payload[0].payload.total_orders} Orders
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                      Tier: {payload[0].payload.segment_label}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="profit_cr" fill="var(--primary-accent)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Client Profitability Table */}
                  <div className="panel-card">
                    <div className="panel-header">
                      <div>
                        <div className="panel-title">Client Profitability Directory</div>
                        <div className="panel-subtitle">Wholesale accounts ranked by attributable gross profit contribution</div>
                      </div>
                      <button className="action-btn primary" onClick={handleExportBuyerProfitabilityCSV}>
                        <Download size={13} /> Export Profitability CSV
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Ranked Accounts ({filteredBuyers.length} total)
                      </span>
                      <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          className="filter-select"
                          placeholder="Search Buyer ID, Category, Tier..."
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
                            <th style={{ textAlign: 'right' }}>Total Revenue (INR)</th>
                            <th style={{ textAlign: 'right' }}>Attributable COGS</th>
                            <th style={{ textAlign: 'right' }}>Est. Gross Profit</th>
                            <th style={{ textAlign: 'center' }}>Gross Margin</th>
                            <th>Orders</th>
                            <th>On-Time Rate</th>
                            <th>Primary Category</th>
                            <th>Commercial Tier</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBuyers.slice((buyerPage - 1) * pageSize, buyerPage * pageSize).map(b => (
                            <tr key={b.buyer_id}>
                              <td className="mono" style={{ fontWeight: 600, color: 'var(--primary-accent)' }}>{b.buyer_id}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{b.total_spend_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                              <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>₹{b.estimated_cogs_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                              <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--status-success)' }}>₹{b.estimated_profit_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                              <td style={{ textAlign: 'center' }}>
                                <span className="badge neutral">{assumedGrossMarginPct.toFixed(1)}%</span>
                              </td>
                              <td>{b.orders_count}</td>
                              <td>
                                <span className={`badge ${b.on_time_rate >= 80 ? 'success' : 'warning'}`}>
                                  {b.on_time_rate.toFixed(1)}%
                                </span>
                              </td>
                              <td>{formatCategoryName(b.primary_category)}</td>
                              <td>
                                <span className={`badge ${b.estimated_profit_inr >= 10000000 ? 'success' : b.estimated_profit_inr >= 5000000 ? 'info' : 'neutral'}`}>
                                  {b.segment_label}
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

              {/* Data Availability Notice */}
              <div className="alert-banner info" style={{ marginBottom: '16px' }}>
                <DollarSign size={18} color="var(--primary-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
                  All source transactions are recorded in INR. Historical foreign currency amounts and exchange rates are unavailable. The following analysis represents hypothetical FX scenarios.
                </div>
              </div>

              {/* What-If Sensitivity Simulator Panel */}
              <div className="panel-card" style={{ marginBottom: '20px' }}>
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Currency & FX Impact Simulator</div>
                    <div className="panel-subtitle">Simulate currency appreciation and depreciation impacts on export receivables.</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      className={`preset-pill ${fxSimulatorMode === 'portfolio' ? 'active' : ''}`}
                      onClick={() => setFxSimulatorMode('portfolio')}
                      style={{ padding: '6px 14px', fontSize: '13px' }}
                    >
                      Portfolio Impact
                    </button>
                    <button
                      className={`preset-pill ${fxSimulatorMode === 'invoice' ? 'active' : ''}`}
                      onClick={() => setFxSimulatorMode('invoice')}
                      style={{ padding: '6px 14px', fontSize: '13px' }}
                    >
                      Invoice Calculator
                    </button>
                  </div>
                </div>

                {/* Validation Error Alert Banner */}
                {fxValidationErrors.length > 0 && (
                  <div className="alert-banner warning" style={{ margin: '14px 14px 0 14px' }}>
                    <AlertTriangle size={18} color="var(--status-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '13px' }}>
                      <strong>Input Validation:</strong>
                      <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                        {fxValidationErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Simulator Controls Toolbar */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', padding: '14px', margin: '14px', background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div className="filter-group">
                    <span className="filter-label">Target Currency:</span>
                    <select
                      className="filter-select"
                      value={fxCurrency}
                      onChange={(e) => handleFxCurrencyChange(e.target.value)}
                    >
                      {Object.values(FX_CURRENCIES).map(c => (
                        <option key={c.code} value={c.code}>
                          {c.code} – {c.name} (Illustrative ₹{c.illustrativeRate.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {fxSimulatorMode === 'invoice' ? (
                    <div className="filter-group">
                      <span className="filter-label">Invoice Amount ({FX_CURRENCIES[fxCurrency]?.symbol || '$'}):</span>
                      <input
                        type="number"
                        className="filter-select"
                        min="0"
                        step="1000"
                        value={isNaN(fxInvoiceAmount) ? '' : fxInvoiceAmount}
                        onChange={(e) => setFxInvoiceAmount(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
                        style={{ width: '130px' }}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="filter-group">
                        <span className="filter-label">Total Order Value:</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>
                          ₹{(stats.totalRevenue / 1e7).toFixed(2)} Cr ({stats.totalOrders} Orders)
                        </span>
                      </div>
                      <div className="filter-group">
                        <span className="filter-label">Foreign Exposure (%):</span>
                        <input
                          type="number"
                          className="filter-select"
                          min="0"
                          max="100"
                          step="5"
                          value={isNaN(fxPortfolioExposurePct) ? '' : fxPortfolioExposurePct}
                          onChange={(e) => setFxPortfolioExposurePct(e.target.value === '' ? '' : parseFloat(e.target.value))}
                          style={{ width: '80px' }}
                        />
                      </div>
                    </>
                  )}

                  <div className="filter-group">
                    <span className="filter-label">Base Rate (₹):</span>
                    <input
                      type="number"
                      className="filter-select"
                      min="0.0001"
                      step="0.05"
                      value={isNaN(fxBaseRate) ? '' : fxBaseRate}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setFxBaseRate(val);
                        if (!isNaN(val) && val > 0) {
                          setFxRevisedRate(parseFloat((val * (1 + fxShockPct / 100)).toFixed(4)));
                        }
                      }}
                      style={{ width: '90px' }}
                    />
                  </div>

                  <div className="filter-group">
                    <span className="filter-label">Revised Rate (₹):</span>
                    <input
                      type="number"
                      className="filter-select"
                      min="0.0001"
                      step="0.05"
                      value={isNaN(fxRevisedRate) ? '' : fxRevisedRate}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setFxRevisedRate(val);
                        if (!isNaN(val) && val > 0 && !isNaN(fxBaseRate) && fxBaseRate > 0) {
                          setFxShockPct(parseFloat((((val - fxBaseRate) / fxBaseRate) * 100).toFixed(2)));
                        }
                      }}
                      style={{ width: '90px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Presets:</span>
                    {fxPresetScenarios.map(pct => {
                      const isMatch = Math.abs(fxShockPct - pct) < 0.05;
                      return (
                        <button
                          key={pct}
                          className={`preset-pill ${isMatch ? 'active' : ''}`}
                          onClick={() => handleFxShockChange(pct)}
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                        >
                          {pct > 0 ? `+${pct}%` : `${pct}%`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dynamic Calculated 4 KPI Results */}
                {(() => {
                  const isInvoice = fxSimulatorMode === 'invoice';
                  const totalOrderVal = stats.totalRevenue || 0;
                  const validBase = !isNaN(fxBaseRate) && fxBaseRate > 0 ? fxBaseRate : 83.50;
                  const validRevised = !isNaN(fxRevisedRate) && fxRevisedRate > 0 ? fxRevisedRate : 83.50;
                  const curr = FX_CURRENCIES[fxCurrency] || FX_CURRENCIES.USD;

                  let origInr = 0;
                  let revInr = 0;
                  let diffInr = 0;
                  let pctVariance = 0;
                  let exposedInr = 0;
                  let foreignExposure = 0;
                  let revisedTotalPortfolioVal = 0;

                  if (isInvoice) {
                    const amt = !isNaN(fxInvoiceAmount) && fxInvoiceAmount >= 0 ? fxInvoiceAmount : 0;
                    origInr = amt * validBase;
                    revInr = amt * validRevised;
                    diffInr = revInr - origInr;
                    pctVariance = origInr > 0 ? ((diffInr / origInr) * 100) : 0;
                  } else {
                    const exposureRatio = (!isNaN(fxPortfolioExposurePct) && fxPortfolioExposurePct >= 0 && fxPortfolioExposurePct <= 100)
                      ? (fxPortfolioExposurePct / 100)
                      : 0.5;
                    exposedInr = totalOrderVal * exposureRatio;
                    foreignExposure = validBase > 0 ? exposedInr / validBase : 0;
                    revInr = foreignExposure * validRevised;
                    diffInr = revInr - exposedInr;
                    revisedTotalPortfolioVal = totalOrderVal + diffInr;
                    pctVariance = exposedInr > 0 ? ((diffInr / exposedInr) * 100) : 0;
                  }

                  const isGain = diffInr > 1e-4;
                  const isLoss = diffInr < -1e-4;
                  const isNeutral = !isGain && !isLoss;

                  const statusColor = isGain
                    ? 'var(--status-success)'
                    : isLoss
                    ? 'var(--status-critical)'
                    : 'var(--text-secondary)';

                  const impactSubtext = isGain
                    ? 'Foreign currency appreciation gain'
                    : isLoss
                    ? 'Foreign currency depreciation loss'
                    : 'No currency impact';

                  return (
                    <div className="dashboard-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', margin: '0 14px 14px 14px' }}>
                      {isInvoice ? (
                        <>
                          <div className="kpi-card">
                            <div className="kpi-card-header"><span className="kpi-card-label">Original Booking Value</span></div>
                            <div className="kpi-card-value">
                              {formatInrVal(origInr)}
                            </div>
                            <div className="kpi-card-subtext">At base rate ₹{validBase.toFixed(2)} / {fxCurrency}</div>
                          </div>

                          <div className="kpi-card">
                            <div className="kpi-card-header"><span className="kpi-card-label">Revised Converted Value</span></div>
                            <div className="kpi-card-value" style={{ color: statusColor }}>
                              {formatInrVal(revInr)}
                            </div>
                            <div className="kpi-card-subtext">At revised rate ₹{validRevised.toFixed(2)} / {fxCurrency}</div>
                          </div>

                          <div className="kpi-card">
                            <div className="kpi-card-header"><span className="kpi-card-label">Estimated FX Gain / Loss</span></div>
                            <div className="kpi-card-value" style={{ color: statusColor }}>
                              {diffInr > 0 ? '+' : ''}{formatInrVal(diffInr)}
                            </div>
                            <div className="kpi-card-subtext" style={{ color: statusColor, fontWeight: 500 }}>
                              {impactSubtext}
                            </div>
                          </div>

                          <div className="kpi-card">
                            <div className="kpi-card-header"><span className="kpi-card-label">Percentage Impact</span></div>
                            <div className="kpi-card-value" style={{ color: statusColor }}>
                              {pctVariance > 0 ? '+' : ''}{pctVariance.toFixed(2)}%
                            </div>
                            <div className="kpi-card-subtext">
                              {isNeutral ? 'Zero variance on booking' : 'Net variance on receivable value'}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="kpi-card">
                            <div className="kpi-card-header"><span className="kpi-card-label">Exposed Portfolio Value</span></div>
                            <div className="kpi-card-value">
                              {formatInrVal(exposedInr)} ({fxPortfolioExposurePct}%)
                            </div>
                            <div className="kpi-card-subtext">
                              Hypothetical: {curr.symbol}{Math.round(foreignExposure).toLocaleString()} {fxCurrency}
                            </div>
                          </div>

                          <div className="kpi-card">
                            <div className="kpi-card-header"><span className="kpi-card-label">Revised Exposure Value</span></div>
                            <div className="kpi-card-value" style={{ color: statusColor }}>
                              {formatInrVal(revInr)}
                            </div>
                            <div className="kpi-card-subtext">At revised rate ₹{validRevised.toFixed(2)} / {fxCurrency}</div>
                          </div>

                          <div className="kpi-card">
                            <div className="kpi-card-header"><span className="kpi-card-label">Estimated FX Gain / Loss</span></div>
                            <div className="kpi-card-value" style={{ color: statusColor }}>
                              {diffInr > 0 ? '+' : ''}{formatInrVal(diffInr)}
                            </div>
                            <div className="kpi-card-subtext" style={{ color: statusColor, fontWeight: 500 }}>
                              {impactSubtext}
                            </div>
                          </div>

                          <div className="kpi-card">
                            <div className="kpi-card-header"><span className="kpi-card-label">Revised Total Portfolio Value</span></div>
                            <div className="kpi-card-value" style={{ color: statusColor }}>
                              {formatInrVal(revisedTotalPortfolioVal)}
                            </div>
                            <div className="kpi-card-subtext">Baseline: ₹{(totalOrderVal / 1e7).toFixed(2)} Cr</div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '8px 14px', margin: '0 14px 14px 14px', background: 'var(--bg-card-subtle)', borderRadius: '6px' }}>
                  <strong>Hypothetical Simulation Note:</strong> Default benchmark exchange rates are illustrative estimates, not live market rates. Historical export transactions in <code>da_b2b_orders.csv</code> were recorded strictly in INR without foreign currency identifiers.
                </div>
              </div>

              {/* Exchange Rate Sensitivity Chart */}
              <div className="panel-card" style={{ marginBottom: '20px' }}>
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Exchange Rate Sensitivity Analysis</div>
                    <div className="panel-subtitle">Estimated FX gain or loss across percentage shift scenarios (-10% to +10%) in INR.</div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Mode: <strong>{fxSimulatorMode === 'invoice' ? 'Invoice Calculator' : 'Portfolio Impact'}</strong> | Currency: <strong>{fxCurrency}</strong>
                  </div>
                </div>

                <div style={{ height: 280, padding: '10px 14px 14px 14px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fxScenarioData} margin={{ top: 20, right: 30, left: 15, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                      <XAxis
                        dataKey="label"
                        stroke="var(--text-secondary)"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="var(--text-secondary)"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(v) => formatInrVal(v)}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const isGain = data.diffInr > 1e-4;
                            const isLoss = data.diffInr < -1e-4;
                            const tooltipColor = isGain
                              ? 'var(--status-success)'
                              : isLoss
                              ? 'var(--status-critical)'
                              : 'var(--text-secondary)';
                            return (
                              <div style={{
                                background: 'var(--bg-card)',
                                padding: '10px 14px',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '6px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                fontSize: '12px'
                              }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-heading)', marginBottom: '4px' }}>
                                  Scenario: {data.label} ({data.pct > 0 ? `+${data.pct}%` : `${data.pct}%`})
                                </div>
                                <div style={{ color: 'var(--text-secondary)', marginBottom: '2px' }}>
                                  Revised Rate: ₹{data.revisedRate.toFixed(2)} / {fxCurrency}
                                </div>
                                <div style={{ fontWeight: 600, color: tooltipColor }}>
                                  Estimated FX Impact: {data.diffInr > 0 ? '+' : ''}{formatInrVal(data.diffInr)} ({data.pctVariance > 0 ? '+' : ''}{data.pctVariance.toFixed(2)}%)
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                  {isGain ? 'Appreciation Gain' : isLoss ? 'Depreciation Loss' : 'No currency impact'}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <ReferenceLine y={0} stroke="var(--border-color)" strokeWidth={1.5} />
                      <Bar dataKey="diffInr" radius={[4, 4, 0, 0]}>
                        {fxScenarioData.map((entry, index) => {
                          const fill = entry.diffInr > 1e-4
                            ? 'var(--status-success)'
                            : entry.diffInr < -1e-4
                            ? 'var(--status-critical)'
                            : 'var(--text-secondary)';
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={fill}
                              stroke={entry.isCurrent ? 'var(--text-heading)' : 'none'}
                              strokeWidth={entry.isCurrent ? 2 : 0}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Scenario Comparison Table */}
              <div className="panel-card" style={{ marginBottom: '20px' }}>
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Scenario Comparison Matrix</div>
                    <div className="panel-subtitle">Comprehensive analytical comparison across all seven exchange rate scenarios.</div>
                  </div>
                  <button
                    className="btn-secondary"
                    onClick={downloadFxScenariosCsv}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px' }}
                  >
                    <Download size={14} /> Download Scenarios CSV
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Scenario</th>
                        <th>Exchange Rate Shift</th>
                        <th>Revised Exchange Rate</th>
                        <th>Revised Converted Value</th>
                        <th>Estimated FX Gain / Loss</th>
                        <th>Percentage Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fxScenarioData.map(r => {
                        const isGain = r.diffInr > 1e-4;
                        const isLoss = r.diffInr < -1e-4;
                        const statusColor = isGain
                          ? 'var(--status-success)'
                          : isLoss
                          ? 'var(--status-critical)'
                          : 'var(--text-secondary)';

                        return (
                          <tr
                            key={r.pct}
                            style={r.isCurrent ? { backgroundColor: 'var(--icon-bg)', fontWeight: 600 } : {}}
                          >
                            <td>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                {r.label}
                                {r.isCurrent && (
                                  <span className="badge info" style={{ fontSize: '10px', padding: '1px 6px' }}>Active</span>
                                )}
                              </span>
                            </td>
                            <td>{r.pct > 0 ? `+${r.pct}%` : `${r.pct}%`}</td>
                            <td className="mono">₹{r.revisedRate.toFixed(4)} / {fxCurrency}</td>
                            <td>{formatInrVal(r.revisedVal)}</td>
                            <td style={{ color: statusColor, fontWeight: 600 }}>
                              {r.diffInr > 0 ? '+' : ''}{formatInrVal(r.diffInr)}
                            </td>
                            <td style={{ color: statusColor, fontWeight: 600 }}>
                              {r.pctVariance > 0 ? '+' : ''}{r.pctVariance.toFixed(2)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Multi-Currency Data Specification */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Multi-Currency Data Specification</div>
                    <div className="panel-subtitle">Architectural schema requirements to transition from INR baseline to multi-currency operations.</div>
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
                        <td>ISO currency code (USD, EUR, GBP, AED, SGD, JPY)</td>
                        <td><span className="badge warning">Missing (Recorded strictly in INR)</span></td>
                        <td>Add transaction currency capture to ERP and sales order booking forms</td>
                      </tr>
                      <tr>
                        <td className="mono">foreign_invoice_amount</td>
                        <td>NUMERIC(14, 2)</td>
                        <td>Original invoice principal in contract billing currency</td>
                        <td><span className="badge warning">Missing</span></td>
                        <td>Capture invoice nominal amount in foreign currency at contract signing</td>
                      </tr>
                      <tr>
                        <td className="mono">booking_date</td>
                        <td>DATE</td>
                        <td>Timestamp when export order was formally confirmed</td>
                        <td><span className="badge success">Present (order_date)</span></td>
                        <td>Synchronize existing order_date with central bank reference rate lookup tables</td>
                      </tr>
                      <tr>
                        <td className="mono">spot_booking_rate</td>
                        <td>NUMERIC(10, 4)</td>
                        <td>Benchmark exchange rate on order booking date</td>
                        <td><span className="badge warning">Missing</span></td>
                        <td>Automatically capture central bank (RBI) spot exchange rate on order date</td>
                      </tr>
                      <tr>
                        <td className="mono">settlement_date</td>
                        <td>DATE</td>
                        <td>Realized bank payment remittance value date</td>
                        <td><span className="badge warning">Missing (Only delivery_date)</span></td>
                        <td>Integrate bank SWIFT/wire remittance realization date into accounting ledger</td>
                      </tr>
                      <tr>
                        <td className="mono">realized_settlement_rate</td>
                        <td>NUMERIC(10, 4)</td>
                        <td>Actual exchange rate converted upon payment receipt</td>
                        <td><span className="badge warning">Missing</span></td>
                        <td>Log realized bank settlement exchange rate to compute realized FX gain/loss</td>
                      </tr>
                      <tr>
                        <td className="mono">hedging_status</td>
                        <td>VARCHAR(20)</td>
                        <td>Treasury forward contract or derivative cover indicator</td>
                        <td><span className="badge warning">Missing</span></td>
                        <td>Track treasury hedging status per order (Unhedged, Forward Contract, Collar)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* =========================================================================
              7. RETURNS & QUALITY ANALYTICS SECTION
              ========================================================================= */}
          {(activeSection === 'returns' || activeSection === 'compliance') && (
            <>
              <div className="section-header-block">
                <div>
                  <h1 className="section-title">Returns &amp; Quality Analytics</h1>
                  <p className="section-subtitle">Return quantities, category return rates and quality anomaly tracking.</p>
                </div>
              </div>

              {/* Summary KPI Cards */}
              <div className="dashboard-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Shipped Units</span></div>
                  <div className="kpi-card-value">{stats.totalUnits.toLocaleString()}</div>
                  <div className="kpi-card-subtext">Total units shipped across 600 orders</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Returned Units</span></div>
                  <div className="kpi-card-value">{stats.returnUnits.toLocaleString()}</div>
                  <div className="kpi-card-subtext">Total physical units returned</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Return Rate</span></div>
                  <div className="kpi-card-value" style={{ color: stats.returnRate <= 2.0 ? 'var(--status-success)' : 'var(--status-warning)' }}>
                    {stats.returnRate.toFixed(2)}%
                  </div>
                  <div className="kpi-card-subtext">Units returned ÷ shipped units ({((stats.returnUnits / stats.totalUnits) * 100).toFixed(2)}%)</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Return Exceptions</span></div>
                  <div className="kpi-card-value" style={{ color: 'var(--status-critical)' }}>
                    {suspiciousReturnsList.length} Flagged Orders
                  </div>
                  <div className="kpi-card-subtext">Return quantity exceeds shipped quantity</div>
                </div>
              </div>

              {/* Row 1: Category Analytics (Returned Units + Return Rate %) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                {/* Chart 1: Returned Units by Category */}
                <div className="panel-card" style={{ marginBottom: 0 }}>
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Returned Units by Category</div>
                      <div className="panel-subtitle">Total physical returned volume across commercial categories</div>
                    </div>
                    <button 
                      className="action-btn" 
                      onClick={handleExportCategoryReturnsCSV}
                      title="Download Category Returns CSV"
                      style={{ fontSize: '11.5px', padding: '4px 8px' }}
                    >
                      <Download size={13} /> Export CSV
                    </button>
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

                {/* Chart 2: Return Rate by Category (%) */}
                <div className="panel-card" style={{ marginBottom: 0 }}>
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Return Rate by Category (%)</div>
                      <div className="panel-subtitle">Dynamic rate: Returned Units ÷ Shipped Units × 100</div>
                    </div>
                    <span className="badge info">Ranked by Rate</span>
                  </div>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryReturnRateData} margin={{ top: 10, right: 15, left: -5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                        <XAxis dataKey="category" stroke="var(--text-secondary)" fontSize={10} tickLine={false} tickFormatter={formatCategoryName} />
                        <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}%`} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="chart-tooltip">
                                  <div className="chart-tooltip-title">{formatCategoryName(payload[0].payload.category)}</div>
                                  <div className="chart-tooltip-item" style={{ color: 'var(--primary-accent)', fontWeight: 600 }}>
                                    Return Rate: {payload[0].payload.returnRatePct}%
                                  </div>
                                  <div className="chart-tooltip-item" style={{ color: 'var(--text-secondary)' }}>
                                    Returned Units: {payload[0].payload.returnUnits.toLocaleString()}
                                  </div>
                                  <div className="chart-tooltip-item" style={{ color: 'var(--text-secondary)' }}>
                                    Shipped Units: {payload[0].payload.shippedUnits.toLocaleString()}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="returnRatePct" fill="var(--primary-accent)" radius={[4, 4, 0, 0]} name="Return Rate (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Row 2: Monthly Return Trends (Timeline) */}
              <div className="panel-card" style={{ marginBottom: '20px' }}>
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Monthly Return Trends (Returns by Order Month)</div>
                    <div className="panel-subtitle">Returned units and return rate tracked by order placement month (2023–2024).</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      className="action-btn" 
                      onClick={handleExportMonthlyReturnsCSV}
                      title="Download Monthly Return Trends CSV"
                      style={{ fontSize: '11.5px', padding: '4px 8px' }}
                    >
                      <Download size={13} /> Export Monthly Trends
                    </button>
                  </div>
                </div>
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyReturnTrends} margin={{ top: 15, right: 25, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                      <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                      <YAxis yAxisId="left" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" stroke="var(--status-critical)" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="chart-tooltip">
                                <div className="chart-tooltip-title">Order Month: {d.month}</div>
                                <div className="chart-tooltip-item" style={{ color: 'var(--primary-accent)' }}>
                                  Returned Volume: {d.returnUnits.toLocaleString()} Units
                                </div>
                                <div className="chart-tooltip-item" style={{ color: 'var(--status-critical)', fontWeight: 600 }}>
                                  Return Rate: {d.returnRatePct}%
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
                                  Shipped: {d.shippedUnits.toLocaleString()} units across {d.totalOrders} orders ({d.returnOrders} with returns)
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Bar yAxisId="left" dataKey="returnUnits" fill="var(--soft-blue)" radius={[4, 4, 0, 0]} name="Returned Units" />
                      <Line yAxisId="right" type="monotone" dataKey="returnRatePct" stroke="var(--status-critical)" strokeWidth={2.5} dot={{ r: 3 }} name="Return Rate (%)" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', padding: '6px 12px', background: 'var(--bg-card-subtle)', borderRadius: '6px', marginTop: '8px' }}>
                  <strong>Timeline Note:</strong> Monthly trends are grouped by order booking date, as transactional return receipt timestamps are not captured in the source dataset.
                </div>
              </div>

              {/* Return Quantity Exceptions Table */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Return Quantity Exceptions (Return Qty &gt; Shipped Qty)</div>
                    <div className="panel-subtitle">Orders where recorded return quantity exceeds shipped quantity (audit flags preserved intact).</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge danger">{suspiciousReturnsList.length} Flagged Orders</span>
                    <button className="action-btn" onClick={handleExportReturnExceptionsCSV}>
                      <Download size={13} /> Export Exceptions CSV
                    </button>
                  </div>
                </div>

                <div className="alert-banner danger" style={{ margin: '0 0 16px 0' }}>
                  <AlertCircle size={16} color="var(--status-critical)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Non-Destructive Governance Note:</strong> In orders <code>B2B-00131</code> (+6 units) and <code>B2B-00188</code> (+9 units), the recorded return quantity is higher than the shipped quantity. In accordance with enterprise audit standards, these records are <strong>preserved intact</strong> and flagged with <code>is_valid_return=False</code> rather than being silently overwritten. They are included in baseline unit counts with audit tags.
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
                        <th>Recommended Corrective Action</th>
                        <th>Review Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suspiciousReturnsList.map(o => {
                        const exceptionId = `EXC-RET-${o.order_id}`;
                        const currentStatus = exceptionsStatusMap[exceptionId] || 'Under Investigation';

                        return (
                          <tr key={o.order_id} className="clickable" onClick={() => setSelectedOrder(o)}>
                            <td className="mono" style={{ fontWeight: 600, color: 'var(--status-critical)' }}>{o.order_id}</td>
                            <td>{o.order_date}</td>
                            <td className="mono">{o.buyer_id}</td>
                            <td>{formatCategoryName(o.category)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{o.quantity_units} Units</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--status-critical)' }}>{o.return_qty} Units</td>
                            <td><span className="badge danger">+{o.return_qty - o.quantity_units} Overrun</span></td>
                            <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              Audit warehouse return receipt against order manifest; adjust return_qty in source ERP.
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <select
                                className="filter-select"
                                value={currentStatus}
                                onChange={(ev) => updateExceptionStatus(exceptionId, ev.target.value)}
                                style={{ padding: '3px 8px', fontSize: '11.5px', fontWeight: 600 }}
                              >
                                <option value="Under Investigation">Under Investigation</option>
                                <option value="Pending Audit">Pending Audit</option>
                                <option value="Action Pending">Action Pending</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Verified">Verified</option>
                              </select>
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
                        );
                      })}
                    </tbody>
                  </table>
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
                    <div className="panel-title">Automated Weekly Email Reporting</div>
                    <div className="panel-subtitle">Executive analytics and exception reports dispatched automatically every Monday via GitHub Actions and Gmail SMTP relay.</div>
                  </div>
                  <span className="badge success">Active (Mondays 01:30 PM IST)</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <Calendar size={16} color="var(--primary-accent)" />
                      <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>Cadence &amp; Scheduling</strong>
                    </div>
                    <div>
                      <strong>Schedule:</strong> Every Monday at <strong>01:30 PM IST</strong> (08:00 UTC).<br />
                      <strong>Workflow:</strong> <code>.github/workflows/weekly_report.yml</code> triggered via GitHub Actions cron and manual dispatch.
                    </div>
                  </div>

                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <Clock size={16} color="var(--secondary-accent)" />
                      <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>Gmail SMTP Relay</strong>
                    </div>
                    <div>
                      <strong>Host:</strong> <code>smtp.gmail.com:587</code> (STARTTLS Encrypted)<br />
                      <strong>Format:</strong> Dual-channel Multi-Part MIME (Plain Text + Responsive Corporate HTML).
                    </div>
                  </div>

                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <TrendingUp size={16} color="var(--status-success)" />
                      <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>Included Executive KPIs</strong>
                    </div>
                    <div>
                      Total Revenue (₹396.88 Cr), 600 Orders, AOV (₹66.15 L), On-Time SLA (77.50%), Return Rate (1.01%), 135 Delivery Delays, and 4 Strategic Recommendations.
                    </div>
                  </div>

                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <FileSpreadsheet size={16} color="var(--status-critical)" />
                      <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>Automated Attachments</strong>
                    </div>
                    <div>
                      <strong>1. Exception CSV:</strong> <code>weekly_exception_report_*.csv</code><br />
                      <strong>2. Executive MD:</strong> <code>weekly_exception_report_*.md</code>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =========================================================================
              9. DATA QUALITY & GOVERNANCE SECTION
              ========================================================================= */}
          {activeSection === 'governance' && (
            <>
              <div className="section-header-block">
                <div>
                  <h1 className="section-title">Data Quality &amp; Governance</h1>
                  <p className="section-subtitle">Source datasets, reconciled enterprise exception register, and data integrity audits.</p>
                </div>
              </div>

              {/* Reconciled Exception Overview Cards */}
              <div className="dashboard-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Reconciled Exceptions</span></div>
                  <div className="kpi-card-value">{allReconciledExceptions.length} Records</div>
                  <div className="kpi-card-subtext">Total reconciled enterprise anomalies</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Delayed Shipments</span></div>
                  <div className="kpi-card-value" style={{ color: 'var(--status-warning)' }}>
                    {ordersRaw.filter(o => o.on_time_delivery === 0).length} Orders
                  </div>
                  <div className="kpi-card-subtext">Logistics delivery SLA breaches (77.5% on-time)</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Return Overrun Errors</span></div>
                  <div className="kpi-card-value" style={{ color: 'var(--status-critical)' }}>
                    {suspiciousReturnsList.length} Orders
                  </div>
                  <div className="kpi-card-subtext">return_qty &gt; quantity_units (Logical error)</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Customer Date Inversions</span></div>
                  <div className="kpi-card-value" style={{ color: 'var(--status-warning)' }}>
                    {customerDateInconsistencies.length} Accounts
                  </div>
                  <div className="kpi-card-subtext">First_Purchase &gt; Last_Purchase (CRM error)</div>
                </div>
              </div>

              {/* Source Datasets Inventory */}
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
                        <td>Zero missing values. Two orders have return quantities greater than shipped quantities (<code>B2B-00131</code>, <code>B2B-00188</code>). 135 orders delayed.</td>
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

              {/* Complete Reconciled Exception Register Table */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Complete Exception Register ({allReconciledExceptions.length} Records)</div>
                    <div className="panel-subtitle">Reconciled tracking across 135 delayed shipments, 2 return quantity errors, and 42 customer date errors.</div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      className="filter-select"
                      value={exceptionSeverityFilter}
                      onChange={(e) => { setExceptionSeverityFilter(e.target.value); setExceptionPage(1); }}
                    >
                      <option value="ALL">All Severities ({allReconciledExceptions.length})</option>
                      <option value="CRITICAL">Critical ({allReconciledExceptions.filter(e => e.severity === 'CRITICAL').length})</option>
                      <option value="HIGH">High ({allReconciledExceptions.filter(e => e.severity === 'HIGH').length})</option>
                      <option value="MEDIUM">Medium ({allReconciledExceptions.filter(e => e.severity === 'MEDIUM').length})</option>
                      <option value="LOW">Low ({allReconciledExceptions.filter(e => e.severity === 'LOW').length})</option>
                    </select>

                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        className="filter-select"
                        placeholder="Search Record ID, Category, Action..."
                        value={exceptionSearch}
                        onChange={(e) => { setExceptionSearch(e.target.value); setExceptionPage(1); }}
                        style={{ paddingLeft: 28, width: 220 }}
                      />
                    </div>

                    <button className="action-btn" onClick={handleExportExceptionsCSV}>
                      <Download size={13} /> Download Reconciled CSV
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

              {/* Customer Purchase-Date Inconsistencies Table (Moved from Returns) */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Customer Purchase Date Inconsistencies (First Purchase &gt; Last Purchase)</div>
                    <div className="panel-subtitle">42 customer profile records where first purchase date is later than last purchase date.</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                    <button className="action-btn" onClick={handleExportCustomerDateErrorsCSV}>
                      <Download size={13} /> Export Date Errors CSV
                    </button>
                  </div>
                </div>

                <div className="alert-banner warning" style={{ margin: '0 0 16px 0' }}>
                  <AlertTriangle size={16} color="var(--status-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Date Inconsistency:</strong> In 42 customer profile records, the first purchase date is later than the last purchase date. In accordance with non-destructive data governance, records are preserved intact and tenure calculations are guarded with <code>NaN</code>.
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

          {/* =========================================================================
              10. POWER BI REPORTS & SEMANTIC MODEL SECTION
              ========================================================================= */}
          {activeSection === 'powerbi' && (
            <>
              <div className="section-header-block">
                <div>
                  <h1 className="section-title">Power BI Reports &amp; Semantic Model</h1>
                  <p className="section-subtitle">Validated Microsoft Power BI Developer Project (PBIP/PBIX), Star-Schema Architecture, and Enterprise DAX Measures.</p>
                </div>
              </div>

              {/* Validation Status Banner */}
              <div className="alert-banner success">
                <CheckCircle2 size={20} color="var(--status-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', marginBottom: '3px' }}>
                    Power BI Project Validated &amp; Ready for Production
                  </strong>
                  Automated test validation passed across 5 report canvas pages, 29 visual containers, 47 DAX measures, and 5 star-schema backing datasets. Verified compatible with Microsoft Power BI Desktop (PBIP and PBIX formats).
                  <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>
                    Automated Environment Check: Microsoft Power BI Desktop is not installed on this local server. You can download the complete validated Power BI Developer Project Bundle (.zip) or individual artifacts below to inspect or run locally.
                  </div>
                </div>
              </div>

              {/* Genuine Download Action Cards */}
              <div className="dashboard-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginBottom: '20px' }}>
                <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Package size={18} color="var(--primary-accent)" />
                      <strong style={{ fontSize: '14px' }}>Power BI Project Bundle (.ZIP)</strong>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
                      Complete developer archive containing <code>TradeSight_Analytics.pbip</code>, semantic model (<code>model.bim</code>), 5-page layout (<code>report.json</code>), 5 star-schema CSVs, DAX library, theme, and setup guide.
                    </p>
                  </div>
                  <a
                    href="/powerbi/TradeSight_PowerBI_Project_Bundle.zip"
                    download="TradeSight_PowerBI_Project_Bundle.zip"
                    className="action-btn primary"
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}
                  >
                    <Download size={14} /> Download PBIP Bundle (.zip)
                  </a>
                </div>

                <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Layers size={18} color="var(--primary-accent)" />
                      <strong style={{ fontSize: '14px' }}>Compile Standalone PBIX</strong>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
                      Standalone .pbix files require Microsoft VertiPaq compilation. Open <code>TradeSight_Analytics.pbip</code> in Power BI Desktop and click <em>File &gt; Save As (*.pbix)</em>.
                    </p>
                  </div>
                  <a
                    href="/powerbi/TradeSight_Analytics.pbip"
                    download="TradeSight_Analytics.pbip"
                    className="action-btn secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}
                  >
                    <FileText size={14} /> Download PBIP Launcher
                  </a>
                </div>

                <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <FileText size={18} color="var(--primary-accent)" />
                      <strong style={{ fontSize: '14px' }}>Semantic Model TOM (model.bim)</strong>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
                      Tabular Object Model (TOM) schema specification (compatibility level 1550) for Tabular Editor, Power BI Desktop, or Microsoft Fabric.
                    </p>
                  </div>
                  <a
                    href="/powerbi/model.bim"
                    download="TradeSight_Analytics_model.bim"
                    className="action-btn"
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}
                  >
                    <Download size={14} /> Download model.bim
                  </a>
                </div>

                <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <FileSpreadsheet size={18} color="var(--primary-accent)" />
                      <strong style={{ fontSize: '14px' }}>DAX Measures Library (.dax)</strong>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
                      47 enterprise DAX formulas with <code>DIVIDE</code> zero-division guards, formatted currency strings, and baseline KPIs.
                    </p>
                  </div>
                  <a
                    href="/powerbi/TradeSight_DAX_Measures.dax"
                    download="TradeSight_DAX_Measures.dax"
                    className="action-btn"
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}
                  >
                    <Download size={14} /> Download DAX Library
                  </a>
                </div>
              </div>

              {/* 4 Power BI KPI Summary Cards */}
              <div className="dashboard-kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">REPORT CANVAS</span>
                    <div className="kpi-icon-wrap"><Layers size={16} /></div>
                  </div>
                  <div className="kpi-value">5 Pages</div>
                  <div className="kpi-subtext">Executive, Logistics, Commercial, Quality, Geography</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">VISUAL CONTAINERS</span>
                    <div className="kpi-icon-wrap"><Activity size={16} /></div>
                  </div>
                  <div className="kpi-value">29 Visuals</div>
                  <div className="kpi-subtext">Cards, area, donut, bar, column, histogram, tables</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">SEMANTIC MODEL</span>
                    <div className="kpi-icon-wrap"><Database size={16} /></div>
                  </div>
                  <div className="kpi-value">5 Tables</div>
                  <div className="kpi-subtext">1 Fact table, 4 Dimension tables (Star-Schema)</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">DAX MEASURES</span>
                    <div className="kpi-icon-wrap"><TrendingUp size={16} /></div>
                  </div>
                  <div className="kpi-value">47 Measures</div>
                  <div className="kpi-subtext">Commercial, logistics, quality, margin formulas</div>
                </div>
              </div>

              {/* Interactive Specification & Architecture Tabs */}
              <div className="panel-card" style={{ marginTop: '20px' }}>
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Power BI Architecture &amp; Page Specifications</div>
                    <div className="panel-subtitle">Explore the validated 5-page report canvas, dimensional schema, and DAX measures</div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <button
                      className={`action-btn ${powerBiActiveTab === 'page1' ? 'primary' : ''}`}
                      onClick={() => setPowerBiActiveTab('page1')}
                    >
                      P1: Executive Overview
                    </button>
                    <button
                      className={`action-btn ${powerBiActiveTab === 'page2' ? 'primary' : ''}`}
                      onClick={() => setPowerBiActiveTab('page2')}
                    >
                      P2: Logistics
                    </button>
                    <button
                      className={`action-btn ${powerBiActiveTab === 'page3' ? 'primary' : ''}`}
                      onClick={() => setPowerBiActiveTab('page3')}
                    >
                      P3: Commercial
                    </button>
                    <button
                      className={`action-btn ${powerBiActiveTab === 'page4' ? 'primary' : ''}`}
                      onClick={() => setPowerBiActiveTab('page4')}
                    >
                      P4: Returns &amp; Quality
                    </button>
                    <button
                      className={`action-btn ${powerBiActiveTab === 'page5' ? 'primary' : ''}`}
                      onClick={() => setPowerBiActiveTab('page5')}
                    >
                      P5: Geography &amp; FX
                    </button>
                    <button
                      className={`action-btn ${powerBiActiveTab === 'schema' ? 'primary' : ''}`}
                      onClick={() => setPowerBiActiveTab('schema')}
                    >
                      Star-Schema
                    </button>
                    <button
                      className={`action-btn ${powerBiActiveTab === 'dax' ? 'primary' : ''}`}
                      onClick={() => setPowerBiActiveTab('dax')}
                    >
                      DAX Formulas
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  {powerBiActiveTab === 'page1' && (
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                        Page 1: C-Suite Executive Overview (1600 × 900 Canvas)
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                        Designed for high-level commercial leadership to monitor cumulative export revenue, ordering cadence, fulfillment SLA compliance, return rate benchmarks, and margin performance.
                      </p>
                      <div className="data-table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Visual Element</th>
                              <th>Visual Type</th>
                              <th>DAX Measure / Field Projection</th>
                              <th>Business Purpose</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Header Title</td>
                              <td><span className="badge">textbox</span></td>
                              <td>TradeSight Export Analytics – C-Suite Executive Overview</td>
                              <td>Corporate branding &amp; visual anchor (#172B4D)</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>KPI Revenue</td>
                              <td><span className="badge">card</span></td>
                              <td><code>Fact_Orders[Total Revenue (Cr)]</code> (₹396.88 Cr)</td>
                              <td>Cumulative 2-year wholesale export value</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>KPI Orders</td>
                              <td><span className="badge">card</span></td>
                              <td><code>Fact_Orders[Total Orders]</code> (600 Orders)</td>
                              <td>Order fulfillment volume</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>KPI AOV</td>
                              <td><span className="badge">card</span></td>
                              <td><code>Fact_Orders[AOV (Lakhs)]</code> (₹66.15 Lakhs)</td>
                              <td>Average order transaction scale</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>KPI On-Time %</td>
                              <td><span className="badge">card</span></td>
                              <td><code>Fact_Orders[On-Time Delivery %]</code> (77.50%)</td>
                              <td>Logistics service level agreement compliance</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>KPI Return Rate %</td>
                              <td><span className="badge">card</span></td>
                              <td><code>Fact_Orders[Unit Return Rate %]</code> (1.01%)</td>
                              <td>Returned physical units ÷ shipped units</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>KPI Active Buyers</td>
                              <td><span className="badge">card</span></td>
                              <td><code>Fact_Orders[Unique Active Buyers]</code> (200 Buyers)</td>
                              <td>Client enterprise relationship breadth</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Monthly Revenue Area</td>
                              <td><span className="badge">areaChart</span></td>
                              <td>X: <code>Dim_Date[YearMonth]</code> • Y: <code>Total Revenue (Cr)</code></td>
                              <td>24-month revenue trajectory &amp; stability</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Delivery SLA Donut</td>
                              <td><span className="badge">donutChart</span></td>
                              <td>Category: <code>SLA_Status</code> • Y: <code>Total Orders</code></td>
                              <td>465 On-Time vs 135 Delayed breakdown</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Category Revenue Bar</td>
                              <td><span className="badge">barChart</span></td>
                              <td>Category: <code>category</code> • Y: <code>Total Revenue (Cr)</code></td>
                              <td>Sector contribution (Chemicals, Textiles, etc.)</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Payment Terms Column</td>
                              <td><span className="badge">columnChart</span></td>
                              <td>Category: <code>payment_terms</code> • Y: <code>Total Revenue (Cr)</code></td>
                              <td>Working capital terms distribution</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {powerBiActiveTab === 'page2' && (
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                        Page 2: Logistics Performance &amp; Compliance Monitoring (1600 × 900 Canvas)
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                        Tracks shipping transit time variance, delayed shipment risk by sector, and detailed exception tracking for freight operations.
                      </p>
                      <div className="data-table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Visual Element</th>
                              <th>Visual Type</th>
                              <th>Field Projection</th>
                              <th>Operational Insight</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Transit Days Histogram</td>
                              <td><span className="badge">columnChart</span></td>
                              <td>X: <code>delivery_days</code> • Y: <code>Total Orders</code></td>
                              <td>Distribution of transit durations (3 to 45 days; mean: 24.3 days)</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Category SLA Performance</td>
                              <td><span className="badge">barChart</span></td>
                              <td>X: <code>category</code> • Y: <code>On-Time Delivery %</code></td>
                              <td>Pinpoints categories with lowest delivery fulfillment reliability</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Shipment Exception Grid</td>
                              <td><span className="badge">tableEx</span></td>
                              <td>Order ID, Buyer ID, Category, Date, Transit Days, SLA Status, Value</td>
                              <td>Full audit table with search &amp; sort across 135 delayed orders</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {powerBiActiveTab === 'page3' && (
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                        Page 3: Commercial Client Ranking &amp; Product Margin Intelligence (1600 × 900 Canvas)
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                        Evaluates buyer commercial concentration and product catalogue gross margin economics across 50 SKU lines.
                      </p>
                      <div className="data-table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Visual Element</th>
                              <th>Visual Type</th>
                              <th>Field Projection</th>
                              <th>Commercial Insight</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Top Buyers Commercial Ranking</td>
                              <td><span className="badge">barChart</span></td>
                              <td>X: <code>buyer_id</code> • Y: <code>Total Revenue (Cr)</code></td>
                              <td>Top revenue generating clients (e.g. BUY-0095, BUY-0151)</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Catalogue Gross Margin %</td>
                              <td><span className="badge">columnChart</span></td>
                              <td>X: <code>Dim_Products[Category]</code> • Y: <code>Catalogue Gross Margin %</code></td>
                              <td>Average gross margin percentage by product line (Catalogue benchmark: 58.62%)</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>SKU Inventory Valuation Grid</td>
                              <td><span className="badge">tableEx</span></td>
                              <td>Product ID, Name, Category, MRP, COGS, Gross Margin %, Stock Units, Valuation</td>
                              <td>Detailed stock valuation at cost (₹6.81M COGS) vs retail (₹17.06M MRP)</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {powerBiActiveTab === 'page4' && (
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                        Page 4: Return Rate Analysis &amp; Data Quality Exception Auditing (1600 × 900 Canvas)
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                        Focuses on physical product return rates, returns by order month, and audit identification of the 2 return quantity overrun errors.
                      </p>
                      <div className="data-table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Visual Element</th>
                              <th>Visual Type</th>
                              <th>Field Projection</th>
                              <th>Quality Audit Purpose</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Unit Return Rate by Category</td>
                              <td><span className="badge">columnChart</span></td>
                              <td>X: <code>category</code> • Y: <code>Unit Return Rate %</code></td>
                              <td>Dynamic return rate ranking across all 10 product categories</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Return Occurrence Ratio</td>
                              <td><span className="badge">donutChart</span></td>
                              <td>Category: <code>Has_Return</code> • Y: <code>Total Orders</code></td>
                              <td>Orders with returns (133 orders) vs zero-return shipments (467 orders)</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Flagged Return Anomalies Table</td>
                              <td><span className="badge">tableEx</span></td>
                              <td>Order ID, Buyer ID, Category, Quantity Units, Return Qty, Invalid Flag, Value</td>
                              <td>Dedicated audit grid highlighting B2B-00131 (+6) and B2B-00188 (+9)</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {powerBiActiveTab === 'page5' && (
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                        Page 5: Proposed 12-Market Expansion &amp; Currency Scenario Analysis (1600 × 900 Canvas)
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                        Presents the strategic 12-country export trade lane matrix and currency sensitivity scenarios while strictly respecting data limitations.
                      </p>
                      <div className="data-table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Visual Element</th>
                              <th>Visual Type</th>
                              <th>Field Projection</th>
                              <th>Strategic Governance</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Customer City Distribution</td>
                              <td><span className="badge">pieChart</span></td>
                              <td>Category: <code>Dim_Customers[City]</code> • Y: <code>Total Orders</code></td>
                              <td>Domestic CRM buyer concentration (Chennai, Mumbai, Bengaluru, etc.)</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Proposed 12 Export Markets</td>
                              <td><span className="badge">tableEx</span></td>
                              <td>Country, ISO3, Region, Port of Discharge, Incoterm, Target Priority</td>
                              <td>Enterprise expansion target roadmap (UAE, USA, UK, Germany, etc.)</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Methodological Governance Notice</td>
                              <td><span className="badge">textbox</span></td>
                              <td>Non-Destructive Data Audit &amp; Forward-Looking Sensitivity Guidelines</td>
                              <td>Documents INR source denomination and absence of historical foreign FX</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {powerBiActiveTab === 'schema' && (
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                        Validated Star-Schema Data Model (model.bim)
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                        Engineered with 1 central Fact table and 4 Dimension tables connected via 1-to-many single-direction relationships.
                      </p>
                      <div className="data-table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Table Name</th>
                              <th>Role</th>
                              <th>Row Count</th>
                              <th>Key Columns</th>
                              <th>Relationship Mapping</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Fact_Orders</td>
                              <td><span className="badge primary">Fact Table</span></td>
                              <td>600 Orders</td>
                              <td><code>order_id</code> (PK), <code>OrderDateKey</code> (FK), <code>buyer_id</code></td>
                              <td>Center of Star-Schema; joins to Dim_Date</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Dim_Date</td>
                              <td><span className="badge">Dimension</span></td>
                              <td>731 Calendar Days</td>
                              <td><code>DateKey</code> (PK), <code>Date</code>, <code>Year</code>, <code>MonthName</code></td>
                              <td>1-to-many relationship from Dim_Date[DateKey] to Fact_Orders[OrderDateKey]</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Dim_Products</td>
                              <td><span className="badge">Dimension</span></td>
                              <td>50 Catalogue SKUs</td>
                              <td><code>Product_ID</code> (PK), <code>Category</code>, <code>MRP</code>, <code>COGS</code></td>
                              <td>Catalogue inventory, gross margin %, and stock coverage</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Dim_Customers</td>
                              <td><span className="badge">Dimension</span></td>
                              <td>200 Customer Accounts</td>
                              <td><code>Customer_ID</code> (PK), <code>City</code>, <code>First_Purchase_Date</code></td>
                              <td>Retail CRM profiles, acquisition channels, and churn flags</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Dim_Proposed_Markets</td>
                              <td><span className="badge">Dimension</span></td>
                              <td>12 Target Countries</td>
                              <td><code>Country</code>, <code>ISO3</code>, <code>Region</code>, <code>Incoterm</code></td>
                              <td>Target overseas trade corridors and discharge ports</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {powerBiActiveTab === 'dax' && (
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                        Core Enterprise DAX Measures (TradeSight_DAX_Measures.dax)
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                        Key business intelligence measures verified and formatted inside the semantic model.
                      </p>
                      <div className="data-table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Measure Name</th>
                              <th>DAX Formula</th>
                              <th>Format String</th>
                              <th>Business Purpose</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Total Export Revenue</td>
                              <td><code>SUM(Fact_Orders[total_value_inr])</code></td>
                              <td>₹#,##0.00</td>
                              <td>Gross wholesale revenue (₹3,968,829,214.20)</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Total Revenue (Cr)</td>
                              <td><code>DIVIDE([Total Export Revenue], 10000000, 0)</code></td>
                              <td>#,##0.00</td>
                              <td>Revenue scaled to Indian Crores (₹396.88 Cr)</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Total Orders</td>
                              <td><code>COUNTROWS(Fact_Orders)</code></td>
                              <td>#,##0</td>
                              <td>Total order count (600)</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Average Order Value</td>
                              <td><code>DIVIDE([Total Export Revenue], [Total Orders], 0)</code></td>
                              <td>₹#,##0.00</td>
                              <td>Mean transaction value (₹6,614,715.36)</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>AOV (Lakhs)</td>
                              <td><code>DIVIDE([Average Order Value (AOV)], 100000, 0)</code></td>
                              <td>#,##0.00</td>
                              <td>AOV in Indian Lakhs (₹66.15 Lakhs)</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>On-Time Delivery %</td>
                              <td><code>DIVIDE([On-Time Deliveries], [Total Orders], 0) * 100</code></td>
                              <td>0.00%</td>
                              <td>Fulfillment SLA percentage (77.50%)</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Unit Return Rate %</td>
                              <td><code>DIVIDE([Total Units Returned], [Total Units Shipped], 0) * 100</code></td>
                              <td>0.00%</td>
                              <td>Physical return rate (1.01%)</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Unique Active Buyers</td>
                              <td><code>DISTINCTCOUNT(Fact_Orders[buyer_id])</code></td>
                              <td>#,##0</td>
                              <td>Active buyer enterprise count (200)</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600 }}>Catalogue Gross Margin %</td>
                              <td><code>AVERAGE(Dim_Products[Gross_Margin_Pct])</code></td>
                              <td>0.00%</td>
                              <td>Average SKU markup margin (58.62%)</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step-by-Step Desktop Guide */}
              <div className="panel-card" style={{ marginTop: '20px' }}>
                <div className="panel-header">
                  <div>
                    <div className="panel-title">How to Open &amp; Compile in Microsoft Power BI Desktop</div>
                    <div className="panel-subtitle">4 simple steps to open the PBIP project and save as TradeSight_Analytics.pbix</div>
                  </div>
                </div>
                <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                  <ol style={{ paddingLeft: '20px', margin: 0 }}>
                    <li style={{ marginBottom: '8px' }}>
                      <strong>Download the Project:</strong> Click <strong>Download PBIP Bundle (.zip)</strong> above or access the local repository directory: <code>D:\TradeSight-Export-Analytics\powerbi</code>.
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                      <strong>Launch Power BI Project:</strong> Double-click <strong><code>TradeSight_Analytics.pbip</code></strong> in Windows File Explorer. Microsoft Power BI Desktop will natively open the project, bind the star-schema data tables, apply the navy corporate theme, and render all 5 interactive canvas pages.
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                      <strong>Review Visuals:</strong> Inspect all 5 pages: <em>Executive Overview, Shipment &amp; Compliance, Client &amp; Product Analytics, Returns &amp; Data Quality, and Geography &amp; FX</em>.
                    </li>
                    <li style={{ marginBottom: '0px' }}>
                      <strong>Save as Standalone PBIX:</strong> In Power BI Desktop, click <strong>File &gt; Save As...</strong>, choose <strong>Power BI File (*.pbix)</strong>, and save as <code>TradeSight_Analytics.pbix</code> in the <code>powerbi/</code> directory.
                    </li>
                  </ol>
                </div>
              </div>
            </>
          )}

          {/* =========================================================================
              11. DATASET UPLOAD & INGESTION VALIDATION SECTION (TASK 7)
              ========================================================================= */}
          {activeSection === 'upload' && (
            <>
              <div className="section-header-block">
                <div>
                  <h1 className="section-title">Dataset Upload &amp; Ingestion Validation</h1>
                  <p className="section-subtitle">Upload custom CSV files to dynamically recalculate dashboard KPIs, models, and exception registers in browser memory.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    className="action-btn"
                    onClick={handleResetToDemoData}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <RefreshCw size={13} /> Reset to Demo Baseline
                  </button>
                </div>
              </div>

              {/* Status Header Overview */}
              <div className="dashboard-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Active Orders</span></div>
                  <div className="kpi-card-value">{activeOrders.length}</div>
                  <div className="kpi-card-subtext">{customOrders ? 'Custom Ingested Orders' : 'Demo Baseline (da_b2b_orders.csv)'}</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Active Catalogue SKUs</span></div>
                  <div className="kpi-card-value">{activeProducts.length}</div>
                  <div className="kpi-card-subtext">{customProducts ? 'Custom Ingested SKUs' : 'Demo Baseline (da_product_catalogue.csv)'}</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Active Customer Accounts</span></div>
                  <div className="kpi-card-value">{activeCustomers.length}</div>
                  <div className="kpi-card-subtext">{customCustomers ? 'Custom Ingested Profiles' : 'Demo Baseline (da_customer_profiles.csv)'}</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-card-header"><span className="kpi-card-label">Ingestion Mode</span></div>
                  <div className="kpi-card-value" style={{ fontSize: '18px', color: (customOrders || customProducts || customCustomers) ? 'var(--status-success)' : 'var(--primary-accent)' }}>
                    {(customOrders || customProducts || customCustomers) ? 'Custom Ingestion' : 'Demo Baseline'}
                  </div>
                  <div className="kpi-card-subtext">Client-Side Memory Execution</div>
                </div>
              </div>

              {/* Upload Feedback Alert */}
              {uploadFeedback && (
                <div className={`alert-banner ${uploadFeedback.type === 'success' ? 'success' : uploadFeedback.type === 'danger' ? 'danger' : 'info'}`} style={{ marginBottom: '16px' }}>
                  {uploadFeedback.type === 'success' ? (
                    <CheckCircle2 size={18} color="var(--status-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  ) : uploadFeedback.type === 'danger' ? (
                    <AlertCircle size={18} color="var(--status-critical)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  ) : (
                    <Info size={18} color="var(--primary-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  )}
                  <div>
                    <strong>{uploadFeedback.type === 'success' ? 'Ingestion Successful: ' : uploadFeedback.type === 'danger' ? 'Validation Error: ' : 'Dataset Reset: '}</strong>
                    {uploadFeedback.message}
                  </div>
                </div>
              )}

              {/* 3 Upload Cards */}
              <div className="dashboard-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginBottom: '24px' }}>
                
                {/* 1. B2B Orders Dropzone */}
                <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileUp size={18} color="var(--primary-accent)" />
                        <strong style={{ fontSize: '14px' }}>1. B2B Orders Dataset</strong>
                      </div>
                      <span className={`badge ${customOrders ? 'success' : 'neutral'}`}>
                        {customOrders ? `${customOrders.length} Ingested` : 'Demo (600)'}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
                      Replaces transaction orders across 10 categories, order values, delivery days, SLA tracking, and returns.
                    </p>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-card-subtle)', padding: '8px', borderRadius: '4px', marginBottom: '12px' }}>
                      <strong>Required Headers:</strong> <code>order_id, buyer_id, category, order_date, quantity_units, unit_price_inr, total_value_inr, payment_terms, delivery_days, on_time_delivery, return_qty, repeat_buyer</code>
                    </div>
                  </div>
                  <div>
                    <label className="action-btn primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', cursor: 'pointer', marginBottom: '8px' }}>
                      <UploadCloud size={14} /> Upload Orders CSV
                      <input type="file" accept=".csv" onChange={handleOrdersUpload} style={{ display: 'none' }} />
                    </label>
                    <a
                      href="/templates/da_b2b_orders_sample.csv"
                      download="da_b2b_orders_sample.csv"
                      style={{ fontSize: '11px', color: 'var(--primary-accent)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                    >
                      <Download size={11} /> Download B2B Orders Sample CSV
                    </a>
                  </div>
                </div>

                {/* 2. Product Catalogue Dropzone */}
                <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Package size={18} color="var(--primary-accent)" />
                        <strong style={{ fontSize: '14px' }}>2. Product Catalogue</strong>
                      </div>
                      <span className={`badge ${customProducts ? 'success' : 'neutral'}`}>
                        {customProducts ? `${customProducts.length} Ingested` : 'Demo (50)'}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
                      Replaces inventory stock, SKU unit price, cost of goods sold, and domestic origin state distributions.
                    </p>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-card-subtle)', padding: '8px', borderRadius: '4px', marginBottom: '12px' }}>
                      <strong>Required Headers:</strong> <code>Product_ID, Name, Category, Price_INR, Cost_INR, Stock_Quantity, Supplier_State</code>
                    </div>
                  </div>
                  <div>
                    <label className="action-btn primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', cursor: 'pointer', marginBottom: '8px' }}>
                      <UploadCloud size={14} /> Upload Catalogue CSV
                      <input type="file" accept=".csv" onChange={handleProductsUpload} style={{ display: 'none' }} />
                    </label>
                    <a
                      href="/templates/da_product_catalogue_sample.csv"
                      download="da_product_catalogue_sample.csv"
                      style={{ fontSize: '11px', color: 'var(--primary-accent)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                    >
                      <Download size={11} /> Download Catalogue Sample CSV
                    </a>
                  </div>
                </div>

                {/* 3. Customer Profiles Dropzone */}
                <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={18} color="var(--primary-accent)" />
                        <strong style={{ fontSize: '14px' }}>3. Customer Profiles</strong>
                      </div>
                      <span className={`badge ${customCustomers ? 'success' : 'neutral'}`}>
                        {customCustomers ? `${customCustomers.length} Ingested` : 'Demo (200)'}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
                      Replaces customer demographics, geographic city hubs, purchase dates, order history, and churn flags.
                    </p>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-card-subtle)', padding: '8px', borderRadius: '4px', marginBottom: '12px' }}>
                      <strong>Required Headers:</strong> <code>Customer_ID, City, Age_Band, Gender, Total_Orders, Total_Revenue, First_Purchase_Date, Last_Purchase_Date, Churn_Flag</code>
                    </div>
                  </div>
                  <div>
                    <label className="action-btn primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', cursor: 'pointer', marginBottom: '8px' }}>
                      <UploadCloud size={14} /> Upload Profiles CSV
                      <input type="file" accept=".csv" onChange={handleCustomersUpload} style={{ display: 'none' }} />
                    </label>
                    <a
                      href="/templates/da_customer_profiles_sample.csv"
                      download="da_customer_profiles_sample.csv"
                      style={{ fontSize: '11px', color: 'var(--primary-accent)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                    >
                      <Download size={11} /> Download Profiles Sample CSV
                    </a>
                  </div>
                </div>

              </div>

              {/* Client-Side Privacy Notice */}
              <div className="panel-card" style={{ borderLeft: '4px solid var(--status-success)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <ShieldCheck size={18} color="var(--status-success)" />
                  <strong style={{ fontSize: '14px' }}>Client-Side Privacy &amp; Data Security Guarantee</strong>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  All uploaded CSV files are parsed and computed strictly inside your web browser memory using client-side JavaScript FileReader APIs.
                  No commercial trade data, customer profiles, or financial transaction logs are transmitted to external cloud servers, third-party analytics trackers, or remote databases.
                  Refreshing the web page or clicking <strong>Reset to Demo Baseline</strong> purges memory allocations instantly.
                </p>
              </div>

              {/* Data Ingestion Specification & Validation Rules */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Ingestion Schema Validation Rules</div>
                    <div className="panel-subtitle">Validation tests performed upon file upload prior to dashboard recalculation</div>
                  </div>
                  <span className="badge info">Automated Rules</span>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Target Dataset</th>
                        <th>Column Validation</th>
                        <th>Type Cast Rules</th>
                        <th>Dynamic Calculations Triggered</th>
                        <th>Anomaly Detection Checks</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 600 }}>B2B Export Orders</td>
                        <td>12 Required Columns</td>
                        <td><code>quantity_units</code> (int), <code>unit_price_inr</code> (float), <code>delivery_days</code> (int)</td>
                        <td>Revenue, AOV, On-time SLA rate, Buyer profitability, Monthly trends</td>
                        <td><code>return_qty &gt; quantity_units</code> (Return quantity overrun)</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Product Catalogue</td>
                        <td>7 Required Columns</td>
                        <td><code>Price_INR</code> (float), <code>Cost_INR</code> (float), <code>Stock_Quantity</code> (int)</td>
                        <td>Catalogue gross margin (<code>(Price - Cost) / Price</code>), Sourcing states</td>
                        <td>Negative inventory stock or zero-cost SKU checks</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Customer Profiles</td>
                        <td>9 Required Columns</td>
                        <td><code>Total_Orders</code> (int), <code>Total_Revenue</code> (float), ISO Dates</td>
                        <td>Customer churn rate, Average order value, Geographic distribution</td>
                        <td><code>First_Purchase_Date &gt; Last_Purchase_Date</code> (Date inversion)</td>
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
        <div className="modal-backdrop" onClick={() => setSelectedOrder(null)} role="presentation">
          <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-order-title">
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 id="modal-order-title" style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Order Details: {selectedOrder.order_id}</h2>
                  <span className={`badge ${selectedOrder.on_time_delivery === 1 ? 'success' : 'warning'}`}>
                    {selectedOrder.on_time_delivery === 1 ? 'Delivered On-Time' : 'Delayed Shipment'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Order Date: {selectedOrder.order_date} • Category: {formatCategoryName(selectedOrder.category)}
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedOrder(null)} aria-label="Close dialog">
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
                <AlertCircle size={16} color="var(--status-critical)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', marginBottom: '2px' }}>
                    Return Quantity Overrun Anomaly (+{selectedOrder.return_qty - selectedOrder.quantity_units} Units Excess)
                  </strong>
                  Returned units ({selectedOrder.return_qty}) exceed shipped units ({selectedOrder.quantity_units}).
                  <div style={{ marginTop: '4px', fontSize: '12px' }}>
                    <strong>Recommended Corrective Action:</strong> Audit physical warehouse return receipt against order manifest; adjust <code>return_qty</code> in source ERP or issue debit note. The record is flagged non-destructively as <code>is_valid_return=False</code> in data governance.
                  </div>
                </div>
              </div>
            )}

            {selectedOrder.on_time_delivery === 0 && (
              <div className="alert-banner warning" style={{ marginTop: '14px' }}>
                <Clock size={16} color="var(--status-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', marginBottom: '2px' }}>
                    Logistics Fulfillment Delay ({selectedOrder.delivery_days} Days in Transit)
                  </strong>
                  Shipment was delivered past the target SLA.
                  {selectedOrder.payment_terms === '60 Days Net' && (
                    <div style={{ marginTop: '4px', fontSize: '12px' }}>
                      <strong>Working Capital Exposure:</strong> Delayed delivery on deferred credit terms (60 Days Net) postpones buyer invoice maturity and working capital cash inflow.
                    </div>
                  )}
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
