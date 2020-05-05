import { useRobot } from 'hotncold-robot';
import moment from 'moment';
import React, { useCallback, useMemo, useState, useLayoutEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MIcon from 'react-native-vector-icons/MaterialIcons';

import Bar from '../../components/Bar';
import Calendar from '../../components/Calendar';
import Hamburger from '../../components/Hamburger';
import Base from '../../containers/Base';
import * as mutations from '../../graphql/mutations';
import { useAppState } from '../../services/AppState';
import { useMine } from '../../services/Auth';
import { HitboxProvider } from '../../services/Hitbox';
import { useNavigation } from '../../services/Navigation';
import { colors } from '../../theme';
import { empty, useCallbackWhen } from '../../utils';
import { useAsyncCallback } from '../../utils';
import BubblesBar from './BubblesBar';
import SideMenu from './SideMenu';
import Status from './Status';

const loadingIcons = Promise.all([
  McIcon.getImageSource('map', 30, colors.hot),
  McIcon.getImageSource('cards-variant', 30, colors.hot),
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
  Activity: 1,
};

export const $Frame = {};

const Frame = ({
  nav: discoveryNav,
  children,
}) => {
  const mine = useMine();
  const { me } = mine;
  const baseNav = useNavigation(Base);
  const [activeBubble, setActiveBubble] = useState(Bubble.Map);
  const [icons, setIcons] = useState(empty);
  const [sideMenuOpened, setSideMenuOpened] = useState(false);
  const [title, setTitle] = useState('Map');
  const { useTrap } = useRobot();
  const [appState, setAppState] = useAppState();
  const timezone = me?.area?.timezone;

  const momentTz = useCallback((date) => {
    let m = moment(date);

    if (timezone) {
      m = m.tz(timezone);
    }

    return m;
  }, [timezone]);

  const minDate = useMemo(() => momentTz().startOf('day').toDate(), [momentTz]);
  const maxDate = useMemo(() => momentTz().startOf('day').add(3, 'months').toDate(), [momentTz]);

  // Don't trigger effects.
  // Will be used by child screens
  useMemo(() => {
    appState.discoveryTime = minDate;
  }, [true]);

  const calendarProps = {
    minDate,
    maxDate,
    current: appState.discoveryTime,
    visibleState: useState(false),
    onConfirm: useCallback((discoveryTime) => {
      if (discoveryTime === appState.discoveryTime) {
        return;
      }

      // Given time at the beginning of UTC day
      setAppState(appState => ({
        ...appState,
        discoveryTime,
      }));
    }, [appState]),
  };

  useLayoutEffect(() => {
    loadingIcons.then(([map, activity]) => {
      setIcons({ map, activity });
    });
  }, [true]);

  useLayoutEffect(() => {
    if (!discoveryNav) return;

    setActiveBubble(Bubble[discoveryNav.state.routeName]);
  }, [discoveryNav]);

  const Activity = useCallbackWhen(() => {
    discoveryNav.push('Activity');
    setTitle('Activity');
  }, activeBubble != Bubble.Activity && discoveryNav?.state.routeName === 'Map' && icons !== empty);

  const navToMap = useCallbackWhen(() => {
    discoveryNav.goBackOnceFocused();
    setTitle('Map');
  }, activeBubble != Bubble.Map && discoveryNav?.state.routeName === 'Activity' && icons !== empty);

  const openSideMenu = useCallback(() => {
    setSideMenuOpened(true);
  }, [true]);

  const closeSideMenu = useCallback(() => {
    setSideMenuOpened(false);
  }, [true]);

  const bigBubble = {
    backgroundColor: colors.cold,
    icon: (
      <MIcon name='person-pin-circle' size={50} color='white' />
    ),
    onPress: useCallback(() => {
      baseNav.push('MessageEditor', {
        maxLength: 150,
        placeholder: 'What\'s on your mind?',
        useMutation(text, options) {
          return mutations.createStatus.use(text, options);
        },
        useSaveHandler(createStatus) {
          const [appState] = useAppState();

          return useAsyncCallback(function* () {
            const location = yield appState.discoveryMap.current.getCenter();

            // TODO: Create status at a specific time of the day
            // For now the status will be published exactly at the end of the day
            createStatus(location, moment(appState.discoveryTime).add(1, 'day').subtract(1, 's').toDate());
          }, [createStatus, appState]);
        },
      });
    }, [baseNav]),
  };

  const bubbles = [
    { title: 'Map', iconSource: icons.map, onSelect: navToMap },
    { title: 'Activity', iconSource: icons.activity, onSelect: Activity },
  ];

  useTrap($Frame, {
    Activity,
    navToMap,
    openSideMenu,
    closeSideMenu,
  });

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <SideMenu opened={sideMenuOpened} onClose={closeSideMenu}>
        <HitboxProvider>
          <Bar>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{title}</Text>
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
            bubbles={bubbles}
          />
        </HitboxProvider>

        <Status />
      </SideMenu>

      <Calendar style={{ position: 'absolute', top: 10, right: 10 }} timezone={timezone} {...calendarProps} />
    </View>
  );
};

export default Frame;
