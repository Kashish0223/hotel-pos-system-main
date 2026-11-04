
    "use client"
import { Suspense, useRef, useCallback } from 'react';
import Link from 'next/link';
import './print.css';
import { useState, useEffect } from "react"
    import { Eye, Loader, Printer, X, CreditCard, CheckCircle2, RotateCcw } from "lucide-react";
    import { ArrowUpDown } from 'lucide-react';
    import { useSearchParams } from "next/navigation";
    import Loading from "./loading.js"
    import {useAuthToken} from "@/lib/useAuthToken"
    import {useAuth} from "@/lib/auth";

    export default function BillsManagement() {
      const [bills, setBills] = useState([])
      const [loading, setLoading] = useState(true)
      const [selectedBill, setSelectedBill] = useState(null)
      const [showBillModal, setShowBillModal] = useState(false)
      const [filter, setFilter] = useState("unpaid")
      const [billType, setBillType] = useState("customer") // customer | inventory
      const [inventoryBills, setInventoryBills] = useState([])
      const [expensesBills, setExpensesBills] = useState([])
      const [settings, setSettings] = useState(null);
      const searchParams = useSearchParams();
      const [initialBillId, setInitialBillId] = useState(null);
      const {user, hasPermission} = useAuth();
      const [nextCursor, setNextCursor] = useState(null);
      const [hasMore, setHasMore] = useState(true);
      const [loadingMore, setLoadingMore] = useState(false);
      const [selectedOrders, setSelectedOrders] = useState([]);
      const [showGenerateModal, setShowGenerateModal] = useState(false);
      const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(""); // default

      // ── Payment Dialog State ─────────────────────────────────
      const [showPaymentModal, setShowPaymentModal] = useState(false);
      const [paymentTargetBill, setPaymentTargetBill] = useState(null);
      const [paymentTender, setPaymentTender] = useState("cash");
      const [paymentAmount, setPaymentAmount] = useState("");
      const [paymentRef, setPaymentRef] = useState("");
      const [cashTendered, setCashTendered] = useState("");
      const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
      const [isSplitTender, setIsSplitTender] = useState(false);
      const [splitCashAmount, setSplitCashAmount] = useState("");
      const [splitUpiAmount, setSplitUpiAmount] = useState("");
      const [splitUpiRef, setSplitUpiRef] = useState("");

      const handleOpenPayment = (bill) => {
        setPaymentTargetBill(bill);
        const due = bill.balanceDuePaise !== undefined 
          ? (bill.balanceDuePaise / 100).toFixed(2)
          : (Number(bill.totalAmount || bill.grandTotal || 0)).toFixed(2);
        setPaymentAmount(due);
        setPaymentTender("cash");
        setPaymentRef("");
        setCashTendered(due);
        setIsSplitTender(false);
        setSplitCashAmount("");
        setSplitUpiAmount("");
        setSplitUpiRef("");
        setShowPaymentModal(true);
      };

      const handleSubmitPayment = async (e) => {
        e?.preventDefault();
        if (!paymentTargetBill || !token) return;
        setIsSubmittingPayment(true);
        try {
          let payload = {};
          if (isSplitTender) {
            const cashAmt = parseFloat(splitCashAmount || "0");
            const upiAmt = parseFloat(splitUpiAmount || "0");
            if (cashAmt <= 0 && upiAmt <= 0) {
              alert("Please enter a valid amount for at least one tender");
              setIsSubmittingPayment(false);
              return;
            }
            const tenders = [];
            if (cashAmt > 0) tenders.push({ method: "cash", amountPaise: Math.round(cashAmt * 100) });
            if (upiAmt > 0) tenders.push({ method: "upi", amountPaise: Math.round(upiAmt * 100), referenceNumber: splitUpiRef });
            payload = {
              invoiceId: paymentTargetBill._id,
              tenders
            };
          } else {
            const amt = parseFloat(paymentAmount || "0");
            if (amt <= 0) {
              alert("Please enter a valid payment amount");
              setIsSubmittingPayment(false);
              return;
            }
            payload = {
              invoiceId: paymentTargetBill._id,
              paymentMethod: paymentTender,
              amount: amt,
              referenceNumber: paymentRef,
              tenderDetails: paymentTender === "cash" && cashTendered ? {
                cashTenderedPaise: Math.round(parseFloat(cashTendered) * 100),
                changeGivenPaise: Math.max(0, Math.round((parseFloat(cashTendered) - amt) * 100))
              } : null
            };
          }

          const res = await fetch("/api/finance/payments", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });

          const data = await res.json();
          if (!res.ok) {
            alert(data.error || "Payment recording failed");
            setIsSubmittingPayment(false);
            return;
          }

          // Refresh active bill if modal is open
          if (selectedBill && selectedBill._id === paymentTargetBill._id) {
            setSelectedBill(prev => ({
              ...prev,
              balanceDuePaise: data.balanceDuePaise,
              paymentStatus: data.paymentStatus,
              status: data.paymentStatus === "paid" ? "Paid" : "Partially Paid",
              isSettled: data.isSettled,
              billPay: data.isSettled,
              paymentsList: [
                ...(prev.paymentsList || []),
                ...(data.receipts || [])
              ]
            }));
          }

          setShowPaymentModal(false);
          if (filter === "paid") {
            fetchBills(false, null);
          } else {
            fetchCustomerData(false, null);
          }
        } catch (err) {
          console.error("Payment submission error:", err);
          alert("Failed to submit payment");
        } finally {
          setIsSubmittingPayment(false);
        }
      };

      // ── Credit Note & Refund State and Handlers ─────────
      const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);
      const [creditNoteTargetBill, setCreditNoteTargetBill] = useState(null);
      const [creditNoteAmount, setCreditNoteAmount] = useState("");
      const [creditNoteReason, setCreditNoteReason] = useState("guest_satisfaction");
      const [creditNoteReasonText, setCreditNoteReasonText] = useState("");
      const [creditNoteDisposition, setCreditNoteDisposition] = useState("wastage");
      const [creditNoteRefundTender, setCreditNoteRefundTender] = useState("none");
      const [isSubmittingCreditNote, setIsSubmittingCreditNote] = useState(false);

      const handleOpenCreditNote = (bill) => {
        setCreditNoteTargetBill(bill);
        const maxAmt = bill.balanceDuePaise !== undefined && bill.balanceDuePaise > 0
          ? (bill.balanceDuePaise / 100).toFixed(2)
          : (Number(bill.totalAmount || bill.grandTotal || 0)).toFixed(2);
        setCreditNoteAmount(maxAmt);
        setCreditNoteReason("guest_satisfaction");
        setCreditNoteReasonText("");
        setCreditNoteDisposition("wastage");
        setCreditNoteRefundTender(bill.isSettled || bill.paymentStatus === "paid" ? "cash" : "none");
        setShowCreditNoteModal(true);
      };

      const handleSubmitCreditNote = async (e) => {
        e?.preventDefault();
        if (!creditNoteTargetBill || !token) return;
        const amt = parseFloat(creditNoteAmount || "0");
        if (amt <= 0) {
          alert("Please enter a valid credit amount");
          return;
        }
        setIsSubmittingCreditNote(true);
        try {
          const payload = {
            invoiceId: creditNoteTargetBill._id,
            amount: amt,
            reasonCode: creditNoteReason,
            reasonText: creditNoteReasonText || "Customer service adjustment",
            inventoryDisposition: creditNoteDisposition
          };
          if (creditNoteRefundTender && creditNoteRefundTender !== "none") {
            payload.refundTender = { method: creditNoteRefundTender };
          }

          const res = await fetch("/api/finance/credit-notes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });

          const data = await res.json();
          if (!res.ok) {
            alert(data.error || "Failed to issue credit note");
            setIsSubmittingCreditNote(false);
            return;
          }

          alert(`Credit Note ${data.creditNote?.creditNoteNumber || ""} issued successfully!`);
          setShowCreditNoteModal(false);

          if (selectedBill && selectedBill._id === creditNoteTargetBill._id) {
            setSelectedBill(prev => ({
              ...prev,
              balanceDuePaise: data.invoiceSummary?.newBalanceDuePaise ?? prev.balanceDuePaise,
              creditNotesList: [
                ...(prev.creditNotesList || []),
                data.creditNote
              ]
            }));
          }

          if (filter === "paid") {
            fetchBills(false, null);
          } else {
            fetchCustomerData(false, null);
          }
        } catch (err) {
          console.error("Credit note error:", err);
          alert("Error issuing credit note");
        } finally {
          setIsSubmittingCreditNote(false);
        }
      };


        // const loaderRef = useRef(null); // for IntersectionObserver

    const token = useAuthToken();
    //-----------------Not use this because it contain all the bills ------------------------
      // useEffect(() => {
      //   if (!token) return;
      //   // setFilter("all"); // reset filter on type change
      //   setBills([]);
      //   setNextCursor(null);
      //   setHasMore(true);
      //   if (billType === "customer") {
      //     if (filter === "true") {
      //       fetchBills(false, null); // ← Paid bills (with token)
      //     } else {
      //       fetchCustomerData(false, null); // ← All/Unpaid → unpaid orders (no token)
      //     }
      //   } else if (billType === "expenses") {
      //     fetchExpensesBills();
      //   } else if (billType === "inventory_bills") {
      //     fetchInventoryBills();
      //   }
      // }, [billType, token, filter]);

      useEffect(() => {
  if (!token || billType !== "customer") return;

  setBills([]);
  setNextCursor(null);
  setHasMore(true);
  setLoading(true);

  if (filter === "paid") {
    fetchBills(false, null);          // Paid bills
  } else {
    fetchCustomerData(false, null);   // Unpaid / All
  }
}, [billType, token, filter]);
    useEffect(() => {
    setFilter("all"); // Reset filter when switching between Customer/Expenses
    setBills([]);
  setNextCursor(null);
  setHasMore(true);
  }, [billType]);

    // Read billId from URL
      useEffect(() => {
        const billId = searchParams.get("billId") ;
        if (billId) {
          setInitialBillId(billId)
        }
      }, [searchParams]);

    // Open modal when bills loaded
      useEffect(() => {
        if (initialBillId && bills.length > 0) {
          const bill = bills.find(b => 
            b._id === initialBillId || 
            b.orderId === initialBillId ||
            (b.orderId && initialBillId.length >= 6 && b.orderId.slice(-6) === initialBillId.slice(-6))
          );

          if (bill) {
            setSelectedBill(bill);
            setShowBillModal(true);
            // Clean URL
            const newUrl = new URL(window.location);
            newUrl.searchParams.delete("billId");
            window.history.replaceState({}, "", newUrl);
          }
        }
      }, [initialBillId, bills]);
      
      useEffect(() => {
        if (!token) return;
        const fetchSettings = async () => {
        
          try {
            const response = await fetch("/api/settings",{
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
              }
            });
            const data = await response.json();
            // console.log("Fetched Settings:", data);
            setSettings(data); // only general settings.general
            // setSettings(data.general); // only general settings.general
          } catch (error) {
            console.error("Error fetching settings.general:", error);
          }
        };
        fetchSettings();
      }, [token]);
      // const fetchBills = async () => {
      //   if (!token) return;
      //   setLoading(true)
      //   try {
      //     const response = await fetch("/api/bills",
      //       {
      //         headers: {
      //           "Content-Type": "application/json",
      //           "Authorization": `Bearer ${token}`
      //         }
      //     });
      //     const data = await response.json()
      //     console.log("Customer Bills Data-->>>>", data)
      //     setBills(data)
      //   } catch (error) {
      //     console.error("Error fetching bills:", error)
      //   } finally {
      //     setLoading(false);
      //   }
      // }

      // Load expenses as bill-like entries
    
  //   const fetchBills = async (append = false, nextCursor = null) => {
  //   if (!token) return;
    
  //   if (append && nextCursor) {
  //     setLoadingMore(true);
  //   } else {
  //     setLoading(true);
  //   }
  //   try {
  //     // Build URL with filter (only for customer bills)
  //     let url = "/api/bills";
  //     if (billType === "customer" && filter !== "all") {
  //       url += `?filter=${filter}`; // sends ?filter=paid or ?filter=unpaid
  //     }

  //     const response = await fetch(url, {
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`
  //       }
  //     });

  //     const data = await response.json();
  //     console.log("Customer Bills Data-->>>>", data);

  //   // Apply rounding to the relevant fields
  //     const billsList = data.bills || [];
  //     const billsWithRoundedValues = billsList.map(bill => ({
  //       ...bill,
  //       itemTaxes: bill.itemTaxes || 0,
  //       totalAmount: bill.totalAmount,  // Rounding totalAmount
  //       subtotal: bill.subtotal,       // Rounding subtotal
  //       discount: bill.discount,       // Rounding discount
  //       totalAmountAfterDiscount: bill.totalAmountAfterDiscount, // Add other fields as necessary
  //       grandTotal: (bill.totalAmount) - Number(bill.discount || 0) ,     // Rounding grandTotal
  //       totalTaxAmount: bill.totalTaxAmount, // Rounding totalTaxAmount
  //     }));

  //     setBills(billsWithRoundedValues || []); // supports both formats

  //     // setBills(data.bills || data || []); // supports both formats

  //   } catch (error) {
  //     console.error("Error fetching bills:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
const fetchBills = async (append = false, cursor = null) => {
  if (!token) return;

  if (append) {
    setLoadingMore(true);
  } else {
    setLoading(true);
  }

  try {
    let url = "/api/bills";

    // // Add filter if needed
    // if (filter !== "all") {
    //   url += `${url.includes('?') ? '&' : '?'}filter=${filter}`;
    // }

    // Add cursor for pagination (only when appending)
    if (append && cursor) {
      url += `${url.includes('?') ? '&' : '?'}cursor=${cursor}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error("Failed to fetch bills");

    const data = await response.json();

    const newBills = data.bills || [];
    const hasMoreData = data.hasMore || false;
    const nextCursorData = data.nextCursor || null;

    // Round values (your existing logic)
    const processedBills = newBills.map(bill => ({
      ...bill,
      itemTaxes: Number(bill.itemTaxes || 0),
      totalAmount: Number(bill.totalAmount || 0),
      subtotal: Number(bill.subtotal || 0),
      discount: Number(bill.discount || 0),
      grandTotal: Number(bill.totalAmount || 0) - Number(bill.discount || 0),
      totalTaxAmount: Number(bill.totalTaxAmount || 0),
    }));

    if (append) {
      setBills(prev => {
        const existingIds = new Set(prev.map(b => b._id));
        const uniqueNew = processedBills.filter(b => !existingIds.has(b._id));
        return [...prev, ...uniqueNew];
      });
    } else {
      setBills(processedBills);
    }

    setNextCursor(nextCursorData);
    setHasMore(hasMoreData);

  } catch (error) {
    console.error("Error fetching bills:", error);
  } finally {
    setLoading(false);
    setLoadingMore(false);
  }
};
// Fetch customer data - different endpoint based on filter
const fetchCustomerData = async (append = false, cursor = null) => {
if (append) setLoadingMore(true);
  else setLoading(true);

  try {
    let url = "/api/orders";
    const params = new URLSearchParams();
    if (append && cursor) params.append("cursor", cursor);
    if (params.size > 0) url += `?${params}`;

    // NO Authorization header
    const res = await fetch(url);

    if (!res.ok) throw new Error(`Orders failed: ${res.status}`);

    const data = await res.json();
    // console.log("UNPAID ORDERS fetched:", data.orders);

    const raw = Array.isArray(data) ? data : data.orders || [];

    const processed = raw.map(item => ({
      ...item,
      billNumber: `ORD-${String(item._id).slice(-6).toUpperCase()}`,
      customerName: item.customerInfo?.name || "Guest",
      customerPhone: item.customerInfo?.phone || "",
      customerTable: item.customerInfo?.table || "",
      customerRoom: item.customerInfo?.room || "",
      orderType: item.orderType || "Dine-in",
      billPay: item.billPay ?? false,
      paymentStatus: item.billPay ? "Paid" : "Unpaid",
      subtotal: Number(item.subtotal || 0),
      itemTaxes: Number(item.itemTaxes || 0),
      discount: Number(item.discount || 0),
      totalAmount: Number(item.totalAmount || 0),
      items: item.items || [],
    }));

    // Only keep unpaid
    const final = processed.filter(b => !b.billPay);

    if (append) {
      setBills(prev => {
        const seen = new Set(prev.map(b => b._id));
        return [...prev, ...final.filter(b => !seen.has(b._id))];
      });
    } else {
      setBills(final);
    }

    setNextCursor(data.nextCursor || null);
    setHasMore(!!data.hasMore);
  } catch (err) {
    console.error("Unpaid orders error:", err);
  } finally {
    setLoading(false);
    setLoadingMore(false);
  }
};
const handleGenerateBills = () => {
  if (selectedOrders.length === 0) return;
  setShowGenerateModal(true);
};
const toggleOrderSelection = (orderId) => {
  setSelectedOrders(prev =>
    prev.includes(orderId)
      ? prev.filter(id => id !== orderId) // unselect
      : [...prev, orderId]                // select
  );
};
const loaderRef = useRef(null);
const observerRef = useRef(null);

