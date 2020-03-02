import MapboxGL from '@react-native-mapbox-gl/maps';
import turfCircle from '@turf/circle';
import Flatbush from 'flatbush';
import { useRobot } from 'hotncold-robot';
import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { TouchableWithoutFeedback, Image, View, StyleSheet } from 'react-native';
import CONFIG from 'react-native-config';
import MIcon from 'react-native-vector-icons/MaterialIcons';

import { BAR_HEIGHT } from '../../components/Bar';
import StatusPopover from '../../components/StatusPopover';
import Base from '../../containers/Base';
import Discovery from '../../containers/Discovery';
import * as mutations from '../../graphql/mutations';
import { useMine } from '../../services/Auth';
import { useAlertError } from '../../services/DropdownAlert';
import { useScreenFrame } from '../../services/Frame';
import { useGeoBackgroundTelemetry } from '../../services/Geolocation';
import { useLoading } from '../../services/Loading';
import { useNavigation } from '../../services/Navigation';
import { colors, hexToRgba } from '../../theme';
import { maparg, mapfn, useRenderer, useMountedRef, useAsyncCallback } from '../../utils';

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
  'assets': ['pin'],
  'cold-marker': require('./cold-marker.png'),
  'hot-marker': require('./hot-marker.png'),
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
    left: 8,
    top: 8,
  },
  watermarkImage: {
    width: 80,
    height: 20,
    opacity: 1 / 3,
  },
});

const mapStyles = {
  heatmap: {
    heatmapColor: mapfn.interpolate(
      mapfn.linear(),
      mapfn.heatmapDensity(),
      0, 'rgba(0, 0, 0, 0)',
      0.1, 'rgba(0, 0, 0, 0)',
      0.101, hexToRgba(colors.cold, 0.5),
      0.5, hexToRgba(colors.warm, 0.7),
      1, hexToRgba(colors.hot, 0.9),
    ),
  },
  marker: {
    iconSize: mapfn.interpolate(
      mapfn.linear(),
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
      mapfn.linear(),
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
    text: {
      textSize: 20,
      textColor: 'white',
      textHaloColor: colors.ink,
      textHaloWidth: .5,
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

const Map = () => {
  const { me } = useMine();
  const { useTrap } = useRobot();
  const baseNav = useNavigation(Base);
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
  const statusState = useState(false);
  const [, setStatusVisiblity] = statusState;
  const [userPopover, setUserPopover] = useState({});

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
      if (!feature.properties.user) break;

      images[feature.properties.user.id] = { uri: feature.properties.user.avatar };
    }

    if (myFeature) {
      images[myFeature.properties.user.id] = { uri: myFeature.properties.user.avatar };
    }

    return images;
  }, [myFeature, areaFeatures]);

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

  const zoomInterpolator = useAsyncCallback(function* (v) {
    const zoom = yield mapRef.current.getZoom();

    if (zoom <= MIN_INTER_ZOOM) return v / MIN_ICON_DIV;
    if (zoom >= MAX_INTER_ZOOM) return v;

    const delta = v - ((zoom - MIN_INTER_ZOOM) / (MAX_INTER_ZOOM - MIN_INTER_ZOOM)) * v;
    const result = v - (delta / MIN_ICON_DIV);

    return result;
  }, [true]);

  const onFeaturePress = useAsyncCallback(function* (e) {
    const feature = e.nativeEvent.payload;

    if (!feature.properties.user) return;

    const viewCoords = yield mapRef.current.getPointInView(feature.geometry.coordinates);
    const size = yield zoomInterpolator(50);

    setUserPopover({
      user: feature.properties.user,
      status: feature.properties.status,
      fromRect: {
        x: (viewCoords[0] / 2) - (size / 2),
        y: (viewCoords[1] / 2) - size - (yield zoomInterpolator(28)) + BAR_HEIGHT,
        width: size,
        height: size,
      },
    });
    setStatusVisiblity(true);
  }, [zoomInterpolator]);

  const showAttribution = useCallback(() => {
    mapRef.current.showAttribution();
  }, [true]);

  const renderSelection = useAsyncCallback(function* (e) {
    const map = mapRef.current;

    if (!map) return;

    const zoom = yield map.getZoom();

    // Don't render selection at this resolution
    if (zoom < MIN_ZOOM) {
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

            if (feature.properties.user && feature.properties.user.id != me.id) {
              feature.properties.marker = 'cold-marker';
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
  }, [initialLocation, me]);

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
              shape={selection.features}
            >
              <MapboxGL.LineLayer
                id='selectionOutline'
                sourceLayerID='selection'
                style={mapStyles.selection.outline}
                minZoomLevel={MIN_ZOOM}
              />
            </MapboxGL.ShapeSource>

            <MapboxGL.ShapeSource
              id='selectionLocation'
              shape={selection.location}
            >
              <MapboxGL.SymbolLayer
                id='selectionText'
                sourceLayerID='selection'
                minZoomLevel={MIN_ZOOM}
                style={{ ...mapStyles.selection.text, textField: selection.size.toString() }}
              />
            </MapboxGL.ShapeSource>
          </React.Fragment>
        )}

        <MapboxGL.ShapeSource
          id='featuresInArea'
          shape={areaFeatures}
          onPress={onFeaturePress}
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

      <View style={styles.watermarkContainer}>
        <TouchableWithoutFeedback onPress={showAttribution}>
          <Image source={require('./mapbox.png')} resizeMode='contain' style={styles.watermarkImage} />
        </TouchableWithoutFeedback>
      </View>

      <StatusPopover
        isPartial
        state={statusState}
        baseNav={baseNav}
        {...userPopover}
      />
    </View>
  );
};

export default Discovery.create(Map);
