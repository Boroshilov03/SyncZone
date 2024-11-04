import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { isNegativeEmotion } from './emotionUtils';

const ScheduleButton = ({ message, currentUserId }) => {
  const navigation = useNavigation();

  // Only show button if: Current user is the sender / Message is from receiver / Receiver's emotion is negative
  const shouldShowButton = () => {
    if (!message || !message.receiverEmotion || message.sender_id !== currentUserId) {
      return false;
    }
    return isNegativeEmotion(message.receiverEmotion.name);
  };

  const handleSchedule = () => {
    navigation.navigate('CalendarScreen', {
      showAddEvent: true,
      defaultTitle: `Follow-up: ${message.content.substring(0, 30)}...`,
      relatedMessageId: message.id
    });
  };

  if (!shouldShowButton()) {
    return null;
  }

  return (
    <TouchableOpacity style={styles.scheduleButton} onPress={handleSchedule}>
      <Text style={styles.buttonText}>Schedule</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  scheduleButton: {
    position: 'absolute',
    right: -60,
    bottom: 0,
    backgroundColor: '#A0D7E5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  }
});

export default ScheduleButton;