// Infinite scroll observer
  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader || billType !== "customer") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          // fetchBills(true, nextCursor);
          if (filter === "paid") {
          fetchBills(true, nextCursor);     // Paid → bills endpoint
        } else {
          fetchCustomerData(true, nextCursor); // All/Unpaid → orders endpoint
        }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loader);
    return () => observer.disconnect();
  }, [hasMore, nextCursor, loading, loadingMore, filter, billType]);
  // }, [hasMore, nextCursor, loading, loadingMore, billType]);
    // const fetchExpensesBills = async () => {  
    //     if (!token) return;
    //     setLoading(true)
    //     try {
    //           let url = "/api/expenses";

    //   const response = await fetch(url, {
    //     headers: {
    //       "Content-Type": "application/json",
    //       Authorization: `Bearer ${token}`
    //     }
    //   });
    //       // const response = await fetch("/api/expenses",{
    //       //   headers: {
    //       //     Authorization: `Bearer ${token}`,
    //       //   }
    //       // })
    //       const data = await response.json()
    //       const mapped = data.map((e) => {
    //         const amount = Number(e.amount || 0);
    //         return {
    //           _id: e._id,
    //           billNumber: e.expenseInvoiceNo || `EXP${String(e._id).slice(-6).toUpperCase()}`,
    //           customerName: e.vendor || e.description || "Expense",
    //           customerPhone: e.category || "",
    //           // createdAt: new Date(e.date || e.createdAt || Date.now()).toISOString(),
    //           createdAt: e.date || e.createdAt || new Date(e.createAt).toISOString().slice(11, 19),
    //           // createdAt: e.date ? new Date(e.date).toISOString() : new Date().toISO  String(),
    //           totalAmount: amount.toFixed(2),
    //           orderType: e.orderType || "Expense",
    //           paymentMethod: e.paymentMode || "",
    //           settlementNo: e.settlementNo || "",
    //           settledAt: e.settledAt || "",
    //           status: e.status ? e.status.charAt(0).toUpperCase() + e.status.slice(1) : "Pending",
    //           // Provide a single line item so the modal item table renders
    //           items: [
    //             {
    //               name: e.description || e.vendor || "Expense",
    //               quantity: 1,
    //               price: amount,
    //             },
    //           ],
    //           // Helpful for the summary section (won't affect customer/inventory)
    //           subtotal: amount.toFixed(2),
    //           discount: Number(e.discount || 0),
    //           taxes: Array.isArray(e.taxes) ? e.taxes : [],
    //           orderType: "Expense",
    //         };
    //       })
    //       .filter(e => filter === "all" || e.status?.toLowerCase() === filter.toLowerCase());
    //       setExpensesBills(mapped)
    //     } catch (error) {
    //       console.error("Error fetching expenses bills:", error)
    //     } finally {
    //       setLoading(false)
    //     }
    // }

    const fetchExpensesBills = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch("/api/expenses", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      const expensesList = Array.isArray(data) ? data : [];
      const mapped = expensesList.map((e) => {
        const amount = Number(e.amount || 0);

        // // Fix: Use full ISO string with proper date + time
        // const expenseDate = e.date 
        //   ? new Date(e.date)  // if only date (yyyy-mm-dd), assume midnight UTC
        //   : e.createdAt 
        //     ? new Date(e.createdAt)
        //     : new Date();
  
        // console.log(expenseDate);
        return {
          _id: e._id,
          billNumber: e.expenseInvoiceNo || `EXP${String(e._id).slice(-6).toUpperCase()}`,
          customerName: e.vendor || e.description || "Expense",
          customerPhone: e.category || "",
          // Correct: Full valid ISO string
          createdAt: e.createdAt ,
          orderType: e.orderType || "",
          paymentMethod: e.paymentMethod || "",
          settlementNo: e.settlementNo || "",
          settledAt: e.settledAt ? new Date(e.settledAt).toISOString() : "",
          status: e.status ? e.status.charAt(0).toUpperCase() + e.status.slice(1) : "Pending",
          items: [
            {
              name:  e.vendor || "Expense",
              expenseName: e.description || "",
              quantity: 1,
              price: amount,
              receipt: e.receipt || ""
            },
          ],
          subtotal: amount.toFixed(2),
          discount: Number(e.discount || 0),
          taxes: Array.isArray(e.taxes) ? e.taxes : [],
          // totalTaxAmount : totalTaxAmount.toFixed(2),
          // totalAmount: amount.toFixed(2) +  totalTaxAmount,
          // orderType: "Expense",
        };
      })
      .filter(e => filter === "all" || e.status?.toLowerCase() === filter.toLowerCase());

      setExpensesBills(mapped);
    } catch (error) {
      console.error("Error fetching expenses bills:", error);
    } finally {
      setLoading(false);
    }
  };

      // Load inventory items and map to bill-like entries (no separate endpoint required)
      const fetchInventoryBills = async () => {
          
              if (!token) return;
        setLoading(true)
        try {
          const response = await fetch("/api/inventory?source=bills",{
            headers: {
              Authorization: `Bearer ${token}`,
            }
          })
          const data = await response.json()
          // console.log("Inventory Generated Bill:", data)
          const inventoryList = Array.isArray(data) ? data : [];
          const mapped = inventoryList.map((item) => {
            const nameCode = ((item.name || "ITEM") + "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3) || "ITM";
            const created = item.createdAt ? new Date(item.createdAt) : (item.expiryDate ? new Date(item.expiryDate) : new Date());
            const timePart = item.date || item.createdAt || new Date(item.createAt).toISOString().slice(11, 19);
            // const timePart = item.createdAt ? new Date(item.createdAt).getUTCString().slice(11, 19) : "";
            // const timePart = String(created.getUTCHours()).slice(-6);
            const billNumber = item.inventoryInvoiceNo || `INV-${nameCode}-${timePart}`;
            return {
              _id: item._id,
              billNumber:item.inventoryInvoiceNo,
              customerName: item.supplier || item.name || "Inventory Item",
              customerPhone: item.category || item.unit || "",
              createdAt: created.toISOString(),
              totalAmount: Number(item.costPrice || 0).toFixed(2),
              status: item.currentStock > 0 ? "Available" : "Out of Stock",
              items: [
                {
                  name: item.name,
                  qty: item.currentStock || 0,
                  unitCost: item.costPrice || 0,
                  total: Number((item.costPrice || 0) * (item.currentStock || 0)).toFixed(2),
                },
              ],
              orderType: "Inventory",
            };
          })
          setInventoryBills(mapped)
        } catch (error) {
          console.error("Error fetching inventory bills:", error)
        } finally {
          setLoading(false)
        }
      }

    const generateBillWithPayment = async () => {
  try {
    const response = await fetch("/api/bills/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        orderIds: selectedOrders, 
        paymentMethod: selectedPaymentMethod 
      }),
    });

    if (!response.ok) throw new Error("Failed to generate bill");

    const bill = await response.json();

    setSelectedBill(bill);
    setShowBillModal(true);
    
    setSelectedOrders([]); // clear selection
    setShowGenerateModal(false);
    fetchCustomerData(false, null); // refresh list

  } catch (err) {
    console.error("Bill generation error:", err);
    alert("Failed to generate bill");
  }
};

      // const printBill = () => {
      //   setTimeout(() => {
      //     window.print()
      //   }, 300)
      // }

  //     const printBill = () => {
  //   const printContent = document.getElementById("bill-content");
  //   const originalContent = document.body.innerHTML;

  //   document.body.innerHTML = printContent.innerHTML;
  //   window.print();
  //   document.body.innerHTML = originalContent;
  //   window.location.reload(); // optional if UI breaks on return
  // };

