import { useMutation } from '@apollo/react-hooks';
import Geolocation from '@react-native-community/geolocation';
import { MapView } from '@react-native-mapbox-gl/maps';
import turfCircle from '@turf/circle';
import turfDistance from '@turf/distance';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

  selection: {
    outline: {
      lineColor: 'orange',
      lineDasharray: [1, 1],
      lineWidth: 2,
    },

    fill: {
      fillColor: 'orange',
      fillOpacity: 0.5,
    }
  },
});

const emptyShape = {
  type: 'FeatureCollection',
  features: [],
};

const SELECTION_RADIUS = 100;

const Map = () => {
  const mapRef = useRef(null);
  const meQuery = queries.me.use();
  const [shapeKey, renderShape] = useRenderer();
  const [updateMyLocation, updateMyLocationMutation] = mutations.updateMyLocation.use();
  const { MapView, Camera, ShapeSource, HeatmapLayer, UserLocation, LineLayer, FillLayer } = useMapbox();
  const [areaFeatures, setAreaFeatures] = useState(emptyShape);
  const [initialLocation, setInitialLocation] = useState(null);
  const [selection, setSelection] = useState(null);

  const renderSelection = useCallback(async (e) => {
    const map = mapRef.current;

    if (!map) return;

    const selectionCoords = e.geometry.coordinates;
    const viewCoords = await map.getPointInView(selectionCoords);
    const [geoMin, geoMax] = await Promise.all([
      map.getCoordinateFromView([viewCoords[0] - SELECTION_RADIUS, viewCoords[1] - SELECTION_RADIUS]),
      map.getCoordinateFromView([viewCoords[0] + SELECTION_RADIUS, viewCoords[1] + SELECTION_RADIUS]),
    ]);
    const featuresCollection = await map.queryRenderedFeaturesInRect([...geoMin, ...geoMax], ['==', 'entity', 'user']);
    const selectionSize = featuresCollection.features.length;
    const selectionRadius = turfDistance([geoMin[0], geoMin[1]], [geoMax[0], geoMin[1]]);
    const selectionFeatures = turfCircle(selectionCoords, selectionRadius);

    console.log(selectionSize);

    setSelection({
      features: selectionFeatures,
      // Never show 1 for security reasons
      size: selectionSize === 1 ? 2 : selectionSize,
    });
  }, [mapRef, setSelection]);

  const updateMyLocationInterval = useCallback((initial) => {
    Geolocation.getCurrentPosition((location) => {
      location = [location.coords.longitude, location.coords.latitude];

      if (initial) {
        setInitialLocation(location);
      }

      updateMyLocation(location).then(({ data: { updateMyLocation: areaFeatures } }) => {
        setAreaFeatures(areaFeatures);
      });
    });
  }, [updateMyLocation, renderShape, setAreaFeatures]);

  useInterval(updateMyLocationInterval, 60 * 1000, true);

  useEffect(() => {
    if (shapeKey) {
      // Dispose asap once rendered. It's a very heavy object
      setAreaFeatures(null);
    }
  }, [shapeKey, setAreaFeatures]);

  const { me } = meQuery.data || {};

  if (!me || !initialLocation) {
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
      >
        <UserLocation />

        <Camera
          zoomLevel={15}
          centerCoordinate={initialLocation}
        />

        {selection && (
          <ShapeSource
            id="selection"
            shape={selection.features}
          >
            <LineLayer
              id="selectionOutline"
              sourceLayerID="selection"
              style={styles.selection.outline}
            />

            <FillLayer
              id="selectionFill"
              sourceLayerID="selection"
              style={styles.selection.fill}
            />
          </ShapeSource>
        )}

        <ShapeSource
          id="featuresNearMe"
          key={shapeKey}
          shape={areaFeatures}
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
