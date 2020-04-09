import MapboxGL from '@react-native-mapbox-gl/maps';
import moment from 'moment';
import pluralize from 'pluralize';
import React, { useMemo } from 'react';
import { View, ScrollView, TouchableWithoutFeedback, Image, Text, StyleSheet, Dimensions } from 'react-native';
import CONFIG from 'react-native-config';
import { RaisedTextButton } from 'react-native-material-buttons';
import HTML from 'react-native-render-html';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MIcon from 'react-native-vector-icons/MaterialIcons';

import Bar from '../components/Bar';
import Base from '../containers/Base';
import { useNavigation } from '../services/Navigation';
import { colors } from '../theme';

const images = {
  'marker': require('../assets/hot-marker.png'),
};

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
  },
  description: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  eventName: {
    fontSize: 24,
    padding: 20,
    fontWeight: '900',
    color: colors.ink,
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

const EventDetail = ({ IconComponent = McIcon, iconName, mainText, subText }) => {
  return (
    <View style={eventDetailStyles.container}>
      <IconComponent style={eventDetailStyles.icon} name={iconName} color={colors.gray} size={30} />

      <View style={eventDetailStyles.fields}>
        <Text style={eventDetailStyles.main}>{mainText}</Text>
        {subText && (
          <Text style={eventDetailStyles.sub}>{subText}</Text>
        )}
      </View>
    </View>
  );
};

const Event = () => {
  const baseNav = useNavigation(Base);
  const event = baseNav.getParam('event');

  const eventDateLiteral = useMemo(() =>
    moment(event.localDate, 'YYYY-MM-DD').calendar().split(' at')[0]
  , [event]);

  const eventTimeLiteral = useMemo(() => [
    event.localTime,
    moment(event.localTime, 'hh:mm').add(event.duration, 'milliseconds').format('hh:mm'),
  ].join(' - '), [event]);

  const eventFeature = useMemo(() => ({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Point',
      coordinates: event.location,
    },
  }), [event]);

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
            iconName='account-group'
            mainText={pluralize('attendee', event.attendanceCount, true)}
            subText={event.maxPeople && `${event.maxPeople} people max`}
          />

          <EventDetail
            iconName='clock-outline'
            mainText={eventDateLiteral}
            subText={eventTimeLiteral}
          />

          <EventDetail
            IconComponent={MIcon}
            iconName='pin-drop'
            mainText={event.venueName}
            subText={event.address}
          />
        </View>

        {event.featuredPhoto && (
          <Image style={styles.featuredPhoto} source={{ uri: event.featuredPhoto }} />
        )}

        <View style={styles.description}>
          <HTML html={event.description} imagesMaxWidth={Dimensions.get('window').width - 40} baseFontStyle={{ fontSize: 18 }} />
        </View>

        <View style={styles.map} pointerEvents='none'>
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

        <View style={{ padding: 20 }}>
          <RaisedTextButton
            color={colors.hot}
            title='Attend'
            titleColor='white'
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default Base.create(Event);
