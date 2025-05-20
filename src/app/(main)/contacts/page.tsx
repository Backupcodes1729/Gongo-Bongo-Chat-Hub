import { Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomAvatar } from "@/components/common/CustomAvatar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const mockContacts = [
  { id: "1", name: "Alice Wonderland", email: "alice@example.com", avatar: "https://placehold.co/100x100.png", dataAiHint: "woman portrait" },
  { id: "2", name: "Bob The Builder", email: "bob@example.com", avatar: "https://placehold.co/100x100.png", dataAiHint: "man construction" },
  { id: "3", name: "Charlie Brown", email: "charlie@example.com", avatar: "https://placehold.co/100x100.png", dataAiHint: "boy cartoon" },
  { id: "4", name: "Diana Prince", email: "diana@example.com", avatar: "https://placehold.co/100x100.png", dataAiHint: "woman hero" },
];

export default function ContactsPage() {
  return (
    <div className="flex flex-col h-full p-4 sm:p-6 md:p-8 bg-background">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground flex items-center gap-2">
          <Users className="h-7 w-7 text-primary" />
          Your Contacts
        </h1>
        <Button>
          <UserPlus className="mr-2 h-5 w-5" />
          Invite Contact
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search contacts..."
            className="pl-10 w-full max-w-md"
          />
        </div>
      </div>

      {mockContacts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {mockContacts.map((contact) => (
            <Card key={contact.id} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center gap-4 p-4">
                <CustomAvatar src={contact.avatar} alt={contact.name} className="h-12 w-12" data-ai-hint={contact.dataAiHint} />
                <div>
                  <CardTitle className="text-lg">{contact.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{contact.email}</p>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Button variant="outline" className="w-full">Message</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-10 border-2 border-dashed rounded-lg">
          <Users className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-medium text-foreground mb-1">No contacts yet</h2>
          <p className="text-muted-foreground mb-4">Invite your friends and colleagues to Gongo Bongo!</p>
          <Button>
            <UserPlus className="mr-2 h-5 w-5" />
            Invite Your First Contact
          </Button>
        </div>
      )}
    </div>
  );
}
