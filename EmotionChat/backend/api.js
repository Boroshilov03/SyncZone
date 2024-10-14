import { supabase } from "../src/lib/supabase";

const HUME_WS_URL = 'WebSocket endpoint';  // WebSocket endpoint
const HUME_API_KEY = ' API';  // API

// Message saving
export const saveMessageToSupabase = async (content, senderId, chatId) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ content, sender_id: senderId, chat_id: chatId, created_at: new Date() }])
      .select("*");

    if (error) {
      console.error('Message save error:', error.message);
      throw error;
    }

    if (!data || data.length === 0) {
      console.error('Message save failed: no return data.');
      return null;
    }

    return data[0];
  } catch (error) {
    console.error('Saving message error:', error);
    return null;
  }
};

// WebSocket initialization
export const initializeWebSocket = (setChat) => {
  const ws = new WebSocket(`${HUME_WS_URL}?apiKey=${HUME_API_KEY}`);

  ws.onmessage = (event) => {
    const response = JSON.parse(event.data);
    console.log('감정 분석 응답:', JSON.stringify(response, null, 2));

    if (response.language && response.language.predictions.length > 0) {
      const emotionScores = [];
      response.language.predictions.forEach((prediction) => {
        prediction.emotions.forEach((emotion) => {
          emotionScores.push(emotion);
        });
      });

      const topEmotions = emotionScores.sort((a, b) => b.score - a.score).slice(0, 1); // 가장 높은 감정 하나만 선택
      const highestEmotion = topEmotions[0];

      setChat((prevChat) =>
        prevChat.map((msg) =>
          msg.content === response.language.predictions[0].text ? { ...msg, emotion: highestEmotion } : msg
        )
      );
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket connection closed');
  };

  return ws;
};
