import MapboxGL from '@react-native-mapbox-gl/maps';
import { useApolloClient } from '@apollo/react-hooks';
import { useRobot } from 'hotncold-robot';
import React, { useMemo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { TouchableWithoutFeedback, Image, View, StyleSheet } from 'react-native';
import CONFIG from 'react-native-config';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import Discovery from '../../containers/Discovery';
import * as queries from '../../graphql/queries';
import { useAppState } from '../../services/AppState';
import { useMine } from '../../services/Auth';
import { useAlertError } from '../../services/DropdownAlert';
import { useScreenFrame } from '../../services/Frame';
import { useLoading } from '../../services/Loading';
import { useNavigation } from '../../services/Navigation';
import { colors, hexToRgba } from '../../theme';
import { mapx, useRenderer, useAsyncCallback, useAsyncEffect } from '../../utils';

const AVATAR_SIZE = .19;
const LOCATION_UPDATE_INTERVAL = 60 * 1000;
const DEFAULT_ZOOM = 15;
const MIN_ICON_DIV = 2;
const MAX_INTER_ZOOM = DEFAULT_ZOOM - 1;
const MIN_INTER_ZOOM = DEFAULT_ZOOM - 3;
const MIN_ZOOM = DEFAULT_ZOOM - 3;
const AVATAR_MARGIN = 28 / AVATAR_SIZE;

const defaultImages = {
  'cold-marker': require('../../assets/cold-marker.png'),
  'hot-marker': require('../../assets/hot-marker.png'),
  'avatar': require('../../assets/avatar.png'),
};

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  plusIcon: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  watermarkContainer: { position: 'absolute', right: 8, top: 8 },
  watermarkImage: { width: 80, height: 20, opacity: 1 / 3 },
});

