import React, { useState } from 'react';
import { Lock, Unlock, Eye, EyeOff, ShieldCheck, Settings, ArrowRight } from 'lucide-react';
import { AppConfig } from '../types';
import { playDinoSound } from '../utils/data/audio';

interface AdminPanelProps {
  isAdmin: boolean;
  onToggleAdmin: (val: boolean) => void;
  onOpenAdminPage: () => void;
  config: AppConfig;
  onImportConfig: (newConfig: AppConfig) => void;
}

export default function AdminPanel({
  isAdmin,
  onToggleAdmin,
  onOpenAdminPage,
}: AdminPanelProps) {
  const [password, setPassword] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordChar, setShowPasswordChar] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === '250993') {
      playDinoSound();
      onToggleAdmin(true);
      setShowInput(false);
      setPassword('');
      setError('');
      // Open the dedicated admin page immediately
      onOpenAdminPage();
    } else {
      setError('Mot de passe incorrect');
    }
  };

  const handleLogout = () => {
    playDinoSound();
    onToggleAdmin(false);
  };

  return (
    <div className="fixed top-4 right-4 z-40">
      {isAdmin ? (
        <div className="flex items-center gap-2 bg-slate-900/95 backdrop-blur border border-yellow-600/40 p-1.5 pl-3 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-2 mr-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-yellow-500 uppercase tracking-wider hidden sm:inline font-mono">
              Admin Actif
            </span>
          </div>

          <button
            onClick={() => {
              playDinoSound();
              onOpenAdminPage();
            }}
            className="flex items-center gap-1.5 bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs uppercase tracking-wider transition shadow-md active:scale-95 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Menu Administrateur</span>
            <ArrowRight className="w-3 h-3 hidden sm:inline" />
          </button>

          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Quitter le mode Administrateur"
          >
            <Unlock className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          {showInput ? (
            <form
              onSubmit={handleLogin}
              className="bg-slate-900/95 backdrop-blur border border-yellow-600/40 p-4 rounded-2xl shadow-2xl flex flex-col gap-3 min-w-[280px] animate-fade-in"
            >
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Accès Administrateur
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowInput(false);
                    setError('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Fermer
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPasswordChar ? 'text' : 'password'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3 pr-9 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-yellow-500"
                  placeholder="Mot de passe d'administration..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordChar(!showPasswordChar)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPasswordChar ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {error && <p className="text-[11px] text-rose-400 font-mono">{error}</p>}

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowInput(false);
                    setError('');
                  }}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer"
                >
                  Ouvrir l'Espace Admin
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => {
                playDinoSound();
                setShowInput(true);
              }}
              title="Accès Administrateur"
              className="bg-slate-900/60 hover:bg-slate-900 text-slate-500 hover:text-yellow-500 border border-slate-800 hover:border-yellow-600/40 p-2.5 rounded-xl transition-all shadow-lg flex items-center justify-center cursor-pointer"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
