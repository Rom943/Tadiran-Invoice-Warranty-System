
import { Admin, Resource, ListGuesser, EditGuesser, ShowGuesser } from 'react-admin';
import { authProvider } from './authProvider';
import { dataProvider } from './dataProvider';
import { InstallerList, InstallerShow } from './components/installers';
import { WarrantyList, WarrantyEdit, WarrantyShow } from './components/warranties';
import { Dashboard } from './components/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';

const App = () => (
  <Admin
    authProvider={authProvider}
    dataProvider={dataProvider}
    dashboard={Dashboard}
    title="Tadiran Warranty Admin"
  >
    <Resource
      name="installers"
      list={InstallerList}
      show={InstallerShow}
      icon={PersonIcon}
      options={{ label: 'Installers' }}
    />
    <Resource
      name="warranties"
      list={WarrantyList}
      edit={WarrantyEdit}
      show={WarrantyShow}
      icon={AssignmentIcon}
      options={{ label: 'Warranties' }}
    />
  </Admin>
);

export default App;
