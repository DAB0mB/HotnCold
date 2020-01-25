import MapboxGL from '@react-native-mapbox-gl/maps';
import turfBboxPolygon from '@turf/bbox-polygon';
import turfBooleanPointInPolygon from '@turf/boolean-point-in-polygon';
import turfCircle from '@turf/circle';
import turfDistance from '@turf/distance';
import * as robot from 'hotncold-robot';
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet, AppState } from 'react-native';
import CONFIG from 'react-native-config';

import Base from '../../containers/Base';
import Discovery from '../../containers/Discovery';
import * as mutations from '../../graphql/mutations';
import * as queries from '../../graphql/queries';
import { useAlertError } from '../../services/DropdownAlert';
import { useGeoBackgroundTelemetry, useGeolocation } from '../../services/Geolocation';
import { useLoading } from '../../services/Loading';
import { useNavigation } from '../../services/Navigation';
import { colors, hexToRgba } from '../../theme';
import { useInterval, useRenderer, useMountedRef, useAsyncCallback } from '../../utils';
import SelectionButton from './SelectionButton';

const LOCATION_UPDATE_INTERVAL = 60 * 1000;
const SELECTION_RADIUS = .2;
const DEFAULT_ZOOM = 15;

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
      'rgba(0, 0, 0, 0)',
      0.1,
      'rgba(0, 0, 0, 0)',
      0.101,
      hexToRgba(colors.cold, 0.5),
      0.5,
      hexToRgba(colors.warm, 0.7),
      1,
      hexToRgba(colors.hot, 0.9),
    ],
  },

  selection: {
    outline: {
      lineCap: 'round',
      lineColor: 'rgb(40, 23, 69)',
      lineWidth: 2,
      lineDasharray: [0, 2],
    },

    text: {
      textSize: 20,
      textColor: 'rgb(40, 23, 69)',
    },
  },
});

const emptyShape = {
  type: 'FeatureCollection',
  features: [],
};

export const $Map = Symbol('Map');

const Map = () => {
  const mapRef = useRef(null);
  const alertError = useAlertError();
  const baseNav = useNavigation(Base);
  const geolocation = useGeolocation();
  const [shapeKey, renderShape] = useRenderer();
  const [updateMyLocation] = mutations.updateMyLocation.use();
  const [queryUsers] = queries.users.use();
  const [areaFeatures, setAreaFeatures] = useState(emptyShape);
  const [screenFeatures, setScreenFeatures] = useState(emptyShape);
  const [initialLocation, setInitialLocation] = useState(null);
  const [selection, setSelection] = useState(null);
  const [readyState, updateReadyState] = useRenderer();
  const loading = useMemo(() => readyState !== 2, [readyState]);
  const isMountedRef = useMountedRef();

  const resetScreenFeatures = useAsyncCallback(function* (e) {
    const map = mapRef.current;

    if (!map) return;

    const zoom = yield map.getZoom();

    // Don't capture features at this resolution
    if (zoom < DEFAULT_ZOOM - 3) {
      return;
    }

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

  const cancelSelection = useCallback(() => {
    setSelection(null);
  }, [true]);

  const navToUsers = useCallback(() => {
    if (!selection.size) return;

    baseNav.push('Social', {
      $setInitialRouteState: {
        routeName: 'People',
      },
    });
  }, [selection]);

  const renderSelection = useAsyncCallback(function* (e) {
    const map = mapRef.current;

    if (!map) return;

    const zoom = yield map.getZoom();

    // Don't render selection at this resolution
    if (zoom < DEFAULT_ZOOM - 3) {
      return;
    }

    const selectionCoords = e.geometry.coordinates;
    const selectionFeatures = turfCircle(selectionCoords, SELECTION_RADIUS);

    let selectionSize = 0;
    // TODO: Use a quad tree
    screenFeatures.features.forEach(({ geometry: { coordinates: coords } }) => {
      if (turfDistance(selectionCoords, coords) <= SELECTION_RADIUS) {
        selectionSize++;
      }
    });

    // Prepare cache
    queryUsers(screenFeatures.features.map(f => f.properties.userId));

    setSelection({
      location: e,
      features: selectionFeatures,
      size: selectionSize,
      zoom,
    });
  }, [mapRef, setSelection, screenFeatures]);

  useGeoBackgroundTelemetry({
    interval: LOCATION_UPDATE_INTERVAL,
    fastestInterval: LOCATION_UPDATE_INTERVAL * 2,
  });

  const updateMyLocationInterval = useCallback((initial) => {
    geolocation.getCurrentPosition((location) => {
      if (!isMountedRef.current) return;

      location = [location.coords.longitude, location.coords.latitude];

      if (initial) {
        // TODO: Use special async callback
        setInitialLocation(location);
        updateReadyState();
      }

      updateMyLocation(location).then(({ data: { updateMyLocation: areaFeatures } }) => {
        setAreaFeatures(areaFeatures);
      }).catch(alertError);
    }, alertError, {
      enableHighAccuracy: true,
      timeout: 5000,
    });
  }, [updateMyLocation, renderShape, setAreaFeatures]);

  useInterval(updateMyLocationInterval, LOCATION_UPDATE_INTERVAL, true);

  const appStateListener = useCallback((appState) => {
    if (appState === 'active') {
      updateMyLocationInterval(false);
    }
  }, [updateMyLocationInterval]);

  useEffect(() => {
    AppState.addEventListener('change', appStateListener);

    return () => {
      AppState.removeEventListener('change', appStateListener);
    };
  }, [appStateListener]);

  useEffect(() => {
    if (shapeKey) {
      // Dispose asap once rendered. It's a very heavy object
      setAreaFeatures(null);
    }
  }, [shapeKey, setAreaFeatures]);

  robot.trap.use($Map, {
    loaded: !loading,
  });

  return useLoading(loading,
    <View style={styles.container}>
      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={CONFIG.MAPBOX_STYLE_URL}
        onPress={renderSelection}
        onRegionWillChange={resetScreenFeatures}
        onRegionIsChanging={resetScreenFeatures}
        onRegionDidChange={resetScreenFeatures}
        onDidFinishLoadingMap={updateReadyState}
        compassViewPosition='top-left'
      >
        <MapboxGL.Camera
          zoomLevel={DEFAULT_ZOOM}
          centerCoordinate={initialLocation}
        />

        {selection && (
          <MapboxGL.ShapeSource
            id='selection'
            shape={selection.features}
          >
            <MapboxGL.LineLayer
              id='selectionOutline'
              sourceLayerID='selection'
              style={styles.selection.outline}
              minZoomLevel={DEFAULT_ZOOM - 3}
            />
          </MapboxGL.ShapeSource>
        )}

        <MapboxGL.ShapeSource
          id='featuresInArea'
          key={shapeKey}
          {...(
            CONFIG.FAKE_HEATMAP ? {
              url: 'https://www.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson'
            } : {
              shape: areaFeatures
            }
          )}
        >
          <MapboxGL.HeatmapLayer
            id='featuresInAreaHeatmap'
            sourceID='featuresInArea'
            style={styles.heatmap}
          />
        </MapboxGL.ShapeSource>

        <MapboxGL.UserLocation />
      </MapboxGL.MapView>

      <SelectionButton
        onUsersPress={navToUsers}
        onClosePress={cancelSelection}
        selection={selection}
      />
    </View>
  );
};

export default Discovery.create(Map);