// ── Add near the top (after other states) ──
const [printLoading, setPrintLoading] = useState(false);

// ── Add this function (adapted KOT-style silent print) ──
const silentPrintBill = useCallback(() => {
  if (!selectedBill) return;

  setPrintLoading(true);

  const COMPANY_NAME = settings?.general?.restaurantName || "Hotel-POS";
  const COMPANY_ADDRESS = settings?.general?.address || "S.NO. 414, VILLAGE-JALISANA, TALUKA-MANDAL, DIST-AHMEDABAD 382130 GUJARAT INDIA";
  const COMPANY_GST = settings?.general?.gst || "GSTIN 24AAACI0000A1Z5";
  const COMPANY_FSSAI = settings?.general?.fssai || "";
  const COMPANY_PHONE = settings?.general?.phone || "951625-62828";

  const formatPrice = (val) => Number(val || 0).toFixed(2);
  const formatDateTime = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const min = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${day}/${month}/${year} ${hours}:${min} ${ampm}`;
  };

  const formatTimeOnly = (date) => {
    const d = new Date(date);
    let hours = d.getHours();
    const min = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${min} ${ampm}`;
  };

  let printContent = '';

  // Header
  printContent += `
    <div class="center bold" style="font-size:12px;">${COMPANY_NAME}</div>
    <div class="center small">${COMPANY_ADDRESS}</div>
    <div class="center small">☎ ${COMPANY_PHONE} |✉️ ${settings?.general?.email || 'contact@hotel-pos.com'}</div>
    <div class="divider" style="margin:6px 0;"></div>
    <div class="center bold small" style="margin:4px 0;">Bill INVOICE</div>

    <div class="small">
      Bill No : <strong>${selectedBill.billNumber || selectedBill._id?.slice(-6) || 'N/A'}</strong><br>
      Date : ${formatDateTime(selectedBill.createdAt)}<br>
    </div>
    <div class="divider" style="margin:6px 0;"></div>

    <!-- New two-column layout for customer info + type/orders -->
    <div class="small" style="display: flex; justify-content: space-between; margin: 6px 0;">
      <div style="flex: 1;">
       ${selectedBill.customerName ? `<strong>Customer:</strong> ${selectedBill.customerName}<br>` : ''}
       ${selectedBill.customerTable ? `<strong>Table:</strong> ${selectedBill.customerTable}<br>` : ''}
       ${selectedBill.customerRoom ? `<strong>Room:</strong> ${selectedBill.customerRoom}<br>` : ''}
      </div>

      <div style="flex: 1; text-align: right;">
        <strong>Type:</strong> ${selectedBill.orderType || 'Dine-in'}<br>
        ${selectedBill.sourceOrdersCount ? `<strong>Orders Combined:</strong> ${selectedBill.sourceOrdersCount}<br>` : ''}
      </div>
    </div>

    <div class="divider" style="margin:6px 0;"></div>
  `;

  // ── Grouped / Combined Orders ──
// ── Grouped / Combined Orders ──
let finalSubtotal = 0;
let finalTax = 0;

if (selectedBill.groupedItems && selectedBill.groupedItems.length > 0) {
  selectedBill.groupedItems.forEach((group, index) => {
    const orderTime = formatTimeOnly(group.createdAt || selectedBill.createdAt);
    const orderNumber = group.orderNumber || group.orderId?.slice(-6)?.toUpperCase() || `ORD-${index + 1}`;

    printContent += `
      <div class="bold small" style="margin:6px 0 2px;">Order #${orderNumber} ${orderTime}</div>
    `;

    let groupSubtotal = 0;
    let groupItemsHTML = '';

    (group.items || []).forEach(item => {
      const qty = Number(item.quantity || 1);
      const rate = Number(item.price || 0);
      const taxPercent = Number(item.tax || 0);
      const itemSub = rate * qty;
      const taxAmt = (itemSub * taxPercent) / 100;
      const total = itemSub + taxAmt;

      groupSubtotal += itemSub;
      finalSubtotal += itemSub;
      finalTax += taxAmt;

      groupItemsHTML += `
        <tr>
          <td style="text-align:left; max-width:45%;">${(item.name?.en || item.name || "Unknown").substring(0, 32)}</td>
          <td style="text-align:center;">${qty}</td>
            <td style="text-align:right;">${formatPrice(rate)}</td>
            <td style="text-align:right;">${taxPercent}%</td>
          <td style="text-align:right;">${formatPrice(taxAmt)}</td>
          <td style="text-align:right;">${formatPrice(total)}</td>
        </tr>`;
    });

    printContent += `
      <table style="font-size:10px;">
        <thead>
          <tr class="bold">
            <td>Item</td>
            <td style="text-align:center;">Qty</td>
            <td style="text-align:right;">Rate</td>
            <td style="text-align:right;">Tax(%)</td>
            <td style="text-align:right;">Tax</td>
            <td style="text-align:right;">Amount</td>
          </tr>
        </thead>
        <tbody>
          ${groupItemsHTML}
        </tbody>
      </table>
      <div class="small" style="text-align:right; margin:2px 0;">
        Subtotal: ₹${formatPrice(groupSubtotal)}
      </div>
      <div class="divider"></div>
      
    `;
  });
} 
// ── Normal single order (fallback) ──
else {
  printContent += `
    <table style="font-size:10px;">
      <thead>
        <tr class="bold">
          <td>Item</td>
          <td style="text-align:center;">Qty</td>
          <td style="text-align:right;">Rate</td>
          <td style="text-align:right;">Tax(%)</td>
          <td style="text-align:right;">Tax</td>
          <td style="text-align:right;">Amount</td>
        </tr>
      </thead>
      <tbody>
  `;

  (selectedBill.items || []).forEach(item => {
    const qty = Number(item.quantity || 1);
    const rate = Number(item.price || 0);
    const taxPercent = Number(item.tax || 0);
    const itemSub = rate * qty;
    const taxAmt = (itemSub * taxPercent) / 100;
    const total = itemSub + taxAmt;

    finalSubtotal += itemSub;
    finalTax += taxAmt;

    printContent += `
      <tr>
        <td style="text-align:left; max-width:45%;">${(item.name?.en || item.name || "Unknown").substring(0, 32)}</td>
        <td style="text-align:center;">${qty}</td>
        <td style="text-align:right;">${formatPrice(rate)}</td>
        <td style="text-align:right;">${formatPrice(taxPercent)}</td>
        <td style="text-align:right;">${formatPrice(taxAmt)}</td>
        <td style="text-align:right;">${formatPrice(total)}</td>
      </tr>`;
        <div class="divider"></div>
  });

  printContent += `</tbody></table>`;
}

// ── Final Totals ──
const cgst = finalTax / 2;
const sgst = finalTax / 2;
const taxRate = selectedBill.items?.[0]?.tax ? Number(selectedBill.items[0].tax) : 5;
const taxPercentDisplay = `${(taxRate / 2).toFixed(1)}%`;

const discount = Number(selectedBill.discount || 0);
const grandTotal = Math.round(selectedBill.grandTotal);
// const grandTotal = Math.round(finalSubtotal + finalTax - discount);

printContent += `

  <div class="totals small">
    <div><span>Subtotal :</span><span>₹${formatPrice(finalSubtotal)}</span></div>
    ${finalTax > 0 ? `
      <div><span>CGST (${taxPercentDisplay}) :</span><span>₹${formatPrice(cgst)}</span></div>
      <div><span>SGST (${taxPercentDisplay}) :</span><span>₹${formatPrice(sgst)}</span></div>
      <div><span>Total Tax :</span><span>₹${formatPrice(finalTax)}</span></div>
    ` : ''}
    ${discount > 0 ? `
      <div><span>Discount :</span><span>-₹${formatPrice(discount)}</span></div>
    ` : ''}
    <div class="bold" style="font-size:11px; margin-top:4px;">
      <span>Grand Total :</span><span>₹${grandTotal}</span>
    </div>
  </div>

  <div class="divider"></div>

  ${selectedBill.paymentMethod ? `
    <div class="small">
      Payment Method: <strong>${selectedBill.paymentMethod}</strong>
    | 
    ${selectedBill.paymentMethod ? `
 ${selectedBill.paymentMethod.toUpperCase()}
    ${selectedBill.paymentMethod === "n/c" ? ' (COMPLIMENTARY)' : ''}
  </div>
` : ''}
  ` : ''}
  <div class="divider"></div>

  <div class="center small" style="margin-top:6px;">
    GST No: ${COMPANY_GST} |
    ${COMPANY_FSSAI ? `FSSAI: ${COMPANY_FSSAI}<br>` : ''}
  </div>

  <div class="center footer bold" style="margin-top:3px;">
    Thank You! Visit Again
  </div>
`;
  const printHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Bill - ${selectedBill.billNumber || 'Receipt'}</title>
  <style>
    body {
      font-family: monospace;
      font-size: 11px;
      width: 80mm;
      margin: 0 auto;
      padding: 4px 5px;
      line-height: 1.18;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .small { font-size: 9.5px; line-height: 1.15; }
    .header { margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 4px 0; }
    td { padding: 1px 0; vertical-align: top; }
    .divider { border-top: 1px dashed #000; margin: 5px 0; }
    .totals div { display: flex; justify-content: space-between; margin: 1px 0; }
    .footer { margin-top: 8px; text-align: center; }
  </style>
</head>
<body>
  ${printContent}
  
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  iframe.onload = () => {
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(printHTML);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.error("Print failed:", e);
      }
      setTimeout(() => {
        document.body.removeChild(iframe);
        setPrintLoading(false);
      }, 2000);
    }, 1000);
  };

  iframe.src = "about:blank";
}, [selectedBill, settings]);
// ── Replace your existing printBill function with this ──
const printBill = () => {
  silentPrintBill();
};

  // const printBill = () => {
  //   const billHtml = document.getElementById("bill-content").outerHTML;
  //   const printWindow = window.open("", "_blank", "width=800,height=600");

  //   const styles = document.querySelectorAll('link[rel="stylesheet"], style');
  //   let styleHtml = "";
  //   styles.forEach(tag => {
  //     styleHtml += tag.outerHTML;
  //   });

  //   printWindow.document.write(`
  //     <html>
  //       <head>
  //         <title>Bill</title>
  //         ${styleHtml}
  //         <style>
  //           body { margin: 0; padding: 20px; }
  //         </style>
  //       </head>
  //       <body>
  //         ${billHtml}
  //       </body>
  //     </html>
  //   `);

  //   printWindow.document.close();

  //   printWindow.onload = () => {
  //     const checkReady = setInterval(() => {
  //       const imagesLoaded = Array.from(printWindow.document.images).every(img => img.complete);
  //       if (imagesLoaded) {
  //         clearInterval(checkReady);
  //         printWindow.focus();
  //         printWindow.print();
  //       }
  //     }, 200);
  //   };
  // };




      const isInventoryView = billType === "inventory_bills";
      const isExpensesView = billType === "expenses";
      const list = billType === "customer" ? bills : isInventoryView ? inventoryBills : expensesBills;
      // Ensure list is an array
      const safeList = Array.isArray(list) ? list : [];

      // const filteredBills = filter === "all" ? safeList : safeList.filter((bill) => bill.status === filter);
      // const filteredBills = 
      //   filter === "all"
      //     ? safeList
      //     : safeList.filter((bill) => bill.status?.toLowerCase().trim() === filter.toLowerCase().trim());
  const filteredBills = safeList;
      
  // console.log({selectedBill},selectedBill?.createdAt);

      const [sortOrder, setSortOrder] = useState("desc"); // asc | desc


      const handleSort = () => {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      };

      const sortedBills = [...filteredBills].sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });

      const filtersMap = {
      customer: [
        { label: "All Bills", value: "all" },
        { label: "Paid", value: "Paid" },
        // { label: "Unpaid", value: "unpaid" },
      ],
      expenses: [
        { label: "All Expenses", value: "all" },
        { label: "Paid", value: "Paid" },
        { label: "Pending", value: "Pending" },
        // { label: "Approved", value: "Approved" },
        // { label: "Rejected", value: "Rejected" },
      ],
      inventory_bills: [
        { label: "All Items", value: "all" },
        { label: "Available", value: "Available" },
        { label: "Out of Stock", value: "Out of Stock" },
      ],
    };

      return (
      // <Suspense fallback={<Loading />}>
      hasPermission(user,"view_bill") && (
        <div className="min-h-screen bg-gray-50">
          
          {/* Header */}
          <header className="bg-white border-b">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center">
                  <Link href="/" className="text-orange-500 hover:text-pink-800 mr-4 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </Link>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Bills & Invoices</span>
                    {/* <p className="text-gray-600">Manage customer bills and invoices</p> */}
                  </div>
                  <div className="ml-6 flex items-center gap-3 absolute right-10">
                    <button
                      onClick={() => setBillType("customer")}
                      className={`px-3 py-2 rounded text-xs font-medium transition-all ${
                        billType === "customer" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Customer Bills
                    </button>
                    {/* <button
                      onClick={() => setBillType("expenses")}
                      className={`px-3 py-2 rounded text-xs font-medium transition-all ${
                        billType === "expenses" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Expenses Bills
                    </button> */}
                      {/* <button
                        onClick={() => setBillType("inventory_bills")}
                        className={`px-3 py-2 rounded text-xs font-medium transition-all ${
                          billType === "inventory_bills" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Inventory Bills
                      </button> */}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="min-w-7xl max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Filter Buttons */}
            <div className="bg-white shadow rounded border border-gray-100 px-6 py-4 mb-4">
              <div className="flex flex-wrap gap-3">
              {/* {filtersMap[billType].map((f) => (
        <button
          key={f.value}
          onClick={() => setFilter(f.value)}
          className={`px-4 py-2 rounded font-medium transition-all text-xs ${
            filter === f.value
              ? "bg-orange-500 text-white shadow"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {f.label}
        </button>
      ))} */}
          {/* <div className="flex flex-wrap gap-3">
    <button
    onClick={() => setFilter("unpaid")}   // ← explicit
    className={`px-4 py-2 rounded font-medium text-xs transition-all ${
      filter === "unpaid"
        ? "bg-orange-500 text-white shadow"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
  >
    All Bills (Unpaid)
  </button>

  <button
    onClick={() => setFilter("true")}     // ← or "paid" — choose one!
    className={`px-4 py-2 rounded font-medium text-xs transition-all ${
      filter === "true"  // or filter === "paid"
        ? "bg-orange-500 text-white shadow"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
  >
    Paid Bills
  </button>
            <button
  disabled={selectedOrders.length === 0}
  onClick={handleGenerateBills}
  className={`px-4 py-2 rounded text-xs font-medium transition-all ${
    selectedOrders.length === 0
      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
      : "bg-orange-500 text-white hover:bg-orange-600"
  }`}
>
  Generate Bill {selectedOrders.length > 0 && `(${selectedOrders.length})`}
</button>
</div> */}
<div className="flex flex-wrap gap-3">
  <button
    onClick={() => setFilter("unpaid")}
    className={`px-4 py-2 rounded font-medium text-xs transition-all ${
      filter === "unpaid"
        ? "bg-orange-500 text-white shadow"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
  >
    All Bills (Unpaid)
  </button>

  <button
    onClick={() => setFilter("paid")}
    className={`px-4 py-2 rounded font-medium text-xs transition-all ${
      filter === "paid"
        ? "bg-orange-500 text-white shadow"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
  >
    Paid Bills
  </button>

  <button
    disabled={selectedOrders.length === 0}
    onClick={handleGenerateBills}
    className={`px-4 py-2 rounded text-xs font-medium transition-all ${
      selectedOrders.length === 0
        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
        : "bg-orange-500 text-white hover:bg-orange-600"
    }`}
  >
    Generate Bill {selectedOrders.length > 0 && `(${selectedOrders.length})`}
  </button>
</div>
                {/* <button
                  onClick={() => setFilter("Paid")}
                  className={`px-4 py-2 rounded font-medium transition-all text-xs ${
                    filter === "paid" ? "bg-orange-500 text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Paid
                </button>
                <button
                  onClick={() => setFilter("unpaid")}
                  className={`px-4 py-2 rounded font-medium transition-all text-xs ${
                    filter === "pending"
                      ? "bg-pink-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  unpaid
                </button> */}
              </div>
            </div>

            {/* Bills Table */}
            <div className="bg-white rounded shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-orange-500">
                    <tr>
                      {filter !== "paid" && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                       Check 
                      </th>
                       )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Bill #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider flex items-center">
                        Date
                        <button onClick={handleSort} className="inline-flex items-center ml-2">
                  <ArrowUpDown color="currentColor" size={15} />
                </button>

                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedBills.map((bill) => (
                      // console.log({bill}),
                      <tr key={bill._id} className="hover:bg-gray-50">
                      {filter !== "paid" && (
                        <td className="px-6 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                          <input type="checkbox"    
                            checked={selectedOrders.includes(bill._id)}
                            onChange={() => toggleOrderSelection(bill._id)}
                          />
                        </td>
                        )}
                        <td className="px-6 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                         {filter === "paid"
                              ? `#${bill.billNumber || "N/A"}`                   
                              : `#${String(bill._id).slice(-6).toUpperCase()}`}   
                                  {/* {isInventoryView || isExpensesView ? `#${bill.billNumber}` : `#${bill.orderId}`} */}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          <div className="text-gray-900">{bill.customerName}</div>
                          <div className="text-gray-500">{bill.customerPhone || (isInventoryView ? "inventory" : isExpensesView ? "expense" : "")}</div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-900">
                          {new Date(bill.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-xs font-semibold text-green-600">
                          {/* ₹{bill.totalAmount} */}
                          {/* {Math.round(Number(bill.subtotal) + Number(bill.itemTaxes) + Number(bill.totalTaxAmount) - Number(bill.discount || 0))} */}
                        ₹{bill.orderType?.toLowerCase() === "expense" 
      ? Math.round(Number(bill.subtotal || 0))
      :  (
          Number(bill.subtotal || 0) + 
          Number(bill.itemTaxes || 0) + 
          Number(bill.totalTaxAmount || 0) - 
          Number(bill.discount || 0)
        )
    }
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          {bill.isSettled || bill.paymentStatus === "paid" || bill.status === "Paid" ? (
                            <span className="px-3 py-1 text-xs rounded-full font-medium bg-green-100 text-green-800">
                              Paid
                            </span>
                          ) : bill.paymentStatus === "partially_paid" ? (
                            <span className="px-3 py-1 text-xs rounded-full font-medium bg-blue-100 text-blue-800">
                              Partial (Due: ₹{bill.balanceDuePaise !== undefined ? (bill.balanceDuePaise / 100).toFixed(2) : ""})
                            </span>
                          ) : (
                            <span className="px-3 py-1 text-xs rounded-full font-medium bg-amber-100 text-amber-800">
                              Unpaid
                            </span>
                          )}
                        </td>
                        
                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => {
                              setSelectedBill(bill)
                              setShowBillModal(true)
                            }}
                            className="text-pink-600 hover:text-pink-900 font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBill(bill)
                              setTimeout(printBill, 100)
                            }}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Print
                          </button>
                        </td> */}

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3 flex items-center">
                          {/* View */}
                        {hasPermission(user,"edit_bill") &&(
                          <button
                            onClick={() => {
                              setSelectedBill(bill);
                              setShowBillModal(true);
                            }}
                            className="relative group text-orange-500 hover:text-orange-600 transition-colors"
                          >
                            <Eye size={18} />
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200">
                              View
                            </span>
                          </button>
                        )}

                        {/* Record Payment Button */}
                        {(!bill.isSettled && (bill.balanceDuePaise === undefined || bill.balanceDuePaise > 0)) && (
                          <button
                            onClick={() => handleOpenPayment(bill)}
                            className="relative group text-green-600 hover:text-green-700 transition-colors"
                            title="Record Payment"
                          >
                            <CreditCard size={18} />
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200">
                              Pay
                            </span>
                          </button>
                        )}

                        {/* Issue Credit Note / Refund Button */}
                        <button
                          onClick={() => handleOpenCreditNote(bill)}
                          className="relative group text-indigo-600 hover:text-indigo-700 transition-colors"
                          title="Issue Credit Note / Refund"
                        >
                          <RotateCcw size={18} />
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200">
                            Credit Note
                          </span>
                        </button>
                          {/* <button
                            onClick={() => {
                              setSelectedBill(bill);
                              // printBill();
                              setTimeout(printBill, 1000);
                            }}
                            className="relative group text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            <Printer size={18} />
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200">
                              Print
                            </span>
                          </button> */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
              </table>
              {/* Infinite Scroll Loader */}
{/* Infinite Scroll Loader */}
              {billType === "customer" && (
                <div ref={loaderRef} className="py-8 text-center">
                  {loadingMore ? (
                    <div className="flex justify-center items-center space-x-2">
                      <Loader className="animate-spin w-5 h-5 text-orange-500" />
                      <span className="text-sm text-gray-500">Loading more...</span>
                    </div>
                  ) : hasMore ? (
                    <p className="text-xs text-gray-400">Scroll down to load more</p>
                  ) : bills.length > 0 ? (
                    <p className="text-xs text-gray-400">All bills loaded ({bills.length})</p>
                  ) : null}
                </div>
              )}
            </div>
                      {/* Infinite Scroll Loader
                {hasMore && (
                  <div id="load-more-sentinel" className="py-8 text-center">
                    {loadingMore ? (
                      <div className="flex justify-center">
                        <Loader className="animate-spin w-6 h-6 text-orange-500" />
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Scroll down to load more...</p>
                    )}
                  </div>
                )}

                {!hasMore && sortedBills.length > 0 && (
                  <div className="py-8 text-center text-gray-500 text-sm">
                    You've reached the end
                  </div>
                )} */}
              </div>
            </div>

            {/* Bill Modal */}
         {/* Bill Modal */}
{showBillModal && selectedBill && (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 print-hide">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto relative">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white border-b z-20 px-6 py-4 flex justify-between items-center shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">
          Bill Preview #{selectedBill.billNumber || "N/A"}
        </h2>
        <div className="flex items-center gap-3">
          {(!selectedBill.isSettled && (selectedBill.balanceDuePaise === undefined || selectedBill.balanceDuePaise > 0)) && (
            <button
              onClick={() => handleOpenPayment(selectedBill)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium shadow-sm text-sm"
            >
              <CreditCard size={16} />
              Record Payment
            </button>
          )}

          <button
            onClick={() => handleOpenCreditNote(selectedBill)}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium shadow-sm text-sm"
          >
            <RotateCcw size={16} />
            Credit Note
          </button>

          <button
            onClick={printBill}
            disabled={printLoading}
            className={`flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm ${
              printLoading ? "opacity-70 cursor-wait" : ""
            }`}
          >
            <Printer size={18} />
            {printLoading ? "Printing..." : "Print Receipt"}
          </button>
          <button
            onClick={() => setShowBillModal(false)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} className="text-gray-600 hover:text-gray-900" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        id="bill-content"
        className="p-6 sm:p-8 bg-white text-gray-900 font-poppins text-[14px] sm:text-[15px] leading-relaxed"
      >
        {/* Common Header - Logo + Restaurant Info */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 border-b border-gray-300 pb-4">
          <div className="flex justify-center sm:justify-start">
            <img src="/images/logo.png" alt="Logo" className="w-16 h-auto" />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900">
              {settings?.general?.restaurantName || "Restaurant Name"}
            </h1>
            <p className="text-sm text-gray-600">{settings?.general?.address}</p>
            <p className="text-sm text-gray-600">
              📞 {settings?.general?.phone} | ✉️ {settings?.general?.email}
            </p>
          </div>
        </div>

        {/* Bill Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="font-bold text-gray-800 mb-2">Bill To</h3>
            <p className="text-gray-700">{selectedBill.customerName || selectedBill.customerInfo?.name || "Guest"}</p>
            {selectedBill.customerPhone && <p>{selectedBill.customerPhone}</p>}
            {selectedBill.customerRoom && <p>Room: {selectedBill.customerRoom}</p>}
            {selectedBill.customerTable && <p>Table: {selectedBill.customerTable}</p>}
          </div>
          <div className="text-right text-sm">
            <p><strong>Bill #:</strong> {selectedBill.billNumber}</p>
            <p><strong>Date:</strong> {new Date(selectedBill.createdAt).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {new Date(selectedBill.createdAt).toLocaleTimeString()}</p>
            <p><strong>Type:</strong> {selectedBill.orderType || "Dine-in"}</p>
            {selectedBill.sourceOrdersCount && (
              <p><strong>Orders Combined:</strong> {selectedBill.sourceOrdersCount}</p>
            )}
          </div>
        </div>

        {/* ── CONTENT SWITCH: Grouped vs Single ── */}
        {selectedBill.groupedItems && selectedBill.groupedItems.length > 0 ? (
          // ── GROUPED / COMBINED BILL ──
          <div className="space-y-6 mb-8">
            {selectedBill.groupedItems.map((group) => (
              <div key={group.orderId} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-800 flex justify-between items-center">
                  <div>
                    Order #{group.orderNumber || group.orderId.slice(-6).toUpperCase()}
                    <span className="text-xs font-normal text-gray-600 ml-3">
                      {new Date(group.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-gray-800 text-left">
                        <th className="py-2 px-3 font-semibold">Item</th>
                        <th className="py-2 px-3 text-center font-semibold">Qty</th>
                        <th className="py-2 px-3 text-right font-semibold">Rate</th>
                        <th className="py-2 px-3 text-right font-semibold">Tax</th>
                        <th className="py-2 px-3 text-right font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item, idx) => (
                        <tr key={idx} className="border-t text-gray-700">
                          <td className="py-2 px-3">{item.name || item.nameEn || "Unknown Item"}</td>
                          <td className="py-2 px-3 text-center">{item.quantity}</td>
                          <td className="py-2 px-3 text-right">₹{Math.round(item.price)}</td>
                          <td className="py-2 px-3 text-right">
                            ₹{((item.price * item.quantity * (Number(item.tax) || 0)) / 100).toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right font-medium">
                            ₹{Math.round(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 px-4 py-2 text-right text-sm font-medium">
                  Subtotal: ₹{Math.round(group.subtotal)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // ── SINGLE / NORMAL BILL ──
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full border-t border-b border-gray-300 mb-6 text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-gray-800 text-left">
                    <th className="py-2 px-3 font-semibold">Item</th>
                    <th className="py-2 px-3 text-center font-semibold">Qty</th>
                    <th className="py-2 px-3 text-right font-semibold">Rate</th>
                    <th className="py-2 px-3 text-right font-semibold">Item Tax</th>
                    <th className="py-2 px-3 text-center font-semibold">Tax(%)</th>
                    <th className="py-2 px-3 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBill.items?.map((item, index) => {
                    const price = Number(item.price || 0);
                    const qty = Number(item.quantity || 1);
                    const taxPercent = Number(item.tax || 0);
                    const itemTotal = price * qty;
                    const taxAmount = (itemTotal * taxPercent) / 100;
                    const finalAmount = itemTotal + taxAmount;

                    return (
                      <tr key={index} className="border-t text-gray-700">
                        <td className="py-2 px-3">{item.name?.en || item.name || "Unknown Item"}</td>
                        <td className="py-2 px-3 text-center">{qty}</td>
                        <td className="py-2 px-3 text-right">₹{Math.round(price)}</td>
                        <td className="py-2 px-3 text-right">₹{taxAmount.toFixed(2)}</td>
                        <td className="py-2 px-3 text-center">{taxPercent}%</td>
                        <td className="py-2 px-3 text-right font-medium">₹{finalAmount.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary - works for both types */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 mt-8">
          <div className="w-full sm:w-64 border-t border-gray-300 pt-3 text-sm">
            {selectedBill.paymentMethod && (
              <div className="flex justify-between py-1">
                <p><strong>Payment Method:</strong> {selectedBill.paymentMethod}</p>
              </div>
            )}
          </div>

          <div className="w-full sm:w-64 border-t border-gray-300 pt-3 text-sm">
            <div className="flex justify-between py-1">
              <span>Subtotal</span>
              <span>₹{Math.round(Number(selectedBill.subtotal || 0))}</span>
            </div>

            {Number(selectedBill.itemTaxes || 0) > 0 && (
              <>
                <div className="flex justify-between py-1">
                  <span>CGST (2.5%)</span>
                  <span>₹{(Number(selectedBill.itemTaxes) / 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>SGST (2.5%)</span>
                  <span>₹{(Number(selectedBill.itemTaxes) / 2).toFixed(2)}</span>
                </div>
              </>
            )}

            {Number(selectedBill.discount || 0) > 0 && (
              <div className="flex justify-between py-1 text-red-600">
                <span>Discount</span>
                <span>-₹{Math.round(Number(selectedBill.discount))}</span>
              </div>
            )}

            <div className="flex justify-between py-2 mt-2 border-t border-gray-300 font-semibold text-lg">
              <span>Final Total</span>
              <span>
                ₹{Math.round(Number(selectedBill.grandTotal || selectedBill.totalAmount))}
              </span>
            </div>

            {selectedBill.balanceDuePaise !== undefined && (
              <div className={`flex justify-between py-2 border-t font-bold ${selectedBill.balanceDuePaise > 0 ? "text-amber-600" : "text-green-600"}`}>
                <span>Balance Due</span>
                <span>₹{(Number(selectedBill.balanceDuePaise) / 100).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment History / Receipts */}
        {selectedBill.paymentsList && selectedBill.paymentsList.length > 0 && (
          <div className="mt-8 border-t border-gray-200 pt-4">
            <h4 className="font-bold text-gray-800 text-sm mb-3">Payment Receipts & Tender Allocations</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 text-left">
                    <th className="py-2 px-3">Receipt #</th>
                    <th className="py-2 px-3">Tender</th>
                    <th className="py-2 px-3">Reference</th>
                    <th className="py-2 px-3 text-right">Amount Paid</th>
                    <th className="py-2 px-3 text-right">Recorded At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedBill.paymentsList.map((p, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-2 px-3 font-mono font-medium">{p.receiptNumber}</td>
                      <td className="py-2 px-3 uppercase">{p.tender}</td>
                      <td className="py-2 px-3 text-gray-500">{p.referenceNumber || "-"}</td>
                      <td className="py-2 px-3 text-right font-semibold text-green-700">₹{p.amount || (Number(p.amountPaise)/100).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-gray-500">{p.recordedAt ? new Date(p.recordedAt).toLocaleTimeString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Linked Credit Notes / Adjustments */}
        {selectedBill.creditNotesList && selectedBill.creditNotesList.length > 0 && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h4 className="font-bold text-sm mb-3 text-indigo-900">Linked Credit Notes & Corrections</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-indigo-50 text-indigo-900 text-left">
                    <th className="py-2 px-3">Credit Note #</th>
                    <th className="py-2 px-3">Reason</th>
                    <th className="py-2 px-3">Remarks</th>
                    <th className="py-2 px-3 text-right">Credit Amount</th>
                    <th className="py-2 px-3 text-right">Issued At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedBill.creditNotesList.map((cn, idx) => (
                    <tr key={idx} className="hover:bg-indigo-50/50">
                      <td className="py-2 px-3 font-mono font-medium text-indigo-700">{cn.creditNoteNumber}</td>
                      <td className="py-2 px-3 uppercase text-gray-700">{cn.reasonCode || "-"}</td>
                      <td className="py-2 px-3 text-gray-500">{cn.reasonText || "-"}</td>
                      <td className="py-2 px-3 text-right font-semibold text-rose-600">-₹{cn.amount || (Number(cn.amountPaise)/100).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-gray-500">{cn.issuedAt ? new Date(cn.issuedAt).toLocaleTimeString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Common Footer */}
        <div className="text-center mt-10 pt-6 border-t border-gray-200">
          <p className="text-gray-600 text-sm">
            {settings?.pos?.receiptFooter || "Thank You! Visit Again"}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            GST No: <strong>{settings?.general?.gst}</strong> | 
            FSSAI No: <strong>{settings?.general?.fssai}</strong>
          </p>
        </div>
      </div>
    </div>
  </div>
)}

            { loading && (
              <div className="text-center py-12">
                <div className="bg-white rounded shadow-lg px-8 py-10 max-w-md mx-auto flex flex-col items-center space-y-2">
                  <Loader className="animate-spin w-7 h-7 text-orange-500" />
                  <p className="text-sm font-medium text-gray-500">Loading bills...</p>
                </div>
              </div>
              )
            }



            {filteredBills.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="bg-white rounded-xl shadow-lg p-12 max-w-md mx-auto">
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No bills found</h3>
                  <p className="text-gray-500">Bills will appear here once orders are completed.</p>
                </div>
              </div>
            )}
                        {showGenerateModal && (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
      <h2 className="text-xl font-bold mb-6 text-center">Generate Combined Bill</h2>
      
      <p className="text-gray-600 mb-4 text-center">
        You selected {selectedOrders.length} orders.<br/>
        One combined bill will be created.
      </p>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Method
        </label>
        <select
          value={selectedPaymentMethod}
          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
        >
          <option value="">Select payment</option>
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="creditcard">Credit Card</option>
          <option value="debitcard">Debit Card</option>
          <option value="btc">BTC</option>
          <option value="n/c">N/C</option>

          {/* <option value="Credit"></option> */}
        </select>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setShowGenerateModal(false)}
          className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={generateBillWithPayment}
          className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700"
        >
          Generate Bill
        </button>
      </div>
    </div>
  </div>
)}

      {/* Split Payment Modal */}
      {showPaymentModal && paymentTargetBill && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-5 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Invoice:</span>
                <span className="font-semibold">{paymentTargetBill.billNumber || paymentTargetBill._id}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Customer:</span>
                <span>{paymentTargetBill.customerName || "Guest"}</span>
              </div>
              <div className="flex justify-between py-1 font-bold text-base text-gray-900 border-t mt-2 pt-2">
                <span>Remaining Due:</span>
                <span className="text-orange-600">₹{paymentAmount}</span>
              </div>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <input
                  type="checkbox"
                  id="splitToggle"
                  checked={isSplitTender}
                  onChange={(e) => setIsSplitTender(e.target.checked)}
                  className="rounded text-orange-600"
                />
                <label htmlFor="splitToggle" className="text-sm font-medium text-gray-700">
                  Split Tender (Cash + UPI)
                </label>
              </div>

              {!isSplitTender ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                      Payment Tender
                    </label>
                    <select
                      value={paymentTender}
                      onChange={(e) => setPaymentTender(e.target.value)}
                      className="w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI / QR</option>
                      <option value="card">Credit / Debit Card</option>
                      <option value="debtor">Customer Credit / Ledger</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                      Amount to Pay (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 font-semibold"
                      required
                    />
                  </div>

                  {paymentTender === "cash" && (
                    <div className="grid grid-cols-2 gap-3 bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Cash Tendered (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={cashTendered}
                          onChange={(e) => setCashTendered(e.target.value)}
                          className="w-full p-2 border rounded text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Change Due (₹)</label>
                        <div className="p-2 font-bold text-sm text-green-700">
                          ₹{Math.max(0, (parseFloat(cashTendered || "0") - parseFloat(paymentAmount || "0"))).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentTender !== "cash" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                        Transaction Reference / Auth Code
                      </label>
                      <input
                        type="text"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="e.g. UPI Ref # or Card Auth Code"
                        className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-xs font-medium text-blue-900">Enter amounts for each tender:</p>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Cash Amount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 300"
                      value={splitCashAmount}
                      onChange={(e) => setSplitCashAmount(e.target.value)}
                      className="w-full p-2 border rounded text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">UPI Amount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 200"
                      value={splitUpiAmount}
                      onChange={(e) => setSplitUpiAmount(e.target.value)}
                      className="w-full p-2 border rounded text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">UPI Reference #</label>
                    <input
                      type="text"
                      placeholder="UPI Txn ID"
                      value={splitUpiRef}
                      onChange={(e) => setSplitUpiRef(e.target.value)}
                      className="w-full p-2 border rounded text-sm bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-lg hover:bg-gray-300 font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 font-medium text-sm flex items-center justify-center gap-2"
                >
                  {isSubmittingPayment ? <Loader className="animate-spin w-4 h-4" /> : <CheckCircle2 size={16} />}
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit Note & Refund Modal */}
      {showCreditNoteModal && creditNoteTargetBill && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="text-indigo-600" size={20} />
                <h2 className="text-xl font-bold text-gray-900">Issue Credit Note / Refund</h2>
              </div>
              <button onClick={() => setShowCreditNoteModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="bg-indigo-50/60 p-4 rounded-lg mb-5 text-sm border border-indigo-100">
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Invoice:</span>
                <span className="font-mono font-semibold text-indigo-900">{creditNoteTargetBill.billNumber || creditNoteTargetBill._id}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Original Total:</span>
                <span className="font-semibold">₹{creditNoteTargetBill.totalAmount || creditNoteTargetBill.grandTotal || "0.00"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Current Balance Due:</span>
                <span className="font-semibold text-amber-700">₹{creditNoteTargetBill.balanceDuePaise !== undefined ? (creditNoteTargetBill.balanceDuePaise / 100).toFixed(2) : "0.00"}</span>
              </div>
            </div>

            <form onSubmit={handleSubmitCreditNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credit Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={creditNoteAmount}
                  onChange={(e) => setCreditNoteAmount(e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-base font-bold bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason Code *
                </label>
                <select
                  value={creditNoteReason}
                  onChange={(e) => setCreditNoteReason(e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white text-gray-900"
                >
                  <option value="guest_satisfaction">Guest Satisfaction / Service Recovery</option>
                  <option value="food_quality">Food Quality / Kitchen Defect</option>
                  <option value="billing_error">Billing / Pricing Error</option>
                  <option value="item_cancelled">Item Cancelled Post-Bill</option>
                  <option value="damaged_spillage">Damaged / Spilled Item</option>
                  <option value="manager_comp">Manager Discretionary Comp</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Explanation / Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Guest returned cold soup; approved 50% waiver"
                  value={creditNoteReasonText}
                  onChange={(e) => setCreditNoteReasonText(e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inventory Disposition
                </label>
                <select
                  value={creditNoteDisposition}
                  onChange={(e) => setCreditNoteDisposition(e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white text-gray-900"
                >
                  <option value="wastage">Food Wastage (Prepared food cannot be returned to stock)</option>
                  <option value="restocked">Restocked (Unopened packaged goods / beverages)</option>
                  <option value="none">No Physical Return (Service or price correction only)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refund Method (for paid amounts)
                </label>
                <select
                  value={creditNoteRefundTender}
                  onChange={(e) => setCreditNoteRefundTender(e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white text-gray-900"
                >
                  <option value="none">Retain as Customer Credit (No immediate cash out)</option>
                  <option value="cash">Cash Drawer Refund</option>
                  <option value="upi">UPI / Bank Reversal</option>
                  <option value="card">Card Reversal</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreditNoteModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-lg hover:bg-gray-300 font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreditNote}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-medium text-sm flex items-center justify-center gap-2"
                >
                  {isSubmittingCreditNote ? <Loader className="animate-spin w-4 h-4" /> : <RotateCcw size={16} />}
                  Issue Credit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

          </div>

      )
      // </Suspense>
    );
    }
