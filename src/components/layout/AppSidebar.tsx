"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CustomAvatar } from "@/components/common/CustomAvatar";
import { PlusCircle, Search, MessageSquare, Users, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Placeholder data - replace with actual data fetching
const mockChats = [
  { id: "1", name: "Alice Wonderland", lastMessage: "See you soon!", avatar: "https://placehold.co/100x100.png", unread: 2, dataAiHint: "woman portrait" },
  { id: "2", name: "Bob The Builder", lastMessage: "Can we fix it?", avatar: "https://placehold.co/100x100.png", unread: 0, dataAiHint: "man construction" },
  { id: "3", name: "Charlie Brown", lastMessage: "Good grief!", avatar: "https://placehold.co/100x100.png", unread: 5, dataAiHint: "boy cartoon" },
];

const mockContacts = [
   { id: "4", name: "Diana Prince", avatar: "https://placehold.co/100x100.png", dataAiHint: "woman hero" },
   { id: "5", name: "Edward Elric", avatar: "https://placehold.co/100x100.png", dataAiHint: "boy anime" },
];


interface SidebarNavLinkProps {
  href: string;
  children: React.ReactNode;
  icon: React.ElementType;
}

function SidebarNavLink({ href, children, icon: Icon }: SidebarNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href === "/chat" && pathname.startsWith("/chat/"));


  return (
    <Link href={href} legacyBehavior>
      <a
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
        {children}
      </a>
    </Link>
  );
}


export function AppSidebar() {
  const pathname = usePathname();
  // This logic determines if we are in a specific chat view, to highlight the parent /chat link.
  const isChatActive = pathname.startsWith("/chat");


  return (
    <aside className="hidden md:flex flex-col w-72 border-r bg-sidebar text-sidebar-foreground">
      <div className="p-4 space-y-2">
        <h2 className="text-xl font-semibold text-sidebar-foreground">Chats</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search chats..." className="pl-8 w-full bg-background focus:bg-background/90" />
        </div>
      </div>

      <ScrollArea className="flex-1 px-2">
        <nav className="grid items-start gap-1">
           <SidebarNavLink href="/chat" icon={MessageSquare}>
            All Chats
          </SidebarNavLink>
           <SidebarNavLink href="/contacts" icon={Users}>
            Contacts
          </SidebarNavLink>
        </nav>

        <div className="mt-4 px-1">
          <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">Recent Chats</h3>
          {mockChats.map((chat) => (
            <Link
              href={`/chat/${chat.id}`}
              key={chat.id}
              className={cn(
                "flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                pathname === `/chat/${chat.id}` && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              )}
            >
              <CustomAvatar src={chat.avatar} alt={chat.name} className="h-9 w-9" data-ai-hint={chat.dataAiHint} />
              <div className="flex-1 truncate">
                <p className="font-medium text-sm truncate">{chat.name}</p>
                <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
              </div>
              {chat.unread > 0 && (
                <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {chat.unread}
                </span>
              )}
            </Link>
          ))}
        </div>
         <div className="mt-6 px-1">
          <Button variant="outline" className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <PlusCircle className="h-5 w-5" />
            Invite Contacts
          </Button>
        </div>
      </ScrollArea>
      
      <div className="mt-auto p-4 border-t border-sidebar-border">
        <SidebarNavLink href="/settings" icon={Settings}>
            Settings
        </SidebarNavLink>
      </div>
    </aside>
  );
}
