import MapboxGL from '@react-native-mapbox-gl/maps';
import turfCircle from '@turf/circle';
import Flatbush from 'flatbush';
import { useRobot } from 'hotncold-robot';
import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { TouchableWithoutFeedback, Image, View, StyleSheet } from 'react-native';
import CONFIG from 'react-native-config';
import MIcon from 'react-native-vector-icons/MaterialIcons';

import Discovery from '../../containers/Discovery';
import * as mutations from '../../graphql/mutations';
import { useMine } from '../../services/Auth';
import { useAlertError } from '../../services/DropdownAlert';
import { useScreenFrame } from '../../services/Frame';
import { useGeoBackgroundTelemetry } from '../../services/Geolocation';
import { useLoading } from '../../services/Loading';
import { useNavigation } from '../../services/Navigation';
import { colors, hexToRgba } from '../../theme';
import { useRenderer, useMountedRef, useAsyncCallback } from '../../utils';

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

export const $Map = {};

const Map = () => {
  const { me } = useMine();
  const { useTrap } = useRobot();
  const discoveryNav = useNavigation(Discovery);
  const mapRef = useRef(null);
  const cameraRef = useRef(null);
  const locationUpdatedAtRef = useRef(0);
  const alertError = useAlertError();
  const [updateMyLocation] = mutations.updateMyLocation.use();
  const [areaFeatures, setAreaFeatures] = useState(emptyShape);
  const [initialLocation, setInitialLocation] = useState(null);
  const [selection, setSelection] = useState(null);
  const [loaded, setLoaded] = useRenderer();
  const isMountedRef = useMountedRef();
  const [bigBubbleActivated, setBigBubbleActivated] = useState(() => !!me.status?.location);
  const [flatbush, setFlatbush] = useState(null);

  const [dropStatus] = mutations.dropStatus.use({
    onError: alertError,
  });
  const [pickupStatus] = mutations.pickupStatus.use({
    onError: alertError,
  });

  discoveryNav.useBackListener();

  const onBigBubblePress = useCallback(() => {
    if (bigBubbleActivated) {
      pickupStatus();
    }
    else {
      dropStatus();
    }
  }, [bigBubbleActivated, dropStatus, pickupStatus]);

  useEffect(() => {
    setBigBubbleActivated(!!me.status?.location);
  }, [!!me.status?.location]);

  useScreenFrame({
    bigBubble: useMemo(() => ({
      icon: <MIcon name='person-pin-circle' size={50} color='white' />,
      onPress: onBigBubblePress,
      activated: bigBubbleActivated,
    }), [bigBubbleActivated, onBigBubblePress]),
  });

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
    const selectionSize = flatbush ? flatbush.neighbors(...selectionCoords, Infinity, SELECTION_RADIUS / 100).length : 0;

    setSelection({
      location: e,
      size: selectionSize,
      features: selectionFeatures,
      zoom,
    });
  }, [mapRef, setSelection, flatbush]);

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
        let flatbush = null;

        if (areaFeatures.features.length) {
          flatbush = new Flatbush(areaFeatures.features.length);

          areaFeatures.features.forEach((feature) => {
            const [x, y] = feature.geometry.coordinates;

            // Method accepts a rectangle
            flatbush.add(x, y, x, y);
          });

          flatbush.finish();
        }

        setFlatbush(flatbush);
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
          <React.Fragment>
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

            <MapboxGL.ShapeSource
              id='selectionLocation'
              shape={selection.location}
            >
              <MapboxGL.SymbolLayer
                id='selectionText'
                sourceLayerID='selection'
                minZoomLevel={selection.zoom - 3}
                maxZoomLevel={selection.zoom + 2}
                style={{ ...styles.selection.text, textField: selection.size.toString() }}
              />
            </MapboxGL.ShapeSource>
          </React.Fragment>
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
    </View>
  );
};

export default Discovery.create(Map);
