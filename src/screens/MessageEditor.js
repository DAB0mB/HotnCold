import React, { useState, useCallback } from 'react';
import { StyleSheet, TouchableWithoutFeedback, View, ScrollView, Text, TextInput, Image } from 'react-native';
import { RaisedTextButton } from 'react-native-material-buttons';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { getUserAvatarSource } from '../assets';
import Base from '../containers/Base';
import { useMine } from '../services/Auth';
import { useAlertError } from '../services/DropdownAlert';
import { useNavigation } from '../services/Navigation';
import { colors } from '../theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { height: 50, alignSelf: 'stretch', paddingLeft: 15, paddingRight: 15, marginTop: 15, marginBottom: 15 },
  headerContents: { position: 'relative', justifyContent: 'center', flex: 1 },
  headerLeft: { position: 'absolute', left: 0 },
  headerRight: { position: 'absolute', right: 0, flexDirection: 'row', alignItems: 'center' },
  headerClear: { color: colors.hot, fontSize: 14, paddingHorizontal: 16 },
  headerSave: { marginLeft: 15 },
  body: { flex: 1, flexDirection: 'row' },
  avatar: { width: 50, height: 50, marginLeft: 15, marginRight: 10 },
  bodyRight: { flex: 1 },
  textScroll: { fontSize: 18 },
  limit: { alignItems: 'flex-end', padding: 15 },
  limitText: { fontSize: 12 },
});

const StatusEditor = () => {
  const baseNav = useNavigation(Base);
  const { me } = useMine();
  const [text, setText] = useState('');
  const alertError = useAlertError();
  const maxLength = baseNav.getParam('maxLength');
  const placeholder = baseNav.getParam('placeholder');
  const [runMutation] = baseNav.getParam('useMutation')(text, {
    onCompleted: useCallback((data) => {
      if (!data) return;

      baseNav.goBackOnceFocused();
    }, [baseNav]),
    onError: alertError,
  });
  const handleSave = baseNav.getParam('useSaveHandler')(runMutation, text);

  baseNav.useBackListener();

  const clear = useCallback(() => {
    setText('');
  }, [true]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContents}>
          <View style={styles.headerLeft}>
            <TouchableWithoutFeedback onPress={baseNav.goBackOnceFocused}>
              <McIcon name='close' size={30} color={colors.hot} />
            </TouchableWithoutFeedback>
          </View>

          <View style={styles.headerRight}>
            {!!text.length && (
              <TouchableWithoutFeedback onPress={clear}>
                <Text style={styles.headerClear}>CLEAR</Text>
              </TouchableWithoutFeedback>
            )}

            <RaisedTextButton
              onPress={handleSave}
              style={styles.headerSave}
              key={!text.length}
              disabled={!text.length}
              color={colors.hot}
              title='save'
              titleColor='white'
            />
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <View>
          <Image source={getUserAvatarSource(me)} style={styles.avatar} />
        </View>

        <View style={styles.bodyRight}>
          <ScrollView>
            <TextInput
              multiline
              value={text}
              textAlignVertical='top'
              placeholder={placeholder}
              style={styles.textScroll}
              maxLength={maxLength}
              onChangeText={setText}
            />
          </ScrollView>
        </View>
      </View>

      <View style={styles.limit}>
        <Text style={styles.limitText}>{text.length} / {maxLength}</Text>
      </View>
    </View>
  );
};

export default Base.create(StatusEditor);
