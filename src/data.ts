/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Director, GovernanceLog, Product, Transaction, StockArrival, User } from './types';

// Image de connexion et profils de l'application
export const LOGIN_BG_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdyr1abw6RtNQI2HtN1lu893gBGhm3IV8oLn_rfsLPIRMTd6DxPhyy01wH_hP34ivPu8ANo4mrkgBDvx9lSq9tG_bHH-vT3uOP7Mh08O5x7s-vplvHDofZ3lvXafq0GrBRRFWNS4xzeK6kFuRtqraWkKAw98EtXO8s7exOrDUtLGOP0PUFkh2ero4JayDhzn4POKfAwYIlZplPv7Ebi8B61PK8jnUjFvgs_-Na3FJtSKgJD77q3buP5HavRmMCmlCUCNeKEVVoZBc';

export const PROFILES: Record<string, User> = {
  governor: {
    name: 'Admin Système',
    role: 'Gouverneur du Système',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOdppZHu4vnd4ojMQyqe41O9EEITkldMUdMiFQ0r3goyuTa8poFopFgMTunWMrpvMuR1ZAdEcHE4VjQAqQ475CHkMlk0TW_M__zkJg6xgC7XUg2UzMheh7IqgCdSG_UTn4BhcPEapm0iU4x3Gvy1SqCl7XOwX0fUHCQpFWwL_4Sul8cdB9fUcFZ9yqHBLyqLBmEgI5APy7omq30bNPApKZHXur_9lAlCPZXCMwXzJuoZf6aPOjeRxbUPic6D4300pzcnUQ-rgZg94',
    branch: 'Centre de Sécurité QG',
    email: 'admin@company.com',
    password: 'admin',
  },
  director: {
    name: 'Alex Rivera',
    role: 'Directeur',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsnmKkwVIg_dLy_4meeh7cT_qrwIYLP6s8wR-kMfe33RiCcyEE2tXoWiTEf2f_wsb6bOcDKZc_G9_Hgib607pdoO3t6K69YcU8n_FMXIUtuKrjuhpKkr00anEk06jCW1z3ghZtRZZz85cK-Tx6efkLh-UiAfXUved3N2ln2G3DCGU_PM-4HWVzc6YaRHHkbwfw1W1LYaCAlteGVMU47wbTuYMRQIHFun84fCZga6XUHVPfcDY1XQW_Or94Ds_FsD6MgyRn0VTGctw',
    branch: 'Opérations Globales',
    email: 'director@company.com',
    password: 'director',
  },
  inventory: {
    name: 'Robert King',
    role: 'Gestionnaire de stock',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD76ZwVVPm-rFd30TfjPVCRx40SyYz5Gl_9GT_z9AU3EAFQCYbZnA0QC5XxdzWR4PFTui-cDbUBDGfsNtUx2kVyke1Xslak4u7HjXqwr4YSyHtVgTYtcacvqPNWwaalstqURRQdeC8A02ip9bcrvI1iCF0vPb3e4SdSJRT_RVcrwFaPUh9dUrdNZpluX_6gwSoBcCYrpc9Iuau383uK27S9D9wr9IeEgVpAVQuKDAJQYqdEFljgc_2Xcgnu0FwmiZ92IZL90M3dzlQ',
    branch: 'Centre DC-01',
    email: 'inventory@company.com',
    password: 'inventory',
  },
  sales: {
    name: 'Alex Admin',
    role: 'Caissier',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTsavjSFjJ0krutZCZlItFbSccT9B6zjvfSu7h7CHdkz6hW1M2Rk4hQjTZRwR8wz7Q_mkk_GJ3oNLQFPfFjGS6AT8HLtMFCWTQ_Tj1DmUZZu3Qm4aZEgw8o98SibrPpEJRGwV6rti4op_eF2z00VY0fGVAexXBWlKB662Oqz4ma_xAx-m30DyOsOjvKZQzybn1frh7VprBB29LYLWPmLlyP39Cql9C0FGDz6_1ZSm5vjqhi0e3i8NQi33B3mKeEthF8C2hrOmySkE',
    branch: 'Succursale Principale',
    email: 'cashier@company.com',
    password: 'cashier',
  },
};

// JEUX DE DONNÉES INITIAUX MOCKÉS

