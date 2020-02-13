import React, { useMemo, useCallback } from 'react';
import { View, Text, Linking } from 'react-native';
import SuperMarkdown, {
  renderRules as superRules,
  hasParents,
} from 'react-native-markdown-renderer';

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
