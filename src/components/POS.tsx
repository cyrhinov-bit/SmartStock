/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Product, CartItem, User, GovernanceLog, Transaction } from '../types';

interface POSProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  searchQuery: string;
  onCheckoutSuccess: (amount: number, details: string) => void;
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  onLogout: () => void;
  activeTab: 'sale' | 'suspended' | 'returns' | 'history' | 'caisse' | 'stats' | 'profile' | 'settings';
  setActiveTab: (tab: any) => void;
  activeSubTab: string;
  setActiveSubTab: (subTab: string) => void;
  accounts: User[];
  setAccounts: React.Dispatch<React.SetStateAction<User[]>>;
  logs: GovernanceLog[];
  setLogs: React.Dispatch<React.SetStateAction<GovernanceLog[]>>;
}

interface SuspendedSale {
  id: string;
  date: string;
  time: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  customerType: string;
}

interface CaisseSession {
  id: string;
  cashier: string;
  openedAtDate: string;
  openedAtTime: string;
  closedAtDate?: string;
  closedAtTime?: string;
  initialCash: number;
  salesCash: number;
  salesCard: number;
  salesMobileMoney: number;
  salesMixed: number;
  theoreticalCash: number;
  realCash?: number;
  discrepancy?: number;
  status: 'Open' | 'Closed';
  observation?: string;
}

