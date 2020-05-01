import moment from 'moment';
import React, { useCallback, useMemo } from 'react';
import { Alert, View, Text, Image, StyleSheet } from 'react-native';

import Discovery from '../../containers/Discovery';
import * as mutations from '../../graphql/mutations';
import * as queries from '../../graphql/queries';
import { useAppState } from '../../services/AppState';
import { useMine } from '../../services/Auth';
import { useAlertError } from '../../services/DropdownAlert';
import { useNavigation } from '../../services/Navigation';
import { colors } from '../../theme';
import CardsList from './CardsList';

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
  listFooter: {
    height: 50,
  },
  statusRipple: {
    padding: 5,
  },
});

const getStatusId = s => s.id;

const ListFooterComponent = () => (
  <View style={styles.listFooter} />
);

const Statuses = () => {
  const { me } = useMine();
  const discoveryNav = useNavigation(Discovery);
  const [, setAppState] = useAppState();
  const [deleteStatus] = mutations.deleteStatus.use();
  const statusesQuery = queries.statuses.use.mine();
  const statuses = useMemo(() => statusesQuery.data?.statuses || [], [statusesQuery.data]);
  const timezone = me?.area?.timezone;
  const alertError = useAlertError();

  const momentTz = useCallback((date) => {
    let m = moment(date);

    if (timezone) {
      m = m.tz(timezone);
    }

    return m;
  }, [timezone]);

  const fetchMoreStatuses = useCallback(() => {
    statusesQuery.fetchMore();
  }, [statusesQuery.fetchMore]);

  const handleStatusPress = useCallback((status) => {
    setAppState(appState => {
      appState.discoveryCamera.current.flyTo(status.location);

      return {
        ...appState,
        discoveryTime: momentTz(status.publishedAt).startOf('day').toDate(),
        activeStatus: {
          user: me,
          status: status,
        },
      };
    });

    discoveryNav.goBackOnceFocused();
  }, [momentTz, discoveryNav]);

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

  return (
    <View style={styles.container}>
      {statuses.length ? (
        <View>
          <CardsList
            data={statuses}
            timezone={timezone}
            timestampKey='publishedAt'
            textKey='text'
            keyExtractor={getStatusId}
            onEndReachedThreshold={0.4}
            onEndReached={fetchMoreStatuses}
            ListFooterComponent={ListFooterComponent}
            onItemPress={handleStatusPress}
            onItemDelete={handleDeleteStatus}
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

export default Statuses;
