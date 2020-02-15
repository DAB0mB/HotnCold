import { useRobot } from 'hotncold-robot';
import React, { useState, useLayoutEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import Bar from '../../components/Bar';
import Hamburger from '../../components/Hamburger';
import { colors } from '../../theme';
import { useCallbackWhen } from '../../utils';
import BubblesBar from './BubblesBar';
import SideMenu from './SideMenu';

const loadingIcons = Promise.all([
  McIcon.getImageSource('map', 30, colors.hot),
  McIcon.getImageSource('radar', 30, colors.hot),
]);

const styles = StyleSheet.create({
  gradient: {
    width: '100%',
    position: 'absolute',
    padding: 10,
    left: 0,
    top: 0,
  },
  container: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    left: 0,
    top: 0,
  },
  logo: {
    height: 20,
    resizeMode: 'contain',
    flex: 1,
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: colors.ink,
  },
});

const empty = {};
const noop = () => {};

const Bubble = {
  Map: 0,
  Radar: 1,
};

export const $Frame = Symbol('Frame');

const Frame = ({
  nav: discoveryNav,
  bigBubble: bigBubbleProp = empty,
  children,
}) => {
  const [activeBubble, setActiveBubble] = useState(Bubble.Map);
  const [icons, setIcons] = useState(empty);
  const [sideMenuOpened, setSideMenuOpened] = useState(false);
  const [bigBubble, setBigBubble] = useState({
    activeBgColor: colors.hot,
    inactiveBgColor: colors.cold,
    inactiveIconName: 'mailbox',
    activeIconName: 'mailbox-open',
    onPress: noop,
  });
  const { useTrap } = useRobot();

  useLayoutEffect(() => {
    setBigBubble(bigBubble => ({
      ...bigBubble,
      ...bigBubbleProp,
    }));
  }, [bigBubbleProp]);

  useLayoutEffect(() => {
    loadingIcons.then(([map, radar]) => {
      setIcons({ map, radar });
    });
  }, [true]);

  useLayoutEffect(() => {
    if (!discoveryNav) return;

    setActiveBubble(Bubble[discoveryNav.state.routeName]);
  }, [discoveryNav]);

  const goToRadar = useCallbackWhen(() => {
    discoveryNav.push('Radar');
  }, activeBubble != Bubble.Radar && discoveryNav?.state.routeName === 'Map' && icons !== empty);

  const goToMap = useCallbackWhen(() => {
    discoveryNav.goBackOnceFocused();
  }, activeBubble != Bubble.Map && discoveryNav?.state.routeName === 'Radar' && icons !== empty);

  useTrap($Frame, {
    goToRadar,
    goToMap,
  });

  return (
    <View style={{ flex: 1 }}>
      <SideMenu opened={sideMenuOpened} onClose={() => setSideMenuOpened(false)}>
        <Bar>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Map</Text>
          </View>

          <View style={{ position: 'absolute', left: 0 }}>
            <Hamburger color={colors.hot} type='cross' onPress={() => setSideMenuOpened(true)} active={sideMenuOpened} />
          </View>
        </Bar>

        <View style={{ flex: 1 }}>{children}</View>

        <BubblesBar
          activeBubble={activeBubble}
          tintColor={colors.hot}
          bigBubble={bigBubble}
          bubbles={[
            { title: 'Map', iconSource: icons.map, onSelect: goToMap },
            { title: 'Radar', iconSource: icons.radar, onSelect: goToRadar },
          ]}
        />
      </SideMenu>
    </View>
  );
};

export default Frame;
