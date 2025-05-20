
"use client";

import type { ReactNode } from "react";
import React, { createContext, useEffect, useState }  from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import type { User } from "@/lib/types";
import { doc, setDoc, serverTimestamp, getDoc, Timestamp } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setLoading(true); // Set loading to true at the start of auth state processing
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        
        // Prepare the data that reflects the current state of firebaseUser's profile
        // This will be used for creating or merging the Firestore document.
        const authProfileData = {
          email: firebaseUser.email, // Email is generally stable from Auth
          displayName: firebaseUser.displayName, // displayName from Auth user object
          photoURL: firebaseUser.photoURL, // photoURL from Auth user object
        };

        try {
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            // User document does not exist in Firestore, create it.
            // The displayName and photoURL will be whatever is on firebaseUser at this point.
            // If updateProfile hasn't updated the firebaseUser object yet, these might be null.
            const newUserDocumentData = {
              uid: firebaseUser.uid,
              ...authProfileData, // Includes displayName and photoURL from current firebaseUser
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
            };
            await setDoc(userRef, newUserDocumentData);
            
            // Fetch the newly created document to ensure we have server timestamps etc.
            const createdSnap = await getDoc(userRef);
            if (createdSnap.exists()) {
              setUser(createdSnap.data() as User);
            } else {
              // Fallback, though this should ideally not happen if setDoc succeeded
              const fallbackUser: User = {
                ...firebaseUser,
                createdAt: undefined, // Or new Timestamp(Date.now() / 1000, 0) if needed
                lastLogin: undefined,
              };
              setUser(fallbackUser);
            }
          } else {
            // User document exists. Merge latest Auth profile data and update lastLogin.
            // This will pick up changes from updateProfile if onAuthStateChanged fires again.
            const updateData = {
              ...authProfileData, // Ensures displayName & photoURL from Auth are merged
              lastLogin: serverTimestamp(),
            };
            await setDoc(userRef, updateData, { merge: true });

            // Fetch the updated document to set in context
            const updatedSnap = await getDoc(userRef);
            if (updatedSnap.exists()) {
              setUser(updatedSnap.data() as User);
            } else {
               // Fallback, though this should not happen if merge succeeded
               const fallbackUser: User = {
                ...firebaseUser,
                 // Retain existing Firestore fields if possible, or cast
                createdAt: userSnap.data()?.createdAt,
                lastLogin: undefined, // Will be set by merge, but use existing if needed
              };
              setUser(fallbackUser);
            }
          }
        } catch (error) {
          console.error("Error managing user document in AuthProvider:", error);
          // Fallback: use auth data directly if Firestore interaction fails
          // Cast to User, acknowledging some fields might be missing/different type
           const fallbackUser: User = {
            ...firebaseUser,
            createdAt: undefined, 
            lastLogin: undefined,
          };
          setUser(fallbackUser);
        }
      } else {
        // No Firebase user / logged out
        setUser(null);
      }
      setLoading(false); // Set loading to false after all processing
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
