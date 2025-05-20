"use client";

import { CustomAvatar } from "@/components/common/CustomAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Paperclip, SendHorizonal, Smile, Mic, Phone, Video, Info } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";

// Mock message type, replace with actual type from lib/types.ts
interface Message {
  id: string;
  text: string;
  sender: "me" | "other";
  avatar?: string;
  timestamp: string;
  dataAiHint?: string;
}

// Placeholder data
const mockChatPartner = { name: "Alice Wonderland", avatar: "https://placehold.co/100x100.png", status: "Online", dataAiHint: "woman portrait" };

const mockMessages: Message[] = [
  { id: "1", text: "Hey there! How are you?", sender: "other", avatar: mockChatPartner.avatar, timestamp: "10:00 AM", dataAiHint: mockChatPartner.dataAiHint },
  { id: "2", text: "I'm good, thanks! Just working on the new project. You?", sender: "me", timestamp: "10:01 AM" },
  { id: "3", text: "Same here! It's going well. We should catch up soon.", sender: "other", avatar: mockChatPartner.avatar, timestamp: "10:02 AM", dataAiHint: mockChatPartner.dataAiHint },
  { id: "4", text: "Definitely! How about coffee next week?", sender: "me", timestamp: "10:03 AM" },
  { id: "5", text: "Sounds great! Let me know what day works for you.", sender: "other", avatar: mockChatPartner.avatar, timestamp: "10:04 AM", dataAiHint: mockChatPartner.dataAiHint },
  { id: "6", text: "Cool, I'll check my calendar and get back to you!", sender: "me", timestamp: "10:05 AM" },
];


export default function IndividualChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch chat details and messages based on chatId
    // For now, using mock data
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatId, messages]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;
    const msg: Message = {
      id: String(Date.now()),
      text: newMessage,
      sender: "me",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([...messages, msg]);
    setNewMessage("");
  };

  if (!user) return <p>Loading user...</p>; // Or a redirect

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
          <CustomAvatar src={mockChatPartner.avatar} alt={mockChatPartner.name} className="h-10 w-10" data-ai-hint={mockChatPartner.dataAiHint}/>
          <div>
            <h2 className="font-semibold text-foreground">{mockChatPartner.name}</h2>
            <p className="text-xs text-muted-foreground">{mockChatPartner.status}</p>
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
      <ScrollArea className="flex-1 p-4 space-y-4" ref={scrollAreaRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${
              msg.sender === "me" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender === "other" && (
              <CustomAvatar src={msg.avatar} alt="Sender" className="h-8 w-8" data-ai-hint={msg.dataAiHint} />
            )}
            <div
              className={`max-w-[70%] p-3 rounded-xl shadow ${
                msg.sender === "me"
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-card text-card-foreground rounded-bl-none border"
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground text-right'}`}>
                {msg.timestamp}
              </p>
            </div>
             {msg.sender === "me" && user?.photoURL && (
                <CustomAvatar src={user.photoURL} alt={user.displayName || "You"} className="h-8 w-8" />
              )}
          </div>
        ))}
      </ScrollArea>
      
      {/* AI Suggestions (Placeholder) */}
      {/* <div className="p-2 border-t flex gap-2">
        <Button variant="outline" size="sm" className="bg-accent/20 border-accent text-accent hover:bg-accent/30">Suggestion 1</Button>
        <Button variant="outline" size="sm" className="bg-accent/20 border-accent text-accent hover:bg-accent/30">Suggestion 2</Button>
      </div> */}

      {/* Message Input */}
      <footer className="p-3 border-t bg-card">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Smile className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-background focus:bg-background/90"
            autoComplete="off"
          />
          {newMessage ? (
            <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90">
              <SendHorizonal className="h-5 w-5 text-primary-foreground" />
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
