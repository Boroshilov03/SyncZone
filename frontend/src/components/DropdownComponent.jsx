import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import axios from 'axios';
import { API_KEY, API_URL } from '@env';

const DropdownComponent = ({ setCity, location }) => {
    const [countryData, setCountryData] = useState([]);
    const [cityData, setCityData] = useState([]);
    const [country, setCountry] = useState(null);
    const [isFocus, setIsFocus] = useState(false);

    useEffect(() => {
        var config = {
            method: 'get',
            url: API_URL,
            headers: {
                'X-CSCAPI-KEY': API_KEY
            }
        };
        axios(config)
            .then(response => {
                var count = Object.keys(response.data).length;
                let countryArray = [];
                for (var i = 0; i < count; i++) {
                    countryArray.push({
                        value: response.data[i].iso2,
                        label: response.data[i].name,
                    });
                }
                setCountryData(countryArray);
            })
            .catch((error) => {
                console.error(error);
            });
    }, []);

    const handleCity = async (countryCode) => {
        try {
            const response = await axios.get(`${API_URL}/${countryCode}/cities`, {
                headers: { 'X-CSCAPI-KEY': API_KEY }
            });

            console.log("City response:", response.data);
            const uniqueCities = Array.from(
                new Map(response.data.map(city => [city.name, city])).values()
            );

            const cityArray = uniqueCities.map(city => ({
                value: city.iso2,
                label: city.name,
            }));

            console.log("Mapped city data:", cityArray);
            setCityData(cityArray);
        } catch (error) {
            console.error("Error fetching cities:", error);
        }
    };

    return (
        <View style={styles.container}>
            <Dropdown
                style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                data={countryData}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={!isFocus ? 'Select countries' : '...'}
                searchPlaceholder="Search..."
                value={country}
                onFocus={() => setIsFocus(true)}
                onBlur={() => setIsFocus(false)}
                onChange={item => {
                    setCountry(item.value);
                    handleCity(item.value);
                    setIsFocus(false);
                }}
            />
            <Dropdown
                style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                data={cityData}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={!isFocus ? 'Select cities' : '...'}
                searchPlaceholder="Search..."
                value={location}
                onFocus={() => setIsFocus(true)}
                onBlur={() => setIsFocus(false)}
                onChange={item => {
                    console.log("Selected item:", item);
                    setCity(item.label);
                    setIsFocus(false);
                }}
            />
        </View>
    );
};

export default DropdownComponent;

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        padding: 16,
    },
    dropdown: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 2.5,
        borderRadius: 60,
        paddingHorizontal: 8,
        margin: 18,
    },
    icon: {
        marginRight: 5,
    },
    label: {
        position: 'absolute',
        backgroundColor: 'white',
        left: 22,
        top: 8,
        zIndex: 999,
        paddingHorizontal: 8,
        fontSize: 14,
    },
    placeholderStyle: {
        fontSize: 16,
    },
    selectedTextStyle: {
        fontSize: 16,
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 16,
    },
});