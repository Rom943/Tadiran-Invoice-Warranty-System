import React from 'react';
import {
  Create,
  SimpleForm,
  TextInput,
  PasswordInput,
  useNotify,
  useRedirect,
  required,
  List,
  Datagrid,
  TextField,
  DateField,
} from 'react-admin';
import { Typography } from '@mui/material';

export const AdminCreate = () => {
  const notify = useNotify();
  const redirect = useRedirect();

  const onSuccess = () => {
    notify('Admin registered successfully', { type: 'success' });
    redirect('list', 'admins');
  };

  const onError = (error: any) => {
    notify(`Error: ${error.message || 'Could not register admin'}`, { type: 'error' });
  };

  return (
    <Create title="Register New Admin" mutationOptions={{ onSuccess, onError }}>
      <SimpleForm>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Register a new admin user. You must be logged in as an admin to use this form.
        </Typography>
        <TextInput source="email" label="Email" type="email" validate={[required()]} fullWidth />
        <PasswordInput source="password" label="Password" validate={[required()]} fullWidth />
        <TextInput source="name" label="Name" fullWidth />
      </SimpleForm>
    </Create>
  );
};

export const AdminList = () => (
  <List title="Admins" sort={{ field: 'createdAt', order: 'DESC' }}>
    <Datagrid>
      <TextField source="id" label="ID" />
      <TextField source="email" label="Email" />
      <TextField source="name" label="Name" />
      <DateField source="createdAt" label="Created At" showTime />
    </Datagrid>
  </List>
);
