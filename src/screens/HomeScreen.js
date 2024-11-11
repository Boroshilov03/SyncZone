import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import VideoCall from '../components/VideoCall';

const HomeScreen = () => {
  const [inCall, setInCall] = useState(false);

  const handleStartCall = () => {
    setInCall(true);
  };

  const handleLeaveCall = () => {
    setInCall(false);
  };

  return (
    <View style={styles.container}>
      {inCall ? (
        <VideoCall onCallLeave={handleLeaveCall} />
      ) : (
        <View style={styles.welcomeContainer}>
          <Text style={styles.text}>Welcome to Video Call</Text>
          <TouchableOpacity style={styles.button} onPress={handleStartCall}>
            <Text style={styles.buttonText}>Start Call</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 24,
    marginBottom: 32,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default HomeScreen;