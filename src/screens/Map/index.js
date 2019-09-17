import { MapView } from '@react-native-mapbox-gl/maps';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import CONFIG from 'react-native-config';

import LocationPermittedView from '../../components/LocationPermittedView';
import { useMapbox } from '../../mapbox/utils';
import Screen from '../Screen';

const SF_OFFICE_COORDINATE = [-122.400021, 37.789085];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

const Map = () => {
  const mapbox = useMapbox();
  const { MapView, Camera, ShapeSource, HeatmapLayer } = mapbox;

  return (
    <LocationPermittedView style={styles.container}>
      <MapView
        style={styles.map}
        styleURL={CONFIG.MAPBOX_STYLE_URL}
      >
        <Camera
          zoomLevel={10}
          centerCoordinate={SF_OFFICE_COORDINATE}
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
