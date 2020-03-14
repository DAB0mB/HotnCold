import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions } from 'react-native';
import { PulseLoader as SuperPulseLoader } from 'react-native-indicator';

import { colors, hexToRgba } from '../../theme';
import { useConst } from '../../utils';

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;
const size = (height + width) / 2;
const pulseColors = [colors.hot, colors.cold];

class PulseLoader extends SuperPulseLoader {
  componentDidMount() {
    // DONT'T start animation on mount
  }
}

const RadarPulseLoader = ({ playing, delay = 2000, length = 3000 }) => {
  const self = useConst({
    expectedScanTime: 0,
  });
  self.delay = delay;
  self.length = length;

  const [colorIndex, setColorIndex] = useState(0);
  const color = useMemo(() => hexToRgba(pulseColors[colorIndex], .6), [colorIndex]);

  const initPulseLoader = useCallback((pulseLoader) => {
    if (!pulseLoader) return;

    const animation = pulseLoader._animation.bind(pulseLoader);

    // !DANGEROUS!
    pulseLoader._animation = function () {
      if (!self.playing) return;

      setColorIndex(i => ++i % 2);

      self.timeout = setTimeout(() => {
        self.expectedScanTime = Date.now() + self.length + self.delay;
        animation();
      }, self.expectedScanTime - Date.now());
    };

    self.pulseLoader = pulseLoader;
  }, [true]);

  useEffect(() => {
    self.playing = playing;

    if (playing) {
      self.pulseLoader._animation();
    }
    else {
      clearTimeout(self.timeout);
    }
  }, [playing]);

  useEffect(() => {
    return () => {
      clearTimeout(self.timeout);
    };
  }, [true]);

  return (
    <PulseLoader size={size} color={color} frequency={length} ref={initPulseLoader} />
  );
};

export default RadarPulseLoader;
