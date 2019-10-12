import { useMutation } from '@apollo/react-hooks';
import MapboxGL from '@react-native-mapbox-gl/maps';
import turfBboxPolygon from '@turf/bbox-polygon';
import turfBooleanPointInPolygon from '@turf/boolean-point-in-polygon';
import turfCircle from '@turf/circle';
import turfDistance from '@turf/distance';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Cookie from 'react-native-cookie';
import CONFIG from 'react-native-config';
import Fa5Icon from 'react-native-vector-icons/FontAwesome5';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import ActivityIndicator from '../../components/ActivityIndicator';
import * as mutations from '../../graphql/mutations';
import { useMe, useLogout } from '../../services/Auth';
import { useAlertError } from '../../services/DropdownAlert';
import { useGeolocation, GeolocationProvider } from '../../services/Geolocation';
import { useNavigation } from '../../services/Navigation';
import { useInterval, useRenderer } from '../../utils';
import Screen from '../Screen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  iconsContainer: {
    position: 'absolute',
    flexDirection: 'row',
    padding: 10,
    right: 0,
    top: 0,
  },
  icon: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    marginRight: 10,
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
      'rgba(88, 236, 216, 0.5)',
      0.5,
      'rgba(214, 236, 88, 0.7)',
      1,
      'rgba(236, 88, 174, 0.9)',
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

const SELECTION_RADIUS = 100;

const Map = () => {
  const me = useMe();
  const logout = useLogout();
  const mapRef = useRef(null);
  const alertError = useAlertError();
  const navigation = useNavigation();
  const geolocation = useGeolocation();
  const [shapeKey, renderShape] = useRenderer();
  const [updateMyLocation] = mutations.updateMyLocation.use();
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

  const logoutAndFlee = useCallback(() => {
    logout().then(() => {
      navigation.replace('Profile');
    }).catch(alertError);
  }, [logout, alertError, navigation]);

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

  const navToRadar = useCallback(() => {
    navigation.push('Radar');
  }, [navigation]);

  const editProfile = useCallback(() => {
    navigation.push('Profile', { user: me, itsMe: true });
  }, [navigation, me]);

  const updateMyLocationInterval = useCallback((initial) => {
    geolocation.getCurrentPosition((location) => {
      location = [location.coords.longitude, location.coords.latitude];

      if (initial) {
        setInitialLocation(location);
      }

      updateMyLocation(location).then(({ data: { updateMyLocation: areaFeatures } }) => {
        setAreaFeatures(areaFeatures);
      }).catch(alertError);
    });
  }, [updateMyLocation, renderShape, setAreaFeatures]);

  useInterval(updateMyLocationInterval, 60 * 1000, true);

  useEffect(() => {
    if (shapeKey) {
      // Dispose asap once rendered. It's a very heavy object
      setAreaFeatures(null);
    }
  }, [shapeKey, setAreaFeatures]);

  if (!initialLocation) {
    return (
      <ActivityIndicator />
    );
  }

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={CONFIG.MAPBOX_STYLE_URL}
        onPress={renderSelection}
        onRegionDidChange={resetScreenFeatures}
        compassViewPosition='top-left'
      >
        <MapboxGL.Camera
          zoomLevel={15}
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
              minZoomLevel={selection.zoom - 3}
            />
          </MapboxGL.ShapeSource>
        )}

        {selection && (
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
        )}

        <MapboxGL.ShapeSource
          id='featuresInArea'
          key={shapeKey}
          shape={areaFeatures}
        >
          <MapboxGL.HeatmapLayer
            id='featuresInAreaHeatmap'
            sourceID='featuresInArea'
            filter={['!=', 'userId', me.id]}
            style={styles.heatmap}
          />
        </MapboxGL.ShapeSource>

        <MapboxGL.UserLocation />
      </MapboxGL.MapView>

      <View style={styles.iconsContainer}>
        {__DEV__ && (
          <TouchableWithoutFeedback onPress={logoutAndFlee}>
            <View style={styles.icon}>
              <McIcon name='logout' size={30} color='rgba(0, 0, 0, 0.8)' />
            </View>
          </TouchableWithoutFeedback>
        )}

        <TouchableWithoutFeedback onPress={editProfile}>
          <View style={styles.icon}>
            <Fa5Icon name='user-edit' size={25} color='rgba(0, 0, 0, 0.8)' solid />
          </View>
        </TouchableWithoutFeedback>

        <TouchableWithoutFeedback onPress={navToRadar}>
          <View style={styles.icon}>
            <McIcon name='radar' size={30} color='rgba(0, 0, 0, 0.8)' />
          </View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};

export default Screen.Authorized.create(Map);
