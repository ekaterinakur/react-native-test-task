import React from 'react';
import { createAppContainer, createStackNavigator } from 'react-navigation';
import Tracks from "./Tracks";
import Player from "./Player";

const AppNavigator = createStackNavigator({
  Tracks: {
    screen: Tracks,
  },
  Player: {
    screen: Player,
  },
}, {
  initialRouteName: 'Tracks',
});

export const AppContainer = createAppContainer(AppNavigator);
