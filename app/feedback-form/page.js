// app/feedback/page.js
"use client";
import { useState } from "react";
import { Mail } from "lucide-react";

export default function FeedbackPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Store selected rating for each field (1 to 5)
  const [ratings, setRatings] = useState({
    food: 0,
    service: 0,
    staff: 0,
    money: 0,
    cleanliness: 0,
  });

  // Map rating number to label text
  const getRatingLabel = (num) => {
    if (num === 1) return "Poor";
    if (num === 2) return "Fair";
    if (num === 3) return "Good";
    if (num === 4) return "Excellent";
    return ""; // No label if not selected (but we show default below)
  };

  // Always show a default label even when 0 stars are selected

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    // Convert number to text (same as your original logic)
    const toText = (num) => {
      if (num === 1) return "Poor";
      if (num === 2) return "Fair";
      if (num === 3 ) return "Good";
      if (num === 4) return "Excellent";
      return "";
    };

    const formData = {
      food: toText(ratings.food),
      service: toText(ratings.service),
      money: toText(ratings.money),
      staff: toText(ratings.staff),
      cleanliness: toText(ratings.cleanliness),
      email: e.target.email.value,
      suggestion: e.target.suggestion.value.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to submit");
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-green-600 mb-4">Thank You!</h2>
          <p className="text-gray-600">Your feedback means a lot to us ❤️</p>
        </div>
      </div>
    );
  }

  const StarRating = ({ field, emoji, label }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{emoji}</span>
        <label className="text-md font-medium text-gray-800">{label}</label>
      </div>

      {/* Stars */}
      {/* <div className="flex gap-3 justify-center">
        {[1, 2, 3, 4].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRatings((prev) => ({ ...prev, [field]: star }))}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <span
              className={`text-4xl ${
                star <= ratings[field] ? "text-yellow-400" : "text-gray-300"
              }`}
            >
              ★
            </span>
          </button>
        ))}
      </div>
       */}
       <div className="flex flex-col items-center">
  {/* Stars row */}
  <div className="flex gap-8 justify-center">
    {[1, 2, 3, 4].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => setRatings((prev) => ({ ...prev, [field]: star }))}
        className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
      >
        <span
          className={`text-4xl sm:text-5xl ${
            star <= ratings[field] ? "text-yellow-400" : "text-gray-300"
          } drop-shadow-sm`}
        >
          ★
        </span>
      </button>
    ))}
  </div>

  {/* Fixed labels under each star - always visible */}
  <div className="flex justify-between w-full max-w-[280px] text-xs sm:text-sm font-medium text-gray-600 mt-1">
    <span className="text-center flex-1">Poor</span>
    <span className="text-center flex-1">Fair</span>
    <span className="text-center flex-1">Good</span>
    <span className="text-center flex-1">Excellent</span>
  </div>
</div>

      {/* Always-visible label under stars */}
      {/* <div className="text-center text-sm font-medium text-gray-600 mt-1 min-h-[1.25rem]">
         {ratings[field] > 0 ? getRatingLabel(ratings[field]) : ""}
      </div> */}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-2 py-2 text-center">
            <img src="/images/logo.png" alt="Logo" className="h-16 mx-auto mb-2" />
            <h1 className="text-2xl font-bold text-white ">Rate Your Experience</h1>
            <p className="text-orange-100 text-sm">Your opinion matters — it takes only 30 seconds!</p>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-2">
            {/* Email */}
            <div className="relative w-full mb-4">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                required
                placeholder="Your Email Address"
                className="w-full pl-12 pr-5 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700 placeholder-gray-400"
              />
            </div>

            {/* Star Ratings with Labels Below */}
            <div className="space-y-8">
              <StarRating field="food" emoji="🍽️" label="Food Quality" />
              <StarRating field="service" emoji="🛎️" label="Service Quality" />
              <StarRating field="staff" emoji="😊" label="Staff Friendliness" />
              <StarRating field="money" emoji="💰" label="Value for Money" />
              <StarRating field="cleanliness" emoji="✨" label="Cleanliness" />
            </div>

            {/* Suggestion */}
            <div>
              <label className="block py-4 text-sm font-medium text-gray-800 mb-1">
                Additional Comments (Optional)
              </label>
              <textarea
                name="suggestion"
                rows={5}
                placeholder="Tell us what we can improve..."
                className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-gray-700 placeholder-gray-400"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || Object.values(ratings).some((r) => r === 0)}
              className="w-full bg-orange-600 text-white py-2 rounded-full text-md hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit Your Feedback"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// // app/feedback/page.js
// "use client";
// import { useState } from "react";
// import {
//   MapPin,
//   Mail
// } from "lucide-react"

