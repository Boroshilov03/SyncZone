import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet } from 'react-native';

const HUME_WS_URL = 'URL';  // WebSocket endpoint
const HUME_API_KEY = 'API';  // API

// Emotion Color Mapping
const emotionColorMap = {
  Excitement: 'yellow',
  Disappointment: 'blue',
  Joy: 'orange',
  Sadness: 'gray',
  Anger: 'red',
  Confusion: 'purple',
  Love: 'pink',
  // Add more emotions if needed
};

export default function App() {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const ws = useRef(null);

  // Initialize WebSocket connection on component
  useEffect(() => {
    ws.current = new WebSocket(`${HUME_WS_URL}?apiKey=${HUME_API_KEY}`);

    ws.current.onmessage = (event) => {
      const response = JSON.parse(event.data);
      console.log('Full Emotion response:', JSON.stringify(response, null, 2));
    
      if (response.language && response.language.predictions.length > 0) {
        const emotionScores = [];
    
        // Collect all emotions from all predictions
        response.language.predictions.forEach((prediction) => {
          prediction.emotions.forEach((emotion) => {
            emotionScores.push(emotion);
          });
        });
    
        // Sort emotions by score and take the top 2 or 3
        const topEmotions = emotionScores.sort((a, b) => b.score - a.score).slice(0, 3);
    
        const emotionText = topEmotions.map(e => `${e.name} (${e.score.toFixed(2)})`).join(', ');
        const emotionMessage = { text: `Detected emotions: ${emotionText}`, sender: 'bot', emotions: topEmotions };
    
        // Append the message to the chat
        setChat((prevChat) => [...prevChat, emotionMessage]);
      }
    };    

    // Handle error
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.current.close();
    };
  }, []);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage = { text: message, sender: 'user', emotion: null };
    setChat([...chat, newMessage]);

    // Send the message to Hume AI via WebSocket
    const payload = {
      models: { language: {} },
      raw_text: true,
      data: message,
    };

    ws.current.send(JSON.stringify(payload));
    setMessage('');
  };

  // Render the chat message with multiple emotion icons
  const renderItem = ({ item }) => {
    return (
      <View style={item.sender === 'user' ? styles.userMessage : styles.botMessage}>
        <Text>{item.text}</Text>

        {/* Display emotions if they exist */}
        {item.emotions && (
          <View style={styles.emotionContainer}>
            {item.emotions.map((emotion, index) => {
              const emotionColor = emotionColorMap[emotion.name] || 'gray'; // Use color map or default to gray
              return (
                <View key={index} style={styles.emotionItem}>
                  <View style={[styles.emotionCircle, { backgroundColor: emotionColor }]} />
                  <Text style={styles.emotionText}>{emotion.name}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={chat}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}  // Use the renderItem function
      />
      <TextInput
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        placeholder="Type a message"
      />
      <Button title="Send" onPress={handleSendMessage} />
    </View>
  );
}

// Styles for the chat and emotion display
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingLeft: 8,
    marginBottom: 8,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#dcf8c6',
    padding: 8,
    marginVertical: 4,
    borderRadius: 4,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f1f1',
    padding: 8,
    marginVertical: 4,
    borderRadius: 4,
  },
  emotionContainer: {
    flexDirection: 'row',  
    flexWrap: 'wrap',  
    marginTop: 4,
  },
  emotionItem: {
    flexDirection: 'row',  
    alignItems: 'center',
    marginRight: 8,  
  },
  emotionCircle: {
    width: 12,  
    height: 12,
    borderRadius: 6,  
    marginRight: 4,  
  },
  emotionText: {
    fontSize: 14,
    color: 'gray',
  },
});
