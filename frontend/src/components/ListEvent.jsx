import { View, Text, ScrollView, StyleSheet, Image } from "react-native";
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import useStore from "../store/store";

const ListEvent = () => {
  const [allEvents, setAllEvents] = useState([]);
  const { user } = useStore();

  // Fetch events from the database
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

      const eventIds = eventData.map((event) => event.event_id);

      // Fetch the event details using the event IDs
      const { data, error } = await supabase
        .from("event")
        .select("*")
        .in("id", eventIds);

      if (error) {
        console.error("Error fetching event data:", error);
      } else {
        console.log("Fetched event data:", data);
        setAllEvents(data);
      }
    } catch (error) {
      console.error("Error during data fetching:", error);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchingData(); // Initial fetch

    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_participants",
        },
        (payload) => {
          console.log(
            "Real-time event change detected in participants:",
            payload
          );
          fetchingData(); // Re-fetch data on change
        }
      )
      .subscribe();

    const eventChannel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event",
        },
        (payload) => {
          console.log("Real-time event change detected in events:", payload);
          fetchingData(); // Re-fetch data on change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(eventChannel);
    };
  }, [user.id]); // Listen for changes in user.id

  const formatDateTime = (date, time) => {
    return new Date(`${date}T${time}`);
  };

  return (
    <ScrollView>
      {allEvents.map((event) => {
        const startDateTime = formatDateTime(event.date, event.start_time);
        const endDateTime = formatDateTime(event.date, event.end_time);

        return (
          <View
            key={event.id}
            style={[
              styles.container,
              { backgroundColor: getMoodColor(event.mood) },
            ]}
          >
            <View style={styles.row}>
              <View style={styles.imageContainer}>
                <Text style={styles.monthText}>
                  {startDateTime.toLocaleString(undefined, { month: "short" })}
                </Text>
                <Text style={styles.overlayText}>
                  {startDateTime.toLocaleString(undefined, { day: "numeric" })}
                </Text>
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.title}>{event.title}</Text>
                <Text style={styles.timeText}>
                  (
                  {startDateTime.toLocaleString(undefined, {
                    hour: "numeric",
                    minute: "numeric",
                    hour12: true,
                  })}{" "}
                  -{" "}
                  {endDateTime.toLocaleString(undefined, {
                    hour: "numeric",
                    minute: "numeric",
                    hour12: true,
                  })}
                  )
                </Text>
              </View>
            </View>
            <View style={styles.pencilIconContainer}>
              <Image
                source={require("../../assets/icons/pencil_icon.png")}
                style={styles.pencilIcon}
              />
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const getMoodColor = (mood) => {
  switch (mood) {
    case "yellow":
      return "#FFFDE7"; // Softer Pastel Yellow
    case "green":
      return "#DCEDC8"; // Softer Pastel Green
    case "pink":
      return "#FDE0E1"; // Sakura Pink
    case "purple":
      return "#F3E5F5"; // Softer Pastel Purple
    case "blue":
      return "#E3F2FD"; // Softer Pastel Blue
    default:
      return "#FFFFFF"; // Default color if mood is not recognized
  }
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 10,
    borderRadius: 20,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    position: "relative",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageContainer: {
    position: "relative",
    width: 80,
    height: 45,
  },
  monthText: {
    position: "absolute",
    top: "89%",
    left: "50%",
    transform: [{ translateX: -55 }, { translateY: -40 }],
    color: "black",
    fontWeight: "300",
    fontSize: 22,
    textAlign: "center",
    width: "100%",
  },
  overlayText: {
    position: "absolute",
    top: "60%",
    left: "50%",
    transform: [{ translateX: -55 }, { translateY: -7 }],
    color: "black",
    fontWeight: "300",
    fontSize: 25,
    textAlign: "center",
    width: "100%",
  },
  pencilIconContainer: {
    position: "absolute",
    bottom: 10,
    right: 10,
  },
  pencilIcon: {
    width: 17,
    height: 17,
  },
  title: {
    fontWeight: "bold",
    fontSize: 18,
    marginLeft: 10,
  },
  timeText: {
    fontSize: 14,
    color: "grey",
    marginLeft: 10,
  },
  textContainer: {
    flex: 1,
  },
});

export default ListEvent;
