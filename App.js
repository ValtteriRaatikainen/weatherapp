import React from 'react';
import Weatherscreen from './components/Weatherscreen';
import Favouritescreen from './components/Favouritescreen';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();
export default function App() {

  return (

    <>
      <NavigationContainer>
        <Stack.Navigator 
        screenOptions={{
          headerShown: false
        }}>
          <Stack.Screen name="Weatherscreen" component={Weatherscreen} />
          <Stack.Screen name="Favouritescreen" component={Favouritescreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>

  );
}

