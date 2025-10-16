'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  
  const publicLinks = [
    { href: '/', label: 'Home' },
    { href: '/predictions', label: 'Predictions' },
    { href: '/results', label: 'Results' },
    { href: '/analytics', label: 'Analytics' },
    { href: '/accuracy', label: 'Accuracy' },
    { href: '/how-it-works', label: 'How It Works' },
  ];

  const userLinks = [
    { href: '/parlay-builder', label: 'Parlay Builder' },
    { href: '/my-parlays', label: 'My Parlays' },
  ];
  
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
            {publicLinks.map((link) => (
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

            {/* Conditional User Links */}
            {user && userLinks.map((link) => (
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

            {/* Auth Buttons */}
            {user ? (
              // User Menu
              <div className="relative ml-3">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span>{user.displayName || user.username}</span>
                  <svg className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50">
                    <div className="px-4 py-2 border-b border-slate-700">
                      <p className="text-sm font-medium text-white">{user.displayName || user.username}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                    <Link
                      href={`/profile/${user.username}`}
                      className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/my-parlays"
                      className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      My Parlays
                    </Link>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Login/Register Buttons
              <div className="flex items-center space-x-2 ml-3">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-200"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-300 hover:text-white p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg"
              aria-label="Toggle mobile menu"
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
              {publicLinks.map((link) => (
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

              {user && userLinks.map((link) => (
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

              {/* Mobile Auth Section */}
              <div className="border-t border-slate-700 pt-2 mt-2">
                {user ? (
                  <>
                    <div className="px-4 py-2">
                      <p className="text-sm font-medium text-white">{user.displayName || user.username}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                    <Link
                      href={`/profile/${user.username}`}
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-3 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700"
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg text-base font-medium text-red-400 hover:text-red-300 hover:bg-slate-700"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-3 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-3 rounded-lg text-base font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
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