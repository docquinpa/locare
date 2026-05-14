import { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Car, User, MapPin, LogIn, LogOut, Shield, Link as LinkIcon } from 'lucide-react';
import keycloak from './keycloak';

const GET_DATA = gql`
  query GetData {
    vehicles { id marque modele immatriculation statut driverId }
    drivers { id nom permis expiration assignedVehicleId }
  }
`;

const CREATE_VEHICLE = gql`
  mutation CreateVehicle($input: VehicleInput!) {
    createVehicle(input: $input) { id }
  }
`;

const CREATE_DRIVER = gql`
  mutation CreateDriver($input: DriverInput!) {
    createDriver(input: $input) { id }
  }
`;

const ASSIGN_DRIVER = gql`
  mutation AssignDriver($vehicleId: ID!, $driverId: ID!) {
    assignDriver(vehicleId: $vehicleId, driverId: $driverId) {
      id
      driverId
    }
  }
`;

const GET_LOCATION_HISTORY = gql`
  query GetLocationHistory($vehicleId: ID!) {
    vehicleLocationHistory(vehicleId: $vehicleId) {
      latitude
      longitude
      timestamp
    }
  }
`;

function VehicleMarker({ vehicle, driver }) {
  const { data } = useQuery(GET_LOCATION_HISTORY, {
    variables: { vehicleId: vehicle.id },
    pollInterval: 2000,
  });
  
  const locations = data?.vehicleLocationHistory || [];
  const latestLoc = locations[0];

  if (!latestLoc) return null;

  return (
    <Marker position={[latestLoc.latitude, latestLoc.longitude]}>
      <Popup>
        <div className="text-gray-800">
          <strong>Véhicule {vehicle.marque} {vehicle.modele}</strong><br/>
          Immat: {vehicle.immatriculation}<br/>
          Conducteur: {driver ? driver.nom : 'Aucun'}
        </div>
      </Popup>
    </Marker>
  );
}

