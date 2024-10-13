import { SafeAreaView, StyleSheet } from "react-native";
import React, { useState } from "react";
import MyCalendar from "../components/MyCalendar";
import AddEvent from "../components/AddEvent";
import EditEvent from "../components/EditEvent"; 
import ListEvent from "../components/ListEvent";
import Header from "../components/Header";

const CalendarScreen = ({ navigation }) => {
  const [isAddEventVisible, setAddEventVisible] = useState(false);
  const [isEditEventVisible, setEditEventVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const toggleAddEventModal = () => {
    setAddEventVisible(!isAddEventVisible); 
  };

  const toggleEditEventModal = () => {
    setEditEventVisible(!isEditEventVisible); 
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        toggleAddEventModal={toggleAddEventModal}
        event="calendar"
        navigation={navigation}
        title="My Events"
      />
      <MyCalendar />
      <ListEvent 
        toggleEditEventModal={toggleEditEventModal}/> 
      {isAddEventVisible && <AddEvent onClose={toggleAddEventModal} />}
      {isEditEventVisible && <EditEvent event={selectedEvent} onClose={() => setEditEventVisible(false)} />} 
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
});

export default CalendarScreen;
