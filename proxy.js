import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("hotel_pos_jwt")?.value;

  const accessControl = {
    "/menu": ["superadmin", "Manager", "Chef", "Waiter", "Cleaner", "Security", "Bartender", "Receptionist", "Cashier"],
    "/orders": ["superadmin", "Manager", "Chef", "Waiter", "Bartender", "Receptionist", "Cashier"],
    "/customers": ["superadmin", "Manager", "Receptionist", "Cashier"],
    "/inventory": ["superadmin", "Manager"],
    "/categories": ["superadmin", "Manager"],
    "/bills": ["superadmin", "Manager", "Cashier"],
    "/taxes": ["superadmin", "Manager"],
    "/expenses": ["superadmin", "Manager"],
    "/reports": ["superadmin", "Manager"],
    "/staff": ["superadmin", "Manager"],
    "/analysis": ["superadmin", "Manager"],
    "/kitchen-display": ["superadmin", "Chef", "Manager"],
    "/account":["customer"],
  };

  // Always allow these public routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/unauthorized") ||
    pathname.startsWith("/api/auth/logout") ||
    pathname.startsWith("/customer")
  ) {
    // Special case: if logged in and trying to access login → redirect to dashboard
    if (pathname.startsWith("/login") && token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Find if this is a protected staff route
  const matchedRoute = Object.keys(accessControl).find((route) =>
    pathname.startsWith(route)
  );

  // If it's NOT a protected route (e.g. /customer/menu, static files, etc.) → allow freely
  if (!matchedRoute) {
    return NextResponse.next();
  }

  // From here on: it's a protected staff route → require token + correct role
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role;

    if (!role) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const allowedRoles = accessControl[matchedRoute];

    if (!allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    return NextResponse.next();
  } catch (err) {
    console.error("JWT Verification Error:", err);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/orders",
    "/orders/:path*",
    "/customers",
    "/customers/:path*",
    "/inventory",
    "/inventory/:path*",
    "/categories",
    "/categories/:path*",
    "/bills",
    "/bills/:path*",
    "/taxes",
    "/expenses",
    "/reports",
    "/staff",
    "/settings",
    "/analysis",
    "/kitchen-display",
    "/kitchen-display/:path*",
    "/login"
  ],
};

// import { NextResponse } from "next/server";
// import { jwtVerify } from "jose";

// const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// export async function middleware(request) {
//   const { pathname } = request.nextUrl;

//   //   console.log("🟢 Middleware Triggered for URL:", pathname);
//   //   console.log("token in middleware -> ",request.cookies.get("token"));
//   const token = request.cookies.get("hotel_pos_jwt")?.value;
//   //   console.log("token in ",token);

//   const accessControl = {
//     "/menu": [
//       "superadmin",
//       "Manager",
//       "Chef",
//       "Waiter",
//       "Cleaner",
//       "Security",
//       "Bartender",
//       "Receptionist",
//       "Cashier",
//     ],
//     "/orders": [
//       "superadmin",
//       "Manager",
//       "Chef",
//       "Waiter",
//       "Bartender",
//       "Receptionist",
//       "Cashier",
//     ],
//     "/customers": ["superadmin", "Manager", "Receptionist", "Cashier"],
//     "/inventory": ["superadmin", "Manager"],
//     "/categories": ["superadmin", "Manager"],
//     "/bills": ["superadmin", "Manager", "Cashier"],
//     "/taxes": ["superadmin", "Manager"],
//     "/expenses": ["superadmin", "Manager"],
//     "/reports": ["superadmin", "Manager"],
//     "/staff": ["superadmin", "Manager"],
//     "/analysis": ["superadmin", "Manager"],
//     "/kitchen-display": ["superadmin", "Chef", "Manager"],
//   };

//   // if (pathname.startsWith("/login") || pathname.startsWith("/unauthorized") || pathname.startsWith("/api/auth/logout")) {
//   //   // console.log("⚠️ Skipping route (public):", pathname);
//   //   return NextResponse.next();
//   // }

//   // If user tries to access /login
//   if (pathname.startsWith("/login")) {
//     // If token exists, redirect to dashboard
//     if (token) {
//       return NextResponse.redirect(new URL("/", request.url));
//     }

//     // No token → allow access to login page
//     return NextResponse.next();
//   }

//   // Allow unauthorized page and logout API without checks
//   if (
//     pathname.startsWith("/unauthorized") ||
//     pathname.startsWith("/api/auth/logout") ||  
//     pathname.startsWith("/customer")
//   ) {
//     return NextResponse.next();
//   }

//     // 🔹 If NO token → Redirect to login (for protected routes)
//   if (!token) {

//     return NextResponse.redirect(new URL("/login", request.url));
//   }

//   const matchedRoute = Object.keys(accessControl).find((route) =>
//     pathname.startsWith(route)
//   );

//   // console.log("📌 Matched Route:", matchedRoute);

//   if (!matchedRoute) {
//     // console.log("🟢 No RBAC rule found → Allow access");
//     return NextResponse.next();
//   }

//   // Read token from Authorization header
//   //   console.log("🔍 Reading token::::-->>",request);
//   //   const authHeader = request.headers.get("Authorization");
//   //   console.log("🔍 Authorization Header:", authHeader);

//   //   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//   //     console.log("⛔ No token found → redirecting to login");
//   //     return NextResponse.redirect(new URL("/login", request.url));
//   //   }

//   //   const token = authHeader.split(" ")[1];
//   //   console.log("🔑 Extracted Token:", token);

//   try {
//     // console.log("🔐 Verifying JWT...");
//     const { payload } = await jwtVerify(token, secret);
//     const role = payload.role;

//     // console.log("🧾 Token Payload:", payload);
//     // console.log("👤 User Role:", role);

//     if (!role) {

//       // console.log("⛔ Token missing role → redirect login");
//       return NextResponse.redirect(new URL("/login", request.url));
//     }

//     const allowedRoles = accessControl[matchedRoute];
//     // console.log("📌 Allowed Roles for Route:", allowedRoles);

//     if (!allowedRoles.includes(role)) {
//       // console.log(`🚫 Role '${role}' DOES NOT have access to '${pathname}' → Unauthorized`);
//       return NextResponse.redirect(new URL("/unauthorized", request.url));
//     }

//     // console.log(`✅ Role '${role}' authorized for '${pathname}'`);
//     return NextResponse.next();
//   } catch (err) {
//     console.error("🔥 JWT Verification Error:", err);
//     return NextResponse.redirect(new URL("/login", request.url));
//   }
// }

// export const config = {
//   matcher: [
//     // "/menu",
//     "/orders",
//     "/orders/new/",
//     "/customers/",
//     // "/customer/",
//     "/inventory",
//     "/categories",
//     "/bills",
//     "/taxes",
//     "/expenses",
//     "/reports",
//     "/staff",
//     "/settings",
//     "/analysis",
//     "/kitchen-display",
//     // "/customer",
//     // "/customer/:path*",
//     "/customers",
//     "/customers/:path*",
//     "/kitchen-display/:path*",
//     "/analysis/:path*",
//     // "/menu/:path*",
//     "/orders/:path*",
//     "/orders/new/:path*",
//     "/customers/:path*",
//     "/inventory/:path*",
//     "/categories/:path*",
//     "/bills/:path*",
//     "/taxes/:path*",
//     "/expenses/:path*",
//     "/reports/:path*",
//     "/staff/:path*",
//     "/settings/:path*",
//     "/analysis/:path*",
//     "/login"
//   ],
// };

// // import { NextResponse } from "next/server";
// // import { jwtVerify } from "jose";
// // // import { getDatabase } from "./lib/db-config.js";

// // const secret = new TextEncoder().encode(process.env.JWT_SECRET);
// // export async function middleware(request) {
// //   const { pathname } = request.nextUrl;

// //   const accessControl = {
// //     "/menu": ["superadmin", "Manager", "Chef", "Waiter", "Cleaner", "Security", "Bartender", "Receptionist", "Cashier"],
// //   "/orders": ["superadmin", "Manager", "Chef", "Waiter", "Bartender", "Receptionist", "Cashier"],
// //   "/customers": ["superadmin", "Manager", "Receptionist", "Cashier"],
// //   "/inventory": ["superadmin", "Manager"],
// //   "/categories": ["superadmin", "Manager"],
// //   "/bills": ["superadmin", "Manager", "Cashier"],
// //   "/taxes": ["superadmin", "Manager"],
// //   "/expenses": ["superadmin", "Manager"],
// //   "/reports": ["superadmin", "Manager"],
// //   "/staff": ["superadmin"],
// //   "/analysis": ["superadmin","Manager"],
// //   };

// //   if (pathname.startsWith("/login") || pathname.startsWith("/unauthorized") || pathname.startsWith("/api/auth/logout")) {
// //     return NextResponse.next();
// //   }

// //   const matchedRoute = Object.keys(accessControl).find((route) =>
// //     pathname.startsWith(route)
// //   );

// //   if (!matchedRoute) return NextResponse.next();

// //   const token = request.cookies.get("hotel_pos_jwt")?.value;
// //   if (!token) return NextResponse.redirect(new URL("/login", request.url));

// //   try {
// //     const { payload } = await jwtVerify(token, secret);
// //     const role = payload.role;
// //     const tokenPermissions = payload.permissions || [];

// //     if (!role) return NextResponse.redirect(new URL("/login", request.url));

// //     // 🟣 NEW — FETCH permission from request header
// //     const allowedRoles = accessControl[matchedRoute];
// //     console.log("🔍 Request role:", allowedRoles);
// //     console.log("🔑 Token Permissions:", tokenPermissions);
// //     if (!allowedRoles.includes(role)) {
// //       return NextResponse.redirect(new URL("/unauthorized", request.url));
// //     }

// //     const res = NextResponse.next();
// //     res.headers.set("x-user", role);
// //     return res;

// //   }catch(err){
// //     console.error("🔥 JWT Verification Error:", err);
// //     return NextResponse.redirect(new URL("/login", request.url));
// //   }
// // }

// // export const config = {
// //   matcher: [
// //     "/menu/:path*",
// //     "/orders/:path*",
// //     "/customers/:path*",
// //     "/inventory/:path*",
// //     "/categories/:path*",
// //     "/bills/:path*",
// //     "/taxes/:path*",
// //     "/expenses/:path*",
// //     "/reports/:path*",
// //     "/staff/:path*",
// //     "/settings/:path*",
// //     "/analysis/:path*",
// //     "/kitchen_display/:path*",
// //   ],
// // };

// // import { NextResponse } from "next/server";
// // import { jwtVerify } from "jose";

// // const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-here-32-chars-min");

// // const accessControl = {
// //   "/menu": ["superadmin", "Manager", "Chef", "Waiter", "Cleaner", "Security", "Bartender", "Receptionist", "Cashier"],
// //   "/orders": ["superadmin", "Manager", "Chef", "Waiter", "Bartender", "Receptionist", "Cashier"],
// //   "/customers": ["superadmin", "Manager", "Receptionist", "Cashier"],
// //   "/inventory": ["superadmin", "Manager"],
// //   "/categories": ["superadmin", "Manager"],
// //   "/bills": ["superadmin", "Manager", "Cashier"],
// //   "/taxes": ["superadmin", "Manager"],
// //   "/expenses": ["superadmin", "Manager"],
// //   "/reports": ["superadmin", "Manager"],
// //   "/staff": ["superadmin"],
// // };

// // export async function middleware(request) {
// //   const { pathname } = request.nextUrl;

// //   console.log({ pathname });

// //   if (pathname.startsWith("/login") || pathname.startsWith("/unauthorized")) {
// //     return NextResponse.next();
// //   }

// //   const matchedRoute = Object.keys(accessControl).find((route) =>
// //     pathname.startsWith(route)
// //   );

// //   if (!matchedRoute) return NextResponse.next();

// //   const token = request.cookies.get("hotel_pos_jwt")?.value;
// //   if (!token) {
// //     return NextResponse.redirect(new URL("/login", request.url));
// //   }

// //   try {
// //     const { payload } = await jwtVerify(token, secret);
// //     const user = payload.user;

// //     if (!user || !user.role) {
// //       return NextResponse.redirect(new URL("/login", request.url));
// //     }

// //     const allowedRoles = accessControl[matchedRoute];
// //     console.log({ allowedRoles });
// //     if (!allowedRoles.includes(user.role)) {
// //       console.log("Access Denied",allowedRoles.includes(user.role));
// //       return NextResponse.redirect(new URL("/unauthorized", console.log(request.url)));
// //     }

// //     return NextResponse.next();
// //   } catch (err) {
// //     console.error("JWT Error:", err);
// //     return NextResponse.redirect(new URL("/login", request.url));
// //   }
// // }

// // export const config = {
// //   matcher: [
// //     "/menu",
// //     "/orders",
// //     "/orders/new/",
// //     "/customers/",
// //     "/inventory",
// //     "/categories",
// //     "/bills",
// //     "/taxes",
// //     "/expenses",
// //     "/reports",
// //     "/staff",
// //     "/settings",
// //     "/analysis",
// //     "/kitchen_display",
// //     "/customers",
// //     "/customers/:path*",
// //     "/kitchen_display/:path*",
// //     "/analysis/:path*",
// //     "/menu/:path*",
// //     "/orders/:path*",
// //     "/orders/new/:path*",
// //     "/customers/:path*",
// //     "/inventory/:path*",
// //     "/categories/:path*",
// //     "/bills/:path*",
// //     "/taxes/:path*",
// //     "/expenses/:path*",
// //     "/reports/:path*",
// //     "/staff/:path*",
// //     "/settings/:path*",
// //   ],
// // };

// //---------------Last Successfull use-----
// // import { NextResponse } from "next/server";

// // const accessControl = {
// //   "/menu": ["superadmin", "Manager", "Chef", "Waiter", "Cleaner", "Security", "Bartender", "Receptionist", "Cashier"],
// //   "/orders": ["superadmin", "Manager", "Chef", "Waiter", "Bartender", "Receptionist", "Cashier"],
// //   "/customers": ["superadmin", "Manager", "Receptionist", "Cashier"],
// //   "/inventory": ["superadmin", "Manager"],
// //   "/categories": ["superadmin", "Manager"],
// //   "/bills": ["superadmin", "Manager", "Cashier"],
// //   "/taxes": ["superadmin", "Manager"],
// //   "/expenses": ["superadmin", "Manager"],
// //   "/reports": ["superadmin", "Manager"],
// //   "/staff": ["superadmin"],
// // };

// // export function middleware(request) {
// //   const { pathname } = request.nextUrl;
// //   console.log("called------>");
// //   // 🚨 Skip middleware on login and unauthorized page
// //   if (pathname.startsWith("/login") || pathname.startsWith("/unauthorized")) {
// //     return NextResponse.next();
// //   }

// //   // Route protection based on role access
// //   const matchedRoute = Object.keys(accessControl).find(route =>
// //     pathname.startsWith(route)
// //   );

// //   if (!matchedRoute) return NextResponse.next();

// //   const authCookie = request.cookies.get("hotel_pos_auth");
// //   if (!authCookie) {
// //     return NextResponse.redirect(new URL("/login", request.url));
// //   }

// //   let user;
// //   try {
// //     user = JSON.parse(decodeURIComponent(authCookie.value));
// //   } catch (err) {
// //     console.error("Cookie parse error:", err);
// //     return NextResponse.redirect(new URL("/login", request.url));
// //   }

// //   if (!user || !user.role) {
// //     console.error("Missing role in cookie");
// //     return NextResponse.redirect(new URL("/login", request.url));
// //   }

// //   const allowedRoles = accessControl[matchedRoute];
// //   if (!allowedRoles || !allowedRoles.includes(user.role)) {
// //     console.error(`Access denied for role: ${user.role} on route: ${matchedRoute}`);
// //     return NextResponse.redirect(new URL("/unauthorized", request.url));
// //   }

// //   return NextResponse.next();
// // }

// // export const config = {
// //   matcher: [
// //     "/menu/:path*",
// //     "/orders/:path*",
// //     "/customers/:path*",
// //     "/inventory/:path*",
// //     "/categories/:path*",
// //     "/bills/:path*",
// //     "/taxes/:path*",
// //     "/expenses/:path*",
// //     "/reports/:path*",
// //     "/staff/:path*",
// //   ],
// // };

// // import { NextResponse } from "next/server";

// // // Which roles can access which routes
// // const accessControl = {
// //   "/menu": ["superadmin", "Manager", "Chef", "Waiter", "Cleaner", "Security", "Bartender", "Receptionist", "Cashier"],
// //   "/orders": ["superadmin", "Manager", "Chef", "Waiter", "Bartender", "Receptionist", "Cashier"],
// //   "/customers": ["superadmin", "Manager", "Receptionist", "Cashier"],

// //   "/inventory": ["superadmin", "Manager"],
// //   "/categories": ["superadmin", "Manager"],
// //   "/bills": ["superadmin", "Manager", "Cashier"],
// //   "/taxes": ["superadmin", "Manager"],
// //   "/expenses": ["superadmin", "Manager"],
// //   "/reports": ["superadmin", "Manager"],

// //   "/staff": ["superadmin"], // Only superadmin can access staff page
// // };

// // export function middleware(request) {
// //   const { pathname } = request.nextUrl;

// //   // Find matching protected route
// //   const matchedRoute = Object.keys(accessControl).find(route =>
// //     pathname.startsWith(route)
// //   );

// //   // If route is not protected, continue
// //   if (!matchedRoute) return NextResponse.next();

// //   // Read cookie
// //   const authCookie = request.cookies.get("hotel_pos_auth");
// //   if (!authCookie) {
// //     return NextResponse.redirect(new URL("/login", request.url));
// //   }

// //   // Parse cookie JSON to extract role
// //   let user;
// //   try {
// //     user = JSON.parse(authCookie.value);
// //   } catch (e) {
// //     return NextResponse.redirect(new URL("/login", request.url));
// //   }

// //   const allowedRoles = accessControl[matchedRoute];

// //   // If role is not allowed, redirect
// //   if (!allowedRoles.includes(user.role)) {
// //     return NextResponse.redirect(new URL("/unauthorized", request.url));
// //   }

// //   // User is allowed
// //   return NextResponse.next();
// // }

// // export const config = {
// //   matcher: [
// // "/menu",
// // "/orders",
// // "/orders/new/",
// // "/customers/",
// // "/inventory",
// // "/categories",
// // "/bills",
// // "/taxes",
// // "/expenses",
// // "/reports",
// // "/staff",
// // "/settings",
// // "/analysis",
// // "/kitchen_display",
// // "/customers",
// // "/customers/:path*",
// // "/kitchen_display/:path*",
// // "/analysis/:path*",
// // "/menu/:path*",
// // "/orders/:path*",
// // "/orders/new/:path*",
// // "/customers/:path*",
// // "/inventory/:path*",
// // "/categories/:path*",
// // "/bills/:path*",
// // "/taxes/:path*",
// // "/expenses/:path*",
// // "/reports/:path*",
// // "/staff/:path*",
// // "/settings/:path*",

// //   ],
// // };

// // import { NextResponse } from 'next/server';

// // const protectedRoutes = [
// //   '/menu',
// //   '/inventory',
// //   '/staff',
// //   '/reports',
// //   '/customers',
// //   '/bills',
// //   '/categories',
// //   '/expenses',
// //   '/taxes',
// //   '/orders',
// // ];

// // export function middleware(request) {
// //   const { pathname } = request.nextUrl;

// //   const isProtectedRoute = protectedRoutes.some(route =>
// //     pathname.startsWith(route)
// //   );

// //   if (isProtectedRoute) {
// //     const authCookie = request.cookies.get('hotel_pos_auth');

// //     if (!authCookie) {
// //       return NextResponse.redirect(new URL('/login', request.url));
// //     }
// //   }

// //   return NextResponse.next();
// // }

// // export const config = {
// //   matcher: [
// //     '/menu/:path*',
// //     '/inventory/:path*',
// //     '/staff/:path*',
// //     '/reports/:path*',
// //     '/customers/:path*',
// //     '/bills/:path*',
// //     '/categories/:path*',
// //     '/expenses/:path*',
// //     '/taxes/:path*',
// //     '/orders/:path*',
// //   ],
// // };
