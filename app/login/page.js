"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { setCookies } from "@/lib/cookieHelper"

export default function Login() {
  const [credentials, setCredentials] = useState({ email: "", password: "", role: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useAuth()
  const router = useRouter()  
  const [showPassword, setShowPassword] = useState(false)
  const roles = ["superadmin", "Manager", "Chef", "Waiter", "Cleaner", "Security", "Bartender","Receptionist", "Cashier","customer"]

  // const handleSubmit = async (e) => {
  //   e.preventDefault()
  //   console.warn(`Submitting login for: ${credentials.email} ${credentials.password}`)
  //   setLoading(true)
  //   setError("")

  //   const result = await login(credentials.email, credentials.password)

  //   if (result.success) {
  //     router.push("/")
  //   } else {
  //     setError(result.error)
  //   }

  //   setLoading(false)
  // }
  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");
  const endpoint = credentials.role === "superadmin" ? "/api/auth/superadmin" : "/api/auth/login";
  const result = await login(credentials.email, credentials.password, credentials.role,endpoint);
   // 🔍 Check if user exists AND status is active
  if (!result.success) {
    setError(result.error || "Login failed");
    setLoading(false);
    return;
  }

  if (result.user?.status !== "active" && credentials.role !== "superadmin" ) {
    setError("Your account is not active. Please contact admin.");
    setLoading(false);
    return;
  }

  // ✅ User is active, proceed with login
  if (result.token) {
    localStorage.setItem("hotel_pos_jwt", result.token);
    setCookies("hotel_pos_jwt", result.token, Date.now() + 1*24*60*60*1000);
    router.push("/");
  } else {
    setError(result.error || "Token not generated Something went wrong.");
  }

  // if (result.success && result.token) {
  //   localStorage.setItem("hotel_pos_jwt", result.token);
  //   setCookies("hotel_pos_jwt", result.token, Date.now() + 1*24*60*60*1000);
  //   router.push("/");
  // } else {
  //   setError(result.error);
  // }
  setLoading(false);
};

// New function: Clear cache and hard reload
  const handleClearCacheAndReload = () => {
    // Clear localStorage
    localStorage.clear();

    // Clear all cookies (client-side only – HttpOnly cookies can't be cleared this way, but most auth cookies are not HttpOnly in dev)
    document.cookie.split(";").forEach((cookie) => {
      const [name] = cookie.split("=");
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });

    // Hard reload (bypasses service worker cache and forces fresh load)
    window.location.reload(true); // Note: reload(true) is deprecated, but still works in most browsers
    // Alternative modern way (same effect):
    // window.location.href = window.location.href;
  };




  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Hotel POS System</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Sign in to your account</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={credentials.email}
              // onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                onChange={(e) =>
    setCredentials({
      ...credentials,
      email: e.target.value.replace(/\s+/g, "") // remove all spaces
    })
  }
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Enter your email"
            />
          </div>
          {/* <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Enter your password"
            />
          </div> */}
<div>
  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
    Password
  </label>
  <div className="relative">
    <input
      id="password"
      name="password"
      type={showPassword ? "text" : "password"}
      required
      value={credentials.password}
      // onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
        onChange={(e) =>
    setCredentials({
      ...credentials,
      password: e.target.value.replace(/\s+/g, "") // remove all spaces
    })
  }
      className="mt-1 appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
      placeholder="Enter your password"
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
      tabIndex={-1}
    >
      {showPassword ? (
        // 👁 eye-open icon
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ) : (
        // 👁 eye-slash icon
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.933-4.411m3.066-2.01A9.973 9.973 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.954 9.954 0 01-4.155 5.309M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 3l18 18" />
        </svg>
      )}
    </button>
  </div>
</div>


  <div>
      <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
      <select
        id="role"
        value={credentials.role}
        onChange={(e) => setCredentials({ ...credentials, role: e.target.value })}
        className="mt-1 appearance-none cursor-pointer relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
        required
      >
        <option value="" className="text-gray-700 cursor-pointer">Select Role</option>
        {roles.map((role) => (
          <option key={role} value={role}>{role}</option>
        ))}
        {/* <option value="" className="text-gray-700 cursor-pointer">Select Role</option>
        <option value="superadmin">SuperAdmin</option>
        <option value="Staff">Staff</option> */}
      </select>
    </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

{/* NEW: Clear Cache & Hard Reload Button */}
          <div className="pt-4">
            <button
              type="button"
              onClick={handleClearCacheAndReload}
              className="w-full flex justify-center py-2 px-4 border border-red-600 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
            >
              Clear Cache & Hard Reload
            </button>
            <p className="mt-2 text-center text-xs text-gray-500">
              Use this if you're stuck after logout or seeing old data
            </p>
          </div>

          {/* <div className="text-center">
            <p className="text-sm text-gray-600">Demo credentials: admin@hotel.com / admin123</p>
          </div> */}
          
        </form>
      </div>
    </div>
  )
}
