
"use client";
import { useState, useEffect } from "react";
import QRCode from "qrcode";
import AdminHeader from "@/components/AdminHeader";

export default function FeedbackQRGenerator() {
  const [qrCode, setQrCode] = useState("");
  const [url, setUrl] = useState("");           // ← start empty

  useEffect(() => {
    // Safe: this runs only in browser
    const currentUrl = `${window.location.origin}/feedback-form`;
    setUrl(currentUrl);

    QRCode.toDataURL(currentUrl, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#DC2626", light: "#ffffff" },
    })
      .then(setQrCode)
      .catch(console.error);
  }, []); // ← empty dependency = runs once on mount

  const downloadQR = () => {
    if (!qrCode) return;
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = "feedback-qr-hotel-pos.png";
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader
        title="Feedback QR Code"
        subtitle="Generate QR for customer feedback"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Feedback QR" },
        ]}
      />

      <div className="my-2 max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white">
        <div className="flex flex-col max-w-lg items-center justify-center space-y-4">
          <h3 className="text-xl font-semibold">Customer Feedback QR</h3>
          <p className="text-gray-600">Let customers scan and share their experience</p>

          {qrCode ? (
            <>
              <div className="p-4 bg-white shadow-md rounded-lg">
                <img src={qrCode} alt="Feedback QR Code" className="w-64 h-64" />
              </div>
              <p className="text-sm text-gray-500 break-all text-center max-w-xs">
                {url}
              </p>
              <button
                onClick={downloadQR}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Download QR Code
              </button>
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">Generating QR code...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// "use client";
// import { useState } from "react";
// import AdminHeader from "@/components/AdminHeader";

// // In your dashboard component
// import QRCode from 'qrcode';
// import { useEffect, useRef } from 'react';

// useEffect(() => {
//   const generateMainFeedbackQR = async () => {
//     try {
//       const url = `${window.location.origin}/feedback`; // ← this is the only URL

//       const qrCodeDataUrl = await QRCode.toDataURL(url, {
//         width: 280,
//         margin: 2,
//         errorCorrectionLevel: 'H', // high error correction = better for print/scan
//         color: {
//           dark: "#DC2626", // your brand red
//           light: "#ffffff",
//         },
//       });

//       setFeedbackQR(qrCodeDataUrl);
//       setFeedbackUrl(url);
//     } catch (err) {
//       console.error("Failed to generate feedback QR:", err);
//     }
//   };

//   generateMainFeedbackQR();
// }, []);
// export default function FeedbackPage() {
//   const [submitted, setSubmitted] = useState(false);

//   async function handleSubmit(e) {
//     e.preventDefault();

//     const formData = {
//       food: e.target.food.value,
//       service: e.target.service.value,
//       cleanliness: e.target.cleanliness.value,
//       rating: e.target.rating.value,
//       suggestion: e.target.suggestion.value,
//     };

//     await fetch("/api/feedback", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(formData),
//     });

//     setSubmitted(true);
//   }

//   if (submitted) {
//     return <h2>Thank you! Your feedback has been submitted.</h2>;
//   }
// const feedbackUrl = `${window.location.origin}/feedback`;
//   return (
      // <div className="min-h-screen bg-gray-50">
      //       <AdminHeader
      //         title="Table Management"
      //         subtitle="Manage tables and generate QR codes for digital menu access"
      //         breadcrumbs={[
      //           { label: "Dashboard", href: "/" },
      //           { label: "Table Management" },
      //         ]}
      //         // actionButton={
      //         //   hasPermission(user, "add_table") && (
      //         //     <button
      //         //       onClick={() => setShowAddForm(true)}
      //         //       className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 sm:px-6 py-2 sm:py-2 rounded text-xs hover:from-ornage-600 hover:to-orange-600 font-medium shadow-lg transition-all transform hover:scale-105 w-full sm:w-auto"
      //         //     >
      //         //       Add New Table
      //         //     </button>
      //         //   )
      //         // }
      //       />
//             <div className="max-w-full mx-auto px-4 sm:px-4 lg:px-8 py-5 bg-gray-50">

//   <div className="feedback-qr-section">
//   <h3>Customer Feedback QR</h3>
//   <p>Scan to give feedback (no table number needed)</p>
  
//   {feedbackQR ? (
//     <div className="qr-container">
//       <img src={feedbackQR} alt="Feedback QR Code" />
//       <p className="url-preview">{feedbackUrl}</p>
//     </div>
//   ) : (
//     <p>Generating QR code...</p>
//   )}

//   {/* Optional: download button */}
//   <button
//     onClick={() => {
//       const link = document.createElement('a');
//       link.href = feedbackQR;
//       link.download = 'feedback-qr-aju.png';
//       link.click();
//     }}
//   >
//     Download QR
//   </button>
// </div>
//     </div>
//     </div>
//   );
// }
