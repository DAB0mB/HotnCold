import React, { useMemo, useCallback } from 'react';
import { Text, Linking, StyleSheet } from 'react-native';
import SuperMarkdown, { styles as superStyles } from 'react-native-markdown-display';

import { colors } from '../theme';
import { noop } from '../utils';

export const hncMdStyles = StyleSheet.create({
  heading1: { ...superStyles.heading1, color: colors.hot, fontWeight: '600' },
  heading2: { ...superStyles.heading2, color: colors.hot, fontWeight: '600' },
  heading3: { ...superStyles.heading3, fontWeight: '600' },
});

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
    <SuperMarkdown style={hncMdStyles} rules={rules} {...props}></SuperMarkdown>
  );
};

export * from 'react-native-markdown-display';

export default Markdown;
