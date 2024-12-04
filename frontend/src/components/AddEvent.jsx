import React, { useEffect, useState } from "react";
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
  Modal,
} from "react-native";
import { supabase } from "../lib/supabase";
import DateTimePicker from "@react-native-community/datetimepicker";
import useStore from "../store/store";
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

const AddEvent = ({ onClose }) => {
  const { user } = useStore();
  const [titleValue, settitleValue] = useState(""); // Title
  const [date, setDate] = useState(new Date()); // Date
  const [showDatePicker, setShowDatePicker] = useState(false); // Toggle date picker
  const [startTime, setStartTime] = useState(new Date()); // Start time state
  const [endTime, setEndTime] = useState(new Date()); // End time state
  const [showStartTimePicker, setShowStartTimePicker] = useState(false); // State to show start time picker
  const [showEndTimePicker, setShowEndTimePicker] = useState(false); // State to show end time picker
  const [description, setDescription] = useState(""); // Description
  const [selectedContacts, setSelectedContacts] = useState(); // Initialize as an empty array
  const [mood, setMood] = useState(null); // Selected mood
  const [modalVisible, setModalVisible] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");  // The date state
  const [titleError, setTitleError] = useState(""); // Title validation error


  useEffect(() => {
    const fetchContacts = async () => {
      if (selectedContacts.length === 0) return;
      try {
        // Fetch contacts from "profiles" table by user_id
        const { data, error } = await supabase
          .from("profiles")
          .select("id, first_name, avatar_url")
          .in("id", selectedContacts)
          .neq("id", user.id);
        if (error) {
          console.error("Error fetching contacts:", error.message);
        } else {
          setContacts(data); // Store the contacts with avatar_url
        }
      } catch (error) {
        console.error("Error fetching contacts:", error);
      }
    };

    fetchContacts();
  }, [selectedContacts]); // Trigger whenever selectedContacts changes


  const handleDateChange = (date) => {
    setSelectedDate(date);  // Update the selected date when user selects a date
  };
  
  const handleSubmit = () => {
    const formattedDate = formatDateForDB(selectedDate);  // Process the date
  
    // Save the event details, including the formatted date
    const newEvent = {
      title: eventTitle,
      date: formattedDate,  // The formatted date will be saved here
      description: eventDescription,
      // other event details...
    };
  
    // Save the event, possibly with an API call or local storage
    saveEventToDB(newEvent);
  };
  
  const handleAddEvent = async () => {
        // Title validation
        if (titleValue.trim() === "") {
          setTitleError("Title is required.");
          return;
        } else if (titleValue.length > 20) {
          setTitleError("Title cannot exceed 20 characters.");
          return;
        } else {
          setTitleError(""); // Clear error if valid
        }
    const formatDateForDB = (date) => {
      const adjustedDate = new Date(date);
      adjustedDate.setDate(adjustedDate.getDate() - 1);
      adjustedDate.setMinutes(adjustedDate.getMinutes() - adjustedDate.getTimezoneOffset());
      return adjustedDate.toISOString(); // Return as ISO string for consistency
    };
  
    const formatTime = (date) => {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    };

    const formattedDate = formatDateForDB(date);
    const formattedStartTime = formatTime(startTime);
    const formattedEndTime = formatTime(endTime);

    // console.log({
    //   titleValue,
    //   date,
    //   startTime: formattedStartTime,
    //   endTime: formattedEndTime,
    //   description,
    //   selectedContacts,
    //   mood,
    // });

     // Check time constraint: startTime must be before endTime
  if (startTime >= endTime) {
    alert("Start time must be before end time."); // Alert the user about the invalid time
    return; // Prevent submitting the event if time is invalid
  }

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

        // Get the event ID from the inserted data and add selectedContacts
        const eventID = data[0].id;
        await addEventParticipants(eventID);
      }
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  const addEventParticipants = async (eventID) => {
    try {
      // Ensure selectedContacts is initialized as an empty array if it's undefined
      const participants = selectedContacts || [];
  
      // Ensure the current user (self) is always included in selectedContacts
      const participantsToAdd = participants.includes(user.id)
        ? participants
        : [...participants, user.id]; // Add user.id if it's not already included
  
      // Iterate over the participants array to add each participant
      for (let participantId of participantsToAdd) {
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
      console.error("Error adding selectedContacts:", error);
    }
  };
  
  
  const onDateChange = (event, selectedDate) => {
    // Close the picker when a date is selected or if dismissed
    if (event.type === "set" && selectedDate) {
      setDate(selectedDate); // Update the date
    }
    setShowDatePicker(false); // Close the picker in all cases
  };

  const predefinedPFPs = [require("../../assets/icons/add_person.png")];

  const handleModalClose = (contacts) => {
    setSelectedContacts(contacts); // Save the selected contacts
    setModalVisible(false); // Close the modal
  };

  return (
    <View style={styles.container}>
    <Text style={styles.title}>New Event</Text>
  
    {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}
  
    <TextInput
      style={[
        styles.input,
        titleError ? styles.inputError : null, // Red border on error
      ]}
      placeholder="Event Title"
      value={titleValue}
      onChangeText={(text) => settitleValue(text)} // Track changes but validate on submission
    />

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
            value={date}
            mode="date"
            display="calendar"
            onChange={onDateChange}
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
              source={require("../../assets/icons/time_icon.webp")}
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
            value={startTime}
            mode="time"
            is24Hour={false}
            display="spinner"
            onChange={(event, selectedTime) => {
              const currentTime = selectedTime || startTime;
              setStartTime(currentTime);
              setShowStartTimePicker(false);
            }}
          />
        )}
      </View>

      {/* End Time */}
      <View style={styles.column}>
        <View style={styles.row}>
          <Text style={styles.label}>End Time:</Text>
          <TouchableOpacity
            onPress={() => setShowEndTimePicker(!showEndTimePicker)}
            style={styles.timeContainer}
          >
            <Image
              source={require("../../assets/icons/time_icon.webp")}
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
            value={endTime}
            mode="time"
            is24Hour={false}
            display="spinner"
            onChange={(event, selectedTime) => {
              const currentTime = selectedTime || endTime;
              setEndTime(currentTime);
              setShowEndTimePicker(false);
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
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.addParticipantsButton}
      >
        <Text style={styles.addText}>Add Guests</Text>
      </TouchableOpacity>
      <View style={styles.row}>
        <Text style={styles.label}>Guests:  </Text>
        <View style={styles.pfpContainer}>
          {contacts && contacts.length > 0 ? (
            <FlatList
              data={contacts}
              renderItem={({ item }) => {
                return (
                  <TouchableOpacity>
                    {!item.avatar_url ? (
                      <View style={[styles.cardImg]}>
                        <Text style={styles.cardAvatarText}>
                          {item.first_name[0].toUpperCase()}
                        </Text>
                      </View>
                    ) : (
                      <Image
                        alt="Avatar"
                        resizeMode="cover"
                        source={{ uri: item.avatar_url }}
                        style={styles.profileImage}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.none}>None</Text>
          )}

          <Modal
            animationType="none"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalBackground}>
              <View style={styles.modalContainer}>
                <AddParticipants
                  onClose={() => setModalVisible(false)}
                  selectedContacts={selectedContacts || []} // Pass down the selected contacts
                  setSelectedContacts={setSelectedContacts} // Allow child to update selected contacts
                />
              </View>
            </View>
          </Modal>
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
          <Text style={styles.buttonText}>Create</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: "22%",
    // left: "50%",
    // transform: [{ translateX: -155 }, { translateY: -175 }],
    alignSelf: "center",
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
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginBottom: 8, // Space below the error message
  },
  input: {
    height: 40,
    borderColor: "grey",
    borderWidth: 1,
    paddingLeft: 10,
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
    width: "100%",
  },
  inputError: {
    borderColor: "red", // Red border on error
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  participantsContainer: {
    flexDirection: "row",
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
  addParticipantsButton: {
    backgroundColor: "#17D7", // Stronger contrast for visibility
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: {
    color: "white",
    textAlign: "center",
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
  },
  none: {
    color: "#696969",
    fontSize: 16,
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
    width: "80%",
    overflow: "hidden", // Ensure content stays within the container
  },
  addPersonIcon: {
    borderWidth: 2,
    borderColor: "#007BFF", // Border color for the add icon
    padding: 10,
    backgroundColor: "#F1F1F1", // Background for add icon to make it more visible
  },
  profileImage: {
    width: 30, // or whatever size you want
    height: 30,
    borderRadius: 15, // circular image
    marginRight: 2,
  },
  cardImg: {
    width: 30,
    height: 30,
    backgroundColor: "#FFADAD",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    marginRight: 2,
  },
  cardAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    height: "66%", // Increase the modal height
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    // justifyContent: 'space-between', // Space out content and button
  },
});

export default AddEvent;
