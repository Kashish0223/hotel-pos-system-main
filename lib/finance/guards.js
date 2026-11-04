import { jwtVerify } from "jose";
import { headers } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

/**
 * Server-side guard to authenticate JWT and enforce finance RBAC permissions.
 * 
 * @param {string|string[]} [requiredPermissions=[]] - Permission(s) required to access route
 * @returns {Promise<{ authorized: boolean, user?: Object, error?: string, status?: number }>}
 */
export async function requireFinanceAuth(requiredPermissions = []) {
  try {
    const headerList = await headers();
    const authHeader = headerList.get("Authorization") || headerList.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        authorized: false,
        error: "Unauthorized: Missing or malformed Bearer token",
        status: 401
      };
    }

    const token = authHeader.split("Bearer ")[1].trim();
    let payload;
    try {
      const verified = await jwtVerify(token, secret);
      payload = verified.payload;
    } catch (jwtErr) {
      return {
        authorized: false,
        error: "Unauthorized: Invalid or expired token",
        status: 401
      };
    }

    if (!payload || !payload.role) {
      return {
        authorized: false,
        error: "Unauthorized: Token missing role claims",
        status: 401
      };
    }

    const user = {
      id: payload.id || payload._id || payload.sub,
      name: payload.name || "Staff",
      email: payload.email,
      role: payload.role,
      permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
      isSuperAdmin: payload.isSuperAdmin || payload.role === "superadmin"
    };

    // SuperAdmin or wildcard permission has universal access
    if (user.isSuperAdmin || user.permissions.includes("*")) {
      return { authorized: true, user };
    }

    // If permissions are specified, check whether user has at least one
    const permissionsToCheck = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    if (permissionsToCheck.length > 0) {
      const hasPermission = permissionsToCheck.some(p => 
        user.permissions.includes(p) || (user.role === "Manager" && !p.startsWith("superadmin:"))
      );

      if (!hasPermission) {
        return {
          authorized: false,
          error: `Forbidden: Missing required permission [${permissionsToCheck.join(", ")}]`,
          status: 403,
          user
        };
      }
    }

    return { authorized: true, user };

  } catch (err) {
    console.error("Finance Auth Guard Error:", err);
    return {
      authorized: false,
      error: "Authentication service failure",
      status: 500
    };
  }
}
