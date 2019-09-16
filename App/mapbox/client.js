import MapboxGL from '@react-native-mapbox-gl/maps';
import { MAPBOX_ACCESS_TOKEN } from 'react-native-config';

MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);
MapboxGL.setTelemetryEnabled(false);

export default MapboxGL;
