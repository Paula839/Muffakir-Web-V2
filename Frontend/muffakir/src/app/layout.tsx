'use client';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

import { Inter } from 'next/font/google';
import './styles/globals.css';
import { AnimatePresence } from 'framer-motion';

const inter = Inter({ subsets: ['latin'] });



export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>

      </body>
    </html>
  );
}

// Create this new component in the same file or separate component
function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence mode='wait'>
      <motion.div
        key={usePathname()}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}