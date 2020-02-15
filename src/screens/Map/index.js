import MapboxGL from '@react-native-mapbox-gl/maps';
import turfBboxPolygon from '@turf/bbox-polygon';
import turfBooleanPointInPolygon from '@turf/boolean-point-in-polygon';
import turfCircle from '@turf/circle';
import turfDistance from '@turf/distance';
import { useRobot } from 'hotncold-robot';
import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { TouchableWithoutFeedback, Image, View, StyleSheet } from 'react-native';
import CONFIG from 'react-native-config';

import Base from '../../containers/Base';
import Discovery from '../../containers/Discovery';
import * as mutations from '../../graphql/mutations';
import * as queries from '../../graphql/queries';
import { useAlertError } from '../../services/DropdownAlert';
import { useScreenFrame } from '../../services/Frame';
import { useGeoBackgroundTelemetry } from '../../services/Geolocation';
import { useLoading } from '../../services/Loading';
import { useNavigation } from '../../services/Navigation';
import { colors, hexToRgba } from '../../theme';
import { useRenderer, useMountedRef, useAsyncCallback } from '../../utils';
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
  watermarkContainer: {
    position: 'absolute',
    left: 8,
    top: 8,
  },
  watermarkImage: {
    width: 80,
    height: 20,
    opacity: 1 / 3,
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
  const { useTrap } = useRobot();
  const mapRef = useRef(null);
  const cameraRef = useRef(null);
  const locationUpdatedAtRef = useRef(Date.now());
  const alertError = useAlertError();
  const baseNav = useNavigation(Base);
  const [updateMyLocation] = mutations.updateMyLocation.use();
  const [queryUsers] = queries.users.use();
  const [areaFeatures, setAreaFeatures] = useState(emptyShape);
  const [screenFeatures, setScreenFeatures] = useState(emptyShape);
  const [initialLocation, setInitialLocation] = useState(null);
  const [selection, setSelection] = useState(null);
  const [loaded, setLoaded] = useRenderer();
  const isMountedRef = useMountedRef();
  const [bigBubbleActivated, setBigBubbleActivated] = useState(false);

  useScreenFrame({
    bigBubble: useMemo(() => ({
      activeIconName: 'mailbox-open',
      inactiveIconName: 'mailbox',
      onPress: () => setBigBubbleActivated(a => !a),
      activated: bigBubbleActivated,
    }), [bigBubbleActivated]),
  });

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

  const navToPeople = useCallback(() => {
    if (!selection.size) return;

    baseNav.push('Social', {
      $setInitialRouteState: {
        routeName: 'People',
      },
    });
  }, [selection]);

  const showAttribution = useCallback(() => {
    mapRef.current.showAttribution();
  }, [true]);

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

  useEffect(() => {
    const onLocationUpdate = (location) => {
      if (!isMountedRef.current) return;

      location = [
        location.coords.longitude,
        location.coords.latitude,
      ];

      if (!initialLocation) {
        setInitialLocation(location);
      }

      // Update location once every {LOCATION_UPDATE_INTERVAL}ms
      if (Date.now() - LOCATION_UPDATE_INTERVAL < locationUpdatedAtRef.current) return;

      locationUpdatedAtRef.current = Date.now();

      updateMyLocation(location).then(({ data: { updateMyLocation: areaFeatures } }) => {
        // TODO: Return URL
        setAreaFeatures(areaFeatures);
      }).catch(alertError);
    };

    MapboxGL.locationManager.addListener(onLocationUpdate);

    return () => {
      MapboxGL.locationManager.removeListener(onLocationUpdate);
    };
  }, [initialLocation]);

  useTrap($Map, {
    loaded,
    get map() {
      return mapRef.current;
    },
    get camera() {
      return cameraRef.current;
    },
  });

  return useLoading(!loaded,
    <View style={styles.container}>
      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={CONFIG.MAPBOX_STYLE_URL}
        onPress={renderSelection}
        onRegionWillChange={resetScreenFeatures}
        onRegionIsChanging={resetScreenFeatures}
        onRegionDidChange={resetScreenFeatures}
        onDidFinishLoadingMap={setLoaded}
        attributionEnabled={false}
        logoEnabled={false}
      >
        <MapboxGL.Camera
          ref={cameraRef}
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

      <View style={styles.watermarkContainer}>
        <TouchableWithoutFeedback onPress={showAttribution}>
          <Image source={require('./mapbox.png')} resizeMode="contain" style={styles.watermarkImage} />
        </TouchableWithoutFeedback>
      </View>

      <SelectionButton
        onUsersPress={navToPeople}
        onClosePress={cancelSelection}
        selection={selection}
      />
    </View>
  );
};

export default Discovery.create(Map);
