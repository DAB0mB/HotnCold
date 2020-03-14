import React, {
  createContext,
  useRef,
  useMemo,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
} from 'react';
import { findNodeHandle, Animated, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import uuid from 'uuid/v4';

import { useConst } from '../utils';

// Use this for debugging purposes, but always remember to turn it off
const DISPLAY_HITBOXES = false;

const HitboxContext = createContext();

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  hitbox: {
    position: 'absolute',
  },
  border: {
    position: 'absolute',
    borderWidth: 1,
  },
});

export const HitboxProvider = ({ children }) => {
  const [hitboxes, setHitboxes] = useState([]);
  const containerRef = useRef(null);
  const [layout, setLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const context = useMemo(() => ({
    ...layout,
    ref: containerRef,
    setHitboxes,
  }), [layout]);

  const onLayout = useCallback(() => {
    containerRef.current.measure((_x, _y, width, height, x, y) => {
      setLayout({ x, y, width, height });
    });
  }, [true]);

  return (
    <React.Fragment>
      <HitboxContext.Provider value={context}>
        <View style={styles.container} ref={containerRef} onLayout={onLayout} pointerEvents='box-none'>
          {children}
          {hitboxes.map(h => h())}
          {DISPLAY_HITBOXES && (
            <View style={[styles.border, { left: 0, right: 0, top: 0, bottom: 0 }, { borderColor: 'red' }]} pointerEvents='box-none' />
          )}
        </View>

      </HitboxContext.Provider>
    </React.Fragment>
  );
};

const useHitbox = ({ x, y, width, height, transform, onPress }) => {
  const self = useConst();
  const context = useContext(HitboxContext);
  const [key] = useState(uuid);

  self.onPress = onPress;

  useLayoutEffect(() => {
    const onPress = (...args) => self.onPress(...args);

    const style = [
      // Use animated values for dynamic transforms, although not necessary
      { transform },
      styles.hitbox,
      {
        left: x,
        top: y,
        width,
        height
      },
    ];

    const hitbox = () => (
      <React.Fragment key={key}>
        <TouchableWithoutFeedback onPress={onPress}>
          <Animated.View style={style} />
        </TouchableWithoutFeedback>
        {DISPLAY_HITBOXES && (
          <Animated.View style={[style, styles.border, { borderColor: 'blue' }]} pointerEvents='box-none' />
        )}
      </React.Fragment>
    );

    context.setHitboxes(hitboxes => [ ...hitboxes, hitbox ]);

    return () => {
      context.setHitboxes((hitboxes) => {
        const index = hitboxes.indexOf(hitbox);

        return [ ...hitboxes.slice(0, index), ...hitboxes.slice(index + 1) ];
      });
    };
  }, [true]);
};

export const Hitbox = ({ viewStyle, transform, onPress, children }) => {
  const container = useContext(HitboxContext);
  const hitboxRef = useRef(null);

  const layout = useMemo(() => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    width: new Animated.Value(0),
    height: new Animated.Value(0),
  }), [true]);

  const onLayout = useCallback(() => {
    hitboxRef.current.measure(Animated.event([null, null, layout.width, layout.height]));
  }, [true]);

  useLayoutEffect(() => {
    if (!container.ref.current) return;

    hitboxRef.current.measureLayout(
      findNodeHandle(container.ref.current),
      Animated.event([layout.x, layout.y])
    );
  }, [container.x, container.y, container.width, container.height]);

  useHitbox({ ...layout, transform, onPress });

  return (
    <View style={viewStyle} ref={hitboxRef} onLayout={onLayout}>
      {children}
    </View>
  );
};
