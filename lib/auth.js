"use client";

// import { cookies } from "next/headers";
import { useState, useEffect, createContext, useContext } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("hotel_pos_user");
      if (!stored || stored === "undefined") {
        localStorage.removeItem("hotel_pos_user");
        setLoading(false);
        return;
      }
      setUser(JSON.parse(stored));
    } catch (err) {
      console.error("Invalid stored user → cleared", err);
      localStorage.removeItem("hotel_pos_user");
    } finally {
      setLoading(false);
    }
  }, []);

    const login = async (email, password, role) => {
      try {
        const endpoint =
          role === "superadmin" ? "/api/auth/superadmin" : "/api/auth/login";
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role }),
        });

        if (response.ok) {
          const data = await response.json();
          const { user, token } = data;


          // Store JWT inside user
          setUser({ ...user, token });
          localStorage.setItem(
            "hotel_pos_user",
            JSON.stringify({ ...user, token })
          );

          return { success: true, user, token: token };
        } else {
          const err = await response.json();
          return { success: false, error: err.error || "Invalid credentials" };
        }
      } catch (error) {
        // return { success: false, error: "Login failed from auth" };
        console.error("LOGIN ERROR Login:", error);
    return NextResponse.json({
      error: "Login failed",
      detail: error.message,
      stack: error.stack
    }, { status: 500 });
      }
    };

  // const logout = () => {
  //   setUser(null);
  //   localStorage.removeItem("hotel_pos_user");
  // };

  // const hasPermission = (permission) => {
  //   if (!user || !user.permissions) return false;
  //   if (user.role === "superadmin" || user.isSuperAdmin || user.permissions.includes("*")) return true;
  //   return user.permissions.includes(permission) || user.role === "Manager";
  // };
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout API call failed:", err);
    }

    setUser(null);
    localStorage.removeItem("hotel_pos_user");
    document.cookie = "hotel_pos_auth=; path=/; max-age=0";
  };

  // const hasPermission = (permission) => {
  // const hasPermission = (user, permission) => {
  //   if (!user || !user.permissions) return false;
  //   // SuperAdmin or wildcard (*) permission has access to everything
  //   if (
  //     user.role === "superadmin" ||
  //     user.isSuperAdmin ||
  //     user.permissions.includes("*")
  //   )
  //     return true;
  //   // Check specific permission or Manager role
  //   return user.permissions.includes(permission);
  // };

  const hasPermission = (user, permission) => {
  if (!user || !user.permissions) return false

  if (user.permissions.includes("*")) return true  // <-- superadmin

  if (Array.isArray(permission)) {
    return permission.some(p => user.permissions.includes(p))
  }

  return user.permissions.includes(permission)
}

  return (
    <AuthContext.Provider
      value={{ user, login, logout, hasPermission, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// "use client"

// import { useState, useEffect, createContext, useContext } from "react"

// const AuthContext = createContext()

// export const useAuth = () => {
//   const context = useContext(AuthContext)
//   if (!context) {
//     throw new Error("useAuth must be used within an AuthProvider")
//   }
//   return context
// }

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null)
//   const [loading, setLoading] = useState(true)

//   // useEffect(() => {
//   //   // Check for stored user session
//   //   const storedUser = localStorage.getItem("hotel_pos_user")
//   //   if (storedUser) {
//   //     setUser(JSON.parse(storedUser))
//   //   }
//   //   setLoading(false)
//   // }, [])
//   useEffect(() => {
//   try {
//     const stored = localStorage.getItem("hotel_pos_user");

//     // If null → do nothing
//     if (!stored) {
//       setLoading(false);
//       return;
//     }

//     // If value is literally "undefined"
//     if (stored === "undefined") {
//       localStorage.removeItem("hotel_pos_user");
//       setLoading(false);
//       return;
//     }

//     // Safe JSON.parse
//     setUser(JSON.parse(stored));
//   } catch (err) {
//     console.error("Invalid stored user → cleared", err);
//     localStorage.removeItem("hotel_pos_user");
//   } finally {
//     setLoading(false);
//   }
// }, []);

//   // const login = async (email, password) => {
//   //   try {
//   //     const response = await fetch("/api/auth/login", {
//   //       method: "POST",
//   //       headers: {
//   //         "Content-Type": "application/json",
//   //       },
//   //       body: JSON.stringify({ email, password }),
//   //     })

//   //     if (response.ok) {
//   //       const userData = await response.json()
//   //       setUser(userData.user)
//   //       localStorage.setItem("hotel_pos_user", JSON.stringify(userData.user))
//   //       return { success: true }
//   //     } else {
//   //       return { success: false, error: "Invalid credentials" }
//   //     }
//   //   } catch (error) {
//   //     return { success: false, error: "Login failed" }
//   //   }
//   // }
//   const login = async (email, password, role) => {
//   try {
//     const endpoint = role === "superadmin" ? "/api/auth/superadmin" : "/api/auth/login";
//     const response = await fetch(endpoint, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ email, password, role }),
//     });
//     if (response.ok) {
//       const data = await response.json();
//       const { user, token } = data;  // <-- token from API
//       setUser({...user, token});
//       localStorage.setItem("hotel_pos_user", JSON.stringify({...user,token}));
//       // document.cookie = `hotel_pos_auth=${encodeURIComponent(JSON.stringify({ role: data.user.role }))}; path=/; max-age=86400`;
//       return { success: true };
//     } else {
//       return { success: false, error: "Invalid credentials" };
//     }
//   } catch (error) {
//     return { success: false, error: "Login failed" };
//   }
// };

//   const logout = () => {
//     setUser(null)
//     localStorage.removeItem("hotel_pos_user")
//     document.cookie = "hotel_pos_auth=; path=/; max-age=0"
//   }

//   const hasPermission = (permission) => {
//     if (!user || !user.permissions) return false

//     // SuperAdmin or users with wildcard permission have access to everything
//     if (user.role === "superadmin" || user.isSuperAdmin || user.permissions.includes("*")) {
//       return true
//     }

//     // Check specific permission or Manager role
//     return user.permissions.includes(permission) || user.role === "Manager"
//   }

//   const value = {
//     user,
//     login,
//     logout,
//     hasPermission,
//     loading,
//   }

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
// }