export default function App() {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    keycloak.init({ 
      onLoad: 'check-sso', 
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      flow: 'implicit',
      checkLoginIframe: false
    }).then(auth => {
      setAuthenticated(auth);
      setInitialized(true);
    }).catch(err => {
      console.error("Keycloak init failed:", err);
      setInitialized(true);
    });

    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30).catch(() => setAuthenticated(false));
    };
  }, []);

  const { loading, error, data, refetch } = useQuery(GET_DATA, {
    skip: !authenticated
  });
  
  const [createVehicle] = useMutation(CREATE_VEHICLE);
  const [createDriver] = useMutation(CREATE_DRIVER);
  const [assignDriver] = useMutation(ASSIGN_DRIVER);

  const [vMarque, setVMarque] = useState('');
  const [vModele, setVModele] = useState('');
  const [vImmat, setVImmat] = useState('');
  
  const [dNom, setDNom] = useState('');
  const [dPermis, setDPermis] = useState('');

  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    await createVehicle({ variables: { input: { marque: vMarque, modele: vModele, immatriculation: vImmat, statut: 'AVAILABLE' } } });
    refetch();
    setVMarque(''); setVModele(''); setVImmat('');
  };

  const handleAddDriver = async (e) => {
    e.preventDefault();
    await createDriver({ variables: { input: { nom: dNom, permis: dPermis, expiration: '2030-01-01' } } });
    refetch();
    setDNom(''); setDPermis('');
  };

  const handleAssignDriver = async (e) => {
    e.preventDefault();
    if (!selectedVehicle || !selectedDriver) return;
    await assignDriver({ variables: { vehicleId: selectedVehicle, driverId: selectedDriver } });
    refetch();
  };

  if (!initialized) return <div className="p-8 text-center text-white">Loading Auth...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading data: {error.message}</div>;

  const isAdmin = keycloak.hasRealmRole('admin');
  const vehicles = data?.vehicles || [];
  const drivers = data?.drivers || [];

  return (
    <div className="min-h-screen bg-locare-dark p-8 font-sans text-white">
      <header className="mb-8 border-b border-gray-800 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-locare-accent to-locare-highlight bg-clip-text text-transparent">
            Locare Fleet Management
          </h1>
          <p className="text-gray-400 mt-2">Real-time tracking and management</p>
        </div>
        <div>
          {!authenticated ? (
            <button onClick={() => keycloak.login()} className="bg-locare-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center gap-2">
              <LogIn size={20}/> Connexion
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <span className="text-gray-300">
                Bonjour, <strong className="text-white">{keycloak.tokenParsed?.preferred_username}</strong>
                {isAdmin && <span className="ml-2 inline-flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded"><Shield size={12}/> Admin</span>}
              </span>
              <button onClick={() => keycloak.logout()} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2">
                <LogOut size={20}/> Déconnexion
              </button>
            </div>
          )}
        </div>
      </header>

      {!authenticated ? (
        <div className="text-center py-20">
          <h2 className="text-3xl font-semibold mb-4">Bienvenue sur Locare (Page Publique)</h2>
          <p className="text-gray-400">Veuillez vous connecter pour accéder à la flotte de véhicules.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Forms (ADMIN ONLY) */}
          <div className="space-y-8">
            {isAdmin ? (
              <>
                <div className="bg-locare-card rounded-xl p-6 shadow-xl border border-gray-800 transition transform hover:-translate-y-1">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Car className="text-locare-accent"/> Add Vehicle</h2>
                  <form onSubmit={handleAddVehicle} className="space-y-4">
                    <input value={vMarque} onChange={e=>setVMarque(e.target.value)} placeholder="Marque" className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:border-locare-accent outline-none" required />
                    <input value={vModele} onChange={e=>setVModele(e.target.value)} placeholder="Modèle" className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:border-locare-accent outline-none" required />
                    <input value={vImmat} onChange={e=>setVImmat(e.target.value)} placeholder="Immatriculation" className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:border-locare-accent outline-none" required />
                    <button type="submit" className="w-full bg-locare-accent hover:bg-blue-600 text-white font-semibold py-2 rounded transition">Save Vehicle</button>
                  </form>
                </div>

                <div className="bg-locare-card rounded-xl p-6 shadow-xl border border-gray-800 transition transform hover:-translate-y-1">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><User className="text-locare-accent"/> Add Driver</h2>
                  <form onSubmit={handleAddDriver} className="space-y-4">
                    <input value={dNom} onChange={e=>setDNom(e.target.value)} placeholder="Nom" className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:border-locare-accent outline-none" required />
                    <input value={dPermis} onChange={e=>setDPermis(e.target.value)} placeholder="Numéro de Permis" className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:border-locare-accent outline-none" required />
                    <button type="submit" className="w-full bg-locare-accent hover:bg-blue-600 text-white font-semibold py-2 rounded transition">Save Driver</button>
                  </form>
                </div>

                <div className="bg-locare-card rounded-xl p-6 shadow-xl border border-gray-800 transition transform hover:-translate-y-1">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><LinkIcon className="text-locare-accent"/> Assign Driver</h2>
                  <form onSubmit={handleAssignDriver} className="space-y-4">
                    <select value={selectedVehicle} onChange={e=>setSelectedVehicle(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:border-locare-accent outline-none" required>
                      <option value="">Sélectionner un véhicule</option>
                      {vehicles.map(v => <option key={v.id} value={v.id}>{v.marque} {v.modele} ({v.immatriculation})</option>)}
                    </select>
                    <select value={selectedDriver} onChange={e=>setSelectedDriver(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:border-locare-accent outline-none" required>
                      <option value="">Sélectionner un conducteur</option>
                      {drivers.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                    </select>
                    <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2 rounded transition">Assign</button>
                  </form>
                </div>
              </>
            ) : (
              <div className="bg-locare-card rounded-xl p-6 border border-gray-800 text-center text-gray-400">
                <Shield className="mx-auto mb-4 opacity-50" size={40} />
                <p>Espace administration réservé aux administrateurs.</p>
              </div>
            )}
          </div>

          {/* Right Column: Map (USER & ADMIN) */}
          <div className="lg:col-span-2">
            <div className="bg-locare-card rounded-xl shadow-xl border border-gray-800 p-2 h-[800px] flex flex-col">
              <div className="p-4 flex items-center justify-between border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <MapPin className="text-locare-accent"/>
                  <h2 className="text-xl font-semibold">Live Map (Protégée)</h2>
                </div>
                {loading && <span className="text-sm text-gray-500">Chargement des données...</span>}
              </div>
              <div className="flex-1 rounded-b-xl overflow-hidden mt-2 relative">
                <MapContainer center={[46.603354, 1.888334]} zoom={6} scrollWheelZoom={true} className="h-full w-full">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {vehicles.map(v => {
                    const driver = drivers.find(d => String(d.id) === String(v.driverId));
                    return <VehicleMarker key={v.id} vehicle={v} driver={driver} />;
                  })}
                </MapContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
