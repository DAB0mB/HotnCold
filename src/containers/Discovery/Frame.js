import { useRobot } from 'hotncold-robot';
import moment from 'moment';
import React, { useCallback, useMemo, useState, useLayoutEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import Bar from '../../components/Bar';
import Calendar from '../../components/Calendar';
import Hamburger from '../../components/Hamburger';
import { useAppState } from '../../services/AppState';
import { useMine } from '../../services/Auth';
import { HitboxProvider } from '../../services/Hitbox';
import { colors } from '../../theme';
import { empty, noop, useCallbackWhen } from '../../utils';
import BubblesBar from './BubblesBar';
import SideMenu from './SideMenu';
import Status from './Status';

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

const Bubble = {
  Map: 0,
  Radar: 1,
};

export const $Frame = {};

const Frame = ({
  nav: discoveryNav,
  bigBubble: bigBubbleProp = empty,
  children,
}) => {
  const mine = useMine();
  const [activeBubble, setActiveBubble] = useState(Bubble.Map);
  const [icons, setIcons] = useState(empty);
  const [sideMenuOpened, setSideMenuOpened] = useState(false);
  const [activeStatus, setActiveStatus] = useState();
  const [bigBubble, setBigBubble] = useState({
    activeBgColor: colors.hot,
    inactiveBgColor: colors.cold,
    icon: require('../../screens/Map').mapBubbleIcon,
    onPress: noop,
  });
  const { useTrap } = useRobot();
  const [appState, setAppState] = useAppState();

  const calendarProps = {
    minDate: useMemo(() => moment().toDate(), [true]),
    maxDate: useMemo(() => moment().add(3, 'months').toDate(), [true]),
    current: appState.discoveryTime,
    visibleState: useState(false),
    onConfirm: useCallback((discoveryTime) => {
      setAppState(appState => ({
        ...appState,
        discoveryTime,
      }));
    }, [true]),
  };

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

  const navToRadar = useCallbackWhen(() => {
    discoveryNav.push('Radar');
  }, activeBubble != Bubble.Radar && discoveryNav?.state.routeName === 'Map' && icons !== empty);

  const navToMap = useCallbackWhen(() => {
    discoveryNav.goBackOnceFocused();
  }, activeBubble != Bubble.Map && discoveryNav?.state.routeName === 'Radar' && icons !== empty);

  const openSideMenu = useCallback(() => {
    setSideMenuOpened(true);
  }, [true]);

  const showActiveStatus = useCallback(() => {
    setActiveStatus({
      user: mine.me,
      status: mine.me.status || { id: '' },
    });
  }, [mine]);

  const hideActiveStatus = useCallback(() => {
    setActiveStatus(null);
  }, [true]);

  const closeSideMenu = useCallback(() => {
    hideActiveStatus();

    setSideMenuOpened(false);
  }, [hideActiveStatus]);

  useTrap($Frame, {
    navToRadar,
    navToMap,
    openSideMenu,
    closeSideMenu,
  });

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <SideMenu opened={sideMenuOpened} onClose={closeSideMenu} showStatus={showActiveStatus}>
        <HitboxProvider>
          <Bar>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Map</Text>
            </View>

            <View style={{ position: 'absolute', left: 0 }}>
              <Hamburger color={colors.hot} type='cross' onPress={openSideMenu} active={sideMenuOpened} />
            </View>

            <View style={{ position: 'absolute', right: 0 }}>
              <McIcon name='calendar' size={30} color={colors.hot} onPress={() => calendarProps.visibleState[1](true)} />
            </View>
          </Bar>

          <View style={{ flex: 1 }}>{children}</View>

          <BubblesBar
            activeBubble={activeBubble}
            tintColor={colors.hot}
            bigBubble={bigBubble}
            bubbles={[
              { title: 'Map', iconSource: icons.map, onSelect: navToMap },
              { title: 'Radar', iconSource: icons.radar, onSelect: navToRadar },
            ]}
          />
        </HitboxProvider>

        <Status />
      </SideMenu>

      <Status hideTime activeStatus={activeStatus} hideActiveStatus={hideActiveStatus} />
      <Calendar style={{ position: 'absolute', top: 10, right: 10 }} {...calendarProps} />
    </View>
  );
};

export default Frame;