export const POS: React.FC<POSProps> = ({
  products,
  setProducts,
  cart,
  setCart,
  searchQuery,
  onCheckoutSuccess,
  currentUser,
  setCurrentUser,
  onLogout,
  activeTab,
  setActiveTab,
  activeSubTab,
  setActiveSubTab,
  accounts,
  setAccounts,
  logs,
  setLogs,
}) => {
  // Settings & Sound engine states
  const [audioEnabled, setAudioEnabled] = useState<boolean>(() => {
    return localStorage.getItem('pos_setting_sound') !== 'false';
  });
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('pos_setting_display') as 'grid' | 'list') || 'grid';
  });
  const [receiptPrinter, setReceiptPrinter] = useState<string>(() => {
    return localStorage.getItem('pos_setting_printer') || 'Ticket Thermique 80mm';
  });
  const [lowStockAlert, setLowStockAlert] = useState<number>(() => {
    return Number(localStorage.getItem('pos_setting_lowstock') || '5');
  });

  // Caisse Session States
  const [caisseOpen, setCaisseOpen] = useState<boolean>(() => {
    return localStorage.getItem('pos_caisse_open') === 'true';
  });
  const [caisseInitial, setCaisseInitial] = useState<number>(() => {
    return Number(localStorage.getItem('pos_caisse_initial') || '50000');
  });
  const [caisseOpenDate, setCaisseOpenDate] = useState<string>(() => {
    return localStorage.getItem('pos_caisse_open_date') || '';
  });
  const [caisseOpenTime, setCaisseOpenTime] = useState<string>(() => {
    return localStorage.getItem('pos_caisse_open_time') || '';
  });
  const [caisseSessionId, setCaisseSessionId] = useState<string>(() => {
    return localStorage.getItem('pos_caisse_session_id') || '';
  });

  // Form states for caisse opening & closing
  const [openFormCash, setOpenFormCash] = useState<string>('50000');
  const [openFormObs, setOpenFormObs] = useState<string>('');
  const [closeFormRealCash, setCloseFormRealCash] = useState<string>('');
  const [closeFormObs, setCloseFormObs] = useState<string>('');

  // Suspended Sales state
  const [suspendedSales, setSuspendedSales] = useState<SuspendedSale[]>(() => {
    const saved = localStorage.getItem('pos_suspended_sales');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'SUSP-8172',
        date: new Date().toLocaleDateString('fr-FR'),
        time: '10:42',
        items: [
          { product: products[0] || {} as Product, quantity: 2 }
        ],
        subtotal: (products[0]?.price || 0) * 2,
        total: Math.round(((products[0]?.price || 0) * 2) * 1.08),
        customerType: 'walkin',
      }
    ].filter(s => s.items[0]?.product?.id); // filter invalid mock templates
  });

  // Sales sessions / Opening closure logs state
  const [caisseSessions, setCaisseSessions] = useState<CaisseSession[]>(() => {
    const saved = localStorage.getItem('pos_caisse_sessions');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'SESS-2026-07-01',
        cashier: currentUser.name,
        openedAtDate: '2026-07-01',
        openedAtTime: '08:00',
        closedAtDate: '2026-07-01',
        closedAtTime: '18:15',
        initialCash: 50000,
        salesCash: 125000,
        salesCard: 80000,
        salesMobileMoney: 45000,
        salesMixed: 0,
        theoreticalCash: 175000,
        realCash: 175000,
        discrepancy: 0,
        status: 'Closed',
        observation: 'Caisse fermée sans aucun écart constaté. Fin de service.',
      }
    ];
  });

  // Completed Sales History
  const [completedSales, setCompletedSales] = useState<any[]>(() => {
    const saved = localStorage.getItem('pos_completed_sales');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'TX-0192',
        date: new Date().toISOString().split('T')[0],
        time: '14:15',
        cashier: currentUser.name,
        customerType: 'Client de passage',
        payMethod: 'ESPÈCES',
        subtotal: 150000,
        tax: 12000,
        total: 162000,
        items: [
          {
            product: { sku: 'FRN-00214', name: 'Cafetière Espresso Automatique', price: 150000 },
            quantity: 1
          }
        ],
        status: 'Valid',
      }
    ];
  });

  // Profile modifications state
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || '');
  const [profilePassword, setProfilePassword] = useState('');

  // Sale Checkout input fields states
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [payMethod, setPayMethod] = useState<'cash' | 'card' | 'mobile' | 'mixed'>('cash');
  const [customer, setCustomer] = useState<'walkin' | 'corporate' | 'vip'>('walkin');
  
  // Cash details
  const [cashReceived, setCashReceived] = useState<string>('');
  
  // Mobile money details
  const [mmOperator, setMmOperator] = useState<string>('Wave');
  const [mmPhone, setMmPhone] = useState<string>('');
  const [mmRef, setMmRef] = useState<string>('');

  // Mixed details
  const [mixedCash, setMixedCash] = useState<string>('');
  const [mixedCard, setMixedCard] = useState<string>('');
  const [mixedMobile, setMixedMobile] = useState<string>('');

  // Returns Search State
  const [returnSearchId, setReturnSearchId] = useState('');
  const [foundReturnTx, setFoundReturnTx] = useState<any | null>(null);
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState('');
  const [returnActionType, setReturnActionType] = useState<'refund' | 'exchange'>('refund');
  const [exchangeProductSku, setExchangeProductSku] = useState('');

  // Receipt Modal State
  const [showReceipt, setShowReceipt] = useState(false);
  const [recentReceipt, setRecentReceipt] = useState<any | null>(null);

  // Synchronize localStorage
  useEffect(() => {
    localStorage.setItem('pos_setting_sound', String(audioEnabled));
  }, [audioEnabled]);

  useEffect(() => {
    localStorage.setItem('pos_setting_display', displayMode);
  }, [displayMode]);

  useEffect(() => {
    localStorage.setItem('pos_setting_printer', receiptPrinter);
  }, [receiptPrinter]);

  useEffect(() => {
    localStorage.setItem('pos_setting_lowstock', String(lowStockAlert));
  }, [lowStockAlert]);

  useEffect(() => {
    localStorage.setItem('pos_suspended_sales', JSON.stringify(suspendedSales));
  }, [suspendedSales]);

  useEffect(() => {
    localStorage.setItem('pos_caisse_sessions', JSON.stringify(caisseSessions));
  }, [caisseSessions]);

  useEffect(() => {
    localStorage.setItem('pos_completed_sales', JSON.stringify(completedSales));
  }, [completedSales]);

  // Dynamic sound effects engine (Beep on scan, cash register chime)
  const playSound = (type: 'beep' | 'cash') => {
    if (!audioEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (type === 'beep') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'cash') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, ctx.currentTime);
        osc1.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1320, ctx.currentTime);
        osc2.frequency.setValueAtTime(1650, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.4);
        osc2.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn('AudioContext failed to load due to iframe permission limits: ', e);
    }
  };

  // Barcode Scanner states
  const [scanInput, setScanInput] = useState<string>('');
  const [scanToast, setScanToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-focus barcode scan field when in sale tab and caisse is open
  useEffect(() => {
    if (activeTab === 'sale' && caisseOpen) {
      const timer = setTimeout(() => {
        const field = document.getElementById('pos-scan-field');
        if (field) field.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, caisseOpen, cart.length]);

  // Keyboard Shortcuts listener (F1-F6, Entrée, Suppr, Échap)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT'
      );

      // Function keys (F1-F6) are ALWAYS captured to navigate the POS
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('sale');
        setTimeout(() => {
          const cashInput = document.getElementById('pos-cash-input') || document.getElementById('pos-scan-field');
          if (cashInput) (cashInput as HTMLElement).focus();
        }, 150);
      } else if (e.key === 'F2') {
        e.preventDefault();
        handleSuspendSale();
      } else if (e.key === 'F3') {
        e.preventDefault();
        if (cart.length > 0 && window.confirm('Voulez-vous vraiment annuler la vente et vider le panier ?')) {
          handleClearCart();
        }
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) {
          const lastItem = cart[cart.length - 1];
          const newQtyStr = window.prompt(`[F4] Modifier la quantité de "${lastItem.product.name}" (en stock: ${lastItem.product.stock}) :`, String(lastItem.quantity));
          if (newQtyStr !== null) {
            const val = parseInt(newQtyStr, 10);
            if (!isNaN(val) && val > 0) {
              if (val > lastItem.product.stock) {
                alert(`Stock maximum disponible dépassé (${lastItem.product.stock}).`);
              } else {
                const updatedCart = [...cart];
                updatedCart[cart.length - 1].quantity = val;
                setCart(updatedCart);
                playSound('beep');
              }
            } else if (val === 0) {
              setCart(cart.filter(item => item.product.id !== lastItem.product.id));
            }
          }
        } else {
          alert('Le panier est vide.');
        }
      } else if (e.key === 'F5') {
        e.preventDefault();
        const nextCust = customer === 'walkin' ? 'corporate' : customer === 'corporate' ? 'vip' : 'walkin';
        setCustomer(nextCust);
      } else if (e.key === 'F6') {
        e.preventDefault();
        setActiveTab('history');
      } else if (e.key === 'Enter') {
        // If the user hits enter outside of an input, and the cart is filled, trigger checkout
        if (activeTab === 'sale' && !isInput && cart.length > 0) {
          e.preventDefault();
          handleCheckout();
        }
      } else if (e.key === 'Delete' || e.key === 'Del') {
        // Supprimer le dernier article du panier
        if (activeTab === 'sale' && !isInput && cart.length > 0) {
          e.preventDefault();
          const lastItem = cart[cart.length - 1];
          if (window.confirm(`Supprimer ${lastItem.product.name} du panier ?`)) {
            setCart(cart.slice(0, -1));
          }
        }
      } else if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        if (showReceipt) {
          setShowReceipt(false);
        } else {
          setActiveTab('sale');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, customer, activeTab, showReceipt, payMethod, cashReceived, mixedCash, mixedCard, mixedMobile, caisseOpen]);

  // Barcode Scanner core lookup logic
  const processBarcodeScan = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    if (!caisseOpen) {
      alert("Veuillez d'abord ouvrir la caisse dans l'onglet 'Gestion de la caisse'.");
      setActiveTab('caisse');
      return;
    }

    // Match by SKU/Barcode (exact, case-insensitive) or by Name
    const found = products.find(
      p => p.sku.toLowerCase() === trimmed.toLowerCase() || p.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (found) {
      if (found.stock <= 0) {
        setScanToast({ message: `Rupture de stock pour "${found.name}" (SKU: ${found.sku})`, type: 'error' });
        setTimeout(() => setScanToast(null), 3500);
        setScanInput('');
        return;
      }

      // Add to cart
      handleAddToCart(found);

      // Show confirmation visual feedback
      setScanToast({
        message: `✔ Article détecté : ${found.name} (${found.price.toLocaleString('fr-FR')} F CFA) - Ajouté au panier !`,
        type: 'success'
      });
      setTimeout(() => setScanToast(null), 3000);
    } else {
      // Inconnu
      setScanToast({
        message: `⚠ Code-barres inconnu : "${trimmed}". Aucun article correspondant trouvé dans l'ERP.`,
        type: 'error'
      });
      setTimeout(() => setScanToast(null), 4000);
    }

    setScanInput('');
    // Recenter cursor automatically
    setTimeout(() => {
      const field = document.getElementById('pos-scan-field');
      if (field) field.focus();
    }, 50);
  };

  const handleScanInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      processBarcodeScan(scanInput);
    }
  };

  const handleManualScanSubmit = () => {
    processBarcodeScan(scanInput);
  };

  // Categories helper
  const categories = useMemo(() => {
    return ['Tous', ...Array.from(new Set(products.map((p) => p.category)))];
  }, [products]);

  // Filtered Products Catalog
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'Tous' || p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart actions with beep
  const handleAddToCart = (product: Product) => {
    if (!caisseOpen) {
      alert("La caisse est actuellement fermée. Vous devez ouvrir la caisse dans l'onglet 'Gestion de la caisse' avant de pouvoir faire une vente.");
      setActiveTab('caisse');
      return;
    }
    if (product.stock <= 0) {
      alert('Ce produit est actuellement en rupture de stock.');
      return;
    }

    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty >= product.stock) {
        alert(`Impossible d'ajouter plus. Seulement ${product.stock} unités disponibles en stock.`);
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    playSound('beep');
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    const itemIndex = cart.findIndex((item) => item.product.id === productId);
    if (itemIndex === -1) return;

    const item = cart[itemIndex];
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      setCart(cart.filter((i) => i.product.id !== productId));
    } else {
      if (newQty > item.product.stock) {
        alert(`Stock maximum disponible dépassé (${item.product.stock}).`);
        return;
      }
      const updatedCart = [...cart];
      updatedCart[itemIndex].quantity = newQty;
      setCart(updatedCart);
    }
    playSound('beep');
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Pricing math
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [cart]);
  const taxRate = 0.08; // 8% VAT
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax;

  // Change calculator for Cash Payment
  const monnaieARendre = useMemo(() => {
    if (payMethod !== 'cash') return 0;
    const received = Number(cashReceived) || 0;
    if (received < total) return 0;
    return received - total;
  }, [cashReceived, total, payMethod]);

  const cashIsSufficient = useMemo(() => {
    if (payMethod !== 'cash') return true;
    const received = Number(cashReceived) || 0;
    return received >= total;
  }, [cashReceived, total, payMethod]);

  // Mixed splits validations
  const mixedAmountsSum = useMemo(() => {
    if (payMethod !== 'mixed') return 0;
    const cash = Number(mixedCash) || 0;
    const card = Number(mixedCard) || 0;
    const mm = Number(mixedMobile) || 0;
    return cash + card + mm;
  }, [payMethod, mixedCash, mixedCard, mixedMobile]);

  const mixedRemaining = useMemo(() => {
    return Math.max(0, total - mixedAmountsSum);
  }, [total, mixedAmountsSum]);

  const mixedIsMatched = useMemo(() => {
    return mixedRemaining === 0;
  }, [mixedRemaining]);

  // Simulated scan tool
  const triggerSimulatedBarcodeScan = () => {
    if (!caisseOpen) {
      setScanToast({ message: "Veuillez d'abord ouvrir la caisse.", type: 'error' });
      setTimeout(() => setScanToast(null), 3000);
      setActiveTab('caisse');
      return;
    }
    const eligible = products.filter(p => p.stock > 0);
    if (eligible.length === 0) {
      setScanToast({ message: 'Tous les produits du stock sont actuellement en rupture.', type: 'error' });
      setTimeout(() => setScanToast(null), 3000);
      return;
    }
    const randomProduct = eligible[Math.floor(Math.random() * eligible.length)];
    handleAddToCart(randomProduct);
    
    setScanToast({
      message: `✔ [Simulateur] SKU ${randomProduct.sku} (${randomProduct.name}) scanné !`,
      type: 'success'
    });
    setTimeout(() => setScanToast(null), 3000);
  };

  // Caisse Session Operations
  const handleOpenCaisse = (e: React.FormEvent) => {
    e.preventDefault();
    const initialAmt = Number(openFormCash) || 0;
    if (initialAmt < 0) {
      alert('Le montant de départ doit être supérieur ou égal à 0.');
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const sId = `SESS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${now.getTime().toString().slice(-4)}`;

    setCaisseOpen(true);
    setCaisseInitial(initialAmt);
    setCaisseOpenDate(dateStr);
    setCaisseOpenTime(timeStr);
    setCaisseSessionId(sId);

    localStorage.setItem('pos_caisse_open', 'true');
    localStorage.setItem('pos_caisse_initial', String(initialAmt));
    localStorage.setItem('pos_caisse_open_date', dateStr);
    localStorage.setItem('pos_caisse_open_time', timeStr);
    localStorage.setItem('pos_caisse_session_id', sId);

    // Create a new session record
    const newSession: CaisseSession = {
      id: sId,
      cashier: currentUser.name,
      openedAtDate: dateStr,
      openedAtTime: timeStr,
      initialCash: initialAmt,
      salesCash: 0,
      salesCard: 0,
      salesMobileMoney: 0,
      salesMixed: 0,
      theoreticalCash: initialAmt,
      status: 'Open',
      observation: openFormObs,
    };

    setCaisseSessions(prev => [newSession, ...prev]);

    // Governance log entry
    const newLog: GovernanceLog = {
      id: `GOV-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'audit',
      title: 'Ouverture de Caisse Enregistrée',
      description: `Session ${sId} ouverte par ${currentUser.name} avec un fond de caisse initial de ${initialAmt.toLocaleString('fr-FR')} F CFA.`,
      timestamp: timeStr,
      code: 'PDV-OP',
    };
    setLogs([newLog, ...logs]);

    alert(`Caisse ouverte avec succès ! Fond initial : ${initialAmt.toLocaleString('fr-FR')} F CFA.`);
    setActiveTab('sale');
  };

  const handleCloseCaisse = (e: React.FormEvent) => {
    e.preventDefault();
    const counted = Number(closeFormRealCash);
    if (closeFormRealCash === '') {
      alert('Veuillez compter et saisir le montant réel en espèces.');
      return;
    }

    // Find active open session
    const updatedSessions = caisseSessions.map(sess => {
      if (sess.id === caisseSessionId && sess.status === 'Open') {
        const discrepancy = counted - sess.theoreticalCash;
        const now = new Date();
        return {
          ...sess,
          closedAtDate: now.toISOString().split('T')[0],
          closedAtTime: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          realCash: counted,
          discrepancy,
          status: 'Closed' as const,
          observation: closeFormObs,
        };
      }
      return sess;
    });

    setCaisseSessions(updatedSessions);

    // Lock local storage
    setCaisseOpen(false);
    setCaisseInitial(0);
    setCaisseOpenDate('');
    setCaisseOpenTime('');
    setCaisseSessionId('');

    localStorage.setItem('pos_caisse_open', 'false');
    localStorage.setItem('pos_caisse_initial', '0');
    localStorage.setItem('pos_caisse_open_date', '');
    localStorage.setItem('pos_caisse_open_time', '');
    localStorage.setItem('pos_caisse_session_id', '');

    // Log closure
    const newLog: GovernanceLog = {
      id: `GOV-${Math.floor(10000 + Math.random() * 90000)}`,
      type: counted === 0 ? 'audit' : 'success',
      title: 'Fermeture de Caisse Enregistrée',
      description: `Session fermée par ${currentUser.name}. Espèces comptées: ${counted.toLocaleString('fr-FR')} F CFA.`,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour12: false }),
      code: 'PDV-CL',
    };
    setLogs([newLog, ...logs]);

    alert('Caisse fermée et rapport de session sauvegardé avec succès.');
    setActiveTab('caisse');
  };

  // Suspend sale cart
  const handleSuspendSale = () => {
    if (cart.length === 0) {
      alert('Impossible de suspendre un panier vide.');
      return;
    }
    const now = new Date();
    const newSuspended: SuspendedSale = {
      id: `SUSP-${Math.floor(1000 + Math.random() * 9000)}`,
      date: now.toLocaleDateString('fr-FR'),
      time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      items: [...cart],
      subtotal,
      total,
      customerType: customer,
    };

    setSuspendedSales(prev => [newSuspended, ...prev]);
    setCart([]);
    alert(`La vente a été suspendue avec succès sous la référence ${newSuspended.id}.`);
  };

  // Resume suspended sale
  const handleResumeSuspended = (sale: SuspendedSale) => {
    if (cart.length > 0) {
      if (!window.confirm("Votre panier actif n'est pas vide. Voulez-vous fusionner les articles de la vente suspendue dans le panier actif ?")) {
        return;
      }
    }
    
    // Merge or set
    const merged = [...cart];
    sale.items.forEach(item => {
      const matchIdx = merged.findIndex(i => i.product.id === item.product.id);
      if (matchIdx > -1) {
        merged[matchIdx].quantity = Math.min(merged[matchIdx].product.stock, merged[matchIdx].quantity + item.quantity);
      } else {
        merged.push(item);
      }
    });

    setCart(merged);
    setSuspendedSales(prev => prev.filter(s => s.id !== sale.id));
    alert(`Vente suspendue ${sale.id} restaurée !`);
    setActiveTab('sale');
  };

  const handleDeleteSuspended = (id: string) => {
    if (window.confirm('Voulez-vous vraiment détruire définitivement cette vente suspendue ?')) {
      setSuspendedSales(prev => prev.filter(s => s.id !== id));
    }
  };

  // Complete Transaction Checkout process
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Le panier est vide.');
      return;
    }

    if (payMethod === 'cash' && !cashIsSufficient) {
      alert("Le montant remis est inférieur au montant total de la facture.");
      return;
    }

    if (payMethod === 'mixed' && !mixedIsMatched) {
      alert(`Le montant cumulé de la répartition mixte (${mixedAmountsSum.toLocaleString('fr-FR')} F CFA) ne correspond pas au total de la facture (${total.toLocaleString('fr-FR')} F CFA).`);
      return;
    }

    // Deduct stock levels in global products state
    const updatedProducts = products.map((p) => {
      const cartItem = cart.find((item) => item.product.id === p.id);
      if (cartItem) {
        return {
          ...p,
          stock: Math.max(0, p.stock - cartItem.quantity),
        };
      }
      return p;
    });
    setProducts(updatedProducts);

    // Calculate billing details
    const receiptId = `TX-${Math.floor(100000 + Math.random() * 900000)}`;
    const customerLabel = customer === 'walkin' ? 'Client de passage' : customer === 'corporate' ? 'Compte Entreprise' : 'Client VIP';
    
    let payMethodStr = '';
    let detailsLog = '';
    if (payMethod === 'cash') {
      payMethodStr = 'ESPÈCES';
      detailsLog = `Remis: ${Number(cashReceived).toLocaleString('fr-FR')} F CFA, Monnaie: ${monnaieARendre.toLocaleString('fr-FR')} F CFA`;
    } else if (payMethod === 'card') {
      payMethodStr = 'CARTE BANCAIRE';
      detailsLog = `Terminal de Caisse Certifié`;
    } else if (payMethod === 'mobile') {
      payMethodStr = `MOBILE MONEY (${mmOperator})`;
      detailsLog = `Tél: ${mmPhone}, Réf: ${mmRef}`;
    } else if (payMethod === 'mixed') {
      payMethodStr = 'PAIEMENT MIXTE';
      detailsLog = `Répartition - Espèces: ${Number(mixedCash).toLocaleString('fr-FR')} F, Carte: ${Number(mixedCard).toLocaleString('fr-FR')} F, Mobile: ${Number(mixedMobile).toLocaleString('fr-FR')} F`;
    }

    const finalReceipt = {
      id: receiptId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      cashier: currentUser.name,
      items: [...cart],
      subtotal,
      tax,
      total,
      payMethod: payMethodStr,
      customer: customerLabel,
      customerType: customerLabel,
      details: detailsLog,
      status: 'Valid',
    };

    // Save to history
    setCompletedSales(prev => [finalReceipt, ...prev]);

    // Update current active caisse session stats
    const updatedSessions = caisseSessions.map(sess => {
      if (sess.id === caisseSessionId && sess.status === 'Open') {
        const salesCashAdd = payMethod === 'cash' ? total : payMethod === 'mixed' ? (Number(mixedCash) || 0) : 0;
        const salesCardAdd = payMethod === 'card' ? total : payMethod === 'mixed' ? (Number(mixedCard) || 0) : 0;
        const salesMobileAdd = payMethod === 'mobile' ? total : payMethod === 'mixed' ? (Number(mixedMobile) || 0) : 0;
        const salesMixedAdd = payMethod === 'mixed' ? total : 0;

        const nextTheoretical = sess.theoreticalCash + salesCashAdd;

        return {
          ...sess,
          salesCash: sess.salesCash + salesCashAdd,
          salesCard: sess.salesCard + salesCardAdd,
          salesMobileMoney: sess.salesMobileMoney + salesMobileAdd,
          salesMixed: sess.salesMixed + salesMixedAdd,
          theoreticalCash: nextTheoretical,
        };
      }
      return sess;
    });
    setCaisseSessions(updatedSessions);

    // Show receipt dialog
    setRecentReceipt(finalReceipt);
    setShowReceipt(true);
    playSound('cash');

    // Trigger success callback to update Performance stats and add governance logs
    const itemSummaries = cart.map((i) => `${i.quantity}x ${i.product.name}`).join(', ');
    onCheckoutSuccess(total, `Reçu ${receiptId} complété pour ${customerLabel} (Articles : ${itemSummaries}). ${detailsLog}`);

    // Reset checkout form fields
    setCart([]);
    setCashReceived('');
    setMmPhone('');
    setMmRef('');
    setMixedCash('');
    setMixedCard('');
    setMixedMobile('');
  };

  // Profile Modification Submit
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      alert('Le nom est requis.');
      return;
    }

    const updatedUser = {
      ...currentUser,
      name: profileName,
      phone: profilePhone,
    };
    if (profilePassword) {
      updatedUser.password = profilePassword;
    }

    setCurrentUser(updatedUser);

    // Save to global accounts state
    const updatedAccounts = accounts.map(acc => acc.email === currentUser.email ? { ...acc, ...updatedUser } : acc);
    setAccounts(updatedAccounts);

    alert('Votre profil de caissier a été mis à jour avec succès.');
    setProfilePassword('');
  };

  // Returns / Refund lookup & confirmation
  const handleSearchReturnTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnSearchId.trim()) return;

    // Find in local completed sales history first, or construct from template
    const match = completedSales.find(sale => sale.id.toLowerCase() === returnSearchId.trim().toLowerCase());
    if (match) {
      setFoundReturnTx(match);
      // Initialize return quantities to 0
      const initQtys: Record<string, number> = {};
      match.items.forEach((item: any) => {
        initQtys[item.product.id || item.product.sku] = 0;
      });
      setReturnQuantities(initQtys);
    } else {
      alert("Aucune transaction correspondante trouvée dans l'historique de ce terminal.");
      setFoundReturnTx(null);
    }
  };

  const handleReturnQtyChange = (itemId: string, maxQty: number, val: number) => {
    setReturnQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, Math.min(maxQty, val))
    }));
  };

  const handleProcessReturn = () => {
    if (!foundReturnTx) return;
    const itemsToReturn = foundReturnTx.items.filter((item: any) => {
      const id = item.product.id || item.product.sku;
      return returnQuantities[id] > 0;
    });

    if (itemsToReturn.length === 0) {
      alert('Veuillez sélectionner au moins un article avec une quantité à retourner.');
      return;
    }

    if (!returnReason.trim()) {
      alert('Veuillez saisir le motif du retour.');
      return;
    }

    // 1. Process Stock Adjustment back into products
    const updatedProducts = products.map(p => {
      const returnItem = itemsToReturn.find((ri: any) => ri.product.id === p.id);
      if (returnItem) {
        const id = returnItem.product.id || returnItem.product.sku;
        const qtyReturned = returnQuantities[id];
        return {
          ...p,
          stock: p.stock + qtyReturned,
        };
      }
      return p;
    });
    setProducts(updatedProducts);

    // 2. Adjust complete status or mark as returned in local history
    const updatedHistory = completedSales.map(sale => {
      if (sale.id === foundReturnTx.id) {
        return {
          ...sale,
          status: returnActionType === 'refund' ? 'Refunded' : 'Exchanged',
          details: `Retour traité : ${returnReason}. Type: ${returnActionType === 'refund' ? 'Remboursement' : 'Échange'}`
        };
      }
      return sale;
    });
    setCompletedSales(updatedHistory);

    // 3. Log into governance audit trail
    const auditLogId = `RET-${Math.floor(10000 + Math.random() * 90000)}`;
    const details = itemsToReturn.map((ri: any) => {
      const id = ri.product.id || ri.product.sku;
      return `${returnQuantities[id]}x ${ri.product.name}`;
    }).join(', ');

    const newLog: GovernanceLog = {
      id: auditLogId,
      type: 'audit',
      title: returnActionType === 'refund' ? 'Retour & Remboursement' : 'Retour & Échange',
      description: `Ticket ${foundReturnTx.id} - ${details}. Motif: ${returnReason}. Traité par ${currentUser.name}.`,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour12: false }),
      code: 'PDV-RET',
    };
    setLogs([newLog, ...logs]);

    alert(`Retour enregistré avec succès ! Reçu d'annulation ${auditLogId} généré.`);
    
    // Reset form
    setFoundReturnTx(null);
    setReturnSearchId('');
    setReturnReason('');
  };


  // TAB RENDERING BLOCKS

  // 1. Nouvelle vente Tab (sale)
  const renderSaleTab = () => {
    if (!caisseOpen) {
      return (
        <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-[#c7c4d8]/40 p-8 shadow-xl text-center select-none animate-fade-in">
          <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-100">
            <span className="material-symbols-outlined text-4xl">lock</span>
          </div>
          <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight font-sans">
            La caisse est fermée
          </h3>
          <p className="text-gray-500 text-sm mt-3 leading-relaxed max-w-md mx-auto font-sans">
            Pour commencer à enregistrer des ventes, encaisser des paiements et imprimer des tickets, vous devez ouvrir une session de caisse en indiquant le fonds initial disponible dans le tiroir.
          </p>
          <div className="mt-8 border-t border-gray-100 pt-8 max-w-sm mx-auto">
            <button
              onClick={() => setActiveTab('caisse')}
              className="w-full py-3.5 bg-[#3525cd] text-white font-bold text-xs rounded-xl hover:bg-[#4f46e5] shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
              Ouvrir la session de caisse
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
        {/* Left Column: Catalog */}
        <div className="lg:col-span-8 space-y-6">
          {/* Real Barcode Scanner Saisie & Visual feedback Toast */}
          <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#3525cd]"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 space-y-1">
                <label htmlFor="pos-scan-field" className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wider font-sans flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Pistolet Scanner ou Code-Barres (Toujours actif)
                </label>
                <div className="relative">
                  <input
                    id="pos-scan-field"
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    onKeyDown={handleScanInputKeyDown}
                    placeholder="Scannez un article ou saisissez SKU (ex: ELE-00101, CHS-00302) et Entrée..."
                    className="w-full h-10 pl-9 pr-24 bg-[#f0f3ff]/40 border border-gray-200 focus:border-[#3525cd] focus:ring-2 focus:ring-indigo-100 rounded-xl font-mono text-xs text-[#3525cd] font-bold outline-none transition-all"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-sm">
                    barcode_reader
                  </span>
                  <button
                    onClick={handleManualScanSubmit}
                    className="absolute right-1.5 top-1.5 bottom-1.5 bg-[#3525cd] hover:bg-[#4f46e5] text-white text-[10px] font-bold px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                  >
                    Valider
                  </button>
                </div>
              </div>

              {/* Instant Simulator Control */}
              <div className="flex-shrink-0 flex flex-col gap-1.5">
                <span className="text-[9px] font-extrabold text-[#777587] uppercase tracking-wider text-right block pr-1">Démonstration</span>
                <button
                  onClick={triggerSimulatedBarcodeScan}
                  className="px-4 py-2 bg-indigo-50 hover:bg-[#3525cd] text-[#3525cd] hover:text-white rounded-xl text-xs font-bold transition-all border border-indigo-100 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                  Simuler Scan Aléatoire (Bip)
                </button>
              </div>
            </div>

            {/* In-page Scan Toast Confirmation / Unknown Warning */}
            {scanToast && (
              <div className={`p-3 rounded-xl flex items-center gap-2.5 text-xs font-bold border animate-in slide-in-from-top-1 duration-200 ${
                scanToast.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                  : 'bg-amber-50 border-amber-100 text-amber-800'
              }`}>
                <span className="material-symbols-outlined text-base">
                  {scanToast.type === 'success' ? 'check_circle' : 'warning'}
                </span>
                <p className="font-sans leading-tight">{scanToast.message}</p>
              </div>
            )}
          </div>

          {/* Horizontal Category selector */}
          <div className="flex gap-2 overflow-x-auto pb-1.5 custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all border cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#3525cd] text-white border-transparent shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Catalog grid */}
          {displayMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredProducts.map((p) => {
                const isLow = p.stock > 0 && p.stock <= lowStockAlert;
                return (
                  <div
                    key={p.id}
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col h-[320px] select-none"
                  >
                    <div className="relative h-32 bg-gray-100 overflow-hidden">
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        src={p.image}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-gray-700">
                        {p.category}
                      </span>
                      <span className="absolute bottom-3 right-3 bg-indigo-950 text-white px-2.5 py-1 rounded-lg text-xs font-bold font-mono">
                        {p.price.toLocaleString('fr-FR')} F CFA
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h5 className="font-bold text-sm text-gray-900 group-hover:text-[#3525cd] transition-colors truncate font-sans">
                          {p.name}
                        </h5>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono mt-0.5">
                          {p.sku}
                        </p>
                        <p className={`text-[11px] font-semibold mt-2 flex items-center gap-1 ${p.stock <= 0 ? 'text-red-500' : isLow ? 'text-amber-500 font-bold' : 'text-gray-500'}`}>
                          {p.stock <= 0 ? (
                            <>Rupture de stock</>
                          ) : isLow ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-ping"></span>
                              Alerte : {p.stock} restant(s)
                            </>
                          ) : (
                            <>{p.stock} unités disponibles</>
                          )}
                        </p>
                      </div>

                      <button
                        onClick={() => handleAddToCart(p)}
                        disabled={p.stock <= 0}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          p.stock <= 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-indigo-50 text-[#3525cd] hover:bg-[#3525cd] hover:text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                        Ajouter au Panier
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="col-span-3 text-center py-16 bg-white rounded-2xl border border-gray-100 p-8">
                  <span className="material-symbols-outlined text-gray-300 text-4xl mb-2">search_off</span>
                  <p className="text-gray-400 text-sm font-semibold">Aucun produit ne correspond au filtre</p>
                </div>
              )}
            </div>
          ) : (
            // Compact list display mode
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm divide-y divide-gray-100">
              {filteredProducts.map((p) => {
                const isLow = p.stock > 0 && p.stock <= lowStockAlert;
                return (
                  <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-50/55 transition-colors gap-4 text-xs">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                        <img className="w-full h-full object-cover" src={p.image} alt={p.name} referrerPolicy="no-referrer" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate font-sans">{p.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono font-bold mt-0.5">{p.sku} • {p.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className={`font-semibold ${p.stock <= 0 ? 'text-red-500' : isLow ? 'text-amber-500 font-bold animate-pulse' : 'text-gray-500'}`}>
                        {p.stock <= 0 ? 'Rupture' : `${p.stock} en stock`}
                      </p>
                      <p className="font-bold font-mono text-gray-900 w-24 text-right">
                        {p.price.toLocaleString('fr-FR')} F CFA
                      </p>
                      <button
                        onClick={() => handleAddToCart(p)}
                        disabled={p.stock <= 0}
                        className={`p-2 rounded-lg cursor-pointer transition-all ${
                          p.stock <= 0 ? 'bg-gray-50 text-gray-300' : 'bg-indigo-50 text-[#3525cd] hover:bg-[#3525cd] hover:text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Checkout cart */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#c7c4d8]/40 shadow-sm overflow-hidden flex flex-col h-[650px] sticky top-24">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#3525cd]">shopping_cart</span>
              <span className="font-bold text-sm text-gray-800">Panier Courant ({cart.length})</span>
            </div>
            {cart.length > 0 && (
              <button onClick={handleClearCart} className="text-xs text-[#ba1a1a] hover:underline font-bold">
                Vider
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between p-2.5 border border-gray-100 rounded-xl bg-gray-50/40 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-bold text-xs text-gray-800 truncate font-sans">{item.product.name}</p>
                    <p className="text-[10px] text-[#777587] font-semibold mt-0.5">
                      {item.product.price.toLocaleString('fr-FR')} F CFA
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm">
                      <button
                        onClick={() => handleUpdateQty(item.product.id, -1)}
                        className="p-1 px-2 text-[#464555] hover:bg-gray-50 text-xs font-bold rounded-l-lg"
                      >
                        -
                      </button>
                      <span className="px-1 text-xs font-bold text-gray-800 font-mono">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(item.product.id, 1)}
                        className="p-1 px-2 text-[#464555] hover:bg-gray-50 text-xs font-bold rounded-r-lg"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(item.product.id)}
                      className="p-1 text-gray-400 hover:text-red-500 active:scale-90"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400 select-none">
                <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">shopping_bag</span>
                <p className="text-xs font-semibold">Le panier est vide</p>
                <p className="text-[10px] text-gray-400 mt-1">Sélectionnez des articles</p>
              </div>
            )}
          </div>

          {/* Totals & checkout controls */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/55 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-gray-500 font-semibold">
                <span>Sous-total :</span>
                <span className="font-mono">{subtotal.toLocaleString('fr-FR')} F CFA</span>
              </div>
              <div className="flex justify-between text-gray-500 font-semibold">
                <span>TVA (8,0%) :</span>
                <span className="font-mono">{tax.toLocaleString('fr-FR')} F CFA</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-gray-800 pt-1 border-t border-gray-200">
                <span>Total Facture :</span>
                <span className="font-mono text-[#3525cd]">{total.toLocaleString('fr-FR')} F CFA</span>
              </div>
            </div>

            {/* Payment Mode switcher */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 rounded-xl">
              {(['cash', 'card', 'mobile', 'mixed'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPayMethod(mode)}
                  className={`py-1.5 text-[9px] font-extrabold rounded-lg capitalize transition-all cursor-pointer ${
                    payMethod === mode ? 'bg-[#3525cd] text-white shadow' : 'text-gray-500 hover:bg-gray-200/50'
                  }`}
                >
                  {mode === 'cash' ? 'Cash' : mode === 'card' ? 'Carte' : mode === 'mobile' ? 'Mobile' : 'Mixte'}
                </button>
              ))}
            </div>

            {/* Sub-form fields based on Payment Mode */}
            {payMethod === 'cash' && (
              <div className="space-y-1.5 p-2 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-700">Somme remise :</span>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="0"
                    className="w-32 px-2 py-1 bg-white border border-gray-200 rounded text-right font-mono font-bold text-[#3525cd] outline-none"
                  />
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-indigo-100 font-bold">
                  <span>Monnaie à rendre :</span>
                  <span className={`font-mono text-sm ${monnaieARendre > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {monnaieARendre.toLocaleString('fr-FR')} F CFA
                  </span>
                </div>
                <div className="flex gap-1 pt-1 justify-end">
                  {[total, 5000, 10000, 20000].map((amt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCashReceived(String(amt))}
                      className="px-1.5 py-0.5 bg-white border border-gray-200 hover:bg-gray-50 text-[10px] font-bold rounded text-gray-600"
                    >
                      {amt === total ? 'Exact' : `+${amt.toLocaleString('fr-FR')}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {payMethod === 'mobile' && (
              <div className="space-y-2 p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl text-[11px] font-semibold">
                <div className="flex items-center justify-between gap-2">
                  <span>Opérateur :</span>
                  <select
                    value={mmOperator}
                    onChange={(e) => setMmOperator(e.target.value)}
                    className="bg-white border border-gray-200 p-1 rounded font-bold outline-none"
                  >
                    <option value="Wave">Wave 🌊</option>
                    <option value="Orange Money">Orange Money 🍊</option>
                    <option value="MTN Mobile Money">MTN MoMo 🟡</option>
                    <option value="Moov Money">Moov Money 🟢</option>
                  </select>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>N° Téléphone :</span>
                  <input
                    type="text"
                    placeholder="07 00 00 00 00"
                    value={mmPhone}
                    onChange={(e) => setMmPhone(e.target.value)}
                    className="w-28 bg-white border border-gray-200 p-1 rounded text-right outline-none font-mono"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>ID Réf Transaction :</span>
                  <input
                    type="text"
                    placeholder="W-9018273"
                    value={mmRef}
                    onChange={(e) => setMmRef(e.target.value)}
                    className="w-28 bg-white border border-gray-200 p-1 rounded text-right outline-none font-mono"
                  />
                </div>
              </div>
            )}

            {payMethod === 'mixed' && (
              <div className="space-y-2 p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl text-[10px] font-semibold">
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div>
                    <label className="block text-gray-500 mb-0.5 font-bold">Espèces</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={mixedCash}
                      onChange={(e) => setMixedCash(e.target.value)}
                      className="w-full bg-white border border-gray-200 p-1 rounded text-center outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-0.5 font-bold">Carte</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={mixedCard}
                      onChange={(e) => setMixedCard(e.target.value)}
                      className="w-full bg-white border border-gray-200 p-1 rounded text-center outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-0.5 font-bold">Mobile</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={mixedMobile}
                      onChange={(e) => setMixedMobile(e.target.value)}
                      className="w-full bg-white border border-gray-200 p-1 rounded text-center outline-none font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-indigo-100 font-bold text-xs">
                  <span>Reste à répartir :</span>
                  <span className={`font-mono ${mixedIsMatched ? 'text-emerald-600' : 'text-red-500'}`}>
                    {mixedRemaining.toLocaleString('fr-FR')} F CFA
                  </span>
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleSuspendSale}
                disabled={cart.length === 0}
                className="py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 disabled:bg-gray-50 disabled:text-gray-400 rounded-xl font-bold text-[10px] border border-amber-100 disabled:border-transparent transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-xs">pause</span>
                Suspendre
              </button>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="col-span-2 py-2.5 bg-[#3525cd] hover:bg-[#4f46e5] disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">lock_open</span>
                Encaisser & Valider
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Keyboard Shortcuts Legend */}
        <div className="lg:col-span-12 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold text-gray-800 uppercase tracking-wider">
            <span className="material-symbols-outlined text-[#3525cd] text-base">keyboard</span>
            <span>Raccourcis Clavier POS</span>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px]">
            {[
              { key: 'F1', desc: 'Vente / Focus' },
              { key: 'F2', desc: 'Suspendre' },
              { key: 'F3', desc: 'Vider Panier' },
              { key: 'F4', desc: 'Quantité' },
              { key: 'F5', desc: 'Type Client' },
              { key: 'F6', desc: 'Historique' },
              { key: 'Entrée', desc: 'Valider' },
              { key: 'Suppr', desc: 'Suppr. Dernier' },
              { key: 'Échap', desc: 'Fermer Reçu' }
            ].map((sc) => (
              <div key={sc.key} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-2 py-1 rounded-xl">
                <kbd className="bg-white px-1.5 py-0.5 rounded-md border border-gray-200 shadow-xs font-mono font-bold text-[#3525cd]">{sc.key}</kbd>
                <span className="text-gray-500 font-semibold">{sc.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 2. Ventes suspendues Tab (suspended)
  const renderSuspendedTab = () => {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-extrabold text-gray-900 tracking-tight font-sans">
            Ventes Suspendues en Attente ({suspendedSales.length})
          </h3>
          <p className="text-[#646375] text-xs mt-1">
            Liste des transactions mises en pause sur ce terminal. Vous pouvez les recharger à tout moment.
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {suspendedSales.map((sale) => (
            <div key={sale.id} className="p-4 flex flex-col md:flex-row justify-between md:items-center gap-4 text-xs font-semibold">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold font-mono rounded text-[10px]">
                    {sale.id}
                  </span>
                  <span className="text-gray-400">Suspendue le {sale.date} à {sale.time}</span>
                </div>
                <p className="text-gray-800 mt-1.5">
                  Client : <span className="font-bold text-indigo-950">{sale.customerType === 'vip' ? 'Client VIP' : sale.customerType === 'corporate' ? 'Compte Entreprise' : 'Client de passage'}</span> • {sale.items.length} article(s)
                </p>
                <div className="text-[10px] text-gray-400 font-medium mt-1 truncate max-w-lg">
                  Articles : {sale.items.map(i => `${i.quantity}x ${i.product?.name}`).join(', ')}
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-6">
                <p className="font-extrabold font-mono text-gray-900 text-sm">
                  {sale.total.toLocaleString('fr-FR')} F CFA
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleResumeSuspended(sale)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-[#3525cd] text-[#3525cd] hover:text-white rounded-lg transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">play_arrow</span>
                    Restaurer
                  </button>
                  <button
                    onClick={() => handleDeleteSuspended(sale.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {suspendedSales.length === 0 && (
            <div className="text-center py-16 text-gray-400 p-8">
              <span className="material-symbols-outlined text-gray-300 text-5xl mb-2">pause_circle</span>
              <p className="text-sm font-semibold">Aucune vente suspendue en attente</p>
              <p className="text-xs text-gray-400 mt-1">Vous pouvez suspendre une vente active à l'aide du bouton 'Suspendre' du panier.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 3. Retours / Échanges Tab (returns)
  const renderReturnsTab = () => {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-extrabold text-gray-900 tracking-tight font-sans mb-1">
            Traitement des Retours & Échanges
          </h3>
          <p className="text-[#646375] text-xs mb-6">
            Saisissez le numéro de ticket de la facture originale pour lancer une demande de retour en stock ou d'échange standard.
          </p>

          <form onSubmit={handleSearchReturnTx} className="flex gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined text-gray-400 absolute left-3 top-2.5 text-lg">search</span>
              <input
                type="text"
                placeholder="Exemple: TX-0192 ou TX-981273..."
                value={returnSearchId}
                onChange={(e) => setReturnSearchId(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#3525cd] font-mono font-bold"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#3525cd] text-white rounded-xl text-xs font-bold hover:bg-[#4f46e5] cursor-pointer"
            >
              Rechercher
            </button>
          </form>
        </div>

        {foundReturnTx && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6 animate-fade-in text-xs font-semibold">
            {/* Header Transaction Info */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Facture Originale Retrouvée</p>
                <h4 className="text-base font-extrabold text-indigo-950 font-mono mt-1">{foundReturnTx.id}</h4>
                <p className="text-gray-500 mt-1 font-sans">Encaissée par {foundReturnTx.cashier} le {foundReturnTx.date} ({foundReturnTx.payMethod})</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold font-mono rounded-lg text-[10px]">
                {foundReturnTx.status === 'Valid' ? 'VALIDE' : foundReturnTx.status === 'Refunded' ? 'REMBOURSÉ' : 'ÉCHANGÉ'}
              </span>
            </div>

            {/* Return Type Selection */}
            <div>
              <label className="block text-gray-700 font-bold mb-2">Type de retour :</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReturnActionType('refund')}
                  className={`py-3 rounded-xl border flex items-center justify-center gap-2 transition-all font-bold ${
                    returnActionType === 'refund'
                      ? 'bg-indigo-50 border-[#3525cd] text-[#3525cd]'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">refund</span>
                  Remboursement / Avoir standard
                </button>
                <button
                  type="button"
                  onClick={() => setReturnActionType('exchange')}
                  className={`py-3 rounded-xl border flex items-center justify-center gap-2 transition-all font-bold ${
                    returnActionType === 'exchange'
                      ? 'bg-indigo-50 border-[#3525cd] text-[#3525cd]'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">published_with_changes</span>
                  Échange contre autre article
                </button>
              </div>
            </div>

            {/* List items to adjust */}
            <div className="space-y-3">
              <label className="block text-gray-700 font-bold">Sélectionner la quantité à retourner :</label>
              <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                {foundReturnTx.items.map((item: any) => {
                  const id = item.product.id || item.product.sku;
                  const qtyToReturn = returnQuantities[id] || 0;
                  return (
                    <div key={id} className="p-3 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-900 truncate font-sans">{item.product.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{item.product.sku} • Facturé: {item.quantity} unités</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-[10px] font-bold">Retourner :</span>
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={qtyToReturn}
                          onChange={(e) => handleReturnQtyChange(id, item.quantity, Number(e.target.value))}
                          className="w-16 bg-gray-50 border border-gray-200 p-1.5 rounded text-center font-bold font-mono outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {returnActionType === 'exchange' && (
              <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 space-y-2">
                <label className="block text-amber-900 font-extrabold text-xs">Informations d'Échange :</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <span className="text-[10px] text-gray-500 font-bold block mb-1">SKU Produit de Remplacement :</span>
                    <input
                      type="text"
                      placeholder="Ex: ELC-29381..."
                      value={exchangeProductSku}
                      onChange={(e) => setExchangeProductSku(e.target.value)}
                      className="w-full bg-white border border-gray-200 p-2 rounded-lg font-mono text-xs outline-none"
                    />
                  </div>
                  <div className="sm:w-48">
                    <span className="text-[10px] text-gray-500 font-bold block mb-1">Ajustement tarifaire :</span>
                    <div className="p-2.5 bg-white border border-gray-200 rounded-lg text-center font-mono font-bold text-gray-700">
                      Calcul automatique
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Motif textarea */}
            <div>
              <label className="block text-gray-700 font-bold mb-1.5">Motif détaillé du retour :</label>
              <textarea
                placeholder="Saisissez la raison du retour (ex: Produit défectueux, Erreur de taille, etc.)..."
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#3525cd] resize-none"
              />
            </div>

            {/* Confirm action */}
            <div className="border-t border-gray-100 pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFoundReturnTx(null)}
                className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl font-bold cursor-pointer text-gray-600"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleProcessReturn}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow cursor-pointer"
              >
                Valider et Re-créditer le stock
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 4. Historique des ventes Tab (history)
  const renderHistoryTab = () => {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in text-xs font-semibold">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-extrabold text-gray-900 tracking-tight font-sans">
            Historique Global des Ventes Terminal #1
          </h3>
          <p className="text-[#646375] text-xs mt-1">
            Liste complète de toutes les ventes validées sur cette caisse. Vous pouvez cliquer sur un ticket pour le réimprimer.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px] tracking-wide border-b border-gray-100 select-none">
              <tr>
                <th className="py-3.5 px-6">Réf Ticket</th>
                <th className="py-3.5 px-4">Date / Heure</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Mode Paiement</th>
                <th className="py-3.5 px-4">Montant Total</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {completedSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 font-bold font-mono text-indigo-950">{sale.id}</td>
                  <td className="py-4 px-4 text-gray-500">{sale.date} à {sale.time}</td>
                  <td className="py-4 px-4 text-gray-700">{sale.customer || sale.customerType}</td>
                  <td className="py-4 px-4 font-bold text-[#3525cd]">{sale.payMethod}</td>
                  <td className="py-4 px-4 font-bold font-mono">{sale.total.toLocaleString('fr-FR')} F CFA</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      sale.status === 'Valid' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                    }`}>
                      {sale.status === 'Valid' ? 'VALIDE' : sale.status === 'Refunded' ? 'RETOURNÉ' : 'ANNULÉ'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => {
                        setRecentReceipt(sale);
                        setShowReceipt(true);
                      }}
                      className="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ml-auto"
                    >
                      <span className="material-symbols-outlined text-xs">print</span>
                      Ticket
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {completedSales.length === 0 && (
            <div className="text-center py-16 text-gray-400 p-8">
              <span className="material-symbols-outlined text-gray-300 text-5xl mb-2">receipt_long</span>
              <p className="text-sm font-semibold">Aucune vente enregistrée pour le moment</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 5. Gestion de la caisse Tab (caisse)
  const renderCaisseTab = () => {
    const activeSession = caisseSessions.find(s => s.id === caisseSessionId && s.status === 'Open');

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in text-xs font-semibold">
        {/* Main interactive form */}
        <div className="lg:col-span-7 space-y-6">
          {!caisseOpen ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                <span className="material-symbols-outlined text-[#3525cd]">lock_open</span>
                <h4 className="text-base font-extrabold text-indigo-950 font-sans">
                  Ouvrir une Nouvelle Session de Caisse
                </h4>
              </div>
              <form onSubmit={handleOpenCaisse} className="space-y-4">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Montant initial en espèces (F CFA) :</label>
                  <input
                    type="number"
                    value={openFormCash}
                    onChange={(e) => setOpenFormCash(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#3525cd] font-mono font-bold text-sm text-[#3525cd]"
                    required
                  />
                  <p className="text-[10px] text-gray-400 font-medium mt-1">Fonds de roulement espèces pré-chargé dans le tiroir ce matin.</p>
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Observations d'ouverture :</label>
                  <textarea
                    placeholder="Saisissez une note optionnelle (ex: Prêt de caisse de secours...)"
                    value={openFormObs}
                    onChange={(e) => setOpenFormObs(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#3525cd] resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">vpn_key</span>
                  Valider l'Ouverture et Débloquer la Caisse
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-600">lock</span>
                  <h4 className="text-base font-extrabold text-indigo-950 font-sans">
                    Fermeture & Bilan de Session de Caisse
                  </h4>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-bold font-mono text-[10px] animate-pulse">
                  EN COURS (OUVERTE)
                </span>
              </div>

              {activeSession && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Ouvert par</p>
                    <p className="font-bold text-gray-800 mt-1 truncate">{activeSession.cashier}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Ouvert le</p>
                    <p className="font-bold text-gray-800 mt-1">{activeSession.openedAtDate}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Heure d'ouverture</p>
                    <p className="font-bold text-gray-800 mt-1">{activeSession.openedAtTime}</p>
                  </div>
                  <div className="p-3 bg-indigo-50 text-[#3525cd] rounded-xl border border-indigo-100">
                    <p className="text-[9px] text-indigo-500 font-bold uppercase">Fond de caisse</p>
                    <p className="font-extrabold font-mono mt-1 text-xs">{activeSession.initialCash.toLocaleString('fr-FR')} F</p>
                  </div>
                </div>
              )}

              {/* Closure calculation outputs */}
              {activeSession && (
                <div className="space-y-2 p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
                  <h5 className="font-extrabold text-gray-900 border-b border-gray-200/60 pb-1.5 mb-2">Synthèse financière temps réel :</h5>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Montant d'Ouverture :</span>
                    <span className="font-mono">{activeSession.initialCash.toLocaleString('fr-FR')} F CFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Recettes Espèces :</span>
                    <span className="font-mono text-emerald-600">+{activeSession.salesCash.toLocaleString('fr-FR')} F CFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Recettes Cartes :</span>
                    <span className="font-mono">+{activeSession.salesCard.toLocaleString('fr-FR')} F CFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Recettes Mobile Money :</span>
                    <span className="font-mono">+{activeSession.salesMobileMoney.toLocaleString('fr-FR')} F CFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Recettes Mixtes :</span>
                    <span className="font-mono">+{activeSession.salesMixed.toLocaleString('fr-FR')} F CFA</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-dashed border-gray-200 font-bold text-sm text-gray-800">
                    <span>Espèces Théoriques Attendues :</span>
                    <span className="font-mono text-[#3525cd]">{activeSession.theoreticalCash.toLocaleString('fr-FR')} F CFA</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleCloseCaisse} className="space-y-4">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Montant réel compté en espèces (F CFA) :</label>
                  <input
                    type="number"
                    value={closeFormRealCash}
                    onChange={(e) => setCloseFormRealCash(e.target.value)}
                    placeholder="Saisissez les espèces comptées dans le tiroir..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#3525cd] font-mono font-bold text-sm text-[#ba1a1a]"
                    required
                  />
                  {closeFormRealCash !== '' && activeSession && (
                    <div className="mt-2 text-xs flex justify-between items-center">
                      <span>Écart de Caisse calculé :</span>
                      <span className={`font-mono font-bold p-1 rounded ${
                        Number(closeFormRealCash) - activeSession.theoreticalCash === 0
                          ? 'bg-emerald-50 text-emerald-600'
                          : Number(closeFormRealCash) - activeSession.theoreticalCash > 0
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-red-50 text-red-600'
                      }`}>
                        {(Number(closeFormRealCash) - activeSession.theoreticalCash).toLocaleString('fr-FR')} F CFA
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Observations de fermeture :</label>
                  <textarea
                    placeholder="Saisissez un commentaire de fin de shift (ex: Aucun écart, Écart de 500F inexpliqué...)"
                    value={closeFormObs}
                    onChange={(e) => setCloseFormObs(e.target.value)}
                    rows={2}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#3525cd] resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">lock</span>
                  Valider la Fermeture de Caisse & Clôturer Session
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Previous shifts summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-extrabold text-indigo-950 font-sans border-b border-gray-100 pb-2">
              Sessions de Caisse Récentes (Historique)
            </h4>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
              {caisseSessions.map((sess) => (
                <div key={sess.id} className="p-3 bg-gray-50 border border-gray-200/60 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-mono font-bold text-indigo-950">{sess.id}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      sess.status === 'Open' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {sess.status === 'Open' ? 'ACTIF' : 'FERMÉ'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600">
                    Caissier: <span className="font-bold text-gray-800">{sess.cashier}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                    <div>
                      Fond d'Ouverture: <span className="font-mono font-bold text-gray-700">{sess.initialCash.toLocaleString('fr-FR')} F</span>
                    </div>
                    <div>
                      Theoretical Cash: <span className="font-mono font-bold text-gray-700">{sess.theoreticalCash.toLocaleString('fr-FR')} F</span>
                    </div>
                    {sess.realCash !== undefined && (
                      <div className="col-span-2 pt-1 border-t border-dotted border-gray-100 flex justify-between items-center">
                        <span>Espèces comptées:</span>
                        <span className="font-mono font-bold text-[#ba1a1a]">{sess.realCash.toLocaleString('fr-FR')} F CFA</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 6. Mes statistiques Tab (stats)
  const renderStatsTab = () => {
    // Math for metrics
    const statsCA = completedSales.reduce((sum, s) => sum + s.total, 0);
    const statsCount = completedSales.length;
    const statsAverage = statsCount > 0 ? Math.round(statsCA / statsCount) : 0;

    return (
      <div className="space-y-6 animate-fade-in text-xs font-semibold">
        {/* KPI metrics row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Chiffre d'Affaires Encaissé</span>
            <span className="text-2xl font-extrabold font-mono text-indigo-950 block mt-2">
              {statsCA.toLocaleString('fr-FR')} F CFA
            </span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Tickets Enregistrés</span>
            <span className="text-2xl font-extrabold font-mono text-indigo-950 block mt-2">
              {statsCount} ventes
            </span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Panier Moyen Caissier</span>
            <span className="text-2xl font-extrabold font-mono text-indigo-950 block mt-2">
              {statsAverage.toLocaleString('fr-FR')} F CFA
            </span>
          </div>
        </div>

        {/* Hourly split simulated */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h4 className="text-sm font-extrabold text-indigo-950 font-sans mb-4">Répartition des ventes du jour par mode de paiement</h4>
          <div className="space-y-4">
            {[
              { label: 'Espèces', color: 'bg-emerald-500', count: completedSales.filter(s => s.payMethod.includes('ESPÈCES')).length, sum: completedSales.filter(s => s.payMethod.includes('ESPÈCES')).reduce((acc, s) => acc + s.total, 0) },
              { label: 'Cartes Bancaires', color: 'bg-indigo-500', count: completedSales.filter(s => s.payMethod.includes('CARTE')).length, sum: completedSales.filter(s => s.payMethod.includes('CARTE')).reduce((acc, s) => acc + s.total, 0) },
              { label: 'Mobile Money', color: 'bg-amber-500', count: completedSales.filter(s => s.payMethod.includes('MOBILE') || s.payMethod.includes('Wave')).length, sum: completedSales.filter(s => s.payMethod.includes('MOBILE') || s.payMethod.includes('Wave')).reduce((acc, s) => acc + s.total, 0) },
            ].map((method, idx) => {
              const pct = statsCA > 0 ? Math.round((method.sum / statsCA) * 100) : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-gray-700">
                    <span>{method.label} ({method.count} tickets)</span>
                    <span className="font-mono">{method.sum.toLocaleString('fr-FR')} F CFA ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className={`${method.color} h-full`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // 7. Mon Profil Tab (profile)
  const renderProfileTab = () => {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-fade-in text-xs font-semibold">
        <h3 className="text-base font-extrabold text-indigo-950 font-sans border-b border-gray-100 pb-3 mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined">person</span>
          Mon Profil de Caissier
        </h3>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-gray-500 mb-1 font-bold">Adresse Email de Connexion :</label>
            <input
              type="email"
              value={currentUser.email}
              disabled
              className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed font-mono"
            />
          </div>
          <div>
            <label className="block text-gray-500 mb-1 font-bold">Rôle dans le Système :</label>
            <input
              type="text"
              value={currentUser.role}
              disabled
              className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed uppercase font-bold"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1 font-bold">Nom Complet :</label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#3525cd]"
              required
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1 font-bold">Numéro de Téléphone :</label>
            <input
              type="text"
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
              placeholder="Ex: 01 02 03 04 05..."
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#3525cd] font-mono"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1 font-bold">Changer le mot de passe (Laisser vide si inchangé) :</label>
            <input
              type="password"
              placeholder="Saisissez un nouveau mot de passe sécurisé..."
              value={profilePassword}
              onChange={(e) => setProfilePassword(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#3525cd]"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-[#3525cd] hover:bg-[#4f46e5] text-white font-bold rounded-lg cursor-pointer shadow transition-all mt-4"
          >
            Sauvegarder les modifications du profil
          </button>
        </form>
      </div>
    );
  };

  // 8. Paramètres Tab (settings)
  const renderSettingsTab = () => {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-fade-in text-xs font-semibold">
        <h3 className="text-base font-extrabold text-indigo-950 font-sans border-b border-gray-100 pb-3 mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#3525cd]">settings</span>
          Paramètres du Terminal Point de Vente (PDV)
        </h3>

        <div className="space-y-6">
          {/* Audio toggle */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <h5 className="font-bold text-gray-900">Bips Sonores & Effets Audio</h5>
              <p className="text-[10px] text-gray-500 mt-0.5">Produit des sons physiques réalistes lors du scan barcode et de l'encaissement de caisse.</p>
            </div>
            <button
              onClick={() => {
                setAudioEnabled(!audioEnabled);
                playSound('beep');
              }}
              className={`px-4 py-1.5 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                audioEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {audioEnabled ? 'ACTIVÉS' : 'DÉSACTIVÉS'}
            </button>
          </div>

          {/* Display Mode Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <h5 className="font-bold text-gray-900">Format d'Affichage du Catalogue</h5>
              <p className="text-[10px] text-gray-500 mt-0.5">Affiche le catalogue de produits sous forme de bento grid ou de liste compacte.</p>
            </div>
            <div className="flex gap-1.5 bg-white p-1 rounded-lg border border-gray-200">
              <button
                onClick={() => setDisplayMode('grid')}
                className={`px-3 py-1 text-[9px] font-extrabold rounded ${
                  displayMode === 'grid' ? 'bg-[#3525cd] text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                Grille
              </button>
              <button
                onClick={() => setDisplayMode('list')}
                className={`px-3 py-1 text-[9px] font-extrabold rounded ${
                  displayMode === 'list' ? 'bg-[#3525cd] text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                Liste
              </button>
            </div>
          </div>

          {/* Low Stock alerting */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <h5 className="font-bold text-gray-900">Seuil d'Alerte de Stock Bas</h5>
              <p className="text-[10px] text-gray-500 mt-0.5">Affiche un avertissement orange sur les fiches produits lorsque la quantité descend en dessous de ce seuil.</p>
            </div>
            <input
              type="number"
              value={lowStockAlert}
              onChange={(e) => setLowStockAlert(Number(e.target.value))}
              className="w-20 px-2 py-1.5 bg-white border border-gray-200 rounded text-center font-mono font-bold text-indigo-950"
            />
          </div>

          {/* Printer format choice */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <h5 className="font-bold text-gray-900">Imprimante de Ticket Thermique</h5>
              <p className="text-[10px] text-gray-500 mt-0.5">Format par défaut envoyé à l'imprimante après la finalisation de la transaction.</p>
            </div>
            <select
              value={receiptPrinter}
              onChange={(e) => setReceiptPrinter(e.target.value)}
              className="bg-white border border-gray-200 p-1.5 rounded-lg outline-none font-bold text-gray-700"
            >
              <option value="Ticket Thermique 80mm">Ticket 80mm (Standard)</option>
              <option value="Ticket Thermique 58mm">Ticket 58mm (Étroit)</option>
              <option value="Format A4 PDF">Format Facture A4 (PDF)</option>
            </select>
          </div>

          {/* Sync mode status */}
          <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl flex gap-3 items-start">
            <span className="material-symbols-outlined text-lg mt-0.5">cloud_done</span>
            <div>
              <h6 className="font-extrabold">Synchronisation Automatique Hors-Ligne (Offline First)</h6>
              <p className="text-[10px] leading-relaxed mt-1 text-emerald-800/80">
                La caisse enregistre les données de manière persistante et sécurisée dans votre navigateur. En cas de coupure réseau ou internet, le terminal continue de fonctionner à 100%. Une synchronisation asynchrone avec le serveur central de Supabase est déclenchée toutes les 15 secondes.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pt-24 px-8 pb-12 w-full animate-fade-in font-sans">
      {/* Header Info Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight font-sans capitalize">
            {activeTab === 'sale' ? '🛒 Nouvelle vente' :
             activeTab === 'suspended' ? '🕒 Ventes suspendues' :
             activeTab === 'returns' ? '🔄 Retours / Échanges' :
             activeTab === 'history' ? '🧾 Historique des ventes' :
             activeTab === 'caisse' ? '💰 Gestion de la caisse' :
             activeTab === 'stats' ? '📊 Mes statistiques' :
             activeTab === 'profile' ? '👤 Mon Profil' :
             activeTab === 'settings' ? '⚙️ Paramètres Caisse' : 'Terminal Point de Vente (POS)'}
          </h2>
          <p className="text-[#464555] text-xs mt-1 font-medium">
            Terminal de Caisse #1 • Mode Caissier • Statut : <span className={`font-bold ${caisseOpen ? 'text-emerald-600' : 'text-amber-500'}`}>{caisseOpen ? 'Caisse Active et Débloquée' : 'Caisse Fermée'}</span>
          </p>
        </div>

        {/* Client type profile switcher - only visible in sale tab */}
        {activeTab === 'sale' && caisseOpen && (
          <div className="flex gap-1.5 p-1.5 bg-gray-100 rounded-xl border border-gray-200">
            <button
              onClick={() => setCustomer('walkin')}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                customer === 'walkin' ? 'bg-[#3525cd] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200/50'
              }`}
            >
              Passage
            </button>
            <button
              onClick={() => setCustomer('corporate')}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                customer === 'corporate' ? 'bg-[#3525cd] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200/50'
              }`}
            >
              Entreprise
            </button>
            <button
              onClick={() => setCustomer('vip')}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                customer === 'vip' ? 'bg-[#3525cd] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200/50'
              }`}
            >
              VIP
            </button>
          </div>
        )}
      </div>

      {/* POS Sub-tab Render Body */}
      <div className="transition-all duration-150">
        {activeTab === 'sale' && renderSaleTab()}
        {activeTab === 'suspended' && renderSuspendedTab()}
        {activeTab === 'returns' && renderReturnsTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'caisse' && renderCaisseTab()}
        {activeTab === 'stats' && renderStatsTab()}
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>

      {/* Checkout Receipt Print Preview Modal Dialog */}
      {showReceipt && recentReceipt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-gray-100">
            <button
              onClick={() => setShowReceipt(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {/* Receipt Content Header */}
            <div className="text-center pb-4 border-b border-dashed border-gray-200 mb-4 select-none">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 mb-2 border border-emerald-100">
                <span className="material-symbols-outlined text-2xl">check_circle</span>
              </div>
              <h4 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide font-sans">
                Facture SmartStock ERP
              </h4>
              <p className="text-[10px] text-[#777587] font-semibold font-mono uppercase tracking-wider mt-0.5">
                Terminal #1 • Facture {recentReceipt.id}
              </p>
            </div>

            {/* Receipt Metadata */}
            <div className="space-y-1.5 text-[10px] text-[#464555] mb-4 pb-4 border-b border-dashed border-gray-200 font-semibold font-sans">
              <div className="flex justify-between">
                <span>Caissier :</span>
                <span className="text-gray-900">{recentReceipt.cashier}</span>
              </div>
              <div className="flex justify-between">
                <span>Profil Client :</span>
                <span className="text-gray-900">{recentReceipt.customer || recentReceipt.customerType}</span>
              </div>
              <div className="flex justify-between">
                <span>Moyen de Paiement :</span>
                <span className="text-gray-900">{recentReceipt.payMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Statut :</span>
                <span className="text-emerald-600 font-extrabold uppercase">SUCCÈS ENREGISTRÉ</span>
              </div>
            </div>

            {/* Items details list */}
            <div className="space-y-2 mb-4 max-h-32 overflow-y-auto custom-scrollbar pr-1">
              {recentReceipt.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-[10px] font-semibold text-gray-600">
                  <span className="truncate pr-4">{item.quantity} × {item.product?.name}</span>
                  <span className="font-mono text-gray-900 flex-shrink-0">
                    {(item.product?.price * item.quantity).toLocaleString('fr-FR')} F
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-[11px] pt-4 border-t border-gray-100 mb-6 font-semibold">
              <div className="flex justify-between text-gray-500">
                <span>Sous-total :</span>
                <span className="font-mono">{recentReceipt.subtotal.toLocaleString('fr-FR')} F CFA</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>TVA (8%) :</span>
                <span className="font-mono">{recentReceipt.tax.toLocaleString('fr-FR')} F CFA</span>
              </div>
              <div className="flex justify-between text-xs font-extrabold text-gray-950 pt-2 border-t border-dashed border-gray-200">
                <span>Total à Payer :</span>
                <span className="font-mono text-[#3525cd] text-sm">{recentReceipt.total.toLocaleString('fr-FR')} F CFA</span>
              </div>
            </div>

            {/* Print and complete buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  alert(`Commande d'impression envoyée à l'imprimante configurée : ${receiptPrinter}.`);
                }}
                className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">print</span>
                Imprimer
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 py-2.5 bg-[#3525cd] text-white font-bold text-xs rounded-xl hover:bg-[#4f46e5] transition-all cursor-pointer text-center"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
