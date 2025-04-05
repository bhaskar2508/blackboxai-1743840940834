// Import Firebase services
import { auth, db } from './firebase.js';

// User roles
const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher', 
  ADMIN: 'admin'
};

// Register a new user with email, password and role
export const registerUser = async (email, password, role, additionalData = {}) => {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Store additional user data in Firestore
    await db.collection('users').doc(user.uid).set({
      email,
      role,
      ...additionalData,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, user };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: error.message };
  }
};

// Login user with email and password
export const loginUser = async (email, password) => {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: error.message };
  }
};

// Logout current user
export const logoutUser = async () => {
  try {
    await auth.signOut();
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error: error.message };
  }
};

// Get current authenticated user
export const getCurrentUser = () => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      resolve(user);
    });
  });
};

// Get user role from Firestore
export const getUserRole = async (userId) => {
  try {
    const doc = await db.collection('users').doc(userId).get();
    return doc.exists ? doc.data().role : null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
};