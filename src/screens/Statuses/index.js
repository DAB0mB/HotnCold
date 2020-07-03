import moment from 'moment';
import React, { useCallback } from 'react';
import { Text, View, FlatList, Image, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Toast from 'react-native-simple-toast';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { getUserAvatarSource } from '../../assets';
import Base from '../../containers/Base';
import Discovery from '../../containers/Discovery';
import * as mutations from '../../graphql/mutations';
import * as queries from '../../graphql/queries';
import { useAlertError } from '../../services/DropdownAlert';
import { useScreenFrame } from '../../services/Frame';
import { useNavigation } from '../../services/Navigation';
import { colors } from '../../theme';
import { emptyArr } from '../../utils';
import tapHerePng from './tap_here.png';

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  listContent: { paddingBottom: 75 },
  itemRipple: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.lightGray, padding: 20, paddingBottom: 40 },
  itemImage: { width: 50, height: 50, resizeMode: 'contain' },
  itemName: { marginBottom: 5, fontSize: 18, color: colors.ink },
  itemText: { fontSize: 16 },
  itemLyrics: { paddingLeft: 15, flex: 1 },
  tapHereDiv: { position: 'absolute', right: 15, bottom: 55 },
  tapHereImage: { height: 100, resizeMode: 'contain' },
  bellIcon: { position: 'absolute', bottom: 10, right: 10 },
});

const getStatusKey = s => s.id;

const Statuses = () => {
  const baseNav = useNavigation(Base);
  const discoveryNav = useNavigation(Discovery);
  const alertError = useAlertError();
  const statusesQuery = queries.statuses.use({
    onError: alertError,
  });
  const [toggleChatSubscription] = mutations.toggleChatSubscription.use({
    onError: alertError,
  });
  const { statuses = emptyArr } = statusesQuery.data || {};

  discoveryNav.useBackListener();
  useScreenFrame();

  const navToStatusChat = useCallback((status) => {
    baseNav.push('StatusChat', { status });
  }, [baseNav]);

  const renderStatusItem = useCallback(({ item: status }) => {
    const handlePress = () => {
      navToStatusChat(status);
    };

    const toggleStatusChatSubscription = () => {
      toggleChatSubscription(status.chat);

      Toast.show(`Notifications are ${status.chat.subscribed ? 'OFF' : 'ON'}`, Toast.SHORT, Toast.BOTTOM);
    };

    return (
      <View style={{ flex: 1, position: 'relative' }}>
        <Ripple
          onPress={handlePress}
          style={styles.itemRipple}
        >
          <Image source={getUserAvatarSource(status.author)} style={styles.itemImage} />

          <View style={styles.itemLyrics}>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{status.author.name}</Text>
              </View>

              <Text>{moment(status.createdAt).fromNow()}</Text>
            </View>
            <View>
              <Text style={styles.itemText}>{status.text}</Text>
            </View>
          </View>
        </Ripple>

        <TouchableWithoutFeedback onPress={toggleStatusChatSubscription}>
          <View style={styles.bellIcon}>
            <McIcon name={status.chat.subscribed ? 'bell' : 'bell-off'} size={20} />
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  }, [navToStatusChat]);

  const fetchMoreStatuses = useCallback(() => {
    statusesQuery.fetchMore();
  }, [statusesQuery.fetchMore]);

  if (statusesQuery.called && !statusesQuery.loading && !statuses.length) {
    return (
      <View style={[styles.container, styles.empty]}>
        <Text style={{ textAlign: 'center', lineHeight: 20 }}>See satatus that you{'\''}ve created or have been recently active with. Tap the <Text style={{ fontWeight: '900', fontSize: 20 }}>BIG</Text> button to create your first status and get started!</Text>

        <View style={styles.tapHereDiv}>
          <Image source={tapHerePng} style={styles.tapHereImage} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={statuses}
        keyExtractor={getStatusKey}
        renderItem={renderStatusItem}
        onEndReached={fetchMoreStatuses}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

export default Discovery.create(Statuses);
