import MapboxGL from '@react-native-mapbox-gl/maps';
import { useApolloClient } from '@apollo/react-hooks';
import turfCircle from '@turf/circle';
import { around as flatbushAround } from 'geoflatbush';
import Flatbush from 'flatbush';
import { useRobot } from 'hotncold-robot';
import React, { useMemo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { TouchableWithoutFeedback, Image, View, Text, StyleSheet } from 'react-native';
import CONFIG from 'react-native-config';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import Selection from './Selection';
import Base from '../../containers/Base';
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
const SELECTION_RADIUS = 1;
const DEFAULT_ZOOM = 13;
const CAMERA_ZOOM = 13;
const MIN_ICON_DIV = 2.5;
const MAX_INTER_ZOOM = 14;
const MIN_INTER_ZOOM = 7;
const MIN_ZOOM = DEFAULT_ZOOM - 8;
const AVATAR_MARGIN = 28 / AVATAR_SIZE;

const defaultImages = {
  'cold-marker': require('../../assets/cold-marker.png'),
  'hot-marker': require('../../assets/hot-marker.png'),
  'avatar': require('../../assets/statusThumb.png'),
};

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  plusIcon: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  colorsIndex: { position: 'absolute', left: 10, top: 10, backgroundColor: 'rgba(255, 255, 255, .5)', flexDirection: 'column' },
  watermarkContainer: { position: 'absolute', right: 8, top: 8 },
  watermarkImage: { width: 80, height: 20, opacity: 1 / 3 },
});

