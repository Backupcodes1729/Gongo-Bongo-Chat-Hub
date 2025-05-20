
import type { User as FirebaseUser } from "firebase/auth";
import type { Timestamp } from "firebase/firestore";

export interface User extends FirebaseUser {
  // You can extend this with custom properties if needed
  // e.g. customUsername?: string;
  lastLogin?: Timestamp;
  createdAt?: Timestamp;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  timestamp: Timestamp | Date | any; // Firestore Timestamp, Date for client-side creation
  status: 'sent' | 'delivered' | 'read';
  isEdited?: boolean;
  replyTo?: string; // Message ID being replied to
  senderPhotoURL?: string | null;
  senderDisplayName?: string | null;
}

export interface Chat {
  id: string;
  participants: string[]; // Array of user UIDs
  participantDetails?: { // For denormalized user info, useful for quick display
    [uid: string]: {
      displayName: string | null;
      photoURL: string | null;
    }
  };
  lastMessage?: ChatMessage;
  updatedAt: Timestamp | Date | any; // Firestore Timestamp
  // Group chat specific fields
  isGroup?: boolean;
  groupName?: string;
  groupAvatar?: string | null;
  adminIds?: string[];
  createdBy?: string; // UID of user who created the group chat
  createdAt?: Timestamp | Date | any;
}
