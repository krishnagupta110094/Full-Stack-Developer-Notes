/**
 * 02-object-level-authorization.js
 * 
 * Demonstrates:
 * Preventing Broken Object-Level Authorization (BOLA / IDOR).
 * Scenario:
 * - A regular user attempts to edit a document that belongs to someone else.
 * - Enforcing scoped database queries to guarantee users only modify their own resources.
 */

// Simulated Database Collection
const mockDocuments = [
  { id: 'doc_101', title: 'Rahul Private Notes', ownerId: 'user_rahul' },
  { id: 'doc_102', title: 'Krishna Strategy Doc', ownerId: 'user_krishna' }
];

// Vulnerable Controller (Checks role, but ignores resource ownership)
function vulnerableUpdateDocument(user, docId, newTitle) {
  // Finds doc strictly by ID regardless of owner
  const doc = mockDocuments.find(d => d.id === docId);
  if (!doc) return { status: 404, message: 'Document not found' };

  doc.title = newTitle;
  return { status: 200, message: 'Updated successfully (VULNERABLE: Allowed IDOR)', doc };
}

// Secure Controller (Enforces Scoped Query / Ownership Check)
function secureUpdateDocument(user, docId, newTitle) {
  const doc = mockDocuments.find(d => d.id === docId);
  if (!doc) {
    return { status: 404, message: 'Document not found' };
  }

  // Admin can edit anything; normal user can ONLY edit their own!
  const isOwner = doc.ownerId === user.id;
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return {
      status: 403,
      message: `Forbidden: User '${user.name}' does not own document '${docId}'! ❌`
    };
  }

  doc.title = newTitle;
  return {
    status: 200,
    message: `Document updated successfully by '${user.name}' ✅`,
    doc
  };
}

// ==========================================
// TEST SCENARIOS
// ==========================================

const userRahul = { id: 'user_rahul', name: 'Rahul', role: 'user' };
const userAmit = { id: 'user_amit', name: 'Amit', role: 'user' };
const userAdmin = { id: 'user_admin', name: 'SuperAdmin', role: 'admin' };

console.log('===============================================================');
console.log('SCENARIO: User Amit attempts to edit Rahul\'s Private Doc (doc_101)');
console.log('===============================================================');

console.log('\n1. Testing with Vulnerable Controller:');
const vulnResult = vulnerableUpdateDocument(userAmit, 'doc_101', 'Hacked by Amit');
console.log(vulnResult);

console.log('\n2. Testing with Secure Controller (BOLA Protected):');
const secureResult = secureUpdateDocument(userAmit, 'doc_101', 'Hacked by Amit');
console.log(secureResult);

console.log('\n3. Testing Owner editing their own document:');
const ownerResult = secureUpdateDocument(userRahul, 'doc_101', 'Updated by Rahul');
console.log(ownerResult);

console.log('\n4. Testing Admin editing someone else\'s document:');
const adminResult = secureUpdateDocument(userAdmin, 'doc_101', 'Reviewed by Admin');
console.log(adminResult);
