const express = require('express');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 5000;

// Middleware to parse JSON requests
app.use(express.json());

// Supabase credentials
const supabaseUrl = 'URL';
const supabaseKey = 'API';
const supabase = createClient(supabaseUrl, supabaseKey);

// Hume AI API details
const HUME_API_KEY = 'API';
const HUME_API_URL = 'URL';

// Endpoint to process chat message and analyze emotions
app.post('/process-chat', async (req, res) => {
  const { message, userId } = req.body;

  try {
    // Send message to Hume AI for emotion analysis
    const humeResponse = await axios.post(
      HUME_API_URL,
      {
        data: [message],
        models: {
          language: true,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': HUME_API_KEY,
        },
      }
    );

    // Extract emotions from Hume response
    const predictions = humeResponse.data.language.predictions[0].emotions;
    const emotions = predictions.map((emotion) => ({
      name: emotion.name,
      score: emotion.score,
    }));

    // Insert chat message and emotion into Supabase
    const { data, error } = await supabase
      .from('chats')
      .insert([
        { user_id: userId, message: message, emotion: emotions[0].name, timestamp: new Date() },
      ]);

    if (error) throw error;

    // Send the emotion data back to the frontend
    res.status(200).json({ message: 'Emotion detected', emotions });

  } catch (error) {
    console.error('Error processing chat:', error);
    res.status(500).json({ error: 'Failed to analyze emotion' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
