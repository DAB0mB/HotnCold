module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    '@babel/plugin-proposal-optional-chaining',
    ['module-resolver', {
      'alias': {
        'hotncold-robot': process.env.USE_ROBOT ? './src/robot' : './src/robot/mock',
      },
    }]
  ],
};
