/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Director, GovernanceLog, User } from '../types';

interface GovernanceProps {
  directors: Director[];
  setDirectors: React.Dispatch<React.SetStateAction<Director[]>>;
  logs: GovernanceLog[];
  setLogs: React.Dispatch<React.SetStateAction<GovernanceLog[]>>;
  searchQuery: string;
  currentUser: User;
  accounts: User[];
  onCreateUser: (newUser: User, newDirector: Director) => void;
}

export const Governance: React.FC<GovernanceProps> = ({
  directors,
  setDirectors,
  logs,
  setLogs,
  searchQuery,
  currentUser,
  accounts,
  onCreateUser,
}) => {
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDirector, setSelectedDirector] = useState<Director | null>(null);

  const isDirectorUser = currentUser.role.includes('Directeur');

  // New account creation state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('password123');
  const [newDept, setNewDept] = useState(isDirectorUser ? 'Opérations d\'entrepôt' : 'Approvisionnement');
  const [newStatus, setNewStatus] = useState<'Active' | 'Suspended' | 'Reviewing'>('Active');
  const [newRole, setNewRole] = useState<'Directeur' | 'Gestionnaire de stock' | 'Caissier'>(
    isDirectorUser ? 'Gestionnaire de stock' : 'Directeur'
  );

  // Filter accounts and directors according to active role:
  // Admin sees and manages Directors only.
  // Director sees and manages Stock Managers & Cashiers only.
  const filteredDirectors = directors.filter((dir) => {
    const matchedAccount = accounts.find((acc) => acc.email?.toLowerCase() === dir.email.toLowerCase());
    const accountRole = matchedAccount?.role || '';
    
    if (isDirectorUser) {
      // Show only Stock Managers & Cashiers
      if (!accountRole.includes('Gestionnaire') && !accountRole.includes('Caissier')) {
        return false;
      }
    } else {
      // Admin: Show only Directors
      if (!accountRole.includes('Directeur')) {
        return false;
      }
    }

    const q = searchQuery.toLowerCase();
    return (
      dir.name.toLowerCase().includes(q) ||
      dir.email.toLowerCase().includes(q) ||
      dir.department.toLowerCase().includes(q)
    );
  });

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleProvisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const initials = getInitials(newName);
    const bgColors = [
      'bg-indigo-100 text-indigo-700',
      'bg-teal-100 text-teal-700',
      'bg-sky-100 text-sky-700',
      'bg-rose-100 text-rose-700',
      'bg-amber-100 text-amber-700',
    ];
    const randomBg = bgColors[Math.floor(Math.random() * bgColors.length)];

    const finalRole = isDirectorUser ? newRole : 'Directeur';

    // 1. Create Director/Team member object
    const newDir: Director = {
      id: `USR-${Date.now().toString().slice(-3)}`,
      name: newName,
      email: newEmail,
      department: finalRole === 'Directeur' ? newDept : finalRole,
      lastActivity: 'Actif maintenant',
      status: newStatus,
      initials,
      bgColor: randomBg,
    };

    // 2. Create Login User Object
    const newUser: User = {
      name: newName,
      role: finalRole,
      email: newEmail,
      password: newPassword,
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(newName)}`,
      branch: finalRole === 'Directeur' ? newDept : 'Succursale active'
    };

    // Call the unified creation handler
    onCreateUser(newUser, newDir);

    // Add activity log
    const newLog: GovernanceLog = {
      id: `ID-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'access',
      title: `${finalRole} Habilité`,
      description: `Le compte ${finalRole} a été créé pour ${newName} (Email: ${newEmail}).`,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour12: false }),
      code: `PR-${Math.floor(100 + Math.random() * 900)}`,
    };
    setLogs([newLog, ...logs]);

    // Reset Form
    setNewName('');
    setNewEmail('');
    setNewPassword('password123');
    setNewDept(isDirectorUser ? 'Opérations d\'entrepôt' : 'Approvisionnement');
    setNewStatus('Active');
    setShowProvisionModal(false);
  };

  const handleEditClick = (dir: Director) => {
    setSelectedDirector(dir);
    setNewName(dir.name);
    setNewEmail(dir.email);
    setNewDept(dir.department);
    setNewStatus(dir.status);
    
    const matchedAccount = accounts.find((acc) => acc.email?.toLowerCase() === dir.email.toLowerCase());
    setNewPassword(matchedAccount?.password || 'password123');
    setNewRole((matchedAccount?.role as any) || 'Gestionnaire de stock');
    
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDirector) return;

    setDirectors(
      directors.map((dir) =>
        dir.id === selectedDirector.id
          ? {
              ...dir,
              name: newName,
              email: newEmail,
              department: isDirectorUser ? newRole : newDept,
              status: newStatus,
              initials: getInitials(newName),
            }
          : dir
      )
    );

    // Add change log
    const newLog: GovernanceLog = {
      id: `ID-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'policy',
      title: 'Compte Mis à Jour',
      description: `Les informations de ${newName} ont été mises à jour avec succès.`,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour12: false }),
      code: `UP-${Math.floor(100 + Math.random() * 900)}`,
    };
    setLogs([newLog, ...logs]);

    setShowEditModal(false);
    setSelectedDirector(null);
  };

  const handleDeleteDirector = (id: string, name: string) => {
    if (confirm(`Êtes-vous sûr de vouloir suspendre/supprimer le directeur ${name} ?`)) {
      setDirectors(directors.filter((dir) => dir.id !== id));

      const newLog: GovernanceLog = {
        id: `ID-${Math.floor(10000 + Math.random() * 90000)}`,
        type: 'error',
        title: 'Directeur Suspendu/Supprimé',
        description: `Le directeur ${name} a été suspendu et ses identifiants de base de données ont été invalidés.`,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour12: false }),
        code: `DL-${Math.floor(100 + Math.random() * 900)}`,
      };
      setLogs([newLog, ...logs]);
    }
  };

  return (
    <div className="pt-24 px-8 pb-12 w-full animate-fade-in font-sans">
      {/* Header Section */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight font-sans">
            {isDirectorUser ? "Gestion de l'Équipe" : "Gouvernance et Contrôle"}
          </h2>
          <p className="text-[#464555] text-sm mt-1">
            {isDirectorUser 
              ? "Surveillance et attribution des accès pour les gestionnaires de stock et caissiers de votre succursale." 
              : "Surveillance de la santé du système et des autorisations de niveau directeur dans toute l'entreprise."}
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => {
              alert('Journaux exportés ! Le rapport d\'audit est en cours de téléchargement en arrière-plan.');
              const newLog: GovernanceLog = {
                id: `ID-${Math.floor(10000 + Math.random() * 90000)}`,
                type: 'audit',
                title: 'Rapport d\'Audit Exporté',
                description: `Exportation manuelle des journaux par le ${currentUser.role}.`,
                timestamp: new Date().toLocaleTimeString('fr-FR', { hour12: false }),
                code: 'AU-EX',
              };
              setLogs([newLog, ...logs]);
            }}
            className="px-5 py-2.5 bg-gray-100 text-[#006591] rounded-xl font-bold text-xs hover:bg-gray-200 transition-all cursor-pointer"
          >
            Exporter les Journaux
          </button>
          <button
            onClick={() => setShowProvisionModal(true)}
            className="px-5 py-2.5 bg-[#3525cd] text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-[#4f46e5] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            {isDirectorUser ? "Créer un Compte Équipe" : "Habiliter un Directeur"}
          </button>
        </div>
      </div>

      {/* Stats Bento Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* System Health Card */}
        <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-2xl border border-[#c7c4d8]/40 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10 -mr-8 -mt-8 text-[#3525cd] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <span className="material-symbols-outlined !text-[128px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              health_and_safety
            </span>
          </div>
          <div className="relative z-10">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 inline-block">
              Statut Système : Optimal
            </span>
            <h3 className="text-gray-800 font-bold text-sm tracking-tight mb-1">
              Score de Santé de la Gouvernance
            </h3>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-extrabold text-[#3525cd] tracking-tight leading-none">
                98,4<span className="text-lg">%</span>
              </span>
              <div className="pb-1">
                <span className="flex items-center text-emerald-600 text-xs font-bold gap-0.5">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span>
                  +0,2%
                </span>
              </div>
            </div>
            <div className="mt-5 w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div className="bg-[#3525cd] h-full rounded-full transition-all duration-1000" style={{ width: '98.4%' }}></div>
            </div>
          </div>
        </div>

        {/* Active Directors count */}
        <div className="bg-white p-6 rounded-2xl border border-[#c7c4d8]/40 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-indigo-50 rounded-xl text-[#3525cd]">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                supervisor_account
              </span>
            </div>
            <span className="material-symbols-outlined text-gray-400 cursor-pointer hover:text-[#3525cd] transition-colors">
              more_vert
            </span>
          </div>
          <div className="mt-4">
            <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold font-sans">
              {isDirectorUser ? "Membres de l'Équipe" : "Directeurs Actifs"}
            </p>
            <p className="text-3xl font-extrabold text-gray-900 tracking-tight leading-none mt-1">
              {filteredDirectors.length}
            </p>
            <p className="text-gray-500 text-xs mt-1 font-semibold">
              {isDirectorUser ? "Personnel rattaché" : "4 nouveaux depuis le dernier audit"}
            </p>
          </div>
        </div>

        {/* Critical Alerts stats */}
        <div className="bg-white p-6 rounded-2xl border border-[#c7c4d8]/40 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-rose-50 rounded-xl text-[#ba1a1a]">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                warning
              </span>
            </div>
            <span className="material-symbols-outlined text-gray-400 cursor-pointer hover:text-[#3525cd] transition-colors">
              more_vert
            </span>
          </div>
          <div className="mt-4">
            <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold font-sans">
              Alertes Sécurité
            </p>
            <p className="text-3xl font-extrabold text-[#ba1a1a] tracking-tight leading-none mt-1">
              00
            </p>
            <p className="text-gray-500 text-xs mt-1 font-semibold">
              Aucune anomalie détectée
            </p>
          </div>
        </div>
      </div>

      {/* Management Table & Real-time Monitoring Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Director Management Table Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#c7c4d8]/40 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#c7c4d8]/40 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-base text-gray-900 font-sans">
              {isDirectorUser ? "Annuaire de l'Équipe" : "Annuaire des Directeurs"}
            </h3>
            <div className="flex gap-2">
              <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-[20px]">filter_list</span>
              </button>
              <button
                onClick={() => alert('Exportation de l\'annuaire au format CSV...')}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">download</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[#464555] text-[11px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">{isDirectorUser ? "Collaborateur" : "Directeur d'Entité"}</th>
                  <th className="px-6 py-4">{isDirectorUser ? "Poste / Rôle" : "Département"}</th>
                  <th className="px-6 py-4">Dernière Activité</th>
                  <th className="px-6 py-4">Statut de Conformité</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c7c4d8]/20">
                {filteredDirectors.length > 0 ? (
                  filteredDirectors.map((dir) => (
                    <tr key={dir.id} className="hover:bg-indigo-50/20 transition-all duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full ${dir.bgColor} flex items-center justify-center font-bold text-xs shadow-inner`}
                          >
                            {dir.initials}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-900 font-sans leading-tight">
                              {dir.name}
                            </p>
                            <p className="text-[11px] text-gray-400 font-medium">{dir.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-700 font-sans">
                        {dir.department}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-sans">
                        {dir.lastActivity === 'Active Now' ? 'Actif maintenant' : dir.lastActivity}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
                            dir.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : dir.status === 'Suspended'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              dir.status === 'Active'
                                ? 'bg-emerald-600'
                                : dir.status === 'Suspended'
                                ? 'bg-gray-500'
                                : 'bg-amber-500'
                            }`}
                          ></span>
                          {dir.status === 'Active' ? 'Actif' : dir.status === 'Suspended' ? 'Suspendu' : 'En révision'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                        <button
                          onClick={() => handleEditClick(dir)}
                          className="p-1.5 text-gray-400 hover:text-[#3525cd] hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center"
                          title="Modifier le Directeur"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteDirector(dir.id, dir.name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center"
                          title="Suspendre/Supprimer"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-xs text-gray-400">
                      Aucun directeur correspondant trouvé dans l'annuaire actif
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-gray-50/50 border-t border-[#c7c4d8]/40 flex justify-between items-center text-xs text-gray-500">
            <span>Affichage de {filteredDirectors.length} sur {directors.length} directeurs actifs</span>
            <div className="flex gap-2">
              <button
                disabled
                className="p-1 border border-gray-200 rounded-md bg-white text-gray-300 disabled:opacity-50 cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button
                onClick={() => alert('La pagination de démonstration est configurée pour une seule page.')}
                className="p-1 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Governance Logs Card */}
        <div className="bg-white rounded-2xl border border-[#c7c4d8]/40 shadow-sm overflow-hidden flex flex-col h-[500px]">
          <div className="p-5 border-b border-[#c7c4d8]/40 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-base text-gray-900 font-sans">
              Journaux de Gouvernance
            </h3>
            <button
              onClick={() => {
                const manualLog: GovernanceLog = {
                  id: `ID-${Math.floor(10000 + Math.random() * 90000)}`,
                  type: 'success',
                  title: 'Ping Manuel Déclenché',
                  description: 'Le Gouverneur du Système a déclenché une vérification manuelle de la boucle de sécurité.',
                  timestamp: new Date().toLocaleTimeString('fr-FR', { hour12: false }),
                  code: 'PN-OK',
                };
                setLogs([manualLog, ...logs]);
              }}
              className="text-[11px] font-bold text-[#3525cd] hover:underline"
            >
              Forcer le Ping d'Audit
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-5">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-4 group">
                <div className="mt-1 flex flex-col items-center">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ring-4 ${
                      log.type === 'error'
                        ? 'bg-[#ba1a1a] ring-red-100'
                        : log.type === 'access'
                        ? 'bg-emerald-500 ring-emerald-100'
                        : log.type === 'success'
                        ? 'bg-[#006591] ring-sky-100'
                        : 'bg-indigo-500 ring-indigo-100'
                    }`}
                  ></div>
                  <div className="w-[1.5px] h-12 bg-gray-100 mt-2 opacity-80"></div>
                </div>
                <div className="flex-1 bg-gray-50/40 p-3 rounded-xl border border-gray-100 group-hover:bg-indigo-50/10 transition-colors">
                  <p className="text-xs font-bold text-gray-900 leading-tight">
                    {log.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-sans">{log.description}</p>
                  <p className="text-[10px] text-gray-400 font-bold mt-2 tracking-wide font-mono uppercase">
                    {log.timestamp} • {log.code}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 text-center bg-gray-50/50 border-t border-[#c7c4d8]/40">
            <button
              onClick={() => alert(`Examen de l'historique complet : Total de ${logs.length} opérations stockées dans l'audit persistant.`)}
              className="text-xs text-[#3525cd] font-bold hover:underline"
            >
              Voir tous les journaux d'audit
            </button>
          </div>
        </div>
      </div>

      {/* Provision Director / Team Modal */}
      {showProvisionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-gray-100">
            <button
              onClick={() => setShowProvisionModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4 font-sans">
              {isDirectorUser ? "Créer un Nouveau Compte Collaborateur" : "Habiliter un Nouveau Directeur"}
            </h3>
            <form onSubmit={handleProvisionSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600 uppercase">
                  Nom Complet
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ex. Jean Dupont"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600 uppercase">
                  Adresse E-mail
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="nom@entreprise.com"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50 transition-all"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600 uppercase">
                  Mot de passe de connexion
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mot de passe"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50 transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {isDirectorUser ? (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-gray-600 uppercase">
                      Rôle Équipe
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-sans bg-white focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50 transition-all"
                    >
                      <option value="Gestionnaire de stock">Gestionnaire de stock</option>
                      <option value="Caissier">Caissier (POS)</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-gray-600 uppercase">
                      Département
                    </label>
                    <select
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-sans bg-white focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50 transition-all"
                    >
                      <option value="Approvisionnement">Approvisionnement</option>
                      <option value="Opérations d'entrepôt">Opérations d'entrepôt</option>
                      <option value="Ventes mondiales">Ventes mondiales</option>
                      <option value="Logistique">Logistique</option>
                      <option value="Assurance qualité">Assurance qualité</option>
                    </select>
                  </div>
                )}
                
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-600 uppercase">
                    Statut Initial
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-sans bg-white focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50 transition-all"
                  >
                    <option value="Active">Actif</option>
                    <option value="Reviewing">En révision</option>
                    <option value="Suspended">Suspendu</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full mt-6 py-3 bg-[#3525cd] text-white rounded-xl text-xs font-bold hover:bg-[#4f46e5] transition-all cursor-pointer shadow-lg shadow-indigo-100"
              >
                Créer les Identifiants d'Accès
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Director / Team Modal */}
      {showEditModal && selectedDirector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-gray-100">
            <button
              onClick={() => {
                setShowEditModal(false);
                setSelectedDirector(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4 font-sans">
              {isDirectorUser ? "Modifier le Compte Collaborateur" : "Modifier les Identifiants du Directeur"}
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600 uppercase">
                  Nom Complet
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600 uppercase">
                  Adresse E-mail
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {isDirectorUser ? (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-gray-600 uppercase">
                      Rôle Équipe
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-sans bg-white focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50 transition-all"
                    >
                      <option value="Gestionnaire de stock">Gestionnaire de stock</option>
                      <option value="Caissier">Caissier (POS)</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-gray-600 uppercase">
                      Département
                    </label>
                    <select
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-sans bg-white focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50 transition-all"
                    >
                      <option value="Approvisionnement">Approvisionnement</option>
                      <option value="Opérations d'entrepôt">Opérations d'entrepôt</option>
                      <option value="Ventes mondiales">Ventes mondiales</option>
                      <option value="Logistique">Logistique</option>
                      <option value="Assurance qualité">Assurance qualité</option>
                    </select>
                  </div>
                )}
                
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-600 uppercase">
                    Statut de Conformité
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-sans bg-white focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50 transition-all"
                  >
                    <option value="Active">Actif</option>
                    <option value="Reviewing">En révision</option>
                    <option value="Suspended">Suspendu</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full mt-6 py-3 bg-[#006591] text-white rounded-xl text-xs font-bold hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-sky-100"
              >
                Mettre à Jour le Compte Équipe
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
