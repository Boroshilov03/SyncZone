import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import React from 'react';
import { DUMMY_DATA } from '../data/CalendarDummy';

const ListEvent = () => {
  return (
    <ScrollView>
      {DUMMY_DATA.map(event => (
        <View key={event.id} style={[styles.container, { backgroundColor: getMoodColor(event.mood) }]}>
        <View style={styles.row}>
          <View style={styles.imageContainer}>
            <Image source={require('../../assets/icons/calendaricon.webp')} style={[styles.icon, { width: 100, height: 100 }]} />
            <Text style={styles.overlayText}>
              {new Date(event.startDate).toLocaleString(undefined, { day: 'numeric' })}
            </Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{event.title}</Text>
            <Text style={styles.timeText}>
              ({new Date(event.startDate).toLocaleString(undefined, { hour: 'numeric', minute: 'numeric', hour12: true })} - 
              {new Date(event.endDate).toLocaleString(undefined, { hour: 'numeric', minute: 'numeric', hour12: true })})
            </Text>
          </View>
        </View>
          <View style={styles.flipIconContainer}>
              <Image source={require('../../assets/icons/flipicon.png')} style={styles.flipIcon} />
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
    padding: 10,
    marginTop: 10,
    borderRadius: 20,
    marginHorizontal: 20,
    // Shadow properties for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    position: 'relative', // Required for positioning flip icon inside the container
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  icon: {
    width: '100%',
    height: '100%',
  },
  overlayText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -14 }],
    color: 'black',
    fontWeight: 'bold',
    fontSize: 37,
    textAlign: 'center',
    width: '100%',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 3,
  },
  flipIconContainer: {
    position: 'absolute',
    bottom: 10, // Adjust distance from bottom of the container
    right: 10,  // Adjust distance from the right of the container
  },
  flipIcon: {
    width: 25,
    height: 25,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18, // Increased font size for title
  },
  timeText: {
    fontSize: 14, // Smaller font size for time text
    color: 'grey', // Lighter color for visibility
    paddingLeft: 0, // Left padding for time text
  },
});

export default ListEvent;
