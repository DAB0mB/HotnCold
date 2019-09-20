import { useQuery, useLazyQuery } from '@apollo/react-hooks';
import { MapView } from '@react-native-mapbox-gl/maps';
import React, { useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import CONFIG from 'react-native-config';

import LocationPermittedView from '../../components/LocationPermittedView';
import ViewLoadingIndicator from '../../components/ViewLoadingIndicator';
import * as queries from '../../graphql/queries';
import { useMapbox } from '../../mapbox/utils';
import Screen from '../Screen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

const Map = () => {
  const mapRef = useRef(null);
  const meQuery = useQuery(queries.me);
  const [getUsersLocationsInArea, usersLocationsInAreaQuery] = useLazyQuery(queries.usersLocationsInArea, { fetchPolicy: 'no-cache' });
  const { MapView, Camera, ShapeSource, HeatmapLayer, UserLocation } = useMapbox();

  const handleRegionChange = useCallback(async () => {
    const map = mapRef.current;

    if (!map) return;

    const [center, bounds] = await Promise.all([
      map.getCenter(),
      map.getVisibleBounds(),
    ]);

    getUsersLocationsInArea({
      variables: {
        bounds: [[bounds[0][0], bounds[1][1]], [bounds[0][1], bounds[1][0]]],
        center,
      },
    });
  }, [mapRef]);

  if (meQuery.loading) {
    return (
      <ViewLoadingIndicator />
    );
  }

  const { me } = meQuery.data;
  const { usersLocationsInArea = [] } = usersLocationsInAreaQuery.data || {};

  return (
    <LocationPermittedView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        styleURL={CONFIG.MAPBOX_STYLE_URL}
        onRegionDidChange={handleRegionChange}
      >
        <UserLocation />

        <Camera
          zoomLevel={14}
          centerCoordinate={me && me.location.coordinates}
        />

        <ShapeSource
          id="earthquakes"
          shape={usersLocationsInArea}
        >
          <HeatmapLayer
            id="earthquakes"
            sourceID="earthquakes"
            style={{
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
            }}
          />
        </ShapeSource>
      </MapView>
    </LocationPermittedView>
  );
};

export default Screen.create(Map);
