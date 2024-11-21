"use client"
import Link from 'next/link';
import { useState } from 'react';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/10 backdrop-blur-lg border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="text-white font-bold text-xl">Brand</div>
          
          <div className="hidden md:flex items-center space-x-8">
            {/* Updated navigation links */}
            <Link 
              href="/" 
              className="text-white/80 hover:text-white transition-colors duration-200"
            >
              Home
            </Link>
            <Link 
              href="/about"
              className="text-white/80 hover:text-white transition-colors duration-200"
            >
              About Us
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white focus:outline-none"
            >
              {/* Icon for mobile menu */}
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <Link 
              href="/"
              className="block px-4 py-2 text-white/80 hover:text-white transition-colors duration-200"
            >
              Home
            </Link>
            <Link 
              href="/about"
              className="block px-4 py-2 text-white/80 hover:text-white transition-colors duration-200"
            >
              About Us
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;