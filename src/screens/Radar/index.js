import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, Image, StyleSheet, View, Text, FlatList, TouchableWithoutFeedback } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import Discovery from '../../containers/Discovery';
import * as mutations from '../../graphql/mutations';
import * as queries from '../../graphql/queries';
import { useMine } from '../../services/Auth';
import { useAppState } from '../../services/AppState';
import { useAlertError } from '../../services/DropdownAlert';
import { useScreenFrame } from '../../services/Frame';
import { useNavigation } from '../../services/Navigation';
import { colors } from '../../theme';
import { useAsyncCallback, useSelf } from '../../utils';
import PulseLoader from './PulseLoader';

const USER_AVATAR_SIZE = Dimensions.get('window').width / 3 - Dimensions.get('window').width / 16;
const USERS_LIST_PADDING = Dimensions.get('window').width / 3 / 1.7;
const SCAN_INTERVAL = 60 * 1000;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  absoluteLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
  },
  userAvatar: {
    width: USER_AVATAR_SIZE,
    height: USER_AVATAR_SIZE,
    borderRadius: 999,
  },
  userName: {
    color: colors.ink,
    fontSize: 17,
  },
  usersListContent: {
    marginVertical: 10,
  },
  usersListCol: {
    justifyContent: 'space-between',
    overflow: 'visible',
  },
});

const extractUserKey = u => u.id;
let expectedScanTime = 0;

const Radar = () => {
  const self = useSelf();
  const { me } = useMine();
  const discoveryNav = useNavigation(Discovery);
  const alertError = useAlertError();
  const [, , reduceAppState] = useAppState();
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [bigBubbleActivated, setBigBubbleActivated] = useState(() => !!me.discoverable);

  const [queryNearbyUsers, nearbyUsersQuery] = queries.nearbyUsers.use.lazy({
    onCompleted: useAsyncCallback(function* (data) {
      if (!data) {
        alertError('Network Error: Network request failed');

        return;
      }

      const { nearbyUsers } = data;

      if (!nearbyUsers) return;

      yield Promise.all(
        nearbyUsers.map(u => Image.prefetch(u.avatar))
      );

      setFetchingUsers(false);
      setNearbyUsers(nearbyUsers);
    }, [alertError]),
    onError: alertError,
  });

  const [makeDiscoverable] = mutations.makeDiscoverable.use({
    onError: alertError,
  });

  const [makeIncognito] = mutations.makeIncognito.use({
    onError: alertError,
  });

  discoveryNav.useBackListener();

  const onBigBubblePress = useAsyncCallback(function* () {
    if (bigBubbleActivated) {
      yield makeIncognito();

      setNearbyUsers([]);
      stopScanning();
    }
    else {
      yield makeDiscoverable();

      startScanning();
    }
  }, [bigBubbleActivated, makeIncognito, makeDiscoverable]);

  const startScanning = self.startScanning = useCallback(() => {
    self.scanning = true;

    if (expectedScanTime - Date.now() <= 0) {
      expectedScanTime = Date.now() + SCAN_INTERVAL;

      setFetchingUsers(true);
      queryNearbyUsers({
        fetchPolicy: 'cache-and-network',
      });
    }
    else {
      queryNearbyUsers({
        fetchPolicy: 'cache-only',
      });
    }

    self.scanTimeout = setTimeout(() => {
      self.startScanning();
    }, expectedScanTime - Date.now());
  }, [queryNearbyUsers]);

  const stopScanning = self.stopScanning = useCallback(() => {
    self.scanning = false;
    clearTimeout(self.scanTimeout);
  }, [true]);

  useEffect(() => {
    if (me.discoverable) {
      startScanning();
    }

    return () => {
      stopScanning();
    };
  }, [true]);

  useEffect(() => {
    setBigBubbleActivated(me.discoverable);
  }, [me.discoverable]);

  useScreenFrame({
    bigBubble: useMemo(() => ({
      icon: <McIcon name='podcast' size={50} color='white' />,
      onPress: onBigBubblePress,
      activated: bigBubbleActivated,
    }), [bigBubbleActivated, onBigBubblePress]),
  });

  const renderUserItem = useCallback(({ item: user }) => {
    const onPress = () => {
      reduceAppState(appState => ({
        ...appState,
        activeStatus: {
          user: user,
          status: user.status,
          isPartial: true,
          isNow: true,
        },
      }));
    };

    return (
      <TouchableWithoutFeedback onPress={onPress}>
        <View style={[styles.userItemContainer]}>
          <Image style={styles.userAvatar} source={{ uri: user.avatar }} />
          <Text style={styles.userName}>{user.name}</Text>
        </View>
      </TouchableWithoutFeedback>
    );
  }, [true]);

  return (
    <View style={styles.container}>
      <View style={styles.absoluteLayer}>
        <PulseLoader playing={bigBubbleActivated} />
      </View>

      {!bigBubbleActivated && (
        <View style={[styles.absoluteLayer, { padding: 50 }]}>
          <Text style={{ textAlign: 'center' }}>Please turn <Text style={{ fontWeight: '900' }}>ON</Text> your radar to start scanning for people.</Text>
        </View>
      )}

      {bigBubbleActivated && (
        <React.Fragment>
          {nearbyUsersQuery.called && !fetchingUsers && !nearbyUsers.length && (
            <View style={[styles.absoluteLayer, { padding: 50 }]}>
              <Text style={{ textAlign: 'center' }}>No one nearby was found. Keep exploring!</Text>
            </View>
          )}

          <FlatList
            numColumns={3}
            contentContainerStyle={[styles.usersListContent, nearbyUsers.length % 3 == 0 && { paddingBottom: USERS_LIST_PADDING }].filter(Boolean)}
            columnWrapperStyle={styles.usersListCol}
            data={nearbyUsers}
            keyExtractor={extractUserKey}
            renderItem={renderUserItem}
          />
        </React.Fragment>
      )}
    </View>
  );
};

export default Discovery.create(Radar);
