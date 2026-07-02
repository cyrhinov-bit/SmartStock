import React, { useState, useMemo } from 'react';
import { EnrichedProduct, WarehouseCategory, WarehouseSupplier, StockMovement } from './types';

interface ProductsTabProps {
  products: EnrichedProduct[];
  setProducts: React.Dispatch<React.SetStateAction<any[]>>;
  categories: WarehouseCategory[];
  suppliers: WarehouseSupplier[];
  movements: StockMovement[];
  onAddMovement: (newMov: StockMovement) => void;
  currentUser: any;
  globallySelectedSku?: string | null;
  onClearGloballySelectedSku?: () => void;
  activeSubTab?: string;
  setActiveSubTab?: (subTab: string) => void;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  setProducts,
  categories,
  suppliers,
  movements,
  onAddMovement,
  currentUser,
  globallySelectedSku,
  onClearGloballySelectedSku,
  activeSubTab,
  setActiveSubTab,
}) => {
  // Filters state
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('Tous');
  const [selectedSup, setSelectedSup] = useState('Tous');
  const [stockFilter, setStockFilter] = useState('Tous'); // Tous, Normal, Faible, Rupture
  const [statusFilter, setStatusFilter] = useState('Tous'); // Tous, Actif, Désactivé
  const [sortBy, setSortBy] = useState('name-asc');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProd, setSelectedProd] = useState<EnrichedProduct | null>(null);

  // Reactive Effect for Global Search SKU view
  React.useEffect(() => {
    if (globallySelectedSku) {
      const prod = products.find((p) => p.sku === globallySelectedSku);
      if (prod) {
        setSelectedProd(prod);
        setShowViewModal(true);
      }
      if (onClearGloballySelectedSku) {
        onClearGloballySelectedSku();
      }
    }
  }, [globallySelectedSku, products, onClearGloballySelectedSku]);

  // Reactive Effect for Sidebar Add Product subtab action
  React.useEffect(() => {
    if (activeSubTab === 'add') {
      setShowAddModal(true);
      if (setActiveSubTab) {
        setActiveSubTab('list');
      }
    }
  }, [activeSubTab, setActiveSubTab]);

  // New Product Form State (Multi-section)
  const [formStep, setFormStep] = useState(1);
  const [newBarcode, setNewBarcode] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Électronique');
  const [newSubCat, setNewSubCat] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newSupplier, setNewSupplier] = useState('Global Tech Dist.');
  const [newPurchasePrice, setNewPurchasePrice] = useState<number>(0);
  const [newSalePrice, setNewSalePrice] = useState<number>(0);
  const [newInitialStock, setNewInitialStock] = useState<number>(0);
  const [newMinStock, setNewMinStock] = useState<number>(10);
  const [newMaxStock, setNewMaxStock] = useState<number>(500);
  const [newImage, setNewImage] = useState('');
  const [formError, setFormError] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Real-time validations
  const validateForm = () => {
    if (!newName.trim()) return 'Le nom du produit est obligatoire.';
    if (!newSku.trim()) return 'La référence interne (SKU) est obligatoire.';
    if (products.some((p) => p.sku.toLowerCase() === newSku.toLowerCase() && p.id !== selectedProd?.id)) {
      return 'Cette référence SKU existe déjà dans la base de données.';
    }
    if (newPurchasePrice <= 0) return "Le prix d'achat doit être supérieur à 0.";
    if (newSalePrice < newPurchasePrice) return "Le prix de vente ne peut pas être inférieur au prix d'achat.";
    if (newInitialStock < 0) return 'La quantité de stock initiale ne peut pas être négative.';
    if (newMinStock < 0) return 'Le stock minimum doit être positif.';
    if (newMaxStock <= newMinStock) return 'Le stock maximum doit être supérieur au stock minimum.';
    return '';
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    const brandName = newBrand.trim() || 'SmartStock';
    const subCatName = newSubCat.trim() || 'Général';
    const barcodeStr = newBarcode.trim() || `370001${Math.floor(100000 + Math.random() * 900000)}`;
    const imagePath = newImage.trim() || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLkSkUr_zxl_INx_ctYzTQ86IOoC4k372lBmItxn-cXL-yya-eJctkTqKTeFsVDfiuLg_9fGK_YFtPsJImepDEvkN44sLzAXWLemdnv_-iuPIMscd01UfaBiCt7_tAaVjAI-ye1JnyOnGnW0ftDC3VZ1JjE3xCNU0nUi5DMIfhH0Y7ZY93J-C-PD0QH6xJ3--iPp1QVqu_frlfy2pOKzjweDJqSueXhp6pYJIcR_zFil6k5_S5nSzz2W3qXte7UVxeyZPZyKSLnOM';

    const newProduct = {
      id: `PROD-${Date.now().toString().slice(-4)}`,
      sku: newSku.toUpperCase(),
      name: newName,
      category: newCategory as any,
      price: newSalePrice,
      stock: newInitialStock,
      image: imagePath,
      description: newDesc,
      brand: brandName,
      subCategory: subCatName,
      purchasePrice: newPurchasePrice,
      minStock: newMinStock,
      maxStock: newMaxStock,
      barcode: barcodeStr,
      isActive: true,
      supplierName: newSupplier,
    };

    setProducts((prev) => [newProduct, ...prev]);

    // Automatically create a movement log for initial stock creation
    if (newInitialStock > 0) {
      onAddMovement({
        id: `MOV-${Date.now().toString().slice(-3)}`,
        date: new Date().toISOString().split('T')[0],
        hour: new Date().toLocaleTimeString('fr-FR', { hour12: false }).slice(0, 5),
        productSku: newSku.toUpperCase(),
        productName: newName,
        type: 'Entrée',
        quantity: newInitialStock,
        user: currentUser.name,
        observation: 'Quantité de stock initiale lors de la création de la fiche produit',
      });
    }

    // Reset Form
    resetForm();
    setShowAddModal(false);
  };

  const handleEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProd) return;
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    const updated = {
      ...selectedProd,
      sku: newSku.toUpperCase(),
      name: newName,
      category: newCategory as any,
      price: newSalePrice,
      description: newDesc,
      brand: newBrand || 'SmartStock',
      subCategory: newSubCat || 'Général',
      purchasePrice: newPurchasePrice,
      minStock: newMinStock,
      maxStock: newMaxStock,
      barcode: newBarcode || selectedProd.barcode,
      image: newImage || selectedProd.image,
      supplierName: newSupplier,
    };

    setProducts((prev) => prev.map((p) => (p.id === selectedProd.id ? updated : p)));
    setShowEditModal(false);
    resetForm();
  };

  const toggleProductActive = (prod: EnrichedProduct) => {
    const isNowActive = !(prod.isActive !== false);
    
    // Check if there are movements involving this product
    const hasHistory = movements.some((m) => m.productSku.toLowerCase() === prod.sku.toLowerCase());
    
    if (!isNowActive && hasHistory) {
      if (!confirm(`Note : Ce produit possède un historique de mouvements. Il ne sera pas supprimé mais uniquement désactivé dans tout le système ERP. Souhaitez-vous le désactiver ?`)) {
        return;
      }
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === prod.id ? { ...p, isActive: isNowActive } : p))
    );
  };

  const resetForm = () => {
    setFormStep(1);
    setNewBarcode('');
    setNewSku('');
    setNewName('');
    setNewDesc('');
    setNewCategory('Électronique');
    setNewSubCat('');
    setNewBrand('');
    setNewSupplier('Global Tech Dist.');
    setNewPurchasePrice(0);
    setNewSalePrice(0);
    setNewInitialStock(0);
    setNewMinStock(10);
    setNewMaxStock(500);
    setNewImage('');
    setFormError('');
    setSelectedProd(null);
  };

  const openEditModal = (prod: EnrichedProduct) => {
    setSelectedProd(prod);
    setNewBarcode(prod.barcode || '');
    setNewSku(prod.sku);
    setNewName(prod.name);
    setNewDesc(prod.description || '');
    setNewCategory(prod.category);
    setNewSubCat(prod.subCategory || '');
    setNewBrand(prod.brand || '');
    setNewSupplier(prod.supplierName || 'Global Tech Dist.');
    setNewPurchasePrice(prod.purchasePrice || Math.round(prod.price * 0.65));
    setNewSalePrice(prod.price);
    setNewInitialStock(prod.stock);
    setNewMinStock(prod.minStock || 10);
    setNewMaxStock(prod.maxStock || 500);
    setNewImage(prod.image);
    setShowEditModal(true);
  };

  // Filter and Sort Logic
  const filteredProducts = useMemo(() => {
    return products
      .map((p) => ({
        ...p,
        minStock: p.minStock || 15,
        barcode: p.barcode || `370001200${p.sku.replace(/\D/g, '').padEnd(3, '0')}`,
        isActive: p.isActive !== false,
        supplierName: p.supplierName || 'Global Tech Dist.',
      }))
      .filter((p) => {
        // Search filter
        const matchSearch =
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase()) ||
          p.barcode.toLowerCase().includes(search.toLowerCase());

        // Category filter
        const matchCat = selectedCat === 'Tous' || p.category === selectedCat;

        // Supplier filter
        const matchSup = selectedSup === 'Tous' || p.supplierName === selectedSup;

        // Stock filter
        let matchStock = true;
        if (stockFilter === 'Rupture') matchStock = p.stock === 0;
        else if (stockFilter === 'Faible') matchStock = p.stock > 0 && p.stock < p.minStock;
        else if (stockFilter === 'Normal') matchStock = p.stock >= p.minStock;

        // Active status filter
        let matchStatus = true;
        if (statusFilter === 'Actif') matchStatus = p.isActive === true;
        else if (statusFilter === 'Désactivé') matchStatus = p.isActive === false;

        return matchSearch && matchCat && matchSup && matchStock && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
        if (sortBy === 'sku-asc') return a.sku.localeCompare(b.sku);
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'stock-desc') return b.stock - a.stock;
        if (sortBy === 'stock-asc') return a.stock - b.stock;
        return 0;
      });
  }, [products, search, selectedCat, selectedSup, stockFilter, statusFilter, sortBy]);

  // Paginated data
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const productMovements = useMemo(() => {
    if (!selectedProd) return [];
    return movements.filter(
      (m) => m.productSku.toLowerCase() === selectedProd.sku.toLowerCase()
    );
  }, [movements, selectedProd]);

  // --- Calculate Brands Summary ---
  const uniqueBrands = useMemo(() => {
    const brandsMap: { [key: string]: { name: string; count: number; stock: number; value: number } } = {};
    products.forEach((p) => {
      const brandName = p.brand || (p.name.toLowerCase().includes('logitech') ? 'Logitech' : p.name.toLowerCase().includes('hp') ? 'HP' : p.name.toLowerCase().includes('samsung') ? 'Samsung' : 'SmartStock');
      const stock = p.stock || 0;
      const value = stock * p.price;
      if (!brandsMap[brandName]) {
        brandsMap[brandName] = { name: brandName, count: 0, stock: 0, value: 0 };
      }
      brandsMap[brandName].count += 1;
      brandsMap[brandName].stock += stock;
      brandsMap[brandName].value += value;
    });
    return Object.values(brandsMap).sort((a, b) => b.value - a.value);
  }, [products]);

  // --- Calculate Units Summary ---
  const uniqueUnits = useMemo(() => {
    const unitsMap: { [key: string]: { name: string; count: number; stock: number; value: number } } = {
      "Pièce (U)": { name: "Pièce (U)", count: 0, stock: 0, value: 0 },
      "Carton (Ctn)": { name: "Carton (Ctn)", count: 0, stock: 0, value: 0 },
      "Sachet (Sct)": { name: "Sachet (Sct)", count: 0, stock: 0, value: 0 },
      "Boîte (Bte)": { name: "Boîte (Bte)", count: 0, stock: 0, value: 0 },
    };

    products.forEach((p) => {
      let unit = "Pièce (U)";
      if (p.category === 'Alimentation' || p.category === 'Boissons') unit = "Carton (Ctn)";
      else if (p.category === 'Entretien' || p.category === 'Beauté') unit = "Sachet (Sct)";
      else if (p.category === 'Bureau' || p.category === 'Fournitures') unit = "Boîte (Bte)";

      const stock = p.stock || 0;
      const value = stock * p.price;
      
      if (!unitsMap[unit]) {
        unitsMap[unit] = { name: unit, count: 0, stock: 0, value: 0 };
      }
      unitsMap[unit].count += 1;
      unitsMap[unit].stock += stock;
      unitsMap[unit].value += value;
    });
    return Object.values(unitsMap).filter(u => u.count > 0);
  }, [products]);

  // --- SUBTAB: BRANDS VIEW ---
  if (activeSubTab === 'brands') {
    const totalBrands = uniqueBrands.length;
    const topBrand = uniqueBrands[0]?.name || 'N/A';
    const averageItemsPerBrand = totalBrands > 0 ? Math.round(products.length / totalBrands) : 0;

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-gray-900">Marques Référencées</h3>
            <p className="text-xs text-gray-500">Répartition, volume d'unités et valorisation financière par marque d'article</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-[#c7c4d8]/40 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-[#3525cd] rounded-xl">
              <span className="material-symbols-outlined text-2xl">sell</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Marques actives</p>
              <h4 className="text-2xl font-black text-gray-900 mt-0.5">{totalBrands}</h4>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#c7c4d8]/40 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <span className="material-symbols-outlined text-2xl">workspace_premium</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Marque leader (Valeur)</p>
              <h4 className="text-xl font-black text-gray-900 mt-0.5">{topBrand}</h4>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#c7c4d8]/40 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
              <span className="material-symbols-outlined text-2xl">widgets</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Moyenne articles / marque</p>
              <h4 className="text-2xl font-black text-gray-900 mt-0.5">{averageItemsPerBrand}</h4>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#c7c4d8]/40 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h4 className="font-bold text-sm text-gray-900">Analyse de Rentabilité par Marque</h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-wider bg-gray-50/30">
                  <th className="py-3.5 px-6">Nom de la marque</th>
                  <th className="py-3.5 px-6 text-center">Fiches articles</th>
                  <th className="py-3.5 px-6 text-center">Unités en stock</th>
                  <th className="py-3.5 px-6 text-right">Valorisation revente (F)</th>
                  <th className="py-3.5 px-6 text-center">Densité stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {uniqueBrands.map((brand, i) => {
                  const maxVal = uniqueBrands[0]?.value || 1;
                  const ratio = Math.min(100, Math.max(8, (brand.value / maxVal) * 100));
                  return (
                    <tr key={brand.name} className="hover:bg-gray-50/50 transition-all">
                      <td className="py-4 px-6 font-bold text-gray-900">{brand.name}</td>
                      <td className="py-4 px-6 text-center font-semibold text-gray-700">{brand.count} refs</td>
                      <td className="py-4 px-6 text-center font-extrabold text-gray-900">{brand.stock.toLocaleString('fr-FR')} u</td>
                      <td className="py-4 px-6 text-right font-black text-gray-900">{brand.value.toLocaleString('fr-FR')} F</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3 justify-center">
                          <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#3525cd] rounded-full"
                              style={{ width: `${ratio}%`, opacity: 1 - i * 0.1 }}
                            ></div>
                          </div>
                          <span className="text-[10px] text-gray-400 font-bold">{Math.round(ratio)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // --- SUBTAB: UNITS OF MEASURE VIEW ---
  if (activeSubTab === 'units') {
    const totalUnitTypes = uniqueUnits.length;
    const topUnit = uniqueUnits.reduce((prev, current) => (prev.count > current.count ? prev : current), uniqueUnits[0])?.name || 'N/A';

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-gray-900">Unités de Mesure (UoM)</h3>
            <p className="text-xs text-gray-500">Typologies d'emballages, unités physiques et équivalences de stockage</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-[#c7c4d8]/40 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-[#3525cd] rounded-xl">
              <span className="material-symbols-outlined text-2xl">grid_view</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Typologies d'Unités</p>
              <h4 className="text-2xl font-black text-gray-900 mt-0.5">{totalUnitTypes} configurations</h4>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#c7c4d8]/40 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <span className="material-symbols-outlined text-2xl">inventory</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Unité prédominante</p>
              <h4 className="text-xl font-black text-gray-900 mt-0.5">{topUnit}</h4>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {uniqueUnits.map((u) => (
            <div key={u.name} className="bg-white p-6 rounded-3xl border border-[#c7c4d8]/40 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-xs font-black text-[#3525cd] bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                  {u.name}
                </span>
                <span className="material-symbols-outlined text-gray-400">package_2</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-2xl font-black text-gray-900">{u.stock.toLocaleString('fr-FR')}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Unités en stock</p>
              </div>
              <div className="pt-3 border-t border-gray-50 flex justify-between text-xs text-gray-500">
                <span>{u.count} fiches articles</span>
                <span className="font-extrabold text-gray-800">{u.value.toLocaleString('fr-FR')} F</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900">Catalogue des Produits</h3>
          <p className="text-xs text-gray-500">Gérez le référentiel des fiches articles, classifications et fiches tarifs</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-5 py-2.5 bg-[#3525cd] text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-[#4f46e5] transition-all flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Ajouter un Produit
        </button>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#c7c4d8]/40 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Search bar */}
          <div className="md:col-span-4 relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Rechercher par nom, SKU ou code-barres..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
            />
          </div>

          {/* Category filter */}
          <div className="md:col-span-2">
            <select
              value={selectedCat}
              onChange={(e) => {
                setSelectedCat(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#3525cd] bg-white font-semibold"
            >
              <option value="Tous">Toutes Catégories</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier filter */}
          <div className="md:col-span-2">
            <select
              value={selectedSup}
              onChange={(e) => {
                setSelectedSup(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#3525cd] bg-white font-semibold"
            >
              <option value="Tous">Tous Fournisseurs</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock level filter */}
          <div className="md:col-span-2">
            <select
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#3525cd] bg-white font-semibold"
            >
              <option value="Tous">État de Stock</option>
              <option value="Normal">Stock Normal</option>
              <option value="Faible">Stock Faible</option>
              <option value="Rupture">Rupture totale</option>
            </select>
          </div>

          {/* Sort By selector */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#3525cd] bg-white font-semibold"
            >
              <option value="name-asc">Trier par Nom (A-Z)</option>
              <option value="name-desc">Trier par Nom (Z-A)</option>
              <option value="sku-asc">Réf SKU</option>
              <option value="price-desc">Prix (Décroissant)</option>
              <option value="price-asc">Prix (Croissant)</option>
              <option value="stock-desc">Quantité (Décroissant)</option>
              <option value="stock-asc">Quantité (Croissant)</option>
            </select>
          </div>
        </div>

        {/* secondary filters status */}
        <div className="flex gap-4 items-center pt-2 border-t border-gray-100">
          <span className="text-[10px] uppercase font-bold text-gray-400">Statut de fiche :</span>
          <div className="flex gap-2">
            {['Tous', 'Actif', 'Désactivé'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  statusFilter === st ? 'bg-indigo-50 text-[#3525cd]' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products list table */}
      <div className="bg-white rounded-2xl border border-[#c7c4d8]/40 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[#464555] text-[10px] uppercase tracking-wider font-bold">
              <tr className="border-b border-[#c7c4d8]/30">
                <th className="px-6 py-4">Visuel / Réf / Code-barres</th>
                <th className="px-6 py-4">Nom de l'Article</th>
                <th className="px-6 py-4">Catégorie / Marque</th>
                <th className="px-6 py-4">Fournisseur Principal</th>
                <th className="px-6 py-4 text-right">Tarif Achat / Vente</th>
                <th className="px-6 py-4 text-center">Qté en Stock</th>
                <th className="px-6 py-4 text-center">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((p) => {
                  const isLow = p.stock > 0 && p.stock < (p.minStock || 15);
                  const isOut = p.stock === 0;

                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-gray-100 hover:bg-indigo-50/10 transition-all ${
                        !p.isActive ? 'opacity-60 bg-gray-50/40' : ''
                      }`}
                    >
                      {/* Photo / SKU */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-10 h-10 object-cover rounded-lg border border-gray-200 shadow-sm shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="font-mono text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md block w-fit">
                              {p.sku}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                              {p.barcode}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900 block max-w-[200px] truncate">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                          {p.description || "Aucune description de l'article."}
                        </span>
                      </td>

                      {/* Classification */}
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-800 block">{p.category}</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          Marque : {p.brand || 'SmartStock'}
                        </span>
                      </td>

                      {/* Supplier */}
                      <td className="px-6 py-4">
                        <span className="text-gray-700 font-semibold">{p.supplierName}</span>
                      </td>

                      {/* Prices */}
                      <td className="px-6 py-4 text-right">
                        <div className="font-semibold text-gray-500 text-[10px]">
                          PA: {(p.purchasePrice || Math.round(p.price * 0.65)).toLocaleString('fr-FR')} F
                        </div>
                        <div className="font-bold text-gray-900 text-xs mt-0.5">
                          PV: {p.price.toLocaleString('fr-FR')} F
                        </div>
                      </td>

                      {/* Stock Level */}
                      <td className="px-6 py-4 text-center">
                        <div className={`font-extrabold text-sm ${isOut ? 'text-[#ba1a1a]' : isLow ? 'text-amber-600' : 'text-gray-900'}`}>
                          {p.stock}
                        </div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block">
                          Min: {p.minStock || 15}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        {isOut ? (
                          <span className="px-2 py-0.5 bg-red-50 text-[#ba1a1a] text-[9px] font-extrabold rounded-full uppercase tracking-wider">
                            Rupture
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-extrabold rounded-full uppercase tracking-wider">
                            Faible
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-extrabold rounded-full uppercase tracking-wider">
                            Normal
                          </span>
                        )}
                        {!p.isActive && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-extrabold rounded-full uppercase tracking-wider block mt-1 w-fit mx-auto">
                            Désactivé
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedProd(p);
                              setShowViewModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-[#3525cd] hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Consulter"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProd(p);
                              setShowHistoryModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="Mouvements"
                          >
                            <span className="material-symbols-outlined text-[18px]">history</span>
                          </button>
                          <button
                            onClick={() => toggleProductActive(p)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              p.isActive ? 'text-emerald-500 hover:text-[#ba1a1a] hover:bg-red-50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={p.isActive ? 'Désactiver' : 'Réactiver'}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {p.isActive ? 'toggle_on' : 'toggle_off'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-xs text-gray-400">
                    Aucun produit trouvé correspondant aux critères de filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-[#c7c4d8]/20 flex justify-between items-center text-xs">
            <span className="text-gray-500">
              Page <strong>{currentPage}</strong> sur <strong>{totalPages}</strong> ({filteredProducts.length} articles)
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-bold hover:bg-gray-100 disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-bold hover:bg-gray-100 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal (Multi-step form) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 shadow-2xl relative border border-gray-100 animate-in zoom-in-95 duration-150 my-8">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-lg font-extrabold text-gray-900 mb-2">Ajouter un Nouveau Produit</h3>
            <p className="text-xs text-gray-500 mb-6">Fiche article multisection conforme aux normes ERP de SmartStock</p>

            {/* Stepper indicator */}
            <div className="flex justify-between items-center mb-6 px-2">
              {[
                { step: 1, label: 'Général' },
                { step: 2, label: 'Détails' },
                { step: 3, label: 'Financier' },
                { step: 4, label: 'Stock & Médias' },
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-1.5">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      formStep === s.step
                        ? 'bg-[#3525cd] text-white ring-4 ring-indigo-100'
                        : formStep > s.step
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {formStep > s.step ? <span className="material-symbols-outlined text-[14px]">check</span> : s.step}
                  </span>
                  <span className={`text-[10px] font-bold ${formStep === s.step ? 'text-[#3525cd]' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-[#ba1a1a] text-xs font-bold rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4">
              {/* Step 1: Informations Générales */}
              {formStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-600 uppercase">Nom du Produit *</label>
                    <input
                      type="text"
                      required
                      placeholder="ex. Hub Centralisé Multi-Connecté"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase">Code SKU (Réf Interne) *</label>
                      <input
                        type="text"
                        required
                        placeholder="ex. SKU-902"
                        value={newSku}
                        onChange={(e) => setNewSku(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs uppercase focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase">Code-barres (EAN13)</label>
                      <input
                        type="text"
                        placeholder="ex. 370001200902"
                        value={newBarcode}
                        onChange={(e) => setNewBarcode(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-600 uppercase">Description</label>
                    <textarea
                      placeholder="Description détaillée de l'article pour les bons logistiques..."
                      rows={3}
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                    ></textarea>
                  </div>
                </div>
              )}

              {/* Step 2: Classification */}
              {formStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase">Catégorie ERP</label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                      >
                        {categories.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase">Sous-catégorie</label>
                      <input
                        type="text"
                        placeholder="ex. Périphériques IoT"
                        value={newSubCat}
                        onChange={(e) => setNewSubCat(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase">Marque de l'Article</label>
                      <input
                        type="text"
                        placeholder="ex. NexusTech"
                        value={newBrand}
                        onChange={(e) => setNewBrand(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase">Fournisseur Attitré</label>
                      <select
                        value={newSupplier}
                        onChange={(e) => setNewSupplier(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                      >
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Financier */}
              {formStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase">Prix d'Achat (Unitaire FCFA) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="ex. 45000"
                        value={newPurchasePrice || ''}
                        onChange={(e) => {
                          setNewPurchasePrice(Number(e.target.value));
                          setFormError('');
                        }}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase">Prix de Vente (Unitaire FCFA) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="ex. 75000"
                        value={newSalePrice || ''}
                        onChange={(e) => {
                          setNewSalePrice(Number(e.target.value));
                          setFormError('');
                        }}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                      />
                    </div>
                  </div>
                  <div className="p-3.5 bg-gray-50 rounded-xl">
                    <h5 className="text-[11px] font-bold text-gray-700 uppercase mb-1">Marge Estimée :</h5>
                    <div className="flex justify-between text-xs">
                      <span>Différence Brute :</span>
                      <span className="font-bold text-emerald-600">
                        {Math.max(0, newSalePrice - newPurchasePrice).toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span>Taux de Marge :</span>
                      <span className="font-bold text-emerald-600">
                        {newSalePrice > 0 ? Math.round(((newSalePrice - newPurchasePrice) / newSalePrice) * 100) : 0} %
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Stock & Médias */}
              {formStep === 4 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase">Quantité Initiale *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="ex. 100"
                        value={newInitialStock}
                        onChange={(e) => setNewInitialStock(Number(e.target.value))}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase">Stock Min (Alerte) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="ex. 10"
                        value={newMinStock}
                        onChange={(e) => setNewMinStock(Number(e.target.value))}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase">Stock Maximum *</label>
                      <input
                        type="number"
                        required
                        min="10"
                        placeholder="ex. 1000"
                        value={newMaxStock}
                        onChange={(e) => setNewMaxStock(Number(e.target.value))}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-600 uppercase">Photo du Produit (URL)</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>
                </div>
              )}

              {/* Navigation button panel */}
              <div className="flex justify-between pt-4 border-t border-gray-100">
                <button
                  type="button"
                  disabled={formStep === 1}
                  onClick={() => {
                    setFormStep((s) => s - 1);
                    setFormError('');
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-gray-200"
                >
                  Précédent
                </button>

                {formStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (formStep === 1 && (!newName || !newSku)) {
                        setFormError('Le nom et la référence interne (SKU) sont requis.');
                        return;
                      }
                      if (formStep === 3 && (newPurchasePrice <= 0 || newSalePrice <= 0)) {
                        setFormError("Les prix d'achat et de vente doivent être supérieurs à 0.");
                        return;
                      }
                      setFormStep((s) => s + 1);
                      setFormError('');
                    }}
                    className="px-4 py-2 bg-[#3525cd] text-white rounded-xl text-xs font-bold hover:bg-[#4f46e5]"
                  >
                    Suivant
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#3525cd] text-white rounded-xl text-xs font-bold hover:bg-[#4f46e5]"
                  >
                    Valider et Enregistrer
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProd && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 shadow-2xl relative border border-gray-100 animate-in zoom-in-95 duration-150 my-8">
            <button
              onClick={() => {
                setShowEditModal(false);
                resetForm();
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-lg font-extrabold text-gray-900 mb-2">Modifier l'Article</h3>
            <p className="text-xs text-gray-500 mb-6">Mise à jour des informations de {selectedProd.name}</p>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-[#ba1a1a] text-xs font-bold rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {formError}
              </div>
            )}

            <form onSubmit={handleEditProduct} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-600 uppercase">Nom du Produit *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Réf Interne SKU *</label>
                  <input
                    type="text"
                    required
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs uppercase focus:outline-none focus:border-[#3525cd]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Code-barres</label>
                  <input
                    type="text"
                    value={newBarcode}
                    onChange={(e) => setNewBarcode(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Catégorie</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-[#3525cd]"
                  >
                    {categories.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Sous-catégorie</label>
                  <input
                    type="text"
                    value={newSubCat}
                    onChange={(e) => setNewSubCat(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Marque</label>
                  <input
                    type="text"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Fournisseur Principal</label>
                  <select
                    value={newSupplier}
                    onChange={(e) => setNewSupplier(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-[#3525cd]"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Prix d'Achat (FCFA) *</label>
                  <input
                    type="number"
                    required
                    value={newPurchasePrice}
                    onChange={(e) => setNewPurchasePrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Prix de Vente (FCFA) *</label>
                  <input
                    type="number"
                    required
                    value={newSalePrice}
                    onChange={(e) => setNewSalePrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Stock Minimum (Alerte) *</label>
                  <input
                    type="number"
                    required
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Stock Maximum *</label>
                  <input
                    type="number"
                    required
                    value={newMaxStock}
                    onChange={(e) => setNewMaxStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-600 uppercase">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#3525cd] text-white rounded-xl text-xs font-bold hover:bg-[#4f46e5]"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Product Details Modal */}
      {showViewModal && selectedProd && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative border border-gray-100 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setShowViewModal(false);
                setSelectedProd(null);
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="text-center pb-5 border-b border-gray-100">
              <img
                src={selectedProd.image}
                alt={selectedProd.name}
                className="w-24 h-24 object-cover rounded-2xl mx-auto border-2 border-indigo-100 shadow-md"
                referrerPolicy="no-referrer"
              />
              <span className="font-mono text-[10px] font-extrabold text-[#3525cd] bg-indigo-50 px-2.5 py-1 rounded-full inline-block mt-3">
                {selectedProd.sku}
              </span>
              <h4 className="text-base font-bold text-gray-900 mt-2">{selectedProd.name}</h4>
              <p className="text-xs text-gray-400 font-semibold mt-1">{selectedProd.category} • {selectedProd.brand || 'SmartStock'}</p>
            </div>

            <div className="py-5 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Code-barres :</span>
                <span className="font-mono font-bold text-gray-900">{selectedProd.barcode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sous-catégorie :</span>
                <span className="font-bold text-gray-900">{selectedProd.subCategory || 'Non classé'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fournisseur :</span>
                <span className="font-bold text-gray-900">{selectedProd.supplierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Prix de revient (Achat) :</span>
                <span className="font-bold text-gray-900">
                  {(selectedProd.purchasePrice || Math.round(selectedProd.price * 0.65)).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tarif de vente public :</span>
                <span className="font-bold text-[#3525cd]">{selectedProd.price.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Marge Brute :</span>
                <span className="font-bold text-emerald-600">
                  {(selectedProd.price - (selectedProd.purchasePrice || Math.round(selectedProd.price * 0.65))).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Seuil de stock bas :</span>
                <span className="font-bold text-amber-600">{selectedProd.minStock || 15} unités</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-3">
                <span className="text-gray-500">Description :</span>
                <p className="text-[11px] text-gray-600 text-right max-w-[200px] leading-snug">
                  {selectedProd.description || 'Pas de description.'}
                </p>
              </div>
            </div>

            {/* Barcode representation */}
            <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center">
              <div className="flex gap-0.5 h-10 items-stretch">
                {[1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 4, 1, 2, 1, 3].map((w, i) => (
                  <div key={i} className={`bg-gray-900 ${i % 2 === 0 ? 'opacity-100' : 'opacity-0'}`} style={{ width: `${w * 1.5}px` }}></div>
                ))}
              </div>
              <span className="font-mono text-[9px] text-gray-500 mt-2 font-extrabold uppercase tracking-widest">{selectedProd.barcode}</span>
            </div>
          </div>
        </div>
      )}

      {/* History Modal for specific Product */}
      {showHistoryModal && selectedProd && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl relative border border-gray-100 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setShowHistoryModal(false);
                setSelectedProd(null);
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h4 className="text-base font-extrabold text-gray-900 mb-1">Historique des Mouvements</h4>
            <p className="text-xs text-gray-500 mb-6">Traces d'audit pour : <span className="font-bold text-gray-800">{selectedProd.name}</span></p>

            <div className="max-h-72 overflow-y-auto space-y-3 pr-2">
              {productMovements.length > 0 ? (
                productMovements.map((mov) => (
                  <div key={mov.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className={mov.type === 'Entrée' ? 'text-emerald-600' : mov.type === 'Sortie' ? 'text-sky-500' : 'text-amber-600'}>
                        {mov.type} {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                      </span>
                      <span className="text-gray-400 text-[10px]">{mov.date} • {mov.hour}</span>
                    </div>
                    <p className="text-gray-600 leading-snug">{mov.observation}</p>
                    <div className="text-[10px] text-gray-400 font-medium">Validateur : {mov.user}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-gray-400">
                  Aucun mouvement de stock enregistré pour cet article.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
