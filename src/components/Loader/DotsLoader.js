// Source: https://github.com/wangdicoder/react-native-indicator/blob/master/lib/loader/DotsLoader.js

import { Surface } from '@react-native-community/art';
import React from 'react';
import PropTypes from 'prop-types';
import { Animated } from 'react-native';

import { colors } from '../../theme';
import AnimatedCircle from './AnimatedCircle';

export default class DotsLoader extends React.PureComponent {
  static propTypes = {
    colors: PropTypes.arrayOf(PropTypes.string),
    size: PropTypes.number,
    betweenSpace: PropTypes.number
  };

  static defaultProps = {
    colors: [colors.hot, colors.cold],
    size: 15,
    betweenSpace: 15
  };

  state = {
    scales: [new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)],
    iteration: 0,
  };

  componentDidMount() {
    this._animation();
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  _animation = () => {
    function seq(self, i) {
      return Animated.sequence([
        Animated.timing(self.state.scales[i], {
          toValue: 1,
          duration: 300,
          delay: (i + 1) * 200,
          useNativeDriver: false,
        }),
        Animated.timing(self.state.scales[i], {
          toValue: 0,
          duration: 300,
          delay: 50,
          useNativeDriver: false,
        })
      ]);
    }

    Animated.parallel([
      seq(this, 0), seq(this, 1), seq(this, 2)
    ]).start(() => {
      if (!this.unmounted)
        this.setState({
          iteration: this.state.iteration + 1,
        }, () => {
          this._animation();
        });
    });
  };

  _renderCircle = (i) => {
    const { colors, size, betweenSpace } = this.props;
    const color = colors[this.state.iteration % colors.length];
    return (
      <AnimatedCircle
        radius={size}
        fill={color}
        x={size / 2 + i * (size + betweenSpace)}
        y={size / 2}
        scale={this.state.scales[i]}
      />
    );
  };

  render() {
    const { size, betweenSpace } = this.props;
    return (
      <Surface width={size * 3 + betweenSpace * 2} height={size}>
        {this._renderCircle(0)}
        {this._renderCircle(1)}
        {this._renderCircle(2)}
      </Surface>
    );
  }
}