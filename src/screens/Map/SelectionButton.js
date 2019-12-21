import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableWithoutFeedback, Animated } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { colors } from '../../theme';

const RADIUS = 70;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'row',
    bottom: 20,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usersContainer: {
    width: RADIUS,
    height: RADIUS,
    borderRadius: 999,
    borderColor: colors.ink,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
  },
  mulContainer: {
    marginTop: -5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mul: {
    marginRight: 2,
  },
  mulText: {
    fontSize: 10,
    color: colors.ink,
    textAlign: 'center',
  },
  sizeText: {
    fontSize: 16,
    color: colors.ink,
  },
  close: {
    width: 30,
    height: 30,
    backgroundColor: colors.ink,
    marginBottom: RADIUS - 5,
    marginLeft: RADIUS - 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
  },
  closeText: {
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    marginBottom: 1,
  },
});

const SelectionButton = ({ onUsersPress = () => {}, onClosePress = () => {}, selection }) => {
  const [selectionSize, setSelectionSize] = useState(0);
  const [bottomAnim] = useState(() => new Animated.Value(-100));

  useEffect(() => {
    if (selection) {
      setSelectionSize(selection.size);

      Animated.timing(bottomAnim, {
        toValue: 20,
        duration: 250,
      }).start();
    }
    else {
      Animated.timing(bottomAnim, {
        toValue: -100,
        duration: 250,
      }).start(() => {
        setSelectionSize(0);
      });
    }
  }, [selection]);

  return (
    <Animated.View style={[styles.container, { bottom: bottomAnim }]}>
      <TouchableWithoutFeedback onPress={onUsersPress}>
        <View style={styles.usersContainer}>
          <View>
            <McIcon name='account' size={32} color={colors.ink} />
          </View>
          <View style={styles.mulContainer}>
            <View style={styles.mul}>
              <Text style={styles.mulText}>✕</Text>
            </View>
            <View>
              <Text style={styles.sizeText}>{selectionSize}</Text>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>

      <TouchableWithoutFeedback onPress={onClosePress}>
        <View style={styles.close}>
          <Text style={styles.closeText}>✖</Text>
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

export default SelectionButton;
