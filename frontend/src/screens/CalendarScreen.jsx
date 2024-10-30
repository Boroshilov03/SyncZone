import { View, SafeAreaView, StyleSheet, Pressable, Text } from "react-native";
import React, { useState } from "react";
import MyCalendar from "../components/MyCalendar";
import AddEvent from "../components/AddEvent";
import EditEvent from "../components/EditEvent";
import Header from "../components/Header";
import DeleteEvent from "../components/DeleteEvent";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

const Tab = createBottomTabNavigator();

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
    <View style={styles.safeArea}>
      <Header
        toggleAddEventModal={toggleAddEventModal}
        event="calendar"
        navigation={navigation}
        title="Events"
      />
      <MyCalendar toggleEditEventModal={toggleEditEventModal} />
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
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
});

export default CalendarScreen;
