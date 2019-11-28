require('dotenv/config');

module.exports = {
  schema: process.env.GRAPHQL_ENDPOINT,
  overwrite: true,
  generates: {
    './src/graphql/fragmentTypes.json': {
      plugins: 'introspection'
    }
  }
};
