import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';

// Helper function to check if file exists
function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Get config service instance
const configService = new ConfigService();

// Log environment variables for debugging
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log(
  'GOOGLE_APPLICATION_CREDENTIALS:',
  process.env.GOOGLE_APPLICATION_CREDENTIALS,
);
console.log(
  'Config service GOOGLE_APPLICATION_CREDENTIALS:',
  configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS'),
);

// Initialize Firebase if it's not already initialized
if (!admin.apps.length) {
  try {
    // Try to load from environment variables first
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('Using FIREBASE_SERVICE_ACCOUNT from environment');
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT,
      ) as ServiceAccount;

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: configService.get<string>('FIREBASE_DATABASE_URL'),
      });
    } else {
      // Try to use GOOGLE_APPLICATION_CREDENTIALS
      const credentialPath = configService.get<string>(
        'GOOGLE_APPLICATION_CREDENTIALS',
      );
      console.log('Attempting to use credential path:', credentialPath);

      // Check possible service account file locations
      const possiblePaths = [
        credentialPath,
        path.resolve(process.cwd(), 'firebase-service-account.json'),
        path.resolve(__dirname, '../../firebase-service-account.json'),
      ];

      let serviceAccountPath: string | null = null;
      for (const p of possiblePaths) {
        if (p && fileExists(p)) {
          serviceAccountPath = p;
          console.log('Found service account at:', serviceAccountPath);
          break;
        } else if (p) {
          console.log('Service account not found at:', p);
        }
      }

      if (serviceAccountPath) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL:
            configService.get<string>('FIREBASE_DATABASE_URL') ||
            `https://${serviceAccount.project_id}.firebaseio.com`,
        });
        console.log(
          'Firebase initialized with service account from:',
          serviceAccountPath,
        );
      } else {
        console.warn(
          'Firebase service account file not found. Using application default credentials.',
        );
        // Try connecting to Firebase Emulator if specified
        if (process.env.FIREBASE_EMULATOR_HOST) {
          console.log(
            'Connecting to Firebase Emulator:',
            process.env.FIREBASE_EMULATOR_HOST,
          );
          process.env.FIRESTORE_EMULATOR_HOST =
            process.env.FIREBASE_EMULATOR_HOST;
        }
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
