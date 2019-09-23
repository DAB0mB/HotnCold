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
import turf from '../../utils/turf';
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

const SELECTION_RADIUS = 50;

const Map = () => {
  const mapRef = useRef(null);
  const cameraRef = useRef(null);
  const meQuery = queries.me.withArea.use();
  const [shapeKey, renderShape] = useRenderer();
  const [updateMyLocation, updateMyLocationMutation] = mutations.updateMyLocation.use();
  const { MapView, Camera, ShapeSource, HeatmapLayer, UserLocation } = useMapbox();
  const [areaFeatures, setAreaFeatures] = useState(emptyShape);

  const renderSelection = useCallback(async (viewCoords) => {
    const map = mapRef.current;

    if (!map) return;

    const geoMin = map.getCoordinateFromView([viewCoord[0] - SELECTION_RADIUS, viewCoord[1] - SELECTION_RADIUS]);
    const geoMax = map.getCoordinateFromView([viewCoord[0] + SELECTION_RADIUS, viewCoord[1] + SELECTION_RADIUS]);
    const featuresCollection = map.queryRenderedFeaturesInRect([geoMin, geoMax]);
    const featuresNum = featuresCollection.features.length;

    // NEVER report 1 for security reasons
    return featuresNum == 1 ? 2 : featuresNum;
  }, [mapRef]);

  const updateMyLocationInterval = useCallback((initial) => {
    Geolocation.getCurrentPosition((location) => {
      location = [location.coords.longitude, location.coords.latitude];

      updateMyLocation(location).then(({ data: { updateMyLocation: areaFeatures } }) => {
        setAreaFeatures(areaFeatures);
        renderShape();

        if (initial && cameraRef.current) {
          cameraRef.current.flyTo(location);
          cameraRef.current.bounds();
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
        ref={mapRef}
        style={styles.map}
        styleURL={CONFIG.MAPBOX_STYLE_URL}
        onPress={renderSelection}
        logoEnabled={false}
      >
        <UserLocation />

        <Camera
          ref={cameraRef}
          zoomLevel={14}
          minZoomLevel={10}
          maxZoomLevel={16}
          centerCoordinate={me.location}
          bounds={me.area.bbox}
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
