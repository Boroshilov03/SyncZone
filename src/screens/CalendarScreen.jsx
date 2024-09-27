import { SafeAreaView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import MyCalendar from "../components/MyCalendar";
import AddEvent from "../components/AddEvent";
import ListEvent from "../components/ListEvent";

const CalendarScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <MyCalendar />
      <ListEvent/>
      {/* <AddEvent /> */}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
});


export default CalendarScreen