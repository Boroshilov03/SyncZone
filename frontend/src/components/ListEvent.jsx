import { View, Text, ScrollView, StyleSheet } from 'react-native';
import React from 'react';
import { DUMMY_DATA } from '../data/CalendarDummy';

const ListEvent = () => {
  return (
    <ScrollView>
      {DUMMY_DATA.map(event => (
        <View key={event.id} style={[styles.container, { backgroundColor: getMoodColor(event.mood) }]}>
          <View style={styles.row}>
            <Text style={styles.title}>{event.title}</Text>
            <Text>
              {new Date(event.startDate).toLocaleString(undefined, { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
            <Text>
              {new Date(event.endDate).toLocaleString(undefined, { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const getMoodColor = (mood) => {
  switch (mood) {
    case 'yellow':
      return '#FFFDE7'; // Softer Pastel Yellow
    case 'green':
      return '#DCEDC8'; // Softer Pastel Green
    case 'pink':
      return '#FDE0E1'; // Sakura Pink
      case 'purple':
      return '#F3E5F5'; // Softer Pastel Purple
    case 'blue':
      return '#E3F2FD'; // Softer Pastel Blue
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 20,
    marginHorizontal: 20,
    // Shadow properties for iOS
    shadowColor: '#000', // Color of the shadow
    shadowOffset: { width: 0, height: 4 }, // Offset of the shadow
    shadowOpacity: 0.3, // Opacity of the shadow
    shadowRadius: 6, // Radius of the shadow blur
    // Elevation property for Android
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  context: {
    marginTop: 5,
  },
});

export default ListEvent;
