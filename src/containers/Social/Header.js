import React from 'react';

const styles = StyleSheet.create({
  container: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
  }
});

const Header = () => {
  return (
    <View style={styles.container}>
      Chat
    </View>
  );
};

export default Header;
