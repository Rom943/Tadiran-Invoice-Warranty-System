import {
  List,
  Datagrid,
  TextField,
  DateField,
  EditButton,
  Edit,
  SimpleForm,
  SelectInput,
  Show,
  SimpleShowLayout,
  TextInput,
  ReferenceField,
  useNotify,
  useRedirect,
  useRefresh,
  TopToolbar,
  FilterButton,
  ExportButton,
  SearchInput,
  DateInput,
  FunctionField,
  useRecordContext,
  useUpdate
} from 'react-admin';
import { Card, CardContent, Typography, Box, Chip, CircularProgress } from '@mui/material';

import { useState } from 'react';

const WarrantyFilters = [
  <SearchInput source="q" alwaysOn />,
  <TextInput label="Client Name" source="clientName" />,
  <TextInput label="Serial Number" source="productSN" />,
  <SelectInput 
    label="Status" 
    source="status" 
    choices={[
      { id: 'PENDING', name: 'Pending' },
      { id: 'APPROVED', name: 'Approved' },
      { id: 'REJECTED', name: 'Rejected' },
      { id: 'IN_PROGRESS', name: 'In Progress' },
    ]} 
  />,
  <DateInput label="Installed After" source="installDate_gte" />,
  <DateInput label="Installed Before" source="installDate_lte" />,
  <DateInput label="Submitted After" source="createdAt_gte" />,
];

const WarrantyListActions = () => (
  <TopToolbar>
    <FilterButton />
    <ExportButton />
  </TopToolbar>
);

const WarrantyStatusChip = () => {
  const record = useRecordContext();
  if (!record) return null;
  
  let color: 'success' | 'error' | 'warning' | 'info' | 'default';
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

export const WarrantyList = () => (
  <List 
    filters={WarrantyFilters}
    actions={<WarrantyListActions />}
    sort={{ field: 'createdAt', order: 'DESC' }}
  >
    <Datagrid rowClick="show">
      <TextField source="id" label="ID" />
      <TextField source="productSN" label="Serial Number" />
      <TextField source="clientName" label="Client" />
      <ReferenceField source="installerId" reference="installers" label="Installer">
        <TextField source="name" />
      </ReferenceField>
      <DateField source="installDate" label="Installation Date" />
      <FunctionField
        label="Status"
        render={(record: any) => <WarrantyStatusChip />}
      />
      <DateField source="createdAt" label="Submitted" showTime />
      <EditButton />
    </Datagrid>
  </List>
);

const WarrantyTitle = () => {
  const record = useRecordContext();
  return <span>Warranty {record ? `for ${record.clientName}` : ''}</span>;
};

// Define a new component for the form fields to isolate useRecordContext
const WarrantyFormFields = () => {
    const [loading,setLoading] = useState(false);
    const record = useRecordContext();
    const [upadte] = useUpdate();
    const onSubmit = async (values:any) => {
        setLoading(true);
        try {
            if (!record || !record.id) {
                console.error('No record found or record ID is missing');
                return;
            }
            await upadte(
                'warranties',
                { id: record.id, data:values}
            );
        } catch (error) {
            console.error('Error updating warranty:', error);
        } finally {
            setLoading(false);
        }
    }

  return (
    <>
      <SimpleForm onSubmit={onSubmit}>
      <Typography variant="subtitle1" gutterBottom>
        Warranty Details (Read-only)
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <TextInput  source="id" />
        <TextInput  source="productSN" label="Serial Number" sx={{ flexGrow: 1 }} />
        <TextInput  source="clientName" label="Client Name" sx={{ flexGrow: 1 }} />
      </Box>
      
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
        Status Management
      </Typography>
      <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
          Changing the status will notify the installer of the update
        </Typography>
        <SelectInput 
          source="status" 
          label="Status"
          helperText="Select a new status for this warranty"
          choices={[
            { id: 'PENDING', name: 'Pending - Awaiting Review' },
            { id: 'IN_PROGRESS', name: 'In Progress - Under Review' },
            { id: 'APPROVED', name: 'Approved - Warranty Active' },
            { id: 'REJECTED', name: 'Rejected - Warranty Denied' },
          ]}
        />
      </Box>
      
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
        Installer Information
      </Typography>
      <ReferenceField source="installerId" reference="installers" label="Installer">
        <TextField source="name" />
      </ReferenceField>
      {loading && <CircularProgress size={24} sx={{ mt: 2 }} />}
      </SimpleForm>
    </>
  );
};

export const WarrantyEdit = () => {
  const notify = useNotify();
  const redirect = useRedirect();
  const refresh = useRefresh();

  const onSuccess = () => {
    notify('Warranty updated successfully', { type: 'success' });
    redirect('list', 'warranties');
    refresh();
  };

  const onError = (error: Error) =>{
    notify(`Error: ${error.message}`, { type: 'error' });
  };  

  // The <Edit> component fetches the record and provides it via RecordContext.
  // SimpleForm and its children (like WarrantyFormFields) consume this context.
  return (
    <Edit 
      title={<WarrantyTitle />} 
      mutationOptions={{ onSuccess, onError}}
    >
        <WarrantyFormFields />
    </Edit>
  );
};

export const WarrantyShow = () => (
  <Show>
    <SimpleShowLayout>
      <Card sx={{ mb: 3, overflow: 'visible' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Warranty Details
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={2}>
            <Box flex={1} minWidth={200}>
              <Typography variant="subtitle2">Serial Number</Typography>
              <TextField source="productSN" />
            </Box>
            <Box flex={1} minWidth={200}>
              <Typography variant="subtitle2">Client Name</Typography>
              <TextField source="clientName" />
            </Box>
            <Box flex={1} minWidth={200}>
              <Typography variant="subtitle2">Installation Date</Typography>
              <DateField source="installDate" />
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Status Information
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={2}>
            <Box flex={1} minWidth={200}>
              <Typography variant="subtitle2">Current Status</Typography>
              <FunctionField
                render={(record: any) => <WarrantyStatusChip />}
              />
            </Box>
            <Box flex={1} minWidth={200}>
              <Typography variant="subtitle2">Submitted On</Typography>
              <DateField source="createdAt" showTime />
            </Box>
            <Box flex={1} minWidth={200}>
              <Typography variant="subtitle2">Last Updated</Typography>
              <DateField source="updatedAt" showTime />
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Installer Information
          </Typography>
          <ReferenceField source="installerId" reference="installers" label="Installer">
            <Box>
              <Typography variant="subtitle2">Name</Typography>
              <TextField source="name" />
              <Typography variant="subtitle2" sx={{ mt: 1 }}>Email</Typography>
              <TextField source="email" />
            </Box>
          </ReferenceField>
        </CardContent>
      </Card>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Invoice Image
          </Typography>
          <FunctionField
            render={(record: any) => record.imageUrl ? (
              <Box sx={{ mt: 2, maxWidth: '100%' }}>
                <a 
                  href={record.imageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <img 
                    src={record.imageUrl} 
                    alt="Warranty Invoice" 
                    style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }} 
                  />
                </a>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Click on the image to open in full size
                </Typography>
              </Box>
            ) : (
              <Typography color="textSecondary">No image available</Typography>
            )}
          />
        </CardContent>
      </Card>
        <Box display="flex" justifyContent="center" gap={2} mt={2}>
        <EditButton label="Edit Details" />
      </Box>
    </SimpleShowLayout>
  </Show>
);
