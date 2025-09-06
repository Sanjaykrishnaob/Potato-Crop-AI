import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Alert, CircularProgress } from '@mui/material';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';

function AuthDebug() {
  const [status, setStatus] = useState('Initializing...');
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);

  const addStep = (step, success = true) => {
    setSteps(prev => [...prev, { step, success, timestamp: new Date().toLocaleTimeString() }]);
  };

  useEffect(() => {
    testFirebaseConnection();
  }, []);

  const testFirebaseConnection = async () => {
    setStatus('Testing Firebase connection...');
    
    try {
      // Test 1: Check if Firebase is initialized
      addStep('✅ Firebase app initialized');
      
      // Test 2: Check Auth service
      if (auth) {
        addStep('✅ Firebase Auth service connected');
      } else {
        addStep('❌ Firebase Auth service failed', false);
        return;
      }
      
      // Test 3: Check Firestore service
      if (db) {
        addStep('✅ Firebase Firestore service connected');
      } else {
        addStep('❌ Firebase Firestore service failed', false);
        return;
      }
      
      setStatus('Firebase connection successful!');
      
    } catch (error) {
      addStep(`❌ Firebase connection error: ${error.message}`, false);
      setStatus('Firebase connection failed');
    }
  };

  const testAuthentication = async () => {
    setLoading(true);
    setSteps([]);
    
    try {
      const testEmail = 'test@example.com';
      const testPassword = 'test123456';
      
      addStep('🔥 Starting authentication test...');
      
      // Try to create a test user
      addStep('📝 Attempting to create test user...');
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
        addStep('✅ Test user created successfully');
        addStep(`User UID: ${userCredential.user.uid}`);
        
        // Try to sign out and sign back in
        await auth.signOut();
        addStep('✅ Sign out successful');
        
        const signInCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
        addStep('✅ Sign in successful');
        addStep(`Signed in as: ${signInCredential.user.email}`);
        
      } catch (authError) {
        if (authError.code === 'auth/email-already-in-use') {
          addStep('ℹ️ Test user already exists, trying to sign in...');
          
          try {
            const signInCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
            addStep('✅ Sign in with existing user successful');
            addStep(`Signed in as: ${signInCredential.user.email}`);
          } catch (signInError) {
            addStep(`❌ Sign in failed: ${signInError.message}`, false);
          }
          
        } else {
          addStep(`❌ Authentication error: ${authError.code} - ${authError.message}`, false);
          
          // Check specific error codes
          if (authError.code === 'auth/operation-not-allowed') {
            addStep('❌ Email/Password authentication is not enabled in Firebase Console!', false);
            addStep('🔧 Go to Firebase Console > Authentication > Sign-in method > Email/Password > Enable', false);
          }
        }
      }
      
      // Test Firestore write
      try {
        addStep('💾 Testing Firestore write...');
        await addDoc(collection(db, 'test'), {
          message: 'Test from AuthDebug',
          timestamp: new Date(),
          success: true
        });
        addStep('✅ Firestore write successful');
      } catch (firestoreError) {
        addStep(`❌ Firestore error: ${firestoreError.message}`, false);
        
        if (firestoreError.code === 'permission-denied') {
          addStep('❌ Firestore database not created or rules too restrictive!', false);
          addStep('🔧 Go to Firebase Console > Firestore Database > Create database', false);
        }
      }
      
    } catch (error) {
      addStep(`❌ Unexpected error: ${error.message}`, false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            🔥 Firebase Authentication Debug
          </Typography>
          
          <Typography variant="h6" color="primary" gutterBottom>
            Current Status: {status}
          </Typography>
          
          <Button 
            variant="contained" 
            onClick={testAuthentication}
            disabled={loading}
            sx={{ mb: 3 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Run Authentication Test'}
          </Button>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Test Results:
            </Typography>
            
            {steps.map((step, index) => (
              <Alert 
                key={index} 
                severity={step.success ? 'success' : 'error'} 
                sx={{ mb: 1 }}
              >
                <Typography variant="body2">
                  [{step.timestamp}] {step.step}
                </Typography>
              </Alert>
            ))}
          </Box>
          
          <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              🛠️ Common Issues & Solutions:
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>1. Email/Password not enabled:</strong> Firebase Console → Authentication → Sign-in method → Enable Email/Password
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>2. Firestore not created:</strong> Firebase Console → Firestore Database → Create database
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>3. Wrong project ID:</strong> Check if project ID in config matches Firebase Console
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>4. API Key issues:</strong> Regenerate API key in Firebase Console → Project Settings
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default AuthDebug;
