'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import {
  Music,
  AlertTriangle,
  Loader2,
  Sparkles,
  LogIn,
  UserPlus,
  Mic,
  Headphones,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { User } from '@/types';

interface AuthModalProps {
  onLogin: (user: User) => void;
  initialMode?: 'signin' | 'signup';
}

export default function AuthModal({ onLogin, initialMode = 'signin' }: AuthModalProps) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  // Role selection for registration: 'USER' (Listener) vs 'SINGER' (Artist)
  const [selectedRole, setSelectedRole] = useState<'USER' | 'SINGER'>('USER');

  // Sign In inputs
  const [signInIdentifier, setSignInIdentifier] = useState('');

  // Sign Up inputs
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  // Suggest unique username
  const handleSuggestUsername = async () => {
    setSuggesting(true);
    setError('');
    try {
      const response = await fetch('/api/user/suggest');
      const data = await response.json();
      if (response.ok && data.username) {
        setSignUpUsername(data.username);
      } else {
        setError(data.error || 'Failed to suggest username');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed. Please check network.');
    } finally {
      setSuggesting(false);
    }
  };

  // Switch between Sign In and Sign Up tabs
  const handleSwitchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setError('');
  };

  // Quick Admin Login Helper
  const handleQuickAdminLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signin',
          identifier: 'admin',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to sign in as admin');
      } else {
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signin') {
      const identifier = signInIdentifier.trim().toLowerCase();
      if (!identifier) {
        setError('Please enter your username or email address');
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'signin',
            identifier,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          setError(data.error || 'Failed to sign in');
        } else {
          localStorage.setItem('user', JSON.stringify(data.user));
          onLogin(data.user);
        }
      } catch (err) {
        console.error(err);
        setError('Connection failed. Please check server.');
      } finally {
        setLoading(false);
      }
    } else {
      // Sign Up validation
      const cleanEmail = signUpEmail.trim().toLowerCase();
      const cleanUsername = signUpUsername.trim().toLowerCase();

      if (!/^[a-z0-9_]{3,15}$/.test(cleanUsername)) {
        setError(t('auth.error.username') || 'Username must be 3-15 alphanumeric chars or underscores');
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        setError('Please enter a valid email address');
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'signup',
            email: cleanEmail,
            username: cleanUsername,
            role: selectedRole,
            isPrivate,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          setError(data.error || 'Failed to sign up');
        } else {
          localStorage.setItem('user', JSON.stringify(data.user));
          onLogin(data.user);
        }
      } catch (err) {
        console.error(err);
        setError('Connection failed. Please check server.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg p-6 sm:p-8 rounded-2xl glass-panel glow-purple border border-purple-500/30 my-auto">
        {/* Header Logo & Title */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="p-3.5 mb-2.5 bg-gradient-to-tr from-purple-600 to-cyan-400 rounded-full text-black shadow-lg shadow-purple-500/25 animate-pulse">
            <Music size={32} />
          </div>

          <h2 className="text-3xl font-black tracking-wider bg-gradient-to-r from-white via-purple-300 to-cyan-400 bg-clip-text text-transparent">
            Gana Music
          </h2>
          <p className="mt-1 text-xs text-zinc-400 font-medium">
            Worldwide Music Streaming & Artist Platform
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="flex p-1 mb-5 bg-zinc-950/80 border border-zinc-800 rounded-xl select-none">
          <button
            type="button"
            onClick={() => handleSwitchMode('signin')}
            className={`flex-1 py-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'signin'
                ? 'bg-purple-600 text-black shadow-md shadow-purple-500/25'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <LogIn size={13} />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchMode('signup')}
            className={`flex-1 py-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'signup'
                ? 'bg-purple-600 text-black shadow-md shadow-purple-500/25'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <UserPlus size={13} />
            <span>Sign Up</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            /* --- SELECT ACCOUNT TYPE: SINGER VS LISTENER --- */
            <div>
              <label className="block mb-2 text-xs font-black text-zinc-300 uppercase tracking-wider">
                Select Your Account Type
              </label>
              <div className="grid grid-cols-2 gap-3 select-none">
                {/* Singer Option */}
                <div
                  onClick={() => setSelectedRole('SINGER')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col items-center text-center gap-2 ${
                    selectedRole === 'SINGER'
                      ? 'bg-purple-950/50 border-purple-500 text-white shadow-md shadow-purple-500/20'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${selectedRole === 'SINGER' ? 'bg-purple-600 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                    <Mic size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-zinc-100 flex items-center justify-center gap-1">
                      Singer / Artist
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
                      Upload and publish songs into website
                    </p>
                  </div>
                </div>

                {/* User / Listener Option */}
                <div
                  onClick={() => setSelectedRole('USER')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col items-center text-center gap-2 ${
                    selectedRole === 'USER'
                      ? 'bg-cyan-950/50 border-cyan-500 text-white shadow-md shadow-cyan-500/20'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${selectedRole === 'USER' ? 'bg-cyan-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                    <Headphones size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-zinc-100 flex items-center justify-center gap-1">
                      User / Listener
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
                      Listen, mood playlists, like & share
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === 'signin' ? (
            /* --- SIGN IN FIELDS --- */
            <div>
              <label className="block mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Username or Email Address
              </label>
              <input
                type="text"
                required
                disabled={loading}
                placeholder="e.g. your_username or artist@gana.fm"
                value={signInIdentifier}
                onChange={(e) => setSignInIdentifier(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-zinc-950/60 border border-zinc-800 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition disabled:opacity-50 text-sm font-semibold"
                autoFocus
              />
              <p className="mt-1.5 text-[10px] text-zinc-500">
                Log in as Singer or Listener to access your library.
              </p>
            </div>
          ) : (
            /* --- SIGN UP FIELDS --- */
            <>
              {/* Email Address */}
              <div>
                <label className="block mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  disabled={loading}
                  placeholder="e.g., user@example.com"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-zinc-950/60 border border-zinc-800 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition disabled:opacity-50 text-sm font-semibold"
                  autoFocus
                />
              </div>

              {/* Username + Suggest */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    {selectedRole === 'SINGER' ? 'Artist / Stage Name' : 'Unique Username'}
                  </label>
                  <button
                    type="button"
                    disabled={loading || suggesting}
                    onClick={handleSuggestUsername}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-extrabold flex items-center gap-1 transition cursor-pointer hover:underline disabled:opacity-50 select-none"
                  >
                    <Sparkles size={10} className="animate-spin-slow" />
                    {suggesting ? 'Generating...' : 'Suggest Name'}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  disabled={loading}
                  placeholder={selectedRole === 'SINGER' ? 'e.g., rockstar_sam' : 'e.g., music_lover'}
                  value={signUpUsername}
                  onChange={(e) => setSignUpUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-zinc-950/60 border border-zinc-800 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition disabled:opacity-50 text-sm font-semibold"
                />
              </div>

              {/* Account Privacy Setting */}
              <div>
                <label className="block mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Account Visibility
                </label>
                <select
                  value={isPrivate ? 'private' : 'public'}
                  disabled={loading}
                  onChange={(e) => setIsPrivate(e.target.value === 'private')}
                  className="w-full px-4 py-3 rounded-lg bg-zinc-950/60 border border-zinc-800 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-sm font-semibold cursor-pointer"
                >
                  <option value="public">🌐 Public Profile (Recommended for discovery)</option>
                  <option value="private">🔒 Private (Requires follow approval to chat)</option>
                </select>
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-red-950/40 border border-red-500/50 text-red-300">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 font-black text-sm text-black bg-purple-500 hover:bg-purple-400 active:scale-95 transition rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-500/20 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>
                  {mode === 'signin' ? 'Signing In...' : `Creating ${selectedRole === 'SINGER' ? 'Singer' : 'User'} Account...`}
                </span>
              </>
            ) : mode === 'signin' ? (
              <>
                <LogIn size={15} />
                <span>Sign In to Gana</span>
              </>
            ) : (
              <>
                <UserPlus size={15} />
                <span>Join as {selectedRole === 'SINGER' ? '🎤 Singer' : '🎧 Listener'}</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Admin Access helper */}
        <div className="mt-4 pt-3 border-t border-zinc-850 flex items-center justify-between text-xs text-zinc-400">
          <p>
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
            <button
              type="button"
              onClick={() => handleSwitchMode(mode === 'signin' ? 'signup' : 'signin')}
              className="font-bold text-purple-400 hover:text-purple-300 hover:underline cursor-pointer ml-1"
            >
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>

          <button
            type="button"
            onClick={handleQuickAdminLogin}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-extrabold flex items-center gap-1 transition cursor-pointer hover:underline"
            title="Log in directly as Master Admin"
          >
            <ShieldCheck size={12} />
            <span>Admin Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
}
