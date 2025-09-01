// firebase.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

// Load environment variables from .env.local file
config({ path: '.env' });

// Create service account from environment variables
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Handle newlines
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: 'googleapis.com'
};

// Debug: Check if environment variables are loaded
console.log('Project ID:', process.env.FIREBASE_PROJECT_ID ? 'Loaded' : 'Missing');
console.log('Client Email:', process.env.FIREBASE_CLIENT_EMAIL ? 'Loaded' : 'Missing');

let app;
let db;

// Only initialize if all required fields are present
if (serviceAccount.project_id && serviceAccount.private_key && serviceAccount.client_email) {
  try {
    app = initializeApp({
      credential: cert(serviceAccount)
    });
    db = getFirestore(app);
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization failed:', error.message);
    // Create a mock db object to prevent crashes during development
    db = {
      collection: () => {
        throw new Error('Firebase not initialized - check environment variables');
      }
    };
  }
} else {
  console.warn('Firebase environment variables missing. Using mock database.');
  // Create a mock db for development without crashing
  db = {
    collection: () => {
      throw new Error('Firebase not initialized - check environment variables');
    }
  };
}

export { db };