// export default function FeedbackPage() {
//   const [submitted, setSubmitted] = useState(false);
//   const [loading, setLoading] = useState(false);
  
//   // Store selected rating for each field
//   const [ratings, setRatings] = useState({
//     food: 0,
//     service: 0,
//     staff: 0,
//     money: 0,
//     cleanliness: 0,
//   });

//   async function handleSubmit(e) {
//     e.preventDefault();
//     setLoading(true);

//     // Convert number to text exactly like before
//     const toText = (num) => {
//       if (num === 1) return "Poor";
//       if (num === 2) return "Fair";
//       if (num === 3) return "Good";
//       if (num === 4) return "Excellent";
//       return "";
//     };

//     const formData = {
//       food: toText(ratings.food),
//       service: toText(ratings.service),
//       money: toText(ratings.money),
//       staff: toText(ratings.staff),
//       cleanliness: toText(ratings.cleanliness),
//       email: e.target.email.value,
//       suggestion: e.target.suggestion.value.trim(),
//       createdAt: new Date().toISOString(),
//     };

//     try {
//       const res = await fetch("/api/feedback", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(formData),
//       });

//       if (!res.ok) throw new Error("Failed to submit");
//       setSubmitted(true);
//     } catch (err) {
//       console.error(err);
//       alert("Something went wrong. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   }

//   if (submitted) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
//         <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
//           <h2 className="text-2xl font-bold text-green-600 mb-4">Thank You!</h2>
//           <p className="text-gray-600">Your feedback means a lot to us ❤️</p>
//         </div>
//       </div>
//     );
//   }

//   const StarRating = ({ field, emoji, label }) => (
//     <div className="space-y-1">
//       <div className="flex items-center gap-3">
//         <span className="text-2xl">{emoji}</span>
//         <label className="text-md font-medium text-gray-800">{label}</label>
//       </div>
//       <div className="flex gap-3 justify-center">
//         {[1, 2, 3, 4].map((star) => (
//           <button
//             key={star}
//             type="button"
//             onClick={() => setRatings(prev => ({ ...prev, [field]: star }))}
//             className="focus:outline-none transition-transform hover:scale-110"
//           >
//             <span className={`text-3xl ${star <= ratings[field] ? "text-yellow-400" : "text-gray-300"}`}>
//               ★
//             </span>
//           </button>
//         ))}
//       </div>
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-white py-12 px-4">
//       <div className="max-w-2xl mx-auto">
//         <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          // <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-2 py-2 text-center">
          //   <img src="/images/logo.png" alt="Logo" className="h-16 mx-auto mb-2" />
          //   <h1 className="text-2xl font-bold text-white ">Rate Your Experience</h1>
          //   <p className="text-orange-100 text-sm">Your opinion matters — it takes only 30 seconds!</p>
          // </div>

//           <form onSubmit={handleSubmit} className="p-6 space-y-8">
//             {/* Email */}
//       <div className="relative w-full">
//   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

//   <input
//     type="email"
//     name="email"
//     required
//     placeholder="Your Email Address"
//     className="w-full pl-12 pr-5 py-2 border border-gray-300 rounded-2xl 
//                focus:outline-none focus:ring-2 focus:ring-orange-500 
//                text-gray-700 placeholder-gray-400"
//   />
// </div>


//             {/* Star Ratings */}
//             <div className="space-y-2">
//               <StarRating field="food" emoji="🍽️" label="Food Quality" />
//               <StarRating field="service" emoji="🛎️" label="Service Quality" />
//               <StarRating field="staff" emoji="😊" label="Staff Friendliness" />
//               <StarRating field="money" emoji="💰" label="Value for Money" />
//               <StarRating field="cleanliness" emoji="✨" label="Cleanliness" />
//             </div>

//             {/* Suggestion */}
//             <div>
//               <label className="block text-md font-medium text-gray-800 mb-2">
//                 Additional Comments (Optional)
//               </label>
//               <textarea
//                 name="suggestion"
//                 rows={3}
//                 placeholder="Tell us what we can improve..."
//                 className="w-full px-5 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-gray-700 placeholder-gray-400"
//               />
//             </div>

//             {/* Submit Button */}
//             <button
//               type="submit"
//               disabled={loading || Object.values(ratings).some(r => r === 0)}
//               className="w-full bg-orange-600 text-white py-2 rounded-full font-semibold text-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {loading ? "Submitting..." : "Submit Your Feedback"}
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }
// export default function FeedbackPage() {
//   const [submitted, setSubmitted] = useState(false);
//   const [loading, setLoading] = useState(false);

