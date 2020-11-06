require('dotenv').config({ path: '.env.development' });

module.exports = {
  schema: process.env.GRAPHQL_ENDPOINT,
  overwrite: true,
  generates: {
    './src/graphql/fragmentTypes.json': {
      plugins: 'introspection'
    }
  }
};
