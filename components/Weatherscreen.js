import { StatusBar } from 'expo-status-bar';
import { Text, TextInput, View, Image, Pressable, ScrollView, Keyboard, Alert, Button } from 'react-native';
import React, { useState, useRef } from 'react';
import { Entypo } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_KEY, FIREBASE_API_KEY, AUTH_DOMAIN, DATABASE_URL, PROJECT_ID, STORAGE_BUCKET, MESSAGING_SENDER_ID, APP_ID, MEASUREMENT_ID } from '@env';
import { initializeApp } from 'firebase/app';
import { getDatabase, push, ref, get, child, onValue } from 'firebase/database';
import { useNavigation } from '@react-navigation/native';


export default function Weatherscreen() {
    const [weatherData, setWeatherData] = useState(null);
    const [city, setCity] = useState('Helsinki');
    const [error, setError] = useState(null);
    const [isFahrenheit, setIsFahrenheit] = useState(false);
    const cityInput = useRef(null);

    // Your web app's Firebase configuration
    // For Firebase JS SDK v7.20.0 and later, measurementId is optional

    const firebaseConfig = {
        apiKey: FIREBASE_API_KEY,
        authDomain: AUTH_DOMAIN,
        databaseURL: DATABASE_URL,
        projectId: PROJECT_ID,
        storageBucket: STORAGE_BUCKET,
        messagingSenderId: MESSAGING_SENDER_ID,
        appId: APP_ID,
        measurementId: MEASUREMENT_ID
    };
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    const navigation = useNavigation();

    const fetchWeatherData = () => {
        fetch(`http://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${city}&days=3`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('City not found');
                }
                return response.json();
            })
            .then(data => {
                setWeatherData(data);
                setError(null);
            })
            .catch(error => {
                setError('City not found');
                console.error('Error fetching weather data:', error);
            });
    }

    const formatTime = (timeString) => {
        const date = new Date(timeString);
        const hours = date.getHours().toString().padStart(2, '0'); // adds leading zero if needed
        return `${hours}`;
    }

    const formatDate = (timeString) => {
        const date = new Date(timeString);
        return date.toLocaleString('fi', { timeZone: 'Europe/Helsinki', day: 'numeric', month: 'numeric' });
    }

    const toggleUnit = () => {
        setIsFahrenheit(prevState => !prevState); // toggles temperature unit celsius / fahrenheit
        const message = isFahrenheit ? 'Temperature unit changed to Celsius' : 'Temperature unit changed to Fahrenheit';
        Alert.alert(message);
    }

    const handleCitySearch = () => {
        fetchWeatherData(); // fetch weather data when enter is pressed
        cityInput.current.clear(); // clear the text field after submission
        Keyboard.dismiss(); // close the keyboard after pressing magnifying glass icon
    };

    // Save city to favourites
    const handleSaveCity = async () => {
        if (city === '') {
            Alert.alert('Search for a city first');
        } else {
            // Check if the city is already in the database
            const isCitySaved = await checkCityExists(city);
            if (isCitySaved) {
                Alert.alert('City already saved to favourites');
            } else {
                saveCity(city);
                Alert.alert('City saved to favourites');
            }
        }
    }

    // Check if the city is already in the database
    const checkCityExists = async (cityName) => {
        const snapshot = await get(child(ref(database), 'items'));
        if (snapshot.exists()) {
            const data = snapshot.val();
            return Object.values(data).includes(cityName);
        }
        return false;
    }

    // Save city to the database
    const saveCity = (cityName) => {
        push(ref(database, 'items/'), cityName);
    }

    return (
        // search bar
        <View className="flex pt-16 bg-orange-100 w-full h-full">
            <View className="flex-row justify-center items-center">
                <Pressable onPress={toggleUnit} className="pr-2 pb-1">
                    {/* Changes temperature icon when pressed */}
                    {isFahrenheit ? (
                        <MaterialCommunityIcons name="temperature-celsius" size={40} color="black" />
                    ) : (
                        <MaterialCommunityIcons name="temperature-fahrenheit" size={40} color="black" />
                    )}
                </Pressable>
                <View className="flex-row bg-slate-200 justify-end items-center rounded-full w-4/6">
                    <TextInput placeholder="Enter city name"
                        ref={cityInput}
                        value={city}
                        onChangeText={text => setCity(text)}
                        onSubmitEditing={handleCitySearch}
                        className="pl-6 h-16 flex-1 text-base text-black placeholder:text-black" />
                    <Pressable onPress={handleCitySearch} className="pr-4">
                        <Entypo name="magnifying-glass" size={40} color="black" />
                    </Pressable>
                </View>
                <Pressable onPress={handleSaveCity} className="pl-2 pb-1">
                        <AntDesign name="staro" size={40} color="black" />
                </Pressable>
            </View>
            <Button title="Favourites" onPress={() => navigation.navigate('Favouritescreen')} className="pt-4" />
            {error && <Text>{error}</Text>}
            {weatherData && !error && (
                // main weather view
                <>
                    <View className="flex justify-center items-center">

                        <Text className="text-4xl font-bold pt-8">
                            {weatherData.location.name}
                        </Text>
                        <Text className="text-6xl font-bold pt-6"> {isFahrenheit ? `${weatherData.current.temp_f}°F` : `${weatherData.current.temp_c}°C`}</Text>
                        <Text className="text-2xl font-semibold pt-4">{weatherData.current.condition.text}</Text>
                    </View>

                    {/* forecast slider */}
                    <ScrollView
                        horizontal
                        contentContainerStyle={{ paddingHorizontal: 20 }}
                        showsHorizontalScrollIndicator={false}
                    >
                        {/* forecast card */}
                        <View className="flex justify-center items-center w-40 h-40 rounded-3xl pt-3 mt-6 ml-1 bg-slate-200">
                            <Text className="text-xl font-medium">Today:</Text>
                            <View className="flex-row justify-center items-center">
                                <AntDesign name="up" size={24} color="black" />
                                <Text className="text-xl font-medium">
                                    {isFahrenheit ? `${weatherData.forecast.forecastday[0].day.maxtemp_f}°F` : `${weatherData.forecast.forecastday[0].day.maxtemp_c}°C`}
                                </Text>
                            </View>
                            <View className="flex-row justify-center items-center">
                                <AntDesign name="down" size={24} color="black" />
                                <Text className="text-xl font-medium">
                                    {isFahrenheit ? `${weatherData.forecast.forecastday[0].day.mintemp_f}°F` : `${weatherData.forecast.forecastday[0].day.mintemp_c}°C`}
                                </Text>
                            </View>
                            <Image source={{ uri: `http:${weatherData.current.condition.icon}` }} className="w-14 h-14" />
                        </View>

                        <View className="flex justify-center items-center w-40 h-40 rounded-3xl pt-3 mt-6 ml-6 bg-slate-200">
                            <Text className="text-xl font-medium">Tomorrow:</Text>
                            <View className="flex-row justify-center items-center">
                                <AntDesign name="up" size={24} color="black" />
                                <Text className="text-xl font-medium">
                                    {isFahrenheit ? `${weatherData.forecast.forecastday[1].day.maxtemp_f}°F` : `${weatherData.forecast.forecastday[1].day.maxtemp_c}°C`}
                                </Text>
                            </View>
                            <View className="flex-row justify-center items-center">
                                <AntDesign name="down" size={24} color="black" />
                                <Text className="text-xl font-medium">
                                    {isFahrenheit ? `${weatherData.forecast.forecastday[1].day.mintemp_f}°F` : `${weatherData.forecast.forecastday[1].day.mintemp_c}°C`}
                                </Text>
                            </View>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[1].day.condition.icon}` }} className="w-14 h-14" />
                        </View>

                        <View className="flex justify-center items-center w-40 h-40 rounded-3xl pt-3 mt-6 ml-6 bg-slate-200">
                            <Text className="text-xl font-medium">{formatDate(weatherData.forecast.forecastday[2].date)}</Text>
                            <View className="flex-row justify-center items-center">
                                <AntDesign name="up" size={24} color="black" />
                                <Text className="text-xl font-medium">
                                    {isFahrenheit ? `${weatherData.forecast.forecastday[2].day.maxtemp_f}°F` : `${weatherData.forecast.forecastday[2].day.maxtemp_c}°C`}
                                </Text>
                            </View>
                            <View className="flex-row justify-center items-center">
                                <AntDesign name="down" size={24} color="black" />
                                <Text className="text-xl font-medium">
                                    {isFahrenheit ? `${weatherData.forecast.forecastday[2].day.mintemp_f}°F` : `${weatherData.forecast.forecastday[2].day.mintemp_c}°C`}
                                </Text>
                            </View>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[2].day.condition.icon}` }} className="w-14 h-14" />
                        </View>
                    </ScrollView>
                    <View className="flex justify-center items-center">
                        <Text className="text-4xl font-medium pb-10">Today:</Text>
                    </View>
                    {/* hourly slider */}
                    <ScrollView
                        horizontal
                        contentContainerStyle={{ paddingHorizontal: 20 }}
                        showsHorizontalScrollIndicator={false}
                    >
                        {/* hourly card */}
                        <View className="flex justify-center items-center w-32 h-32 rounded-3xl pt-3 ml-1 bg-slate-200">
                            <Text className="text-xl font-medium">{formatTime(weatherData.forecast.forecastday[0].hour[0].time)}</Text>
                            <Text className="text-xl font-medium">{isFahrenheit ? `${weatherData.forecast.forecastday[0].hour[0].temp_f}°F` : `${weatherData.forecast.forecastday[0].hour[0].temp_c}°C`}</Text>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[0].hour[0].condition.icon}` }} className="w-14 h-14" />
                        </View>

                        <View className="flex justify-center items-center w-32 h-32 rounded-3xl pt-3 ml-3 bg-slate-200">
                            <Text className="text-xl font-medium">{formatTime(weatherData.forecast.forecastday[0].hour[1].time)}</Text>
                            <Text className="text-xl font-medium">{isFahrenheit ? `${weatherData.forecast.forecastday[0].hour[1].temp_f}°F` : `${weatherData.forecast.forecastday[0].hour[1].temp_c}°C`}</Text>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[0].hour[1].condition.icon}` }} className="w-14 h-14" />
                        </View>

                        <View className="flex justify-center items-center w-32 h-32 rounded-3xl pt-3 ml-3 bg-slate-200">
                            <Text className="text-xl font-medium">{formatTime(weatherData.forecast.forecastday[0].hour[2].time)}</Text>
                            <Text className="text-xl font-medium">{isFahrenheit ? `${weatherData.forecast.forecastday[0].hour[2].temp_f}°F` : `${weatherData.forecast.forecastday[0].hour[2].temp_c}°C`}</Text>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[0].hour[2].condition.icon}` }} className="w-14 h-14" />
                        </View>

                        <View className="flex justify-center items-center w-32 h-32 rounded-3xl pt-3 ml-3 bg-slate-200">
                            <Text className="text-xl font-medium">{formatTime(weatherData.forecast.forecastday[0].hour[3].time)}</Text>
                            <Text className="text-xl font-medium">{isFahrenheit ? `${weatherData.forecast.forecastday[0].hour[3].temp_f}°F` : `${weatherData.forecast.forecastday[0].hour[3].temp_c}°C`}</Text>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[0].hour[3].condition.icon}` }} className="w-14 h-14" />
                        </View>

                        <View className="flex justify-center items-center w-32 h-32 rounded-3xl pt-3 ml-3 bg-slate-200">
                            <Text className="text-xl font-medium">{formatTime(weatherData.forecast.forecastday[0].hour[4].time)}</Text>
                            <Text className="text-xl font-medium">{isFahrenheit ? `${weatherData.forecast.forecastday[0].hour[4].temp_f}°F` : `${weatherData.forecast.forecastday[0].hour[4].temp_c}°C`}</Text>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[0].hour[4].condition.icon}` }} className="w-14 h-14" />
                        </View>

                        <View className="flex justify-center items-center w-32 h-32 rounded-3xl pt-3 ml-3 bg-slate-200">
                            <Text className="text-xl font-medium">{formatTime(weatherData.forecast.forecastday[0].hour[5].time)}</Text>
                            <Text className="text-xl font-medium">{isFahrenheit ? `${weatherData.forecast.forecastday[0].hour[5].temp_f}°F` : `${weatherData.forecast.forecastday[0].hour[5].temp_c}°C`}</Text>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[0].hour[5].condition.icon}` }} className="w-14 h-14" />
                        </View>

                        <View className="flex justify-center items-center w-32 h-32 rounded-3xl pt-3 ml-3 bg-slate-200">
                            <Text className="text-xl font-medium">{formatTime(weatherData.forecast.forecastday[0].hour[6].time)}</Text>
                            <Text className="text-xl font-medium">{isFahrenheit ? `${weatherData.forecast.forecastday[0].hour[6].temp_f}°F` : `${weatherData.forecast.forecastday[0].hour[6].temp_c}°C`}</Text>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[0].hour[6].condition.icon}` }} className="w-14 h-14" />
                        </View>

                        <View className="flex justify-center items-center w-32 h-32 rounded-3xl pt-3 ml-3 bg-slate-200">
                            <Text className="text-xl font-medium">{formatTime(weatherData.forecast.forecastday[0].hour[7].time)}</Text>
                            <Text className="text-xl font-medium">{isFahrenheit ? `${weatherData.forecast.forecastday[0].hour[7].temp_f}°F` : `${weatherData.forecast.forecastday[0].hour[7].temp_c}°C`}</Text>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[0].hour[7].condition.icon}` }} className="w-14 h-14" />
                        </View>

                        <View className="flex justify-center items-center w-32 h-32 rounded-3xl pt-3 ml-3 bg-slate-200">
                            <Text className="text-xl font-medium">{formatTime(weatherData.forecast.forecastday[0].hour[8].time)}</Text>
                            <Text className="text-xl font-medium">{isFahrenheit ? `${weatherData.forecast.forecastday[0].hour[8].temp_f}°F` : `${weatherData.forecast.forecastday[0].hour[8].temp_c}°C`}</Text>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[0].hour[8].condition.icon}` }} className="w-14 h-14" />
                        </View>

                        <View className="flex justify-center items-center w-32 h-32 rounded-3xl pt-3 ml-3 bg-slate-200">
                            <Text className="text-xl font-medium">{formatTime(weatherData.forecast.forecastday[0].hour[9].time)}</Text>
                            <Text className="text-xl font-medium">{isFahrenheit ? `${weatherData.forecast.forecastday[0].hour[9].temp_f}°F` : `${weatherData.forecast.forecastday[0].hour[9].temp_c}°C`}</Text>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[0].hour[9].condition.icon}` }} className="w-14 h-14" />
                        </View>

                        <View className="flex justify-center items-center w-32 h-32 rounded-3xl pt-3 ml-3 bg-slate-200">
                            <Text className="text-xl font-medium">{formatTime(weatherData.forecast.forecastday[0].hour[10].time)}</Text>
                            <Text className="text-xl font-medium">{isFahrenheit ? `${weatherData.forecast.forecastday[0].hour[10].temp_f}°F` : `${weatherData.forecast.forecastday[0].hour[10].temp_c}°C`}</Text>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[0].hour[10].condition.icon}` }} className="w-14 h-14" />
                        </View>

                        <View className="flex justify-center items-center w-32 h-32 rounded-3xl pt-3 ml-3 bg-slate-200">
                            <Text className="text-xl font-medium">{formatTime(weatherData.forecast.forecastday[0].hour[11].time)}</Text>
                            <Text className="text-xl font-medium">{isFahrenheit ? `${weatherData.forecast.forecastday[0].hour[11].temp_f}°F` : `${weatherData.forecast.forecastday[0].hour[11].temp_c}°C`}</Text>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[0].hour[11].condition.icon}` }} className="w-14 h-14" />
                        </View>

                        <View className="flex justify-center items-center w-32 h-32 rounded-3xl pt-3 ml-3 bg-slate-200">
                            <Text className="text-xl font-medium">{formatTime(weatherData.forecast.forecastday[0].hour[12].time)}</Text>
                            <Text className="text-xl font-medium">{isFahrenheit ? `${weatherData.forecast.forecastday[0].hour[12].temp_f}°F` : `${weatherData.forecast.forecastday[0].hour[12].temp_c}°C`}</Text>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[0].hour[12].condition.icon}` }} className="w-14 h-14" />
                        </View>

                        <View className="flex justify-center items-center w-32 h-32 rounded-3xl pt-3 ml-3 bg-slate-200">
                            <Text className="text-xl font-medium">{formatTime(weatherData.forecast.forecastday[0].hour[13].time)}</Text>
                            <Text className="text-xl font-medium">{isFahrenheit ? `${weatherData.forecast.forecastday[0].hour[13].temp_f}°F` : `${weatherData.forecast.forecastday[0].hour[13].temp_c}°C`}</Text>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[0].hour[13].condition.icon}` }} className="w-14 h-14" />
                        </View>

                        <View className="flex justify-center items-center w-32 h-32 rounded-3xl pt-3 ml-3 bg-slate-200">
                            <Text className="text-xl font-medium">{formatTime(weatherData.forecast.forecastday[0].hour[14].time)}</Text>
                            <Text className="text-xl font-medium">{isFahrenheit ? `${weatherData.forecast.forecastday[0].hour[14].temp_f}°F` : `${weatherData.forecast.forecastday[0].hour[14].temp_c}°C`}</Text>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[0].hour[14].condition.icon}` }} className="w-14 h-14" />
                        </View>

                        <View className="flex justify-center items-center w-32 h-32 rounded-3xl pt-3 ml-3 bg-slate-200">
                            <Text className="text-xl font-medium">{formatTime(weatherData.forecast.forecastday[0].hour[15].time)}</Text>
                            <Text className="text-xl font-medium">{isFahrenheit ? `${weatherData.forecast.forecastday[0].hour[15].temp_f}°F` : `${weatherData.forecast.forecastday[0].hour[15].temp_c}°C`}</Text>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[0].hour[15].condition.icon}` }} className="w-14 h-14" />
                        </View>

                        <View className="flex justify-center items-center w-32 h-32 rounded-3xl pt-3 ml-3 bg-slate-200">
                            <Text className="text-xl font-medium">{formatTime(weatherData.forecast.forecastday[0].hour[16].time)}</Text>
                            <Text className="text-xl font-medium">{isFahrenheit ? `${weatherData.forecast.forecastday[0].hour[16].temp_f}°F` : `${weatherData.forecast.forecastday[0].hour[16].temp_c}°C`}</Text>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[0].hour[16].condition.icon}` }} className="w-14 h-14" />
                        </View>

                        <View className="flex justify-center items-center w-32 h-32 rounded-3xl pt-3 ml-3 bg-slate-200">
                            <Text className="text-xl font-medium">{formatTime(weatherData.forecast.forecastday[0].hour[17].time)}</Text>
                            <Text className="text-xl font-medium">{isFahrenheit ? `${weatherData.forecast.forecastday[0].hour[17].temp_f}°F` : `${weatherData.forecast.forecastday[0].hour[17].temp_c}°C`}</Text>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[0].hour[17].condition.icon}` }} className="w-14 h-14" />
                        </View>

                        <View className="flex justify-center items-center w-32 h-32 rounded-3xl pt-3 ml-3 bg-slate-200">
                            <Text className="text-xl font-medium">{formatTime(weatherData.forecast.forecastday[0].hour[18].time)}</Text>
                            <Text className="text-xl font-medium">{isFahrenheit ? `${weatherData.forecast.forecastday[0].hour[18].temp_f}°F` : `${weatherData.forecast.forecastday[0].hour[18].temp_c}°C`}</Text>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[0].hour[18].condition.icon}` }} className="w-14 h-14" />
                        </View>

                        <View className="flex justify-center items-center w-32 h-32 rounded-3xl pt-3 ml-3 bg-slate-200">
                            <Text className="text-xl font-medium">{formatTime(weatherData.forecast.forecastday[0].hour[19].time)}</Text>
                            <Text className="text-xl font-medium">{isFahrenheit ? `${weatherData.forecast.forecastday[0].hour[19].temp_f}°F` : `${weatherData.forecast.forecastday[0].hour[19].temp_c}°C`}</Text>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[0].hour[19].condition.icon}` }} className="w-14 h-14" />
                        </View>

                        <View className="flex justify-center items-center w-32 h-32 rounded-3xl pt-3 ml-3 bg-slate-200">
                            <Text className="text-xl font-medium">{formatTime(weatherData.forecast.forecastday[0].hour[20].time)}</Text>
                            <Text className="text-xl font-medium">{isFahrenheit ? `${weatherData.forecast.forecastday[0].hour[20].temp_f}°F` : `${weatherData.forecast.forecastday[0].hour[20].temp_c}°C`}</Text>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[0].hour[20].condition.icon}` }} className="w-14 h-14" />
                        </View>

                        <View className="flex justify-center items-center w-32 h-32 rounded-3xl pt-3 ml-3 bg-slate-200">
                            <Text className="text-xl font-medium">{formatTime(weatherData.forecast.forecastday[0].hour[21].time)}</Text>
                            <Text className="text-xl font-medium">{isFahrenheit ? `${weatherData.forecast.forecastday[0].hour[21].temp_f}°F` : `${weatherData.forecast.forecastday[0].hour[21].temp_c}°C`}</Text>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[0].hour[21].condition.icon}` }} className="w-14 h-14" />
                        </View>

                        <View className="flex justify-center items-center w-32 h-32 rounded-3xl pt-3 ml-3 bg-slate-200">
                            <Text className="text-xl font-medium">{formatTime(weatherData.forecast.forecastday[0].hour[22].time)}</Text>
                            <Text className="text-xl font-medium">{isFahrenheit ? `${weatherData.forecast.forecastday[0].hour[22].temp_f}°F` : `${weatherData.forecast.forecastday[0].hour[22].temp_c}°C`}</Text>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[0].hour[22].condition.icon}` }} className="w-14 h-14" />
                        </View>

                        <View className="flex justify-center items-center w-32 h-32 rounded-3xl pt-3 ml-3 bg-slate-200">
                            <Text className="text-xl font-medium">{formatTime(weatherData.forecast.forecastday[0].hour[23].time)}</Text>
                            <Text className="text-xl font-medium">{isFahrenheit ? `${weatherData.forecast.forecastday[0].hour[23].temp_f}°F` : `${weatherData.forecast.forecastday[0].hour[23].temp_c}°C`}</Text>
                            <Image source={{ uri: `http:${weatherData.forecast.forecastday[0].hour[23].condition.icon}` }} className="w-14 h-14" />
                        </View>

                    </ScrollView>
                </>
            )}
            <StatusBar />
        </View>
    );
}
