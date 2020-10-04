import pluralize from 'pluralize';
import React, { useCallback } from 'react';
import { FlatList, Image, Dimensions, Text, View, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { getUserAvatarSource } from '../assets';
import Bar from '../components/Bar';
import Base from '../containers/Base';
import Loader from '../components/Loader';
import * as queries from '../graphql/queries';
import { useNavigation } from '../services/Navigation';
import { colors } from '../theme';

const USER_AVATAR_SIZE = Dimensions.get('window').width / 3 - Dimensions.get('window').width / 16;
const USERS_LIST_PADDING = Dimensions.get('window').width / 3 / 1.7;

const styles = StyleSheet.create({
  container: { backgroundColor: 'white', flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.ink, paddingLeft: 15, fontSize: 16, fontWeight: '900' },
  listContainer: { flex: 1 },
  participantsListContent: { marginVertical: 10 },
  participantsListCol: { overflow: 'visible' },
  footerView: { flex: 1, paddingVertical: 40, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', textAlign: 'center' },
  participantItemContainer: { margin: 10 },
  participantAvatar: { width: USER_AVATAR_SIZE, height: USER_AVATAR_SIZE, borderRadius: 999, backgroundColor: colors.lightGray, alignItems: 'center', justifyContent: 'center', flex: 1 },
  participantName: { color: colors.ink, fontSize: 17, textAlign: 'center' },
  pseudoParticipant: { color: colors.ink, textAlign: 'center' },
});

const extractParticipantId = u => u.id;

const Participants = () => {
  const baseNav = useNavigation(Base);
  const chat = baseNav.getParam('chat');
  const participantsQuery = queries.participants.use(chat.id);
  const participants = participantsQuery.data?.participants;

  const fetchMoreParticipants = useCallback(() => {
    participantsQuery.fetchMore();
  }, [participantsQuery.fetchMore]);

  baseNav.useBackListener();

  const onParticipantItemPress = useCallback((participant) => {
    baseNav.push('UserLobby', {
      userId: participant.id
    });
  }, [baseNav]);

  const renderParticipant = useCallback(({ item: participant, index }) => {
    return (
      <TouchableWithoutFeedback onPress={() => onParticipantItemPress(participant, index)}>
        <View style={[styles.participantItemContainer]}>
          <Image style={styles.participantAvatar} source={getUserAvatarSource(participant)} />
          <Text style={styles.participantName}>{participant.name}</Text>
        </View>
      </TouchableWithoutFeedback>
    );
  }, [onParticipantItemPress]);

  return (
    <View style={styles.container}>
      <Bar>
        <TouchableWithoutFeedback onPress={baseNav.goBackOnceFocused}>
          <View style={styles.backIcon}>
            <McIcon name='arrow-left' size={20} color={colors.ink} solid />
          </View>
        </TouchableWithoutFeedback>

        <Text style={styles.title}>{pluralize('Participant', chat.participantsCount, true)}</Text>
      </Bar>

      <View style={styles.listContainer}>
        {participants ? (
          <FlatList
            numColumns={3}
            contentContainerStyle={[styles.participantsListContent, participants.length % 3 == 0 && { paddingBottom: USERS_LIST_PADDING }].filter(Boolean)}
            columnWrapperStyle={styles.participantsListCol}
            data={participants}
            keyExtractor={extractParticipantId}
            renderItem={renderParticipant}
            onEndReached={fetchMoreParticipants}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <Loader />
          </View>
        )}
      </View>
    </View>
  );
};

export default Base.create(Participants);
