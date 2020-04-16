import moment from 'moment';
import pluralize from 'pluralize';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Text, View, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import Bar from '../components/Bar';
import BigProfileList from '../components/BigProfileList';
import Base from '../containers/Base';
import * as queries from '../graphql/queries';
import { useNavigation } from '../services/Navigation';
import { colors, hexToRgba } from '../theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
  },
  title: {
    color: colors.ink,
    paddingLeft: 15,
    fontSize: 16,
    fontWeight: '900'
  },
  listContainer: {
    flex: 1,
  },
  eventContainer: {
    padding: 10,
    backgroundColor: hexToRgba(colors.hot, .8),
  },
  eventName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  eventAttendees: {
    color: 'white',
    fontSize: 15,
  },
});

const getEventId = e => e.id;
const getEventPicture = e => e.featuredPhoto ? ({ uri: e.featuredPhoto }) : require('../assets/default_featured_photo.jpg');

const Selection = () => {
  const baseNav = useNavigation(Base);
  const selection = baseNav.getParam('selection');
  const [queryEvent, eventQuery] = queries.event.use();

  const events = useMemo(() => selection.features
    .map(f => f.properties.event)
    .filter(Boolean)
    .sort((a, b) => (a.attendanceCount > b.attendanceCount) ? -1 : 1)
  , [selection]);

  baseNav.useBackListener();

  useEffect(() => {
    if (eventQuery.data?.event) {
      baseNav.push('Event', {
        event: eventQuery.data.event
      });
    }
  }, [eventQuery.data?.event?.id]);

  const renderItemBody = useCallback(({ item: event }) => {
    return (
      <View style={styles.eventContainer}>
        <Text style={styles.eventName}>{event.name}</Text>
        <Text style={styles.eventAttendees}>{pluralize('Attendee', event.attendanceCount, true)}, at {moment(event.localTime, 'hh:mm').format('LT')}</Text>
      </View>
    );
  }, [true]);

  const onEventItemPress = useCallback(({ item: event }) => {
    queryEvent(event.id);
  }, [queryEvent]);

  const renderHeader = useCallback(() => {
    return (
      <Bar>
        <TouchableWithoutFeedback onPress={baseNav.goBackOnceFocused}>
          <View style={styles.backIcon}>
            <McIcon name='arrow-left' size={20} color={colors.ink} solid />
          </View>
        </TouchableWithoutFeedback>

        <Text style={styles.title}>{pluralize('Event', selection.features.length, true)}</Text>
      </Bar>
    );
  }, [baseNav]);

  return (
    <View style={styles.container}>
      <View style={styles.listContainer}>
        <BigProfileList
          data={events}
          rippleColor='white'
          keyExtractor={getEventId}
          pictureExtractor={getEventPicture}
          renderItemBody={renderItemBody}
          onItemPress={onEventItemPress}
          ListHeaderComponent={renderHeader}
        />
      </View>
    </View>
  );
};

export default Base.create(Selection);
