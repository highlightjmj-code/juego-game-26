# Firestore Security Specifications & Threat Vector Analysis (TDD)

This spec defines the rules governing security design on `/scores/{userId}` collection to prevent privilege escalation or identity cheating on the Spanish Stair Game leaderboard.

## 1. Core Data Invariants
- **Identity Lock**: A writer can only modify the document under `scores/{userId}` where `{userId}` strictly matches their authenticated `request.auth.uid`.
- **Level Boundaries**: The grade of the staircase, `level`, must be between 1 and 30 inclusive.
- **Strict Format Enforcements**: All fields (`userId`, `nickname`, `characterId`, `level`, `updatedAt`) are required and type-safe.
- **Timestamp Integrity**: `updatedAt` must be set strictly to the server timestamp `request.time`.

---

## 2. The "Dirty Dozen" Cheat Payloads
Below are 12 payload scenarios designed to attack the database. They must all yield `PERMISSION_DENIED`:

1. **Unauthenticated Write**: Creating a score document when `request.auth` is null.
2. **Identity Hijacking (Spoofing)**: Authenticated as `User_A` but writing to `scores/User_B`.
3. **Ghost Property Injection (Shadow Update)**: Writing an unvalidated helper property `isAdmin: true` to bypass administrative blocks.
4. **ID Poisoning (Excessive Length)**: Document ID with malicious long payload string `PROJECT_X_` * 200 to cause Denial of Wallet.
5. **Level-Cap Breach**: Setting `level: 999` (violating maximum level limit of 30).
6. **Level-Cap Underflow**: Setting `level: 0` or negative levels (violating minimum level limit of 1).
7. **Type Poisoning (Invalid Integer Type)**: Setting `level: "thirty"` (string instead of number).
8. **Invalid Avatar Choice (Privilege Spoofing)**: Submitting `characterId: "super_admin_ninja"`.
9. **Nickname Overflow**: Submitting `nickname` with 10,000 characters to bloat database memory.
10. **Timestamp Manipulation (Client Spoofing)**: Submitting a historical date or future date for `updatedAt` instead of `request.time`.
11. **Immutability Bypass**: Trying to change the `userId` property inside an existing document from `User_A` to `User_C`.
12. **PII Injection (Data Leak attempt)**: Adding an unwhitelisted phone number to the profile database.

---

## 3. Test Cases (TDD Blueprint)

We enforce that the following Firestore rules strictly reject the breaches.

### `firestore.rules` Draft:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Catch-all safety filter
    match /{document=**} {
      allow read, write: if false;
    }

    // Global helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isValidId(id) {
      return id is string && id.size() <= 64 && id.matches('^[a-zA-Z0-9_\\-]+$');
    }

    function isValidScore(data) {
      return data.userId is string 
        && data.userId.size() <= 64
        && data.nickname is string 
        && data.nickname.size() >= 1 
        && data.nickname.size() <= 32
        && data.characterId is string
        && (data.characterId == 'viajero' || data.characterId == 'flamenco' || data.characterId == 'churrero' || data.characterId == 'futbolista')
        && data.level is int
        && data.level >= 1
        && data.level <= 30
        && data.updatedAt is timestamp;
    }

    match /scores/{userId} {
      allow list, get: if isSignedIn();
      
      allow create: if isOwner(userId) 
        && isValidId(userId)
        && request.resource.data.keys().hasAll(['userId', 'nickname', 'characterId', 'level', 'updatedAt'])
        && request.resource.data.keys().size() == 5
        && isValidScore(request.resource.data)
        && request.resource.data.userId == userId
        && request.resource.data.updatedAt == request.time;

      allow update: if isOwner(userId) 
        && isValidId(userId)
        && request.resource.data.keys().hasAll(['userId', 'nickname', 'characterId', 'level', 'updatedAt'])
        && request.resource.data.keys().size() == 5
        && isValidScore(request.resource.data)
        && request.resource.data.userId == userId
        && request.resource.data.userId == resource.data.userId
        && request.resource.data.updatedAt == request.time
        && request.resource.data.diff(resource.data).affectedKeys().hasAny(['nickname', 'characterId', 'level', 'updatedAt']);

      allow delete: if isOwner(userId);
    }
  }
}
```
