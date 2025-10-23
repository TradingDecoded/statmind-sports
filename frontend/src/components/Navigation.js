'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import SMSBucksDisplay from './SMSBucksDisplay';

export default function Navigation({ onFeedbackClick }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isStatsMenuOpen, setIsStatsMenuOpen] = useState(false);
  const statsMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const { user, logout } = useAuth();

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      // Close stats menu if clicking outside
      if (statsMenuRef.current && !statsMenuRef.current.contains(event.target)) {
        setIsStatsMenuOpen(false);
      }
      // Close user menu if clicking outside
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Simplified main navigation links
  const mainLinks = [
    { href: '/', label: 'Home' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/predictions', label: 'Predictions' },
  ];

  // Stats dropdown links
  const statsLinks = [
    { href: '/results', label: 'Results' },
    { href: '/analytics', label: 'Analytics' },
    { href: '/accuracy', label: 'Accuracy' },
  ];

  // User-only links (shown when authenticated)
  const userLinks = user ? [
    { href: '/parlay-builder', label: 'Create Parlay' },
    { href: '/leaderboard', label: '🏆 Leaderboard' },
    ...(user.is_admin ? [{ href: '/admin', label: '⚙️ Admin' }] : []),
  ] : [];

  const handleFeedbackClick = () => {
    if (onFeedbackClick) {
      onFeedbackClick();
    }
    setIsMenuOpen(false); // Close mobile menu if open
  };

  return (
    <nav className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-lg leading-tight">StatMind</span>
              <span className="text-emerald-400 text-xs leading-tight">Sports</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Main Links */}
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === link.href
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Stats Dropdown */}
            <div className="relative" ref={statsMenuRef}>
              <button
                onClick={() => setIsStatsMenuOpen(!isStatsMenuOpen)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1 ${
                  statsLinks.some(link => pathname === link.href)
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <span>Stats</span>
                <svg className={`w-4 h-4 transition-transform ${isStatsMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isStatsMenuOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-1 z-50">
                  {statsLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsStatsMenuOpen(false)}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        pathname === link.href
                          ? 'bg-emerald-500 text-white'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* User Links (only if logged in) */}
            {userLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === link.href
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* FEEDBACK BUTTON - NEW! */}
            <button
              onClick={handleFeedbackClick}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center space-x-1"
            >
              <span>💬</span>
              <span>Feedback</span>
            </button>

            {/* Right side - Auth buttons / User menu */}
            <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-slate-700">
              {user ? (
                <>
                  <SMSBucksDisplay />
                  <NotificationBell />
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-200"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {user.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <span className="hidden lg:inline">{user.username}</span>
                      <svg className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-1 z-50">
                        <Link
                          href="/my-parlays"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                          My Parlays
                        </Link>
                        <Link
                          href={`/profile/${user.username}`}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                          Profile
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setIsUserMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-slate-700 transition-colors"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/50 transition-all duration-200"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {user && (
              <>
                <SMSBucksDisplay />
                <NotificationBell />
              </>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-300 hover:text-white p-2"
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t border-slate-700 mt-2">
            <div className="flex flex-col space-y-1 pt-2">
              {/* Main Links */}
              {mainLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                    pathname === link.href
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* User Links (only if logged in) */}
              {userLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                    pathname === link.href
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Stats Section */}
              <div className="border-t border-slate-700 pt-2 mt-2">
                <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Statistics
                </p>
                {statsLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                      pathname === link.href
                        ? 'bg-emerald-500 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* FEEDBACK BUTTON - MOBILE - NEW! */}
              <div className="border-t border-slate-700 pt-2 mt-2">
                <button
                  onClick={handleFeedbackClick}
                  className="w-full px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center space-x-2"
                >
                  <span>💬</span>
                  <span>Send Feedback</span>
                </button>
              </div>

              {/* Mobile Auth Section */}
              <div className="border-t border-slate-700 pt-2 mt-2">
                {user ? (
                  <>
                    <Link
                      href="/my-parlays"
                      onClick={() => setIsMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-200 block"
                    >
                      My Parlays
                    </Link>
                    <Link
                      href={`/profile/${user.username}`}
                      onClick={() => setIsMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-200 block"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg text-base font-medium text-red-400 hover:text-red-300 hover:bg-slate-700 transition-all duration-200"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-200 block"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-base font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-all duration-200 block text-center"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}