
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
      setLoading(true); 
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        
        const authProfileData = {
          email: firebaseUser.email, 
          displayName: firebaseUser.displayName, 
          photoURL: firebaseUser.photoURL, 
        };

        try {
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            const newUserDocumentData = {
              uid: firebaseUser.uid,
              ...authProfileData, 
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              isOnline: true,
              lastSeen: serverTimestamp(),
            };
            await setDoc(userRef, newUserDocumentData);
            
            const createdSnap = await getDoc(userRef);
            if (createdSnap.exists()) {
              setUser(createdSnap.data() as User);
            } else {
              const fallbackUser: User = {
                ...firebaseUser,
                createdAt: undefined, 
                lastLogin: undefined,
                isOnline: true,
                lastSeen: undefined,
              };
              setUser(fallbackUser);
            }
          } else {
            const updateData: Partial<User> = {
              ...authProfileData, 
              lastLogin: serverTimestamp(),
              isOnline: true,
              lastSeen: serverTimestamp(),
            };
            await setDoc(userRef, updateData, { merge: true });

            const updatedSnap = await getDoc(userRef);
            if (updatedSnap.exists()) {
              setUser(updatedSnap.data() as User);
            } else {
               const fallbackUser: User = {
                ...firebaseUser,
                createdAt: userSnap.data()?.createdAt,
                lastLogin: undefined, 
                isOnline: true,
                lastSeen: undefined,
              };
              setUser(fallbackUser);
            }
          }
        } catch (error) {
          console.error("Error managing user document in AuthProvider:", error);
           const fallbackUser: User = {
            ...firebaseUser,
            createdAt: undefined, 
            lastLogin: undefined,
            isOnline: true,
            lastSeen: undefined,
          };
          setUser(fallbackUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false); 
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
