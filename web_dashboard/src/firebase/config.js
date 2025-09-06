// Firebase configuration for Potato Crop AI
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAu9syd2BkJ4cJPnln5S_2seVBU6Rpp0nI",
  authDomain: "potato-crop-ai.firebaseapp.com",
  projectId: "potato-crop-ai",
  storageBucket: "potato-crop-ai.firebasestorage.app",
  messagingSenderId: "359161107115",
  appId: "1:359161107115:web:c71c57a1cf193d285d5dee",
  measurementId: "G-J9R3L0NDWB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

// Initialize Analytics (optional)
export const analytics = getAnalytics(app);

export default app;
