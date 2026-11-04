"use client"

import { createContext, useState, useContext, useEffect } from 'react'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Get the language from localStorage or use default
    const storedLanguage = localStorage.getItem('hotel_language')
    if (storedLanguage) {
      setLanguage(storedLanguage)
    } else {
      // Try to get from settings API
      // fetch('/api/settings')
      //   .then(response => response.json())
      //   .then(data => {
      //     if (data.defaultLanguage) {
      //       setLanguage(data.defaultLanguage)
      //       localStorage.setItem('hotel_language', data.defaultLanguage)
      //     }
      //   })
      //   .catch(error => console.error('Error fetching default language:', error))
      fetch('/api/settings')
  .then(async response => {
    const text = await response.text()
    console.log('API response:', text)
    return JSON.parse(text)
  })
  .then(data => {
    if (data.defaultLanguage) {
      setLanguage(data.defaultLanguage)
      localStorage.setItem('hotel_language', data.defaultLanguage)
    }
  })
  .catch(error => console.error('Error fetching default language:', error))

    }
    setIsLoaded(true)
  }, [])

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'ja' : 'en'
    setLanguage(newLanguage)
    localStorage.setItem('hotel_language', newLanguage)
  }

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, isLoaded }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}