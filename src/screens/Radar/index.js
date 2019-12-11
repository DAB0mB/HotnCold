import { bytesToString } from 'convert-string';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Animated, StyleSheet, Image, View, TouchableWithoutFeedback, Dimensions, Text } from 'react-native';
import { RippleLoader } from 'react-native-indicator';
import CONFIG from 'react-native-config';

import Base from '../../containers/Base';
import Discovery from '../../containers/Discovery';
import * as queries from '../../graphql/queries';
import { useMe } from '../../services/Auth';
import { useBluetoothLE, BluetoothLEProvider } from '../../services/BluetoothLE';
import { useAlertError } from '../../services/DropdownAlert';
import { useNavigation } from '../../services/Navigation';
import { colors } from '../../theme';
import { pick, pickRandom } from '../../utils';
import UserAvatar from './UserAvatar';

const noop = () => {};

const MY_AVATAR_SIZE = Dimensions.get('window').width / 3;
const USER_AVATAR_SIZE = MY_AVATAR_SIZE / 3;
const AVATARS_LAYER_SIZE = MY_AVATAR_SIZE * 3;

const picsIndexes = Array.apply(null, { length: ((MY_AVATAR_SIZE / USER_AVATAR_SIZE) * (AVATARS_LAYER_SIZE / MY_AVATAR_SIZE)) ** 2 }).map((_, ij) => {
  const i = ij % ((MY_AVATAR_SIZE / USER_AVATAR_SIZE) * (AVATARS_LAYER_SIZE / MY_AVATAR_SIZE));
  const j = Math.floor(ij / ((MY_AVATAR_SIZE / USER_AVATAR_SIZE) * (AVATARS_LAYER_SIZE / MY_AVATAR_SIZE)));

  if (j % 2 == 1 && i % 2 == 1) {
    return null;
  }

  if (j % 2 == 0 && i % 2 == 0) {
    return null;
  }

  if (!i) {
    return null;
  }

  if (i == (MY_AVATAR_SIZE / USER_AVATAR_SIZE) * (AVATARS_LAYER_SIZE / MY_AVATAR_SIZE) - 1) {
    return null;
  }

  if (
    i < (MY_AVATAR_SIZE / USER_AVATAR_SIZE) * (AVATARS_LAYER_SIZE / MY_AVATAR_SIZE) - (MY_AVATAR_SIZE / USER_AVATAR_SIZE) && i >= (MY_AVATAR_SIZE / USER_AVATAR_SIZE) &&
    j < (MY_AVATAR_SIZE / USER_AVATAR_SIZE) * (AVATARS_LAYER_SIZE / MY_AVATAR_SIZE) - (MY_AVATAR_SIZE / USER_AVATAR_SIZE) && j >= (MY_AVATAR_SIZE / USER_AVATAR_SIZE)
  ) {
    return null;
  }

  return [i, j];
}).filter(Boolean);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'column',
    flex: 1,
  },
  absoluteLayer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainText: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.ink,
    textAlign: 'center',
    margin: 30,
    position: 'absolute',
    bottom: 0,
  },
  profilePicture: {
    width: MY_AVATAR_SIZE,
    height: MY_AVATAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderRadius: 999,
    resizeMode: 'contain',
    overflow: 'hidden',
  },
});

