"use client";
import Link from "next/link";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Home, User, LogOut, Menu, X, Rss } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SearchBar from "../search/SearchBar";
import { NotificationBell } from "../notifications/NotificationBell";
import { initializeSocket, disconnectSocket } from "@/lib/socket";

const Header = () => {
  const { user, loading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  // Initialize WebSocket connection for notifications
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      if (token) {
        initializeSocket(token);
      }
    }

    return () => {
      disconnectSocket();
    };
  }, [user]);

  if (loading) return null;

  if (!user) return null;

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 max-w-6xl">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-black text-white rounded-lg px-3 py-2 font-bold">
              S
            </div>
            <span className="text-xl font-bold">Social App</span>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:block flex-1 max-w-lg mx-4">
            <SearchBar />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
                aria-label="Home"
              >
                <Home size={18} />
                <span>Home</span>
              </Button>
            </Link>
            <Link href="/feed">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
                aria-label="Feed"
              >
                <Rss size={18} />
                <span>Feed</span>
              </Button>
            </Link>
            <Link href="/profile">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
                aria-label="Profile"
              >
                <User size={18} />
                <span>Profile</span>
              </Button>
            </Link>

            {/* Notification Bell */}
            <NotificationBell />

            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{user.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-red-600 hover:text-red-700"
                aria-label="Log out"
              >
                <LogOut size={18} />
              </Button>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-white border-t border-gray-200 overflow-hidden"
            >
              <div className="container mx-auto px-4 py-3 flex flex-col space-y-2">
                <div className="mb-4">
                  <SearchBar />
                </div>
                <Link href="/" onClick={toggleMenu}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full flex items-center space-x-2 justify-start"
                    aria-label="Home"
                  >
                    <Home size={18} />
                    <span>Home</span>
                  </Button>
                </Link>
                <Link href="/feed" onClick={toggleMenu}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full flex items-center space-x-2 justify-start"
                    aria-label="Feed"
                  >
                    <Rss size={18} />
                    <span>Feed</span>
                  </Button>
                </Link>
                <Link href="/profile" onClick={toggleMenu}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full flex items-center space-x-2 justify-start"
                    aria-label="Profile"
                  >
                    <User size={18} />
                    <span>Profile</span>
                  </Button>
                </Link>
                <div className="flex items-center space-x-3 py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    logout();
                    toggleMenu();
                  }}
                  className="w-full flex items-center space-x-2 justify-start text-red-600 hover:text-red-700"
                  aria-label="Log out"
                >
                  <LogOut size={18} />
                  <span>Log Out</span>
                </Button>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;
