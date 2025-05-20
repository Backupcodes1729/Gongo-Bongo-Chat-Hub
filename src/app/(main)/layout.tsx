
"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, serverTimestamp, updateDoc, onDisconnect, setDoc } from "firebase/firestore";


export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.uid) {
      const userDocRef = doc(db, "users", user.uid);

      // Set online and initial lastSeen on mount
      updateDoc(userDocRef, {
        isOnline: true,
        lastSeen: serverTimestamp(),
      }).catch(console.error);
      
      // Periodically update lastSeen to keep the user marked as active
      const intervalId = setInterval(() => {
        if (auth.currentUser) { // Check if user is still logged in
           updateDoc(userDocRef, {
             lastSeen: serverTimestamp(),
             isOnline: true, // Re-assert online status
           }).catch(console.error);
        }
      }, 60000); // Every 60 seconds


      // Attempt to use onDisconnect for a more robust offline status.
      // Note: This is more reliable with Realtime Database. Firestore's onDisconnect capabilities are limited.
      // This is a best-effort for Firestore.
      const userStatusFirestoreRef = doc(db, 'status', user.uid); // A separate collection for status could be an option
      
      // A more common Firestore pattern is to let clients write their online status,
      // and use Cloud Functions to detect prolonged inactivity if onDisconnect is not robust enough.
      // For this example, we'll primarily rely on the interval and logout updates.

      return () => {
        clearInterval(intervalId);
        // onDisconnect().cancel(); // If using Realtime Database onDisconnect
        // When the component unmounts (e.g., user navigates away or closes tab *gracefully*),
        // try to set them as offline. This won't catch all scenarios like browser crashes.
        if (auth.currentUser) { // Check if user is still effectively logged in before updating
            updateDoc(userDocRef, {
                isOnline: false,
                lastSeen: serverTimestamp(),
            }).catch(console.error);
        }
      };
    }
  }, [user?.uid]);


  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; 
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
