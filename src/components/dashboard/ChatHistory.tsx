
import { useState } from 'react';
import { MessageSquare, Search, Trash2, Clock, Calendar, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Conversation } from '@/types/lumi';

interface ChatHistoryProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

export function ChatHistory({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation
}: ChatHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.messages.some(msg => msg.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const groupConversationsByDate = (conversations: Conversation[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const groups = {
      today: [] as Conversation[],
      yesterday: [] as Conversation[],
      thisWeek: [] as Conversation[],
      older: [] as Conversation[]
    };

    conversations.forEach(conv => {
      const convDate = new Date(conv.updatedAt);
      if (convDate >= today) {
        groups.today.push(conv);
      } else if (convDate >= yesterday) {
        groups.yesterday.push(conv);
      } else if (convDate >= lastWeek) {
        groups.thisWeek.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    return groups;
  };

  const conversationGroups = groupConversationsByDate(filteredConversations);

  const ConversationGroup = ({ title, conversations, icon }: { title: string; conversations: Conversation[]; icon: React.ReactNode }) => {
    if (conversations.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2 px-2">
          {icon}
          {title}
        </div>
        <div className="space-y-1">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                conv.id === currentConversationId
                  ? 'bg-muted border border-border'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => onSelectConversation(conv.id)}
            >
              <MessageSquare className={`h-4 w-4 flex-shrink-0 ${
                conv.id === currentConversationId ? 'text-foreground' : 'text-muted-foreground'
              }`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${
                  conv.id === currentConversationId ? 'text-foreground' : 'text-foreground'
                }`}>{conv.title}</p>
                <p className="text-xs text-muted-foreground">
                  {conv.messages.length} mensagens
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conv.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Conversation Groups */}
        <ConversationGroup
          title="Hoje"
          conversations={conversationGroups.today}
          icon={<Clock className="h-3 w-3" />}
        />
        <ConversationGroup
          title="Ontem"
          conversations={conversationGroups.yesterday}
          icon={<Calendar className="h-3 w-3" />}
        />
        <ConversationGroup
          title="Esta semana"
          conversations={conversationGroups.thisWeek}
          icon={<Star className="h-3 w-3" />}
        />
        <ConversationGroup
          title="Mais antigas"
          conversations={conversationGroups.older}
          icon={<MessageSquare className="h-3 w-3" />}
        />

        {filteredConversations.length === 0 && conversations.length > 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            Nenhuma conversa encontrada
          </div>
        )}

        {conversations.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            Suas conversas aparecerão aqui
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
