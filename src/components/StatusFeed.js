import MapboxGL from '@react-native-mapbox-gl/maps';
import moment from 'moment';
import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Dimensions, Image, Text, FlatList, TouchableWithoutFeedback } from 'react-native';
import Ripple from 'react-native-material-ripple';
import MIcon from 'react-native-vector-icons/MaterialIcons';

import { getUserAvatarSource } from '../assets';
import * as queries from '../graphql/queries';
import { useAlertError } from '../services/DropdownAlert';
import { useNavigation } from '../services/Navigation';
import { useAppState } from '../services/AppState';
import { useScreenFrame } from '../services/Frame';
import { colors } from '../theme';
import { emptyArr, useAsyncEffect } from '../utils';

const window = Dimensions.get('window');
const statusImageSize = window.width;

const styles = StyleSheet.create({
  statusItem: { borderBottomWidth: 1, borderBottomColor: colors.lightGray },
  statusHeader: { padding: 10, flexDirection: 'row', alignItems: 'center' },
  statusImage: { height: statusImageSize, width: statusImageSize },
  statusAuthorPicture: { width: 40, height: 40 },
  statusAuthorName: { color: colors.ink, fontSize: 16, paddingLeft: 10 },
  statusDescription: { flexDirection: 'row', padding: 15, paddingBottom: 10 },
  statusCreatedAt: { color: 'black', flex: 1, marginBottom: 10 },
  statusText: { padding: 15, paddingTop: 0, fontSize: 16 },
  statusType: { marginTop: 2, marginRight: 5, borderRadius: 15, width: 15, height: 15 },
  actionIcon: { marginTop: -5, marginRight: -5 },
  noStatusesMessage: { height: 50, alignItems: 'center', justifyContent: 'center' },
});

const extractStatusItemKey = (status) => {
  return status.id;
};

const StatusFeed = ({ hideHeader, userScreen, NoStatusesComponent, ...props }) => {
  const Base = require('../containers/Base').default;
  const Discovery = require('../containers/Discovery').default;

  const baseNav = useNavigation(Base);
  const discoveryNav = useNavigation(Discovery);
  const alertError = useAlertError();
  const [appState, setAppState] = useAppState();
  const [location, setLocation] = useState(() => props.location ?? appState.discoveryArea?.center);

  useScreenFrame();

  useAsyncEffect(function* () {
    if (location) return;

    const { coords } = yield MapboxGL.locationManager.getLastKnownLocation();

    const newLocation = [
      coords.longitude,
      coords.latitude,
    ];

    setLocation(newLocation);
  }, []);

  const statusesQuery = queries.areaStatusesList.use(location, {
    onError: alertError,
  });

  const { areaStatusesList: statuses = emptyArr } = statusesQuery.data || {};

  const flyToStatus = useCallback((status) => {
    appState.discoveryCamera.current.setCamera({
      centerCoordinate: status.location,
      zoomLevel: 13,
      animationDuration: 2000,
    });

    discoveryNav.pop();

    setAppState(appState => ({
      ...appState,
      activeStatus: status,
    }));
  }, [appState.discoveryCamera, discoveryNav]);

  const navToStatusChat = useCallback((status) => {
    baseNav.push('StatusChat', { status });
  }, [baseNav]);

  const navToUserScreen = useCallback((userId) => {
    baseNav.push(userScreen, { userId });
  }, [baseNav]);

  const fetchMoreStatuses = useCallback(() => {
    statusesQuery.fetchMore();
  }, [statusesQuery.fetchMore]);

  const renderStatusItem = useCallback(({ item: status }) => {
    return (
      <View style={styles.statusItem}>
        {!hideHeader && (
          <Ripple style={styles.statusHeader} onPress={() => navToUserScreen(status.author.id)}>
            <Image style={styles.statusAuthorPicture} source={getUserAvatarSource(status.author)} />
            <Text style={styles.statusAuthorName}>{status.author.name}</Text>
          </Ripple>
        )}
        <Image style={styles.statusImage} source={{ uri: status.firstImage }} />
        <View style={styles.statusDescription} onPress={() => navToStatusChat(status)}>
          <View style={[styles.statusType, { backgroundColor: status.isMeetup ? colors.hot : colors.cold }]} />
          <Text style={styles.statusCreatedAt}>{moment(status.createdAt).fromNow()}</Text>
          <TouchableWithoutFeedback onPress={() => flyToStatus(status)}>
            <MIcon name='gps-fixed' size={28} color={colors.ink} style={styles.actionIcon} />
          </TouchableWithoutFeedback>
          <View style={{ width: 20 }} />
          <TouchableWithoutFeedback onPress={() => navToStatusChat(status)}>
            <MIcon name='chat-bubble' size={30} color={colors.ink} style={styles.actionIcon} />
          </TouchableWithoutFeedback>
        </View>
        <Text style={styles.statusText}>{status.text}</Text>
      </View>
    );
  }, [hideHeader, navToUserScreen, navToStatusChat]);

  const noStatuses = statusesQuery.called && !statusesQuery.loading && !statuses.length;

  return (
    <React.Fragment>
      {(noStatuses && NoStatusesComponent) ? <NoStatusesComponent /> : (
        <FlatList
          {...props}
          data={statuses}
          keyExtractor={extractStatusItemKey}
          renderItem={renderStatusItem}
          onEndReached={fetchMoreStatuses}
          ListFooterComponent={noStatuses ? <NoStatuses /> : props.ListFooterComponent}
        />
      )}
    </React.Fragment>
  );
};

const NoStatuses = () => {
  return (
    <View style={styles.noStatusesMessage}>
      <Text>No statuses</Text>
    </View>
  );
};

export default StatusFeed;
