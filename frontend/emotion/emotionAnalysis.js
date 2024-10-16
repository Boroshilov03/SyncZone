import { supabase } from "../src/lib/supabase";

export const saveEmotionAnalysis = async (messageId, emotions) => {
  try {
    if (!emotions || emotions.length === 0) {
      console.error("No emotions provided for saving.");
      return;
    }

    // Find the emotion with the highest score
    const topEmotion = emotions.reduce((prev, current) => {
      return prev.score > current.score ? prev : current;
    });

    const { data, error } = await supabase
      .from('emotion_analysis')
      .insert([
        {
          message_id: messageId,
          emotion: topEmotion.name,
          accuracy: topEmotion.score,
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      console.error('Emotion data save error:', error.message);
      return;
    }

    console.log('Emotion analysis saved:', data);
  } catch (error) {
    console.error('Saving emotion analysis error:', error);
  }
};


