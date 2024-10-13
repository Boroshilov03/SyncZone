import { supabase } from './supabase';

// Message save to supabase
export const saveMessageToSupabase = async (content, senderId, chatId) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ content, sender_id: senderId, chat_id: chatId, created_at: new Date() }]);

    if (error) {
      console.error('Save message error:', error.message);
      throw error;
    }
    return data[0]; // saved message
  } catch (error) {
    console.error('Saving message error:', error);
    return null;
  }
};

// Emotion analysis Api call
export const fetchEmotionAnalysis = async (message) => {
  try {
    const response = await fetch('https://api.hume.ai/v0/analyze', { // Hume endpoint Url
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `api`,  // Hume Api
      },
      body: JSON.stringify({
        texts: [message],  // Message to analyze
        models: { emotion: true }  // Model to use for analysis
      }),
    });

    const result = await response.json();
    if (response.ok) {
      return result;
    } else {
      console.error('Emotion analysis failed:', result);
      return null;
    }
  } catch (error) {
    console.error('Emotion analysis error:', error);
    return null;
  }
};
