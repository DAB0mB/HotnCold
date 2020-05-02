import pluralize from 'pluralize';
import React, { useCallback, useMemo } from 'react';
import { FlatList, Image, Dimensions, Text, View, Linking, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { getUserAvatarSource } from '../assets';
import Bar from '../components/Bar';
import Base from '../containers/Base';
import * as queries from '../graphql/queries';
import { useMine } from '../services/Auth';
import { useAlertError } from '../services/DropdownAlert';
import { useLoading } from '../services/Loading';
import { useNavigation } from '../services/Navigation';
import { colors } from '../theme';
import { useConst, upperFirst } from '../utils';

const USER_AVATAR_SIZE = Dimensions.get('window').width / 3 - Dimensions.get('window').width / 16;
const USERS_LIST_PADDING = Dimensions.get('window').width / 3 / 1.7;
const PSEUDO = '__pseudo__';

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
  attendeesListContent: {
    marginVertical: 10,
  },
  attendeesListCol: {
    overflow: 'visible',
  },
  footerView: {
    flex: 1,
    paddingVertical: 40,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  attendeeItemContainer: {
    margin: 10,
  },
  attendeeAvatar: {
    width: USER_AVATAR_SIZE,
    height: USER_AVATAR_SIZE,
    borderRadius: 999,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  attendeeName: {
    color: colors.ink,
    fontSize: 17,
    textAlign: 'center',
  },
  pseudoAttendee: {
    color: colors.ink,
    textAlign: 'center',
  },
});

const extractAttendeeId = u => u.id;

const Attendees = () => {
  const { me } = useMine();
  const self = useConst({});
  const baseNav = useNavigation(Base);
  const event = baseNav.getParam('event');
  const attendeesQuery = queries.attendees.use(event.id);
  const alertError = useAlertError();
  const attendees = useMemo(() => attendeesQuery.data?.attendees || [], [attendeesQuery.data]);
  const veryFirstAttendee = attendeesQuery.data?.veryFirstAttendee;

  const pseudoAttendee = useMemo(() => {
    if (
      attendeesQuery.called &&
      !attendeesQuery.loading &&
      veryFirstAttendee?.id === attendees[attendees.length - 1]?.id
    ) {
      return {
        id: PSEUDO,
      };
    }
  }, [veryFirstAttendee, attendeesQuery.loading, attendeesQuery.called, attendees]);

  const attendeesItems = useMemo(() => {
    if (pseudoAttendee) {
      return attendees.concat(pseudoAttendee);
    }

    return attendees;
  }, [attendees, pseudoAttendee]);

  const [queryUserProfile] = queries.userProfile.use.lazy({
    onCompleted: useCallback((data) => {
      if (!data) return;

      if (self.shouldNav) {
        delete self.shouldNav;
        const user = data.userProfile;

        baseNav.push('Profile', {
          user,
          itsMe: user.id === me.id,
        });
      }
    }, [baseNav, me]),
    onError: alertError,
  });

  const fetchMoreAttendees = useCallback(() => {
    attendeesQuery.fetchMore();
  }, [attendeesQuery.fetchMore]);

  baseNav.useBackListener();

  const onAttendeeItemPress = useCallback((attendee) => {
    self.shouldNav = true;

    queryUserProfile({
      variables: { userId: attendee.id },
    });
  }, [queryUserProfile]);

  const renderHeader = useCallback(() => {
    return (
      <Bar>
        <TouchableWithoutFeedback onPress={baseNav.goBackOnceFocused}>
          <View style={styles.backIcon}>
            <McIcon name='arrow-left' size={20} color={colors.ink} solid />
          </View>
        </TouchableWithoutFeedback>

        <Text style={styles.title}>{pluralize('Attendee', event.attendanceCount, true)}</Text>
      </Bar>
    );
  }, [baseNav]);

  const handleLinkPress = useCallback(() => {
    Linking.openURL(event.sourceLink);
  }, [true]);

  const renderAttendeeItem = useCallback(({ item: attendee, index }) => {
    if (attendee.id == PSEUDO) {
      return (
        <TouchableWithoutFeedback onPress={handleLinkPress}>
          <View style={[styles.attendeeItemContainer, styles.pseudoAttendee]}>
            <View style={styles.attendeeAvatar}>
              <Text style={styles.pseudoAttendee}>
                See {event.sourceAttendanceCount} more {pluralize('attendee', true)} on {upperFirst(event.source)}
              </Text>
            </View>
            <Text style={styles.attendeeName}>{' '}</Text>
          </View>
        </TouchableWithoutFeedback>
      );
    }

    return (
      <TouchableWithoutFeedback onPress={() => onAttendeeItemPress(attendee, index)}>
        <View style={[styles.attendeeItemContainer]}>
          <Image style={styles.attendeeAvatar} source={getUserAvatarSource(attendee)} />
          <Text style={styles.attendeeName}>{attendee.name}</Text>
        </View>
      </TouchableWithoutFeedback>
    );
  }, [onAttendeeItemPress, handleLinkPress]);

  return useLoading(!attendeesQuery.called && attendeesQuery.loading && !attendees.length,
    <View style={styles.container}>
      <View style={styles.listContainer}>
        <FlatList
          numColumns={3}
          contentContainerStyle={[styles.attendeesListContent, attendees.length % 3 == 0 && { paddingBottom: USERS_LIST_PADDING }].filter(Boolean)}
          columnWrapperStyle={styles.attendeesListCol}
          data={attendeesItems}
          keyExtractor={extractAttendeeId}
          renderItem={renderAttendeeItem}
          onEndReached={fetchMoreAttendees}
          ListHeaderComponent={renderHeader}
        />
      </View>
    </View>
  );
};

export default Base.create(Attendees);
