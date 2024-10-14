import { SafeAreaView, StyleSheet, Pressable, Text } from "react-native";
import React, { useState } from "react";
import MyCalendar from "../components/MyCalendar";
import AddEvent from "../components/AddEvent";
import EditEvent from "../components/EditEvent";
import ListEvent from "../components/ListEvent";
import Header from "../components/Header";
import DeleteEvent from "../components/DeleteEvent";

const CalendarScreen = ({ navigation }) => {
  const [isAddEventVisible, setAddEventVisible] = useState(false);
  const [isEditEventVisible, setEditEventVisible] = useState(false);
  const [isDeletePopupVisible, setDeletePopupVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const toggleAddEventModal = () => {
    setAddEventVisible(!isAddEventVisible);
  };

  const toggleEditEventModal = (event) => {
    setSelectedEvent(event);
    setEditEventVisible(!isEditEventVisible);
  };

  const toggleDeletePopup = () => {
    setDeletePopupVisible(!isDeletePopupVisible);
  };

  const handleDeleteEvent = () => {
    // Logic for deleting the event
    console.log("Event Deleted:", selectedEvent);
    setDeletePopupVisible(false);
    setEditEventVisible(false); 
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
      <ListEvent toggleEditEventModal={toggleEditEventModal} />
      {isAddEventVisible && <AddEvent onClose={toggleAddEventModal} />}
      {isEditEventVisible && (
        <EditEvent
          event={selectedEvent}
          onClose={() => setEditEventVisible(false)}
          onDelete={toggleDeletePopup}
        />
      )}
      <DeleteEvent
        visible={isDeletePopupVisible}
        onClose={toggleDeletePopup}
        onConfirm={handleDeleteEvent}
      />
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
