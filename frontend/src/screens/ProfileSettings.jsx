import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity } from 'react-native';

const ProfileSettings = ({ navigation, route }) => {
    const { setProfileVisible } = route.params;

    return (
        <SafeAreaView style={styles.container}>
            <Text>Profile Settings</Text>
            <TouchableOpacity style={styles.backButton} onPress={() => {
                setProfileVisible(true);
                navigation.navigate("MainTabs");
            }}
            >
                <Text style={styles.backButtonText}>Back button for chat page</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

export default ProfileSettings;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        padding: 10,
        backgroundColor: '#007bff', // Blue color for the button
        borderRadius: 5,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});