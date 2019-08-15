import React, { Component } from 'react';
import {
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Font from 'expo-font';
import { PLAYLIST } from './PlayList';
import Track from "./Track";

export default class Tracks extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fontLoaded: false,
    };
  }

  componentDidMount() {
    (async () => {
      await Font.loadAsync({
        roboto: require('../assets/fonts/Roboto.ttf'),
      });

      this.setState({ fontLoaded: true });
    })();
  }

  _keyExtractor = (item, index) => item.id;

  render() {
    return !this.state.fontLoaded ? (
      <View />
    ) : (
      <ImageBackground
        source={require('../assets/images/backg.jpg')}
        style={styles.backgroundImage}>
        <View>
          <Text style={styles.header}>
            Play list
          </Text>
        </View>
        <View>
          <FlatList
            data={PLAYLIST}
            keyExtractor={this._keyExtractor}
            initialNumToRender={10}
            onScroll={() => scrollToEnd()}
            renderItem={({item}) => <Track item={item} navigation={this.props.navigation} />}
          />
        </View>
      </ImageBackground>
    );
  }
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    opacity: .8,
    resizeMode: 'cover',
  },
  header: {
    marginTop: 20,
    marginBottom: 20,
    fontSize: 28,
    minHeight: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    opacity: .7,
  },
});
