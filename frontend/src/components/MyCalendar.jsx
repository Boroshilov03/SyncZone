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
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Fetch event data function
const fetchingData = async (userId) => {
  try {
    const { data: eventData, error: eventError } = await supabase
      .from("event_participants")
      .select("event_id")
      .eq("user_id", userId);

    if (eventError) throw new Error(eventError.message);

    const eventIds = eventData ? eventData.map((event) => event.event_id) : [];
    if (eventIds.length === 0) {
      console.warn("No event IDs found for the user.");
      return [];
    }

    const { data, error } = await supabase
      .from("event")
      .select("*")
      .in("id", eventIds);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
      console.warn("No event data found for the specified event IDs.");
      return [];
    }

    return data;
  } catch (error) {
    console.error("Error during data fetching:", error);
    return [];
  }
};

const MyExpandableCalendar = ({ toggleEditEventModal }) => {
  const [selected, setSelected] = useState("");
  const [agendaItems, setAgendaItems] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const queryClient = useQueryClient();
  const { user } = useStore();
  const currentDate = new Date().toISOString().split("T")[0];
  const theme = useRef({
    todayButtonTextColor: "#1E90FF",
    selectedDayBackgroundColor: "#A7C7E7",
    dotColor: "pink",
  });

  const {
    data: events = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ["recentEvents", user.id],
    queryFn: () => fetchingData(user.id),
    enabled: !!user.id,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (events.length) {
      // Group events by date
      const groupedAgendaItems = events.reduce((acc, event) => {
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

      // Convert the object back into an array and sort
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
    }
  }, [events]);

  useEffect(() => {
    if (!user.id) return;

    const channel = supabase
      .channel("event-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event" },
        (payload) => {
          console.log("New change in events table:", payload);
          queryClient.invalidateQueries(["recentEvents", user.id]);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_participants" },
        (payload) => {
          console.log("New change in event_participants table:", payload);
          queryClient.invalidateQueries(["recentEvents", user.id]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user.id, queryClient]);

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
          sections={agendaItems}
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
    fontSize: 20,
    fontWeight: "600", // Changed from 'semibold' to '600' for compatibility
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center", 
  },
  itemTime: {
    fontSize: 14,
    color: "gray",
    marginLeft: 5,
  },
  itemDescription: {
    fontSize: 14,
    color: "#333",
    marginTop: 5,
  },
  pencilIconContainer: {
    position: "absolute", // Change to absolute positioning
    top: 10, // Adjust as necessary
    right: 10, // Adjust as necessary
  },
  pencilIcon: {
    width: 20,
    height: 20,
  },
});

export default MyExpandableCalendar;