const mapStyles = {
  heatmap: {
    heatmapRadius: 17,
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
  selection: {
    outline: {
      lineCap: 'round',
      lineColor: 'rgb(40, 23, 69)',
      lineWidth: 2,
      lineDasharray: [0, 2],
    },
    text: {
      textSize: 20,
      textColor: colors.ink,
    },
  },
};

export const $Map = {};

const pluckImages = (features) => {
  const images = {};

  for (const feature of features) {
    if (feature.properties.status.avatar) {
      images[feature.properties.status.id] = { uri: feature.properties.status.avatar };
    }
  }

  return images;
};

const Map = () => {
  const { me, myContract } = useMine();
  const { useTrap } = useRobot();
  const apolloClient = useApolloClient();
  const baseNav = useNavigation(Base);
  const discoveryNav = useNavigation(Discovery);
  const mapRef = useRef(null);
  const cameraRef = useRef(null);
  const [initialLocation, setInitialLocation] = useState(null);
  const [selection, setSelection] = useState(null);
  const [targetLocation, setTargetLocation] = useState(null);
  const alertError = useAlertError();
  const [appState, setAppState] = useAppState();
  const [loaded, setLoaded] = useRenderer();
  const [myFeatures, setMyFeatures] = useState([]);
  const [theirFeatures, setTheirFeatures] = useState([]);
  const allFeatures = useMemo(() => [...myFeatures, ...theirFeatures], [myFeatures, theirFeatures]);
  const activeStatusFeature = useMemo(() => allFeatures.find(f => f.properties.status.id === appState.activeStatus?.id), [appState?.activeStatus]);

  const areaFeatureCollection = useMemo(() => ({
    type: 'FeatureCollection', features: allFeatures,
  }), [allFeatures]);

  const flatbush = useMemo(() => {
    if (!allFeatures.length) return null;

    const flatbush = new Flatbush(allFeatures.length);

    for (let feature of allFeatures) {
      const [x, y] = feature.geometry.coordinates;

      flatbush.add(x, y, x, y);
    }

    flatbush.finish();

    return flatbush;
  }, [allFeatures]);

  useEffect(() => {
    if (!myContract.referenceSubmitted) {
      baseNav.push('ReferenceDetails');
    }
  }, []);

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

        feature.properties.image = status.avatar ? status.id : 'avatar';
        feature.properties.marker = status.isMeetup ? 'hot-marker' : 'cold-marker';

        if (status.author.id == me.id) {
          myFeatures.push(feature);
        }
        else {
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
    return pluckImages(myFeatures);
  }, [myFeatures]);

  const theirImages = useMemo(() => {
    return pluckImages(theirFeatures);
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

  const showAttribution = useCallback(() => {
    mapRef.current.showAttribution();
  }, [true]);

  const clearSelection = useCallback(() => {
    setSelection(null);
  }, []);

  const renderSelection = useAsyncCallback(function* (feature) {
    const map = mapRef.current;

    if (!map) return;

    const zoom = yield map.getZoom();

    const selectionCoords = feature?.geometry.coordinates || (yield mapRef.current.getCenter());
    const selectionBorder = turfCircle(selectionCoords, SELECTION_RADIUS);
    const selectionIndexes = flatbush ? flatbushAround(flatbush, ...selectionCoords, Infinity, SELECTION_RADIUS) : [];
    const selectionFeatures = selectionIndexes.map(i => allFeatures[i]);

    selectionFeatures.forEach((feature) => {
      const avatar = feature.properties.status.avatar;

      if (avatar) {
        Image.prefetch(avatar);
      }
    });

    setSelection({
      location: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: selectionCoords,
        },
      },
      size: selectionIndexes.length,
      border: selectionBorder,
      features: selectionFeatures,
      zoom,
    });

    cameraRef.current.setCamera({
      centerCoordinate: selectionCoords,
      zoomLevel: CAMERA_ZOOM,
      animationDuration: 2000,
    });
  }, [flatbush, allFeatures]);

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
            image: status.avatar ? status.id : 'avatar',
            marker: status.isMeetup ? 'hot-marker' : 'cold-marker',
            status: {
              id: status.id,
              text: status.text,
              thumb: status.thumb,
              avatar: status.avatar,
              firstImage: status.firstImage,
              isMeetup: status.isMeetup,
              author: {
                id: me.id,
                name: me.name,
                avatar: me.avatar,
              },
            },
          },
        },
      ]);

      setAppState(appState => ({
        ...appState,
        activeStatus: status,
      }));
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
          id='areaFeatures'
          shape={areaFeatureCollection}
        >
          <MapboxGL.HeatmapLayer
            id='areaFeaturesHeatmap'
            sourceID='areaFeatures'
            style={mapStyles.heatmap}
          />
        </MapboxGL.ShapeSource>

        {appState.activeStatus && (
          <MapboxGL.ShapeSource
            id='activeStatusFeature'
            shape={activeStatusFeature}
          >
            <MapboxGL.SymbolLayer
              id='activeStatusFeatureMarkers'
              sourceID='activeStatusFeature'
              minZoomLevel={MIN_ZOOM}
              style={mapStyles.marker}
            />

            <MapboxGL.SymbolLayer
              id='activeStatusFeatureAvatars'
              sourceID='activeStatusFeature'
              minZoomLevel={MIN_ZOOM}
              style={mapStyles.avatar}
            />
          </MapboxGL.ShapeSource>
        )}

        <MapboxGL.UserLocation />
      </MapboxGL.MapView>

      <View style={styles.colorsIndex}>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ height: 10, width: 10, margin: 5, backgroundColor: colors.hot }} /><Text style={{ color: colors.ink, marginRight: 5 }}>They wanna meet</Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ height: 10, width: 10, margin: 5, backgroundColor: colors.cold }} /><Text style={{ color: colors.ink, marginRight: 5 }}>Online discussion</Text>
        </View>
      </View>

      {appState.isCreatingStatus && (
        <View style={styles.plusIcon}>
          <McIcon name='target' color={colors.ink} size={20} />
        </View>
      )}

      <TouchableWithoutFeedback onPress={showAttribution}>
        <View style={styles.watermarkContainer}>
          <Image source={require('./mapbox.png')} resizeMode='contain' style={styles.watermarkImage} />
        </View>
      </TouchableWithoutFeedback>

      <Selection selection={selection} handleClearSelection={clearSelection} />
    </View>
  );
};

export default Discovery.create(Map);
