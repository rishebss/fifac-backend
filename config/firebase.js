// firebase.js
// Purpose: Configure and initialize the Firebase Admin SDK.

// 1. Import Firebase Admin
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
// Import the service account key
import serviceAccount from '../firebase-service-account.json' assert { type: 'json' };

// 2. Initialize Firebase
// This code runs immediately when this module is imported.
initializeApp({
  credential: cert(serviceAccount)
});

// 3. Get a reference to the Firestore database
const db = getFirestore();

// 4. Export the database reference
// This allows other files to import the 'db' object and use it to interact with Firestore.
export { db };