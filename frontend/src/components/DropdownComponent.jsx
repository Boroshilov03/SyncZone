import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import axios from 'axios';
import { API_KEY, API_URL } from '@env';
import Icon from "react-native-vector-icons/FontAwesome";
import Icon2 from "react-native-vector-icons/FontAwesome5";

const DropdownComponent = ({ setCity, location, storedLocation, storedCountry }) => {
    const [countryData, setCountryData] = useState([]);
    const [cityData, setCityData] = useState([]);
    const [country, setCountry] = useState(storedCountry || null);
    const [city, setCityState] = useState(storedLocation || location || null);
    const [isFocus, setIsFocus] = useState(false);

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await axios.get(API_URL, {
                    headers: { 'X-CSCAPI-KEY': API_KEY },
                });
                const countryArray = response.data.map(item => ({
                    value: item.iso2,
                    label: item.name,
                }));
                setCountryData(countryArray);
                if (storedCountry) {
                    handleCity(storedCountry);
                }
            } catch (error) {
                console.error("Error fetching countries:", error);
            }
        };
        fetchCountries();
    }, [storedCountry]);

    const handleCity = async (countryCode) => {
        try {
            const response = await axios.get(`${API_URL}/${countryCode}/cities`, {
                headers: { 'X-CSCAPI-KEY': API_KEY },
            });

            const uniqueCities = Array.from(
                new Map(response.data.map(city => [city.name, city])).values()
            );

            const cityArray = uniqueCities.map(city => ({
                value: city.name, // Use city name as value
                label: city.name,
            }));
            setCityData(cityArray);
            setCityState(null); // Reset city state when country changes
        } catch (error) {
            console.error("Error fetching cities:", error);
        }
    };

    return (
        <View style={styles.container}>
            <Dropdown
                style={[styles.dropdown, isFocus && { borderColor: '#7fc7c9' }]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                data={countryData}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={!isFocus ? 'Select country' : '...'}
                searchPlaceholder="Search..."
                value={country}
                onFocus={() => setIsFocus(true)}
                onBlur={() => setIsFocus(false)}
                renderLeftIcon={() =>
                    <Icon
                        style={styles.icon}
                        color={isFocus ? '#9ae1e3' : '#616061'}
                        name="globe"
                        size={24}
                    />
                }
                onChange={item => {
                    setCountry(item.value);
                    handleCity(item.value);
                    setIsFocus(false);
                }}
            />
            <Dropdown
                style={[styles.dropdown, isFocus && { borderColor: '#7fc7c9' }]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                data={cityData}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={!isFocus ? 'Select city' : '...'}
                searchPlaceholder="Search..."
                value={city}
                onFocus={() => setIsFocus(true)}
                onBlur={() => setIsFocus(false)}
                renderLeftIcon={() =>
                    <Icon2
                        style={styles.icon}
                        color={isFocus ? '#9ae1e3' : '#616061'}
                        name="city"
                        size={18}
                    />
                }
                onChange={item => {
                    setCity(item.label);
                    setCityState(item.label); // Update local state
                    setIsFocus(false);
                }}
            />
        </View>
    );
};

export default DropdownComponent;

const styles = StyleSheet.create({
    container: {
        padding: 16,
        justifyContent: 'center',
        flex: 1,
        alignItems: 'center'
    },
    dropdown: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 2.5,
        borderRadius: 60,
        paddingHorizontal: 10,
        margin: 18,
        width: 310
    },
    icon: {
        marginRight: 8,
    },
    placeholderStyle: {
        fontSize: 14,
        color: "#70747a",
        marginVertical: 6,
        paddingHorizontal: 16,
        fontWeight: 'bold'
    },
    selectedTextStyle: {
        fontSize: 14,
        color: "#70747a",
        marginVertical: 6,
        paddingHorizontal: 16,
        fontWeight: 'bold'
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 16,
    },
});