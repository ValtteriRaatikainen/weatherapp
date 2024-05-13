import React from 'react';
import { Text, FlatList, View, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, remove, off } from 'firebase/database';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

export default function Favouritescreen() {
  const [data, setData] = useState([]);
  const navigation = useNavigation(); // Initialize useNavigation

  useEffect(() => {
    const database = getDatabase();
    const itemsRef = ref(database, 'items');

    const fetchData = () => {
      onValue(itemsRef, (snapshot) => {
        const items = snapshot.val();
        const dataArray = items ? Object.entries(items).map(([key, value]) => ({ id: key, city: value })) : [];
        setData(dataArray);
      });
    };

    fetchData();

    return () => {
      off(itemsRef);
    };
  }, []);

  const handleDelete = (id) => {
    const database = getDatabase();
    remove(ref(database, `items/${id}`));
  };

  // Handle navigation to Weatherscreen when city is clicked
  // didnt work just yet
  const handleCityClick = (city) => {
    navigation.navigate('Weatherscreen', { city }); // Check if the navigation name is correct
  };

  return (
    <View className="flex pt-10 justify-center bg-orange-200 w-full h-full">
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            // onPress={() => handleCityClick(item.city)}
            className="flex-row justify-between bg-white p-4 m-2 rounded-lg shadow-md w-84 pr-6"
          >
            <Text className="font-bold text-3xl">{item.city}</Text>
            <Pressable
              onPress={() => handleDelete(item.id)}
              style={{ marginLeft: 8 }}
              className="pt-1"
            >
              <Feather name="trash" size={24} color="black" />
            </Pressable>
          </Pressable>
        )}
      />
    </View>
  );
}
