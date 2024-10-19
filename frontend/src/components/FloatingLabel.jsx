import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

const FloatingLabelInput = ({ label, value, onChangeText }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(!value)}
            />
            <Text style={[
                styles.label,
                { top: isFocused || value ? 0 : 15, fontSize: isFocused || value ? 12 : 16 },
            ]}
            >
                {label}
            </Text>
        </View>
    );
};