export const INITIAL_DIRECTORS: Director[] = [
  {
    id: 'DIR-01',
    name: 'Sarah Mitchell',
    email: 's.mitchell@smartstock.com',
    department: 'Approvisionnement',
    lastActivity: 'Il y a 12 min',
    status: 'Actif',
    initials: 'SM',
    bgColor: 'bg-[#e2dfff] text-[#3525cd]',
  },
  {
    id: 'DIR-02',
    name: 'Robert King',
    email: 'r.king@smartstock.com',
    department: 'Gestion de l\'Entrepôt',
    lastActivity: 'Il y a 2 heures',
    status: 'Actif',
    initials: 'RK',
    bgColor: 'bg-[#c9e6ff] text-[#006591]',
  },
  {
    id: 'DIR-03',
    name: 'Amina Lopez',
    email: 'a.lopez@smartstock.com',
    department: 'Ventes Globales',
    lastActivity: 'Hors ligne',
    status: 'Suspendu',
    initials: 'AL',
    bgColor: 'bg-[#e1e0ff] text-[#3130c0]',
  },
  {
    id: 'DIR-04',
    name: 'David Wu',
    email: 'd.wu@smartstock.com',
    department: 'Logistique',
    lastActivity: 'Actif maintenant',
    status: 'En révision',
    initials: 'DW',
    bgColor: 'bg-[#dae2fd] text-[#131b2e]',
  },
];

