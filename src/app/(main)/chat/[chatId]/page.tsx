
"use client";

import { CustomAvatar } from "@/components/common/CustomAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Paperclip, SendHorizonal, Smile, Mic, Phone, Video, Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect, useRef, FormEvent } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
  arrayUnion
} from "firebase/firestore";
import type { User, ChatMessage, Chat } from "@/lib/types";

// Helper function to format timestamp
const formatTimestamp = (timestamp: Timestamp | Date | undefined): string => {
  if (!timestamp) return "";
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function IndividualChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  const { user: currentUser } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatDetails, setChatDetails] = useState<Chat | null>(null);
  const [chatPartner, setChatPartner] = useState<User | null>(null);
  const [loadingChat, setLoadingChat] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch chat details and participant info
  useEffect(() => {
    if (!chatId || !currentUser?.uid) return;

    setLoadingChat(true);
    const chatDocRef = doc(db, "chats", chatId);

    const unsubscribeChatDetails = onSnapshot(chatDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const chatData = docSnap.data() as Chat;
        chatData.id = docSnap.id;
        setChatDetails(chatData);

        if (!chatData.isGroup && chatData.participants) {
          const partnerId = chatData.participants.find(pId => pId !== currentUser.uid);
          if (partnerId) {
            const userDocRef = doc(db, "users", partnerId);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
              setChatPartner(userSnap.data() as User);
            } else {
              console.warn("Chat partner user document not found:", partnerId);
              setChatPartner(null); // Or handle as unknown user
            }
          }
        } else if (chatData.isGroup) {
          // For group chats, chatPartner might represent the group itself for display
          // Or you might not set chatPartner and use chatDetails.groupName etc.
          setChatPartner(null); // Reset for group chats
        }
      } else {
        console.error("Chat not found!");
        // Optionally redirect or show a "chat not found" message
        setChatDetails(null);
        setChatPartner(null);
        // router.replace("/chat"); // Example redirect
      }
      setLoadingChat(false);
    }, (error) => {
      console.error("Error fetching chat details:", error);
      setLoadingChat(false);
    });

    return () => unsubscribeChatDetails();
  }, [chatId, currentUser?.uid, router]);

  // Fetch messages
  useEffect(() => {
    if (!chatId) return;

    const messagesColRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesColRef, orderBy("timestamp", "asc"));

    const unsubscribeMessages = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages: ChatMessage[] = [];
      querySnapshot.forEach((doc) => {
        fetchedMessages.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(fetchedMessages);
    }, (error) => {
      console.error("Error fetching messages:", error);
    });

    return () => unsubscribeMessages();
  }, [chatId]);


  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !currentUser || !chatDetails) return;
    setSendingMessage(true);

    const messageData: Omit<ChatMessage, "id"> = {
      text: newMessage,
      senderId: currentUser.uid,
      timestamp: serverTimestamp(),
      status: 'sent', // Initial status
      senderPhotoURL: currentUser.photoURL || null,
      senderDisplayName: currentUser.displayName || currentUser.email || "User",
    };

    try {
      const messagesColRef = collection(db, "chats", chatId, "messages");
      await addDoc(messagesColRef, messageData);

      // Update last message in the chat document
      const chatDocRef = doc(db, "chats", chatId);
      await updateDoc(chatDocRef, {
        lastMessage: {
          text: newMessage,
          timestamp: serverTimestamp(),
          senderId: currentUser.uid,
        },
        updatedAt: serverTimestamp(),
        // Ensure all participants are correctly in the participants array
        // This can be useful if a user was removed and re-added, or for initial setup
        participants: arrayUnion(currentUser.uid) 
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message: ", error);
      // Handle error (e.g., show a toast notification)
    } finally {
      setSendingMessage(false);
    }
  };
  
  const partnerName = chatDetails?.isGroup ? chatDetails.groupName : chatPartner?.displayName;
  const partnerAvatar = chatDetails?.isGroup ? chatDetails.groupAvatar : chatPartner?.photoURL;
  const partnerDataAiHint = chatDetails?.isGroup ? "group avatar" : (chatPartner as any)?.dataAiHint || "person avatar";


  if (loadingChat) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Loading chat...</p>
      </div>
    );
  }

  if (!chatDetails) {
     return (
      <div className="flex flex-col h-full items-center justify-center p-4 text-center">
        <Info className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Chat not found</h2>
        <p className="text-muted-foreground mb-4">
          The chat you are looking for does not exist or you may not have access to it.
        </p>
        <Button onClick={() => router.push('/chat')}>Go to Chats</Button>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header */}
      <header className="flex items-center justify-between p-3 border-b bg-card shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="md:hidden">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          {partnerAvatar && <CustomAvatar src={partnerAvatar} alt={partnerName || "Chat partner"} className="h-10 w-10" data-ai-hint={partnerDataAiHint} />}
          {!partnerAvatar && <CustomAvatar fallback={partnerName?.charAt(0) || "?"} alt={partnerName || "Chat partner"} className="h-10 w-10" data-ai-hint={partnerDataAiHint} />}
          <div>
            <h2 className="font-semibold text-foreground">{partnerName || "Chat"}</h2>
            {/* Add status later if available, e.g., for 1-on-1 chats */}
            {/* <p className="text-xs text-muted-foreground">{chatPartner?.status || "Details"}</p> */}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Info className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" viewportRef={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${
                msg.senderId === currentUser?.uid ? "justify-end" : "justify-start"
              }`}
            >
              {msg.senderId !== currentUser?.uid && (
                <CustomAvatar 
                  src={msg.senderPhotoURL} 
                  alt={msg.senderDisplayName || "Sender"} 
                  fallback={msg.senderDisplayName?.charAt(0) || "S"}
                  className="h-8 w-8" 
                  data-ai-hint="person avatar"
                />
              )}
              <div
                className={`max-w-[70%] p-3 rounded-xl shadow ${
                  msg.senderId === currentUser?.uid
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-card text-card-foreground rounded-bl-none border"
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.senderId === currentUser?.uid ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground text-right'}`}>
                  {formatTimestamp(msg.timestamp)}
                </p>
              </div>
              {msg.senderId === currentUser?.uid && currentUser?.photoURL && (
                  <CustomAvatar 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName || "You"} 
                    fallback={(currentUser.displayName || "Y").charAt(0)}
                    className="h-8 w-8"
                    data-ai-hint="person avatar"
                   />
                )}
                 {msg.senderId === currentUser?.uid && !currentUser?.photoURL && (
                  <CustomAvatar 
                    alt={currentUser.displayName || "You"} 
                    fallback={(currentUser.displayName || "Y").charAt(0)}
                    className="h-8 w-8"
                    data-ai-hint="person avatar"
                   />
                )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {/* AI Suggestions (Placeholder - to be implemented later) */}
      {/* <div className="p-2 border-t flex gap-2">
        <Button variant="outline" size="sm" className="bg-accent/20 border-accent text-accent hover:bg-accent/30">Suggestion 1</Button>
        <Button variant="outline" size="sm" className="bg-accent/20 border-accent text-accent hover:bg-accent/30">Suggestion 2</Button>
      </div> */}

      {/* Message Input */}
      <footer className="p-3 border-t bg-card">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Smile className="h-5 w-5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-background focus:bg-background/90"
            autoComplete="off"
            disabled={sendingMessage}
          />
          {newMessage && !sendingMessage ? (
            <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90">
              <SendHorizonal className="h-5 w-5 text-primary-foreground" />
            </Button>
          ) : sendingMessage ? (
            <Button type="button" size="icon" className="bg-primary hover:bg-primary/90" disabled>
                <Loader2 className="h-5 w-5 animate-spin text-primary-foreground" />
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </form>
      </footer>
    </div>
  );
}

    