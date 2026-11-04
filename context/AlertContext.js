"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from "lucide-react"

const AlertContext = createContext()

export function AlertProvider({ children }) {
  const [alert, setAlert] = useState(null)

  const showAlert = useCallback((type, title, description, buttons) => {
    setAlert({ type, title, description, buttons })
  }, [])

  const hideAlert = () => setAlert(null)

  // ✅ Prevent body scroll when alert is visible
// useEffect(() => {
//   if (alert) {
//     const scrollY = window.scrollY
//     document.body.style.position = "fixed"
//     document.body.style.top = `-${scrollY}px`
//     document.body.style.width = "100%"
//     document.body.style.overflowY = "scroll" // ensures scrollbar is still visible
//   } else {
//     const scrollY = document.body.style.top
//     document.body.style.position = ""
//     document.body.style.top = ""
//     document.body.style.width = ""
//     document.body.style.overflowY = ""
//     window.scrollTo(0, parseInt(scrollY || "0") * -1) // restore scroll position
//   }

//   return () => {
//     document.body.style.position = ""
//     document.body.style.top = ""
//     document.body.style.width = ""
//     document.body.style.overflowY = ""
//   }
// }, [alert])


  const getIcon = () => {
    switch (alert?.type) {
      case "success":
        return <CheckCircle className="w-10 h-10 text-green-500" /> 
      case "warning":
        return <AlertTriangle className="w-10 h-10 text-yellow-500" />
      case "error":
        return <XCircle className="w-10 h-10 text-red-500" />
      case "question":
        return <HelpCircle className="w-10 h-10 text-blue-500" />
      default:
        return null
    }
  }

  const renderButtons = () => {
    const buttons =
      alert?.buttons && alert.buttons.length > 0
        ? alert.buttons
        : [{ text: "Okay", onPress: null }]

    return buttons.map((btn, idx) => (
      <button
        key={idx}
        onClick={() => {
          if (btn.onPress) btn.onPress()
          hideAlert()
        }}
        className={`px-4 py-2 rounded text-sm font-medium ${
          idx === 0
            ? "bg-orange-500 text-white hover:bg-orange-600"
            : "border border-gray-300 text-gray-700 hover:bg-gray-50"
        }`}
      >
        {btn.text}
      </button>
    ))
  }

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}

      {alert && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded shadow-lg md:max-w-md p-6 mx-4">
            <div className="flex flex-col items-center text-center space-y-4">
              {getIcon()}
              <h2 className="text-lg font-semibold text-gray-900">{alert.title}</h2>
              {alert.description && (
                <p className="text-sm text-gray-600">{alert.description}</p>
              )}
            </div>

            <div className="flex justify-center space-x-3 mt-6">{renderButtons()}</div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  )
}

export function useAlert() {
  return useContext(AlertContext)
}


// "use client"

// import React, { createContext, useContext, useState, useCallback } from "react"
// import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from "lucide-react"

// const AlertContext = createContext()

// export function AlertProvider({ children }) {
//   const [alert, setAlert] = useState(null)

//   const showAlert = useCallback((type, title, description, buttons) => {
//     setAlert({ type, title, description, buttons })
//   }, [])

//   const hideAlert = () => setAlert(null)

//   const getIcon = () => {
//     switch (alert?.type) {
//       case "success":
//         return <CheckCircle className="w-10 h-10 text-green-500" />
//       case "warning":
//         return <AlertTriangle className="w-10 h-10 text-yellow-500" />
//       case "error":
//         return <XCircle className="w-10 h-10 text-red-500" />
//       case "question":
//         return <HelpCircle className="w-10 h-10 text-blue-500" />
//       default:
//         return null
//     }
//   }

//   // Default to 1 button if none provided
//   const renderButtons = () => {
//     const buttons = alert?.buttons && alert.buttons.length > 0
//       ? alert.buttons
//       : [{ text: "Okay", onPress: null }]

//     return buttons.map((btn, idx) => (
//       <button
//         key={idx}
//         onClick={() => {
//           if (btn.onPress) btn.onPress()
//           hideAlert()
//         }}
//         className={`px-4 py-2 rounded text-sm font-medium ${
//           idx === 0
//             ? "bg-orange-500 text-white hover:bg-orange-600"
//             : "border border-gray-300 text-gray-700 hover:bg-gray-50"
//         }`}
//       >
//         {btn.text}
//       </button>
//     ))
//   }

//   return (
//     <AlertContext.Provider value={{ showAlert, hideAlert }}>
//       {children}

//       {alert && (
//          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
//            <div className="bg-white rounded-lg shadow-lg md:max-w-md p-6 mx-4">
//              <div className="flex flex-col items-center text-center space-y-4">
//                {getIcon()}
//                <h2 className="text-lg font-semibold text-gray-900">{alert.title}</h2>
//                {alert.description && <p className="text-sm text-gray-600">{alert.description}</p>}
//              </div>
           
//              <div className="flex justify-center space-x-3 mt-6">
//                {renderButtons()}
//              </div>
//            </div>
//          </div>
//        )}
//     </AlertContext.Provider>
//   )
// }

// export function useAlert() {
//   return useContext(AlertContext)
// }