export const INITIAL_GOVERNANCE_LOGS: GovernanceLog[] = [
  {
    id: 'ID-99823',
    type: 'access',
    title: 'Niveau d\'Accès Accordé',
    description: "Sarah Mitchell a obtenu un accès administrateur pour 'Financier Q4'.",
    timestamp: '14:23:05',
    code: 'SM-99823',
  },
  {
    id: 'ID-99821',
    type: 'error',
    title: 'Échec de Tentative de Connexion',
    description: 'Plusieurs tentatives de connexion échouées détectées depuis l\'IP : 192.168.1.104.',
    timestamp: '14:15:22',
    code: 'IP-99821',
  },
  {
    id: 'ID-99815',
    type: 'policy',
    title: 'Politique Système Mise à Jour',
    description: 'La politique de rotation des mots de passe est fixée à 90 jours pour tous les rôles de directeurs.',
    timestamp: '13:58:10',
    code: 'PO-99815',
  },
  {
    id: 'ID-99801',
    type: 'audit',
    title: 'Exportation d\'Audit Terminée',
    description: 'Rapport d\'audit de gouvernance semestriel généré par le Gouverneur du Système.',
    timestamp: '13:45:00',
    code: 'AU-99801',
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'PROD-01',
    sku: 'SKU-442',
    name: 'Moteur Pro-Fit X',
    category: 'Automobile',
    price: 210000, // 350.0 * 600
    purchasePrice: 136500,
    stock: 842,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLkSkUr_zxl_INx_ctYzTQ86IOoC4k372lBmItxn-cXL-yya-eJctkTqKTeFsVDfiuLg_9fGK_YFtPsJImepDEvkN44sLzAXWLemdnv_-iuPIMscd01UfaBiCt7_tAaVjAI-ye1JnyOnGnW0ftDC3VZ1JjE3xCNU0nUi5DMIfhH0Y7ZY93J-C-PD0QH6xJ3--iPp1QVqu_frlfy2pOKzjweDJqSueXhp6pYJIcR_zFil6k5_S5nSzz2W3qXte7UVxeyZPZyKSLnOM',
    velocity: '842 unités',
    trend: 'HAUSSE MAX',
    salesVolume: 842,
  },
  {
    id: 'PROD-02',
    sku: 'SKU-119',
    name: 'SmartHub 2.0',
    category: 'Électronique',
    price: 149400, // 249.0 * 600
    purchasePrice: 97110,
    stock: 615,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxnaVhaG48Hy8g2dJ3qQXT76pO7-sYMR2OKv0D-62XjAE7Qo3X0iWRezsr7kAVH90VMPLlssY8qrFYry1CTZ7m6ul4HpKdtFUPJia63BEWmq-4q6y7tnXBkewaCr06cPbx3Y72FziKejqnzso7_rRU38NscGws_DyJa26IJ-MHtUCRR1NNo1YdLoeafHKj4xdjGzF8QEm5lUIFLAgXnSzIirsVqzPVDwfMlNK6wRVPEQXnyj63uC4lFxD6GDUEw6FpWNqiC9q3T9Y',
    velocity: '615 unités',
    trend: '+5.2%',
    salesVolume: 615,
  },
  {
    id: 'PROD-03',
    sku: 'SKU-208',
    name: 'Alliage de Précision V4',
    category: 'Fabrication',
    price: 9000, // 15.0 * 600
    purchasePrice: 5850,
    stock: 588,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLkSkUr_zxl_INx_ctYzTQ86IOoC4k372lBmItxn-cXL-yya-eJctkTqKTeFsVDfiuLg_9fGK_YFtPsJImepDEvkN44sLzAXWLemdnv_-iuPIMscd01UfaBiCt7_tAaVjAI-ye1JnyOnGnW0ftDC3VZ1JjE3xCNU0nUi5DMIfhH0Y7ZY93J-C-PD0QH6xJ3--iPp1QVqu_frlfy2pOKzjweDJqSueXhp6pYJIcR_zFil6k5_S5nSzz2W3qXte7UVxeyZPZyKSLnOM',
    velocity: '588 unités',
    trend: '+2.8%',
    salesVolume: 588,
  },
  {
    id: 'PROD-04',
    sku: 'SKU-982',
    name: 'Caisse Standard 50L',
    category: 'Logistique',
    price: 27000, // 45.0 * 600
    purchasePrice: 17550,
    stock: 433,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLkSkUr_zxl_INx_ctYzTQ86IOoC4k372lBmItxn-cXL-yya-eJctkTqKTeFsVDfiuLg_9fGK_YFtPsJImepDEvkN44sLzAXWLemdnv_-iuPIMscd01UfaBiCt7_tAaVjAI-ye1JnyOnGnW0ftDC3VZ1JjE3xCNU0nUi5DMIfhH0Y7ZY93J-C-PD0QH6xJ3--iPp1QVqu_frlfy2pOKzjweDJqSueXhp6pYJIcR_zFil6k5_S5nSzz2W3qXte7UVxeyZPZyKSLnOM',
    velocity: '433 unités',
    trend: '-1.2%',
    salesVolume: 433,
  },
  {
    id: 'PROD-05',
    sku: 'SKU-884',
    name: 'Casque Pro Sound Sans-Fil',
    category: 'Électronique',
    price: 179400, // 299.0 * 600
    purchasePrice: 116610,
    stock: 12,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxnaVhaG48Hy8g2dJ3qQXT76pO7-sYMR2OKv0D-62XjAE7Qo3X0iWRezsr7kAVH90VMPLlssY8qrFYry1CTZ7m6ul4HpKdtFUPJia63BEWmq-4q6y7tnXBkewaCr06cPbx3Y72FziKejqnzso7_rRU38NscGws_DyJa26IJ-MHtUCRR1NNo1YdLoeafHKj4xdjGzF8QEm5lUIFLAgXnSzIirsVqzPVDwfMlNK6wRVPEQXnyj63uC4lFxD6GDUEw6FpWNqiC9q3T9Y',
    velocity: '240 unités',
    trend: '+4.1%',
  },
  {
    id: 'PROD-06',
    sku: 'SKU-122',
    name: 'Montre Connectée Horizon',
    category: 'Électronique',
    price: 108000, // 180.0 * 600
    purchasePrice: 70200,
    stock: 8,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOdWyG460AsBujM7MD4yGwxkn6jjhq4C_QsznIruGQCfXR1DBZ4gpH60e8fvedSdheqhCB6iDjNlhu6hN1UF5gDiQ7p26ogOCaZjuaU8gC0N7-odyeOMRNUKUYfgaa9rZ3GU0uQb3KPk876XzyJb_9AOtmxLc41jy7VU-qNdwFhiCSvJsSh6pOvfIOJ9EopGzbR_dpcJc_6uiamnGX65WHdiMLXd5h-bD7Z8UU64yX06XQESp6P2uzf-rWEGhRQItYck4MyM0dHl4',
    velocity: '180 unités',
    trend: 'Stable',
  },
  {
    id: 'PROD-07',
    sku: 'SKU-901',
    name: 'Lunettes Rétro Solaires',
    category: 'Accessoires',
    price: 45000, // 75.0 * 600
    purchasePrice: 29250,
    stock: 4,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA57yRI7LxcdsIcF9qWqG-x6JAJEaRQ-qfwis0ipzel77Ex9OJ6Ozboe7lK0EPCTfw3P_rsH_-43Sf9VFlPShN6H_7p-7c61Ns3Gsi20Mr2R6NuMCCnWgorTDEu7ReEqsL7q-CSyLFylAlRGtQQRhJBqeczPo-2XWCrclLEfwDzXrBw7yT9YT_aT4mGMal54UGkY90TtlU7j6ojGDYCGUrKJFFlZ6ETX0xmzvwcWBXwsbQMDxHlECabrirmLCX2Gs6UAxi8uTSCW3A',
    velocity: '95 unités',
    trend: '+1.5%',
  },
  {
    id: 'PROD-08',
    sku: 'SKU-312',
    name: 'Chaussures Course Velocity',
    category: 'Chaussures',
    price: 72000, // 120.0 * 600
    purchasePrice: 46800,
    stock: 45,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxRHLj0vKiGy5X3L_2U4KdwGq8bmD5RimOz4zAKaTqfCmlDVyEC3guKJ5zwzDTXtUOL3Td6lRhjF65VGbf8FzAieYYGBD5e0n_HhrYbZgTpzzabLFlmEozAs2DN3UTb3a1-QxXuv46VtbhZPYDpwIUaVYdXAq8u79G9fTvVyWTeUZ2r8TlFCG2IbSSkMXWKf30UArmni6LFQ_uOfVzPG-HQ20DZDjIh6heMeDmTwbZvlWiMSAr7cABSvgvaGUxUksTasXRJBpfmRM',
    velocity: '312 unités',
    trend: '+8.3%',
  },
  {
    id: 'PROD-09',
    sku: 'SKU-774',
    name: 'Objectif Photo X-Lens 50mm',
    category: 'Accessoires',
    price: 324000, // 540.0 * 600
    purchasePrice: 210600,
    stock: 22,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCA3VUm27N5_MUzJbNh17ix0INePkor7gO2GDjf4FX_g1n5KqWZqQDyW1ht9oTFI8dqQZo74ZXohKZdCagwcf5qZ6MG3eovPJ7iHp9LC8m4Z4H5qoZ5t-0vsClLUBtsBX8SYddgv5j5OOs8DvATA4sv1A0jntIniNnVo_NcI3yIzzjIVUw3lWts70BdJwroJtQsm_6Mykp8ulP9VElIKpxm4eIv-TzLWOu7fXAPSpI0zogLrRAoNLzAUumTr7XhNF0TpoWSTBQljHg',
    velocity: '88 unités',
    trend: '-0.5%',
  },
  {
    id: 'PROD-10',
    sku: 'SKU-552',
    name: 'Sac à Dos de Voyage Nomad',
    category: 'Voyage',
    price: 51000, // 85.0 * 600
    purchasePrice: 33150,
    stock: 50,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuPCcBxiVyR0XbB07kZbZY9XrPW0rNpcgN1AZ20Pz6HkAhkxnGpRsUbaTzbpmv74vOfVAYfK3x0rfsDZechdCwctQH1HffFoW0NibQ5JccaCXF7XUB4KHz_QsIkkMlfC0s--yFN2B5WlibHgBI_AiMivbTvJ4LlbmM1T5KGbXkPsJclN2jT0h7dWvznfkO6dTVPr_WbuW-XB1RryDx-9OxmNNf9hBMYqyiJN3pwdHyZvYJp7RUEazy6cYvX8cEZ6UqTgRWPd_dng8',
    velocity: '112 unités',
    trend: '+12.5%',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Ventes du jour (2026-07-03)
  {
    id: '#TRX-1001',
    asset: 'Vente Directe PDV',
    category: 'VENTES POINT DE VENTE',
    origin: 'Succursale Principale',
    destination: 'Client',
    status: 'Livré',
    value: 391800,
    date: '2026-07-03',
    paymentMethod: 'espèces',
    cashierName: 'Alex Admin',
    items: [
      { productId: 'PROD-02', name: 'SmartHub 2.0', quantity: 2, price: 149400, purchasePrice: 97110, category: 'Électronique' },
      { productId: 'PROD-10', name: 'Sac à Dos de Voyage Nomad', quantity: 1, price: 51000, purchasePrice: 33150, category: 'Voyage' },
      { productId: 'PROD-07', name: 'Lunettes Rétro Solaires', quantity: 1, price: 45000, purchasePrice: 29250, category: 'Accessoires' }
    ],
    difference: 0
  },
  {
    id: '#TRX-1002',
    asset: 'Vente Directe PDV',
    category: 'VENTES POINT DE VENTE',
    origin: 'Succursale Principale',
    destination: 'Client',
    status: 'Livré',
    value: 288000,
    date: '2026-07-03',
    paymentMethod: 'Carte bancaire',
    cashierName: 'Alex Admin',
    items: [
      { productId: 'PROD-08', name: 'Chaussures Course Velocity', quantity: 4, price: 72000, purchasePrice: 46800, category: 'Chaussures' }
    ],
    difference: 0
  },
  {
    id: '#TRX-1003',
    asset: 'Vente Directe PDV',
    category: 'VENTES POINT DE VENTE',
    origin: 'Succursale Principale',
    destination: 'Client',
    status: 'Livré',
    value: 179400,
    date: '2026-07-03',
    paymentMethod: 'Mobile Money',
    cashierName: 'Alex Admin',
    items: [
      { productId: 'PROD-05', name: 'Casque Pro Sound Sans-Fil', quantity: 1, price: 179400, purchasePrice: 116610, category: 'Électronique' }
    ],
    difference: -500 // variance caisse
  },
  // Ventes d'hier (2026-07-02)
  {
    id: '#TRX-1004',
    asset: 'Vente Directe PDV',
    category: 'VENTES POINT DE VENTE',
    origin: 'Succursale Principale',
    destination: 'Client',
    status: 'Livré',
    value: 420000,
    date: '2026-07-02',
    paymentMethod: 'espèces',
    cashierName: 'Alex Admin',
    items: [
      { productId: 'PROD-01', name: 'Moteur Pro-Fit X', quantity: 2, price: 210000, purchasePrice: 136500, category: 'Automobile' }
    ],
    difference: 1500
  },
  {
    id: '#TRX-1005',
    asset: 'Vente Directe PDV',
    category: 'VENTES POINT DE VENTE',
    origin: 'Succursale Principale',
    destination: 'Client',
    status: 'Livré',
    value: 324000,
    date: '2026-07-02',
    paymentMethod: 'Carte bancaire',
    cashierName: 'Robert King',
    items: [
      { productId: 'PROD-09', name: 'Objectif Photo X-Lens 50mm', quantity: 1, price: 324000, purchasePrice: 210600, category: 'Accessoires' }
    ],
    difference: 0
  },
  // Ventes de la semaine (2026-06-28 à 2026-07-01)
  {
    id: '#TRX-1006',
    asset: 'Vente Directe PDV',
    category: 'VENTES POINT DE VENTE',
    origin: 'Succursale Principale',
    destination: 'Client',
    status: 'Livré',
    value: 648000,
    date: '2026-06-30',
    paymentMethod: 'Mobile Money',
    cashierName: 'Robert King',
    items: [
      { productId: 'PROD-09', name: 'Objectif Photo X-Lens 50mm', quantity: 2, price: 324000, purchasePrice: 210600, category: 'Accessoires' }
    ],
    difference: 0
  },
  {
    id: '#TRX-1007',
    asset: 'Vente Directe PDV',
    category: 'VENTES POINT DE VENTE',
    origin: 'Succursale Principale',
    destination: 'Client',
    status: 'Livré',
    value: 510000,
    date: '2026-06-29',
    paymentMethod: 'espèces',
    cashierName: 'Alex Admin',
    items: [
      { productId: 'PROD-10', name: 'Sac à Dos de Voyage Nomad', quantity: 10, price: 51000, purchasePrice: 33150, category: 'Voyage' }
    ],
    difference: 0
  },
  // Ventes du mois dernier (Juin 2026, hors cette semaine)
  {
    id: '#TRX-1008',
    asset: 'Vente Directe PDV',
    category: 'VENTES POINT DE VENTE',
    origin: 'Succursale Principale',
    destination: 'Client',
    status: 'Livré',
    value: 1200000,
    date: '2026-06-15',
    paymentMethod: 'Carte bancaire',
    cashierName: 'Alex Admin',
    items: [
      { productId: 'PROD-01', name: 'Moteur Pro-Fit X', quantity: 5, price: 210000, purchasePrice: 136500, category: 'Automobile' },
      { productId: 'PROD-03', name: 'Alliage de Précision V4', quantity: 16, price: 9000, purchasePrice: 5850, category: 'Fabrication' }
    ],
    difference: -2000
  },
  {
    id: '#TRX-1009',
    asset: 'Vente Directe PDV',
    category: 'VENTES POINT DE VENTE',
    origin: 'Succursale Principale',
    destination: 'Client',
    status: 'Livré',
    value: 896400,
    date: '2026-06-10',
    paymentMethod: 'espèces',
    cashierName: 'Alex Rivera',
    items: [
      { productId: 'PROD-02', name: 'SmartHub 2.0', quantity: 6, price: 149400, purchasePrice: 97110, category: 'Électronique' }
    ],
    difference: 0
  },
  // Ventes de l'année (plus anciennes en 2026)
  {
    id: '#TRX-1010',
    asset: 'Vente Directe PDV',
    category: 'VENTES POINT DE VENTE',
    origin: 'Succursale Principale',
    destination: 'Client',
    status: 'Livré',
    value: 3000000,
    date: '2026-04-12',
    paymentMethod: 'espèces',
    cashierName: 'Alex Admin',
    items: [
      { productId: 'PROD-01', name: 'Moteur Pro-Fit X', quantity: 12, price: 210000, purchasePrice: 136500, category: 'Automobile' },
      { productId: 'PROD-06', name: 'Montre Connectée Horizon', quantity: 4, price: 108000, purchasePrice: 70200, category: 'Électronique' }
    ],
    difference: 0
  },
  // Ventes de l'année précédente (2025)
  {
    id: '#TRX-1011',
    asset: 'Vente Directe PDV',
    category: 'VENTES POINT DE VENTE',
    origin: 'Succursale Principale',
    destination: 'Client',
    status: 'Livré',
    value: 4500000,
    date: '2025-10-24',
    paymentMethod: 'Carte bancaire',
    cashierName: 'Alex Admin',
    items: [
      { productId: 'PROD-01', name: 'Moteur Pro-Fit X', quantity: 20, price: 210000, purchasePrice: 136500, category: 'Automobile' },
      { productId: 'PROD-02', name: 'SmartHub 2.0', quantity: 2, price: 149400, purchasePrice: 97110, category: 'Électronique' }
    ],
    difference: 0
  },
  // Anciennes transactions logistiques conservées
  {
    id: '#TRX-99021',
    asset: 'Acier de Qualité Industrielle',
    category: 'MATIÈRE PREMIÈRE EN VRAC',
    origin: 'Entrepôt Chicago 1',
    destination: 'Usine de Fabrication A',
    status: 'En transit',
    value: 25290000,
    date: '2026-07-01',
  },
  {
    id: '#TRX-99018',
    asset: 'SmartHub 2.0 (Lot 5)',
    category: 'ÉLECTRONIQUE GRAND PUBLIC',
    origin: 'Centre de Guangzhou',
    destination: 'Distribution de Détail B',
    status: 'Livré',
    value: 7440000,
    date: '2026-07-02',
  },
  {
    id: '#TRX-99015',
    asset: 'Composants de Turbine d\'Aviation',
    category: 'PIÈCES DE PRÉCISION',
    origin: 'Centre Logistique de Berlin',
    destination: 'Assemblage de Munich',
    status: 'Retardé',
    value: 93600000,
    date: '2026-06-30',
  },
];

export const INITIAL_STOCK_ARRIVALS: StockArrival[] = [
  {
    id: 'ARR-01',
    sku: 'ELC-29381',
    supplier: 'Global Tech Dist.',
    quantity: '+450 Unités',
    location: 'Zone B-12',
    status: 'VÉRIFIÉ',
  },
  {
    id: 'ARR-02',
    sku: 'FRN-00214',
    supplier: 'Modern Office Co.',
    quantity: '+120 Unités',
    location: 'Zone D-04',
    status: 'INSPECTION',
  },
  {
    id: 'ARR-03',
    sku: 'SFT-99120',
    supplier: 'Safe Guard Ltd.',
    quantity: '+2 000 Unités',
    location: 'Zone A-01',
    status: 'VÉRIFIÉ',
  },
  {
    id: 'ARR-04',
    sku: 'TEX-88219',
    supplier: 'Cotton Masters',
    quantity: '+85 Unités',
    location: 'Zone C-11',
    status: 'TRAITEMENT',
  },
  {
    id: 'ARR-05',
    sku: 'ELC-29382',
    supplier: 'Global Tech Dist.',
    quantity: '+150 Unités',
    location: 'Zone B-12',
    status: 'VÉRIFIÉ',
  },
];
