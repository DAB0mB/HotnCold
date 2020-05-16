import MapboxGL from '@react-native-mapbox-gl/maps';
import turfCircle from '@turf/circle';
import cloneDeep from 'lodash.clonedeep';
import Flatbush from 'flatbush';
import { useRobot } from 'hotncold-robot';
import Lunr from 'lunr';
import React, { useMemo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { TouchableWithoutFeedback, Image, Text, View, StyleSheet } from 'react-native';
import CONFIG from 'react-native-config';
import Ripple from 'react-native-material-ripple';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import Base from '../../containers/Base';
import Discovery from '../../containers/Discovery';
import * as mutations from '../../graphql/mutations';
import { useAppState } from '../../services/AppState';
import { useMine } from '../../services/Auth';
import { useAlertError } from '../../services/DropdownAlert';
import { useScreenFrame } from '../../services/Frame';
import { useGeoBackgroundTelemetry } from '../../services/Geolocation';
import { useLoading } from '../../services/Loading';
import { useNavigation } from '../../services/Navigation';
import { colors, hexToRgba } from '../../theme';
import { maparg, mapfn, useRenderer, useMountState, useAsyncCallback, useAsyncEffect } from '../../utils';

const AVATAR_SIZE = .19;
const LOCATION_UPDATE_INTERVAL = 60 * 1000;
const SELECTION_RADIUS = .4;
const DEFAULT_ZOOM = 15;
const MIN_ICON_DIV = 2;
const MAX_INTER_ZOOM = DEFAULT_ZOOM - 1;
const MIN_INTER_ZOOM = DEFAULT_ZOOM - 3;
const MIN_ZOOM = DEFAULT_ZOOM - 3;
const AVATAR_MARGIN = 28 / AVATAR_SIZE;

// TODO: 1 events if only 1 status was captured in selection

const defaultImages = {
  'cold-marker': require('../../assets/cold-marker.png'),
  'hot-marker': require('../../assets/hot-marker.png'),
  'avatar': require('../../assets/avatar.png'),
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
  selectionIndexRelative: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  selectionIndexText: {
    color: colors.ink,
  },
  selectionOutdatedIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  plusIcon: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionIconView: {
    position: 'absolute',
    width: 60,
    height: 60,
    right: 10,
    bottom: 70,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.lightGray,
    backgroundColor: 'white',
    padding: 3.5,
  },
  selectionIconRipple: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: colors.cold,
    alignItems: 'center',
    justifyContent: 'center',
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
    iconImage: mapfn.get('image'),
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

const isFeatureDisplayed = mapfn.eq(
  mapfn.get('displayed'),
  true,
);

export const $Map = {};

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
  const [superUpdateMyLocation, updateMyLocationMutation] = mutations.updateMyLocation.use(appState.discoveryTime);
  const [otherFeatures, setOtherFeatures] = useState([]);
  const [myFeatures, setMyFeatures] = useState([]);
  const mapFeatureCollection = useMemo(() => ({
    type: 'FeatureCollection', features: [...myFeatures, ...otherFeatures]
  }), [myFeatures, otherFeatures]);
  const [initialLocation, setInitialLocation] = useState(null);
  const [selection, setSelection] = useState(null);
  const [loaded, setLoaded] = useRenderer();
  const mountState = useMountState();
  // TODO: Use additional rbush + rbush-knn for dynamic status features
  // Package: https://github.com/mourner/rbush
  const [flatbush, setFlatbush] = useState(null);
  const idx = appState.discoveryIndex;
  const filterText = appState.discoveryFilterText;

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
            type: 'status',
            image: me.avatar ? me.id : 'avatar',
            marker: 'hot-marker',
            user: {
              id: me.id,
              name: me.name,
              avatar: me.avatar,
            },
            status: {
              id: status.id,
              text: status.text,
            },
          },
        },
      ]);
    };

    const onStatusDelete = ({ operationName, variables }) => {
      if (operationName != 'DeleteStatus') return;

      const { statusId } = variables;

      setMyFeatures(myFeatures => {
        const statusIndex = myFeatures.findIndex(f => f.properties.status.id === statusId);
        myFeatures = myFeatures.slice();
        myFeatures.splice(statusIndex, 1);

        return myFeatures;
      });
    };

    updateMyLocationMutation.client.events.on('response', onStatusCreate);
    updateMyLocationMutation.client.events.on('response', onStatusDelete);

    return () => {
      updateMyLocationMutation.client.events.off('response', onStatusCreate);
      updateMyLocationMutation.client.events.off('response', onStatusDelete);
    };
  }, [me]);

  useScreenFrame();
  discoveryNav.useBackListener();

  const myImages = useMemo(() => {
    const images = {};

    if (me.avatar) {
      images[me.id] = { uri: me.avatar };
    }

    return images;
  }, [me.avatar]);

  const otherImages = useMemo(() => {
    const images = {};

    for (const feature of otherFeatures) {
      if (!feature.properties.user) continue;

      if (feature.properties.user.avatar) {
        images[feature.properties.user.id] = { uri: feature.properties.user.avatar };
      }
    }

    return images;
  }, [otherFeatures]);

  const images = useMemo(() => ({ ...defaultImages, ...myImages, ...otherImages }), [myImages, otherImages]);

  const filterEventsFeatures = useCallback((features = otherFeatures) => {
    if (idx && filterText) {
      const refs = new Set(idx.search(filterText).map(doc => doc.ref));

      features.forEach((feature) => {
        if ('event' in feature.properties) {
          feature.properties.displayed = refs.has(feature.properties.event.id);
        }
        else {
          feature.properties.displayed = true;
        }
      });
    }
    else {
      features.forEach((feature) => {
        feature.properties.displayed = true;
      });
    }
  }, [idx, filterText, otherFeatures]);

  const updateMyLocation = useCallback((location, force) => {
    if (!mountState.current) return;

    location = [
      location.coords.longitude,
      location.coords.latitude,
    ];

    if (!initialLocation) {
      setInitialLocation(location);
    }

    // Update location once every {LOCATION_UPDATE_INTERVAL}ms
    if (!force && Date.now() - LOCATION_UPDATE_INTERVAL < locationUpdatedAtRef.current) return;

    locationUpdatedAtRef.current = Date.now();

    superUpdateMyLocation(location).then(({ data: { updateMyLocation: { features } } }) => {
      let flatbush = null;
      let idx = null;
      const otherFeatures = [];
      const myFeatures = [];

      if (features.length) {
        flatbush = new Flatbush(features.length);
        const idxBuilder = new Lunr.Builder();
        idxBuilder.field('name');
        idxBuilder.field('category');

        features.forEach((feature) => {
          switch (feature.properties.type) {
          case 'status':
            feature.properties.weight = 1;
            feature.properties.displayed = true;

            if (feature.properties.user.id == me.id) {
              feature.properties.image = me.avatar ? me.id : 'avatar';
              feature.properties.marker = 'hot-marker';
              myFeatures.push(feature);
            }
            else {
              feature.properties.image = feature.properties.user.avatar ? feature.properties.user.id : 'avatar';
              feature.properties.marker = 'cold-marker';
              otherFeatures.push(feature);
            }
            break;
          case 'event':
            feature.properties.weight = 1 + feature.properties.event.attendanceCount;
            otherFeatures.push(feature);
            idxBuilder.add({
              id: feature.properties.event.id,
              name: feature.properties.event.name,
              category: feature.properties.event.category,
            });
            break;
          }
        });

        idx = idxBuilder.build();
      }

      if (otherFeatures.length) {
        flatbush = new Flatbush(otherFeatures.length);

        otherFeatures.forEach((feature) => {
          const [x, y] = feature.geometry.coordinates;

          flatbush.add(x, y, x, y);
        });

        flatbush.finish();
      }

      filterEventsFeatures(otherFeatures);

      setFlatbush(flatbush);
      setOtherFeatures(otherFeatures);
      setMyFeatures(myFeatures);

      setSelection(selection => selection && ({
        ...selection,
        isOutdated: true,
      }));

      setAppState(appState => ({
        ...appState,
        discoveryIndex: idx,
      }));
    }).catch(alertError);
  }, [alertError, initialLocation, superUpdateMyLocation, filterEventsFeatures]);

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

        return appState;
      });
    };
  }, [true]);

  useAsyncEffect(function* () {
    const location = yield MapboxGL.locationManager.getLastKnownLocation();

    if (location) {
      updateMyLocation(location, true);
    }
  }, [appState.discoveryTime]);

  useEffect(() => {
    setSelection(selection => {
      if (!selection) return selection;

      selection = cloneDeep(selection);
      selection.isOutdated = true;

      return selection;
    });

    filterEventsFeatures();

    setOtherFeatures(otherFeatures => otherFeatures && otherFeatures.slice());
  }, [filterText]);

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

  const renderSelection = useAsyncCallback(function* (feature) {
    const map = mapRef.current;

    if (!map) return;

    const zoom = yield map.getZoom();

    // Don't render selection at this resolution
    if (zoom < MIN_ZOOM) {
      return;
    }

    const selectionCoords = feature?.geometry.coordinates || (yield mapRef.current.getCenter());
    const selectionBorder = turfCircle(selectionCoords, SELECTION_RADIUS);
    const selectionIndexes = flatbush ? flatbush.neighbors(...selectionCoords, Infinity, SELECTION_RADIUS / 100) : [];
    const selectionFeatures = selectionIndexes.map(i => otherFeatures[i]);
    const eventsFeatures = selectionFeatures.filter(f => f.properties.type == 'event' && f.properties.displayed);
    const attendanceCount = eventsFeatures.reduce((count, f) => count + f.properties.event.attendanceCount, 0);

    eventsFeatures.forEach((feature) => {
      const featuredPhoto = feature.properties.event.featuredPhoto;

      if (featuredPhoto) {
        Image.prefetch(featuredPhoto);
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
      eventsCount: eventsFeatures.length,
      attendanceCount,
      zoom,
    });
  }, [flatbush, otherFeatures]);

  useGeoBackgroundTelemetry({
    enabled: me.discoverable,
    interval: LOCATION_UPDATE_INTERVAL,
    fastestInterval: LOCATION_UPDATE_INTERVAL * 2,
  });

  useEffect(() => {
    MapboxGL.locationManager.addListener(updateMyLocation);

    return () => {
      MapboxGL.locationManager.removeListener(updateMyLocation);
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
          id='mapFeatures'
          onPress={onFeaturePress}
          shape={mapFeatureCollection}
        >
          <MapboxGL.HeatmapLayer
            id='mapFeaturesHeatmap'
            sourceID='mapFeatures'
            filter={isFeatureDisplayed}
            style={mapStyles.heatmap}
          />

          <MapboxGL.SymbolLayer
            id='mapFeaturesMarkers'
            sourceID='mapFeatures'
            minZoomLevel={MIN_ZOOM}
            filter={isUserFeature}
            style={mapStyles.marker}
          />

          <MapboxGL.SymbolLayer
            id='mapFeaturesAvatars'
            sourceID='mapFeatures'
            minZoomLevel={MIN_ZOOM}
            filter={isUserFeature}
            style={mapStyles.avatar}
          />

          <MapboxGL.SymbolLayer
            id='mapFeaturesNames'
            sourceID='mapFeatures'
            minZoomLevel={MAX_INTER_ZOOM}
            filter={isUserFeature}
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

      <View style={styles.selectionIconView}>
        <Ripple onPress={() => renderSelection()} rippleContainerBorderRadius={999} style={styles.selectionIconRipple}>
          <McIcon name='selection-ellipse' color='white' size={30} />
        </Ripple>
      </View>

      {selection && (
        <TouchableWithoutFeedback onPress={navToSelection}>
          <View style={styles.selectionIndex}>
            <View style={styles.selectionIndexRelative}>
              <Text style={styles.selectionIndexText}>Events: {selection.eventsCount}</Text>
              <Text style={styles.selectionIndexText}>Attendance: {selection.attendanceCount}</Text>

              {selection.isOutdated && (
                <McIcon style={styles.selectionOutdatedIcon} name='sync-alert' color={colors.ink} size={18} />
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

export default Discovery.create(Map);
