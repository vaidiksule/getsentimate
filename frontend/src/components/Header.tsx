"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Check, X, Menu } from "lucide-react";
import { useState } from "react";

export function Header() {
  const pathname = usePathname();
  const isAnalysis = pathname === "/analysis";
  const isPricing = pathname === "/pricing";
  const [showToast, setShowToast] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'GetSentimate - YouTube Comments Intelligence',
          text: 'Analyze YouTube comments with AI-powered sentiment analysis and actionable insights.',
          url: window.location.origin
        });
      } catch (error) {
        // Fallback to clipboard if user cancels or share fails
        handleCopyLink();
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      showNotification();
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = window.location.origin;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showNotification();
    }
  };

  const showNotification = () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  return (
    <>
      <header className="border-b border-neutral-200/80 bg-white/90 backdrop-blur-lg shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-24 py-4">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg transition-all duration-300 group-hover:scale-105">
            <img 
              src="/logo.svg" 
              alt="GetSentimate Logo" 
              className="h-8 w-8 sm:h-12 sm:w-12"
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs sm:text-sm font-semibold text-neutral-900">GetSentimate</span>
            <span className="text-xs text-neutral-500 hidden sm:block">YouTube comments intelligence</span>
          </div>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <Link
            href="/analysis"
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
              isAnalysis 
                ? "bg-neutral-900 text-white shadow-md" 
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            }`}
          >
            <Zap className="w-4 h-4" />
            Analysis
          </Link>
          
          <Link
            href="/pricing"
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
              isPricing 
                ? "bg-neutral-900 text-white shadow-md" 
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            }`}
          >
            Pricing
          </Link>
          
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            Share
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden flex items-center justify-center p-2 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <Menu className="w-5 h-5 text-neutral-900" />
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200/80 bg-white/90 backdrop-blur-lg">
          <nav className="flex flex-col px-4 py-4 space-y-2">
            <Link
              href="/analysis"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isAnalysis 
                  ? "bg-neutral-900 text-white shadow-md" 
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              <Zap className="w-4 h-4" />
              Analysis
            </Link>
            
            <Link
              href="/pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isPricing 
                  ? "bg-neutral-900 text-white shadow-md" 
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              Pricing
            </Link>
            
            <button 
              onClick={() => {
                handleShare();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              Share
            </button>
          </nav>
        </div>
      )}
    </header>

    {/* Toast Notification */}
    {showToast && (
      <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300">
        <div className="flex items-center gap-3 rounded-lg bg-neutral-900 px-4 py-3 shadow-lg">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
            <Check className="h-3 w-3 text-white" />
          </div>
          <span className="text-sm font-medium text-white">Link copied to clipboard!</span>
          <button
            onClick={() => setShowToast(false)}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )}
  </>
  );
}
