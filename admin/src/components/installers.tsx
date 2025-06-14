
import {
  List,
  Datagrid,
  TextField,
  DateField,
  Show,
  SimpleShowLayout,
  TopToolbar,
  ExportButton,
  DateInput,
  TextInput,
  SearchInput,
  FilterButton,
  FilterForm,
  ReferenceField,
  useRecordContext,
  EditButton,
  useGetOne,
  Title,
  FunctionField,
  ChipField,
  useListContext
} from 'react-admin';
import { useParams } from 'react-router-dom';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';

const InstallerFilters = [
  <SearchInput source="q" alwaysOn />,
  <TextInput label="Email" source="email" />,
  <TextInput label="Name" source="name" />,
  <DateInput label="Registered After" source="createdAt_gte" />,
];

export const InstallerList = () => (
  <List 
    filters={InstallerFilters}
    sort={{ field: 'createdAt', order: 'DESC' }}
  >
    <Datagrid 
      rowClick="show"
      bulkActionButtons={false}
    >
      <TextField source="name" label="Name" />
      <TextField source="email" label="Email" />
      <FunctionField 
        label="Warranties"
        render={(record: any) => record._count?.warranties || 0} 
      />
      <DateField source="createdAt" label="Registered" showTime />
      <DateField source="updatedAt" label="Last Updated" showTime />
    </Datagrid>
  </List>
);

export const InstallerShow = () => {
  const { id } = useParams();
  
  return (
    <Show>
      <SimpleShowLayout>
        <TextField source="id" />
        <TextField source="name" />
        <TextField source="email" />
        <DateField source="createdAt" showTime />
        <DateField source="updatedAt" showTime />
        
        <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
          Warranties
        </Typography>
        
        <WarrantiesByInstaller installerId={id} />
      </SimpleShowLayout>
    </Show>
  );
};

const WarrantiesByInstaller = ({ installerId }: { installerId?: string }) => {
  const { data, isLoading } = useGetOne(
    'installers',
    { id: installerId },
    { enabled: !!installerId }
  );

  if (isLoading || !data || !data.warranties) {
    return <div>Loading warranties...</div>;
  }

  if (data.warranties.length === 0) {
    return <Typography>No warranties submitted yet.</Typography>;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Card>
        <CardContent>
          <Datagrid 
            rowClick="show"
            data={data.warranties} 
            bulkActionButtons={false}
            resource="warranties"
            isRowSelectable={() => false}
          >
            <TextField source="productSN" label="Serial Number" />
            <TextField source="clientName" label="Client" />
            <DateField source="installDate" label="Installation Date" />
            <ChipField source="status" label="Status" />
            <DateField source="createdAt" label="Submitted" showTime />
            <EditButton />
          </Datagrid>
        </CardContent>
      </Card>
    </Box>
  );
};

const WarrantyStatusChip = () => {
  const record = useRecordContext();
  if (!record) return null;
  
  let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  switch (record.status) {
    case 'APPROVED':
      color = 'success';
      break;
    case 'REJECTED':
      color = 'error';
      break;
    case 'PENDING':
      color = 'warning';
      break;
    case 'IN_PROGRESS':
      color = 'info';
      break;
    default:
      color = 'default';
  }
  
  return <Chip label={record.status} color={color} />;
};
