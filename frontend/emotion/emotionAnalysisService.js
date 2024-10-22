import { supabase } from "../src/lib/supabase";
import { saveMessageToSupabase } from "./api";

const encodeToBase64 = (str) => {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    console.error("Failed to encode text to Base64:", e);
    return "";
  }
};

export const saveEmotionAnalysisForBothUsers = async (messageId, emotions, senderId, chatId) => {
    try {
      if (!emotions || emotions.length === 0) {
        console.error("No emotions provided for saving.");
        return;
      }
  
      // Find the emotion with the highest score
      const topEmotion = emotions.reduce((prev, current) => {
        return prev.score > current.score ? prev : current;
      });
  
      // Get the receiver's ID from the chat
      const { data: chatParticipants, error: chatError } = await supabase
        .from('chat_participants')
        .select('user_id')
        .eq('chat_id', chatId);
  
      if (chatError) {
        console.error('Error fetching chat participants:', chatError);
        return;
      }
  
      // Find the receiver ID (the user who is not the sender)
      const receiverId = chatParticipants
        .find(participant => participant.user_id !== senderId)?.user_id;
  
      if (!receiverId) {
        console.error('Receiver not found in chat participants');
        return;
      }
  
      const { data: existingAnalysis, error: existingError } = await supabase
        .from('emotion_analysis')
        .select('*')
        .eq('message_id', messageId);
  
      if (existingError) {
        console.error('Error checking existing emotion analysis:', existingError);
        return;
      }
  
      if (!existingAnalysis || existingAnalysis.length === 0) {
        // Save emotion analysis for sender
        const { error: senderError } = await supabase
          .from('emotion_analysis')
          .insert([
            {
              message_id: messageId,
              sender_id: senderId,
              emotion: topEmotion.name,
              accuracy: topEmotion.score,
              created_at: new Date().toISOString(),
            }
          ]);
  
        if (senderError) {
          console.error('Sender emotion data save error:', senderError.message);
          return;
        }
  
        console.log('Sender emotion analysis saved successfully');
      } else {
        console.log('Emotion analysis already exists for this message');
      }
  
      return { 
        senderId, 
        receiverId, 
        emotion: topEmotion 
      };
    } catch (error) {
      console.error('Saving emotion analysis error:', error);
      return null;
    }
  };

export const processMessageWithEmotion = async (messageContent, userId, chatId, wsConnection) => {
  try {
    // Save message to Supabase
    const savedMessage = await saveMessageToSupabase(messageContent, userId, chatId);
    if (!savedMessage) return null;

    // Encode message for Hume API
    const base64MessageContent = encodeToBase64(messageContent);

    // Send to Hume API for emotion analysis
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify({
        data: base64MessageContent,
        models: {
          language: {
            granularity: "sentence",
          },
        },
      }));

      // Handle emotion analysis response
      return new Promise((resolve) => {
        wsConnection.onmessage = async (event) => {
          const emotionResponse = JSON.parse(event.data);
          
          if (emotionResponse.language && emotionResponse.language.predictions.length > 0) {
            const emotions = emotionResponse.language.predictions[0].emotions;
            
            // Save emotion analysis for both users
            const analysisResult = await saveEmotionAnalysisForBothUsers(
              savedMessage.id,
              emotions,
              userId,
              chatId
            );

            resolve({
              message: savedMessage,
              emotionAnalysis: analysisResult
            });
          }
        };
      });
    }
    
    return { message: savedMessage, emotionAnalysis: null };
  } catch (error) {
    console.error('Processing message with emotion error:', error);
    return null;
  }
};