import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import axios from 'axios';
import { API_KEY, API_URL } from '@env';

const DropdownComponent = () => {
    const [countryData, setCountryData] = useState([]);
    const [cityData, setCityData] = useState([]);
    const [country, setCountry] = useState(null);
    const [city, setCity] = useState(null);
    const [isFocus, setIsFocus] = useState(false);

    console.log(API_KEY);  // Should log your API key
    console.log(API_URL);
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
                console.log(JSON.stringify(response.data));
                var count = Object.keys(response.data).length
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

    const handleCity = (countryCode) => {
        const url = `${API_URL}/${countryCode}/cities`;
        var config = {
            method: 'get',
            url: url,
            headers: {
                'X-CSCAPI-KEY': API_KEY
            }
        };

        axios(config)
            .then(function (response) {
                const cities = response.data;

                const uniqueCities = Array.from(
                    new Map(cities.map((city) => [city.name, city])).values()
                );

                const cityArray = uniqueCities.map((city) => ({
                    value: city.iso2,
                    label: city.name,
                }));

                setCityData(cityArray);
            })
            .catch(function (error) {
                console.log(error);
            });
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
                value={city}
                onFocus={() => setIsFocus(true)}
                onBlur={() => setIsFocus(false)}
                onChange={item => {
                    setCity(item.value);

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
        height: 50,
        borderColor: 'gray',
        borderWidth: 0.5,
        borderRadius: 8,
        paddingHorizontal: 8,
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
    iconStyle: {
        width: 20,
        height: 20,
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 16,
    },
});