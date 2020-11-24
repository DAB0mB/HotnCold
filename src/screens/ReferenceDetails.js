import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableWithoutFeedback, TextInput, Dimensions } from 'react-native';
import { RaisedTextButton } from 'react-native-material-buttons';
import { getStatusBarHeight } from 'react-native-status-bar-height';

import Base from '../containers/Base';
import * as mutations from '../graphql/mutations';
import DotsLoader from '../components/Loader/DotsLoader';
import { useAlertError, useAlertSuccess } from '../services/DropdownAlert';
import { useNavigation } from '../services/Navigation';
import { colors } from '../theme';

const window = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, .5)',
  },
  body: {
    margin: 20,
    padding: 20,
    borderRadius: 10,
    backgroundColor: colors.lightGray,
    height: window.height - getStatusBarHeight() - 40,
  },
  instructions: {
    fontSize: 16,
  },
  input: {
    backgroundColor: 'white',
    padding: 10,
    marginVertical: 20,
    flex: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
  },
  limit: {
    alignSelf: 'stretch',
    alignItems: 'flex-end',
  },
  limitText: {
    color: colors.gray,
  },
  skip: {
    color: colors.gray,
    marginTop: 10,
    textDecorationLine: 'underline',
  },
});

const ReferenceDetails = () => {
  const alertError = useAlertError();
  const alertSuccess = useAlertSuccess();
  const baseNav = useNavigation(Base);
  const [loading, setLoading] = useState(false);
  const [referenceComment, setReferenceComment] = useState('');
  const [addContractReferenceDetails, addingContractReferenceDetails] = mutations.addContractReferenceDetails.use({
    referenceComment,
  }, {
    onError: alertError,
  });

  const submit = useCallback(() => {
    if (!referenceComment) {
      alertError('Input was not provided');

      return;
    }

    // Assuming success. This can keep running in the background
    addContractReferenceDetails();

    alertSuccess('Thanks for the input!');

    baseNav.pop();
  }, [addContractReferenceDetails, alertError, referenceComment]);

  const skip = useCallback(() => {
    addContractReferenceDetails({
      referenceComment: '',
    });

    baseNav.pop();
  }, [baseNav, addContractReferenceDetails]);

  useEffect(() => {
    if (!addingContractReferenceDetails.loading) {
      setLoading(false);

      return;
    }

    setLoading(true);

    const timeout = setTimeout(() => {
      setLoading(true);
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [addingContractReferenceDetails.loading]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.instructions}><Text style={{ fontWeight: '700' }}>Welcome!</Text>{'\n\n'}It would be helpful if you could tell us how did you hear about us :)</Text>

        <View style={styles.input}>
          <TextInput
            multiline
            value={referenceComment}
            textAlignVertical='top'
            placeholder='Type something...'
            style={styles.textInput}
            maxLength={300}
            onChangeText={setReferenceComment}
          />

          <View style={styles.limit}>
            <Text style={styles.limitText}>{referenceComment.length} / 300</Text>
          </View>
        </View>

        <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center', height: 100 }}>
          {loading ? (
            <DotsLoader />
          ) : (
            <React.Fragment>
              <RaisedTextButton
                onPress={submit}
                color={colors.hot}
                title='Submit'
                titleColor='white'
              />

              <TouchableWithoutFeedback onPress={skip}>
                <Text style={styles.skip}>or skip</Text>
              </TouchableWithoutFeedback>
            </React.Fragment>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default Base.create(ReferenceDetails);
