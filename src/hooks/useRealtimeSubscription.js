import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const useRealtimeSubscription = ({
  table,
  filter,
  onUpdate,
  onInsert,
  onDelete
}) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // A variable to hold the subscription so we can unsubscribe later
    let subscription;

    const setupSubscription = async () => {
      try {
        const channel = supabase
          .channel(`realtime-${table}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: table,
              filter: filter
            },
            (payload) => {
              console.log(`Realtime update for ${table}:`, payload);
              
              switch (payload.eventType) {
                case 'UPDATE':
                  onUpdate?.(payload);
                  break;
                case 'INSERT':
                  onInsert?.(payload);
                  break;
                case 'DELETE':
                  onDelete?.(payload);
                  break;
              }
            }
          )
          .subscribe((status) => {
            console.log(`Realtime subscription status for ${table}:`, status);
            setIsConnected(status === 'SUBSCRIBED');
          });

        subscription = channel;
      } catch (error) {
        console.error(`Error setting up realtime subscription for ${table}:`, error);
      }
    };

    setupSubscription();

    // This is the cleanup function that runs when the component unmounts
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [table, filter, onUpdate, onInsert, onDelete]);

  return { isConnected };
};
