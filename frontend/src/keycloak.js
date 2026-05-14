import Keycloak from 'keycloak-js';

const port = window.location.port ? `:${window.location.port}` : '';
const protocol = window.location.protocol;

const keycloak = new Keycloak({
  url: `${protocol}//keycloak.locare.local${port}`,
  realm: 'locare',
  clientId: 'locare-frontend',
});

export default keycloak;
