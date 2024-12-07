import { View, SafeAreaView, StyleSheet, Pressable, Text } from "react-native";
import React, { useState, useEffect } from "react";
import MyCalendar from "../components/MyCalendar";
import AddEvent from "../components/AddEvent";
import EditEvent from "../components/EditEvent";
import Header from "../components/Header";
import DeleteEvent from "../components/DeleteEvent";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

const Tab = createBottomTabNavigator();

const CalendarScreen = ({ navigation, route }) => {
  const [isAddEventVisible, setAddEventVisible] = useState(route?.params?.showAddEvent || false);
  const [isEditEventVisible, setEditEventVisible] = useState(false);
  const [isDeletePopupVisible, setDeletePopupVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [defaultEventTitle, setDefaultEventTitle] = useState(route?.params?.defaultTitle || '');
  const [relatedMessageId, setRelatedMessageId] = useState(route?.params?.relatedMessageId || null);

  useEffect(() => { // emotion chat to calendar
    if (route?.params?.showAddEvent) {
      setAddEventVisible(true);
      setDefaultEventTitle(route.params.defaultTitle || '');
      setRelatedMessageId(route.params.relatedMessageId || null);
    }
  }, [route?.params]);

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
    console.log("Event Deleted:", selectedEvent);
    setDeletePopupVisible(false);
    setEditEventVisible(false);
  };

  return (
    <View style={{ flex: 1, position: "relative", zIndex: 1, backgroundColor: "#fff" }}>
      <Header
        toggleAddEventModal={toggleAddEventModal}
        event="calendar"
        navigation={navigation}
        title="Events"
      />
      <MyCalendar toggleEditEventModal={toggleEditEventModal} />
      {isAddEventVisible && (
        <AddEvent 
          onClose={toggleAddEventModal}
          defaultTitle={defaultEventTitle}
          relatedMessageId={relatedMessageId}
        />
      )}
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