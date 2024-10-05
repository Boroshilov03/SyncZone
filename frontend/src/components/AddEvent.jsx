import { View, Text, TextInput, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';


const AddEvent = () => {
  // const [ addEvent, setAddEvent] = useState({});

  // const { data, error } = await supabase

  // .from('calendar')
  // .insert({id:id})

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Event</Text>
      <TextInput
        style={styles.input}
        placeholder="Add event"
        value={inputValue}
        onChangeText={setInputValue}
      />
    </View> 
  );
};


const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    shadowColor: "#000", // Black shadow
    shadowOffset: { width: 0, height: 2 }, // Offset for the shadow
    shadowOpacity: 0.3, // Opacity of the shadow
    shadowRadius: 5, // Blur radius for the shadow
    elevation: 5, // Android-specific shadow property
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: 'grey',
    borderWidth: 1,
    paddingLeft: 10,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#fff', // Make sure input has a background color
    shadowColor: "#000", // Black shadow
    shadowOffset: { width: 0, height: 2 }, // Offset for the shadow
    shadowOpacity: 0.3, // Opacity of the shadow
    shadowRadius: 5, // Blur radius for the shadow
    elevation: 5, // Android-specific shadow property
  },
});


export default AddEvent;