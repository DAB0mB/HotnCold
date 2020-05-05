import MapboxGL from '@react-native-mapbox-gl/maps';
import moment from 'moment';
import pluralize from 'pluralize';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AutoHeightImage from 'react-native-auto-height-image';
import CONFIG from 'react-native-config';
import { RaisedTextButton } from 'react-native-material-buttons';
import Ripple from 'react-native-material-ripple';
import HTML from 'react-native-render-html';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MIcon from 'react-native-vector-icons/MaterialIcons';

import {
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  FlatList,
  Alert,
} from 'react-native';

import { getUserAvatarSource } from '../assets';
import Bar from '../components/Bar';
import DotsLoader from '../components/Loader/DotsLoader';
import Base from '../containers/Base';
import * as mutations from '../graphql/mutations';
import * as queries from '../graphql/queries';
import { useMine } from '../services/Auth';
import { useAlertError } from '../services/DropdownAlert';
import { useNavigation } from '../services/Navigation';
import { colors, hexToRgba } from '../theme';
import { useAsyncCallback, upperFirst, useConst } from '../utils';

const images = {
  'marker': require('../assets/hot-marker.png'),
};

const imagesMaxWidth = Dimensions.get('window').width - 80;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', alignItems: 'center' },
  headerBack: { color: colors.ink, fontSize: 18 },
  body: { backgroundColor: colors.lightGray },
  map: { width: '100%', height: 200 },
  featuredPhoto: { width: '100%', height: 200, marginBottom: 20 },
  description: { paddingVertical: 20, paddingHorizontal: 20, margin: 20, marginBottom: 40, backgroundColor: 'white' },
  eventName: { fontSize: 22, padding: 20, fontWeight: '800', color: colors.hot },
  attendView: { marginTop: 10, padding: 20 },
  sourceView: { marginBottom: 20, marginTop: 10, alignSelf: 'stretch', alignItems: 'center' },
  sourceLogo: { marginVertical: 20 },
});

const eventDetailStyles = StyleSheet.create({
  container: { padding: 20, flexDirection: 'row', alignItems: 'center' },
  icon: { paddingRight: 15 },
  fields: { flex: 1, paddingRight: 20 },
  main: { color: colors.ink, fontSize: 16 },
  sub: { color: colors.gray, fontSize: 14 },
});

const commentStyles = StyleSheet.create({
  container: { marginTop: 10, paddingTop: 15, backgroundColor: 'white' },
  inputTitle: { textTransform: 'uppercase', fontSize: 13, fontWeight: '500', color: colors.ink, letterSpacing: .3, paddingHorizontal: 15 },
  inputRipple: { padding: 15, flexDirection: 'row', alignItems: 'center', borderBottomColor: colors.lightGray, borderBottomWidth: 1 },
  inputAvatar: { height: 40, width: 40, marginRight: 15 },
  inputPlaceholder: { fontSize: 17, color: colors.gray },
  loading: { padding: 20, justifyContent: 'center', alignItems: 'center' },
  itemContainer: { position: 'relative', borderBottomColor: colors.lightGray, borderBottomWidth: 1 },
  itemAvatar: { width: 40, height: 40 },
  itemRipple: { flexDirection: 'row', padding: 15 },
  itemContents: { flex: 1, paddingLeft: 15 },
  itemName: { color: colors.gray, fontSize: 13 },
  itemText: { fontSize: 14, marginTop: 15 },
  itemDeleteIcon: { position: 'absolute', bottom: 10, right: 10 },
});

const mapStyles = {
  marker: { iconSize: .2, iconImage: 'marker', iconAnchor: 'bottom', iconAllowOverlap: true },
};

const getSourceImage = (source) => {
  switch (source) {
  case 'meetup': return require('../assets/meetup_icon.png');
  }
};

const extractCommentId = c => c.id;

const EventInfo = ({ IconComponent = McIcon, iconName, mainText, subText, onPress }) => {
  const Container = onPress ? Ripple : View;

  return (
    <Container style={eventDetailStyles.container} onPress={onPress}>
      <IconComponent style={eventDetailStyles.icon} name={iconName} color={colors.gray} size={30} />

      <View style={eventDetailStyles.fields}>
        <Text style={eventDetailStyles.main}>{mainText}</Text>
        {subText && (
          <Text style={eventDetailStyles.sub}>{subText}</Text>
        )}
      </View>

      {onPress && (
        <McIcon name='chevron-right' size={25} color={colors.ink} />
      )}
    </Container>
  );
};

