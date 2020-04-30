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
} from 'react-native';

import Bar from '../components/Bar';
import Base from '../containers/Base';
import * as mutations from '../graphql/mutations';
import * as queries from '../graphql/queries';
import { useMine } from '../services/Auth';
import { useNavigation } from '../services/Navigation';
import { colors } from '../theme';
import { useAsyncCallback, upperFirst } from '../utils';

const images = {
  'marker': require('../assets/hot-marker.png'),
};

const imagesMaxWidth = Dimensions.get('window').width - 80;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBack: {
    color: colors.ink,
    fontSize: 18,
  },
  body: {
    backgroundColor: colors.lightGray,
  },
  map: {
    width: '100%',
    height: 200,
  },
  featuredPhoto: {
    width: '100%',
    height: 200,
    marginBottom: 20,
  },
  description: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    margin: 20,
    marginBottom: 40,
    backgroundColor: 'white',
  },
  eventName: {
    fontSize: 22,
    padding: 20,
    fontWeight: '800',
    color: colors.hot,
  },
  attendView: {
    marginTop: 40,
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
});

const eventDetailStyles = StyleSheet.create({
  container: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    paddingRight: 15,
  },
  fields: {
    flex: 1,
    paddingRight: 20,
  },
  main: {
    color: colors.ink,
    fontSize: 16,
  },
  sub: {
    color: colors.gray,
    fontSize: 14,
  },
});

const mapStyles = {
  marker: {
    iconSize: .2,
    iconImage: 'marker',
    iconAnchor: 'bottom',
    iconAllowOverlap: true,
  },
};

const getSourceImage = (source) => {
  switch (source) {
  case 'meetup': return require('../assets/meetup_icon.png');
  }
};

const EventDetail = ({ IconComponent = McIcon, iconName, mainText, subText, onPress }) => {
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
  const { me } = useMine();
  const baseNav = useNavigation(Base);
  const event = baseNav.getParam('event');
  const sourceName = useMemo(() => upperFirst(event.source), [event.source]);
  const [attendanceCount, setAttendanceCount] = useState(event.attendanceCount);
  const [checkedIn, setCheckedIn] = useState(event.checkedIn);
  const [superToggleCheckIn] = mutations.toggleCheckIn.use(event);
  // Prepare cache
  const attendeesQuery = queries.attendees.use(event.id);

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
    const checkedIn = mutation.data.toggleCheckIn;

    setCheckedIn(mutation.data.toggleCheckIn);

    if (checkedIn) {
      setAttendanceCount(attendanceCount => attendanceCount + 1);
    }
    else {
      setAttendanceCount(attendanceCount => attendanceCount - 1);
    }

    attendeesQuery.updateQuery((prev) => {
      const attendees = prev.attendees?.slice();

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

  useEffect(() => attendeesQuery.clear, [true]);

  baseNav.useBackListener();

  return (
    <ScrollView style={styles.container}>
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
          <EventDetail
            iconName='clock-outline'
            mainText={eventDateLiteral}
            subText={eventTimeLiteral}
          />

          <EventDetail
            iconName='account-group'
            mainText={pluralize('attendee', attendanceCount, true)}
            subText={event.maxPeople && `${event.maxPeople} people max`}
            onPress={navToAttendeesScreen}
          />

          <EventDetail
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
              <View style={{ marginBottom: 20, marginTop: 10, alignSelf: 'stretch', alignItems: 'center' }}>
                <AutoHeightImage source={getSourceImage(event.source)} width={100} style={{ marginVertical: 20 }} />
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
      </View>
    </ScrollView>
  );
};

export default Base.create(Event);
