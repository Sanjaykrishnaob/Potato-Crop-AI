import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  User
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';

// Create Auth Context
const AuthContext = createContext({});

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sign up with email and password
  const signup = async (email, password, additionalInfo = {}) => {
    try {
      setError(null);
      console.log('📝 Attempting to sign up with:', email); // Debug log
      
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Sign up successful:', user.uid); // Debug log
      
      // Update user profile
      await updateProfile(user, {
        displayName: additionalInfo.name || 'Farmer'
      });

      // Create user document in Firestore
      const userDoc = {
        uid: user.uid,
        email: user.email,
        name: additionalInfo.name || 'Farmer',
        farmName: additionalInfo.farmName || '',
        location: additionalInfo.location || '',
        phoneNumber: additionalInfo.phoneNumber || '',
        farmSize: additionalInfo.farmSize || '',
        cropTypes: additionalInfo.cropTypes || ['potato'],
        registrationDate: serverTimestamp(),
        lastLogin: serverTimestamp(),
        profileCompleted: false,
        preferences: {
          language: 'en',
          currency: 'INR',
          units: 'metric',
          notifications: {
            email: true,
            push: true,
            weather: true,
            tasks: true,
            recommendations: true
          }
        },
        farmDetails: {
          totalArea: additionalInfo.farmSize || '',
          soilType: '',
          irrigationType: '',
          coordinates: null,
          zones: []
        },
        subscription: {
          plan: 'free',
          features: ['basic_monitoring', 'weather_alerts', 'task_management'],
          expiryDate: null
        }
      };

      await setDoc(doc(db, 'users', user.uid), userDoc);
      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Sign in with email and password
  const signin = async (email, password) => {
    try {
      setError(null);
      console.log('🔐 Attempting to sign in with:', email); // Debug log
      
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Sign in successful:', user.uid); // Debug log
      
      // Update last login
      await updateDoc(doc(db, 'users', user.uid), {
        lastLogin: serverTimestamp()
      });
      
      return user;
    } catch (error) {
      console.error('❌ Sign in error:', error.code, error.message); // Debug log
      setError(error.message);
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setError(null);
      const { user } = await signInWithPopup(auth, googleProvider);
      
      // Check if user document exists, create if not
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        const newUserDoc = {
          uid: user.uid,
          email: user.email,
          name: user.displayName || 'Farmer',
          farmName: '',
          location: '',
          phoneNumber: user.phoneNumber || '',
          farmSize: '',
          cropTypes: ['potato'],
          registrationDate: serverTimestamp(),
          lastLogin: serverTimestamp(),
          profileCompleted: false,
          photoURL: user.photoURL || '',
          preferences: {
            language: 'en',
            currency: 'INR',
            units: 'metric',
            notifications: {
              email: true,
              push: true,
              weather: true,
              tasks: true,
              recommendations: true
            }
          },
          farmDetails: {
            totalArea: '',
            soilType: '',
            irrigationType: '',
            coordinates: null,
            zones: []
          },
          subscription: {
            plan: 'free',
            features: ['basic_monitoring', 'weather_alerts', 'task_management'],
            expiryDate: null
          }
        };
        await setDoc(userDocRef, newUserDoc);
      } else {
        // Update last login
        await updateDoc(userDocRef, {
          lastLogin: serverTimestamp()
        });
      }
      
      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      setError(null);
      console.log('🔐 Starting logout process...'); // Debug log
      
      // Clear user profile first
      setUserProfile(null);
      
      // Sign out from Firebase
      await signOut(auth);
      console.log('✅ Firebase sign out successful'); // Debug log
      
      // Clear current user (this should happen automatically via onAuthStateChanged)
      setCurrentUser(null);
      
      console.log('✅ Logout process completed'); // Debug log
    } catch (error) {
      console.error('❌ Logout error:', error);
      setError(error.message);
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    try {
      setError(null);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
          ...updates,
          updatedAt: serverTimestamp()
        });
        
        // Update local profile state
        setUserProfile(prev => ({ ...prev, ...updates }));
      }
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Fetch user profile from Firestore
  const fetchUserProfile = async (user) => {
    try {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const profileData = userDoc.data();
          setUserProfile(profileData);
          return profileData;
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError(error.message);
      return null;
    }
  };

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔄 Auth state changed:', user ? `User: ${user.email}` : 'No user'); // Debug log
      
      setCurrentUser(user);
      
      if (user) {
        // Fetch user profile when user signs in
        console.log('📥 Fetching user profile...'); // Debug log
        await fetchUserProfile(user);
      } else {
        // Clear profile when user signs out
        console.log('🧹 Clearing user profile...'); // Debug log
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.log('⏰ Auth loading timeout - setting loading to false');
      setLoading(false);
    }, 5000); // 5 second timeout

    return () => {
      unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  // Context value
  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    signup,
    signin,
    signInWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    fetchUserProfile,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
