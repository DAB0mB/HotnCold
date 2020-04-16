import MapboxGL from '@react-native-mapbox-gl/maps';
import turfCircle from '@turf/circle';
import Flatbush from 'flatbush';
import { useRobot } from 'hotncold-robot';
import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { TouchableWithoutFeedback, Image, Text, View, StyleSheet } from 'react-native';
import CONFIG from 'react-native-config';
import MIcon from 'react-native-vector-icons/MaterialIcons';

import Base from '../../containers/Base';
import Discovery from '../../containers/Discovery';
import * as mutations from '../../graphql/mutations';
import { useMine } from '../../services/Auth';
import { useAppState } from '../../services/AppState';
import { useAlertError } from '../../services/DropdownAlert';
import { useScreenFrame } from '../../services/Frame';
import { useGeoBackgroundTelemetry } from '../../services/Geolocation';
import { useLoading } from '../../services/Loading';
import { useNavigation } from '../../services/Navigation';
import { colors, hexToRgba } from '../../theme';
import { maparg, mapfn, useRenderer, useMountState, useAsyncCallback } from '../../utils';

const AVATAR_SIZE = .19;
const LOCATION_UPDATE_INTERVAL = 60 * 1000;
const SELECTION_RADIUS = .4;
const DEFAULT_ZOOM = 15;
const MIN_ICON_DIV = 2;
const MAX_INTER_ZOOM = DEFAULT_ZOOM - 1;
const MIN_INTER_ZOOM = DEFAULT_ZOOM - 3;
const MIN_ZOOM = DEFAULT_ZOOM - 3;
const AVATAR_MARGIN = 28 / AVATAR_SIZE;

const defaultImages = {
  'cold-marker': require('../../assets/cold-marker.png'),
  'hot-marker': require('../../assets/hot-marker.png'),
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  watermarkContainer: {
    position: 'absolute',
    right: 8,
    top: 8,
  },
  watermarkImage: {
    width: 80,
    height: 20,
    opacity: 1 / 3,
  },
  selectionIndex: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, .5)',
  },
  selectionIndexText: {
    color: colors.ink,
  },
});

const mapStyles = {
  heatmap: {
    heatmapRadius: 15,
    heatmapWeight: mapfn.get('weight'),
    heatmapIntensity: mapfn.interpolate(
      maparg.linear,
      maparg.zoom,
      7, 0,
      15, .5,
    ),
    heatmapColor: mapfn.interpolate(
      maparg.linear,
      maparg.heatmapDensity,
      0, 'rgba(0, 0, 0, 0)',
      0.1, 'rgba(0, 0, 0, 0)',

      0.101, hexToRgba('#2150fa', .5),
      0.28, hexToRgba('#2150fa', .5),

      0.281, hexToRgba('#52ec3d', .6),
      0.46, hexToRgba('#52ec3d', .6),

      0.461, hexToRgba('#f7fa3b', .7),
      0.64, hexToRgba('#f7fa3b', .7),

      0.641, hexToRgba('#ee7628', .8),
      0.82, hexToRgba('#ee7628', .8),

      0.821, hexToRgba('#fa2121', .9),
    ),
  },
  marker: {
    iconSize: mapfn.interpolate(
      maparg.linear,
      maparg.zoom,
      MIN_INTER_ZOOM, .5 / MIN_ICON_DIV,
      MAX_INTER_ZOOM, .5,
    ),
    iconImage: mapfn.get('marker'),
    iconAnchor: 'bottom',
    iconAllowOverlap: true,
  },
  avatar: {
    iconSize: mapfn.interpolate(
      maparg.linear,
      maparg.zoom,
      MIN_INTER_ZOOM, AVATAR_SIZE / MIN_ICON_DIV,
      MAX_INTER_ZOOM, AVATAR_SIZE,
    ),
    iconImage: mapfn.getDeep('user.id'),
    iconAnchor: 'bottom',
    iconOffset: [0, -AVATAR_MARGIN],
    iconAllowOverlap: true,
  },
  name: {
    textColor: colors.ink,
    textHaloColor: 'white',
    textField: mapfn.getDeep('user.name'),
    textAnchor: 'top',
    textSize: 16,
    textHaloWidth: 1,
  },
  selection: {
    outline: {
      lineCap: 'round',
      lineColor: 'rgb(40, 23, 69)',
      lineWidth: 2,
      lineDasharray: [0, 2],
    },
  },
};

const isUserFeature = mapfn.all(
  mapfn.has('user'),
  mapfn.has('status'),
);

