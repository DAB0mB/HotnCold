import pluralize from 'pluralize';
import React, { useCallback, useMemo } from 'react';
import { Text, View, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import Bar from '../components/Bar';
import ProfileList from '../components/ProfileList';
import Base from '../containers/Base';
import * as queries from '../graphql/queries';
import { useMine } from '../services/Auth';
import { useAlertError } from '../services/DropdownAlert';
import { useLoading } from '../services/Loading';
import { useNavigation } from '../services/Navigation';
import { colors } from '../theme';

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
  attendeeName: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
});

const getUserId = u => u.id;
const getUserPicture = u => ({ uri: u.avatar });

const Attendees = () => {
  const { me } = useMine();
  const baseNav = useNavigation(Base);
  const event = baseNav.getParam('event');
  const attendeesQuery = queries.attendees.use(event.id);
  const alertError = useAlertError();
  const attendees = useMemo(() => attendeesQuery.data?.attendees || [], [attendeesQuery.data]);

  const [queryUserProfile] = queries.userProfile.use.lazy({
    onCompleted: useCallback((data) => {
      if (!data) return;

      const user = data.userProfile;

      baseNav.push('Profile', {
        user,
        itsMe: user.id === me.id,
      });
    }, [baseNav, me]),
    onError: alertError,
  });

  const fetchMoreAttendees = useCallback(() => {
    attendeesQuery.fetchMore();
  }, [attendeesQuery.fetchMore]);

  baseNav.useBackListener();

  const renderItemBody = useCallback(({ item: user }) => {
    return (
      <Text style={styles.attendeeName}>{user.id == me.id ? 'Me' : user.name}</Text>
    );
  }, [me]);

  const onUserItemPress = useCallback(({ item: user }) => {
    queryUserProfile({
      variables: { userId: user.id },
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

  return useLoading(!attendeesQuery.called && attendeesQuery.loading && !attendees.length,
    <View style={styles.container}>
      <View style={styles.listContainer}>
        <ProfileList
          data={attendees}
          keyExtractor={getUserId}
          pictureExtractor={getUserPicture}
          renderItemBody={renderItemBody}
          onItemPress={onUserItemPress}
          onEndReached={fetchMoreAttendees}
          ListHeaderComponent={renderHeader}
        />
      </View>
    </View>
  );
};

export default Base.create(Attendees);
