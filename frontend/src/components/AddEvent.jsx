import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Button,
  Platform,
} from "react-native";
import { supabase } from "../lib/supabase";
import DateTimePicker from "@react-native-community/datetimepicker";
import useStore from "../store/store";

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

const AddEvent = ({ onClose }) => {
  const { user } = useStore();
  const [titleValue, settitleValue] = useState(""); // Title
  const [date, setDate] = useState(new Date()); // Date
  const [showPicker, setShowPicker] = useState(false); // State to manage visibility
  const [showDatePicker, setShowDatePicker] = useState(false); // Toggle date picker
  const [startTime, setStartTime] = useState(new Date()); // Start time state
  const [endTime, setEndTime] = useState(new Date()); // End time state
  const [showStartTimePicker, setShowStartTimePicker] = useState(false); // State to show start time picker
  const [showEndTimePicker, setShowEndTimePicker] = useState(false); // State to show end time picker
  const [description, setDescription] = useState(""); // Description
  const [participants, setparticipants] = useState([user.id]); // Selected participants
  const [newMember, setNewMember] = useState(""); // Input for new member
  const [mood, setMood] = useState(null); // Selected mood

  const handleAddEvent = async () => {
    const formatTime = (date) => {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    };

    const formattedStartTime = formatTime(startTime);
    const formattedEndTime = formatTime(endTime);

    console.log({
      titleValue,
      date,
      startTime: formattedStartTime,
      endTime: formattedEndTime,
      description,
      participants,
      mood,
    });

    try {
      const { data, error } = await supabase
        .from("event")
        .insert([
          {
            title: titleValue,
            date,
            start_time: formattedStartTime,
            end_time: formattedEndTime,
            description,
            mood,
          },
        ])
        .select();

      if (error) {
        console.error(error.message);
      } else {
        settitleValue("");
        setDescription("");
        setMood(null);
        onClose();
        console.log(data);

        // Get the event ID from the inserted data and add participants
        const eventID = data[0].id;
        await addEventParticipants(eventID);
      }
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  const addEventParticipants = async (eventID) => {
    try {
      // Iterate over the participants array
      for (let participantId of participants) {
        const { data, error } = await supabase
          .from("event_participants")
          .insert({ user_id: participantId, event_id: eventID })
          .select();

        if (error) {
          console.error(
            `Error adding participant ${participantId}:`,
            error.message
          );
        } else {
          console.log(`Participant ${participantId} added successfully:`, data);
        }
      }
    } catch (error) {
      console.error("Error adding participants:", error);
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowPicker(Platform.OS === "ios"); // Keep picker open for iOS only
    setDate(currentDate); // Set the selected date
  };

  const predefinedPFPs = [
    require("../../assets/icons/pfp1.png"),
    require("../../assets/icons/pfp2.jpg"),
    require("../../assets/icons/pfp3.webp"),
    require("../../assets/icons/add_person.png"),
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Event</Text>

      <TextInput
        style={styles.input}
        placeholder="Event Title"
        value={titleValue}
        onChangeText={settitleValue}
      />

      <View style={styles.row}>
        <Text style={styles.label}>Date: </Text>
        <TouchableOpacity onPress={showDatePicker}>
          <Image
            source={require("../../assets/icons/date_icon.png")} // Adjust the path to your date icon
            style={styles.dateIcon} // Add styling for the icon
          />
        </TouchableOpacity>
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode="date"
          display="calendar" // Opens directly in calendar view
          onChange={onDateChange} // Handles date changes
        />
      </View>

      {/* Start Time */}
      <View style={styles.column}>
        <View style={styles.row}>
          <Text style={styles.label}>Start Time:</Text>
          <TouchableOpacity
            onPress={() => setShowStartTimePicker(!showStartTimePicker)}
            style={styles.timeContainer}
          >
            <Image
              source={require("../../assets/icons/time_icon.webp")} // Add your time icon path
              style={styles.timeIcon}
            />
            <Text style={styles.value}>
              {startTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </TouchableOpacity>
        </View>
        {showStartTimePicker && (
          <DateTimePicker
            testID="startTimePicker"
            value={startTime} // Pass the time state
            mode="time" // Make sure the mode is set to "time"
            is24Hour={false} // Set to false for 12-hour format or true for 24-hour format
            display="spinner" // Optional display style
            onChange={(event, selectedTime) => {
              const currentTime = selectedTime || startTime;
              setShowStartTimePicker(false);
              setStartTime(currentTime);
            }}
          />
        )}
      </View>

      {/* End Time */}
      <View style={styles.column}>
        <View style={styles.row}>
          <Text style={styles.label}>End Time: </Text>
          <TouchableOpacity
            onPress={() => setShowEndTimePicker(!showEndTimePicker)}
            style={styles.timeContainer}
          >
            <Image
              source={require("../../assets/icons/time_icon.webp")} // Add your time icon path
              style={styles.timeIcon}
            />
            <Text style={styles.value}>
              {endTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </TouchableOpacity>
        </View>
        {showEndTimePicker && (
          <DateTimePicker
            testID="endTimePicker"
            value={endTime} // Pass the time state
            mode="time" // Make sure the mode is set to "time"
            is24Hour={false} // Set to false for 12-hour format or true for 24-hour format
            display="spinner" // Optional display style
            onChange={(event, selectedTime) => {
              const currentTime = selectedTime || endTime;
              setShowEndTimePicker(false);
              setEndTime(currentTime);
            }}
          />
        )}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />

      <View style={styles.row}>
        <Text style={styles.label}>Participants:</Text>

        <View style={styles.pfpContainer}>
          <FlatList
            data={predefinedPFPs}
            renderItem={({ item }) => {
              const isAddPersonIcon =
                item === require("../../assets/icons/add_person.png");

              return (
                <Image
                  source={item}
                  style={[
                    styles.pfpImage,
                    isAddPersonIcon && styles.addPersonIcon, // Apply specific styling for 'add_person.png'
                  ]}
                />
              );
            }}
            keyExtractor={(item, index) => index.toString()}
            horizontal
          />
        </View>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Mood:</Text>
        {["blue", "purple", "pink", "green", "yellow"].map((moodName) => (
          <TouchableOpacity
            key={moodName}
            style={[
              styles.moodCircle,
              { backgroundColor: getMoodColor(moodName) },
            ]}
            onPress={() => setMood(moodName)}
          >
            {mood === moodName && (
              <Image
                source={require("../../assets/icons/check_icon.png")}
                style={styles.checkIcon}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAddEvent} style={styles.addButton}>
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -155 }, { translateY: -175 }],
    width: "80%",
    maxWidth: 400,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: "grey",
    borderWidth: 1,
    paddingLeft: 10,
    marginBottom: 20,
    borderRadius: 5,
    backgroundColor: "#fff",
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  participantsContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  memberImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  moodContainer: {
    flexDirection: "row",
    marginBottom: 20,
    marginTop: 10,
    alignItems: "center",
  },
  moodCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginLeft: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  checkIcon: {
    width: 25,
    height: 25,
    position: "absolute",
    top: 2,
    left: 2,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginTop: 20,
  },

  cancelButton: {
    backgroundColor: "#FFABAB",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    marginRight: 15,
  },
  addButton: {
    backgroundColor: "#A0D1E5",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
  },
  value: {
    fontSize: 16,
    marginLeft: 8,
  },
  dateIcon: {
    width: 20,
    height: 20,
    marginLeft: 5,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  timeIcon: {
    width: 20,
    height: 20,
  },
  pfpContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
  },
  pfpImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: -10,
    zIndex: 1,
  },
  addPersonIcon: {
    width: 20,
    height: 20,
    marginRight: -5,
    marginLeft: 15,
    zIndex: 0,
    alignSelf: "center",
  },
});

export default AddEvent;
