import { SafeAreaView, StyleSheet } from "react-native";
import React, { useState } from "react";
import MyCalendar from "../components/MyCalendar";
import AddEvent from "../components/AddEvent";
import ListEvent from "../components/ListEvent";
import Header from "../components/Header";

const CalendarScreen = ({ navigation }) => {
  const [isAddEventVisible, setAddEventVisible] = useState(false);

  const toggleAddEventModal = () => {
    setAddEventVisible(!isAddEventVisible); // Toggles modal visibility
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
      <ListEvent />
      {isAddEventVisible && <AddEvent onClose={toggleAddEventModal} />}
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
