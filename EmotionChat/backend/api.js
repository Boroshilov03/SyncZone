import { supabase } from './supabase';

// Save message to supabase
export const saveMessageToSupabase = async (message, senderId, conversationId) => {
  const { data, error } = await supabase
    .from('message')
    .insert([{ content: message, sender_id: senderId, conversation_id: conversationId }]);

  if (error) {
    console.error('failed save message:', error);
  }
  return data;
};

// Save emotion
export const saveEmotionToSupabase = async (messageId, emotions) => {
  const emotionData = emotions.map(emotion => ({
    message_id: messageId,
    emotion: emotion.name,
    accuracy: emotion.score,
  }));

  const { error } = await supabase
    .from('emotion_analysis')
    .insert(emotionData);

  if (error) {
    console.error('failed save emotion:', error);
  }
};

// Last message
export const getLastMessageId = async () => {
  const { data, error } = await supabase
    .from('message')
    .select('id')
    .order('id', { ascending: false })
    .limit(1);

  if (error) {
    console.error('message ID error:', error);
    return null;
  }

  return data[0].id;
};

// WebSocket connection
export const initializeWebSocket = (HUME_WS_URL, HUME_API_KEY, setChat) => {
  const ws = new WebSocket(`${HUME_WS_URL}?apiKey=${HUME_API_KEY}`);

  ws.onmessage = async (event) => {
    const response = JSON.parse(event.data);
    console.log('emotion recognition response:', JSON.stringify(response, null, 2));

    if (response.language && response.language.predictions.length > 0) {
      const emotionScores = [];

      response.language.predictions.forEach((prediction) => {
        prediction.emotions.forEach((emotion) => {
          emotionScores.push(emotion);
        });
      });

      const topEmotions = emotionScores.sort((a, b) => b.score - a.score).slice(0, 3);
      const emotionText = topEmotions.map(e => `${e.name} (${e.score.toFixed(2)})`).join(', ');
      const emotionMessage = { text: `emotion recognition result: ${emotionText}`, sender: 'bot', emotions: topEmotions };

      setChat((prevChat) => [...prevChat, emotionMessage]);

      const lastMessageId = await getLastMessageId();
      await saveEmotionToSupabase(lastMessageId, topEmotions);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket disconnect');
  };

  return ws;
};
