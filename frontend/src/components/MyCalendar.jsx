import React, { useState } from "react";
import { Calendar } from "react-native-calendars";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";

const MyCalendar = () => {
  const [selected, setSelected] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your Calendar</Text>
      <Calendar
        style={styles.calendar}
        theme={{
          backgroundColor: "#ffffff",
          calendarBackground: "#ffffff",
          textSectionTitleColor: "#b6c1cd",
          selectedDayBackgroundColor: "#A7C7E7", 
          selectedDayTextColor: "#ffffff",
          todayTextColor: "#00BFFF", 
          dayTextColor: "#2d4150",
          textDisabledColor: "#d9e1e8",
          dotColor: "#A7C7E7",
          selectedDotColor: "#ffffff",
          arrowColor: "#859FB9",
          disabledArrowColor: "#d9e1e8",
          monthTextColor: "#A7C7E7",
          indicatorColor: "#A7C7E7",
          textDayFontFamily: "monospace",
          textMonthFontFamily: "monospace",
          textDayHeaderFontFamily: "monospace",
          textDayFontWeight: "300",
          textMonthFontWeight: "bold",
          textDayHeaderFontWeight: "300",
          textDayFontSize: 16,
          textMonthFontSize: 20,
          textDayHeaderFontSize: 14,
          todayTextStyle: {
            fontWeight: "bold",
            textShadowColor: "#red",
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 10, 
            textShadowOpacity: 1, 
          },
          
        }}
        onDayPress={(day) => {
          setSelected(day.dateString);
        }}
        markedDates={{
          [selected]: {
            selected: true,
            disableTouchEvent: true,
          },
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
  calendar: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    height: 350,
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#fff",
    shadowColor: "#E0E0E0", 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 5, 
    elevation: 3,
  },
});


export default MyCalendar;