
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Conversation, LumiStore, LumiSettings } from '@/types/lumi';

const DEFAULT_SETTINGS: LumiSettings = {
  sidebarOpen: true,
  theme: 'light'
};

const STORAGE_KEY = 'lumi-store';
const BACKUP_KEY = 'lumi-conversations-backup';

// Utility functions for UUID validation and generation
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const generateUUID = (): string => {
  return crypto.randomUUID();
};

// Migrate old timestamp IDs to UUIDs
const migrateConversationIds = (conversations: Conversation[]): Conversation[] => {
  return conversations.map(conv => {
    if (!isValidUUID(conv.id)) {
      console.log(`Migrating conversation ID from ${conv.id} to UUID`);
      const newConv = {
        ...conv,
        id: generateUUID(),
        messages: conv.messages.map(msg => ({
          ...msg,
          id: isValidUUID(msg.id) ? msg.id : generateUUID()
        }))
      };
      return newConv;
    }
    return {
      ...conv,
      messages: conv.messages.map(msg => ({
        ...msg,
        id: isValidUUID(msg.id) ? msg.id : generateUUID()
      }))
    };
  });
};

export function useLumiStore() {
  const [store, setStore] = useState<LumiStore>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const migratedConversations = migrateConversationIds(parsed.conversations || []);
        
        // Save backup
        localStorage.setItem(BACKUP_KEY, JSON.stringify(migratedConversations));
        
        return {
          conversations: migratedConversations,
          settings: { ...DEFAULT_SETTINGS, ...parsed.settings }
        };
      }
    } catch (error) {
      console.error('Error loading LUMI store:', error);
      // Try to recover from backup
      try {
        const backup = localStorage.getItem(BACKUP_KEY);
        if (backup) {
          console.log('Recovering from backup');
          return {
            conversations: JSON.parse(backup),
            settings: DEFAULT_SETTINGS
          };
        }
      } catch (backupError) {
        console.error('Error loading backup:', backupError);
      }
    }
    return {
      conversations: [],
      settings: DEFAULT_SETTINGS
    };
  });

  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Carregar conversas do Supabase quando usuário estiver logado (apenas uma vez)
  useEffect(() => {
    if (session?.user?.id && !hasLoadedOnce && !isLoading) {
      loadConversationsFromSupabase();
    }
  }, [session?.user?.id]);

  // Salvar no localStorage sempre que store mudar
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (error) {
      console.error('Error saving LUMI store:', error);
    }
  }, [store]);

  const loadConversationsFromSupabase = async () => {
    if (!session?.user?.id || isLoading) return;

    setIsLoading(true);
    try {
      console.log('🔍 Carregando conversas do Supabase para usuário:', session.user.id);
      
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          created_at,
          updated_at,
          messages (
            id,
            role,
            content,
            created_at
          )
        `)
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar conversas:', error);
        return;
      }

      console.log(`📥 ${conversations?.length || 0} conversas carregadas do Supabase`);

      // Convert to local format
      const supabaseConversations: Conversation[] = (conversations || []).map(conv => ({
        id: conv.id,
        title: conv.title,
        messages: (conv.messages || [])
          .map(msg => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at).getTime()
          }))
          .sort((a, b) => a.timestamp - b.timestamp),
        createdAt: new Date(conv.created_at).getTime(),
        updatedAt: new Date(conv.updated_at).getTime()
      }));

      // Smart merge: Priorizar conversas locais mais recentes ou com mais mensagens
      setStore(prev => {
        const localConversations = prev.conversations;
        const mergedMap = new Map<string, Conversation>();
        
        // Adicionar conversas do Supabase
        supabaseConversations.forEach(conv => {
          mergedMap.set(conv.id, conv);
        });
        
        // Sobrescrever com conversas locais se forem mais recentes ou tiverem mais mensagens
        localConversations.forEach(localConv => {
          const supabaseConv = mergedMap.get(localConv.id);
          
          // SEMPRE priorizar versão local se:
          // 1. Não existe no Supabase, OU
          // 2. Versão local tem mais mensagens, OU
          // 3. Versão local foi atualizada mais recentemente E tem pelo menos as mesmas mensagens
          const shouldUseLocal = !supabaseConv || 
            localConv.messages.length > supabaseConv.messages.length ||
            (localConv.updatedAt > supabaseConv.updatedAt && localConv.messages.length >= supabaseConv.messages.length);
          
          if (shouldUseLocal) {
            console.log(`✅ Mantendo versão LOCAL de "${localConv.title}":`, {
              localMessages: localConv.messages.length,
              supabaseMessages: supabaseConv?.messages.length || 0,
              localUpdated: new Date(localConv.updatedAt).toISOString(),
              supabaseUpdated: supabaseConv ? new Date(supabaseConv.updatedAt).toISOString() : 'N/A'
            });
            mergedMap.set(localConv.id, localConv);
            // Tentar salvar no Supabase
            saveConversationToSupabaseWithRetry(localConv);
          } else {
            console.log(`⚠️ Usando versão SUPABASE de "${localConv.title}" (mais recente)`);
          }
        });

        const mergedConversations = Array.from(mergedMap.values())
          .sort((a, b) => b.updatedAt - a.updatedAt);

        console.log(`✅ Merge concluído: ${mergedConversations.length} conversas`);
        setHasLoadedOnce(true);

        return {
          ...prev,
          conversations: mergedConversations
        };
      });

    } catch (error) {
      console.error('❌ Erro crítico ao carregar conversas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Retry system for Supabase saves
  const saveConversationToSupabaseWithRetry = async (conversation: Conversation, retries = 3) => {
    if (!session?.user?.id) {
      console.warn('❌ Tentativa de salvar conversa sem sessão ativa');
      return false;
    }

    console.log('💾 Iniciando salvamento:', {
      conversationId: conversation.id,
      messageCount: conversation.messages.length,
      userId: session.user.id
    });

    // Validate IDs before saving
    if (!isValidUUID(conversation.id)) {
      console.error('❌ ID de conversa inválido:', conversation.id);
      return false;
    }

    for (const message of conversation.messages) {
      if (!isValidUUID(message.id)) {
        console.error('❌ ID de mensagem inválido:', message.id);
        return false;
      }
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`📤 Tentativa ${attempt}/${retries} de salvar conversa`);

        // Check if conversation exists
        const { data: existingConv, error: checkError } = await supabase
          .from('conversations')
          .select('id')
          .eq('id', conversation.id)
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (checkError) {
          console.error('❌ Erro ao verificar conversa existente:', checkError);
          throw checkError;
        }

        if (existingConv) {
          console.log('🔄 Atualizando conversa existente');
          const { error: updateError } = await supabase
            .from('conversations')
            .update({
              title: conversation.title,
              updated_at: new Date(conversation.updatedAt).toISOString()
            })
            .eq('id', conversation.id);

          if (updateError) throw updateError;
        } else {
          console.log('✨ Criando nova conversa');
          const { error: insertError } = await supabase
            .from('conversations')
            .insert({
              id: conversation.id,
              user_id: session.user.id,
              title: conversation.title,
              created_at: new Date(conversation.createdAt).toISOString(),
              updated_at: new Date(conversation.updatedAt).toISOString()
            });

          if (insertError) throw insertError;
        }

        // Save messages with detailed logging
        console.log(`💬 Salvando ${conversation.messages.length} mensagens`);
        for (const message of conversation.messages) {
          const { data: existingMsg, error: msgCheckError } = await supabase
            .from('messages')
            .select('id')
            .eq('id', message.id)
            .maybeSingle();

          if (msgCheckError) {
            console.error('❌ Erro ao verificar mensagem:', msgCheckError);
            throw msgCheckError;
          }

          if (!existingMsg) {
            console.log(`➕ Inserindo mensagem ${message.role}:`, message.id);
            const { error: msgError } = await supabase
              .from('messages')
              .insert({
                id: message.id,
                conversation_id: conversation.id,
                role: message.role,
                content: message.content,
                created_at: new Date(message.timestamp).toISOString()
              });

            if (msgError) {
              console.error('❌ Erro ao inserir mensagem:', msgError);
              throw msgError;
            }
          }
        }

        console.log('✅ Conversa salva com sucesso no Supabase');
        return true;

      } catch (error: any) {
        console.error(`❌ Erro na tentativa ${attempt}:`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        if (attempt === retries) {
          console.error('❌ Falha após todas as tentativas');
          // Keep in localStorage for later sync
          localStorage.setItem(`unsaved-conversation-${conversation.id}`, JSON.stringify(conversation));
          return false;
        }
        
        // Wait before retry with exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return false;
  };

  // Legacy method for backward compatibility
  const saveConversationToSupabase = async (conversation: Conversation) => {
    return await saveConversationToSupabaseWithRetry(conversation);
  };

  const addConversation = async (conversation: Conversation) => {
    // Ensure conversation has valid UUID
    const validConversation = {
      ...conversation,
      id: isValidUUID(conversation.id) ? conversation.id : generateUUID(),
      messages: conversation.messages.map(msg => ({
        ...msg,
        id: isValidUUID(msg.id) ? msg.id : generateUUID()
      }))
    };

    setStore(prev => ({
      ...prev,
      conversations: [validConversation, ...prev.conversations]
    }));

    // Save to Supabase with retry
    const success = await saveConversationToSupabaseWithRetry(validConversation);
    if (!success) {
      console.warn('Conversation saved locally but failed to sync with Supabase');
    }

    // Update backup
    localStorage.setItem(BACKUP_KEY, JSON.stringify([validConversation, ...store.conversations]));
    
    return validConversation;
  };

  const updateConversation = async (id: string, updates: Partial<Conversation>) => {
    let updatedConversation: Conversation | null = null;

    setStore(prev => ({
      ...prev,
      conversations: prev.conversations.map(conv => {
        if (conv.id === id) {
          updatedConversation = { 
            ...conv, 
            ...updates, 
            updatedAt: Date.now(),
            messages: updates.messages ? updates.messages.map(msg => ({
              ...msg,
              id: isValidUUID(msg.id) ? msg.id : generateUUID()
            })) : conv.messages
          };
          return updatedConversation;
        }
        return conv;
      })
    }));

    // Save to Supabase if conversation was updated
    if (updatedConversation) {
      const success = await saveConversationToSupabaseWithRetry(updatedConversation);
      if (!success) {
        console.warn('Conversation updated locally but failed to sync with Supabase');
      }
      
      // Update backup
      localStorage.setItem(BACKUP_KEY, JSON.stringify(store.conversations));
    }
    
    return updatedConversation;
  };

  const deleteConversation = async (id: string) => {
    setStore(prev => {
      const filteredConversations = prev.conversations.filter(conv => conv.id !== id);
      // Update backup
      localStorage.setItem(BACKUP_KEY, JSON.stringify(filteredConversations));
      return {
        ...prev,
        conversations: filteredConversations
      };
    });

    // Delete from Supabase
    if (session?.user?.id && isValidUUID(id)) {
      try {
        const { error } = await supabase
          .from('conversations')
          .delete()
          .eq('id', id)
          .eq('user_id', session.user.id);
        
        if (error) throw error;
        console.log('Conversation deleted from Supabase:', id);
      } catch (error) {
        console.error('Error deleting conversation from Supabase:', error);
      }
    }
    
    // Remove from unsaved items
    localStorage.removeItem(`unsaved-conversation-${id}`);
  };

  // Sync unsaved conversations when connection is restored
  const syncUnSavedConversations = async () => {
    if (!session?.user?.id) return;
    
    console.log('Checking for unsaved conversations to sync...');
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('unsaved-conversation-')) {
        try {
          const conversationData = localStorage.getItem(key);
          if (conversationData) {
            const conversation = JSON.parse(conversationData);
            console.log('Attempting to sync unsaved conversation:', conversation.id);
            
            const success = await saveConversationToSupabaseWithRetry(conversation);
            if (success) {
              localStorage.removeItem(key);
              console.log('Successfully synced conversation:', conversation.id);
            }
          }
        } catch (error) {
          console.error('Error syncing unsaved conversation:', error);
        }
      }
    }
  };

  // Auto-sync unsaved conversations when user logs in (apenas uma vez após carregar)
  useEffect(() => {
    if (session?.user?.id && hasLoadedOnce && !isLoading) {
      syncUnSavedConversations();
    }
  }, [hasLoadedOnce]);

  const updateSettings = (settings: Partial<LumiSettings>) => {
    setStore(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings }
    }));
  };

  return {
    conversations: store.conversations,
    settings: store.settings,
    addConversation,
    updateConversation,
    deleteConversation,
    updateSettings,
    loadConversationsFromSupabase,
    syncUnSavedConversations,
    generateUUID
  };
}
