import moment from 'moment';
import React, { useCallback, useMemo } from 'react';
import { Alert, FlatList, View, Text, Image, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Ripple from 'react-native-material-ripple';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import Discovery from '../../containers/Discovery';
import * as mutations from '../../graphql/mutations';
import * as queries from '../../graphql/queries';
import { useAppState } from '../../services/AppState';
import { useMine } from '../../services/Auth';
import { useAlertError } from '../../services/DropdownAlert';
import { useScreenFrame } from '../../services/Frame';
import { useNavigation } from '../../services/Navigation';
import { colors, hexToRgba } from '../../theme';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: colors.lightGray,
    flex: 1,
  },
  absoluteLayer: {
    position: 'absolute',
    alignContent: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  tapHereDiv: {
    position: 'absolute',
    right: 15,
    bottom: 55,
  },
  tapHereImage: {
    height: 100,
    resizeMode: 'contain',
  },
  statusItem: {
    position: 'relative',
    backgroundColor: 'white',
    margin: 20,
  },
  listFooter: {
    height: 50,
  },
  statusRipple: {
    padding: 5,
  },
  statusTextView: {
    flex: 1,
    padding: 20,
    paddingBottom: 37,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    textAlign: 'center',
    fontSize: 18,
    color: colors.ink,
  },
  statusDate: {
    color: colors.ink,
  },
  deleteStatusView: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 5,
  },
});

const getStatusId = s => s.id;

const ListFooterComponent = () => (
  <View style={styles.listFooter} />
);

const StatusBoard = () => {
  const { me } = useMine();
  const discoveryNav = useNavigation(Discovery);
  const [, setAppState] = useAppState();
  const [deleteStatus] = mutations.deleteStatus.use();
  const statusesQuery = queries.statuses.use.mine();
  const statuses = useMemo(() => statusesQuery.data?.statuses || [], [statusesQuery.data]);
  const alertError = useAlertError();

  discoveryNav.useBackListener();
  useScreenFrame();

  const getCalendarDay = useCallback((date) => {
    // Today, Tomorrow, Upcoming Tuesday, 01/01/2020
    return moment(date).tz(me.area.timezone).calendar(null, {
      sameDay: '[Today]',
      nextDay: '[Tomorrow]',
      nextWeek: '[Upcoming] dddd',
      sameElse: 'DD/MM/YYYY'
    }).split(' at ')[0];
  }, [me.area.timezone]);

  const fetchMoreStatuses = useCallback(() => {
    statusesQuery.fetchMore();
  }, [statusesQuery.fetchMore]);

  const onStatusItemPress = useCallback((status) => {
    setAppState(appState => {
      appState.discoveryCamera.current.flyTo(status.location);

      return {
        ...appState,
        discoveryTime: moment(status.publishedAt).tz(me.area.timezone).startOf('day').toDate(),
        activeStatus: {
          user: me,
          status: status,
        },
      };
    });

    discoveryNav.goBackOnceFocused();
  }, [me, discoveryNav]);

  const handleDeleteStatus = useCallback((status) => {
    Alert.alert('Delete', 'Are you sure you would like to delete this status?', [
      {
        text: 'Cancel',
      },
      {
        text: 'Yes',
        onPress: () => {
          deleteStatus(status.id).catch((error) => {
            alertError(error);
          });
        },
      }
    ]);
  }, [deleteStatus, alertError]);

  const renderStatusItem = useCallback(({ item: status, index }) => (
    <View style={styles.statusItem}>
      <Ripple style={styles.statusRipple} onPress={() => onStatusItemPress(status, index)}>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusDate}>{getCalendarDay(status.publishedAt)}</Text>
          </View>
        </View>

        <View style={styles.statusTextView}>
          <Text style={styles.statusText}>{status.text}</Text>
        </View>
      </Ripple>

      <TouchableWithoutFeedback onPress={() => handleDeleteStatus(status, index)}>
        <View style={styles.deleteStatusView}>
          <McIcon name='trash-can' color={hexToRgba(colors.gray, .5)} size={20} />
        </View>
      </TouchableWithoutFeedback>
    </View>
  ), [onStatusItemPress]);

  return (
    <View style={styles.container}>
      {statuses.length ? (
        <View>
          <FlatList
            data={statuses}
            keyExtractor={getStatusId}
            renderItem={renderStatusItem}
            onEndReachedThreshold={0.4}
            onEndReached={fetchMoreStatuses}
            ListFooterComponent={ListFooterComponent}
          />
        </View>
      ) : (
        <React.Fragment>
          <View style={[styles.absoluteLayer, { padding: 50 }]}>
            <Text style={{ textAlign: 'center' }}>Tap the <Text style={{ fontWeight: '900', fontSize: 20 }}>BIG</Text> button to publish a new status.</Text>
          </View>

          <View style={styles.tapHereDiv}>
            <Image source={require('./tap_here.png')} style={styles.tapHereImage} />
          </View>
        </React.Fragment>
      )}
    </View>
  );
};

export default Discovery.create(StatusBoard);