const mapStyles = {
  heatmap: {
    heatmapRadius: 15,
    heatmapWeight: mapx('get_deep', 'status.weight'),
    heatmapIntensity: mapx('interpolate',
      mapx('linear'),
      mapx('zoom'),
      7, 0,
      15, .5,
    ),
    heatmapColor: mapx('interpolate',
      mapx('linear'),
      mapx('heatmap-density'),
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
    iconSize: mapx('interpolate',
      mapx('linear'),
      mapx('zoom'),
      MIN_INTER_ZOOM, .5 / MIN_ICON_DIV,
      MAX_INTER_ZOOM, .5,
    ),
    iconImage: mapx('get', 'marker'),
    iconAnchor: 'bottom',
    iconAllowOverlap: true,
  },
  avatar: {
    iconSize: mapx('interpolate',
      mapx('linear'),
      mapx('zoom'),
      MIN_INTER_ZOOM, AVATAR_SIZE / MIN_ICON_DIV,
      MAX_INTER_ZOOM, AVATAR_SIZE,
    ),
    iconImage: mapx('get', 'image'),
    iconAnchor: 'bottom',
    iconOffset: [0, -AVATAR_MARGIN],
    iconAllowOverlap: true,
  },
  name: {
    textColor: colors.ink,
    textHaloColor: 'white',
    textField: mapx('get_deep', 'status.author.name'),
    textAnchor: 'top',
    textSize: 16,
    textHaloWidth: 1,
  },
};

export const $Map = {};

const Map = () => {
  const { me } = useMine();
  const { useTrap } = useRobot();
  const apolloClient = useApolloClient();
  const discoveryNav = useNavigation(Discovery);
  const mapRef = useRef(null);
  const cameraRef = useRef(null);
  const [initialLocation, setInitialLocation] = useState(null);
  const [targetLocation, setTargetLocation] = useState(null);
  const alertError = useAlertError();
  const [appState, setAppState] = useAppState();
  const [loaded, setLoaded] = useRenderer();
  const [myFeatures, setMyFeatures] = useState([]);
  const [theirFeatures, setTheirFeatures] = useState([]);

  const areaFeatureCollection = useMemo(() => ({
    type: 'FeatureCollection', features: [...myFeatures, ...theirFeatures],
  }), [myFeatures, theirFeatures]);

  queries.areaStatuses.use(targetLocation, {
    onCompleted: useCallback((data) => {
      if (!data) return;

      const statuses = data.areaStatuses;
      const theirFeatures = [];
      const myFeatures = [];

      statuses.forEach((status) => {
        const feature = {
          type: 'Feature',
          properties: { status },
          geometry: {
            type: 'Point',
            coordinates: status.location,
          },
        };

        if (status.author.id == me.id) {
          feature.properties.image = me.avatar ? me.id : 'avatar';
          feature.properties.marker = 'hot-marker';
          myFeatures.push(feature);
        }
        else {
          feature.properties.image = status.author.avatar ? status.author.id : 'avatar';
          feature.properties.marker = 'cold-marker';
          theirFeatures.push(feature);
        }
      });

      setTheirFeatures(theirFeatures);
      setMyFeatures(myFeatures);
    }),
    onError: alertError,
  });

  useScreenFrame();
  discoveryNav.useBackListener();

  const myImages = useMemo(() => {
    const images = {};

    if (me.avatar) {
      images[me.id] = { uri: me.avatar };
    }

    return images;
  }, [me.avatar]);

  const theirImages = useMemo(() => {
    const images = {};

    for (const feature of theirFeatures) {
      if (feature.properties.status.author.avatar) {
        images[feature.properties.status.author.id] = { uri: feature.properties.status.author.avatar };
      }
    }

    return images;
  }, [theirFeatures]);

  const images = useMemo(() => ({
    ...defaultImages,
    ...myImages,
    ...theirImages,
  }), [myImages, theirImages]);

  const updateTargetLocation = useAsyncCallback(function* (location) {
    if (!location) {
      location = yield mapRef.current.getCenter();
    }

    setTargetLocation(location);
  }, [true]);

  useEffect(() => {
    if (initialLocation) return;

    const listener = ({ coords } = {}) => {
      if (!coords) return;

      const location = [
        coords.longitude,
        coords.latitude,
      ];

      setInitialLocation(location);
      updateTargetLocation(location);
    };

    MapboxGL.locationManager.addListener(listener);

    return () => {
      MapboxGL.locationManager.removeListener(listener);
    };
  }, [!!initialLocation]);

  useLayoutEffect(() => {
    setAppState(appState => ({
      ...appState,
      discoveryMap: mapRef,
      discoveryCamera: cameraRef,
    }));

    return () => {
      setAppState(appState => {
        appState = { ...appState };
        delete appState.discoveryMap;
        delete appState.discoveryCamera;

        return appState;
      });
    };
  }, [true]);

  const onStatusFeaturePress = useCallback((e) => {
    const feature = e.nativeEvent.payload;

    setAppState(appState => ({
      ...appState,
      activeStatus: feature.properties.status,
    }));
  }, [true]);

  const showAttribution = useCallback(() => {
    mapRef.current.showAttribution();
  }, [true]);

  useAsyncEffect(function* () {
    const interval = setInterval(() => {
      updateTargetLocation();
    }, LOCATION_UPDATE_INTERVAL);

    if (appState.discoveryArea) {
      if (appState.discoveryArea.__reset) {
        const { coords } = yield MapboxGL.locationManager.getLastKnownLocation();

        const location = [
          coords.longitude,
          coords.latitude,
        ];

        cameraRef.current.flyTo(location);
        updateTargetLocation(location);
      }
      else {
        cameraRef.current.flyTo(appState.discoveryArea.center);
        updateTargetLocation(appState.discoveryArea.center);
      }
    }

    return () => {
      clearInterval(interval);
    };
  }, [appState.discoveryArea]);

  useEffect(() => {
    const onStatusCreate = ({ operationName, data }) => {
      if (operationName != 'CreateStatus') return;

      const status = data.createStatus;

      setMyFeatures(myFeatures => [
        ...myFeatures,
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: status.location,
          },
          properties: {
            weight: 1,
            image: me.avatar ? me.id : 'avatar',
            marker: 'hot-marker',
            status: {
              id: status.id,
              text: status.text,
              author: {
                id: me.id,
                name: me.name,
                avatar: me.avatar,
              },
            },
          },
        },
      ]);
    };

    apolloClient.events.on('response', onStatusCreate);

    return () => {
      apolloClient.events.off('response', onStatusCreate);
    };
  }, [me]);

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

        <MapboxGL.ShapeSource
          id='areaFeatures'
          onPress={onStatusFeaturePress}
          shape={areaFeatureCollection}
        >
          <MapboxGL.HeatmapLayer
            id='areaFeaturesHeatmap'
            sourceID='areaFeatures'
            style={mapStyles.heatmap}
          />

          <MapboxGL.SymbolLayer
            id='areaFeaturesMarkers'
            sourceID='areaFeatures'
            minZoomLevel={MIN_ZOOM}
            style={mapStyles.marker}
          />

          <MapboxGL.SymbolLayer
            id='areaFeaturesAvatars'
            sourceID='areaFeatures'
            minZoomLevel={MIN_ZOOM}
            style={mapStyles.avatar}
          />

          <MapboxGL.SymbolLayer
            id='areaFeaturesNames'
            sourceID='areaFeatures'
            minZoomLevel={MAX_INTER_ZOOM}
            style={mapStyles.name}
          />
        </MapboxGL.ShapeSource>

        <MapboxGL.UserLocation />
      </MapboxGL.MapView>

      <View style={styles.plusIcon}>
        <McIcon name='plus' color={colors.ink} size={12} />
      </View>

      <TouchableWithoutFeedback onPress={showAttribution}>
        <View style={styles.watermarkContainer}>
          <Image source={require('./mapbox.png')} resizeMode='contain' style={styles.watermarkImage} />
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default Discovery.create(Map);
