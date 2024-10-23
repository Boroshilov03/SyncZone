import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  ExpandableCalendar,
  AgendaList,
  CalendarProvider,
} from "react-native-calendars";
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from "react-native";
import { supabase } from "../lib/supabase";
import useStore from "../store/store";

const MyExpandableCalendar = ({ toggleEditEventModal }) => {
  const [selected, setSelected] = useState("");
  const [agendaItems, setAgendaItems] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [allEvents, setAllEvents] = useState([]);

  const { user } = useStore();
  const currentDate = new Date().toISOString().split("T")[0];
  const theme = useRef({
    todayButtonTextColor: "#1E90FF",
    selectedDayBackgroundColor: "#A7C7E7",
    dotColor: "pink",
  });

  // Fetch event data
  const fetchingData = async () => {
    try {
      const { data: eventData, error: eventError } = await supabase
        .from("event_participants")
        .select("event_id")
        .eq("user_id", user.id);

      if (eventError) {
        console.error("Error fetching event IDs:", eventError);
        return;
      }

      const eventIds = eventData ? eventData.map((event) => event.event_id) : [];
      if (eventIds.length === 0) {
        console.warn("No event IDs found for the user.");
        setAgendaItems([]); // Clear agenda items if no event IDs
        return;
      }

      const { data, error } = await supabase
        .from("event")
        .select("*")
        .in("id", eventIds);

      if (error) {
        console.error("Error fetching event data:", error);
        return;
      }

      if (!data || data.length === 0) {
        console.warn("No event data found for the specified event IDs.");
        setAgendaItems([]); // Clear agenda items if no event data
        return;
      }

      setAllEvents(data);
      // Group events by date
      const groupedAgendaItems = data.reduce((acc, event) => {
        const eventDate = event.date;
        const eventItem = {
          title: event.title,
          time: new Date(
            `${event.date}T${event.start_time}`
          ).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          endTime: new Date(
            `${event.date}T${event.end_time}`
          ).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          mood: event.mood,
          description: event.description,
          id: event.id,
        };

        // If the date doesn't exist in the accumulator, create it
        if (!acc[eventDate]) {
          acc[eventDate] = {
            title: eventDate, // Set the date as the title
            data: [eventItem], // Start the data array with the current event
          };
        } else {
          // Otherwise, push the event item into the existing date's data array
          acc[eventDate].data.push(eventItem);
        }

        return acc;
      }, {});

      // Convert the object back into an array
      const sortedAgendaItems = Object.values(groupedAgendaItems).sort(
        (a, b) => new Date(a.title) - new Date(b.title)
      );

      setAgendaItems(sortedAgendaItems);

      // Create marked dates with mood dots
      const markedDatesObj = {};
      sortedAgendaItems.forEach((item) => {
        const date = item.title;
        const moodDotColor = getMoodColor(item.data[0].mood);

        if (!markedDatesObj[date]) {
          markedDatesObj[date] = {
            dots: [],
          };
        }
        markedDatesObj[date].dots.push({ color: moodDotColor });
      });

      setMarkedDates(markedDatesObj);
    } catch (error) {
      console.error("Error during data fetching:", error);
    }
  };

  const getMoodColor = (mood) => {
    switch (mood) {
      case "blue":
        return "#E3F2FD";
      case "purple":
        return "#F3E5F5";
      case "pink":
        return "#FDE0E1";
      case "green":
        return "#DCEDC8";
      case "yellow":
        return "#FFFDE7";
      default:
        return "#E3F2FD";
    }
  };

  useEffect(() => {
    fetchingData();
  }, [user.id]);

  const renderAgendaItem = useCallback(({ item }) => {
    if (!item) {
      return null; // Prevent rendering if item is undefined
    }
    return (
      <View style={styles.agendaItemContainer}>
        <View
          style={[
            styles.agendaItem,
            { backgroundColor: getMoodColor(item.mood) },
          ]}
        >
          <View style={{ display: "flex", flexDirection: "row" }}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <View style={styles.timeContainer}>
              <Text style={styles.itemTime}>
                ({item.time} - {item.endTime})
              </Text>
            </View>
          </View>
          <Text style={styles.itemDescription}>{item.description}</Text>
          <TouchableOpacity
            style={styles.pencilIconContainer}
            onPress={() => toggleEditEventModal(item)}
          >
            <Image
              source={require("../../assets/icons/pencil_icon.png")}
              style={styles.pencilIcon}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <CalendarProvider
        date={currentDate}
        showTodayButton
        theme={theme.current}
      >
        <ExpandableCalendar
          onDayPress={(day) => setSelected(day.dateString)}
          markedDates={markedDates}
          firstDay={1}
          theme={{
            selectedDayBackgroundColor: "#A7C7E7",
            todayTextColor: "#1E90FF",
            dayTextColor: "#333",
            monthTextColor: "#000",
            arrowColor: "#1E90FF",
            dotColor: "#1E90FF",
          }}
        />
        <AgendaList
          sections={agendaItems} // Use agendaItems here
          renderItem={renderAgendaItem}
          sectionStyle={styles.section}
          contentContainerStyle={{ paddingBottom: 50 }} // Added bottom padding here
        />
      </CalendarProvider>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  agendaItemContainer: {
    marginVertical: 5,
    paddingHorizontal: 10,
  },
  agendaItem: {
    padding: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "semibold",
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemTime: {
    fontSize: 14,
    color: "gray",
  },
  itemDescription: {
    fontSize: 14,
    color: "#333",
    marginVertical: 4,
  },
  pencilIconContainer: {
    position: "absolute",
    right: 10,
    top: 10,
  },
  pencilIcon: {
    width: 20,
    height: 20,
  },
  section: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 10,
    fontSize: 18,
  },
});

export default MyExpandableCalendar;
