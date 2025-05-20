
"use client";

import { CustomAvatar } from "@/components/common/CustomAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Paperclip, SendHorizonal, Smile, Mic, Phone, Video, Info, Loader2, Check, MessageSquareReply, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect, useRef, FormEvent } from "react";
import { db, auth, rtdb, databaseRef } from "@/lib/firebase"; 
import { onValue, off } from "firebase/database";
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
import { formatRelativeTime } from "@/lib/utils";
import { suggestReply, type SuggestReplyInput, type SuggestReplyOutput } from "@/ai/flows/suggest-reply";

const formatMessageTimestamp = (timestamp: Timestamp | Date | undefined): string => {
  if (!timestamp) return "";
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

interface RtdbUserStatus {
  isOnline: boolean;
  lastSeen: number;
  displayName?: string;
}

export default function IndividualChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  const { user: currentUser } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatDetails, setChatDetails] = useState<Chat | null>(null);
  const [chatPartner, setChatPartner] = useState<User | null>(null);
  const [rtdbPartnerStatus, setRtdbPartnerStatus] = useState<RtdbUserStatus | null>(null);
  const [loadingChat, setLoadingChat] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingAiSuggestions, setLoadingAiSuggestions] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedMessageIdRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!chatId || !currentUser?.uid) return;
    setLoadingChat(true);
    const chatDocRef = doc(db, "chats", chatId);

    const unsubscribeChatDetails = onSnapshot(chatDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const chatData = { id: docSnap.id, ...docSnap.data() } as Chat;
        setChatDetails(chatData);

        if (!chatData.isGroup && chatData.participants) {
          const partnerId = chatData.participants.find(pId => pId !== currentUser.uid);
          if (partnerId) {
            const userDocRef = doc(db, "users", partnerId);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
              setChatPartner(userSnap.data() as User);
            } else {
              setChatPartner(null);
            }
          }
        } else if (chatData.isGroup) {
          setChatPartner(null);
        }
      } else {
        setChatDetails(null);
        setChatPartner(null);
      }
      setLoadingChat(false);
    }, (error) => {
      console.error("Error fetching chat details (Firestore):", error);
      setLoadingChat(false);
    });

    return () => unsubscribeChatDetails();
  }, [chatId, currentUser?.uid]);

  useEffect(() => {
    if (!chatDetails || chatDetails.isGroup || !currentUser?.uid) {
      setRtdbPartnerStatus(null);
      return;
    }
    
    const partnerId = chatDetails.participants.find(pId => pId !== currentUser.uid);
    if (!partnerId) {
      setRtdbPartnerStatus(null);
      return;
    }

    const partnerStatusRtdbRef = databaseRef(rtdb, `/status/${partnerId}`);
    const listener = onValue(partnerStatusRtdbRef, (snapshot) => {
      if (snapshot.exists()) {
        setRtdbPartnerStatus(snapshot.val() as RtdbUserStatus);
      } else {
        setRtdbPartnerStatus(null);
      }
    }, (error) => {
      setRtdbPartnerStatus(null);
    });
    return () => off(partnerStatusRtdbRef, 'value', listener);
  }, [chatDetails, currentUser?.uid]);

  useEffect(() => {
    if (!chatId || !currentUser?.uid) return;
    const messagesColRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesColRef, orderBy("timestamp", "asc"));

    const unsubscribeMessages = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages: ChatMessage[] = [];
      querySnapshot.forEach((doc) => {
        fetchedMessages.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(fetchedMessages);

      const latestMessage = fetchedMessages.length > 0 ? fetchedMessages[fetchedMessages.length - 1] : null;
      if (latestMessage && latestMessage.senderId !== currentUser?.uid && latestMessage.id !== lastProcessedMessageIdRef.current) {
        lastProcessedMessageIdRef.current = latestMessage.id;
        setLoadingAiSuggestions(true);
        setAiSuggestions([]);
        suggestReply({ message: latestMessage.text })
          .then(response => {
            setAiSuggestions(response.suggestions);
          })
          .catch(error => {
            console.error("Error fetching AI suggestions:", error);
          })
          .finally(() => {
            setLoadingAiSuggestions(false);
          });
      } else if (!latestMessage || (latestMessage && latestMessage.senderId === currentUser?.uid)) {
          setAiSuggestions([]);
          setLoadingAiSuggestions(false);
      }

    }, (error) => {
      console.error("Error fetching messages:", error);
    });
    return () => unsubscribeMessages();
  }, [chatId, currentUser?.uid]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !currentUser || !chatDetails) return;
    setSendingMessage(true);

    let replyData: Partial<ChatMessage> = {};
    if (replyingToMessage) {
      replyData = {
        replyTo: replyingToMessage.id,
        repliedMessageText: replyingToMessage.text.substring(0, 70) + (replyingToMessage.text.length > 70 ? '...' : ''),
        repliedMessageSender: replyingToMessage.senderDisplayName || "User",
      };
    }

    const messageData: Omit<ChatMessage, "id"> = {
      text: newMessage,
      senderId: currentUser.uid,
      timestamp: serverTimestamp(),
      status: 'sent', 
      senderPhotoURL: currentUser.photoURL || null,
      senderDisplayName: currentUser.displayName || currentUser.email || "User",
      ...replyData,
    };

    try {
      const messagesColRef = collection(db, "chats", chatId, "messages");
      await addDoc(messagesColRef, messageData);

      const chatDocRef = doc(db, "chats", chatId);
      await updateDoc(chatDocRef, {
        lastMessage: {
          text: newMessage,
          timestamp: serverTimestamp(),
          senderId: currentUser.uid,
        },
        updatedAt: serverTimestamp(),
        participants: arrayUnion(currentUser.uid) 
      });
      setNewMessage("");
      setReplyingToMessage(null);
      setAiSuggestions([]); // Clear AI suggestions after sending a message
    } catch (error) {
      console.error("Error sending message: ", error);
    } finally {
      setSendingMessage(false);
    }
  };
  
  const partnerName = chatDetails?.isGroup ? chatDetails.groupName : (rtdbPartnerStatus?.displayName || chatPartner?.displayName);
  const partnerAvatar = chatDetails?.isGroup ? chatDetails.groupAvatar : chatPartner?.photoURL;
  const partnerDataAiHint = chatDetails?.isGroup ? "group avatar" : (chatPartner as any)?.dataAiHint || "person avatar";
  
  const getPartnerStatus = () => {
    if (chatDetails?.isGroup) return null;
    if (rtdbPartnerStatus) {
      if (rtdbPartnerStatus.isOnline) return <span className="text-xs text-green-500">Online</span>;
      if (rtdbPartnerStatus.lastSeen) return <span className="text-xs text-muted-foreground">Last seen {formatRelativeTime(rtdbPartnerStatus.lastSeen)}</span>;
    } else if (chatPartner) {
      if (chatPartner.isOnline) return <span className="text-xs text-green-500">Online</span>;
      if (chatPartner.lastSeen) return <span className="text-xs text-muted-foreground">Last seen {formatRelativeTime(chatPartner.lastSeen)}</span>;
    }
    return <span className="text-xs text-muted-foreground">Offline</span>;
  };

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
        <p className="text-muted-foreground mb-4">The chat you are looking for does not exist or you may not have access to it.</p>
        <Button onClick={() => router.push('/chat')}>Go to Chats</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex items-center justify-between p-3 border-b bg-card shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="md:hidden">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          {partnerAvatar && <CustomAvatar src={partnerAvatar} alt={partnerName || "Chat partner"} className="h-10 w-10" data-ai-hint={partnerDataAiHint} />}
          {!partnerAvatar && <CustomAvatar fallback={partnerName?.charAt(0) || "?"} alt={partnerName || "Chat partner"} className="h-10 w-10" data-ai-hint={partnerDataAiHint} />}
          <div>
            <h2 className="font-semibold text-foreground">{partnerName || "Chat"}</h2>
            {getPartnerStatus()}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary"><Phone className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary"><Video className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary"><Info className="h-5 w-5" /></Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4" viewportRef={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 group ${ // Added group for hover effects
                msg.senderId === currentUser?.uid ? "justify-end" : "justify-start"
              }`}
            >
              {msg.senderId !== currentUser?.uid && (
                <CustomAvatar src={msg.senderPhotoURL} alt={msg.senderDisplayName || "Sender"} fallback={msg.senderDisplayName?.charAt(0) || "S"} className="h-8 w-8" data-ai-hint="person avatar"/>
              )}
              <div className={`flex items-center gap-2 ${msg.senderId === currentUser?.uid ? 'flex-row-reverse' : 'flex-row'}`}>
                <div
                  className={`max-w-[70%] p-3 rounded-xl shadow ${
                    msg.senderId === currentUser?.uid
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-card text-card-foreground rounded-bl-none border"
                  }`}
                >
                  {msg.replyTo && msg.repliedMessageText && (
                    <div className={`mb-2 p-2 rounded-md text-xs ${ msg.senderId === currentUser?.uid ? 'bg-blue-300 text-blue-800' : 'bg-muted'}`}>
                      <p className="font-semibold">{msg.repliedMessageSender === (currentUser?.displayName || currentUser?.email) ? "You" : msg.repliedMessageSender}</p>
                      <p className="opacity-80 truncate">{msg.repliedMessageText}</p>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                      <p className={`text-xs ${msg.senderId === currentUser?.uid ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {formatMessageTimestamp(msg.timestamp)}
                      </p>
                      {msg.senderId === currentUser?.uid && msg.status === 'sent' && (
                          <Check className="h-3.5 w-3.5 text-primary-foreground/70" />
                      )}
                  </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                    onClick={() => setReplyingToMessage(msg)}
                    aria-label="Reply to message"
                >
                    <MessageSquareReply className="h-4 w-4" />
                </Button>
              </div>
              {msg.senderId === currentUser?.uid && (
                  <CustomAvatar 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName || "You"} 
                    fallback={(currentUser.displayName || currentUser.email || "Y").charAt(0)}
                    className="h-8 w-8"
                    data-ai-hint="person avatar"
                   />
                )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <footer className="border-t bg-card">
        {replyingToMessage && (
          <div className="p-2.5 border-b bg-background/80 flex justify-between items-center">
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-primary">
                Replying to {replyingToMessage.senderId === currentUser?.uid ? "yourself" : (replyingToMessage.senderDisplayName || "User")}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {replyingToMessage.text}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setReplyingToMessage(null)} className="text-muted-foreground hover:text-destructive">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
         {aiSuggestions.length > 0 && !loadingAiSuggestions && (
          <div className="p-2 flex flex-wrap gap-2 border-b items-center">
            <p className="text-xs text-muted-foreground mr-2">Suggestions:</p>
            {aiSuggestions.map((suggestion, index) => (
            <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-auto py-1 px-2"
                onClick={() => {
                  setNewMessage(suggestion);
                  setAiSuggestions([]); 
                  inputRef.current?.focus();
                }}
            >
                {suggestion}
            </Button>
            ))}
          </div>
        )}
        {loadingAiSuggestions && (
            <div className="p-2 flex justify-center items-center border-b">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="ml-2 text-xs text-muted-foreground">Getting AI suggestions...</span>
            </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 p-3">
          <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Smile className="h-5 w-5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => {
                setNewMessage(e.target.value);
                if (e.target.value.trim() !== '' && aiSuggestions.length > 0) {
                    setAiSuggestions([]); 
                }
            }}
            className="flex-1 bg-background focus:bg-background/90"
            autoComplete="off"
            disabled={sendingMessage}
          />
          {newMessage.trim() && !sendingMessage ? (
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
