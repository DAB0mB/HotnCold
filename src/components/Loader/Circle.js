import PropTypes from 'prop-types';
import React from 'react';
import { ART } from 'react-native';

const { Shape, Path } = ART;

class Circle extends React.PureComponent {
  static propTypes = {
    radius: PropTypes.number.isRequired,
    opacity: PropTypes.number
  };

  render() {
    const { radius } = this.props;

    const path = Path()
      .moveTo(0, -radius/2)
      .arc(0, radius, 1)
      .arc(0, -radius, 1)
      .close();

    return <Shape {...this.props} d={path}/>;
  }
}

export default Circle;
