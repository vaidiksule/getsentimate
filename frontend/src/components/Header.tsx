"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, X, Menu, LogOut, LayoutDashboard, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { checkAuth, logout, type User as UserType } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
  const pathname = usePathname();
  const [showToast, setShowToast] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await checkAuth();
        setUser(userData);
      } catch (error) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      setUser(null);
      window.location.href = "/";
    }
  };

  const showNotification = () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const navLink = (href: string, label: string) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={`text-secondary transition-all hover:text-black ${isActive ? "font-bold underline underline-offset-8 decoration-2" : "font-normal"
          }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <>
      <header className="h-[64px] border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 active:scale-95 transition-all">
            <div className="flex h-8 w-8 items-center justify-center rounded-button bg-black">
              <img src="/logo.svg" alt="" className="h-5 w-5 invert" />
            </div>
            <span className="text-emphasis font-bold tracking-tight text-black">GetSentimate</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {user ? (
              <>
                {navLink("/analysis", "Analysis")}
                {navLink("/transactions", "Credits")}
                <button
                  onClick={handleLogout}
                  className="text-secondary hover:text-red-primary transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                <div className="h-4 w-[1px] bg-gray-200 mx-2" />
                <div className="flex items-center gap-4">
                  <span className="badge-green">
                    {user.credits} credits
                  </span>
                  <Link href="/transactions" className="btn-credits py-2 text-secondary">
                    Add Credits
                  </Link>
                </div>
              </>
            ) : (
              <>
                {navLink("/pricing", "Pricing")}
                <Link href="/login" className="btn-primary py-2 text-secondary">
                  Login
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-black"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="md:hidden absolute top-[64px] left-0 right-0 border-b border-gray-200 bg-white px-6 py-6 shadow-sm"
            >
              <nav className="flex flex-col gap-6">
                {user ? (
                  <>
                    <Link href="/analysis" onClick={() => setIsMobileMenuOpen(false)} className="text-emphasis font-medium">Analysis</Link>
                    <Link href="/transactions" onClick={() => setIsMobileMenuOpen(false)} className="text-emphasis font-medium">Credits</Link>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="badge-green">{user.credits} credits</span>
                      <Link href="/transactions" onClick={() => setIsMobileMenuOpen(false)} className="btn-credits py-2 px-8">Add Credits</Link>
                    </div>
                    <button onClick={handleLogout} className="text-left text-red-primary font-medium">Logout</button>
                  </>
                ) : (
                  <>
                    <Link href="/pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-emphasis font-medium">Pricing</Link>
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary w-full">Login</Link>
                  </>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translateX-1/2 z-[100]"
          >
            <div className="flex items-center gap-3 rounded-button bg-black px-6 py-3 text-white shadow-lg">
              <Check className="h-4 w-4 text-green-primary" />
              <span className="text-secondary font-medium">Link copied to clipboard</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
