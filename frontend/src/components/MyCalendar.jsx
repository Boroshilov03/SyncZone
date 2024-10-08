import React, { useState } from "react";
import { Calendar } from "react-native-calendars";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";

const MyCalendar = () => {
  const [selected, setSelected] = useState("");

  // Get the current date in YYYY-MM-DD format
  const currentDate = new Date().toISOString().split("T")[0];

  return (
    <SafeAreaView style={styles.container}>
      {/* <Text style={styles.title}>Your Events</Text> */}
      <Calendar
        style={styles.calendar}
        onDayPress={(day) => {
          setSelected(day.dateString);
        }}
        markingType={"dot"}
        markedDates={{
          [currentDate]: {
            marked: true, // Apply a dot under today's date
            dotColor: "pink", // Custom dot color for today
          },
          [selected]: {
            selected: true,
            disableTouchEvent: true,
            selectedColor: "#A7C7E7",
          },
          "2024-09-14": { marked: true, dotColor: "purple", activeOpacity: 0 },
          "2024-09-15": { marked: true, dotColor: "blue", activeOpacity: 0 },
          "2024-09-26": { marked: true, dotColor: "red", activeOpacity: 0 },
          "2024-09-27": { marked: true, dotColor: "green", activeOpacity: 0 },
          "2024-09-28": { marked: true, dotColor: "yellow", activeOpacity: 0 },
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  // calendar: {
  //   borderWidth: 1,
  //   borderColor: "#E0E0E0",
  //   borderRadius: 10,
  //   height: 350,
  //   marginBottom: 5,
  //   padding: 10,
  //   backgroundColor: "#fff",
  //   shadowColor: "#E0E0E0",
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 1,
  //   shadowRadius: 5,
  //   elevation: 3,
  // },
});

export default MyCalendar;
