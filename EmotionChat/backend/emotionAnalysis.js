import { supabase } from '../src/lib/supabase';

export const saveEmotionAnalysis = async (messageId, emotions) => {
  const emotionData = emotions.map((emotion) => ({
    message_id: messageId,
    emotion: emotion.name,
    accuracy: emotion.score,
  }));

  try {
    const { error } = await supabase
      .from('emotion_analysis')
      .insert(emotionData);

    if (error) {
      console.error('Emotion data save error:', error.message);
      throw error;
    }
  } catch (error) {
    console.error('Saving emotion data error:', error);
  }
};
