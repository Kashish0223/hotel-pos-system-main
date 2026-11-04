"use client"

import React, { createContext, useContext, useState } from "react";

// Shape of the context value
// { orderHistory: Array, setOrderHistory: Function }
const OrdersContext = createContext(null);

export function OrdersProvider({ children }) {
  const [orderHistory, setOrderHistory] = useState([]);

  const value = {
    orderHistory,
    setOrderHistory,
  };

  return (
    <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) {
    throw new Error("useOrders must be used within an OrdersProvider");
  }
  return ctx;
}