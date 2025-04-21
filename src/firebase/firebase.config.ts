import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

// Initialize Firebase if it's not already initialized
if (!admin.apps.length) {
  // For production, you should use environment variables for these values
  // In development, you can place your service account credentials here or use environment variables
  try {
    // Try to load from environment variables first
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT,
      ) as ServiceAccount;

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    } else {
      // Fallback to local file (for development only)
      // Be sure to add this file to .gitignore
      try {
        const serviceAccount = require('../../firebase-service-account.json');
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL:
            process.env.FIREBASE_DATABASE_URL ||
            `https://${serviceAccount.project_id}.firebaseio.com`,
        });
      } catch (error) {
        console.warn(
          'Firebase service account file not found. Using application default credentials.',
        );
        // Fallback to application default credentials
        admin.initializeApp();
      }
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    // Initialize with application default credentials as last resort
    admin.initializeApp();
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
