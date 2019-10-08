import AsyncStorage from '@react-native-community/async-storage';
import { ApolloLink } from 'apollo-link';
import { onError } from 'apollo-link-error';
import { InMemoryCache } from 'apollo-cache-inmemory';
import ApolloClient from 'apollo-client';
import { createUploadLink } from 'apollo-upload-client';
import CONFIG from 'react-native-config';
import Observable from 'zen-observable';

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

// react-native doesn't have a built-in handler for cookies, so I use the local storage manually instead
const authLink = new ApolloLink((operation, forward) => new Observable(async (observable) => {
  const token = await AsyncStorage.getItem('authToken');

  if (token) {
    operation.setContext({
      headers: {
        cookie: `authToken=${token}`,
      },
    });
  }

  forward(operation).subscribe({
    async next(response) {
      const { response: { headers } } = operation.getContext();

      storeCookies:
      if (headers) {
        const cookie = headers.get('Set-Cookie');

        if (!cookie) break storeCookies;

        const token = (cookie.match(/authToken=(\w+)/) || [])[1];

        if (!token) break storeCookies;

        await AsyncStorage.setItem('authToken', token);
      }

      observable.next(response);
    },
    error(error) { observable.error(error) },
    complete() { observable.complete() },
  });
}));

const link = ApolloLink.from([errorLink, authLink, httpLink]);

// super hacky, we will fix the types eventually
const client = new ApolloClient({
  cache,
  link,
});

export default client;
