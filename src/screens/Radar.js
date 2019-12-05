import { bytesToString } from 'convert-string';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Animated, StyleSheet, Image, View, TouchableWithoutFeedback, Dimensions, Text } from 'react-native';
import { RippleLoader } from 'react-native-indicator';
import CONFIG from 'react-native-config';

import Base from '../containers/Base';
import Discovery from '../containers/Discovery';
import * as queries from '../graphql/queries';
import { useMe } from '../services/Auth';
import { useBluetoothLE, BluetoothLEProvider } from '../services/BluetoothLE';
import { useAlertError } from '../services/DropdownAlert';
import { useNavigation } from '../services/Navigation';
import { colors } from '../theme';
import { pick, pickRandom } from '../utils';

const noop = () => {};

const MY_PIC_SIZE = Dimensions.get('window').width / 3;
const PEOPLE_PIC_SIZE = MY_PIC_SIZE / 3;
const PICS_LAYER_SIZE = MY_PIC_SIZE * 3;

const picsIndexes = Array.apply(null, { length: ((MY_PIC_SIZE / PEOPLE_PIC_SIZE) * (PICS_LAYER_SIZE / MY_PIC_SIZE)) ** 2 }).map((_, ij) => {
  const i = ij % ((MY_PIC_SIZE / PEOPLE_PIC_SIZE) * (PICS_LAYER_SIZE / MY_PIC_SIZE));
  const j = Math.floor(ij / ((MY_PIC_SIZE / PEOPLE_PIC_SIZE) * (PICS_LAYER_SIZE / MY_PIC_SIZE)));

  if (j % 2 == 1 && i % 2 == 1) {
    return null;
  }

  if (j % 2 == 0 && i % 2 == 0) {
    return null;
  }

  if (!i) {
    return null;
  }

  if (i == (MY_PIC_SIZE / PEOPLE_PIC_SIZE) * (PICS_LAYER_SIZE / MY_PIC_SIZE) - 1) {
    return null;
  }

  if (
    i < (MY_PIC_SIZE / PEOPLE_PIC_SIZE) * (PICS_LAYER_SIZE / MY_PIC_SIZE) - (MY_PIC_SIZE / PEOPLE_PIC_SIZE) && i >= (MY_PIC_SIZE / PEOPLE_PIC_SIZE) &&
    j < (MY_PIC_SIZE / PEOPLE_PIC_SIZE) * (PICS_LAYER_SIZE / MY_PIC_SIZE) - (MY_PIC_SIZE / PEOPLE_PIC_SIZE) && j >= (MY_PIC_SIZE / PEOPLE_PIC_SIZE)
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
    width: MY_PIC_SIZE,
    height: MY_PIC_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderRadius: 999,
    resizeMode: 'contain',
    overflow: 'hidden',
  },
  peoplePicture: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
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

      if (me.lastName === '__TEST__') {
        queryUserProfile({
          variables: { userId: '__MOCK__' },
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
          <RippleLoader size={MY_PIC_SIZE * 2.5} color={colors.hot} />
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
        <View style={{ width: PICS_LAYER_SIZE, height: PICS_LAYER_SIZE, position: 'relative' }}>
          {picsIndexes.map(([i, j], k) => discoveredUsers[k] && (
            <PeoplePicture key={k} i={i} j={j} user={discoveredUsers[k]} onPress={navToUserProfile} />
          )).filter(Boolean)}
        </View>
      </View>
      <Text style={styles.mainText}>{mainText}</Text>
    </View>
  );
};

const PeoplePicture = ({ i, j, user, onPress = noop }) => {
  const [visited, setVisited] = useState(false);
  const [height] = useState(() => new Animated.Value(0));

  const handlePress = useCallback(() => {
    setVisited(true);
    onPress(user);
  }, [onPress]);

  useEffect(() => {
    Animated.spring(
      height,
      {
        toValue: PEOPLE_PIC_SIZE,
        duration: 333,
      }
    ).start();
  }, [true]);

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={{ position: 'absolute', left: PEOPLE_PIC_SIZE * i, top: PEOPLE_PIC_SIZE * j, width: PEOPLE_PIC_SIZE, height: PEOPLE_PIC_SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={[styles.peoplePicture, { borderColor: visited ? colors.hot : colors.cold, width: PEOPLE_PIC_SIZE, height }]}
        >
          <Animated.Image source={{ uri: user.avatar }} resizeMode={styles.peoplePicture.resizeMode} style={{ width: PEOPLE_PIC_SIZE, height: PEOPLE_PIC_SIZE }} />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default Discovery.create(Radar);
