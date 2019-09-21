import { useMutation } from '@apollo/react-hooks';
import Geolocation from '@react-native-community/geolocation';
import { MapView } from '@react-native-mapbox-gl/maps';
import React, { useCallback, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import CONFIG from 'react-native-config';

import LocationPermittedView from '../../components/LocationPermittedView';
import ViewLoadingIndicator from '../../components/ViewLoadingIndicator';
import * as mutations from '../../graphql/mutations';
import * as queries from '../../graphql/queries';
import { useMapbox } from '../../mapbox/utils';
import { useInterval, useRenderer } from '../../utils';
import Screen from '../Screen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

Object.assign(styles, {
  heatmap: {
    heatmapColor: [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0,
      'rgba(33,102,172,0)',
      0.2,
      'rgb(103,169,207)',
      0.4,
      'rgb(209,229,240)',
      0.6,
      'rgb(253,219,199)',
      0.8,
      'rgb(239,138,98)',
      1,
      'rgb(178,24,43)',
    ],
  },
});

const emptyShape = {
  type: 'FeatureCollection',
  features: [],
};

const Map = () => {
  const cameraRef = useRef(null);
  const meQuery = queries.me.use();
  const [shapeKey, renderShape] = useRenderer();
  const [updateMyLocation, updateMyLocationMutation] = mutations.updateMyLocation.use();
  const { MapView, Camera, ShapeSource, HeatmapLayer, UserLocation } = useMapbox();
  const [featuresNearMe, setFeaturesNearMe] = useState(emptyShape);

  const updateMyLocationInterval = useCallback((initial) => {
    Geolocation.getCurrentPosition((location) => {
      location = [location.coords.longitude, location.coords.latitude];

      updateMyLocation(location).then(({ data: { updateMyLocation: featuresNearMe } }) => {
        setFeaturesNearMe(featuresNearMe);
        renderShape();

        if (initial && cameraRef.current) {
          cameraRef.current.flyTo(location);
        }
      });
    });
  }, [updateMyLocation, cameraRef, renderShape]);

  useInterval(updateMyLocationInterval, 60 * 1000, true);

  const { me } = meQuery.data || {};

  if (!me) {
    return (
      <ViewLoadingIndicator />
    );
  }

  return (
    <LocationPermittedView style={styles.container}>
      <MapView
        style={styles.map}
        styleURL={CONFIG.MAPBOX_STYLE_URL}
      >
        <UserLocation />

        <Camera
          ref={cameraRef}
          zoomLevel={14}
          centerCoordinate={me.location}
        />

        <ShapeSource
          id="featuresNearMe"
          key={shapeKey}
          shape={featuresNearMe}
          cluster
        >
          <HeatmapLayer
            id="featuresNearMe"
            sourceID="featuresNearMe"
            style={styles.heatmap}
          />
        </ShapeSource>
      </MapView>
    </LocationPermittedView>
  );
};

export default Screen.create(Map);