const Event = () => {
  const self = useConst({});
  const { me } = useMine();
  const baseNav = useNavigation(Base);
  const eventParam = baseNav.getParam('event');
  const [checkedIn, setCheckedIn] = useState(eventParam.checkedIn);
  const event = useMemo(() => {
    return {
      ...eventParam,
      checkedIn,
    };
  }, [checkedIn]);
  const commentsQuery = queries.comments.use(event.id, {
    subscribeToChanges: true,
  });
  const comments = useMemo(() => commentsQuery.data?.comments || [], [commentsQuery.data]);
  const commentsCount = useMemo(() => commentsQuery.data?.commentsCount?.toString() || '', [commentsQuery.data]);
  const sourceName = useMemo(() => upperFirst(event.source), [event.source]);
  const [attendanceCount, setAttendanceCount] = useState(event.attendanceCount);
  const alertError = useAlertError();

  const [deleteComment] = mutations.deleteComment.use({
    onError: alertError,
  });
  const [superToggleCheckIn] = mutations.toggleCheckIn.use(event, {
    onError: alertError
  });
  // Prepare cache
  const attendeesQuery = queries.attendees.use(event.id, {
    onError: alertError
  });

  const [queryUserProfile] = queries.userProfile.use.lazy({
    onCompleted: useCallback((data) => {
      if (!data) return;

      if (self.shouldNav) {
        delete self.shouldNav;
        const user = data.userProfile;

        baseNav.push('Profile', { user });
      }
    }, [baseNav]),
    onError: alertError,
  });

  const eventDateLiteral = useMemo(() =>
    moment(event.localDate, 'YYYY-MM-DD').calendar().split(' at')[0]
  , [event]);

  const eventTimeLiteral = useMemo(() => [
    event.localTime,
    moment(event.localTime, 'HH:mm').add(event.duration, 'milliseconds').format('HH:mm'),
  ].join(' - '), [event]);

  const eventFeature = useMemo(() => ({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Point',
      coordinates: event.location,
    },
  }), [event]);

  const handleLinkPress = useCallback((e, url) => {
    Linking.openURL(url);
  }, [true]);

  const showEventOnMaps = useCallback(() => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = event.location.slice().reverse().join(',');
    const label = event.name;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    Linking.openURL(url);
  }, [event]);

  const showEventPage = useCallback(() => {
    Linking.openURL(event.sourceLink);
  }, [event]);

  const navToAttendeesScreen = useCallback(() => {
    baseNav.push('Attendees', {
      event: {
        ...event,
        attendanceCount,
      },
    });
  }, [baseNav, event, attendanceCount]);

  const toggleCheckIn = useAsyncCallback(function* () {
    const mutation = yield superToggleCheckIn();
    const checkedIn = mutation.data.toggleCheckIn.checkedIn;

    setCheckedIn(checkedIn);

    if (checkedIn) {
      setAttendanceCount(attendanceCount => attendanceCount + 1);
    }
    else {
      setAttendanceCount(attendanceCount => attendanceCount - 1);
    }

    attendeesQuery.updateQuery((prev) => {
      const attendees = prev?.attendees?.slice();

      if (!attendees) return prev;

      const attendeeIndex = attendees.findIndex(u => u.id == me.id);

      if (checkedIn) {
        if (!~attendeeIndex) {
          attendees.unshift({
            ...me,
            checkedInAt: new Date(),
            __typename: 'Attendee',
          });
        }
      }
      else {
        if (~attendeeIndex) {
          attendees.splice(attendeeIndex, 1);
        }
      }

      return {
        attendees,
        veryFirstAttendee: attendees.length == 1 ? attendees[0] : prev.veryFirstAttendee,
      };
    });
  }, [superToggleCheckIn, baseNav, me]);

  const handleAddComment = useCallback(() => {
    baseNav.push('MessageEditor', {
      maxLength: 500,
      placeholder: 'Add a public comment...',
      useMutation(text, options) {
        return mutations.createComment.use(event.id, text, options);
      },
      useSaveHandler(createComment) {
        return createComment;
      },
    });
  }, [baseNav]);

  const fetchMoreComments = useCallback(() => {
    return commentsQuery.fetchMore();
  }, [true]);

  const renderCommentItem = useCallback(({ item: comment }) => {
    const navToProfile = () => {
      self.shouldNav = true;

      queryUserProfile({
        variables: { userId: comment.user.id },
      });
    };

    const handleDeleteComment = () => {
      Alert.alert('Delete', 'Are you sure you would like to check-out from this event?', [
        {
          text: 'Cancel',
        },
        {
          text: 'Yes',
          onPress: () => {
            deleteComment(comment.id);
          },
        }
      ]);
    };

    return (
      <View style={commentStyles.itemContainer}>
        <Ripple style={commentStyles.itemRipple} onPress={navToProfile}>
          <View>
            <Image source={getUserAvatarSource(comment.user)} style={commentStyles.itemAvatar} />
          </View>

          <View style={commentStyles.itemContents}>
            <Text style={commentStyles.itemName}>{comment.user.name} • {moment(comment.createdAt).fromNow()}</Text>
            <Text style={commentStyles.itemText}>{comment.text}</Text>
          </View>
        </Ripple>

        {comment.user.id === me.id && (
          <TouchableWithoutFeedback onPress={handleDeleteComment}>
            <View style={commentStyles.itemDeleteIcon}>
              <McIcon name='trash-can' color={hexToRgba(colors.gray, .5)} size={20} />
            </View>
          </TouchableWithoutFeedback>
        )}
      </View>
    );
  }, [true]);

  useEffect(() => attendeesQuery.clear, [true]);
  useEffect(() => commentsQuery.clear, [true]);

  baseNav.useBackListener();

  return (
    <ScrollView style={styles.container} nestedScrollEnabled>
      <Bar style={styles.header}>
        <TouchableWithoutFeedback onPress={baseNav.goBackOnceFocused}>
          <View style={styles.header}>
            <McIcon name='chevron-left' size={25} color={colors.ink} /><Text style={styles.headerBack}>Back</Text>
          </View>
        </TouchableWithoutFeedback>
      </Bar>

      <Text style={styles.eventName}>{event.name}</Text>

      <View style={styles.body}>
        <View>
          <EventInfo
            iconName='clock-outline'
            mainText={eventDateLiteral}
            subText={eventTimeLiteral}
          />

          <EventInfo
            iconName='account-group'
            mainText={pluralize('attendee', attendanceCount, true)}
            subText={event.maxPeople && `${event.maxPeople} people max on ${sourceName}`}
            onPress={navToAttendeesScreen}
          />

          <EventInfo
            IconComponent={MIcon}
            iconName='pin-drop'
            mainText={event.venueName}
            subText={event.address}
            onPress={showEventOnMaps}
          />
        </View>

        {event.featuredPhoto && (
          <Image style={styles.featuredPhoto} source={{ uri: event.featuredPhoto }} />
        )}

        <View style={styles.description}>
          <HTML
            html={event.description}
            imagesMaxWidth={imagesMaxWidth}
            baseFontStyle={{ fontSize: 16 }}
            onLinkPress={handleLinkPress}
          />

          {event.source && (
            <TouchableWithoutFeedback onPress={showEventPage}>
              <View style={styles.sourceView}>
                <AutoHeightImage source={getSourceImage(event.source)} width={100} style={styles.sourceLogo} />
                <Text>View on {sourceName}</Text>
              </View>
            </TouchableWithoutFeedback>
          )}
        </View>

        <TouchableWithoutFeedback onPress={showEventOnMaps}>
          <View style={styles.map}>
            <View pointerEvents='none' style={styles.map}>
              <MapboxGL.MapView
                style={{ flex: 1 }}
                styleURL={CONFIG.MAPBOX_STYLE_URL}
                attributionEnabled={false}
              >
                <MapboxGL.Images images={images} />

                <MapboxGL.Camera
                  zoomLevel={12}
                  centerCoordinate={event.location}
                />

                <MapboxGL.ShapeSource
                  id='eventFeature'
                  shape={eventFeature}
                >
                  <MapboxGL.SymbolLayer
                    id='eventFeatureMarker'
                    sourceID='eventFeature'
                    style={mapStyles.marker}
                  />
                </MapboxGL.ShapeSource>
              </MapboxGL.MapView>
            </View>
          </View>
        </TouchableWithoutFeedback>

        <View style={styles.attendView}>
          <RaisedTextButton
            onPress={toggleCheckIn}
            color={checkedIn ? colors.cold : colors.hot}
            title={checkedIn ? 'Check Out' : 'Check In'}
            titleColor='white'
          />
        </View>

        <View style={commentStyles.container}>
          <Text style={commentStyles.inputTitle}>{commentsCount ? pluralize('comment', commentsCount, true) : 'comments'}</Text>

          <Ripple onPress={handleAddComment} style={commentStyles.inputRipple}>
            <Image source={getUserAvatarSource(me)} style={commentStyles.inputAvatar} />
            <Text style={commentStyles.inputPlaceholder}>Add a public comment...</Text>
          </Ripple>

          <FlatList
            data={comments}
            keyExtractor={extractCommentId}
            renderItem={renderCommentItem}
            onEndReached={fetchMoreComments}
          />

          {commentsQuery.loading && (
            <View style={commentStyles.loading}>
              <DotsLoader />
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default Base.create(Event);
