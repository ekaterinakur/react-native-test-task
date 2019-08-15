import React, { Component } from 'react';
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import Slider from 'react-native-slider';
// import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { PLAYLIST } from './PlayList';

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = Dimensions.get('window');
const BACKGROUND_COLOR = '#FFFFFF';
const DISABLED_OPACITY = 0.5;
const FONT_SIZE = 20;
const LOADING_STRING = 'Loading...';
const BUFFERING_STRING = 'Buffering...';
const RATE_SCALE = 3.0;
const HANDLERS_COLOR = '#000000';

export default class Player extends Component {
  constructor(props) {
    super(props);
    this.index = this.props.navigation.getParam('index');
    this.isSeeking = false;
    this.shouldPlayAtEndOfSeek = false;
    this.playbackInstance = null;
    this.state = {
      playbackInstanceName: LOADING_STRING,
      playbackInstancePosition: null,
      playbackInstanceDuration: null,
      shouldPlay: false,
      isPlaying: false,
      isBuffering: false,
      isLoading: true,
      fontLoaded: false,
      volume: 1.0,
      rate: 1.0,
      portrait: null,
    };
  }

  componentDidMount() {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      staysActiveInBackground: true,
      playThroughEarpieceAndroid: true,
    });
    (async () => {
      await Font.loadAsync({
        roboto: require('../assets/fonts/Roboto.ttf'),
      });
      this.setState({ fontLoaded: true });
    })();

    this._loadNewPlaybackInstance(false);
  }

  async _loadNewPlaybackInstance(playing) {
    if (this.playbackInstance != null) {
      await this.playbackInstance.unloadAsync();
      this.playbackInstance.setOnPlaybackStatusUpdate(null);
      this.playbackInstance = null;
    }

    const source = { uri: PLAYLIST[this.index].uri };
    const initialStatus = {
      shouldPlay: playing,
      rate: this.state.rate,
      volume: this.state.volume,
    };

    const { sound, status } = await Audio.Sound.createAsync(
      source,
      initialStatus,
      this._onPlaybackStatusUpdate
    );
    this.playbackInstance = sound;

    this._updateScreenForLoading(false);
  }

  _updateScreenForLoading(isLoading) {
    if (isLoading) {
      this.setState({
        isPlaying: false,
        playbackInstanceName: LOADING_STRING,
        playbackInstanceDuration: null,
        playbackInstancePosition: null,
        isLoading: true,
      });
    } else {
      this.setState({
        playbackInstanceName: PLAYLIST[this.index].name,
        portrait: PLAYLIST[this.index].image,
        isLoading: false,
      });
    }
  }

  _onPlaybackStatusUpdate = status => {
    if (status.isLoaded) {
      this.setState({
        playbackInstancePosition: status.positionMillis,
        playbackInstanceDuration: status.durationMillis,
        shouldPlay: status.shouldPlay,
        isPlaying: status.isPlaying,
        isBuffering: status.isBuffering,
        rate: status.rate,
        volume: status.volume,
      });
      if (status.didJustFinish) {
        this._advanceIndex(true);
        this._updatePlaybackInstanceForIndex(true);
      }
    } else {
      if (status.error) {
        console.log(`FATAL PLAYER ERROR: ${status.error}`);
      }
    }
  };

  _advanceIndex(forward) {
    this.index =
      (this.index + (forward ? 1 : PLAYLIST.length - 1)) %
      PLAYLIST.length;
  }

  async _updatePlaybackInstanceForIndex(playing) {
    this._updateScreenForLoading(true);

    this._loadNewPlaybackInstance(playing);
  }

  _onPlayPausePressed = () => {
    if (this.playbackInstance != null) {
      if (this.state.isPlaying) {
        this.playbackInstance.pauseAsync();
      } else {
        this.playbackInstance.playAsync();
      }
    }
  };

  _onStopPressed = () => {
    if (this.playbackInstance != null) {
      this.playbackInstance.stopAsync();
    }
  };

  _onForwardPressed = () => {
    if (this.playbackInstance != null) {
      this._advanceIndex(true);
      this._updatePlaybackInstanceForIndex(this.state.shouldPlay);
    }
  };

  _onBackPressed = () => {
    if (this.playbackInstance != null) {
      this._advanceIndex(false);
      this._updatePlaybackInstanceForIndex(this.state.shouldPlay);
    }
  };

  _onVolumeSliderValueChange = value => {
    if (this.playbackInstance != null) {
      this.playbackInstance.setVolumeAsync(value);
    }
  };

  _trySetRate = async rate => {
    if (this.playbackInstance != null) {
      try {
        await this.playbackInstance.setRateAsync(rate);
      } catch (error) {
        // Rate changing could not be performed, possibly because the client's Android API is too old.
      }
    }
  };

  _onRateSliderSlidingComplete = async value => {
    this._trySetRate(value * RATE_SCALE);
  };

  _onSeekSliderValueChange = value => {
    if (this.playbackInstance != null && !this.isSeeking) {
      this.isSeeking = true;
      this.shouldPlayAtEndOfSeek = this.state.shouldPlay;
      this.playbackInstance.pauseAsync();
    }
  };

  _onSeekSliderSlidingComplete = async value => {
    if (this.playbackInstance != null) {
      this.isSeeking = false;
      const seekPosition = value * this.state.playbackInstanceDuration;
      if (this.shouldPlayAtEndOfSeek) {
        this.playbackInstance.playFromPositionAsync(seekPosition);
      } else {
        this.playbackInstance.setPositionAsync(seekPosition);
      }
    }
  };

  _getSeekSliderPosition() {
    if (
      this.playbackInstance != null &&
      this.state.playbackInstancePosition != null &&
      this.state.playbackInstanceDuration != null
    ) {
      return (
        this.state.playbackInstancePosition /
        this.state.playbackInstanceDuration
      );
    }
    return 0;
  }

  _getMMSSFromMillis(millis) {
    const totalSeconds = millis / 1000;
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor(totalSeconds / 60);

    const padWithZero = number => {
      const string = number.toString();
      if (number < 10) {
        return '0' + string;
      }
      return string;
    };
    return padWithZero(minutes) + ':' + padWithZero(seconds);
  }

  _getTimestamp() {
    if (
      this.playbackInstance != null &&
      this.state.playbackInstancePosition != null &&
      this.state.playbackInstanceDuration != null
    ) {
      return `${this._getMMSSFromMillis(
        this.state.playbackInstancePosition
      )} / ${this._getMMSSFromMillis(
        this.state.playbackInstanceDuration
      )}`;
    }
    return '';
  }

  render() {
    return !this.state.fontLoaded ? (
      <View />
    ) : (
      <ImageBackground source={require('../assets/images/backg.jpg')} style={styles.backgroundImage}>
        <View style={styles.container}>
          <View style={styles.detailsContainer}>
            <Text style={[styles.text]}>
              {this.state.playbackInstanceName}
            </Text>
            <Text style={[styles.text]}>
              {this.state.isBuffering ? (
                BUFFERING_STRING
              ) : (
                this._getTimestamp()
              )}
            </Text>
          </View>
          <View
            style={[
              styles.buttonsContainerBase,
              styles.buttonsContainerTopRow,
              {
                opacity: this.state.isLoading
                  ? DISABLED_OPACITY
                  : 1.0,
              },
            ]}
          >
            <TouchableHighlight
              underlayColor={BACKGROUND_COLOR}
              style={styles.wrapper}
              onPress={this._onBackPressed}
              disabled={this.state.isLoading}
            >
              <View>
                <MaterialIcons
                  name="fast-rewind"
                  size={40}
                  color={HANDLERS_COLOR}
                />
              </View>
            </TouchableHighlight>
            <TouchableHighlight
              underlayColor={BACKGROUND_COLOR}
              style={styles.wrapper}
              onPress={this._onPlayPausePressed}
              disabled={this.state.isLoading}
            >
              <View>
                {this.state.isPlaying ? (
                  <MaterialIcons
                    name="pause"
                    size={40}
                    color={HANDLERS_COLOR}
                  />
                ) : (
                  <MaterialIcons
                    name="play-arrow"
                    size={40}
                    color={HANDLERS_COLOR}
                  />
                )}
              </View>
            </TouchableHighlight>
            <TouchableHighlight
              underlayColor={BACKGROUND_COLOR}
              style={styles.wrapper}
              onPress={this._onStopPressed}
              disabled={this.state.isLoading}
            >
              <View>
                <MaterialIcons
                  name="stop"
                  size={40}
                  color={HANDLERS_COLOR}
                />
              </View>
            </TouchableHighlight>
            <TouchableHighlight
              underlayColor={BACKGROUND_COLOR}
              style={styles.wrapper}
              onPress={this._onForwardPressed}
              disabled={this.state.isLoading}
            >
              <View>
                <MaterialIcons
                  name="fast-forward"
                  size={40}
                  color={HANDLERS_COLOR}
                />
              </View>
            </TouchableHighlight>
          </View>
          <View
            style={[
              styles.playbackContainer,
              {
                opacity: this.state.isLoading
                  ? DISABLED_OPACITY
                  : 1.0,
              },
            ]}
          >
            <Slider
              style={styles.playbackSlider}
              value={this._getSeekSliderPosition()}
              onValueChange={this._onSeekSliderValueChange}
              onSlidingComplete={this._onSeekSliderSlidingComplete}
              thumbTintColor="#000000"
              minimumTrackTintColor={HANDLERS_COLOR}
              disabled={this.state.isLoading}
            />
          </View>
          <View
            style={[
              styles.buttonsContainerBase,
              styles.buttonsContainerMiddleRow,
            ]}
          >
            <View style={styles.volumeContainer}>
              <View>
                <MaterialIcons
                  name="volume-down"
                  size={40}
                  color={HANDLERS_COLOR}
                />
              </View>
              <Slider
                style={styles.volumeSlider}
                value={1}
                onValueChange={this._onVolumeSliderValueChange}
                thumbTintColor="#000000"
                minimumTrackTintColor={HANDLERS_COLOR}
              />
              <View>
                <MaterialIcons
                  name="volume-up"
                  size={40}
                  color={HANDLERS_COLOR}
                />
              </View>
            </View>
          </View>
          <View
            style={[
              styles.buttonsContainerBase,
              styles.buttonsContainerBottomRow,
            ]}
          >
            <View>
              <MaterialIcons
                name="call-received"
                size={40}
                color={HANDLERS_COLOR}
              />
            </View>
            <Slider
              style={styles.rateSlider}
              value={this.state.rate / RATE_SCALE}
              onSlidingComplete={this._onRateSliderSlidingComplete}
              thumbTintColor="#000000"
              minimumTrackTintColor={HANDLERS_COLOR}
            />
            <View>
              <MaterialIcons
                name="call-made"
                size={40}
                color={HANDLERS_COLOR}
              />
            </View>
          </View>
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
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  detailsContainer: {
    height: 40,
    marginTop: 70,
    marginBottom: 260,
    alignItems: 'center',
  },
  playbackContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  playbackSlider: {
    alignSelf: 'stretch',
    marginLeft: 10,
    marginRight: 10,
  },
  text: {
    fontSize: FONT_SIZE,
    minHeight: FONT_SIZE,
  },
  buttonsContainerBase: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonsContainerTopRow: {
    maxHeight: 40,
    minWidth: DEVICE_WIDTH / 2.0,
    maxWidth: DEVICE_WIDTH / 2.0,
  },
  buttonsContainerMiddleRow: {
    maxHeight: 40,
    alignSelf: 'stretch',
    paddingRight: 20,
  },
  volumeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: DEVICE_WIDTH - 40,
    maxWidth: DEVICE_WIDTH - 40,
  },
  volumeSlider: {
    width: DEVICE_WIDTH - 80,
  },
  buttonsContainerBottomRow: {
    alignSelf: 'stretch',
  },
  rateSlider: {
    width: DEVICE_WIDTH - 80,
  },
});
