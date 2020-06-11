import React, { useMemo, useCallback } from 'react';
import { View, Text, Linking, StyleSheet } from 'react-native';
import SuperMarkdown, {
  styles as superStyles,
  renderRules as superRules,
  hasParents,
} from 'react-native-markdown-renderer';

import { colors } from '../theme';
import { noop } from '../utils';

export const hncMdStyles = StyleSheet.create({
  heading1: { ...superStyles.heading1, marginTop: 20, marginBottom: 20 },
  heading2: { ...superStyles.heading2, textAlign: 'center', alignSelf: 'center', color: colors.hot, width: '100%', fontWeight: '600', marginTop: 20, marginBottom: 20 },
  heading3: { ...superStyles.heading3, fontWeight: '600' },
  listUnorderedItem: { marginTop: -10, flexDirection: 'row', justifyContent: 'flex-start' },
  listOrderedItemIcon: { fontWeight: '600', paddingTop: 10, paddingLeft: 2, paddingRight: 8 },
  listUnorderedItemIcon: { fontWeight: '600', paddingTop: 10, paddingLeft: 2, paddingRight: 8 },
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

    list_item(node, children, parent, styles) {
      if (hasParents(parent, 'bullet_list')) {
        return (
          <View key={node.key} style={styles.listUnorderedItem}>
            <Text style={styles.listUnorderedItemIcon}>*</Text>
            <View style={[styles.listItem]}>{children}</View>
          </View>
        );
      }

      return superRules.list_item(node, children, parent, styles);
    },
  }), [handleUrl]);

  return (
    <SuperMarkdown rules={rules} {...props}></SuperMarkdown>
  );
};

export * from 'react-native-markdown-renderer';

export default Markdown;
