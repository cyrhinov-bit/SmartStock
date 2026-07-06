/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, Transaction, StockArrival, User, Director, GovernanceLog, Screen } from '../types';
import { DirectorFinance } from './DirectorFinance';

interface DirectorDashboardProps {
  screen: Screen;
  setScreen: (screen: Screen) => void;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  arrivals: StockArrival[];
  setArrivals: React.Dispatch<React.SetStateAction<StockArrival[]>>;
  searchQuery: string;
  currentUser: User;
  setCurrentUser: (u: User) => void;
  accounts: User[];
  setAccounts: React.Dispatch<React.SetStateAction<User[]>>;
  directors: Director[];
  setDirectors: React.Dispatch<React.SetStateAction<Director[]>>;
  logs: GovernanceLog[];
  setLogs: React.Dispatch<React.SetStateAction<GovernanceLog[]>>;
  triggerAlert: (msg: string, type?: 'success' | 'info') => void;
  onLogout: () => void;
}

export const DirectorDashboard: React.FC<DirectorDashboardProps> = ({
  screen,
  setScreen,
  products,
  setProducts,
  transactions,
  setTransactions,
  arrivals,
  setArrivals,
  searchQuery,
  currentUser,
  setCurrentUser,
  accounts,
  setAccounts,
  directors,
  setDirectors,
  logs,
  setLogs,
  triggerAlert,
  onLogout,
}) => {
  // --- LOCAL STATES ---
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedInventory, setSelectedInventory] = useState<any | null>(null);

  // Filters for Products/Stock/Sales
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'rupture' | 'faible' | 'normal'>('all');
  
  // Modals for User Management
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'Gestionnaire de stock', status: 'Active' });

  // Company Settings State
  const [companySettings, setCompanySettings] = useState({
    name: 'SmartStock ERP',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdyr1abw6RtNQI2HtN1lu893gBGhm3IV8oLn_rfsLPIRMTd6DxPhyy01wH_hP34ivPu8ANo4mrkgBDvx9lSq9tG_bHH-vT3uOP7Mh08O5x7s-vplvHDofZ3lvXafq0GrBRRFWNS4xzeK6kFuRtqraWkKAw98EtXO8s7exOrDUtLGOP0PUFkh2ero4JayDhzn4POKfAwYIlZplPv7Ebi8B61PK8jnUjFvgs_-Na3FJtSKgJD77q3buP5HavRmMCmlCUCNeKEVVoZBc',
    address: 'Avenue de la République, Dakar, Sénégal',
    phone: '+221 33 800 00 00',
    currency: 'F CFA',
    timezone: 'UTC/GMT +0',
    lowStockThreshold: 15,
  });

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name.split(' ')[0] || '',
    lastname: currentUser.name.split(' ').slice(1).join(' ') || 'Rivera',
    phone: '+221 77 450 12 34',
    avatar: currentUser.avatar,
    password: currentUser.password || 'director',
  });

  // --- HARDCODED ENRICHMENT DATA ---
  const suppliers = [
    { name: 'Global Tech Dist.', contact: '+221 33 824 15 15', city: 'Dakar', email: 'contact@globaltech.sn', productCount: 3 },
    { name: 'Modern Office Co.', contact: '+225 27 22 40 40 40', city: 'Abidjan', email: 'sales@modernoffice.ci', productCount: 2 },
    { name: 'Cotton Masters', contact: '+223 20 22 33 44', city: 'Bamako', email: 'cotton@masters.ml', productCount: 1 },
    { name: 'Safe Guard Ltd.', contact: '+228 22 21 00 11', city: 'Lomé', email: 'safeguard@tg.org', productCount: 1 },
  ];

  const inventories = [
    { id: 'INV-2026-01', title: 'Inventaire Mensuel Électronique', date: '2026-06-28', manager: 'Robert King', itemsAudited: 4, discrepanciesCount: 1, items: [
      { sku: 'SKU-119', name: 'SmartHub 2.0', expected: 615, measured: 615, diff: 0 },
      { sku: 'SKU-884', name: 'Casque Pro Sound Sans-Fil', expected: 12, measured: 10, diff: -2 },
      { sku: 'SKU-122', name: 'Montre Connectée Horizon', expected: 8, measured: 8, diff: 0 },
      { sku: 'SKU-901', name: 'Lunettes Rétro Solaires', expected: 4, measured: 4, diff: 0 },
    ]},
    { id: 'INV-2026-02', title: 'Audit Général de Mi-Année', date: '2026-06-15', manager: 'Robert King', itemsAudited: 3, discrepanciesCount: 0, items: [
      { sku: 'SKU-442', name: 'Moteur Pro-Fit X', expected: 842, measured: 842, diff: 0 },
      { sku: 'SKU-208', name: 'Alliage de Précision V4', expected: 588, measured: 588, diff: 0 },
      { sku: 'SKU-982', name: 'Caisse Standard 50L', expected: 433, measured: 433, diff: 0 },
    ]}
  ];

  // --- STATS COMPUTATIONS ---
  const todayTransactions = transactions.filter(t => t.date === '2026-07-02' || t.date === '2026-07-01');
  const dailyRevenue = todayTransactions.reduce((acc, t) => acc + t.value, 0);
  const monthlyRevenue = transactions.reduce((acc, t) => acc + t.value, 0);
  const totalStockValue = products.reduce((acc, p) => acc + p.price * p.stock, 0);
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= companySettings.lowStockThreshold);

  // Users counts
  const stockManagers = accounts.filter(a => a.role.toLowerCase().includes('gestionnaire'));
  const cashiers = accounts.filter(a => a.role.toLowerCase().includes('caissier'));
  const activeStockManagers = stockManagers.length; // standard simplified
  const activeCashiers = cashiers.length;

  // --- ALERTS ---
  const systemAlerts = [
    ...outOfStockProducts.map(p => ({ type: 'rupture' as const, message: `Rupture critique : ${p.name}`, ref: p })),
    ...lowStockProducts.map(p => ({ type: 'faible' as const, message: `Stock faible : ${p.name} (${p.stock} restants)`, ref: p })),
    { type: 'inventaire' as const, message: 'Inventaire requis en Zone de stockage B-12', target: 'director-stock' },
    { type: 'caisse' as const, message: 'Caisse Principale ouverte par Alex Admin', target: 'director-sales' },
    ...accounts.filter(a => directors.find(d => d.email === a.email)?.status === 'Suspendu').map(a => ({ type: 'user' as const, message: `Collaborateur suspendu : ${a.name}`, ref: a })),
  ];

  // --- LOG GOVERNANCE ACTION ---
  const logDirectorAction = (title: string, description: string, type: 'access' | 'policy' | 'audit' | 'success' | 'error' = 'audit') => {
    const newLog: GovernanceLog = {
      id: `ID-${Math.floor(10000 + Math.random() * 90000)}`,
      type,
      title,
      description,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour12: false }),
      code: `DIR-${Math.floor(100 + Math.random() * 900)}`,
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // --- USER HANDLERS ---
  const handleOpenUserModal = (u: User | null = null) => {
    if (u) {
      setEditingUser(u);
      const associatedDir = directors.find(d => d.email === u.email);
      setUserForm({
        name: u.name,
        email: u.email || '',
        password: u.password || 'password123',
        role: u.role,
        status: associatedDir?.status || 'Actif',
      });
    } else {
      setEditingUser(null);
      setUserForm({ name: '', email: '', password: 'password123', role: 'Gestionnaire de stock', status: 'Actif' });
    }
    setShowUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email) {
      alert('Veuillez remplir les informations obligatoires');
      return;
    }

    if (editingUser) {
      // Edit User
      setAccounts(prev => prev.map(a => a.email === editingUser.email ? { ...a, name: userForm.name, role: userForm.role, password: userForm.password } : a));
      setDirectors(prev => prev.map(d => d.email === editingUser.email ? {
        ...d,
        name: userForm.name,
        department: userForm.role,
        status: userForm.status as any,
      } : d));
      triggerAlert(`Compte de ${userForm.name} modifié avec succès !`, 'success');
      logDirectorAction('Modification Utilisateur', `Le directeur a modifié le compte de ${userForm.name} (${userForm.email})`);
    } else {
      // Create User
      const newUser: User = {
        name: userForm.name,
        email: userForm.email,
        password: userForm.password,
        role: userForm.role,
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(userForm.name)}`,
        branch: 'Succursale active',
      };
      const newDir: Director = {
        id: `USR-${Date.now().toString().slice(-3)}`,
        name: userForm.name,
        email: userForm.email,
        department: userForm.role,
        lastActivity: 'Créé aujourd\'hui',
        status: userForm.status as any,
        initials: userForm.name.slice(0, 2).toUpperCase(),
        bgColor: 'bg-indigo-50 text-indigo-700',
      };
      setAccounts(prev => [...prev, newUser]);
      setDirectors(prev => [newDir, ...prev]);
      triggerAlert(`Nouveau compte créé pour ${userForm.name} (${userForm.role}) !`, 'success');
      logDirectorAction('Création Utilisateur', `Le directeur a créé le compte de ${userForm.name} (${userForm.email})`);
    }
    setShowUserModal(false);
  };

  const toggleUserStatus = (u: User) => {
    const associatedDir = directors.find(d => d.email === u.email);
    if (!associatedDir) return;
    const nextStatus = associatedDir.status === 'Actif' ? 'Suspendu' : 'Actif';
    setDirectors(prev => prev.map(d => d.email === u.email ? { ...d, status: nextStatus } : d));
    triggerAlert(`Statut de ${u.name} mis à jour : ${nextStatus}`, 'info');
    logDirectorAction('Changement de Statut', `Le directeur a passé le compte de ${u.name} à ${nextStatus}`);
  };

  const handleResetPassword = (u: User) => {
    const newPass = prompt(`Entrez le nouveau mot de passe pour ${u.name} :`, 'nouveauMdp2026');
    if (newPass === null) return;
    if (!newPass.trim()) {
      alert('Le mot de passe ne peut pas être vide.');
      return;
    }
    setAccounts(prev => prev.map(a => a.email === u.email ? { ...a, password: newPass } : a));
    triggerAlert(`Mot de passe réinitialisé pour ${u.name}`, 'success');
    logDirectorAction('Réinitialisation MDP', `Réinitialisation de mot de passe réussie pour ${u.name}`);
  };

  const handleResendActivation = (u: User) => {
    triggerAlert(`E-mail d'activation renvoyé à ${u.email}`, 'success');
    logDirectorAction('Renvoi Email Activation', `E-mail d'activation envoyé à ${u.email}`);
  };

  // --- SETTINGS HANDLER ---
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAlert('Paramètres de l\'entreprise enregistrés avec succès !', 'success');
    logDirectorAction('Mise à jour Paramètres', 'Modification des paramètres généraux de l\'entreprise.');
  };

  // --- PROFILE HANDLER ---
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser = {
      ...currentUser,
      name: `${profileForm.name} ${profileForm.lastname}`,
      password: profileForm.password,
    };
    setCurrentUser(updatedUser);
    // Sync inside accounts list too
    setAccounts(prev => prev.map(a => a.email === currentUser.email ? { ...a, name: updatedUser.name, password: updatedUser.password } : a));
    triggerAlert('Votre profil a été mis à jour !', 'success');
    logDirectorAction('Mise à jour Profil', 'Le Directeur a mis à jour ses informations de profil.');
  };

  // --- SEARCH AND FILTERS ---
  const q = searchQuery.toLowerCase();
  
  const filteredProducts = products.filter(p => {
    const matchesQuery = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    const matchesStock = 
      stockStatusFilter === 'all' ||
      (stockStatusFilter === 'rupture' && p.stock === 0) ||
      (stockStatusFilter === 'faible' && p.stock > 0 && p.stock <= companySettings.lowStockThreshold) ||
      (stockStatusFilter === 'normal' && p.stock > companySettings.lowStockThreshold);
    return matchesQuery && matchesCategory && matchesStock;
  });

  const filteredTransactions = transactions.filter(t => 
    t.id.toLowerCase().includes(q) || 
    t.asset.toLowerCase().includes(q) || 
    t.category.toLowerCase().includes(q) ||
    t.origin.toLowerCase().includes(q) ||
    t.destination.toLowerCase().includes(q)
  );

  const filteredAccounts = accounts.filter(a => {
    const isTeam = a.role.includes('Gestionnaire') || a.role.includes('Caissier');
    if (!isTeam) return false;
    return a.name.toLowerCase().includes(q) || (a.email && a.email.toLowerCase().includes(q)) || a.role.toLowerCase().includes(q);
  });

  // Export report helper
  const triggerExport = (reportName: string, format: 'PDF' | 'EXCEL' | 'CSV') => {
    triggerAlert(`Exportation du ${reportName} au format ${format} démarrée...`, 'success');
    logDirectorAction('Export de Rapport', `Export du ${reportName} au format ${format}`);
  };

  return (
    <div className="pt-20 px-8 pb-12 w-full animate-fade-in font-sans">
      
      {/* ------------------ TABLEAU DE BORD (SCREEN: director-dashboard) ------------------ */}
      {screen === 'director-dashboard' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tableau de bord décisionnel</h2>
            <p className="text-gray-500 text-sm mt-1">Séparation stricte des rôles : consultation globale de SmartStock ERP en temps réel.</p>
          </div>

          {/* KPI CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div onClick={() => setScreen('director-sales')} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-indigo-50 text-[#3525cd] rounded-xl">
                  <span className="material-symbols-outlined text-[22px]">payments</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">trending_up</span>+12.4%
                </span>
              </div>
              <p className="text-gray-400 text-[10px] uppercase font-bold mt-4 tracking-wider">Chiffre d'Affaires (Jour)</p>
              <h3 className="text-xl font-extrabold text-gray-900 mt-1">{dailyRevenue.toLocaleString('fr-FR')} {companySettings.currency}</h3>
              <p className="text-gray-400 text-xs mt-1">Aujourd'hui, 2026-07-02</p>
            </div>

            <div onClick={() => setScreen('director-sales')} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                  <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">trending_up</span>+8.5%
                </span>
              </div>
              <p className="text-gray-400 text-[10px] uppercase font-bold mt-4 tracking-wider">Chiffre d'Affaires (Mois)</p>
              <h3 className="text-xl font-extrabold text-gray-900 mt-1">{monthlyRevenue.toLocaleString('fr-FR')} {companySettings.currency}</h3>
              <p className="text-gray-400 text-xs mt-1">Cumulé du mois de juillet</p>
            </div>

            <div onClick={() => setScreen('director-sales')} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <span className="material-symbols-outlined text-[22px]">shopping_cart</span>
                </div>
                <span className="text-xs text-gray-500 font-semibold">Volume</span>
              </div>
              <p className="text-gray-400 text-[10px] uppercase font-bold mt-4 tracking-wider font-sans">Nombre de Ventes</p>
              <h3 className="text-xl font-extrabold text-gray-900 mt-1">{transactions.length} Transactions</h3>
              <p className="text-gray-400 text-xs mt-1">Toutes entités d'envois</p>
            </div>

            <div onClick={() => setScreen('director-stock')} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <span className="material-symbols-outlined text-[22px]">inventory_2</span>
                </div>
                <span className="text-xs text-[#006591] font-bold">Actif</span>
              </div>
              <p className="text-gray-400 text-[10px] uppercase font-bold mt-4 tracking-wider">Valeur totale du stock</p>
              <h3 className="text-xl font-extrabold text-gray-900 mt-1">{totalStockValue.toLocaleString('fr-FR')} {companySettings.currency}</h3>
              <p className="text-gray-400 text-xs mt-1">Valorisation au prix catalogue</p>
            </div>

            <div onClick={() => setScreen('director-products')} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <span className="material-symbols-outlined text-[22px]">category</span>
                </div>
              </div>
              <p className="text-gray-400 text-[10px] uppercase font-bold mt-4 tracking-wider">Nombre de Produits</p>
              <h3 className="text-xl font-extrabold text-gray-900 mt-1">{products.length} Articles</h3>
              <p className="text-gray-400 text-xs mt-1">Enregistrés au catalogue</p>
            </div>

            <div onClick={() => { setStockStatusFilter('rupture'); setScreen('director-stock'); }} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs cursor-pointer hover:border-red-300 hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                  <span className="material-symbols-outlined text-[22px]">error</span>
                </div>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Alerte</span>
              </div>
              <p className="text-gray-400 text-[10px] uppercase font-bold mt-4 tracking-wider">Produits en Rupture</p>
              <h3 className={`text-xl font-extrabold mt-1 ${outOfStockProducts.length > 0 ? 'text-rose-600 animate-pulse' : 'text-gray-900'}`}>{outOfStockProducts.length} Réf</h3>
              <p className="text-gray-400 text-xs mt-1">Ruptures d'approvisionnement</p>
            </div>

            <div onClick={() => { setStockStatusFilter('faible'); setScreen('director-stock'); }} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs cursor-pointer hover:border-amber-300 hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
                  <span className="material-symbols-outlined text-[22px]">warning</span>
                </div>
                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Seuil</span>
              </div>
              <p className="text-gray-400 text-[10px] uppercase font-bold mt-4 tracking-wider">Produits Stock Faible</p>
              <h3 className="text-xl font-extrabold text-gray-900 mt-1">{lowStockProducts.length} Réf</h3>
              <p className="text-gray-400 text-xs mt-1">Sous le seuil d'alerte ({companySettings.lowStockThreshold})</p>
            </div>

            <div onClick={() => setScreen('director-users')} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
                  <span className="material-symbols-outlined text-[22px]">group</span>
                </div>
                <span className="text-xs text-emerald-600 font-bold">Actifs</span>
              </div>
              <p className="text-gray-400 text-[10px] uppercase font-bold mt-4 tracking-wider">Personnel Responsable</p>
              <h3 className="text-xl font-extrabold text-gray-900 mt-1">{activeStockManagers + activeCashiers} Actifs</h3>
              <p className="text-gray-400 text-xs mt-1">{activeStockManagers} Stock • {activeCashiers} Caisses</p>
            </div>
          </div>

          {/* MAIN GRAPHICS & ALERTS CONTAINER */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* GRAPHS */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-gray-900">Évolution de l'activité commerciale</h4>
                  <p className="text-gray-400 text-xs">Comparatif des flux de ventes quotidiennes</p>
                </div>
                <button onClick={() => setScreen('director-analytics')} className="text-xs text-indigo-600 font-bold hover:underline">Voir les Analyses BI</button>
              </div>

              {/* SIMULATED BAR CHART */}
              <div className="h-64 flex items-end justify-between gap-3 pb-2 border-b border-gray-100">
                {[
                  { day: 'Lun', sales: '40%', rev: '30%' },
                  { day: 'Mar', sales: '60%', rev: '50%' },
                  { day: 'Mer', sales: '80%', rev: '75%' },
                  { day: 'Jeu', sales: '55%', rev: '60%' },
                  { day: 'Ven', sales: '90%', rev: '95%' },
                  { day: 'Sam', sales: '45%', rev: '40%' },
                  { day: 'Dim', sales: '30%', rev: '25%' },
                ].map((bar, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-full max-w-[45px] flex items-end gap-1.5 h-44 relative">
                      <div className="flex-1 bg-indigo-100 rounded-t-xs transition-all duration-500" style={{ height: bar.sales }} title={`Volume ventes: ${bar.sales}`}></div>
                      <div className="flex-1 bg-indigo-600 rounded-t-xs transition-all duration-500 group-hover:brightness-110 shadow-xs" style={{ height: bar.rev }} title={`Revenus générés: ${bar.rev}`}></div>
                    </div>
                    <span className="text-[11px] text-gray-500 font-semibold">{bar.day}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-6 justify-center text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-100"></span> Nombre total de transactions</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Chiffre d'affaires journalier (FCFA)</span>
              </div>
            </div>

            {/* ALERTS CENTER */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col h-full">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <h4 className="font-bold text-gray-900">Centre d'Alertes</h4>
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-600 rounded-full">{systemAlerts.length} Messages</span>
              </div>
              
              <div className="flex-1 overflow-y-auto py-4 space-y-3 max-h-[260px] custom-scrollbar">
                {systemAlerts.map((alt, idx) => (
                  <div key={idx} 
                    onClick={() => {
                      if (alt.type === 'rupture' || alt.type === 'faible') {
                        setStockStatusFilter(alt.type);
                        setScreen('director-stock');
                      } else if (alt.type === 'user') {
                        setScreen('director-users');
                      } else if (alt.target) {
                        setScreen(alt.target as any);
                      }
                    }}
                    className="flex items-start gap-3 p-3 rounded-xl border border-gray-50 bg-gray-50/40 hover:bg-rose-50/20 transition-all cursor-pointer hover:border-rose-100"
                  >
                    <span className="material-symbols-outlined text-[18px] text-rose-500 mt-0.5">
                      {alt.type === 'rupture' ? 'cancel' : alt.type === 'faible' ? 'warning' : alt.type === 'user' ? 'person_off' : 'info'}
                    </span>
                    <p className="text-xs text-gray-700 font-medium leading-normal">{alt.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RECENT ACTIVITIES & QUICK ACTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* RECENT ACTIVITIES */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
              <h4 className="font-bold text-gray-900">Activités Récentes</h4>
              
              <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {/* Simulated activity log with rich outputs */}
                <div className="py-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">Vente effectuée - Ticket #99018</p>
                      <p className="text-[10px] text-gray-400">Par Caissier : Alex Admin • SmartHub 2.0 (Lot 5)</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400">Aujourd'hui 15h32</span>
                </div>

                <div className="py-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">Réception stock validé - ARR-01</p>
                      <p className="text-[10px] text-gray-400">Fournisseur : Global Tech Dist. • +450 Unités</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400">Aujourd'hui 11h15</span>
                </div>

                <div className="py-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">Inventaire mensuel électronique validé</p>
                      <p className="text-[10px] text-gray-400">Par Gestionnaire de stock : Robert King • 1 anomalie</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400">Hier 18h00</span>
                </div>

                <div className="py-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">login</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">Connexion utilisateur de l'équipe</p>
                      <p className="text-[10px] text-gray-400">Robert King (Gestionnaire de stock) s'est connecté</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400">Hier 08h30</span>
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
              <h4 className="font-bold text-gray-900 mb-6">Actions Rapides</h4>
              
              <div className="space-y-3 flex-1 flex flex-col justify-center">
                <button 
                  onClick={() => { handleOpenUserModal(); setUserForm(prev => ({ ...prev, role: 'Gestionnaire de stock' })); }}
                  className="w-full flex items-center justify-between p-3.5 bg-indigo-50/50 hover:bg-indigo-50 border border-transparent rounded-xl text-left text-xs font-bold text-indigo-700 transition-all cursor-pointer"
                >
                  <span>Créer un Gestionnaire de Stock</span>
                  <span className="material-symbols-outlined text-sm">person_add</span>
                </button>

                <button 
                  onClick={() => { handleOpenUserModal(); setUserForm(prev => ({ ...prev, role: 'Caissier' })); }}
                  className="w-full flex items-center justify-between p-3.5 bg-violet-50/50 hover:bg-violet-50 border border-transparent rounded-xl text-left text-xs font-bold text-violet-700 transition-all cursor-pointer"
                >
                  <span>Créer un Caissier</span>
                  <span className="material-symbols-outlined text-sm">person_add</span>
                </button>

                <button 
                  onClick={() => setScreen('director-reports')}
                  className="w-full flex items-center justify-between p-3.5 bg-gray-50 hover:bg-gray-100 border border-transparent rounded-xl text-left text-xs font-bold text-gray-700 transition-all cursor-pointer"
                >
                  <span>Consulter les Rapports ERP</span>
                  <span className="material-symbols-outlined text-sm">analytics</span>
                </button>

                <button 
                  onClick={() => triggerExport('Rapport Statistiques BI', 'EXCEL')}
                  className="w-full flex items-center justify-between p-3.5 bg-emerald-50/50 hover:bg-emerald-50 border border-transparent rounded-xl text-left text-xs font-bold text-emerald-700 transition-all cursor-pointer"
                >
                  <span>Exporter les Statistiques</span>
                  <span className="material-symbols-outlined text-sm">download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ ANALYSE FINANCIÈRE (SCREEN: director-finance) ------------------ */}
      {screen === 'director-finance' && (
        <DirectorFinance
          products={products}
          transactions={transactions}
          accounts={accounts}
          triggerAlert={triggerAlert}
        />
      )}

      {/* ------------------ UTILISATEURS (SCREEN: director-users) ------------------ */}
      {screen === 'director-users' && (
        <div className="space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight font-sans">Gestion de l'Équipe ERP</h2>
              <p className="text-gray-500 text-sm mt-1">Gérez les comptes des Gestionnaires de Stock et Caissiers rattachés à votre autorité.</p>
            </div>
            <button 
              onClick={() => handleOpenUserModal()}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add</span> Nouveau Collaborateur
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* USERS LIST TABLE */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <span className="font-bold text-sm text-gray-800">Équipe active ({filteredAccounts.length})</span>
                <span className="text-xs text-gray-400">Actions d'habilitations et de conformité</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 text-gray-500 text-[10px] uppercase font-bold border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3">Nom / E-mail</th>
                      <th className="px-6 py-3">Rôle Métier</th>
                      <th className="px-6 py-3">Statut Compte</th>
                      <th className="px-6 py-3 text-right">Actions de Contrôle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAccounts.length > 0 ? (
                      filteredAccounts.map((u, idx) => {
                        const associatedDir = directors.find(d => d.email === u.email);
                        const isSuspended = associatedDir?.status === 'Suspendu';
                        return (
                          <tr key={idx} className="hover:bg-gray-50/40 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img src={u.avatar} className="w-8 h-8 rounded-full border border-gray-100 object-cover" alt="" />
                                <div>
                                  <p className="font-bold text-sm text-gray-900">{u.name}</p>
                                  <p className="text-xs text-gray-400">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${u.role.includes('Gestionnaire') ? 'bg-sky-50 text-sky-700' : 'bg-violet-50 text-violet-700'}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isSuspended ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {isSuspended ? 'Désactivé' : 'Actif'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-1">
                              <button 
                                onClick={() => handleOpenUserModal(u)}
                                className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" 
                                title="Modifier"
                              >
                                <span className="material-symbols-outlined text-sm">edit</span>
                              </button>
                              <button 
                                onClick={() => toggleUserStatus(u)}
                                className={`p-1 rounded-lg transition-all ${isSuspended ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-500 hover:bg-red-50'}`} 
                                title={isSuspended ? 'Réactiver le compte' : 'Désactiver le compte'}
                              >
                                <span className="material-symbols-outlined text-sm">{isSuspended ? 'check_circle' : 'block'}</span>
                              </button>
                              <button 
                                onClick={() => handleResetPassword(u)}
                                className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" 
                                title="Réinitialiser le mot de passe"
                              >
                                <span className="material-symbols-outlined text-sm">lock_reset</span>
                              </button>
                              <button 
                                onClick={() => handleResendActivation(u)}
                                className="p-1 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all" 
                                title="Renvoyer l'email d'activation"
                              >
                                <span className="material-symbols-outlined text-sm">mail</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-xs text-gray-400">Aucun collaborateur trouvé</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AUDIT ACTIONS LOG (READ-ONLY) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col h-[400px]">
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <span className="font-bold text-sm text-gray-800">Journal des Activités (Lecture seule)</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {logs.filter(l => l.title.includes('Vente') || l.title.includes('Stock') || l.title.includes('Compte') || l.title.includes('Email') || l.title.includes('MDP')).map((l, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="mt-1">
                      <span className={`w-2 h-2 rounded-full block ${l.type === 'error' ? 'bg-red-500' : l.type === 'success' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">{l.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">{l.description}</p>
                      <span className="text-[9px] text-gray-400 font-mono block mt-1">{l.timestamp} • {l.code}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ CATALOGUE PRODUITS (SCREEN: director-products) ------------------ */}
      {screen === 'director-products' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight font-sans">Catalogue des Produits (Consultation)</h2>
            <p className="text-gray-500 text-sm mt-1">Accès en lecture seule. Vous pouvez filtrer, rechercher et consulter l'historique d'un produit.</p>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-sans bg-white focus:outline-none"
            >
              <option value="">Toutes les catégories</option>
              <option value="Électronique">Électronique</option>
              <option value="Automobile">Automobile</option>
              <option value="Fabrication">Fabrication</option>
              <option value="Logistique">Logistique</option>
              <option value="Accessoires">Accessoires</option>
              <option value="Chaussures">Chaussures</option>
              <option value="Voyage">Voyage</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* PRODUCTS LIST */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <span className="font-bold text-sm text-gray-800">Catalogue ({filteredProducts.length})</span>
                <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-full">Lecture Seule</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 text-gray-500 text-[10px] uppercase font-bold border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3">Produit</th>
                      <th className="px-6 py-3">SKU</th>
                      <th className="px-6 py-3">Catégorie</th>
                      <th className="px-6 py-3">Prix de Vente</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={p.image} className="w-10 h-10 rounded-lg border border-gray-100 object-cover" alt="" />
                            <p className="font-bold text-sm text-gray-900">{p.name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono font-bold text-gray-600">{p.sku}</td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-600">{p.category}</td>
                        <td className="px-6 py-4 text-xs font-bold text-gray-800">{p.price.toLocaleString('fr-FR')} {companySettings.currency}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setSelectedProduct(p)}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Consulter Fiche
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DETAILED PRODUCT SHEET */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs h-fit space-y-6">
              {selectedProduct ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-900">Fiche Produit Détaillée</h4>
                    <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-gray-600"><span className="material-symbols-outlined">close</span></button>
                  </div>

                  <img src={selectedProduct.image} className="w-full h-40 object-cover rounded-xl border border-gray-100" alt="" />
                  
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">{selectedProduct.name}</h3>
                    <p className="text-xs font-mono font-bold text-gray-400 mt-1">SKU: {selectedProduct.sku}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs border-y border-gray-50 py-4">
                    <div>
                      <p className="text-gray-400 font-semibold uppercase text-[9px] tracking-wider">Catégorie</p>
                      <p className="font-bold text-gray-800 mt-0.5">{selectedProduct.category}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-semibold uppercase text-[9px] tracking-wider">Prix de Vente</p>
                      <p className="font-bold text-indigo-600 mt-0.5">{selectedProduct.price.toLocaleString('fr-FR')} {companySettings.currency}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-semibold uppercase text-[9px] tracking-wider">Stock Actuel</p>
                      <p className={`font-bold mt-0.5 ${selectedProduct.stock === 0 ? 'text-red-600' : 'text-gray-800'}`}>{selectedProduct.stock} Unités</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-semibold uppercase text-[9px] tracking-wider">Rotation</p>
                      <p className="font-bold text-teal-600 mt-0.5">{selectedProduct.velocity || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Historique de Performance</p>
                    <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-50">
                      Ce produit enregistre un volume de vente estimé à {selectedProduct.salesVolume || selectedProduct.stock + 120} unités ce mois-ci. Tendance : {selectedProduct.trend || 'Haute'}.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-3">
                  <span className="material-symbols-outlined text-4xl text-gray-300">find_in_page</span>
                  <span>Sélectionnez un produit pour afficher sa fiche technique et l'historique complet des flux.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------ ÉTAT STOCKS (SCREEN: director-stock) ------------------ */}
      {screen === 'director-stock' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight font-sans">Supervision des Stocks (Lecture seule)</h2>
            <p className="text-gray-500 text-sm mt-1">Consultation en temps réel des quantités, mouvements d'arrivées et des rapports d'audits d'inventaires.</p>
          </div>

          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button 
                onClick={() => setStockStatusFilter('all')} 
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${stockStatusFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Tous les stocks
              </button>
              <button 
                onClick={() => setStockStatusFilter('rupture')} 
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${stockStatusFilter === 'rupture' ? 'bg-rose-600 text-white animate-pulse' : 'bg-gray-100 text-gray-600'}`}
              >
                Ruptures ({outOfStockProducts.length})
              </button>
              <button 
                onClick={() => setStockStatusFilter('faible')} 
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${stockStatusFilter === 'faible' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Stock faible ({lowStockProducts.length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* STOCKS TABLE */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <span className="font-bold text-sm text-gray-800">État du stock ({filteredProducts.length} articles correspondants)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 text-gray-500 text-[10px] uppercase font-bold border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3">Produit</th>
                      <th className="px-6 py-3">SKU</th>
                      <th className="px-6 py-3">Quantité en Stock</th>
                      <th className="px-6 py-3">Seuil critique</th>
                      <th className="px-6 py-3 text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.map((p, idx) => {
                      const isRupture = p.stock === 0;
                      const isLow = p.stock > 0 && p.stock <= companySettings.lowStockThreshold;
                      return (
                        <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-sm text-gray-900 leading-tight">{p.name}</p>
                            <p className="text-[11px] text-gray-400 font-medium">{p.category}</p>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-gray-500 font-bold">{p.sku}</td>
                          <td className="px-6 py-4">
                            <span className={`text-xs font-extrabold ${isRupture ? 'text-rose-600' : isLow ? 'text-orange-600' : 'text-gray-800'}`}>{p.stock} unités</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-gray-500">{companySettings.lowStockThreshold} unités</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isRupture ? 'bg-rose-50 text-rose-600' : isLow ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {isRupture ? 'Rupture' : isLow ? 'Faible' : 'Sûr'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RECENT STOCK MOVEMENTS & INVENTORY REPORTS */}
            <div className="space-y-6">
              {/* ARRIVALS */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                <h4 className="font-bold text-gray-900 text-sm">Derniers Arrivages Reçus</h4>
                <div className="space-y-3 max-h-[180px] overflow-y-auto custom-scrollbar">
                  {arrivals.map((arr, idx) => (
                    <div key={idx} className="p-3 bg-gray-50/40 border border-gray-50 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-gray-800">Code: {arr.sku}</p>
                        <p className="text-[10px] text-gray-400">Fournisseur: {arr.supplier}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-emerald-600 block">{arr.quantity}</span>
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[9px] tracking-wide">{arr.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AUDITS REPORT LIST */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                <h4 className="font-bold text-gray-900 text-sm">Rapports d'Inventaires validés</h4>
                <div className="space-y-2">
                  {inventories.map((inv, idx) => (
                    <div key={idx} onClick={() => setSelectedInventory(inv)} className="p-3 rounded-xl border border-gray-50 hover:bg-indigo-50/20 cursor-pointer hover:border-indigo-100 transition-all text-xs flex justify-between items-center bg-gray-50/30">
                      <div>
                        <p className="font-bold text-gray-800 leading-tight">{inv.title}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Le {inv.date} par {inv.manager}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${inv.discrepanciesCount > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {inv.discrepanciesCount > 0 ? `${inv.discrepanciesCount} Anomalie` : 'Conforme'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* INVENTORY REPORT DETAIL MODAL */}
          {selectedInventory && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
                <button onClick={() => setSelectedInventory(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><span className="material-symbols-outlined">close</span></button>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{selectedInventory.title}</h3>
                <p className="text-xs text-gray-400 mb-6">Validé le {selectedInventory.date} • Responsable audit: {selectedInventory.manager}</p>

                <div className="border border-gray-100 rounded-xl overflow-hidden mb-6 text-xs">
                  <div className="grid grid-cols-4 bg-gray-50 font-bold p-3 text-gray-500">
                    <span>Produit</span>
                    <span className="text-center">Théorique</span>
                    <span className="text-center">Physique</span>
                    <span className="text-right">Écart</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {selectedInventory.items.map((item: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-4 p-3 items-center">
                        <div>
                          <p className="font-bold text-gray-800 truncate">{item.name}</p>
                          <p className="text-[9px] text-gray-400 font-mono">{item.sku}</p>
                        </div>
                        <span className="text-center text-gray-600">{item.expected}</span>
                        <span className="text-center text-gray-600">{item.measured}</span>
                        <span className={`text-right font-extrabold ${item.diff < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{item.diff === 0 ? '-' : item.diff}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg text-xs leading-normal text-gray-600 border border-gray-100">
                  <p className="font-bold text-gray-700">Observation décisionnelle :</p>
                  <p className="mt-1">{selectedInventory.discrepanciesCount > 0 ? "Des écarts de stocks ont été identifiés dans les Électroniques de la Zone B. L'anomalie a été affectée au stock de sécurité." : "Aucune anomalie à déclarer. L'inventaire physique concorde parfaitement avec la base ERP."}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------ VENTES & FACTURES (SCREEN: director-sales) ------------------ */}
      {screen === 'director-sales' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight font-sans">Suivi des Ventes (Lecture seule)</h2>
            <p className="text-gray-500 text-sm mt-1">Consultez l'historique complet des transactions point de vente et les détails des tickets caisse émis.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* TRANSACTION HISTORY */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <span className="font-bold text-sm text-gray-800">Tickets émis ({filteredTransactions.length})</span>
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full">Lecture seule</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 text-gray-500 text-[10px] uppercase font-bold border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3">ID Transaction</th>
                      <th className="px-6 py-3">Libellé</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Montant</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTransactions.map((t, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono font-bold text-gray-700">{t.id}</td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-sm text-gray-900 leading-tight">{t.asset}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{t.category}</p>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 font-semibold">{t.date}</td>
                        <td className="px-6 py-4 text-xs font-extrabold text-gray-900">{t.value.toLocaleString('fr-FR')} {companySettings.currency}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setSelectedTransaction(t)}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Détails Ticket
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PERFORMANCE CAISSIERS */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs h-fit space-y-6">
              <h4 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-3">Performances des Caissiers</h4>
              
              <div className="space-y-4">
                {cashiers.map((c, idx) => {
                  const totalSum = transactions.filter(t => t.id).reduce((acc, t) => acc + (t.value / 3), 0); // simulated ratio
                  return (
                    <div key={idx} className="p-3 bg-gray-50/40 rounded-xl border border-gray-50 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <img src={c.avatar} className="w-8 h-8 rounded-full border border-gray-100" alt="" />
                        <div>
                          <p className="font-bold text-gray-800">{c.name}</p>
                          <p className="text-[10px] text-gray-400">Succursale principale</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-indigo-600">{totalSum.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {companySettings.currency}</p>
                        <p className="text-[10px] text-gray-400 font-semibold">Taux d'activité : 96%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DETAILED RECEIPT / TICKET MODAL */}
          {selectedTransaction && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative font-sans border border-gray-100">
                <button onClick={() => setSelectedTransaction(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><span className="material-symbols-outlined">close</span></button>
                
                {/* Simulated Digital Invoice Ticket */}
                <div className="text-center pb-6 border-b border-dashed border-gray-200">
                  <h3 className="text-base font-extrabold text-gray-900">{companySettings.name}</h3>
                  <p className="text-[11px] text-gray-500 mt-1">{companySettings.address}</p>
                  <p className="text-[11px] text-gray-500">{companySettings.phone}</p>
                </div>

                <div className="py-4 space-y-1 text-xs text-gray-600 border-b border-gray-100">
                  <p className="flex justify-between"><span>Date / Heure :</span> <span className="font-bold text-gray-800">{selectedTransaction.date} • 14:35</span></p>
                  <p className="flex justify-between"><span>N° Ticket :</span> <span className="font-mono font-bold text-gray-800">{selectedTransaction.id}</span></p>
                  <p className="flex justify-between"><span>Caissier :</span> <span className="font-bold text-gray-800">Alex Admin</span></p>
                </div>

                <div className="py-4 border-b border-gray-100 text-xs">
                  <p className="font-bold text-gray-900 mb-2">Détails des articles</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-semibold">{selectedTransaction.asset} x 1</span>
                      <span className="font-extrabold text-gray-900">{selectedTransaction.value.toLocaleString('fr-FR')} F CFA</span>
                    </div>
                  </div>
                </div>

                <div className="py-4 space-y-1.5 text-xs">
                  <p className="flex justify-between"><span>Sous-total HT :</span> <span className="font-bold text-gray-800">{(selectedTransaction.value * 0.82).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F CFA</span></p>
                  <p className="flex justify-between"><span>TVA (18%) :</span> <span className="font-bold text-gray-800">{(selectedTransaction.value * 0.18).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F CFA</span></p>
                  <p className="flex justify-between text-base font-extrabold text-gray-900 pt-2 border-t border-dashed border-gray-200"><span>Montant Total :</span> <span>{selectedTransaction.value.toLocaleString('fr-FR')} F CFA</span></p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg text-center text-[11px] text-gray-500 font-medium">
                  Mode de règlement : Mobile Money (Wave)<br />
                  Merci de votre confiance !
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------ ANALYSES / DÉCISION BI (SCREEN: director-analytics) ------------------ */}
      {screen === 'director-analytics' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight font-sans">Analyses BI & Performance</h2>
            <p className="text-gray-500 text-sm mt-1">Visualisez l'état analytique de vos revenus d'activité, votre valorisation de stocks et tendances de rotation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* PRODUCT CATEGORIES BREAKDOWN */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
              <h4 className="font-bold text-gray-900">Répartition des Produits par Catégorie</h4>
              <div className="space-y-4">
                {[
                  { name: 'Électronique', count: 3, percentage: '30%' },
                  { name: 'Automobile', count: 1, percentage: '10%' },
                  { name: 'Accessoires', count: 2, percentage: '20%' },
                  { name: 'Chaussures', count: 1, percentage: '10%' },
                  { name: 'Voyage', count: 1, percentage: '10%' },
                  { name: 'Fabrication', count: 1, percentage: '10%' },
                  { name: 'Logistique', count: 1, percentage: '10%' },
                ].map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600 font-semibold">
                      <span>{cat.name} ({cat.count} articles)</span>
                      <span>{cat.percentage}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: cat.percentage }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PAYMENT METHODS REPARTITION */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
              <h4 className="font-bold text-gray-900">Répartition par Modes de Paiement</h4>
              <div className="space-y-4">
                {[
                  { mode: 'Wave Mobile Money', vol: '45.400.000 F CFA', ratio: '53%' },
                  { mode: 'Espèces (Cash)', vol: '25.600.000 F CFA', ratio: '30%' },
                  { mode: 'Carte Bancaire', vol: '14.500.000 F CFA', ratio: '17%' },
                ].map((pay, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600 font-semibold">
                      <span>{pay.mode}</span>
                      <span>{pay.ratio} ({pay.vol})</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-teal-500 h-full rounded-full transition-all" style={{ width: pay.ratio }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MOST SOLD VS LEAST SOLD */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h4 className="font-bold text-gray-900">Produits les Plus Vendus</h4>
              <div className="divide-y divide-gray-50">
                {products.slice(0, 3).map((p, idx) => (
                  <div key={idx} className="py-3 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2.5">
                      <img src={p.image} className="w-8 h-8 rounded-lg object-cover" alt="" />
                      <p className="font-bold text-gray-800">{p.name}</p>
                    </div>
                    <span className="font-extrabold text-emerald-600">+{p.salesVolume || p.stock + 120} ventes</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h4 className="font-bold text-gray-900 text-sm">Produits les Moins Vendus</h4>
              <div className="divide-y divide-gray-50">
                {products.slice().reverse().slice(0, 3).map((p, idx) => (
                  <div key={idx} className="py-3 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2.5">
                      <img src={p.image} className="w-8 h-8 rounded-lg object-cover" alt="" />
                      <p className="font-bold text-gray-800">{p.name}</p>
                    </div>
                    <span className="font-extrabold text-rose-500">{p.stock <= 5 ? 'Rotation lente' : 'Stable'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ RAPPORTS (SCREEN: director-reports) ------------------ */}
      {screen === 'director-reports' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight font-sans">Génération de Rapports ERP</h2>
            <p className="text-gray-500 text-sm mt-1">Générez et téléchargez des rapports précis sous divers formats légaux (PDF, Excel, CSV).</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Rapport Complet des Ventes', desc: 'Volume global, taxes collectées, répartition mensuelle.', icon: 'payments' },
              { title: 'Rapport d\'État des Stocks', desc: 'Valorisation du stock physique, seuils de sécurité.', icon: 'inventory_2' },
              { title: 'Rapport de Mouvements d\'Arrivées', desc: 'Historique des approvisionnements fournisseurs.', icon: 'local_shipping' },
              { title: 'Rapport des Audits d\'Inventaires', desc: 'Écarts physiques vs logiques, anomalies validées.', icon: 'assignment_turned_in' },
              { title: 'Rapport d\'Activités des Utilisateurs', desc: 'Suivi d\'audit d\'habilitation de l\'équipe active.', icon: 'group' },
              { title: 'Rapport de Performance Financière', desc: 'Chiffre d\'affaires par caisse, vitesse de rotation.', icon: 'analytics' },
            ].map((rep, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between h-56 hover:border-indigo-300 hover:shadow-md transition-all">
                <div className="space-y-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
                    <span className="material-symbols-outlined text-[20px]">{rep.icon}</span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm leading-tight">{rep.title}</h4>
                  <p className="text-xs text-gray-400 leading-normal">{rep.desc}</p>
                </div>
                <div className="flex gap-2 pt-4 border-t border-gray-50">
                  <button onClick={() => triggerExport(rep.title, 'PDF')} className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer">PDF</button>
                  <button onClick={() => triggerExport(rep.title, 'EXCEL')} className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer">Excel</button>
                  <button onClick={() => triggerExport(rep.title, 'CSV')} className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-bold rounded-lg transition-all cursor-pointer">CSV</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------ PARAMÈTRES (SCREEN: director-settings) ------------------ */}
      {screen === 'director-settings' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight font-sans">Configuration de la Succursale</h2>
            <p className="text-gray-500 text-sm mt-1">Configurez les variables institutionnelles de votre entreprise pour l'ERP.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xs max-w-2xl">
            <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nom de l'Entreprise</label>
                  <input 
                    type="text" 
                    value={companySettings.name}
                    onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Devise Monétaire</label>
                  <input 
                    type="text" 
                    value={companySettings.currency}
                    onChange={(e) => setCompanySettings({ ...companySettings, currency: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Adresse Institutionnelle</label>
                  <input 
                    type="text" 
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Numéro de Téléphone</label>
                  <input 
                    type="text" 
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fuseau Horaire</label>
                  <input 
                    type="text" 
                    value={companySettings.timezone}
                    onChange={(e) => setCompanySettings({ ...companySettings, timezone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Seuil de Stock Faible</label>
                  <input 
                    type="number" 
                    value={companySettings.lowStockThreshold}
                    onChange={(e) => setCompanySettings({ ...companySettings, lowStockThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer shadow-xs"
              >
                Sauvegarder les Paramètres
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ------------------ PROFIL DIRECTEUR (SCREEN: director-profile) ------------------ */}
      {screen === 'director-profile' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight font-sans">Mon Profil Administrateur</h2>
            <p className="text-gray-500 text-sm mt-1">Modifiez vos informations personnelles d'accès à la plateforme SmartStock.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xs max-w-2xl">
            <form onSubmit={handleSaveProfile} className="space-y-6 text-xs">
              <div className="flex items-center gap-4 border-b border-gray-50 pb-6 mb-6">
                <img src={profileForm.avatar} className="w-16 h-16 rounded-full border border-gray-200 object-cover" alt="" />
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">{currentUser.name}</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">E-mail institutionnel (non modifiable) : {currentUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Prénom</label>
                  <input 
                    type="text" 
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nom</label>
                  <input 
                    type="text" 
                    value={profileForm.lastname}
                    onChange={(e) => setProfileForm({ ...profileForm, lastname: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Numéro de Téléphone</label>
                  <input 
                    type="text" 
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mot de passe de Connexion</label>
                  <input 
                    type="text" 
                    value={profileForm.password}
                    onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600 font-mono"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer shadow-xs"
              >
                Mettre à jour mon profil
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ------------------ USER PROVISION / EDIT MODAL ------------------ */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-gray-100">
            <button 
              onClick={() => setShowUserModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-base font-bold text-gray-900 mb-4 font-sans">
              {editingUser ? "Modifier le Compte Équipe" : "Habiliter un Nouveau Collaborateur"}
            </h3>
            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nom Complet</label>
                <input 
                  type="text" 
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="ex. Robert Diouf"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Adresse E-mail</label>
                <input 
                  type="email" 
                  required
                  disabled={!!editingUser}
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="ex. r.diouf@entreprise.com"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 disabled:opacity-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mot de passe</label>
                <input 
                  type="text" 
                  required
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="Mot de passe"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 font-mono"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rôle Équipe</label>
                  <select 
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none"
                  >
                    <option value="Gestionnaire de stock">Gestionnaire de stock</option>
                    <option value="Caissier">Caissier</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Statut Initial</label>
                  <select 
                    value={userForm.status}
                    onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none"
                  >
                    <option value="Actif">Actif</option>
                    <option value="Suspendu">Suspendu</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Enregistrer le collaborateur
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