const emptyShape = {
  type: 'FeatureCollection',
  features: [],
};

export const $Map = {};

export const mapBubbleIcon = (
  <MIcon name='person-pin-circle' size={50} color='white' />
);

const Map = () => {
  const mine = useMine();
  const { me } = mine;
  const { useTrap } = useRobot();
  const baseNav = useNavigation(Base);
  const discoveryNav = useNavigation(Discovery);
  const mapRef = useRef(null);
  const cameraRef = useRef(null);
  const locationUpdatedAtRef = useRef(0);
  const alertError = useAlertError();
  const [appState, setAppState] = useAppState();
  const [updateMyLocation] = mutations.updateMyLocation.use(appState.mapTime);
  const [areaFeatures, setAreaFeatures] = useState(emptyShape);
  const [initialLocation, setInitialLocation] = useState(null);
  const [selection, setSelection] = useState(null);
  const [loaded, setLoaded] = useRenderer();
  const mountState = useMountState();
  const [bigBubbleActivated, setBigBubbleActivated] = useState(() => !!me.status?.location);
  const [flatbush, setFlatbush] = useState(null);

  const myFeature = useMemo(() => me.status?.location && {
    type: 'Feature',
    properties: {
      marker: 'hot-marker',
      user: {
        id: me.id,
        name: me.name,
        avatar: me.avatar,
      },
      status: {
        id: me.status.id,
        text: me.status.text,
        updatedAt: me.status.updatedAt,
      },
    },
    geometry: {
      type: 'Point',
      coordinates: me.location,
    },
  }, [me]);

  const images = useMemo(() => {
    const images = { ...defaultImages };

    for (const feature of areaFeatures.features) {
      if (!feature.properties.user) continue;

      images[feature.properties.user.id] = { uri: feature.properties.user.avatar };
    }

    if (myFeature) {
      images[myFeature.properties.user.id] = { uri: myFeature.properties.user.avatar };
    }

    return images;
  }, [myFeature, areaFeatures]);

  const [pickupStatus] = mutations.pickupStatus.use({
    onError: alertError,
  });

  discoveryNav.useBackListener();

  const onBigBubblePress = useCallback(() => {
    if (bigBubbleActivated) {
      pickupStatus();
    }
    else {
      baseNav.push('StatusEditor', { mine });
    }
  }, [mine, bigBubbleActivated, pickupStatus]);

  useEffect(() => {
    setBigBubbleActivated(!!me.status?.location);
  }, [!!me.status?.location]);

  useEffect(() => {
    // This will trigger location update
    locationUpdatedAtRef.current = 0;
  }, [appState.mapTime]);

  useScreenFrame({
    bigBubble: useMemo(() => ({
      icon: mapBubbleIcon,
      onPress: onBigBubblePress,
      activated: bigBubbleActivated,
    }), [bigBubbleActivated, onBigBubblePress]),
  });

  const zoomInterpolator = useAsyncCallback(function* (v) {
    const zoom = yield mapRef.current.getZoom();

    if (zoom <= MIN_INTER_ZOOM) return v / MIN_ICON_DIV;
    if (zoom >= MAX_INTER_ZOOM) return v;

    const delta = v - ((zoom - MIN_INTER_ZOOM) / (MAX_INTER_ZOOM - MIN_INTER_ZOOM)) * v;
    const result = v - (delta / MIN_ICON_DIV);

    return result;
  }, [true]);

  const onFeaturePress = useCallback((e) => {
    const feature = e.nativeEvent.payload;

    if (!feature.properties.user) return;

    setAppState(appState => ({
      ...appState,
      activeStatus: {
        user: feature.properties.user,
        status: feature.properties.status,
        isPartial: true,
      },
    }));
  }, [zoomInterpolator]);

  const showAttribution = useCallback(() => {
    mapRef.current.showAttribution();
  }, [true]);

  const navToSelection = useCallback(() => {
    baseNav.push('Selection', { selection });
  }, [baseNav, selection]);

  const renderSelection = useAsyncCallback(function* (e) {
    const map = mapRef.current;

    if (!map) return;

    const zoom = yield map.getZoom();

    // Don't render selection at this resolution
    if (zoom < MIN_ZOOM) {
      return;
    }

    const selectionCoords = e.geometry.coordinates;
    const selectionBorder = turfCircle(selectionCoords, SELECTION_RADIUS);
    const selectionIndexes = flatbush ? flatbush.neighbors(...selectionCoords, Infinity, SELECTION_RADIUS / 100) : [];
    const selectionFeatures = selectionIndexes.map(i => areaFeatures.features[i]);
    const eventsFeatures = selectionFeatures.filter(f => f.properties.type == 'event');
    const attendanceCount = eventsFeatures.reduce((count, f) => count + f.properties.event.attendanceCount, 0);

    setSelection({
      location: e,
      size: selectionIndexes.length,
      border: selectionBorder,
      features: selectionFeatures,
      eventsCount: eventsFeatures.length,
      attendanceCount,
      zoom,
    });
  }, [flatbush, areaFeatures]);

  useGeoBackgroundTelemetry({
    enabled: me.discoverable,
    interval: LOCATION_UPDATE_INTERVAL,
    fastestInterval: LOCATION_UPDATE_INTERVAL * 2,
  });

  useEffect(() => {
    const onLocationUpdate = (location) => {
      if (!mountState.current) return;

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

            switch (feature.properties.type) {
            case 'user':
              feature.properties.weight = 1;
              if (feature.properties.user.id != me.id) feature.properties.marker = 'cold-marker';
              break;
            case 'event':
              feature.properties.weight = 1 + feature.properties.event.attendanceCount;
              break;
            }
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
  }, [updateMyLocation, initialLocation, me]);

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
        <MapboxGL.Images images={images} />

        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={DEFAULT_ZOOM}
          centerCoordinate={initialLocation}
        />

        {selection && (
          <React.Fragment>
            <MapboxGL.ShapeSource
              id='selection'
              shape={selection.border}
            >
              <MapboxGL.LineLayer
                id='selectionOutline'
                sourceLayerID='selection'
                style={mapStyles.selection.outline}
                minZoomLevel={MIN_ZOOM}
              />
            </MapboxGL.ShapeSource>
          </React.Fragment>
        )}

        <MapboxGL.ShapeSource
          id='featuresInArea'
          onPress={onFeaturePress}
          {...({
            // Used for dev
            // url: 'https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson',
            shape: areaFeatures,
          })}
        >
          <MapboxGL.HeatmapLayer
            id='featuresInAreaHeatmap'
            sourceID='featuresInArea'
            style={mapStyles.heatmap}
          />

          <MapboxGL.SymbolLayer
            id='featuresInAreaMarkers'
            sourceID='featuresInArea'
            minZoomLevel={MIN_ZOOM}
            filter={isUserFeature}
            style={mapStyles.marker}
          />

          <MapboxGL.SymbolLayer
            id='featuresInAreaAvatars'
            sourceID='featuresInArea'
            minZoomLevel={MIN_ZOOM}
            filter={isUserFeature}
            style={mapStyles.avatar}
          />

          <MapboxGL.SymbolLayer
            id='featuresInAreaNames'
            sourceID='featuresInArea'
            minZoomLevel={MAX_INTER_ZOOM}
            filter={isUserFeature}
            style={mapStyles.name}
          />
        </MapboxGL.ShapeSource>

        {myFeature && (
          <MapboxGL.ShapeSource
            id='myFeature'
            shape={myFeature}
            onPress={onFeaturePress}
          >
            <MapboxGL.SymbolLayer
              id='myFeatureMarker'
              sourceID='myFeature'
              minZoomLevel={MIN_ZOOM}
              style={mapStyles.marker}
            />

            <MapboxGL.SymbolLayer
              id='myFeatureAvatar'
              sourceID='myFeature'
              minZoomLevel={MIN_ZOOM}
              style={mapStyles.avatar}
            />

            <MapboxGL.SymbolLayer
              id='myFeatureName'
              sourceID='myFeature'
              minZoomLevel={MAX_INTER_ZOOM}
              style={mapStyles.name}
            />
          </MapboxGL.ShapeSource>
        )}

        <MapboxGL.UserLocation />
      </MapboxGL.MapView>

      <TouchableWithoutFeedback onPress={showAttribution}>
        <View style={styles.watermarkContainer}>
          <Image source={require('./mapbox.png')} resizeMode='contain' style={styles.watermarkImage} />
        </View>
      </TouchableWithoutFeedback>

      {selection && (
        <TouchableWithoutFeedback onPress={navToSelection}>
          <View style={styles.selectionIndex}>
            <Text style={styles.selectionIndexText}>Events: {selection.eventsCount}</Text>
            <Text style={styles.selectionIndexText}>Attendance: {selection.attendanceCount}</Text>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

export default Discovery.create(Map);