const Radar = () => {
  const me = useMe();
  const ble = useBluetoothLE();
  const discoveryNavigation = useNavigation(Discovery);
  const baseNav = useNavigation(Base);
  const alertError = useAlertError();
  const [mainText, setMainText] = useState('Tap on yourself to discover people');
  const [discoveredUsers, setDiscoveredUsers] = useState(() => picsIndexes.map(() => null));
  const discoveredUsersRef = useRef(null); discoveredUsersRef.current = discoveredUsers;
  const [scanning, setScanning] = useState(false);
  const [queryUserProfile] = queries.userProfile.use.lazy({
    onError: alertError,
    onCompleted: useCallback((data) => {
      const userProfile = data.userProfile;

      if (userProfile && !discoveredUsers.some(u => u && u.id == userProfile.id)) {
        const nullIndexes = discoveredUsers.filter(u => !u).map((u, i) => i);
        const i = pickRandom(nullIndexes);

        setDiscoveredUsers([]
          .concat(discoveredUsers.slice(0, i))
          .concat(userProfile)
          .concat(discoveredUsers.slice(i + 1))
        );

        if (nullIndexes.length == 1) {
          stopScan();
        }
      }
    }, [discoveredUsers]),
  });

  // TODO: Send a couple of query batches, after 2 seconds and after 3 seconds of scanning
  useEffect(() => {
    let discoveredUsersIds = [];

    const onDiscoverPeripheral = (peripheral) => {
      if (peripheral.name !== CONFIG.BLUETOOTH_ADAPTER_NAME) return;

      const userId = peripheral.advertising.serviceUUIDs[0];

      if (discoveredUsersIds.includes(userId)) return;

      discoveredUsersIds.push(userId);

      queryUserProfile({
        variables: { userId },
      });
    };

    const onStopScan = () => {
      setScanning(false);

      const discoveredUsers = discoveredUsersRef.current.filter(Boolean);

      // In dev mode we might get extra (dummy) users
      if (discoveredUsers.length == 1) {
        setMainText(`Found 1 available person in the venue`);
      }
      else if (discoveredUsers.length) {
        setMainText(`Found ${discoveredUsers.length} available people in the venue`);
      }
      else {
        setMainText(`No one was found. Try looking in the map`);
      }

      discoveredUsersIds = [];
    };

    ble.emitter.addListener('BleManagerDiscoverPeripheral', onDiscoverPeripheral);
    ble.emitter.addListener('BleManagerStopScan', onStopScan);

    return () => {
      ble.emitter.removeListener('BleManagerDiscoverPeripheral', onDiscoverPeripheral);
      ble.emitter.removeListener('BleManagerStopScan', onStopScan);

      if (scanning) {
        ble.central.stopScan();
      }
    };
  }, [true]);

  discoveryNavigation.useBackListener();

  const stopScan = useCallback(() => {
    let stoppingScan;

    if (scanning) {
      stoppingScan = ble.central.stopScan();
    } else {
      stoppingScan = Promise.resolve();
    }

    return stoppingScan.catch(alertError);
  }, [ble.central]);

  const scan = useCallback(() => {
    stopScan().then(() => {
      return ble.central.scan([], 5, false);
    }).then(() => {
      setMainText('Looking for available people in the venue');
      setScanning(true);
      setDiscoveredUsers(() => picsIndexes.map(() => null));

      if (me.name === '__TEST__') {
        queryUserProfile({
          variables: { randomMock: true },
        });
      }
    }).catch(alertError);
  }, [ble.central]);

  const navToUserProfile = useCallback((user) => {
    baseNav.push('Profile', { user });
  }, [baseNav]);

  return (
    <View style={styles.container}>
      {scanning && (
        <View style={styles.absoluteLayer}>
          <RippleLoader size={MY_AVATAR_SIZE * 2.5} color={colors.hot} />
        </View>
      )}
      <View style={styles.absoluteLayer}>
        <TouchableWithoutFeedback onPress={scanning ? noop : scan}>
          <View style={[styles.profilePicture, { borderColor: scanning ? colors.hot : colors.cold }]}>
            <Image source={{ uri: me.avatar }} resizeMode={styles.profilePicture.resizeMode} style={pick(styles.profilePicture, ['width', 'height'])} />
          </View>
        </TouchableWithoutFeedback>
      </View>
      <View style={styles.absoluteLayer}>
        <View style={{ width: AVATARS_LAYER_SIZE, height: AVATARS_LAYER_SIZE, position: 'relative' }}>
          {picsIndexes.map(([i, j], k) => discoveredUsers[k] && (
            <UserAvatar key={k} i={i} j={j} user={discoveredUsers[k]} onPress={navToUserProfile} avatarSize={USER_AVATAR_SIZE} />
          )).filter(Boolean)}
        </View>
      </View>
      <Text style={styles.mainText}>{mainText}</Text>
    </View>
  );
};

export default Discovery.create(Radar);
