// Source: https://github.com/10clouds/FluidBottomNavigation-rn/blob/master/index.js

import React, { Component } from 'react';
import {
  View,
  Animated,
  Easing,
} from 'react-native';
import PropTypes from 'prop-types';

import { Hitbox } from '../../services/Hitbox';
import { colors } from '../../theme';

class BubblesBar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      activeBubble: props.activeBubble,
      bigBubble: props.bigBubble,
    };

    this.bigBubbleActiveSize = new Animated.Value(0);
    this.bigBubbleActiveOpacity = new Animated.Value(0);
    this.animatedItemValues = [];
    this.animatedBubbleValues = [];
    this.animatedMiniBubbleValues = [];
    this.animatedImageValues = [];

    this.props.bubbles.forEach((item, index) => {
      if (index === this.state.activeBubble) {
        this.animatedItemValues[index] = new Animated.Value(-30);
        this.animatedBubbleValues[index] = new Animated.Value(1);
        this.animatedImageValues[index] = new Animated.Value(1);
        this.animatedMiniBubbleValues[index] = new Animated.Value(1);
      }
      else {
        this.animatedItemValues[index] = new Animated.Value(0);
        this.animatedBubbleValues[index] = new Animated.Value(0);
        this.animatedImageValues[index] = new Animated.Value(0);
        this.animatedMiniBubbleValues[index] = new Animated.Value(0);
      }

    });
  }

  UNSAFE_componentWillReceiveProps = (props) => {
    const state = {};

    if ('activeBubble' in props && props.activeBubble !== this.state.activeBubble) {
      this.startAnimation(props.activeBubble);

      if (this.state.activeBubble !== null) {
        this.endAnimation(this.state.activeBubble);
      }

      state.activeBubble = props.activeBubble;
    }

    if ('bigBubble' in props && props.bigBubble !== this.state.bigBubble) {
      if (props.bigBubble.activated && !this.state.bigBubble.activated) {
        this.activateBigBubble('activeBubble' in state);
      }
      else if (!props.bigBubble.activated && this.state.bigBubble.activated) {
        this.deactivateBigBubble('activeBubble' in state);
      }

      state.bigBubble = props.bigBubble;
    }

    if (Object.keys(state).length) {
      this.setState(state);
    }
  }

  _renderBubbles = () => {
    return this.props.bubbles.map((item, index) => {
      const animatedBubbleScaleValues = this.animatedBubbleValues[
        index
      ].interpolate({
        inputRange: [0, 0.25, 0.4, 0.525, 0.8, 1],
        outputRange: [0.01, 3, 1.65, 1.65, 3.2, 3]
      });

      const animatedColorValues = this.animatedImageValues[index].interpolate({
        inputRange: [0, 1],
        outputRange: [this.props.tintColor, 'white']
      });

      const animatedBubbleStyle = {
        transform: [{ scale: animatedBubbleScaleValues }]
      };

      const animatedImageStyle = {
        tintColor: animatedColorValues
      };

      const animatedMiniBubbleTranslateValues = this.animatedMiniBubbleValues[
        index
      ].interpolate({
        inputRange: [0, 1],
        outputRange: [13, 0]
      });

      const animatedMiniBubbleHeightValues = this.animatedMiniBubbleValues[
        index
      ].interpolate({
        inputRange: [0, 0.01, 1],
        outputRange: [0, 1, 1]
      });

      const animatedMiniBubbleStyle = {
        opacity: animatedMiniBubbleHeightValues,
        transform: [{ translateY: animatedMiniBubbleTranslateValues }]
      };

      const animatedTitleValues = this.animatedBubbleValues[index].interpolate({
        inputRange: [0, 1],
        outputRange: [60, 60]
      });

      const animatedTitleStyle = {
        transform: [{ translateY: animatedTitleValues }]
      };

      return (
        <Hitbox
          key={index}
          onPress={() => {
            if (this.state.activeBubble !== index) {
              this.props.bubbles[index].onSelect();
            }
          }}
        >
          <View style={styles.item}>
            <View style={styles.itemMask} />
            <Animated.View
              style={[
                styles.bubble,
                { backgroundColor: this.props.tintColor },
                animatedBubbleStyle
              ]}
            />
            <Animated.View
              style={[
                styles.miniBubble,
                { backgroundColor: this.props.tintColor },
                animatedMiniBubbleStyle
              ]}
            />
            <Animated.Image source={item.iconSource} style={[styles.image, animatedImageStyle]} />
            <Animated.View style={[styles.titleContainer, animatedTitleStyle]}>
              <Animated.Text
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                style={{
                  color: this.props.tintColor
                }}
              >
                {item.title}
              </Animated.Text>
            </Animated.View>
          </View>
        </Hitbox>
      );
    });
  };

  _renderBigBubble = () => {
    return (
      <View style={styles.bigBubbleContainer}>
        <View  style={styles.bigBubbleContent}>
          <View style={styles.bigBubbleBlocker} />
          <Hitbox onPress={this.state.bigBubble.onPress} viewStyle={{ flex: 1 }}>
            <View style={[{ backgroundColor: this.state.bigBubble.inactiveBgColor }, styles.bigBubbleRipple]}>
              <View style={styles.bigBubbleReflection} />
              {this.props.bigBubble.icon}
              <Animated.View style={[{ height: 100, width: 100, opacity: this.bigBubbleActiveOpacity, backgroundColor: this.state.bigBubble.activeBgColor }, { transform: [{ scale: this.bigBubbleActiveSize }] }, styles.bigBubbleActiveLayer]}>
                <View style={styles.bigBubbleReflection} />
                {this.props.bigBubble.icon}
              </Animated.View>
            </View>
          </Hitbox>
        </View>
      </View>
    );
  };

  startAnimation = index => {
    Animated.parallel([
      Animated.timing(this.animatedItemValues[index], {
        toValue: -30,
        duration: 250,
        delay: 150,
        easing: Easing.in(Easing.elastic(1.5)),
        useNativeDriver: true
      }),
      Animated.timing(this.animatedMiniBubbleValues[index], {
        toValue: 1,
        duration: 500,
        delay: 150,
        useNativeDriver: true
      }),
      Animated.timing(this.animatedBubbleValues[index], {
        toValue: 1,
        duration: 400,
        easing: Easing.inOut(Easing.out(Easing.ease)),
        useNativeDriver: true
      }),
      Animated.timing(this.animatedImageValues[index], {
        toValue: 1,
        duration: 400
      })
    ]).start();
  };

  endAnimation = index => {
    Animated.parallel([
      Animated.timing(this.animatedItemValues[index], {
        toValue: 0,
        duration: 200,
        delay: 175,
        useNativeDriver: true
      }),
      Animated.timing(this.animatedMiniBubbleValues[index], {
        toValue: 0,
        duration: 1,
        useNativeDriver: true
      }),
      Animated.timing(this.animatedBubbleValues[index], {
        toValue: 0,
        duration: 375,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true
      }),
      Animated.timing(this.animatedImageValues[index], {
        toValue: 0,
        duration: 200,
        delay: 175
      })
    ]).start();
  };

  activateBigBubble = (newRoute) => {
    if (newRoute) {
      this.bigBubbleActiveSize.setValue(1);
      this.bigBubbleActiveOpacity.setValue(1);

      return;
    }

    Animated.parallel([
      Animated.timing(this.bigBubbleActiveSize, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(this.bigBubbleActiveOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  deactivateBigBubble = (newRoute) => {
    if (newRoute) {
      this.bigBubbleActiveSize.setValue(0);
      this.bigBubbleActiveOpacity.setValue(0);

      return;
    }

    Animated.parallel([
      Animated.timing(this.bigBubbleActiveSize, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(this.bigBubbleActiveOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  render() {
    return (
      <View style={styles.border}>
        <View style={styles.container}>
          {this._renderBubbles()}
          {this._renderBigBubble()}
        </View>
      </View>
    );
  }
}

BubblesBar.propTypes = {
  activeBubble: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  tintColor: PropTypes.string,
  bubbles: PropTypes.arrayOf(PropTypes.shape({
    onSelect: PropTypes.func,
    title: PropTypes.string,
    iconSource: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.shape({
        uri: PropTypes.string,
        scale: PropTypes.number,
      }),
    ]),
  })),
  bigBubble: PropTypes.shape({
    onPress: PropTypes.func,
    icon: PropTypes.element,
    activeBgColor: PropTypes.string,
    inactiveBgColor: PropTypes.string,
  }),
};

const styles = {
  border: {
    borderTopWidth: 1,
    borderColor: colors.lightGray,
    position: 'relative',
    height: 60,
  },
  container: {
    flexDirection: 'row',
    height: 60,
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'white'
  },
  item: {
    marginBottom: 60,
    borderRadius: 30,
    height: 60,
    width: 60,
    marginLeft: 25,
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemMask: {
    width: 60,
    height: 60,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.lightGray,
    backgroundColor: 'white',
    position: 'absolute'
  },
  bubble: {
    position: 'absolute',
    alignSelf: 'center',
    height: 17,
    width: 17,
    backgroundColor: '#4C53DD',
    borderRadius: 8.5
  },
  miniBubble: {
    position: 'absolute',
    alignSelf: 'center',
    width: 22,
    height: 22,
    backgroundColor: '#4C53DD',
    borderRadius: 11
  },
  image: {
    width: 30,
    height: 30,
  },
  titleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  bigBubbleContainer: {
    position: 'absolute',
    right: 25,
    bottom: 10,
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 999,
    backgroundColor: 'white',
  },
  bigBubbleContent: {
    position: 'relative',
    flex: 1,
    width: '100%',
  },
  bigBubbleBlocker: {
    position: 'absolute',
    bottom: -1,
    left: -1,
    right: -1,
    top: '50%',
    backgroundColor: 'white',
  },
  bigBubbleActiveLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  bigBubbleRipple: {
    margin: 5,
    position: 'absolute',
    left: 2.5,
    top: 2.5,
    right: 2.5,
    bottom: 2.5,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderColor: 'rgba(0, 0, 0, .05)',
    borderWidth: 2.5,
  },
  bigBubbleReflection: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, .05)',
    top: '50%',
    left: 0,
    right: 0,
    bottom: 0,
  },
};

export default BubblesBar;
