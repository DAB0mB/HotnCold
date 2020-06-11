import { ReactNativeFile } from 'apollo-upload-client';
import { useRobot } from 'hotncold-robot';
import moment from 'moment';
import React, { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import {
  View,
  ScrollView,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import SortableGrid from 'react-native-sortable-grid';
import { TextField } from 'react-native-material-textfield';
import { RaisedTextButton } from 'react-native-material-buttons';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import Bar from '../components/Bar';
import Base from '../containers/Base';
import DatePicker from '../components/DatePicker';
import DotsLoader from '../components/Loader/DotsLoader';
import * as mutations from '../graphql/mutations';
import { useSignUp } from '../services/Auth';
import { useAlertError, useAlertSuccess } from '../services/DropdownAlert';
import { useImagePicker } from '../services/ImagePicker';
import { useNavigation } from '../services/Navigation';
import { colors, hexToRgba } from '../theme';
import { useAsyncEffect, useRenderer } from '../utils';

const NO_EMPTY = 'Field cannot be empty';
const MINE_DEFAULT = {
  myContract: { signed: false },
  me: { pictures: [] },
};

const styles = StyleSheet.create({
  scroller: { flex: 1, backgroundColor: colors.lightGray },
  header: { marginBottom: 20 },
  headerTitle: { textAlign: 'center', fontSize: 20, fontWeight: '600', color: colors.ink },
  headerDone: { color: colors.hot, fontSize: 18, textAlign: 'right' },
  picturesGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  picturesGridItem: { flex: 1, margin: 10, borderRadius: 5, justifyContent: 'center', alignItems: 'center' },
  pictureActionContainer: { backgroundColor: 'white', width: 30, height: 30, position: 'absolute', right: 0, bottom: 0, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  pictureAction: { paddingBottom: 1 },
  picturesFront: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  picturesFrontItem: { width: Dimensions.get('window').width / 3 - 20, height: Dimensions.get('window').width / 3 - 20, margin: 10 },
  picturesBack: { alignSelf: 'stretch', position: 'relative', height: (Dimensions.get('window').width / 3) * 2 },
  picturesBackItem: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  picturePlaceholder: { width: Dimensions.get('window').width / 3 - 24, height: Dimensions.get('window').width / 3 - 24, margin: 12, backgroundColor: colors.gray, borderRadius: 5, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.ink, alignItems: 'center', justifyContent: 'center', opacity: .35 },
  pictureIndexContainer: { width: 20, height: 20, backgroundColor: colors.lightGray, position: 'absolute', borderRadius: 999, top: -10, left: -10 },
  pictureIndex: { color: colors.ink, fontSize: 15, textAlign: 'center', fontWeight: '600' },
  input: { marginTop: 20, paddingLeft: 10, paddingRight: 10, backgroundColor: 'white' },
});

export const $ProfileEditor = {};

const ProfileEditor = () => {
  const { useTrap } = useRobot();
  const alertError = useAlertError();
  const alertSuccess = useAlertSuccess();
  const baseNav = useNavigation(Base);
  const [inputsKey, renderInputs] = useRenderer();
  const { myContract, me } = baseNav.getParam('mine') || MINE_DEFAULT;

  if (myContract.signed) {
    baseNav.useBackListener();
  }

  // Component state
  const [saving, setSaving] = useState(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const picturesGridRef = useRef();
  const submittingRef = useRef(false);

  // Form state
  const nameRef = useRef();
  const birthDateRef = useRef();
  const occupationRef = useRef();
  const bioRef = useRef();

  // User state
  const [name, setName] = useState(me.name);
  const [birthDate, setBirthDate] = useState(me.birthDate);
  const [occupation, setOccupation] = useState(me.occupation);
  const [bio, setBio] = useState(me.bio);

  const handleNameSubmit = useCallback(() => {
    submittingRef.current = true; dateProps.visibleState[1](true);
  }, [true]);
  const handleDateSubmit = useCallback(() => {
    submittingRef.current = true; occupationRef.current.focus();
  }, [true]);
  const handleOccupationSubmit = useCallback(() => {
    submittingRef.current = true; bioRef.current.focus();
  }, [true]);
  const handleBioSubmit = useCallback(() => {
    submittingRef.current = true; bioRef.current.blur();
  }, [true]);

  const [picturesBuffer, setPicturesBuffer] = useState(() => {
    return me.pictures.reduce((pictures, uri) => {
      pictures[uri] = Promise.resolve(uri);

      return pictures;
    }, {});
  });

  const prepics = useMemo(() => Object.keys(picturesBuffer), [picturesBuffer]);

  const dateProps = {
    visibleState: useState(false),
    mode: 'date',
    maximumDate: useMemo(() => moment().subtract(18, 'year').toDate(), [true]),
    minimumDate: useMemo(() => moment().subtract(100, 'year').toDate(), [true]),
    date: useMemo(() => birthDate ? new Date(birthDate) : moment('2000/01/01', 'YYYY/MM/DD').toDate(), [birthDate]),
    onConfirm: useCallback((birthDate) => {
      setBirthDate(birthDate);
      occupationRef.current.focus();
    }, [true]),
  };

  const useProfileMutation = myContract.signed ? mutations.updateMyProfile.use : useSignUp;
  const [updateProfile, updatingProfile] = [].concat(useProfileMutation({
    name,
    bio,
    occupation,
    pictures: prepics,
    birthDate: useMemo(() => birthDate && new Date(birthDate), [birthDate]),
  }, {
    onError: useCallback((e) => {
      setSaving(false);
      alertError(e);
    }, [alertError]),

    onCompleted: useCallback((data) => {
      if (!data) return;

      setSaving(false);

      if (myContract.signed) {
        alertSuccess('Profile successfully updated');
      }
      else {
        baseNav.terminalPush('Discovery');
      }
    }, [alertSuccess, baseNav]),
  }));

  const [uploadPicture] = mutations.uploadPicture.use({
    onError: alertError,
  });

  const imagePicker = useImagePicker({
    mediaType: 'photo',
    maxWidth: 512,
    maxHeight: 512,
  });

  const save = useCallback(() => {
    const errors = {};

    if (!name) {
      errors.name = NO_EMPTY;
    }

    if (Object.keys(errors).length) {
      setErrors(errors);

      return;
    }

    setSaving(true);
  }, [name]);

  const reorderPictures = useCallback(({ itemOrder }) => {
    const orderedPictures = itemOrder.reduce((orderedPictures, { key }) => {
      const path = prepics[key];
      orderedPictures[path] = picturesBuffer[path];

      return orderedPictures;
    }, {});

    setPicturesBuffer(orderedPictures);
  }, [picturesBuffer, prepics]);

  const onDragStart = useCallback(() => {
    setScrollEnabled(false);
  }, [true]);

  const onDragRelease = useCallback((state) => {
    setScrollEnabled(true);
    reorderPictures(state);
  }, [reorderPictures]);

  useAsyncEffect(function* () {
    if (!saving) return;

    let pictures;
    try {
      pictures = yield Promise.all(Object.values(picturesBuffer));
    }
    catch (e) {
      alertError(e);

      return;
    }

    updateProfile({ pictures });
  }, [saving]);

  const deletePicture = useCallback((i) => {
    // DANGEROUS!
    picturesGridRef.current.setState({ activeBlock: i }, () => {
      picturesGridRef.current.deleteBlock();
    });
  // Note that it's connected to the following callback
  }, [true]);

  const addPicture = useCallback((pictureIndex) => {
    imagePicker.launchImageLibrary({}, (image) => {
      const fetchingPic = new Promise((resolve, reject) => {
        const file = new ReactNativeFile({
          uri: image.uri,
          name: image.fileName,
          type: image.type,
        });

        uploadPicture(file).then(({ data }) => {
          resolve(data.uploadPicture);
        })
          .catch((e) => {
            alertError(e);

            reject(e);
          });
      });

      const orderedPicUploads = {};

      prepics.slice(0, pictureIndex).forEach((prePic) => {
        orderedPicUploads[prePic] = picturesBuffer[prePic];
      });

      orderedPicUploads[image.uri] = fetchingPic;

      prepics.slice(pictureIndex + 1).forEach((prePic) => {
        orderedPicUploads[prePic] = picturesBuffer[prePic];
      });

      setPicturesBuffer(orderedPicUploads);
    });
  }, [imagePicker, uploadPicture, picturesBuffer, prepics]);

  const onFocus = useCallback(() => {
    setErrors({});
  }, [true]);

  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (submittingRef.current) {
        submittingRef.current = false;

        return;
      }

      nameRef.current.blur();
      birthDateRef.current.blur();
      occupationRef.current.blur();
      bioRef.current.blur();
    });

    return () => {
      keyboardDidHideListener.remove();
    };
  }, [true]);

  useEffect(() => {
    if (saving == null) return;

    if (!saving) {
      setLoading(false);

      return;
    }

    const timeout = setTimeout(() => {
      setLoading(true);
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [saving]);

  useTrap($ProfileEditor, {
    save,
    name,
    birthDate,
    bio,
    occupation,
    pictures: useMemo(() => Object.keys(picturesBuffer), [picturesBuffer]),
    setName(name) {
      setName(name);
      renderInputs();
    },
    setBirthDate(birthDate) {
      setBirthDate(birthDate);
      renderInputs();
    },
    setBio(bio) {
      setBio(bio);
      renderInputs();
    },
    setOccupation(occupation) {
      setOccupation(occupation);
      renderInputs();
    },
    get saveResponse() {
      return updatingProfile?.data?.updateMyProfile;
    },
    setPictures: useCallback((uris) => {
      setPicturesBuffer(uris.reduce((picturesBuffer, uri) => {
        picturesBuffer[uri] = Promise.resolve(uri);

        return picturesBuffer;
      }, {}));
    }, [true]),
  });

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.scroller} scrollEnabled={scrollEnabled} nestedScrollEnabled={scrollEnabled}>
        <Bar style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>My Profile</Text>
          </View>
          {myContract.signed && (
            <TouchableWithoutFeedback onPress={baseNav.goBackOnceFocused}>
              <View style={{ position: 'absolute', right: 0 }}>
                <Text style={styles.headerDone}>Done</Text>
              </View>
            </TouchableWithoutFeedback>
          )}
        </Bar>

        <View style={styles.picturesBack}>
          <View style={styles.picturesBackItem}>
            {Array.apply(null, { length: 6 }).map((_, i) => (
              <View key={i} style={styles.picturePlaceholder}>
                <McIcon size={Dimensions.get('window').width / 6 - 10} name='image-plus' color={colors.ink} style={{ textAlign: 'center' }} />
              </View>
            ))}
          </View>

          <SortableGrid
            ref={picturesGridRef}
            style={styles.picturesGrid}
            blockTransitionDuration={400}
            activeBlockCenteringDuration={200}
            dragActivationTreshold={200}
            itemsPerRow={3}
            onDragStart={onDragStart}
            onDragRelease={onDragRelease}
          >
            {prepics.map((uri, i) => (
              <View key={i} style={{ flex: 1 }} onTap={() => addPicture(i)}>
                <Image style={styles.picturesGridItem} source={{ uri }} />
                <View style={styles.pictureActionContainer}>
                  <TouchableWithoutFeedback onPress={() => deletePicture(i)}>
                    <McIcon name='close-circle' size={30} color={colors.hot} style={styles.pictureAction} />
                  </TouchableWithoutFeedback>
                </View>
              </View>
            ))}
          </SortableGrid>

          <View pointerEvents='box-none' style={styles.picturesFront}>
            {Array.apply(null, { length: 6 }).map((_, i) => {
              const Container = i < prepics.length ? React.Fragment : (props) => (
                <TouchableWithoutFeedback {...props} onPress={() => addPicture(prepics.length)} />
              );

              return (
                <Container key={i}>
                  <View key={i} style={styles.picturesFrontItem}>
                    <View style={styles.pictureIndexContainer}>
                      <Text style={styles.pictureIndex}>{i + 1}</Text>
                    </View>
                  </View>
                </Container>
              );
            })}
          </View>
        </View>

        <View style={[styles.input, { flexDirection: 'row' }]}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <TextField
              key={inputsKey}
              onFocus={onFocus}
              ref={nameRef}
              value={name}
              error={errors.name}
              onSubmitEditing={handleNameSubmit}
              tintColor={colors.ink}
              autoCorrect={false}
              enablesReturnKeyAutomatically
              onChangeText={setName}
              returnKeyType='next'
              label='Name'
            />
          </View>

          <View style={{ position: 'relative', flex: 1, marginLeft: 10 }}>
            <TouchableWithoutFeedback onPress={() => dateProps.visibleState[1](true)}>
              <View style={{ flex: 1 }}>
                <TextField
                  onFocus={onFocus}
                  ref={birthDateRef}
                  error={errors.birthDate}
                  key={birthDate}
                  value={birthDate && moment(birthDate).format('MMMM Do YYYY')}
                  onSubmitEditing={handleDateSubmit}
                  tintColor={colors.ink}
                  editable={false}
                  autoCorrect={false}
                  enablesReturnKeyAutomatically
                  onChangeText={setBirthDate}
                  returnKeyType='next'
                  label='Birth Date'
                />
              </View>
            </TouchableWithoutFeedback>

            {birthDate && (
              <TouchableWithoutFeedback onPress={() => setBirthDate(null)}>
                <McIcon style={{ position: 'absolute', right: 5, bottom: 17 }} color={hexToRgba(colors.gray, .5)} name='close-circle' size={20} />
              </TouchableWithoutFeedback>
            )}
          </View>
        </View>

        <View style={styles.input}>
          <TextField
            key={inputsKey}
            onFocus={onFocus}
            ref={occupationRef}
            error={errors.occupation}
            value={occupation}
            onSubmitEditing={handleOccupationSubmit}
            tintColor={colors.ink}
            autoCorrect={false}
            enablesReturnKeyAutomatically
            onChangeText={setOccupation}
            returnKeyType='next'
            label='Occupation'
          />
        </View>

        <View style={styles.input}>
          <TextField
            key={inputsKey}
            onFocus={onFocus}
            ref={bioRef}
            error={errors.bio}
            onSubmitEditing={handleBioSubmit}
            multiline
            enablesReturnKeyAutomatically
            value={bio}
            tintColor={colors.ink}
            autoCorrect={false}
            characterRestriction={500}
            onChangeText={setBio}
            returnKeyType='next'
            label='About'
          />
        </View>

        <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center', height: 100 }}>
          {loading ? (
            <DotsLoader />
          ) : (
            <RaisedTextButton
              onPress={save}
              color={colors.hot}
              title={myContract.signed ? 'save' : 'save & continue'}
              titleColor='white'
            />
          )}
        </View>
      </ScrollView>

      <DatePicker {...dateProps} />
    </View>
  );
};

export default Base.create(ProfileEditor);
