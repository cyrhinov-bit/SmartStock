/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Product, Transaction, User } from '../types';

interface DirectorFinanceProps {
  products: Product[];
  transactions: Transaction[];
  accounts: User[];
  triggerAlert: (msg: string, type?: 'success' | 'info') => void;
}

type PeriodType = 'today' | 'week' | 'month' | 'year' | 'custom';

export const DirectorFinance: React.FC<DirectorFinanceProps> = ({
  products,
  transactions,
  accounts,
  triggerAlert,
}) => {
  // --- FILTERS STATE ---
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-06-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-07-03');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedCashier, setSelectedCashier] = useState<string>('');

  // --- CHART OPTION ---
  const [chartMetric, setChartMetric] = useState<'revenue' | 'profit'>('revenue');

  // --- HELPERS FOR DATE COMPARISONS (Simulated for July 3, 2026 as "today") ---
  const TODAY_STR = '2026-07-03';
  const YESTERDAY_STR = '2026-07-02';

  const getDatesForPeriod = (p: PeriodType): { current: { start: string; end: string }; previous: { start: string; end: string } } => {
    switch (p) {
      case 'today':
        return {
          current: { start: TODAY_STR, end: TODAY_STR },
          previous: { start: YESTERDAY_STR, end: YESTERDAY_STR },
        };
      case 'week':
        // Current week: 2026-06-28 to 2026-07-03
        // Previous week: 2026-06-21 to 2026-06-27
        return {
          current: { start: '2026-06-28', end: '2026-07-03' },
          previous: { start: '2026-06-21', end: '2026-06-27' },
        };
      case 'month':
        // Current month: 2026-07-01 to 2026-07-31 (using data up to 07-03)
        // Previous month: 2026-06-01 to 2026-06-30
        return {
          current: { start: '2026-07-01', end: '2026-07-03' },
          previous: { start: '2026-06-01', end: '2026-06-30' },
        };
      case 'year':
        // Current year: 2026
        // Previous year: 2025
        return {
          current: { start: '2026-01-01', end: '2026-12-31' },
          previous: { start: '2025-01-01', end: '2025-12-31' },
        };
      case 'custom':
        return {
          current: { start: customStartDate, end: customEndDate },
          previous: { start: '1970-01-01', end: '1970-01-01' }, // Dummy for custom
        };
    }
  };

  const periodDates = useMemo(() => getDatesForPeriod(period), [period, customStartDate, customEndDate]);

  // Unique list of categories and products for filters
  const categoriesList = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category)));
  }, [products]);

  const cashiersList = useMemo(() => {
    const fromAccounts = accounts.filter(a => a.role.toLowerCase().includes('caissier') || a.role.toLowerCase().includes('directeur')).map(a => a.name);
    const fromTransactions = transactions.map(t => t.cashierName).filter((n): n is string => !!n);
    return Array.from(new Set([...fromAccounts, ...fromTransactions]));
  }, [accounts, transactions]);

  // Helper: check if transaction falls within date range
  const isWithinRange = (dateStr: string, start: string, end: string) => {
    return dateStr >= start && dateStr <= end;
  };

  // --- FILTERED TRANSACTIONS FOR COMPUTATION ---
  const filteredSalesData = useMemo(() => {
    // Only select sales transactions (either starting with VENTES or asset indicating Achat/Vente client)
    const allSales = transactions.filter(t => 
      t.category === 'VENTES POINT DE VENTE' || 
      t.asset.includes('Vente') || 
      t.asset.includes('Achat Client')
    );

    // Apply Filters
    return allSales.filter((t) => {
      const inDate = isWithinRange(t.date, periodDates.current.start, periodDates.current.end);
      
      let matchesCategory = true;
      let matchesProduct = true;
      let matchesCashier = true;

      // Filter by cashier if selected
      if (selectedCashier && t.cashierName !== selectedCashier) {
        matchesCashier = false;
      }

      // Filter items if product or category selected
      if (t.items) {
        if (selectedCategory) {
          matchesCategory = t.items.some(item => item.category === selectedCategory);
        }
        if (selectedProduct) {
          matchesProduct = t.items.some(item => item.productId === selectedProduct);
        }
      } else {
        // If transaction has no items but has category, check category
        if (selectedCategory && t.category !== selectedCategory && t.asset !== 'Achat Client PDV') {
          matchesCategory = false;
        }
        if (selectedProduct) {
          matchesProduct = false; // can't match specific product without item info
        }
      }

      return inDate && matchesCategory && matchesProduct && matchesCashier;
    });
  }, [transactions, periodDates, selectedCategory, selectedProduct, selectedCashier]);

  // --- PREVIOUS PERIOD SALES DATA FOR COMPARISONS ---
  const previousSalesData = useMemo(() => {
    if (period === 'custom') return [];
    
    const allSales = transactions.filter(t => 
      t.category === 'VENTES POINT DE VENTE' || 
      t.asset.includes('Vente') || 
      t.asset.includes('Achat Client')
    );

    return allSales.filter((t) => {
      const inDate = isWithinRange(t.date, periodDates.previous.start, periodDates.previous.end);
      
      let matchesCategory = true;
      let matchesProduct = true;
      let matchesCashier = true;

      if (selectedCashier && t.cashierName !== selectedCashier) {
        matchesCashier = false;
      }

      if (t.items) {
        if (selectedCategory) {
          matchesCategory = t.items.some(item => item.category === selectedCategory);
        }
        if (selectedProduct) {
          matchesProduct = t.items.some(item => item.productId === selectedProduct);
        }
      } else {
        if (selectedCategory && t.category !== selectedCategory && t.asset !== 'Achat Client PDV') {
          matchesCategory = false;
        }
        if (selectedProduct) {
          matchesProduct = false;
        }
      }

      return inDate && matchesCategory && matchesProduct && matchesCashier;
    });
  }, [transactions, period, periodDates, selectedCategory, selectedProduct, selectedCashier]);

  // --- CORE FINANCIAL STATS COMPUTATIONS ---
  const stats = useMemo(() => {
    const computeStats = (salesList: Transaction[]) => {
      let revenue = 0;
      let profit = 0;
      let totalItemsCount = 0;
      let totalDiscrepancies = 0;

      salesList.forEach((t) => {
        // If specific product or category filters are active, calculate CA & Profit only for matching items
        if (t.items && (selectedCategory || selectedProduct)) {
          t.items.forEach((item) => {
            const matchesCat = !selectedCategory || item.category === selectedCategory;
            const matchesProd = !selectedProduct || item.productId === selectedProduct;
            
            if (matchesCat && matchesProd) {
              const itemCA = item.price * item.quantity;
              const itemProfit = (item.price - item.purchasePrice) * item.quantity;
              
              revenue += itemCA;
              profit += itemProfit;
              totalItemsCount += item.quantity;
            }
          });
        } else {
          // Standard full transaction summation
          revenue += t.value;
          if (t.items) {
            t.items.forEach((item) => {
              profit += (item.price - item.purchasePrice) * item.quantity;
              totalItemsCount += item.quantity;
            });
          } else {
            // Fallback profit if items are missing (using average 35% margin)
            profit += t.value * 0.35;
            totalItemsCount += Math.round(t.value / 100000); // simulated
          }
        }

        if (t.difference) {
          totalDiscrepancies += t.difference;
        }
      });

      const transactionsCount = salesList.length;
      const avgTicket = transactionsCount > 0 ? revenue / transactionsCount : 0;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        revenue,
        profit,
        margin,
        avgTicket,
        transactionsCount,
        totalItemsCount,
        totalDiscrepancies,
      };
    };

    const current = computeStats(filteredSalesData);
    const previous = computeStats(previousSalesData);

    const getVariation = (currVal: number, prevVal: number) => {
      if (prevVal === 0) return currVal > 0 ? 100 : 0;
      return ((currVal - prevVal) / prevVal) * 100;
    };

    return {
      current,
      previous,
      variations: {
        revenue: getVariation(current.revenue, previous.revenue),
        profit: getVariation(current.profit, previous.profit),
        margin: current.margin - previous.margin, // direct absolute difference for percentage
        avgTicket: getVariation(current.avgTicket, previous.avgTicket),
        transactionsCount: getVariation(current.transactionsCount, previous.transactionsCount),
      },
    };
  }, [filteredSalesData, previousSalesData, selectedCategory, selectedProduct]);

  // --- SECTION 4: STOCK VALUATION & ANALYSIS ---
  const stockStats = useMemo(() => {
    let valueAtPurchase = 0;
    let valueAtSale = 0;

    products.forEach((p) => {
      const pCost = p.purchasePrice || p.price * 0.65;
      valueAtPurchase += pCost * p.stock;
      valueAtSale += p.price * p.stock;
    });

    const potentialProfit = valueAtSale - valueAtPurchase;
    const potentialMargin = valueAtSale > 0 ? (potentialProfit / valueAtSale) * 100 : 0;

    // Filter slow-moving or low stock products
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= 15);
    const outOfStock = products.filter(p => p.stock === 0);
    
    // Slow-moving or never sold products (salesVolume is 0 or undefined)
    const neverSold = products.filter(p => !p.salesVolume || p.salesVolume === 0);
    const slowMoving = products.filter(p => p.salesVolume && p.salesVolume > 0 && p.salesVolume <= 10);

    return {
      valueAtPurchase,
      valueAtSale,
      potentialProfit,
      potentialMargin,
      lowStock,
      outOfStock,
      neverSold,
      slowMoving,
    };
  }, [products]);

  // --- SECTION 5: CASHIER & PAYMENT METHOD ANALYSIS ---
  const cashierPaymentStats = useMemo(() => {
    const methods: Record<string, { value: number; count: number }> = {
      'espèces': { value: 0, count: 0 },
      'Mobile Money': { value: 0, count: 0 },
      'Carte bancaire': { value: 0, count: 0 },
    };

    const cashiers: Record<string, { revenue: number; profit: number; count: number; discrepancy: number }> = {};

    filteredSalesData.forEach((t) => {
      const method = t.paymentMethod || 'espèces';
      if (methods[method]) {
        methods[method].value += t.value;
        methods[method].count += 1;
      }

      const cashier = t.cashierName || 'Non assigné';
      if (!cashiers[cashier]) {
        cashiers[cashier] = { revenue: 0, profit: 0, count: 0, discrepancy: 0 };
      }
      cashiers[cashier].revenue += t.value;
      cashiers[cashier].count += 1;
      if (t.difference) {
        cashiers[cashier].discrepancy += t.difference;
      }

      // Calculate cashier profit
      if (t.items) {
        t.items.forEach((item) => {
          cashiers[cashier].profit += (item.price - item.purchasePrice) * item.quantity;
        });
      } else {
        cashiers[cashier].profit += t.value * 0.35;
      }
    });

    return {
      methods,
      cashiers: Object.entries(cashiers).map(([name, data]) => ({
        name,
        ...data,
        avgTicket: data.count > 0 ? data.revenue / data.count : 0,
      })),
    };
  }, [filteredSalesData]);

  // --- SECTION 6: TOP PERFORMANCES ---
  const topPerformances = useMemo(() => {
    // 1. Profit by Product
    const productStats: Record<string, { name: string; sku: string; category: string; quantity: number; revenue: number; profit: number }> = {};

    filteredSalesData.forEach((t) => {
      if (t.items) {
        t.items.forEach((item) => {
          if (!productStats[item.productId]) {
            const prodRef = products.find(p => p.id === item.productId);
            productStats[item.productId] = {
              name: item.name,
              sku: prodRef?.sku || 'SKU',
              category: item.category,
              quantity: 0,
              revenue: 0,
              profit: 0,
            };
          }
          productStats[item.productId].quantity += item.quantity;
          productStats[item.productId].revenue += item.price * item.quantity;
          productStats[item.productId].profit += (item.price - item.purchasePrice) * item.quantity;
        });
      }
    });

    const productsList = Object.values(productStats);

    // Top best-selling products (by quantity)
    const topQty = [...productsList].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    
    // Top profitable products (by gross profit)
    const topProfitableProducts = [...productsList].sort((a, b) => b.profit - a.profit).slice(0, 5);

    // 2. Profit by Category
    const categoryStats: Record<string, { name: string; revenue: number; profit: number; quantity: number }> = {};
    
    productsList.forEach((p) => {
      if (!categoryStats[p.category]) {
        categoryStats[p.category] = { name: p.category, revenue: 0, profit: 0, quantity: 0 };
      }
      categoryStats[p.category].revenue += p.revenue;
      categoryStats[p.category].profit += p.profit;
      categoryStats[p.category].quantity += p.quantity;
    });

    const topCategories = Object.values(categoryStats).sort((a, b) => b.profit - a.profit);

    // Least sold products
    const leastSold = products
      .map(p => {
        const soldRef = productStats[p.id];
        return {
          name: p.name,
          sku: p.sku,
          stock: p.stock,
          quantity: soldRef ? soldRef.quantity : 0,
          revenue: soldRef ? soldRef.revenue : 0,
        };
      })
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5);

    return {
      topQty,
      topProfitableProducts,
      topCategories,
      leastSold,
    };
  }, [filteredSalesData, products]);

  // --- SECTION 7: FINANCIAL FORECASTS ---
  const forecasts = useMemo(() => {
    // Calculate simulated forecast based on daily average of current period
    let daysInPeriod = 30; // standard default
    if (period === 'today') daysInPeriod = 1;
    else if (period === 'week') daysInPeriod = 7;
    else if (period === 'month') daysInPeriod = 3; // using July 1 - July 3 data (3 days)
    else if (period === 'year') daysInPeriod = 184; // halfway through 2026 (approx 184 days)

    const dailyAvgCA = stats.current.revenue / daysInPeriod;
    const dailyAvgProfit = stats.current.profit / daysInPeriod;

    // Projected end of month (31 days)
    const projectedMonthCA = dailyAvgCA * 31;
    const projectedMonthProfit = dailyAvgProfit * 31;

    // Projected end of year (365 days)
    const projectedYearCA = dailyAvgCA * 365;
    const projectedYearProfit = dailyAvgProfit * 365;

    // Growth trend estimation compared to previous period
    const growthTrend = stats.variations.revenue;

    return {
      dailyAvgCA,
      dailyAvgProfit,
      projectedMonthCA,
      projectedMonthProfit,
      projectedYearCA,
      projectedYearProfit,
      growthTrend,
    };
  }, [stats, period]);

  // --- SECTION 8: FINANCIAL ALERTS ---
  const financialAlerts = useMemo(() => {
    const alerts: { type: 'red' | 'orange' | 'green'; title: string; message: string; code: string }[] = [];

    // Red Alerts
    if (stats.variations.revenue < -15) {
      alerts.push({
        type: 'red',
        title: 'Chute critique du chiffre d\'affaires',
        message: `Les ventes ont chuté de ${Math.abs(stats.variations.revenue).toFixed(1)}% par rapport à la période précédente.`,
        code: 'ALT-REV-FALL',
      });
    }

    if (stats.current.margin > 0 && stats.current.margin < 20) {
      alerts.push({
        type: 'red',
        title: 'Marge bénéficiaire faible',
        message: `La marge brute actuelle de ${stats.current.margin.toFixed(1)}% est sous le seuil critique de 20%.`,
        code: 'ALT-MRG-LOW',
      });
    }

    // Check if any product is sold at a loss
    products.forEach((p) => {
      const pCost = p.purchasePrice || p.price * 0.65;
      if (p.price < pCost) {
        alerts.push({
          type: 'red',
          title: `Produit vendu à perte : ${p.name}`,
          message: `Le prix de vente (${p.price} FCFA) est inférieur au prix d'achat (${pCost} FCFA).`,
          code: 'ALT-LOSS-SALE',
        });
      }
    });

    if (stats.current.totalDiscrepancies < 0) {
      alerts.push({
        type: 'red',
        title: 'Écart de caisse négatif détecté',
        message: `Un déficit total de ${Math.abs(stats.current.totalDiscrepancies).toLocaleString('fr-FR')} FCFA a été enregistré sur les sessions de caisse.`,
        code: 'ALT-CSH-DEF',
      });
    }

    // Orange Alerts
    if (stockStats.outOfStock.length > 0) {
      alerts.push({
        type: 'orange',
        title: 'Ruptures de stock constatées',
        message: `${stockStats.outOfStock.length} produits sont en rupture de stock totale, empêchant toute vente potentielle.`,
        code: 'ALT-STK-RPT',
      });
    }

    if (stockStats.neverSold.length > 3) {
      alerts.push({
        type: 'orange',
        title: 'Volume important de stock dormant',
        message: `${stockStats.neverSold.length} produits du catalogue n'ont enregistré aucune vente historique. Capital immobilisé élevé.`,
        code: 'ALT-STK-SLW',
      });
    }

    // Green Alerts
    if (stats.variations.revenue >= 5) {
      alerts.push({
        type: 'green',
        title: 'Croissance saine du chiffre d\'affaires',
        message: `Les ventes ont augmenté de ${stats.variations.revenue.toFixed(1)}% par rapport à la période de référence.`,
        code: 'ALT-REV-GROW',
      });
    }

    if (stats.current.margin >= 35) {
      alerts.push({
        type: 'green',
        title: 'Marge bénéficiaire robuste',
        message: `La marge bénéficiaire brute est excellente à ${stats.current.margin.toFixed(1)}%.`,
        code: 'ALT-MRG-HLT',
      });
    }

    if (stats.current.totalDiscrepancies === 0 && filteredSalesData.length > 0) {
      alerts.push({
        type: 'green',
        title: 'Écarts de caisse parfaits',
        message: 'Toutes les sessions de caisse de la période sont parfaitement équilibrées (zéro écart).',
        code: 'ALT-CSH-BAL',
      });
    }

    return alerts;
  }, [stats, products, stockStats, filteredSalesData]);

  // --- SVG CHART GENERATION helper ---
  const chartDataPoints = useMemo(() => {
    // Generate dates in correct order based on period
    let points: { label: string; value: number }[] = [];

    if (period === 'today') {
      points = [
        { label: '08h-10h', value: chartMetric === 'revenue' ? 45000 : 15750 },
        { label: '10h-12h', value: chartMetric === 'revenue' ? 120000 : 42000 },
        { label: '12h-14h', value: chartMetric === 'revenue' ? 85000 : 29750 },
        { label: '14h-16h', value: chartMetric === 'revenue' ? 240000 : 84000 },
        { label: '16h-18h', value: chartMetric === 'revenue' ? 180000 : 63000 },
        { label: '18h-20h', value: chartMetric === 'revenue' ? 95000 : 33250 },
      ];
    } else if (period === 'week') {
      points = [
        { label: 'Dim 28', value: chartMetric === 'revenue' ? 180000 : 63000 },
        { label: 'Lun 29', value: chartMetric === 'revenue' ? 510000 : 178500 },
        { label: 'Mar 30', value: chartMetric === 'revenue' ? 648000 : 226800 },
        { label: 'Mer 01', value: chartMetric === 'revenue' ? 320000 : 112000 },
        { label: 'Jeu 02', value: chartMetric === 'revenue' ? 744000 : 260400 },
        { label: 'Ven 03', value: chartMetric === 'revenue' ? stats.current.revenue : stats.current.profit },
      ];
    } else if (period === 'month') {
      points = [
        { label: '01 Juil', value: chartMetric === 'revenue' ? 120000 : 42000 },
        { label: '02 Juil', value: chartMetric === 'revenue' ? 744000 : 260400 },
        { label: '03 Juil', value: chartMetric === 'revenue' ? stats.current.revenue : stats.current.profit },
      ];
    } else if (period === 'year') {
      points = [
        { label: 'Jan', value: chartMetric === 'revenue' ? 2400000 : 840000 },
        { label: 'Fév', value: chartMetric === 'revenue' ? 3100000 : 1085000 },
        { label: 'Mar', value: chartMetric === 'revenue' ? 2800000 : 980000 },
        { label: 'Avr', value: chartMetric === 'revenue' ? 3900000 : 1365000 },
        { label: 'Mai', value: chartMetric === 'revenue' ? 4200000 : 1470000 },
        { label: 'Juin', value: chartMetric === 'revenue' ? 5100000 : 1785000 },
        { label: 'Juil (Est)', value: chartMetric === 'revenue' ? stats.current.revenue * 10 : stats.current.profit * 10 },
      ];
    } else {
      // Custom period
      points = [
        { label: 'Début', value: chartMetric === 'revenue' ? stats.current.revenue * 0.3 : stats.current.profit * 0.3 },
        { label: 'Milieu', value: chartMetric === 'revenue' ? stats.current.revenue * 0.5 : stats.current.profit * 0.5 },
        { label: 'Fin', value: chartMetric === 'revenue' ? stats.current.revenue : stats.current.profit },
      ];
    }

    return points;
  }, [period, chartMetric, stats, stats.current.revenue, stats.current.profit]);

  // Export report handler helper
  const handleExport = (reportType: string, format: 'PDF' | 'EXCEL' | 'CSV') => {
    triggerAlert(`Génération et téléchargement du rapport "${reportType}" au format ${format} en cours...`, 'success');
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">💰</span>
            Analyse Financière & Pilotage
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Tableau de bord financier en temps réel basé sur les transactions certifiées et l'inventaire SmartStock.
          </p>
        </div>
        
        {/* EXPORT BUTTONS */}
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('Analyse Financière Globale', 'EXCEL')}
            className="px-3.5 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-sm">download</span> Excel
          </button>
          <button
            onClick={() => handleExport('Synthèse de Performance Directeur', 'PDF')}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span> Exporter Rapport PDF
          </button>
        </div>
      </div>

      {/* FILTERS CONTAINER */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-lg text-indigo-600">filter_alt</span>
          Filtres décisionnels globaux
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Date Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date / Période</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodType)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-indigo-300 transition-all text-gray-800"
            >
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette Semaine</option>
              <option value="month">Ce Mois-ci</option>
              <option value="year">Cette Année (2026)</option>
              <option value="custom">Période personnalisée</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Catégorie</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedProduct(''); // reset selected product
              }}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-indigo-300 transition-all text-gray-800"
            >
              <option value="">Toutes les catégories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Product Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Produit Spécifique</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-indigo-300 transition-all text-gray-800"
            >
              <option value="">Tous les produits</option>
              {products
                .filter(p => !selectedCategory || p.category === selectedCategory)
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
            </select>
          </div>

          {/* Cashier Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Opérateur / Caissier</label>
            <select
              value={selectedCashier}
              onChange={(e) => setSelectedCashier(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-indigo-300 transition-all text-gray-800"
            >
              <option value="">Tous les caissiers</option>
              {cashiersList.map((cashier) => (
                <option key={cashier} value={cashier}>{cashier}</option>
              ))}
            </select>
          </div>

          {/* Quick Clear */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setPeriod('month');
                setSelectedCategory('');
                setSelectedProduct('');
                setSelectedCashier('');
                triggerAlert('Filtres réinitialisés', 'info');
              }}
              className="w-full px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-[#3525cd] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span> Réinitialiser
            </button>
          </div>
        </div>

        {/* CUSTOM DATE PICKER ROW (Only if period is custom) */}
        {period === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-50 max-w-2xl animate-slide-down">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date de début</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-indigo-300 text-gray-800 font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date de fin</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-indigo-300 text-gray-800 font-medium"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 1: FINANCIAL KPI CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* KPI: REVENUE */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:border-indigo-200 transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
              <span className="material-symbols-outlined text-[20px]">currency_franc</span>
            </div>
            {period !== 'custom' && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${stats.variations.revenue >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                <span className="material-symbols-outlined text-xs">{stats.variations.revenue >= 0 ? 'trending_up' : 'trending_down'}</span>
                {stats.variations.revenue >= 0 ? '+' : ''}{stats.variations.revenue.toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-gray-400 text-[10px] uppercase font-bold mt-4 tracking-wider">Chiffre d'Affaires</p>
          <h3 className="text-lg font-extrabold text-gray-900 mt-1">{stats.current.revenue.toLocaleString('fr-FR')} FCFA</h3>
          <p className="text-gray-400 text-[10px] mt-1 font-medium">Sur la période filtrée</p>
        </div>

        {/* KPI: GROSS PROFIT */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:border-indigo-200 transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
            {period !== 'custom' && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${stats.variations.profit >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                <span className="material-symbols-outlined text-xs">{stats.variations.profit >= 0 ? 'trending_up' : 'trending_down'}</span>
                {stats.variations.profit >= 0 ? '+' : ''}{stats.variations.profit.toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-gray-400 text-[10px] uppercase font-bold mt-4 tracking-wider">Bénéfice Brut</p>
          <h3 className="text-lg font-extrabold text-gray-900 mt-1">{stats.current.profit.toLocaleString('fr-FR')} FCFA</h3>
          <p className="text-gray-400 text-[10px] mt-1 font-medium">CA - Coûts d'Achat</p>
        </div>

        {/* KPI: MARGIN */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:border-indigo-200 transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl">
              <span className="material-symbols-outlined text-[20px]">percent</span>
            </div>
            {period !== 'custom' && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${stats.variations.margin >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                <span className="material-symbols-outlined text-xs">{stats.variations.margin >= 0 ? 'trending_up' : 'trending_down'}</span>
                {stats.variations.margin >= 0 ? '+' : ''}{stats.variations.margin.toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-gray-400 text-[10px] uppercase font-bold mt-4 tracking-wider">Marge Brute</p>
          <h3 className="text-lg font-extrabold text-gray-900 mt-1">{stats.current.margin.toFixed(1)}%</h3>
          <p className="text-gray-400 text-[10px] mt-1 font-medium">Bénéfice / CA</p>
        </div>

        {/* KPI: AVERAGE TICKET */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:border-indigo-200 transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
              <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
            </div>
            {period !== 'custom' && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${stats.variations.avgTicket >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                <span className="material-symbols-outlined text-xs">{stats.variations.avgTicket >= 0 ? 'trending_up' : 'trending_down'}</span>
                {stats.variations.avgTicket >= 0 ? '+' : ''}{stats.variations.avgTicket.toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-gray-400 text-[10px] uppercase font-bold mt-4 tracking-wider">Panier Moyen</p>
          <h3 className="text-lg font-extrabold text-gray-900 mt-1">{Math.round(stats.current.avgTicket).toLocaleString('fr-FR')} FCFA</h3>
          <p className="text-gray-400 text-[10px] mt-1 font-medium">CA / transactions</p>
        </div>

        {/* KPI: SALES VOLUME */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:border-indigo-200 transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
              <span className="material-symbols-outlined text-[20px]">inventory</span>
            </div>
            {period !== 'custom' && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${stats.variations.transactionsCount >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                <span className="material-symbols-outlined text-xs">{stats.variations.transactionsCount >= 0 ? 'trending_up' : 'trending_down'}</span>
                {stats.variations.transactionsCount >= 0 ? '+' : ''}{stats.variations.transactionsCount.toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-gray-400 text-[10px] uppercase font-bold mt-4 tracking-wider">Ventes totales</p>
          <h3 className="text-lg font-extrabold text-gray-900 mt-1">{stats.current.transactionsCount} vtes</h3>
          <p className="text-gray-400 text-[10px] mt-1 font-medium">{stats.current.totalItemsCount} articles vendus</p>
        </div>
      </div>

      {/* ROW: SECTION 2 & SECTION 8 (CHARTS & ALERTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SECTION 2: VISUAL TREND CHART PANEL */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Évolution temporelle de la performance</h4>
              <p className="text-gray-400 text-xs">Aperçu dynamique de la tendance sur la période</p>
            </div>
            
            {/* Metric Selector Toggle */}
            <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs font-bold text-gray-600">
              <button
                onClick={() => setChartMetric('revenue')}
                className={`px-3 py-1 rounded-md transition-all ${chartMetric === 'revenue' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-indigo-600'}`}
              >
                Chiffre d'Affaires
              </button>
              <button
                onClick={() => setChartMetric('profit')}
                className={`px-3 py-1 rounded-md transition-all ${chartMetric === 'profit' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-emerald-600'}`}
              >
                Bénéfices
              </button>
            </div>
          </div>

          {/* HIGH POLISH SVG LINE CHART */}
          <div className="h-64 w-full relative pt-4 flex flex-col justify-end">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-gray-400 font-mono">
              <div className="border-b border-gray-100 pb-1 flex justify-between w-full">
                <span>{(Math.max(...chartDataPoints.map(p => p.value)) * 1.1).toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="border-b border-gray-100 pb-1 flex justify-between w-full">
                <span>{(Math.max(...chartDataPoints.map(p => p.value)) * 0.55).toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="border-b border-gray-100 pb-1">
                <span>0 FCFA</span>
              </div>
            </div>

            {/* Custom Interactive SVG Line Plot */}
            <svg viewBox="0 0 500 180" className="w-full h-44 overflow-visible z-10">
              {/* Grid Lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />

              {/* Area path */}
              <path
                d={`
                  M 0,150 
                  ${chartDataPoints.map((p, index) => {
                    const x = (index / (chartDataPoints.length - 1)) * 500;
                    const maxVal = Math.max(...chartDataPoints.map(dp => dp.value)) || 1;
                    const y = 150 - (p.value / maxVal) * 120;
                    return `L ${x},${y}`;
                  }).join(' ')}
                  L 500,150 Z
                `}
                fill={chartMetric === 'revenue' ? 'url(#grad-revenue)' : 'url(#grad-profit)'}
                opacity="0.15"
              />

              {/* Line path */}
              <path
                d={chartDataPoints.map((p, index) => {
                  const x = (index / (chartDataPoints.length - 1)) * 500;
                  const maxVal = Math.max(...chartDataPoints.map(dp => dp.value)) || 1;
                  const y = 150 - (p.value / maxVal) * 120;
                  return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke={chartMetric === 'revenue' ? '#3525cd' : '#10b981'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Dots and Labels */}
              {chartDataPoints.map((p, index) => {
                const x = (index / (chartDataPoints.length - 1)) * 500;
                const maxVal = Math.max(...chartDataPoints.map(dp => dp.value)) || 1;
                const y = 150 - (p.value / maxVal) * 120;

                return (
                  <g key={index} className="group/dot cursor-pointer">
                    <circle
                      cx={x}
                      cy={y}
                      r="5"
                      fill={chartMetric === 'revenue' ? '#3525cd' : '#10b981'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="9"
                      fill={chartMetric === 'revenue' ? '#3525cd' : '#10b981'}
                      opacity="0"
                      className="group-hover/dot:opacity-20 transition-all"
                    />
                    {/* Floating Value Tooltip on Hover */}
                    <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <rect
                        x={x - 55}
                        y={y - 32}
                        width="110"
                        height="22"
                        rx="4"
                        fill="#1e1b4b"
                      />
                      <text
                        x={x}
                        y={y - 17}
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {p.value.toLocaleString('fr-FR')} F
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Definitions */}
              <defs>
                <linearGradient id="grad-revenue" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3525cd" />
                  <stop offset="100%" stopColor="#3525cd" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="grad-profit" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            {/* X Axis Labels */}
            <div className="flex justify-between text-[11px] font-semibold text-gray-500 mt-2 border-t border-gray-100 pt-2 px-1">
              {chartDataPoints.map((p, index) => (
                <span key={index}>{p.label}</span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 justify-center text-[11px] text-gray-500 pt-2">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Évolution CA</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Évolution Bénéfices</span>
            <span className="text-gray-300">|</span>
            <span className="italic">Survolez les points pour afficher le montant</span>
          </div>
        </div>

        {/* SECTION 8: FINANCIAL ALERTS CENTER PANEL */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="pb-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Alertes de Pilotage</h4>
              <p className="text-gray-400 text-[11px]">Détection d'anomalies et d'opportunités de marge</p>
            </div>
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-600 rounded-full">
              {financialAlerts.length} Messages
            </span>
          </div>

          {/* ALERTS ACCORDION LIST */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 max-h-[220px] custom-scrollbar">
            {financialAlerts.length > 0 ? (
              financialAlerts.map((alt, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                    alt.type === 'red'
                      ? 'bg-rose-50/30 border-rose-100 text-rose-800'
                      : alt.type === 'orange'
                      ? 'bg-amber-50/30 border-amber-100 text-amber-800'
                      : 'bg-emerald-50/30 border-emerald-100 text-emerald-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] mt-0.5">
                    {alt.type === 'red' ? 'error' : alt.type === 'orange' ? 'warning' : 'check_circle'}
                  </span>
                  <div>
                    <h5 className="text-xs font-bold leading-normal">{alt.title}</h5>
                    <p className="text-[10px] opacity-80 mt-0.5 leading-relaxed">{alt.message}</p>
                    <span className="text-[8px] font-mono opacity-60 block mt-1">{alt.code}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                <span className="material-symbols-outlined text-3xl">verified_user</span>
                <p className="text-xs mt-2">Aucune alerte critique signalée</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-semibold">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Rouge : Critique</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Orange : Risque</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Vert : Conforme</span>
          </div>
        </div>

      </div>

      {/* ROW: SECTION 3 & SECTION 4 (PROFIT ANALYSIS & STOCK VALUATION) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SECTION 3: PROFIT & MARGIN ANALYSIS (RENTABILITÉ) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Rentabilité Analytique</h4>
            <p className="text-gray-400 text-xs">Calculs précis de marge (Bénéfice = Prix de Vente - Prix d'Achat)</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl space-y-1">
              <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Masse Bénéficiaire brute</span>
              <p className="text-lg font-extrabold text-gray-900">{stats.current.profit.toLocaleString('fr-FR')} FCFA</p>
              <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${stats.current.margin}%` }}></div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-xl space-y-1">
              <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Taux de Marge Moyen</span>
              <p className="text-lg font-extrabold text-gray-900">{stats.current.margin.toFixed(1)} %</p>
              <span className="text-[10px] text-gray-400 block mt-1">Marge théorique visée : 35%</span>
            </div>
          </div>

          {/* Breakdowns lists */}
          <div className="space-y-4">
            <h5 className="text-xs font-bold text-gray-800 border-b border-gray-50 pb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-indigo-600">category</span>
              Rentabilité par Catégorie Produit
            </h5>
            
            <div className="space-y-3.5">
              {topPerformances.topCategories.length > 0 ? (
                topPerformances.topCategories.map((cat, idx) => {
                  const catMargin = cat.revenue > 0 ? (cat.profit / cat.revenue) * 100 : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-800">{cat.name}</span>
                        <span className="text-gray-500 font-medium">
                          {cat.profit.toLocaleString('fr-FR')} FCFA ({catMargin.toFixed(1)}% mrg)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full">
                        <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${catMargin}%` }}></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">Aucune donnée disponible</p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4: STOCK FINANCIAL VALUE ANALYSIS */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Valorisation Financière des Stocks</h4>
            <p className="text-gray-400 text-xs">Analyse du capital immobilisé et profit de vente potentiel</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-100 rounded-xl bg-[#fafaff]">
              <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Valeur au Prix d'Achat (Coût)</span>
              <p className="text-base font-extrabold text-indigo-950 mt-1">
                {stockStats.valueAtPurchase.toLocaleString('fr-FR')} FCFA
              </p>
              <p className="text-[10px] text-gray-400 mt-1">Capital immobilisé net</p>
            </div>

            <div className="p-4 border border-gray-100 rounded-xl bg-[#f6fffb]">
              <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Valeur au Prix de Vente (Catalogue)</span>
              <p className="text-base font-extrabold text-emerald-950 mt-1">
                {stockStats.valueAtSale.toLocaleString('fr-FR')} FCFA
              </p>
              <p className="text-[10px] text-gray-400 mt-1">Revenu brut estimé si écoulé</p>
            </div>
          </div>

          {/* Potential Profit & Slow Stock */}
          <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Bénéfice Potentiel du Stock</span>
              <h4 className="text-lg font-black text-indigo-900 mt-0.5">
                {stockStats.potentialProfit.toLocaleString('fr-FR')} FCFA
              </h4>
              <span className="text-[10px] text-gray-500 mt-1 block">Taux de marge estimé : {stockStats.potentialMargin.toFixed(1)}%</span>
            </div>
            <div className="text-xs text-right text-gray-600 font-semibold space-y-1">
              <p className="flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> {stockStats.outOfStock.length} Ruptures
              </p>
              <p className="flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> {stockStats.lowStock.length} Stocks Faibles
              </p>
              <p className="flex items-center gap-1.5 justify-end text-purple-700">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span> {stockStats.neverSold.length} Réf Dormantes
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ROW: SECTION 5 & SECTION 7 (CASHIER CLOSINGS & FORECASTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SECTION 5: CASH CLOSINGS & OPERATORS CLOSINGS */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Analyse Financière des Caisses</h4>
            <p className="text-gray-400 text-xs">Suivi des encaissements par mode de paiement, caissiers et écarts de caisse</p>
          </div>

          {/* Methods Breakdowns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-gray-50 pb-6">
            {Object.entries(cashierPaymentStats.methods).map(([method, rawData]) => {
              const data = rawData as { value: number; count: number };
              const share = stats.current.revenue > 0 ? (data.value / stats.current.revenue) * 100 : 0;
              return (
                <div key={method} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100/50 space-y-1">
                  <span className="text-gray-400 text-[9px] uppercase font-bold tracking-wider">{method}</span>
                  <p className="text-sm font-bold text-gray-900">{data.value.toLocaleString('fr-FR')} FCFA</p>
                  <span className="text-[10px] text-indigo-600 font-semibold">{share.toFixed(1)}% de part ({data.count} vtes)</span>
                </div>
              );
            })}
          </div>

          {/* Cashiers Table */}
          <div className="space-y-4">
            <h5 className="text-xs font-bold text-gray-800 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-indigo-600">badge</span>
              Performance et Écarts par Caissier
            </h5>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-400 font-bold border-b border-gray-50 text-[10px] uppercase">
                    <th className="pb-2">Caissier</th>
                    <th className="pb-2">Chiffre d'Affaires</th>
                    <th className="pb-2">Panier Moyen</th>
                    <th className="pb-2 text-right">Écart constaté</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cashierPaymentStats.cashiers.length > 0 ? (
                    cashierPaymentStats.cashiers.map((cashier, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-2.5 font-bold text-gray-800">{cashier.name}</td>
                        <td className="py-2.5 font-semibold text-gray-700">
                          {cashier.revenue.toLocaleString('fr-FR')} FCFA ({cashier.count} vtes)
                        </td>
                        <td className="py-2.5 font-medium text-gray-500">
                          {Math.round(cashier.avgTicket).toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className={`py-2.5 text-right font-bold ${cashier.discrepancy < 0 ? 'text-rose-600' : cashier.discrepancy > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {cashier.discrepancy > 0 ? '+' : ''}
                          {cashier.discrepancy.toLocaleString('fr-FR')} FCFA
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-400">Aucune vente enregistrée</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SECTION 7: FINANCIAL FORECASTS & PROJECTIONS */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Prévisions & Projections de Fin de Période</h4>
            <p className="text-gray-400 text-xs">Calculs prévisionnels automatisés basés sur la vitesse de vente historique</p>
          </div>

          <div className="space-y-4">
            {/* Forecast details list */}
            <div className="p-4 bg-indigo-50/20 border border-indigo-100/30 rounded-xl space-y-3.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-700">Vitesse de vente moyenne journalière (CA)</span>
                <span className="text-xs font-black text-indigo-950">{Math.round(forecasts.dailyAvgCA).toLocaleString('fr-FR')} FCFA / jour</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-700">Bénéfice moyen journalier</span>
                <span className="text-xs font-black text-emerald-800">{Math.round(forecasts.dailyAvgProfit).toLocaleString('fr-FR')} FCFA / jour</span>
              </div>
            </div>

            {/* Projections grids */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Projection Mensuelle Estimée</span>
                <p className="text-sm font-extrabold text-gray-900">
                  {Math.round(forecasts.projectedMonthCA).toLocaleString('fr-FR')} FCFA
                </p>
                <span className="text-[10px] text-emerald-600 font-bold block">
                  Bénéfice estimé : {Math.round(forecasts.projectedMonthProfit).toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Projection Annuelle Estimée</span>
                <p className="text-sm font-extrabold text-gray-900">
                  {Math.round(forecasts.projectedYearCA).toLocaleString('fr-FR')} FCFA
                </p>
                <span className="text-[10px] text-emerald-600 font-bold block">
                  Bénéfice estimé : {Math.round(forecasts.projectedYearProfit).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>

            {/* Simulated AI Smart insight */}
            <div className="p-3.5 bg-gradient-to-r from-[#fafaff] to-[#f4f7ff] rounded-xl border border-[#eceeff] flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div className="space-y-0.5">
                <h5 className="text-xs font-bold text-indigo-900">Recommandation du pilote décisionnel</h5>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  {stats.variations.revenue >= 0
                    ? `Les tendances sont haussières à +${stats.variations.revenue.toFixed(1)}%. Il est recommandé d'augmenter le stock de sécurité des produits de la catégorie Électronique pour éviter des ruptures au trimestre prochain.`
                    : 'Les ventes affichent un ralentissement sur la période. Nous préconisons une opération de déstockage ciblant les produits "dormants" afin de libérer de la trésorerie et réduire les coûts d\'immobilisation.'}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 6: TOP & WORST PERFORMERS LISTS (BENTO GRID) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
        <div>
          <h4 className="font-bold text-gray-900 text-sm">Palmarès des Performances Opérationnelles</h4>
          <p className="text-gray-400 text-xs">Classements d'évaluation de rentabilité et d'écoulement du stock</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Top Products (Qty) */}
          <div className="p-4 bg-gray-50 rounded-xl space-y-3">
            <h5 className="text-xs font-black text-gray-800 flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <span className="material-symbols-outlined text-sm text-indigo-600">leaderboard</span>
              Top 5 - Volumes Vendus
            </h5>
            <div className="space-y-2.5">
              {topPerformances.topQty.length > 0 ? (
                topPerformances.topQty.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-700 truncate max-w-[120px]">{item.name}</span>
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full text-[10px]">{item.quantity} unités</span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-gray-400">Aucune vente</p>
              )}
            </div>
          </div>

          {/* Top Profitable Products */}
          <div className="p-4 bg-gray-50 rounded-xl space-y-3">
            <h5 className="text-xs font-black text-gray-800 flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <span className="material-symbols-outlined text-sm text-emerald-600">payments</span>
              Top 5 - Plus Rentables
            </h5>
            <div className="space-y-2.5">
              {topPerformances.topProfitableProducts.length > 0 ? (
                topPerformances.topProfitableProducts.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-700 truncate max-w-[120px]">{item.name}</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                      +{item.profit.toLocaleString('fr-FR')} F
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-gray-400">Aucune vente</p>
              )}
            </div>
          </div>

          {/* Least Sold Products */}
          <div className="p-4 bg-gray-50 rounded-xl space-y-3">
            <h5 className="text-xs font-black text-gray-800 flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <span className="material-symbols-outlined text-sm text-rose-600">trending_down</span>
              Moins Vendus (Risques)
            </h5>
            <div className="space-y-2.5">
              {topPerformances.leastSold.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-700 truncate max-w-[120px]">{item.name}</span>
                  <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-[10px]">
                    {item.quantity} vtes (stk: {item.stock})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Never Sold Products (Stock dormant) */}
          <div className="p-4 bg-gray-50 rounded-xl space-y-3">
            <h5 className="text-xs font-black text-gray-800 flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <span className="material-symbols-outlined text-sm text-purple-600">inventory_2</span>
              Jamais Vendus (Stock Dormant)
            </h5>
            <div className="space-y-2.5">
              {stockStats.neverSold.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-700 truncate max-w-[120px]">{item.name}</span>
                  <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full text-[10px]">
                    Stk: {item.stock} unités
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
