import type { User as FirebaseUser } from "firebase/auth";

export interface User extends FirebaseUser {
  // You can extend this with custom properties if needed
  // e.g. customUsername?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  timestamp: any; // Firestore Timestamp or Date
  status: 'sent' | 'delivered' | 'read';
  isEdited?: boolean;
  replyTo?: string; // Message ID being replied to
  senderPhotoURL?: string | null;
  senderDisplayName?: string | null;
}

export interface Chat {
  id: string;
  participants: string[]; // Array of user UIDs
  lastMessage?: ChatMessage;
  updatedAt: any; // Firestore Timestamp or Date
  // Add other chat metadata if needed, e.g., group chat name, photo
}
