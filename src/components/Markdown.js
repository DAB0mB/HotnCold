import React, { useMemo, useCallback } from 'react';
import { Text, Linking } from 'react-native';
import _Markdown from 'react-native-markdown-renderer';

const noop = () => {};

const Markdown = ({ _handleUrl = noop, ...props }) => {
  const handleUrl = useCallback((url) => {
    if (!url || _handleUrl(url) !== true) {
      Linking.openURL(url);
    }
  }, [_handleUrl]);

  const rules = useMemo(() => ({
    link(node, children, parent, styles) {
      return (
        <Text key={node.key} style={styles.link} onPress={() => handleUrl(node.attributes.href)}>
          {children}
        </Text>
      );
    },
  }), [handleUrl]);

  return (
    <_Markdown rules={rules} {...props}></_Markdown>
  );
};

export * from 'react-native-markdown-renderer';

export default Markdown;
