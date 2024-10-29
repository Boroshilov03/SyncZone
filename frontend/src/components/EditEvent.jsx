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
} from "react-native";
import { supabase } from "../lib/supabase";
import DateTimePicker from "@react-native-community/datetimepicker";
import useStore from "../store/store";
import DeleteEvent from "../components/DeleteEvent";


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
  const [time, modifier] = timeString.split(" ");
  let [hours, minutes] = time.split(":");
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10);

  if (modifier === "PM" && hours < 12) {
    hours += 12;
  }
  if (modifier === "AM" && hours === 12) {
    hours = 0;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
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
  const [date, setDate] = useState(new Date());


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


  const [showStartTimePicker, setShowStartTimePicker] = useState(false); // State to show start time picker
  const [showEndTimePicker, setShowEndTimePicker] = useState(false); // State to show end time picker
  const [description, setDescription] = useState(event.description); // Description
  const [participants, setparticipants] = useState([]); // Selected participants
  const [newMember, setNewMember] = useState(""); // Input for new member
  const [mood, setMood] = useState(event.mood); // Selected mood
  const [deletePopupVisible, setDeletePopupVisible] = useState(false); // Controls visibility of DeleteEvent

  const handleEditEvent = async () => {
    const formatTime = (date) => {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true, // Set to true to get 12-hour format
      });
    };

    const formattedStartTime = formatTime(startTime);
    const formattedEndTime = formatTime(endTime);

    try {
      const { data, error } = await supabase
        .from("event")
        .update({
          title: titleValue,
          date: date.toISOString().split("T")[0],
          start_time: formattedStartTime,
          end_time: formattedEndTime,
          description,
          mood,
        })
        .eq("id", event.id);

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
    // Check if a valid date is selected
    if (selectedDate) {
      // Create a new Date object and prevent timezone changes
      const localDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      setDate(localDate); // Set the date without any timezone adjustments
    }
    setShowDatePicker(false); // Close the picker after selecting
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

      {/* <View style={styles.row}>
        <Text style={styles.label}>Date: </Text>
        <Image
          source={require("../../assets/icons/date_icon.png")} // Adjust the path to your date icon
          style={styles.dateIcon} // Add styling for the icon
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
      </View> */}

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
                hour12: true,  // Force 12-hour format with AM/PM
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
                hour12: true,  // Force 12-hour format with AM/PM
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
  headerContainer: {
    width: "100%",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
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

export default EditEvent;
