import { supabase } from "../src/lib/supabase";
import { HUME_WS_URL, HUME_API_KEY } from '@env';

export const saveMessageToSupabase = async (content, senderId, chatId) => {
  try {
    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          content,
          sender_id: senderId,
          chat_id: chatId,
          created_at: new Date(),
        },
      ])
      .select("*");

    if (error) {
      console.error("Message save error:", error.message);
      throw error;
    }

    if (!data || data.length === 0) {
      console.error("Message save failed: no return data.");
      return null;
    }

    return data[0];
  } catch (error) {
    console.error("Saving message error:", error);
    return null;
  }
};

export const initializeWebSocket = (handleWebSocketMessage) => {
  const ws = new WebSocket(`${HUME_WS_URL}?apiKey=${HUME_API_KEY}`);

  ws.onopen = () => {
    console.log('WebSocket connection established');
  };

  ws.onmessage = handleWebSocketMessage;

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket connection closed');
  };

  return ws;
};
