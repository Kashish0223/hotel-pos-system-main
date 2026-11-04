import "./globals.css"
import { AuthProvider } from "@/lib/auth"
import { LanguageProvider } from "@/lib/language-context"
import Footer from "@/components/Footer"
import { CartProvider } from '@/context/CartContext';
import { OrdersProvider } from '@/context/OrdersContext';
import { Poppins } from 'next/font/google'
import TranslateWidget from "@/components/TranslateWidget"
import {AlertProvider} from "@/context/AlertContext"
import PushNotificationManager from "@/components/PushNotificationManager"
import PWAInstallPrompt from "@/components/PWAInstallPrompt"
import { Divide } from "lucide-react";
import Head from "next/head";

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'], // Add the weights you need
})

export const metadata = {
  title: "Hotel-POS - Management System",
  description: "Point of Sale system for Hotel-POS F&B",
  generator: 'v0.dev',
  manifest: '/manifest.json',
  icons: {
    apple: '/images/logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hotel POS',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`bg-gray-50 flex flex-col min-h-screen ${poppins.className}`}>
      {/* <body className={`bg-gray-50 flex flex-col min-h-screen`}> */}
        <AuthProvider>
          <PushNotificationManager />
          <PWAInstallPrompt />
          <LanguageProvider>
            <AlertProvider>
          <CartProvider>
            <OrdersProvider>
              <main className="flex-grow">
                {children}
              </main>
            </OrdersProvider>
            </CartProvider>
            </AlertProvider>
            {/* <Footer /> */}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}


