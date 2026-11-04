"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/language-context'
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

export default function Footer() {
  const [settings, setSettings] = useState(null)
  const { language } = useLanguage()

  useEffect(() => {
    // Mock settings data with more comprehensive information
    const mockSettings = {
      hotelName: "Hotel-POS",
      hotelNameJa: "ホテルPOS",
      hotelGroup: "Hotel-POS Management Group",
      hotelGroupJa: "ホテルPOSマネジメントグループ",
      currency: "INR",
      addresses: [
        {
          location: "Central Hub",
          email: "support@hotel-pos.com",
          phone: "+91-9871713242",
          address: "Sector 30, Commercial District, City Hub 122001"
        },
        {
          location: "Downtown Branch",
          email: "downtown@hotel-pos.com", 
          phone: "+91-9978662828",
          address: "Main Plaza Avenue, Downtown, 382120"
        }
      ],
      socialMedia: {
        facebook: "https://facebook.com/hotelpos",
        instagram: "https://instagram.com/hotelpos",
        twitter: "https://twitter.com/hotelpos",
        youtube: "https://youtube.com/hotelpos"
      },
      contactInfo: {
        reservations: "+91-9871713242",
        concierge: "+91-9978662828",
        emergencyContact: "+81-120-911-911"
      }
    }

    // Simulate API call delay
    setTimeout(() => {
      setSettings(mockSettings)
    }, 500)
  }, [])

  if (!settings) {
    return (
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-6 bg-gray-600 rounded w-32 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-600 rounded w-24"></div>
                  <div className="h-4 bg-gray-600 rounded w-28"></div>
                  <div className="h-4 bg-gray-600 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-5 border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Hotel Info */}
          {/* <div className="lg:col-span-1">
            <div className="flex items-center justify-center">
              <div className="w-auto h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg mr-3 flex items-center justify-center px-2">
                <span className="text-white font-bold text-sm">アジュ</span>
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                {language === 'en' ? settings.hotelName : settings.hotelNameJa}
              </h3>
            </div>
          </div> */}


          {/* Contact & Social */}
          <div className='w-[45vw] flex justify-center items-center rounded-lg p-4 lg:col-span-1'>
            
            <div className='flex justify-center items-center flex-col'>
            <h3 className="text-lg font-semibold mb-2 flex items-center justify-center">
              {/* <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span> */}
              {language === 'en' ? 'Contact & Social' : 'お問い合わせ・SNS'}
            </h3>
            
            {/* Contact Numbers */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-1 text-center">
                {language === 'en' ? '24/7 Hotlines' : '24時間ホットライン'}
              </h4>
              <div className="space-y-1">
                <a href={`tel:${settings.contactInfo.reservations}`} className="text-xs text-gray-400 hover:text-pink-300 transition-colors block">
                  📞 {language === 'en' ? 'Reservations: ' : '予約: '}{settings.contactInfo.reservations}
                </a>
                <a href={`tel:${settings.contactInfo.concierge}`} className="text-xs text-gray-400 hover:text-pink-300 transition-colors block">
                  🛎️ {language === 'en' ? 'Concierge: ' : 'コンシェルジュ: '}{settings.contactInfo.concierge}
                </a>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2 text-center">
                {language === 'en' ? 'Follow Us' : 'フォロー'}
              </h4>
             <div className="flex space-x-4">
              <a
                href={settings.socialMedia.facebook}
                className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors duration-200 group"
                aria-label="Facebook"
              >
                <Facebook className="text-white w-4 h-4 group-hover:scale-110 transition-transform" />
              </a>
          
              <a
                href={settings.socialMedia.instagram}
                className="w-9 h-9 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center hover:from-pink-600 hover:to-purple-700 transition-all duration-200 group"
                aria-label="Instagram"
              >
                <Instagram className="text-white w-4 h-4 group-hover:scale-110 transition-transform" />
              </a>
          
              <a
                href={settings.socialMedia.twitter}
                className="w-9 h-9 bg-blue-400 rounded-lg flex items-center justify-center hover:bg-blue-500 transition-colors duration-200 group"
                aria-label="Twitter"
              >
                <Twitter className="text-white w-4 h-4 group-hover:scale-110 transition-transform" />
              </a>
          
              <a
                href={settings.socialMedia.youtube}
                className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center hover:bg-red-700 transition-colors duration-200 group"
                aria-label="YouTube"
              >
                <Youtube className="text-white w-4 h-4 group-hover:scale-110 transition-transform" />
              </a>
            </div>
            </div>
            </div>

          </div>

        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-3 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-400">
                &copy; {new Date().getFullYear()} {settings.hotelName}. {language === 'en' ? 'All rights reserved.' : '全著作権所有。'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'en' 
                  ? 'Crafted with care for exceptional experiences.' 
                  : '特別な体験のために心を込めて作られました。'
                }
              </p>
            </div>
            
            <div className="flex space-x-6 text-xs">
              <Link href="/privacy" className="text-gray-400 hover:text-pink-300 transition-colors">
                {language === 'en' ? 'Privacy Policy' : 'プライバシーポリシー'}
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-pink-300 transition-colors">
                {language === 'en' ? 'Terms of Service' : '利用規約'}
              </Link>
              <Link href="/accessibility" className="text-gray-400 hover:text-pink-300 transition-colors">
                {language === 'en' ? 'Accessibility' : 'アクセシビリティ'}
              </Link>
            </div>
          </div>
          
          {/* Decorative Element */}
          <div className="flex justify-center mt-6">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-pink-500 rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}