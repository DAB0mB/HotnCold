import ApolloClient from 'apollo-boost';
import CONFIG from 'react-native-config';

const client = new ApolloClient({
  uri: CONFIG.GRAPHQL_URI
});

export default client;
