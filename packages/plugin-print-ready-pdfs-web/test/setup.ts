import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Check for required environment variables
if (!process.env.VITE_CESDK_LICENSE_KEY) {
  throw new Error(
    'VITE_CESDK_LICENSE_KEY not found in .env.local. Please add your CE.SDK license key.'
  );
}