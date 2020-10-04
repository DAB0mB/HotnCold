import React, { useState, useCallback, useRef } from 'react';
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
  limit: { position: 'absolute', left: 10, bottom: 10 },
  limitText: { fontSize: 12 },
  messageImageContainer: { alignSelf: 'flex-end', margin: 10, padding: 5, backgroundColor: 'white', borderWidth: 1, borderColor: colors.lightGray, shadowColor: '#000', shadowOffset: { width: 0, height: 2, }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  messageImage: { width: 100, height: 100 },
});

const StatusEditor = () => {
  const refs = useRef({}).current;
  const baseNav = refs.baseNav = useNavigation(Base);
  const { me } = useMine();
  const [text, setText] = useState('');
  const alertError = useAlertError();
  const image = baseNav.getParam('image');
  const maxLength = baseNav.getParam('maxLength');
  const placeholder = baseNav.getParam('placeholder');
  const [runMutation] = baseNav.getParam('useMutation')(text, {
    onCompleted: useCallback((data) => {
      if (!data) return;

      baseNav.goBackOnceFocused();
    }, [baseNav]),
    onError: alertError,
  });
  const handleSave = baseNav.getParam('useSaveHandler')(runMutation);

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

      <View style={styles.messageImageContainer}>
        <Image style={styles.messageImage} source={image} />
      </View>
    </View>
  );
};

export default Base.create(StatusEditor);
