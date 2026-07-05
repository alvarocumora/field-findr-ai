import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Message {
  id: string;
  thread_id: string;
  listing_id: string | null;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface Thread {
  thread_id: string;
  listing_id: string | null;
  last_message: string;
  last_date: string;
  other_user_id: string;
  unread_count: number;
}

export const useMessages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get all messages grouped by thread
  const messagesQuery = useQuery({
    queryKey: ['messages', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Message[];
    },
    enabled: !!user,
  });

  // Derive threads from messages
  const threads: Thread[] = (() => {
    if (!user || !messagesQuery.data) return [];
    const threadMap = new Map<string, Thread>();
    
    for (const msg of messagesQuery.data) {
      const existing = threadMap.get(msg.thread_id);
      const otherUserId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
      
      if (!existing) {
        threadMap.set(msg.thread_id, {
          thread_id: msg.thread_id,
          listing_id: msg.listing_id,
          last_message: msg.content,
          last_date: msg.created_at,
          other_user_id: otherUserId,
          unread_count: (!msg.read && msg.recipient_id === user.id) ? 1 : 0,
        });
      } else {
        if (new Date(msg.created_at) > new Date(existing.last_date)) {
          existing.last_message = msg.content;
          existing.last_date = msg.created_at;
        }
        if (!msg.read && msg.recipient_id === user.id) {
          existing.unread_count++;
        }
      }
    }
    
    return Array.from(threadMap.values()).sort(
      (a, b) => new Date(b.last_date).getTime() - new Date(a.last_date).getTime()
    );
  })();

  const totalUnread = threads.reduce((sum, t) => sum + t.unread_count, 0);

  // Send a message
  const sendMessage = useMutation({
    mutationFn: async ({ threadId, recipientId, content, listingId }: {
      threadId: string;
      recipientId: string;
      content: string;
      listingId?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('messages').insert({
        thread_id: threadId,
        sender_id: user.id,
        recipient_id: recipientId,
        content,
        listing_id: listingId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', user?.id] });
    },
  });

  // Mark thread as read
  const markThreadRead = useMutation({
    mutationFn: async (threadId: string) => {
      if (!user) return;
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('thread_id', threadId)
        .eq('recipient_id', user.id)
        .eq('read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', user?.id] });
    },
  });

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`messages-realtime-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const msg = payload.new as Message;
        if (msg.sender_id === user.id || msg.recipient_id === user.id) {
          queryClient.invalidateQueries({ queryKey: ['messages', user.id] });
          // Also invalidate the specific thread
          queryClient.invalidateQueries({ queryKey: ['thread-messages', msg.thread_id] });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return {
    messages: messagesQuery.data || [],
    threads,
    totalUnread,
    isLoading: messagesQuery.isLoading,
    sendMessage,
    markThreadRead,
  };
};

// Get messages for a specific thread. Standalone hook so its identity is stable
// and it obeys the Rules of Hooks (previously nested inside useMessages).
export const useThreadMessages = (threadId: string | null) => {
  return useQuery({
    queryKey: ['thread-messages', threadId],
    queryFn: async () => {
      if (!threadId) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as Message[];
    },
    enabled: !!threadId,
  });
};
