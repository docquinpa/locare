import { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Car, User, MapPin, LogIn, LogOut, Shield, Link as LinkIcon, Wrench, Bell, LayoutDashboard, Plus, CheckCircle, Settings } from 'lucide-react';
import keycloak from './keycloak';

const GET_DATA = gql`
  query GetData {
    vehicles { id marque modele immatriculation statut driverId }
    drivers { id nom permis expiration assignedVehicleId }
    alertes { id vehicleId type message timestamp }
  }
`;

const GET_LOCATION_HISTORY = gql`
  query GetLocationHistory($vehicleId: ID!) {
    vehicleLocationHistory(vehicleId: $vehicleId) { latitude longitude timestamp }
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
    assignDriver(vehicleId: $vehicleId, driverId: $driverId) { id driverId }
  }
`;

const CREATE_MAINTENANCE = gql`
  mutation CreateMaintenance($input: MaintenanceInput!) {
    createMaintenance(input: $input) { id status }
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
          <strong>{vehicle.marque} {vehicle.modele}</strong><br/>
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
  const [activeTab, setActiveTab] = useState('map');

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
  }, []);

  const { loading, error, data, refetch } = useQuery(GET_DATA, { skip: !authenticated, pollInterval: 5000 });
  const [createVehicle, { error: vErr }] = useMutation(CREATE_VEHICLE);
  const [createDriver, { error: dErr }] = useMutation(CREATE_DRIVER);
  const [assignDriver, { error: aErr }] = useMutation(ASSIGN_DRIVER);
  const [createMaintenance, { error: mErr }] = useMutation(CREATE_MAINTENANCE);

  // States for forms
  const [vMarque, setVMarque] = useState('');
  const [vModele, setVModele] = useState('');
  const [vImmat, setVImmat] = useState('');
  const [dNom, setDNom] = useState('');
  const [dPermis, setDPermis] = useState('');
  const [selV, setSelV] = useState('');
  const [selD, setSelD] = useState('');
  const [mType, setMType] = useState('REVISION');
  const [mDesc, setMDesc] = useState('');

  if (!initialized) return <div className="p-8 text-center text-white font-mono animate-pulse">Initializing Security...</div>;

  const isAdmin = keycloak.hasRealmRole('admin');
  const isEngineer = keycloak.hasRealmRole('ingenieur');
  const vehicles = data?.vehicles || [];
  const drivers = data?.drivers || [];
  const alertes = data?.alertes || [];

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
        await createVehicle({ variables: { input: { marque: vMarque, modele: vModele, immatriculation: vImmat, statut: 'AVAILABLE' } } });
        await refetch();
        setVMarque(''); setVModele(''); setVImmat('');
        alert("Véhicule ajouté avec succès !");
    } catch (e) { console.error(e); }
  };

  const handleAddDriver = async (e) => {
    e.preventDefault();
    try {
        await createDriver({ variables: { input: { nom: dNom, permis: dPermis, expiration: '2030-12-31' } } });
        await refetch();
        setDNom(''); setDPermis('');
        alert("Conducteur ajouté !");
    } catch (e) { console.error(e); }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
        await assignDriver({ variables: { vehicleId: selV, driverId: selD } });
        await refetch();
        alert("Affectation réussie !");
    } catch (e) { console.error(e); }
  };

  const handleStartMaintenance = async (e) => {
    e.preventDefault();
    try {
        await createMaintenance({ variables: { input: { vehicleId: selV, type: mType, description: mDesc, dateDebut: new Date().toISOString() } } });
        await refetch();
        setMDesc('');
        alert("Maintenance démarrée !");
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-locare-dark p-8 font-sans text-white">
      <header className="mb-8 border-b border-gray-800 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-locare-accent to-locare-highlight bg-clip-text text-transparent">Locare Fleet</h1>
          <div className="flex gap-2 items-center mt-1">
             <span className="text-[10px] text-gray-500 uppercase tracking-widest">v3.0 Extended</span>
             <span className="text-[8px] text-gray-700 italic">Roles: {keycloak.realmAccess?.roles.join(', ')}</span>
          </div>
        </div>
        {authenticated && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-bold">{keycloak.tokenParsed?.preferred_username}</p>
                <div className="flex gap-1 justify-end flex-wrap">
                    {isAdmin && <span className="text-[10px] bg-red-500/20 text-red-400 px-1 rounded flex items-center gap-0.5"><Shield size={10}/> Admin</span>}
                    {isEngineer && <span className="text-[10px] bg-green-500/20 text-green-400 px-1 rounded flex items-center gap-0.5"><Wrench size={10}/> Ingé</span>}
                </div>
              </div>
              <button onClick={() => keycloak.logout()} className="bg-gray-800 p-2 rounded-full hover:bg-gray-700"><LogOut size={20}/></button>
            </div>
        )}
      </header>

      {authenticated && (
        <nav className="flex gap-4 mb-8 bg-gray-900/50 p-2 rounded-2xl w-fit">
          <button onClick={()=>setActiveTab('map')} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${activeTab==='map' ? 'bg-locare-accent text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white'}`}>
            <MapPin size={18}/> Carte
          </button>
          {isAdmin && (
            <button onClick={()=>setActiveTab('manage')} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${activeTab==='manage' ? 'bg-locare-accent text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white'}`}>
              <Settings size={18}/> Gestion
            </button>
          )}
          {(isAdmin || isEngineer) && (
            <button onClick={()=>setActiveTab('maintenance')} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${activeTab==='maintenance' ? 'bg-locare-accent text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white'}`}>
              <Wrench size={18}/> Maintenance
            </button>
          )}
          {isAdmin && (
            <button onClick={()=>setActiveTab('alertes')} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${activeTab==='alertes' ? 'bg-locare-accent text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white'}`}>
              <Bell size={18}/> Alertes
              {alertes.length > 0 && <span className="ml-1 bg-red-500 text-[10px] px-1.5 py-0.5 rounded-full">{alertes.length}</span>}
            </button>
          )}
        </nav>
      )}

      {!authenticated ? (
        <div className="text-center py-20 bg-locare-card rounded-3xl border border-gray-800">
          <LayoutDashboard size={80} className="mx-auto mb-6 text-gray-800"/>
          <h2 className="text-3xl font-bold mb-4">Connexion Requise</h2>
          <button onClick={() => keycloak.login()} className="bg-locare-accent px-8 py-3 rounded-xl font-bold text-lg hover:scale-105 transition">Se connecter avec Keycloak</button>
        </div>
      ) : (
        <main>
          {activeTab === 'map' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="bg-locare-card rounded-2xl p-6 border border-gray-800 max-h-[700px] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Car className="text-locare-accent"/> Ma Flotte ({vehicles.length})</h2>
                <div className="space-y-3">
                  {vehicles.map(v => {
                    const assignedDriver = drivers.find(d => String(d.id) === String(v.driverId));
                    return (
                      <div key={v.id} className="p-3 bg-gray-900/50 rounded-xl border border-gray-800 hover:border-gray-600 transition group cursor-pointer">
                          <div className="flex justify-between items-start">
                              <p className="font-bold group-hover:text-locare-accent transition">{v.marque} {v.modele}</p>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${v.statut==='AVAILABLE' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{v.statut}</span>
                          </div>
                          <div className="flex justify-between items-end mt-1">
                            <p className="text-[10px] text-gray-500">{v.immatriculation}</p>
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-800/50 px-1.5 py-0.5 rounded">
                                <User size={10} className="text-locare-accent"/>
                                <span>{assignedDriver ? assignedDriver.nom : 'Libre'}</span>
                            </div>
                          </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="lg:col-span-3 bg-locare-card rounded-2xl border border-gray-800 overflow-hidden h-[700px]">
                <MapContainer center={[46.603354, 1.888334]} zoom={6} className="h-full w-full">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {vehicles.map(v => <VehicleMarker key={v.id} vehicle={v} driver={drivers.find(d => String(d.id) === String(v.driverId))} />)}
                </MapContainer>
              </div>
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-locare-card p-6 rounded-2xl border border-gray-800">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Car className="text-locare-accent"/> Nouveau Véhicule</h3>
                    <form onSubmit={handleAddVehicle} className="space-y-4">
                        <input value={vMarque} onChange={e=>setVMarque(e.target.value)} placeholder="Marque" className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700 outline-none focus:border-locare-accent" required />
                        <input value={vModele} onChange={e=>setVModele(e.target.value)} placeholder="Modèle" className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700 outline-none focus:border-locare-accent" required />
                        <input value={vImmat} onChange={e=>setVImmat(e.target.value)} placeholder="Immatriculation" className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700 outline-none focus:border-locare-accent" required />
                        <button type="submit" className="w-full bg-locare-accent py-3 rounded-lg font-bold hover:bg-blue-600 transition">Enregistrer</button>
                    </form>
                </div>
                <div className="bg-locare-card p-6 rounded-2xl border border-gray-800">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><User className="text-locare-accent"/> Nouveau Conducteur</h3>
                    <form onSubmit={handleAddDriver} className="space-y-4">
                        <input value={dNom} onChange={e=>setDNom(e.target.value)} placeholder="Nom Complet" className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700 outline-none focus:border-locare-accent" required />
                        <input value={dPermis} onChange={e=>setDPermis(e.target.value)} placeholder="N° Permis" className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700 outline-none focus:border-locare-accent" required />
                        <button type="submit" className="w-full bg-locare-accent py-3 rounded-lg font-bold hover:bg-blue-600 transition">Enregistrer</button>
                    </form>
                </div>
                <div className="bg-locare-card p-6 rounded-2xl border border-gray-800">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><LinkIcon className="text-locare-accent"/> Affectation</h3>
                    <form onSubmit={handleAssign} className="space-y-4">
                        <select value={selV} onChange={e=>setSelV(e.target.value)} className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700 outline-none focus:border-locare-accent" required>
                            <option value="">-- Choisir Véhicule --</option>
                            {vehicles.map(v => <option key={v.id} value={v.id}>{v.marque} {v.modele}</option>)}
                        </select>
                        <select value={selD} onChange={e=>setSelD(e.target.value)} className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700 outline-none focus:border-locare-accent" required>
                            <option value="">-- Choisir Conducteur --</option>
                            {drivers.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                        </select>
                        <button type="submit" className="w-full bg-green-600 py-3 rounded-lg font-bold hover:bg-green-500 transition">Assigner</button>
                    </form>
                </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="bg-locare-card rounded-2xl p-6 border border-gray-800">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-locare-accent"><Plus/> Planifier</h2>
                <form onSubmit={handleStartMaintenance} className="space-y-4">
                    <select value={selV} onChange={e=>setSelV(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 outline-none focus:border-locare-accent" required>
                        <option value="">-- Choisir Véhicule --</option>
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.marque} {v.modele}</option>)}
                    </select>
                    <select value={mType} onChange={e=>setMType(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 outline-none focus:border-locare-accent">
                        <option value="REVISION">Révision</option>
                        <option value="REPARATION">Réparation</option>
                        <option value="CONTROLE">Contrôle Technique</option>
                    </select>
                    <textarea value={mDesc} onChange={e=>setMDesc(e.target.value)} placeholder="Description de l'intervention..." className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 outline-none focus:border-locare-accent h-24" />
                    <button type="submit" className="w-full bg-locare-accent py-3 rounded-lg font-bold hover:bg-blue-600 transition">Démarrer Intervention</button>
                </form>
              </div>
              <div className="lg:col-span-3 space-y-4">
                <h2 className="text-2xl font-bold">Maintenances en cours</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vehicles.filter(v => v.statut === 'MAINTENANCE').map(v => (
                        <div key={v.id} className="bg-locare-card p-4 rounded-xl border border-yellow-500/30 flex justify-between items-center">
                            <div>
                                <p className="font-bold">{v.marque} {v.modele}</p>
                                <p className="text-xs text-gray-500">En cours de révision...</p>
                            </div>
                            <Wrench className="text-yellow-500 animate-pulse" />
                        </div>
                    ))}
                    {vehicles.filter(v => v.statut === 'MAINTENANCE').length === 0 && <p className="text-gray-500 italic">Aucune intervention active.</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alertes' && (
            <div className="space-y-6 max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold flex items-center gap-2"><Bell className="text-red-500"/> Centre d'Alertes</h2>
                <div className="grid gap-4">
                    {alertes.map(a => (
                        <div key={a.id} className="bg-locare-card border-l-4 border-red-500 p-6 rounded-r-2xl flex justify-between items-center shadow-xl hover:bg-gray-800/50 transition">
                            <div>
                                <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full uppercase font-bold tracking-tighter">{a.type}</span>
                                <p className="text-lg mt-2 font-medium">{a.message}</p>
                                <p className="text-xs text-gray-500 mt-1">{new Date(parseInt(a.timestamp)).toLocaleString()}</p>
                            </div>
                            <CheckCircle className="text-gray-600 hover:text-green-500 cursor-pointer transition" size={28}/>
                        </div>
                    ))}
                    {alertes.length === 0 && <div className="text-center py-20 text-gray-500 italic">Aucune alerte pour le moment. Tout va bien !</div>}
                </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
