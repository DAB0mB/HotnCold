import MapboxGL from '@react-native-mapbox-gl/maps';
import turfBboxPolygon from '@turf/bbox-polygon';
import turfBooleanPointInPolygon from '@turf/boolean-point-in-polygon';
import turfCircle from '@turf/circle';
import turfDistance from '@turf/distance';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, AppState } from 'react-native';
import CONFIG from 'react-native-config';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import * as mutations from '../../graphql/mutations';
import * as queries from '../../graphql/queries';
import { useLogout } from '../../services/Auth';
import { useAlertError } from '../../services/DropdownAlert';
import { useGeoBackgroundTelemetry, useGeolocation } from '../../services/Geolocation';
import { useLoading } from '../../services/Loading';
import { useNavigation } from '../../services/Navigation';
import { colors, hexToRgba } from '../../theme';
import { useInterval, useRenderer, useMountedRef } from '../../utils';
import Base from '../../containers/Base';
import Discovery from '../../containers/Discovery';
import SelectionButton from './SelectionButton';

const SHOW_FAKE_DATA = false;
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
  devIconsContainer: {
    position: 'absolute',
    flexDirection: 'row',
    padding: 10,
    right: 0,
    bottom: 0,
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

const Map = () => {
  const logout = useLogout();
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
  const isMountedRef = useMountedRef();

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

  const logoutAndFlee = useCallback(() => {
    logout().then(() => {
      baseNav.replace('Profile');
    }).catch(alertError);
  }, [logout, alertError, baseNav]);

  const cancelSelection = useCallback(() => {
    setSelection(null);
  }, [true]);

  const navToUsers = useCallback(() => {
    if (!selection.size) return;

    baseNav.push('Social', {
      childNavigationState: {
        routeName: 'People',
      },
    });
  }, [selection]);

  const renderSelection = useCallback(async (e) => {
    const map = mapRef.current;

    if (!map) return;

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
      zoom: await map.getZoom(),
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

  return useLoading(readyState !== 2,
    <View style={styles.container}>
      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={CONFIG.MAPBOX_STYLE_URL}
        onPress={renderSelection}
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
            SHOW_FAKE_DATA ? {
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

      {__DEV__ && (
        <View style={styles.devIconsContainer}>
          <TouchableWithoutFeedback onPress={logoutAndFlee}>
            <View>
              <McIcon name='logout' size={30} color={hexToRgba(colors.ink, 0.8)} />
            </View>
          </TouchableWithoutFeedback>
        </View>
      )}
    </View>
  );
};

export default Discovery.create(Map);
