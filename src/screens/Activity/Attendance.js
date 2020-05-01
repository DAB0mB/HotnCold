import moment from 'moment';
import React, { useCallback, useMemo } from 'react';
import { Alert, View, Text, StyleSheet } from 'react-native';

import Discovery from '../../containers/Discovery';
import * as mutations from '../../graphql/mutations';
import * as queries from '../../graphql/queries';
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
  listFooter: {
    height: 50,
  },
  eventRipple: {
    padding: 5,
  },
});

const getEventId = e => e.id;

const ListFooterComponent = () => (
  <View style={styles.listFooter} />
);

const Attendance = () => {
  const { me } = useMine();
  const discoveryNav = useNavigation(Discovery);
  const [toggleCheckIn] = mutations.toggleCheckIn.use();
  const eventsQuery = queries.scheduledEvents.use();
  const events = useMemo(() => eventsQuery.data?.scheduledEvents || [], [eventsQuery.data]);
  const timezone = me?.area?.timezone;
  const alertError = useAlertError();

  const momentTz = useCallback((date) => {
    let m = moment(date);

    if (timezone) {
      m = m.tz(timezone);
    }

    return m;
  }, [timezone]);

  const fetchMoreScheduledEvents = useCallback(() => {
    eventsQuery.fetchMore();
  }, [eventsQuery.fetchMore]);

  const handleEventPress = useCallback((event) => {
    console.log(event);
  }, [momentTz, discoveryNav]);

  const handleDeleteEvent = useCallback((event) => {
    Alert.alert('Delete', 'Are you sure you would like to check-out from this event?', [
      {
        text: 'Cancel',
      },
      {
        text: 'Yes',
        onPress: () => {
          toggleCheckIn(event, false, {}).catch((error) => {
            alertError(error);
          });
        },
      }
    ]);
  }, [toggleCheckIn, alertError]);

  return (
    <View style={styles.container}>
      {events.length ? (
        <View>
          <CardsList
            data={events}
            timezone={timezone}
            timestampKey='startsAt'
            textKey='name'
            keyExtractor={getEventId}
            onEndReachedThreshold={0.4}
            onEndReached={fetchMoreScheduledEvents}
            ListFooterComponent={ListFooterComponent}
            onItemPress={handleEventPress}
            onItemDelete={handleDeleteEvent}
          />
        </View>
      ) : (
        <React.Fragment>
          <View style={[styles.absoluteLayer, { padding: 50 }]}>
            <Text style={{ textAlign: 'center' }}>Doesn{'\''}t look like you checked-in to any upcoming event</Text>
          </View>
        </React.Fragment>
      )}
    </View>
  );
};

export default Attendance;
