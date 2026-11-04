"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function useAuthToken() {
  const [token, setToken] = useState(null);
  const router = useRouter();
  const pathname = usePathname(); // ← Add this

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = localStorage.getItem("hotel_pos_jwt");

    if (stored) {
      setToken(stored);
    }else{
      if (!pathname?.startsWith("/customer") && !pathname?.startsWith("/account")) {
        router.push("/login");
      }
    }
  }, [router, pathname]);

  return token;
}

export default useAuthToken;
