/**
 * 01-rbac-middleware.js
 * 
 * Demonstrates:
 * 1. Higher-order RBAC middleware closure (`restrictTo`).
 * 2. Hierarchical role resolution (admin inherits moderator, moderator inherits user).
 * 3. 403 Forbidden enforcement.
 */

// Role Hierarchy Definition
const ROLE_HIERARCHY = {
  user: ['user'],
  moderator: ['user', 'moderator'],
  admin: ['user', 'moderator', 'admin'],
  superadmin: ['user', 'moderator', 'admin', 'superadmin']
};

// Simulated RBAC Middleware
function restrictTo(...requiredRoles) {
  return (req) => {
    // 1. AuthN Check: Ensure user is authenticated
    if (!req.user) {
      return { status: 401, allowed: false, message: 'Unauthenticated: No user context found.' };
    }

    const userRole = req.user.role;
    const userPermissions = ROLE_HIERARCHY[userRole] || [];

    // 2. Check if user's inherited roles satisfy any of the required roles
    const hasPermission = requiredRoles.some(role => userPermissions.includes(role));

    if (!hasPermission) {
      return {
        status: 403,
        allowed: false,
        message: `Forbidden: Role '${userRole}' lacks required permissions: [${requiredRoles.join(', ')}]`
      };
    }

    return { status: 200, allowed: true, message: `Access granted to '${req.user.name}' (${userRole}) ✅` };
  };
}

// ==========================================
// TEST SCENARIOS
// ==========================================

const regularUser = { id: 'u1', name: 'Rahul', role: 'user' };
const moderatorUser = { id: 'u2', name: 'Priya', role: 'moderator' };
const adminUser = { id: 'u3', name: 'Krishna', role: 'admin' };

console.log('===============================================================');
console.log('ENDPOINT 1: DELETE /api/products (Requires "admin")');
console.log('===============================================================');
const adminCheck = restrictTo('admin');

console.log('1. Regular User tries:', adminCheck({ user: regularUser }));
console.log('2. Moderator User tries:', adminCheck({ user: moderatorUser }));
console.log('3. Admin User tries:    ', adminCheck({ user: adminUser }));

console.log('\n===============================================================');
console.log('ENDPOINT 2: POST /api/comments/hide (Requires "moderator")');
console.log('===============================================================');
const modCheck = restrictTo('moderator');

console.log('1. Regular User tries:', modCheck({ user: regularUser }));
console.log('2. Moderator tries:   ', modCheck({ user: moderatorUser }));
console.log('3. Admin tries:       ', modCheck({ user: adminUser })); // Admin inherits moderator!
