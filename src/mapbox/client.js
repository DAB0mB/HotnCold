import MapboxGL from '@react-native-mapbox-gl/maps';
import CONFIG from 'react-native-config';

MapboxGL.setAccessToken(CONFIG.MAPBOX_ACCESS_TOKEN);

export default MapboxGL;
