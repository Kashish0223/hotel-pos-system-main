// app/feedback/page.js
"use client";
import { useState, useEffect } from "react";

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [error, setError] = useState("");

 
  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/feedback");
      if (!res.ok) throw new Error("Failed to fetch feedbacks");
      const data = await res.json();
      setFeedbacks(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load feedbacks");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-2 px-4">
       <h1 className="p-2 mb-4 font-semibold text-md text-orange-600 bg-white rounded-xl shadow-lg flex justify-between items-center py-3 sm:py-2 md:py-3">
            Customer Feedbacks
        </h1>
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading feedbacks...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center">
            {error}
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-600 text-lg">No feedbacks yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {feedbacks.map((fb, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow p-4 border-l-4 border-orange-500"
              >
                <div className="flex justify-between items-start">
 <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-orange-600">
                      Overview
                    </p>
                  </div>

                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(fb.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Updated grid - now shows all fields including money & staff */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <span className="font-medium">Food:</span> {fb.food || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Service:</span> {fb.service || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Staff:</span> {fb.staff || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Value of Money:</span> {fb.money || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Cleanliness:</span>{" "}
                    {fb.cleanliness || "N/A"}
                  </div>
                  {/* If you have email later */}
                  {fb.email && (
                    <div>
                      <span className="font-medium">Email:</span> {fb.email}
                    </div>
                  )}
                </div>

                {fb.suggestion && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="font-medium text-gray-700">Suggestion:</p>
                    <p className="text-gray-600 mt-1 whitespace-pre-wrap">
                      {fb.suggestion}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// "use client";
// import { useState, useEffect } from "react";
// import AdminHeader from "@/components/AdminHeader";

// export default function FeedbacksPage() {
//   const [feedbacks, setFeedbacks] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [password, setPassword] = useState("");
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [error, setError] = useState("");

//   const SECRET_KEY = process.env.NEXT_PUBLIC_FEEDBACK_SECRET_KEY || "your-secret-key-2026"; 

//   // Check localStorage on mount
//   useEffect(() => {
//     const storedKey = localStorage.getItem("feedbackSecretKey");
//     if (storedKey === SECRET_KEY) {
//       setIsAuthenticated(true);
//       fetchFeedbacks();
//     } else {
//       setLoading(false);
//     }
//   }, []);

//   const fetchFeedbacks = async () => {
//     try {
//       setLoading(true);
//       const res = await fetch("/api/feedback");
//       if (!res.ok) throw new Error("Failed to fetch feedbacks");
//       const data = await res.json();
//       setFeedbacks(data);
//     } catch (err) {
//       console.error(err);
//       setError("Failed to load feedbacks");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (password === SECRET_KEY) {
//       localStorage.setItem("feedbackSecretKey", SECRET_KEY);
//       setIsAuthenticated(true);
//       setError("");
//       fetchFeedbacks();
//     } else {
//       setError("Incorrect secret key");
//     }
//   };

//   const handleLogout = () => {
//     localStorage.removeItem("feedbackSecretKey");
//     setIsAuthenticated(false);
//     setPassword("");
//     setFeedbacks([]);
//   };

//   if (!isAuthenticated) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">       
//         <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <input
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               placeholder="Enter secret key"
//               className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
//               autoFocus
//             />
            
//             {error && (
//               <p className="text-red-600 text-center text-sm">{error}</p>
//             )}

//             <button
//               type="submit"
//               className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition"
//             >
//               Access Feedbacks
//             </button>
//           </form>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 py-2 px-4">
        // <h1 className="p-2 font-semibold text-md text-orange-600 bg-white rounded-xl shadow-lg flex justify-between items-center py-3 sm:py-2 md:py-3">
        //     Customer Feedbacks
        // </h1>
//       <div className="max-w-4xl mx-auto">
        // <div className="flex justify-between items-center mb-8">
        //   {/* <h1 className="text-3xl font-bold text-gray-800">
        //     Customer Feedbacks
        //   </h1>
        //   <button
        //     onClick={handleLogout}
        //     className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
        //   >
        //     Logout
        //   </button> */}
        // </div>

//         {loading ? (
//           <div className="text-center py-12">
//             <p className="text-gray-500">Loading feedbacks...</p>
//           </div>
//         ) : feedbacks.length === 0 ? (
//           <div className="bg-white rounded-xl shadow p-8 text-center">
//             <p className="text-gray-600 text-lg">No feedbacks yet</p>
//           </div>
//         ) : (
//           <div className="space-y-6">
//             {feedbacks.map((fb, index) => (
//               <div
//                 key={index}
//                 className="bg-white rounded-xl shadow p-2 border-l-4 border-orange-500"
//               >
//                 <div className="flex justify-between items-start mb-3">
//                   <div>
//                     <p className="font-medium text-gray-800">
//                       Overall Rating: <span className="text-lg text-yellow-500">{"★".repeat(fb.rating)}</span>
//                       <span className="text-gray-500 ml-2">({fb.rating}/5)</span>
//                     </p>
//                   </div>
//                   <p className="text-sm text-gray-500">
//                     {new Date(fb.createdAt).toLocaleString()}
//                   </p>
//                 </div>

//                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-sm">
//                   <div>
//                     <span className="font-medium">Food:</span> {fb.food}
//                   </div>
//                   <div>
//                     <span className="font-medium">Service:</span> {fb.service}
//                   </div>
//                   <div>
//                     <span className="font-medium">Cleanliness:</span> {fb.cleanliness}
//                   </div>
//                 </div>

//                 {fb.suggestion && (
//                   <div className="pt-2 border-t">
//                     <p className="font-medium text-gray-700">Suggestion:</p>
//                     <p className="text-gray-600 mt-1">{fb.suggestion}</p>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }