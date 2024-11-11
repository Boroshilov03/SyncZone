import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Button,
  Modal,
} from "react-native";
import { supabase } from "../lib/supabase";
import DateTimePicker from "@react-native-community/datetimepicker";
import useStore from "../store/store";
import DeleteEvent from "../components/DeleteEvent";
import AddParticipants from "./AddParticipants";


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

const parseTimeString = (timeString) => {
  // Log the input time string
  console.log(`Input time string: ${timeString}`);

  const [time, modifier] = timeString.split(" ");

  // Log the extracted time and modifier
  console.log(`Time: ${time}, Modifier: ${modifier}`);

  let [hours, minutes] = time.split(":");
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10);

  // Log parsed hours and minutes
  console.log(`Parsed hours: ${hours}, Parsed minutes: ${minutes}`);

  // Adjust hours based on AM/PM
  if (modifier === "PM" && hours < 12) {
    hours += 12; // Convert PM to 24-hour format
  } else if (modifier === "AM" && hours === 12) {
    hours = 0; // Convert 12 AM to 0 hours
  }

  // Log the final hours after modification
  console.log(`Final hours after modification: ${hours}`);

  const date = new Date();
  date.setHours(hours, minutes, 0, 0); // Set the date to the current date
  return date;
};

const handleTimeChange = (event, selectedTime, setTime) => {
  if (selectedTime) {
    const currentTime = selectedTime;

    // Manually format time with AM/PM
    const formattedTime = currentTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    console.log("Selected time:", formattedTime);

    // Update the state with the selected time
    setTime(currentTime);
  }
};

const EditEvent = ({ event, onClose }) => {
  console.log(event);
  const { user } = useStore();
  const [titleValue, settitleValue] = useState(event.title); // Title

  console.log(event.date);
  const [showDatePicker, setShowDatePicker] = useState(false); // Toggle date picker

  // Use existing times from the event
  const initialStartTime = event.startTime
    ? parseTimeString(event.startTime)
    : new Date();
  const initialEndTime = event.endTime
    ? parseTimeString(event.endTime)
    : new Date();

  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [date, setDate] = useState(() => {
    const initialDate = new Date(event.date);
    initialDate.setDate(initialDate.getDate() + 1); // Increment by one day
    return initialDate;
  });
  console.log(date);

  // Now you can format the date
  const formattedDate = date.toISOString().split("T")[0]; // Formats as YYYY-MM-DD
  const [showStartTimePicker, setShowStartTimePicker] = useState(false); // State to show start time picker
  const [showEndTimePicker, setShowEndTimePicker] = useState(false); // State to show end time picker
  const [description, setDescription] = useState(event.description); // Description
  const [participants, setparticipants] = useState([]); // Selected participants
  const [newMember, setNewMember] = useState(""); // Input for new member
  const [mood, setMood] = useState(event.mood); // Selected mood
  const [deletePopupVisible, setDeletePopupVisible] = useState(false); // Controls visibility of DeleteEvent

  const handleEditEvent = async () => {
    // Function to format date as YYYY-MM-DD
    const formatDateForSubmission = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`; // Format: YYYY-MM-DD
    };

    // Function to format time as HH:mm:ss
    const formatTimeForSubmission = (date) => {
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return `${hours}:${minutes}:${seconds}`; // Format: HH:mm:ss
    };

    // Formatting the start and end times
    const formattedStartTime = formatTimeForSubmission(startTime);
    const formattedEndTime = formatTimeForSubmission(endTime);

    try {
      console.log(
        titleValue,
        formatDateForSubmission(date), // Ensure the date is formatted
        formattedStartTime,
        formattedEndTime,
        description,
        mood
      );

      // Update the event in the database
      const { data, error } = await supabase
        .from("event")
        .update({
          title: titleValue,
          date: formatDateForSubmission(date), // Format the date for submission
          start_time: formattedStartTime,
          end_time: formattedEndTime,
          description: description,
          mood: mood,
        })
        .eq("id", event.id)
        .select();

      // Check for errors
      if (error) {
        console.error("Error updating event:", error.message);
      } else {
        console.log("Event updated successfully:", data);
        onClose();
      }
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const onDateChange = (event, selectedDate) => {
    // Close the picker when a date is selected or if dismissed
    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate); // Update the date
    }
    setShowDatePicker(false); // Close the picker in all cases
  };

  const EditEventParticipants = async () => {
    try {
      // First, delete all existing participants for the event
      const { error: deleteError } = await supabase
        .from("event_participants")
        .delete()
        .eq("event_id", event.id);

      if (deleteError) {
        console.error("Error deleting old participants:", deleteError.message);
        return;
      }

      // Then, add the new participants
      for (let participantId of participants) {
        const { data, error } = await supabase
          .from("event_participants")
          .insert({ user_id: participantId, event_id: event.id });

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
      console.error("Error updating participants:", error);
    }
  };

  const predefinedPFPs = [
    require("../../assets/icons/pfp1.png"),
    require("../../assets/icons/pfp2.jpg"),
    require("../../assets/icons/pfp3.webp"),
    require("../../assets/icons/add_person.png"),
  ];

  const handleTrashIconPress = () => {
    setDeletePopupVisible(true); // Show DeleteEvent popup
  };

  const handleDeleteEvent = async () => {
    const { error } = await supabase.from("event").delete().eq("id", event.id);
    console.log("Event Deleted:", event.id);
    setDeletePopupVisible(false); // Close delete popup
    onClose(); // Close EditEvent view
  };

  const handleCloseDeletePopup = () => {
    setDeletePopupVisible(false); // Close the popup without deleting the event
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        {/* Title Container */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Edit Event</Text>
        </View>

        {/* Trash Icon */}
        <TouchableOpacity
          style={styles.trashIconContainer}
          onPress={handleTrashIconPress} // Handle trash icon press
        >
          <Image
            source={require("../../assets/icons/trash_icon.png")}
            style={[styles.trashIcon]}
          />
        </TouchableOpacity>

        {/* Conditionally render the DeleteEvent component */}
        {deletePopupVisible && (
          <DeleteEvent
            visible={deletePopupVisible}
            onClose={handleCloseDeletePopup} // Close without deletion
            onConfirm={handleDeleteEvent} // Delete and close popup
            eventID={event.id}
          />
        )}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Event Title"
          value={titleValue}
          onChangeText={settitleValue}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Date: </Text>
        <Image
          source={require("../../assets/icons/date_icon.png")} 
          style={styles.dateIcon} 
        />
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <Text>{date.toLocaleDateString()}</Text> 
        </TouchableOpacity>
        {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date} // Use the date state
          mode="date"
          display="calendar"
          onChange={onDateChange} // Handles date changes
        />
        )}
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
                hour12: true, // Force 12-hour format with AM/PM
              })}
            </Text>
          </TouchableOpacity>
        </View>
        {showStartTimePicker && (
          <DateTimePicker
            testID="startTimePicker"
            value={startTime}
            mode="time"
            is24Hour={false}
            display="spinner"
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
                hour12: true, // Force 12-hour format with AM/PM
              })}
            </Text>
          </TouchableOpacity>
        </View>
        {showEndTimePicker && (
          <DateTimePicker
            testID="endTimePicker"
            value={endTime}
            mode="time"
            is24Hour={false}
            display="spinner"
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
        <TouchableOpacity onPress={handleEditEvent} style={styles.addButton}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: "22%",
    alignSelf: 'center',
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
    zIndex: 5,
  },
  headerContainer: {
    width: "100%",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    zIndex: 5,

  },

  titleContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    left: 0,
    right: 0,
  },
  trashIconContainer: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: [{ translateY: -16 }],
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    flex: 1,
  },
  trashIcon: {
    width: 20,
    height: 20,
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
    marginRight: 5,
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
    marginLeft: 15,
    marginRight: 0,
    zIndex: 0,
    alignSelf: "center",
  },
});

export default EditEvent;