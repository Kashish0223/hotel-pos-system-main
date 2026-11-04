// import { canManagePermissions } from "@/lib/rbac"

// export function ProtectedStaffAction({ user, children, action = "edit_permissions" }) {
//   if (!user) {
//     return (
//       <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
//         You must be logged in to perform this action.
//       </div>
//     )
//   }

//   const canManage = canManagePermissions(user)

//   if (!canManage) {
//     return (
//       <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-xs">
//         <strong>Access Denied:</strong> Only SuperAdmin and Admin users can {action.replace("_", " ")} for staff members.
//       </div>
//     )
//   }

//   return children
// }

// export function PermissionsBadge({ permissions = [], user }) {
//   if (!user) return null

//   const canManage = canManagePermissions(user)

//   return (
//     <div className="mt-2">
//       {permissions.length === 0 ? (
//         <span className="text-xs text-gray-500">No permissions assigned</span>
//       ) : (
//         <div className="flex flex-wrap gap-1">
//           {permissions.slice(0, 3).map((perm) => (
//             <span
//               key={perm}
//               className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
//             >
//               {perm.replace("_", " ")}
//             </span>
//           ))}
//           {permissions.length > 3 && (
//             <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
//               +{permissions.length - 3} more
//             </span>
//           )}
//         </div>
//       )}
//     </div>
//   )
// }
