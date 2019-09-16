import ApolloClient from 'apollo-boost';
import { GRAPHQL_URI } from 'react-native-config';

const client = new ApolloClient({
  uri: GRAPHQL_URI
});

export default client;
