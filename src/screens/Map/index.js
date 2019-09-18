import { MapView } from '@react-native-mapbox-gl/maps';
import React from 'react';
import { useQuery } from 'react-apollo-hooks';
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
  const meQuery = useQuery(queries.me);
  const { MapView, Camera, ShapeSource, HeatmapLayer } = useMapbox();

  if (meQuery.loading) {
    return (
      <ViewLoadingIndicator />
    );
  }

  const { me } = meQuery.data;

  return (
    <LocationPermittedView style={styles.container}>
      <MapView
        style={styles.map}
        styleURL={CONFIG.MAPBOX_STYLE_URL}
      >
        <Camera
          zoomLevel={10}
          centerCoordinate={me && me.location}
        />

        <ShapeSource
          id="earthquakes"
          url="https://www.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson"
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
