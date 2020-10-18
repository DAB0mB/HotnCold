import React, { useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  Image,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import RadioButtonRN from 'radio-buttons-react-native';
import { RaisedTextButton } from 'react-native-material-buttons';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import Bar from '../components/Bar';
import Base from '../containers/Base';
import StatusEditor from '../containers/StatusEditor';
import DotsLoader from '../components/Loader/DotsLoader';
import { useAlertError } from '../services/DropdownAlert';
import { useNavigation } from '../services/Navigation';
import * as mutations from '../graphql/mutations';
import { colors, hexToRgba } from '../theme';
import { useAsyncCallback, sleep } from '../utils';

const styles = StyleSheet.create({
  scroller: { flex: 1, backgroundColor: colors.lightGray },
  input: { marginTop: 40, paddingLeft: 10, paddingRight: 10, backgroundColor: 'white' },
  inputTitle: { paddingTop: 10, fontSize: 16 },
  inputRadio: { padding: 10 },
  inputTip: { padding: 20, paddingTop: 10, paddingLeft: 10, flexDirection: 'row' },
  inputAster: { paddingRight: 10 },
  statusPreview: { borderBottomWidth: 1, borderBottomColor: colors.lightGray, flexDirection: 'row', backgroundColor: 'white' },
  previewText: { fontSize: 16, padding: 15 },
  previewImageContainer: { margin: 10, marginBottom: -20, width: 110, height: 110, alignItems: 'center', justifyContent: 'center', borderWidth: 1, backgroundColor: 'white', borderColor: colors.lightGray },
  previewImage: { width: 100, height: 100 },
  previewDetails: { flex: 1 },
});

const publishData = [
  {
    label: 'Publish now',
    value: true,
  },
  {
    label: 'Publish later',
    value: false,
  },
];

const meetupData = [
  {
    label: 'Online discussion',
    value: false,
  },
  {
    label: 'Meetup',
    value: true,
  },
];

const StatusOptions = () => {
  const alertError = useAlertError();
  const baseNav = useNavigation(Base);
  const statusEditorNav = useNavigation(StatusEditor);

  const text = statusEditorNav.getParam('text');
  const location = statusEditorNav.getParam('location');
  const localImage = statusEditorNav.getParam('localImage');
  const uploadingImage = statusEditorNav.getParam('uploadingImage');

  const [createStatus] = mutations.createStatus.use({
    onCompleted: useCallback(() => {
      baseNav.pop();
    }, [baseNav]),
    onError: alertError,
  });

  statusEditorNav.useBackListener();

  // Component state
  const [loading, setLoading] = useState(false);
  // User state
  const [published, setPublished] = useState(true);
  const [isMeetup, setIsMeetup] = useState(false);

  const save = useAsyncCallback(function* () {
    const image = yield uploadingImage;

    createStatus(text, [image], location, published, isMeetup);

    yield sleep(500);

    setLoading(true);
  }, [text, uploadingImage, location, published, isMeetup]);

  const handlePublishChange = useCallback((e) => {
    setPublished(e.value);
  }, []);

  const handleMeetupChange = useCallback((e) => {
    setIsMeetup(e.value);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.scroller}>
        <Bar>
          <TouchableWithoutFeedback onPress={statusEditorNav.goBackOnceFocused}>
            <View style={{ position: 'absolute', left: 0 }}>
              <McIcon name='arrow-left' size={25} color={colors.hot} />
            </View>
          </TouchableWithoutFeedback>
        </Bar>

        <View style={styles.statusPreview}>
          <View style={styles.previewDetails}>
            <Text style={styles.previewText}>{text}</Text>
          </View>
          <View style={styles.previewImageContainer}>
            <Image style={styles.previewImage} source={localImage} />
          </View>
        </View>

        <View style={styles.input}>
          <Text style={styles.inputTitle}>Status Type</Text>
          <RadioButtonRN
            style={styles.inputRadio}
            animationTypes={['pulse']}
            data={meetupData}
            initial={1}
            activeColor={colors.hot}
            boxActiveBgColor={hexToRgba(colors.hot, .01)}
            selectedBtn={handleMeetupChange}
          />
          <View style={styles.inputTip}>
            <Text style={styles.inputAster}>*</Text>
            <Text>
              {isMeetup ? (
                <React.Fragment>The status will appear hot on the map and will signify that you would like to meet up.</React.Fragment>
              ) : (
                <React.Fragment>The status will appear cold on the map and will signify that you would like to have an online discussion.</React.Fragment>
              )}
            </Text>
          </View>
        </View>

        <View style={styles.input}>
          <Text style={styles.inputTitle}>Publish?</Text>
          <RadioButtonRN
            style={styles.inputRadio}
            animationTypes={['pulse']}
            data={publishData}
            initial={1}
            activeColor={colors.hot}
            boxActiveBgColor={hexToRgba(colors.hot, .01)}
            selectedBtn={handlePublishChange}
          />
          <View style={styles.inputTip}>
            <Text style={styles.inputAster}>*</Text>
            <Text>
              {published ? (
                <React.Fragment>The status will be visible on the map and will be posted on your profile as soon as you create it.</React.Fragment>
              ) : (
                <React.Fragment>The status will be created, but will not be visible for anyone except you. You can publish it later.</React.Fragment>
              )}
            </Text>
          </View>
        </View>

        <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center', height: 100 }}>
          {loading ? (
            <DotsLoader />
          ) : (
            <RaisedTextButton
              onPress={save}
              color={colors.hot}
              title='save'
              titleColor='white'
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default StatusEditor.create(StatusOptions);
