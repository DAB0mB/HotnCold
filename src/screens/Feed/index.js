import React, { useEffect } from 'react';
import { Text, View, Image, StyleSheet } from 'react-native';

import Discovery from '../../containers/Discovery';
import StatusFeed from '../../components/StatusFeed';
import { useAppState } from '../../services/AppState';
import { useScreenFrame } from '../../services/Frame';
import { useNavigation } from '../../services/Navigation';
import tapHerePng from './tap_here.png';

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  listContent: { paddingBottom: 75 },
  tapHereDiv: { position: 'absolute', right: 15, bottom: 55 },
  tapHereImage: { height: 100, resizeMode: 'contain' },
});

const Feed = () => {
  const discoveryNav = useNavigation(Discovery);
  const [appState] = useAppState();

  discoveryNav.useBackListener();
  useScreenFrame();

  useEffect(() => {
    if (appState.isCreatingStatus) {
      discoveryNav.goBackOnceFocused();
    }
  }, [discoveryNav, appState.isCreatingStatus]);

  return (
    <View style={styles.container}>
      <StatusFeed
        key={appState.discoveryArea?.id}
        userScreen='UserLobby'
        NoStatusesComponent={NoStatuses}
        ListFooterComponent={<View style={{ height: 50 }} />}
      />
    </View>
  );
};

const NoStatuses = () => {
  return (
    <View style={[styles.container, styles.empty]}>
      <Text style={{ textAlign: 'center', lineHeight: 20 }}>No statuses found around. Tap the <Text style={{ fontWeight: '900', fontSize: 20 }}>BIG</Text> button and be the first to create a status in the area!</Text>

      <View style={styles.tapHereDiv}>
        <Image source={tapHerePng} style={styles.tapHereImage} />
      </View>
    </View>
  );
};

export default Discovery.create(Feed);
