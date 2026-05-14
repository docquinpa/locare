import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import keycloak from './keycloak';

const port = window.location.port ? `:${window.location.port}` : '';
const protocol = window.location.protocol;

const httpLink = createHttpLink({
  uri: `${protocol}//gateway.locare.local${port}/graphql`,
});

const authLink = setContext((_, { headers }) => {
  const token = keycloak.token;
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
});

export default client;