//   async function handleSubmit(e) {
//     e.preventDefault();
//     setLoading(true);

//     const formData = {
//       food: e.target.food.value,
//       service: e.target.service.value,
//       money: e.target.money.value,
//       staff: e.target.staff.value,
//       email: e.target.email.value,
//       cleanliness: e.target.cleanliness.value,
//       suggestion: e.target.suggestion.value.trim(),
//       createdAt: new Date().toISOString(),
//     };

//     try {
//       const res = await fetch("/api/feedback", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(formData),
//       });

//       if (!res.ok) throw new Error("Failed to submit");
//       setSubmitted(true);
//     } catch (err) {
//       console.error(err);
//       alert("Something went wrong. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   }

//   if (submitted) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
//         <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
//           <h2 className="text-2xl font-bold text-green-600 mb-4">Thank You!</h2>
//           <p className="text-gray-600">Your feedback means a lot to us ❤️</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-white py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-2xl mx-auto">
//         <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-orange-200/40 overflow-hidden">
//           <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-6 text-white text-center relative">
//             <img
//               src="/images/logo.png"
//               alt="Restaurant Logo"
//               className="h-16 w-auto mx-auto mb-4 drop-shadow-lg"
//             />
//             <h1 className="text-3xl sm:text-4xl font-bold mb-2 drop-shadow-md">
//               How Was Your Visit?
//             </h1>
//             <p className="text-orange-100 text-lg opacity-90">
//               Your opinion matters — it takes only 30 seconds!
//             </p>
//           </div>

//           <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
//             {/* d:\hotel-pos-system\app\feedback-form\page.js:70 */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Your Email Address
//               </label>
//               <input
//                 type="email"
//                 name="email"
//                 required
//                 placeholder="email@example.com"
//                 className="w-full p-2 border-orange-300 border rounded-lg"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Food of Quality
//               </label>
//               <select
//                 name="food"
//                 required
//                 className="w-full p-2 border-orange-300 border rounded-lg"
//               >
//                 <option value="">Select...</option>
//                 <option value="Excellent">Excellent</option>
//                 <option value="Good">Good</option>
//                 <option value="Fair">Fair</option>
//                 <option value="Poor">Poor</option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Quality of Service
//               </label>
//               <select
//                 name="service"
//                 required
//                 className="w-full p-2 border-orange-300 border rounded-lg"
//               >
//                 <option value="">Select...</option>
//                 <option value="Excellent">Excellent</option>
//                 <option value="Good">Good</option>
//                 <option value="Fair">Fair</option>
//                 <option value="Poor">Poor</option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Restaurant staff
//               </label>
//               <select
//                 name="staff"
//                 required
//                 className="w-full p-2 border-orange-300 border rounded-lg"
//               >
//                 <option value="">Select...</option>
//                 <option value="Excellent">Excellent</option>
//                 <option value="Good">Good</option>
//                 <option value="Fair">Fair</option>
//                 <option value="Poor">Poor</option>
//               </select>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Value of Money
//               </label>
//               <select
//                 name="money"
//                 required
//                 className="w-full p-2 border-orange-300 border rounded-lg"
//               >
//                 <option value="">Select...</option>
//                 <option value="Excellent">Excellent</option>
//                 <option value="Good">Good</option>
//                 <option value="Fair">Fair</option>
//                 <option value="Poor">Poor</option>
//               </select>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Cleanliness of Restaurant
//               </label>
//               <select
//                 name="cleanliness"
//                 required
//                 className="w-full p-2 border-orange-300 border rounded-lg"
//               >
//                 <option value="">Select...</option>
//                 <option value="Excellent">Excellent</option>
//                 <option value="Good">Good</option>
//                 <option value="Fair">Fair</option>
//                 <option value="Poor">Poor</option>
//               </select>
//             </div>

//             {/* <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Overall Rating
//             </label>
//             <select name="rating" required className="w-full p-2 border-orange-300 border rounded-lg">
//               <option value="">Select...</option>
//               <option value="5">5 ★ Excellent</option>
//               <option value="4">4 ★ Very Good</option>
//               <option value="3">3 ★ Good</option>
//               <option value="2">2 ★ Average</option>
//               <option value="1">1 ★ Poor</option>
//             </select>
//           </div> */}

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Any suggestions for us?
//               </label>
//               <textarea
//                 name="suggestion"
//                 rows={4}
//                 className="w-full p-2 border border-orange-300 rounded-lg"
//                 placeholder="We'd love to hear your thoughts..."
//               />
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium
//                      hover:bg-orange-700 transition disabled:opacity-50"
//             >
//               {loading ? "Submitting..." : "Submit Feedback"}
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }