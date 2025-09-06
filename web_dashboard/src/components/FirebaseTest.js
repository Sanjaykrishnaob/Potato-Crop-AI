// Firebase Test Component - Simple test to verify Firebase connection
import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

function FirebaseTest() {
  const [status, setStatus] = useState('Testing Firebase connection...');
  const [error, setError] = useState(null);

  useEffect(() => {
    testFirebaseConnection();
  }, []);

  const testFirebaseConnection = async () => {
    try {
      console.log('🔥 Testing Firebase connection...');
      setStatus('✅ Firebase config loaded successfully');
      
      // Test if auth is working
      console.log('🔐 Auth object:', auth);
      console.log('📄 DB object:', db);
      
      setStatus('✅ Firebase connection successful!');
      
    } catch (error) {
      console.error('❌ Firebase test error:', error);
      setError(error.message);
      setStatus('❌ Firebase connection failed');
    }
  };

  const testSignup = async () => {
    try {
      const testEmail = `test${Date.now()}@example.com`;
      const testPassword = '123456';
      
      console.log('📝 Testing signup with:', testEmail);
      setStatus(`📝 Testing signup with: ${testEmail}`);
      
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      console.log('✅ Signup successful:', userCredential.user.uid);
      
      // Test Firestore write
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: testEmail,
        createdAt: new Date(),
        testUser: true
      });
      
      setStatus('✅ Signup and Firestore write successful!');
      
    } catch (error) {
      console.error('❌ Signup test error:', error);
      setError(error.message);
      setStatus('❌ Signup test failed');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>🔥 Firebase Connection Test</h2>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <strong>Status:</strong> {status}
      </div>
      
      {error && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#ffebee', borderRadius: '8px', color: '#c62828' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <button 
        onClick={testSignup}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#4CAF50', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px', 
          cursor: 'pointer' 
        }}
      >
        Test Signup
      </button>
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h3>Firebase Console Checklist:</h3>
        <ul>
          <li>✅ Authentication → Enable Email/Password</li>
          <li>✅ Firestore Database → Create in test mode</li>
          <li>✅ Check browser console for errors (F12)</li>
        </ul>
      </div>
    </div>
  );
}

export default FirebaseTest;
