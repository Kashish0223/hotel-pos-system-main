"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FaMoneyBillWave, FaCcVisa, FaBitcoin, FaWallet, FaSpinner } from "react-icons/fa";
import {
  Vault,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  X,
  Plus,
  Coins,
  FileText
} from "lucide-react";
import { useAlert } from "@/context/AlertContext";
import { useAuth } from "@/lib/auth";
import { useAuthToken } from "@/lib/useAuthToken";

export default function Settlements() {
  const { showAlert } = useAlert();
  const { user, hasPermission } = useAuth();
  const token = useAuthToken();

  // Primary Tab: "shifts" (Register Shift & Cash Drawer) | "bills" (Customer Bill Settlements)
  const [activeTab, setActiveTab] = useState("shifts");

  // ── Register Shift & Cash Drawer State ────────────────────
  const [activeSession, setActiveSession] = useState(null);
  const [pastSessions, setPastSessions] = useState([]);
  const [loadingShifts, setLoadingShifts] = useState(true);

  // Modals for shifts
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [openRegisterId, setOpenRegisterId] = useState("REG-1");
  const [openFloat, setOpenFloat] = useState("500");
  const [openNotes, setOpenNotes] = useState("");
  const [isSubmittingOpen, setIsSubmittingOpen] = useState(false);

  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementType, setMovementType] = useState("petty_cash");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementReason, setMovementReason] = useState("petty_expense");
  const [movementRemarks, setMovementRemarks] = useState("");
  const [isSubmittingMovement, setIsSubmittingMovement] = useState(false);

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [countedCash, setCountedCash] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);
  const [denominations, setDenominations] = useState({
    "500": "",
    "200": "",
    "100": "",
    "50": "",
    "20": "",
    "10": "",
    "coins": ""
  });

  // ── Historical Customer Bills State (Preserved) ───────────
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState("all");
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [billType, setBillType] = useState("customer");
  const loaderRef = useRef(null);

  // Fetch register session data
  const fetchShiftData = async () => {
    if (!token) return;
    setLoadingShifts(true);
    try {
      // 1. Fetch active session
      const activeRes = await fetch("/api/finance/sessions?active=true", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const activeJson = await activeRes.json();
      setActiveSession(activeJson.activeSession || null);

      // 2. Fetch past sessions
      const pastRes = await fetch("/api/finance/sessions?limit=20", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const pastJson = await pastRes.json();
      setPastSessions(pastJson.sessions || []);
    } catch (err) {
      console.error("Error fetching shift data:", err);
    } finally {
      setLoadingShifts(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchShiftData();
    }
  }, [token]);

  // Denominations auto-sum calculator
  useEffect(() => {
    let total = 0;
    const d500 = parseInt(denominations["500"] || "0", 10) * 500;
    const d200 = parseInt(denominations["200"] || "0", 10) * 200;
    const d100 = parseInt(denominations["100"] || "0", 10) * 100;
    const d50 = parseInt(denominations["50"] || "0", 10) * 50;
    const d20 = parseInt(denominations["20"] || "0", 10) * 20;
    const d10 = parseInt(denominations["10"] || "0", 10) * 10;
    const coins = parseFloat(denominations["coins"] || "0");
    total = d500 + d200 + d100 + d50 + d20 + d10 + coins;
    if (total > 0) {
      setCountedCash(total.toFixed(2));
    }
  }, [denominations]);

  // Handle open shift
  const handleOpenShift = async (e) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmittingOpen(true);
    try {
      const res = await fetch("/api/finance/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          registerId: openRegisterId,
          openingFloat: parseFloat(openFloat || "0"),
          notes: openNotes
        })
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Failed to open shift");
        return;
      }
      alert(`Shift ${json.session.sessionNumber} opened successfully!`);
      setShowOpenModal(false);
      fetchShiftData();
    } catch (err) {
      alert("Error opening register shift");
    } finally {
      setIsSubmittingOpen(false);
    }
  };

  // Handle cash movement
  const handleRecordMovement = async (e) => {
    e.preventDefault();
    if (!activeSession || !token) return;
    setIsSubmittingMovement(true);
    try {
      const res = await fetch("/api/finance/sessions/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          sessionId: activeSession._id,
          type: movementType,
          amount: parseFloat(movementAmount || "0"),
          reasonCode: movementReason,
          reasonText: movementRemarks
        })
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Failed to record cash movement");
        return;
      }
      alert(json.message || "Movement recorded");
      setShowMovementModal(false);
      setMovementAmount("");
      setMovementRemarks("");
      fetchShiftData();
    } catch (err) {
      alert("Error recording movement");
    } finally {
      setIsSubmittingMovement(false);
    }
  };

  // Handle close shift
  const handleCloseShift = async (e) => {
    e.preventDefault();
    if (!activeSession || !token) return;
    setIsSubmittingClose(true);
    try {
      const res = await fetch("/api/finance/sessions/close", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          sessionId: activeSession._id,
          countedCash: parseFloat(countedCash || "0"),
          denominations,
          notes: closeNotes
        })
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Failed to close shift");
        return;
      }
      const rec = json.reconciliation;
      alert(`Shift closed! Expected: ₹${rec.display?.expectedCash}, Counted: ₹${rec.display?.countedCash}, Variance: ${rec.display?.cashVariance} (${rec.varianceType.toUpperCase()})`);
      setShowCloseModal(false);
      setCountedCash("");
      setCloseNotes("");
      fetchShiftData();
    } catch (err) {
      alert("Error closing shift");
    } finally {
      setIsSubmittingClose(false);
    }
  };

  // ── Existing Customer Bills Logic (Preserved) ─────────────
  useEffect(() => {
    if (!token || activeTab !== "bills") return;
    setNextCursor(null);
    setHasMore(true);
    setData([]);
    fetchCustomerBills(false);
  }, [billType, token, filter, activeTab]);

  const fetchCustomerBills = async (loadMore = false) => {
    if (!token) return;
    if (loadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      let url = `/api/bills?filter=${filter}&limit=20`;
      if (loadMore && nextCursor) url += `&cursor=${nextCursor}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch bills");

      const json = await res.json();
      const bills = json.bills || [];
      setData(loadMore ? (prev) => [...prev, ...bills] : bills);
      setNextCursor(json.nextCursor);
      setHasMore(json.hasMore);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const settleBill = async (billId, paymentMethod) => {
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ billId, paymentMethod })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showAlert("success", "Paid!", `Paid via ${paymentMethod.toUpperCase()}\nRef: ${result.settlementNo}`, [{ text: "OK" }]);
        setData((prev) =>
          prev.map((item) =>
            item.billId === billId || item._id === billId
              ? { ...item, isSettled: true, status: "Paid", paymentMethod, settlementNo: result.settlementNo }
              : item
          )
        );
      } else {
        showAlert("error", "Failed", result.error || "Could not settle bill", [{ text: "OK" }]);
      }
    } catch (err) {
      showAlert("error", "Error", "Network error", [{ text: "OK" }]);
    }
  };

  const liveRec = activeSession?.liveReconciliation;

  return (
    hasPermission(user, ["manage_settlements", "view_settlements"]) && (
      <div className="min-h-screen bg-gray-50 pb-16">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-3.5">
              <div className="flex items-center space-x-3">
                <Link href="/" className="text-orange-500 hover:text-orange-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <div className="flex items-center gap-2">
                  <Vault className="text-orange-500 w-5 h-5" />
                  <span className="text-base font-bold text-gray-900">Cash Drawer & Shift Settlements</span>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab("shifts")}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    activeTab === "shifts" ? "bg-white text-orange-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Register Shifts & Drawer
                </button>
                <button
                  onClick={() => setActiveTab("bills")}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    activeTab === "bills" ? "bg-white text-orange-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Bill Settlements
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* TAB 1: REGISTER SHIFTS & CASH DRAWER */}
          {activeTab === "shifts" && (
            <div className="space-y-6">
              {/* Active Session Overview */}
              {activeSession ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 text-white flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <h2 className="text-lg font-bold">Active Shift: {activeSession.sessionNumber}</h2>
                      </div>
                      <p className="text-xs text-orange-100 mt-0.5">
                        Register: <strong>{activeSession.registerId}</strong> • Opened by {activeSession.openedBy} at {new Date(activeSession.openedAt).toLocaleTimeString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowMovementModal(true)}
                        className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 backdrop-blur-sm"
                      >
                        <Plus size={14} /> Cash Movement
                      </button>
                      <button
                        onClick={() => {
                          const expAmt = (Number(liveRec?.expectedCashPaise || 0) / 100).toFixed(2);
                          setCountedCash(expAmt);
                          setShowCloseModal(true);
                        }}
                        className="px-4 py-2 bg-white text-orange-600 hover:bg-orange-50 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                      >
                        <CheckCircle size={14} /> Close & Reconcile
                      </button>
                    </div>
                  </div>

                  {/* Shift KPI Metrics */}
                  <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <span className="text-xs text-gray-500 font-medium">Opening Float</span>
                      <p className="text-base font-bold text-gray-800 mt-1">₹{liveRec?.display?.openingFloat || "0.00"}</p>
                    </div>

                    <div className="bg-emerald-50/60 p-4 rounded-lg border border-emerald-100">
                      <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                        <ArrowDownRight size={14} /> Cash Sales (+)
                      </span>
                      <p className="text-base font-bold text-emerald-800 mt-1">₹{liveRec?.display?.cashSales || "0.00"}</p>
                    </div>

                    <div className="bg-rose-50/60 p-4 rounded-lg border border-rose-100">
                      <span className="text-xs text-rose-700 font-medium flex items-center gap-1">
                        <ArrowUpRight size={14} /> Cash Refunds (-)
                      </span>
                      <p className="text-base font-bold text-rose-800 mt-1">₹{liveRec?.display?.cashRefunds || "0.00"}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <span className="text-xs text-gray-500 font-medium">Manual In / Out</span>
                      <p className="text-base font-bold text-gray-800 mt-1">
                        +₹{liveRec?.display?.cashIn || "0.00"} / -₹{liveRec?.display?.cashOut || "0.00"}
                      </p>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
                      <span className="text-xs text-orange-800 font-bold uppercase tracking-wider">Expected in Drawer</span>
                      <p className="text-lg font-black text-orange-600 mt-1">₹{liveRec?.display?.expectedCash || "0.00"}</p>
                    </div>

                    <div className="bg-indigo-50/60 p-4 rounded-lg border border-indigo-100">
                      <span className="text-xs text-indigo-700 font-medium">Digital (UPI/Card)</span>
                      <p className="text-xs font-semibold text-indigo-900 mt-1">
                        UPI: ₹{liveRec?.display?.upiSales || "0.00"}
                      </p>
                      <p className="text-xs font-semibold text-indigo-900">
                        Card: ₹{liveRec?.display?.cardSales || "0.00"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* No Active Session State */
                <div className="bg-white rounded-xl shadow-sm border border-dashed border-gray-300 p-8 text-center">
                  <Vault className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-gray-800">No Register Shift Currently Open</h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-5">
                    Start a new shift session by recording your opening cash float. All cash payments, change calculations, and refunds will be automatically reconciled against the physical drawer.
                  </p>
                  <button
                    onClick={() => setShowOpenModal(true)}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm inline-flex items-center gap-2"
                  >
                    <Plus size={16} /> Open Register Shift
                  </button>
                </div>
              )}

              {/* Historical Shift Reconciliations Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Shift History & Reconciliation Logs</h3>
                    <p className="text-xs text-gray-500">Audit trail of closed shifts, expected vs counted cash, and audited variances</p>
                  </div>
                  <button onClick={fetchShiftData} className="text-gray-500 hover:text-gray-700 p-1" title="Refresh">
                    <RefreshCw size={16} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50 text-gray-600 font-semibold uppercase">
                      <tr>
                        <th className="px-6 py-3 text-left">Session #</th>
                        <th className="px-6 py-3 text-left">Register</th>
                        <th className="px-6 py-3 text-left">Opened / Closed</th>
                        <th className="px-6 py-3 text-right">Opening Float</th>
                        <th className="px-6 py-3 text-right">Cash Sales</th>
                        <th className="px-6 py-3 text-right">Expected Drawer</th>
                        <th className="px-6 py-3 text-right">Counted Cash</th>
                        <th className="px-6 py-3 text-center">Variance</th>
                        <th className="px-6 py-3 text-left">Closed By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {pastSessions.map((s) => {
                        const rec = s.closingReconciliation;
                        const varType = rec?.varianceType || "balanced";
                        const varPaise = rec?.cashVariancePaise || 0;
                        return (
                          <tr key={s._id} className="hover:bg-gray-50">
                            <td className="px-6 py-3.5 font-mono font-medium text-gray-900">{s.sessionNumber}</td>
                            <td className="px-6 py-3.5 font-semibold text-gray-700">{s.registerId}</td>
                            <td className="px-6 py-3.5 text-gray-500">
                              <div>{new Date(s.openedAt).toLocaleDateString()} {new Date(s.openedAt).toLocaleTimeString()}</div>
                              {s.closedAt && (
                                <div className="text-gray-400 text-[10px]">Close: {new Date(s.closedAt).toLocaleTimeString()}</div>
                              )}
                            </td>
                            <td className="px-6 py-3.5 text-right font-medium">₹{s.openingFloatRupees || "0.00"}</td>
                            <td className="px-6 py-3.5 text-right font-semibold text-emerald-700">₹{rec?.display?.cashSales || "-"}</td>
                            <td className="px-6 py-3.5 text-right font-bold text-gray-900">₹{rec?.display?.expectedCash || "-"}</td>
                            <td className="px-6 py-3.5 text-right font-bold text-gray-900">₹{s.countedCashRupees || "-"}</td>
                            <td className="px-6 py-3.5 text-center">
                              {s.status === "open" ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  OPEN
                                </span>
                              ) : varType === "balanced" ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                                  BALANCED
                                </span>
                              ) : varType === "shortage" ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                  SHORT: {rec?.display?.cashVariance}
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                  OVER: {rec?.display?.cashVariance}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-3.5 text-gray-600">{s.closedBy || s.openedBy}</td>
                          </tr>
                        );
                      })}
                      {pastSessions.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-6 py-8 text-center text-gray-400">
                            No shift records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BILL SETTLEMENTS (PRESERVED) */}
          {activeTab === "bills" && (
            <div>
              {/* Filters */}
              <div className="bg-white rounded-xl shadow-sm border mb-4 p-4 flex gap-2 flex-wrap">
                {[
                  { label: "All Bills", value: "all" },
                  { label: "Paid", value: "true" },
                  { label: "Unpaid", value: "false" }
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                      filter === f.value ? "bg-orange-500 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-orange-500 text-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs uppercase">Bill #</th>
                      <th className="px-6 py-3 text-left text-xs uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs uppercase">Quick Settle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-xs font-mono font-medium">{item.billNumber || item._id.slice(-6)}</td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-medium">{item.customerName || "Guest"}</div>
                          {item.customerPhone && <div className="text-xs text-gray-500">{item.customerPhone}</div>}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span className="px-2 py-1 bg-gray-100 rounded-full">{item.orderType || "Dine-in"}</span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-green-600">
                          ₹{Math.round(Number(item.totalAmount || 0))}
                        </td>
                        <td className="px-6 py-4">
                          {item.isSettled ? (
                            <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800">Paid</span>
                          ) : (
                            <span className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {!item.isSettled && (
                            <div className="flex gap-3">
                              <button onClick={() => settleBill(item.billId || item._id, "cash")} title="Cash">
                                <FaMoneyBillWave className="text-green-600" size={18} />
                              </button>
                              <button onClick={() => settleBill(item.billId || item._id, "upi")} title="UPI">
                                <FaWallet className="text-blue-600" size={18} />
                              </button>
                              <button onClick={() => settleBill(item.billId || item._id, "creditcard")} title="Card">
                                <FaCcVisa className="text-purple-600" size={20} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>

        {/* MODAL 1: OPEN SHIFT */}
        {showOpenModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-4 border-b pb-3">
                <div className="flex items-center gap-2">
                  <Vault className="text-orange-500" size={20} />
                  <h2 className="text-xl font-bold text-gray-900">Open Register Shift</h2>
                </div>
                <button onClick={() => setShowOpenModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleOpenShift} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Register ID *</label>
                  <input
                    type="text"
                    required
                    value={openRegisterId}
                    onChange={(e) => setOpenRegisterId(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 text-sm font-semibold uppercase bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Opening Cash Float (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={openFloat}
                    onChange={(e) => setOpenFloat(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 text-base font-bold bg-white text-gray-900"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Starting physical cash present in the drawer</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Shift Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Morning Shift - Cashier Ramesh"
                    value={openNotes}
                    onChange={(e) => setOpenNotes(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 text-sm bg-white text-gray-900"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowOpenModal(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-lg hover:bg-gray-300 font-medium text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingOpen}
                    className="flex-1 bg-orange-600 text-white py-2.5 rounded-lg hover:bg-orange-700 font-bold text-xs flex items-center justify-center gap-2"
                  >
                    {isSubmittingOpen ? <FaSpinner className="animate-spin" /> : <Vault size={16} />}
                    Open Shift
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: CASH MOVEMENT */}
        {showMovementModal && activeSession && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-4 border-b pb-3">
                <div className="flex items-center gap-2">
                  <Coins className="text-orange-500" size={20} />
                  <h2 className="text-xl font-bold text-gray-900">Record Cash Movement</h2>
                </div>
                <button onClick={() => setShowMovementModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleRecordMovement} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Movement Type *</label>
                  <select
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 text-sm bg-white text-gray-900"
                  >
                    <option value="petty_cash">Petty Cash Out (Supplies/Repairs)</option>
                    <option value="cash_in">Cash In / Float Top-up</option>
                    <option value="bank_drop">Bank / Safe Drop (Mid-shift)</option>
                    <option value="cash_out">Manager Authorized Withdrawal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={movementAmount}
                    onChange={(e) => setMovementAmount(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 text-base font-bold bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Remarks / Voucher Ref *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bought cleaning detergent (Receipt #102)"
                    value={movementRemarks}
                    onChange={(e) => setMovementRemarks(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 text-sm bg-white text-gray-900"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowMovementModal(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-lg hover:bg-gray-300 font-medium text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingMovement}
                    className="flex-1 bg-orange-600 text-white py-2.5 rounded-lg hover:bg-orange-700 font-bold text-xs flex items-center justify-center gap-2"
                  >
                    {isSubmittingMovement ? <FaSpinner className="animate-spin" /> : <CheckCircle size={16} />}
                    Record Movement
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: CLOSE & RECONCILE SHIFT */}
        {showCloseModal && activeSession && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 sm:p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 border-b pb-3">
                <div className="flex items-center gap-2">
                  <Vault className="text-orange-600" size={20} />
                  <h2 className="text-xl font-bold text-gray-900">Close Shift & Reconcile Drawer</h2>
                </div>
                <button onClick={() => setShowCloseModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>

              {/* Expected Summary */}
              <div className="bg-orange-50/70 p-4 rounded-lg mb-4 border border-orange-100 text-xs space-y-1.5">
                <div className="flex justify-between text-gray-600">
                  <span>Opening Float:</span>
                  <span className="font-semibold text-gray-800">₹{liveRec?.display?.openingFloat}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Cash Sales (+):</span>
                  <span className="font-semibold text-emerald-700">+₹{liveRec?.display?.cashSales}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Cash Refunds (-):</span>
                  <span className="font-semibold text-rose-700">-₹{liveRec?.display?.cashRefunds}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Net Cash Movements:</span>
                  <span className="font-semibold text-gray-800">
                    +₹{liveRec?.display?.cashIn} / -₹{liveRec?.display?.cashOut}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 border-t pt-2 mt-2">
                  <span>Expected in Drawer:</span>
                  <span className="text-orange-700 text-base">₹{liveRec?.display?.expectedCash}</span>
                </div>
              </div>

              <form onSubmit={handleCloseShift} className="space-y-4">
                {/* Denomination Counter Breakdown */}
                <div>
                  <span className="block text-xs font-bold text-gray-700 uppercase mb-2">Denomination Counter</span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {["500", "200", "100", "50", "20", "10"].map((denom) => (
                      <div key={denom} className="bg-gray-50 p-2 rounded border">
                        <label className="block text-[11px] font-bold text-gray-500">₹{denom} x</label>
                        <input
                          type="number"
                          min="0"
                          value={denominations[denom]}
                          onChange={(e) => setDenominations({ ...denominations, [denom]: e.target.value })}
                          className="w-full text-xs font-semibold p-1 border rounded bg-white text-gray-900 mt-0.5"
                          placeholder="0"
                        />
                      </div>
                    ))}
                    <div className="bg-gray-50 p-2 rounded border col-span-2 sm:col-span-1">
                      <label className="block text-[11px] font-bold text-gray-500">Coins (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={denominations.coins}
                        onChange={(e) => setDenominations({ ...denominations, coins: e.target.value })}
                        className="w-full text-xs font-semibold p-1 border rounded bg-white text-gray-900 mt-0.5"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Total Physical Counted Cash (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 text-base font-bold bg-white text-gray-900"
                  />
                </div>

                {/* Live Variance Calculation Badge */}
                {countedCash !== "" && (
                  <div className="p-3 rounded-lg border text-xs flex justify-between items-center">
                    <span className="font-medium text-gray-600">Calculated Variance:</span>
                    {(() => {
                      const exp = parseFloat(liveRec?.display?.expectedCash?.replace(/,/g, "") || "0");
                      const cnt = parseFloat(countedCash || "0");
                      const diff = cnt - exp;
                      if (Math.abs(diff) < 0.01) {
                        return (
                          <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-800 font-bold">
                            Balanced (₹0.00)
                          </span>
                        );
                      } else if (diff < 0) {
                        return (
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold">
                            Shortage: -₹{Math.abs(diff).toFixed(2)}
                          </span>
                        );
                      } else {
                        return (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">
                            Overage: +₹{diff.toFixed(2)}
                          </span>
                        );
                      }
                    })()}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Closing Notes {countedCash && Math.abs(parseFloat(countedCash) - parseFloat(liveRec?.display?.expectedCash?.replace(/,/g, "") || "0")) > 0.01 ? "(Required for Variance)" : ""}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Verified by head cashier; ₹20 shortage investigated"
                    value={closeNotes}
                    onChange={(e) => setCloseNotes(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 text-sm bg-white text-gray-900"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCloseModal(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-lg hover:bg-gray-300 font-medium text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingClose}
                    className="flex-1 bg-orange-600 text-white py-2.5 rounded-lg hover:bg-orange-700 font-bold text-xs flex items-center justify-center gap-2"
                  >
                    {isSubmittingClose ? <FaSpinner className="animate-spin" /> : <CheckCircle size={16} />}
                    Reconcile & Close Shift
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  );
}
