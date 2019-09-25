import { useMutation } from '@apollo/react-hooks';
import Geolocation from '@react-native-community/geolocation';
import { MapView } from '@react-native-mapbox-gl/maps';
import turfBboxPolygon from '@turf/bbox-polygon';
import turfBooleanPointInPolygon from '@turf/boolean-point-in-polygon';
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
    },

    text: {
      textSize: 20,
      textColor: 'white',
    },
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
  const { MapView, Camera, ShapeSource, HeatmapLayer, UserLocation, LineLayer, FillLayer, SymbolLayer } = useMapbox();
  const [areaFeatures, setAreaFeatures] = useState(emptyShape);
  const [screenFeatures, setScreenFeatures] = useState(emptyShape);
  const [initialLocation, setInitialLocation] = useState(null);
  const [selection, setSelection] = useState(null);

  const resetScreenFeatures = useCallback(async (e) => {
    let bbox = e.properties.visibleBounds;
    bbox = turfBboxPolygon([bbox[0][0], bbox[0][1], bbox[1][0], bbox[1][1]]);

    setScreenFeatures({
      type: 'FeatureCollection',
      // TODO: Use a quad tree
      features: areaFeatures.features.filter(feature =>
        turfBooleanPointInPolygon(feature, bbox.geometry)
      )
    });
  }, [setScreenFeatures, areaFeatures]);

  const renderSelection = useCallback(async (e) => {
    const map = mapRef.current;

    if (!map) return;

    const selectionCoords = e.geometry.coordinates;
    const viewCoords = [e.properties.screenPointX, e.properties.screenPointY];
    const viewMin = [viewCoords[0] - SELECTION_RADIUS, viewCoords[1] - SELECTION_RADIUS];
    const viewMax = [viewCoords[0] + SELECTION_RADIUS, viewCoords[1] + SELECTION_RADIUS];
    const [geoMin, geoMax] = await Promise.all([
      map.getCoordinateFromView(viewMin),
      map.getCoordinateFromView(viewMax),
    ]);
    const selectionRadius = turfDistance([geoMin[0], geoMin[1]], [geoMax[0], geoMin[1]]);
    const selectionFeatures = turfCircle(selectionCoords, selectionRadius);

    let selectionSize = 0;
    // TODO: Use a quad tree
    screenFeatures.features.forEach(({ geometry: { coordinates: coords } }) => {
      if (turfDistance(selectionCoords, coords) <= selectionRadius) {
        selectionSize++;
      }
    });
    // Never show 1 for security reasons
    if (selectionSize === 1) {
      selectionSize = 2;
    }

    setSelection({
      location: e,
      features: selectionFeatures,
      size: selectionSize === 1 ? 2 : selectionSize,
      zoom: await map.getZoom(),
    });
  }, [mapRef, setSelection, screenFeatures]);

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
        onRegionDidChange={resetScreenFeatures}
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
              minZoomLevel={selection.zoom - 3}
              maxZoomLevel={selection.zoom + 2}
            />

            <FillLayer
              id="selectionFill"
              sourceLayerID="selection"
              style={styles.selection.fill}
              minZoomLevel={selection.zoom - 3}
              maxZoomLevel={selection.zoom + 2}
            />
          </ShapeSource>
        )}

        {selection && (
          <ShapeSource
            id="selectionLocation"
            shape={selection.location}
          >
            <SymbolLayer
              id="selectionText"
              sourceLayerID="selection"
              minZoomLevel={selection.zoom - 3}
              maxZoomLevel={selection.zoom + 2}
              style={{ ...styles.selection.text, textField: selection.size.toString() }}
            />
          </ShapeSource>
        )}

        <ShapeSource
          id="featuresInArea"
          key={shapeKey}
          shape={areaFeatures}
          cluster
        >
          <HeatmapLayer
            id="featuresInAreaHeatmap"
            sourceID="featuresInArea"
            style={styles.heatmap}
          />
        </ShapeSource>
      </MapView>
    </LocationPermittedView>
  );
};

export default Screen.create(Map);
