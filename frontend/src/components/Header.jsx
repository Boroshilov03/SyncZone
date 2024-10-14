import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';

const profilePic = require('../../assets/icons/pfp_icon.png');
const rightImage = require('../../assets/icons/add_calendar.png');

const Header = ({ toggleAddEventModal }) => {
  return (
    <View style={styles.headerContainer}>
      <Image source={profilePic} style={styles.profilePic} />
      <TouchableOpacity onPress={toggleAddEventModal}>
        <Image source={rightImage} style={styles.rightImage} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    marginLeft: 10,
    marginRight: 10,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  rightImage: {
    width: 40,
    height: 40,
  },
});

export default Header;
