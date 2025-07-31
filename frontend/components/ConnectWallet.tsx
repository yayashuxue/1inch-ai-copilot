"use client";

import { usePrivySafe } from "./usePrivySafe";
import { motion } from "framer-motion";
import { Wallet, LogOut } from "lucide-react";

export function ConnectWallet() {
  const { ready, authenticated, user, login, logout } = usePrivySafe();

  if (!ready) {
    return (
      <div className="animate-pulse bg-gray-800 h-8 sm:h-10 w-24 sm:w-32 rounded-lg"></div>
    );
  }

  if (authenticated && user) {
    return (
      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="hidden sm:block text-sm text-gray-300">
          {user.wallet?.address
            ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(
                -4
              )}`
            : user.email?.address || "Connected"}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={logout}
          className="flex items-center space-x-1 sm:space-x-2 glass text-white px-2 sm:px-4 py-2 rounded-lg hover:bg-white/10 transition-all text-sm min-h-[36px] sm:min-h-[40px]"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:block">Disconnect</span>
        </motion.button>
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={login}
      className="flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base min-h-[36px] sm:min-h-[48px]"
    >
      <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
      <span className="hidden sm:block">Connect</span>
    </motion.button>
  );
}
