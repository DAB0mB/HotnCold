import { ApolloLink } from 'apollo-link';
import { onError } from 'apollo-link-error';
import { InMemoryCache } from 'apollo-cache-inmemory';
import ApolloClient from 'apollo-client';
import { createUploadLink } from 'apollo-upload-client';
import CONFIG from 'react-native-config';

const cache = new InMemoryCache()

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.warn(
        `[GraphQL error]: Message: ${message}, Location: ` +
          `${locations}, Path: ${path}`,
      ),
    );
  }
  if (networkError) {
    console.warn(`[Network error]: ${networkError}`);
  }
});

const httpLink = createUploadLink({
  uri: CONFIG.GRAPHQL_URI,
  credentials: 'include',
});

const link = ApolloLink.from([errorLink, httpLink]);

// super hacky, we will fix the types eventually
const client = new ApolloClient({
  cache,
  link,
});

export default client;
