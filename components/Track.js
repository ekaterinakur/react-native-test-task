import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TouchableHighlight,
} from 'react-native';

export default class Tracks extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <TouchableHighlight
        style={styles.button}
        onPress={() => this.props.navigation.navigate('Player', {
          index: `${this.props.item.id}`,
        })
        }
      >
        <Text style={styles.text}>
          {this.props.item.name}
        </Text>
      </TouchableHighlight>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    padding: 10,
    paddingLeft: 20,
    backgroundColor: 'rgba(256, 256, 256, .4)',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    minHeight: 16,
  },
});
