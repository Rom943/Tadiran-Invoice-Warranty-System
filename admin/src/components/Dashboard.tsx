import  { useState, useEffect } from 'react';
import { useDataProvider, Title, Loading, useAuthenticated } from 'react-admin';
import { Box, Card, CardContent, Typography, Divider } from '@mui/material';


interface DashboardStats {
  totalInstallers: number;
  totalWarranties: number;
  pendingWarranties: number;
  approvedWarranties: number;
  rejectedWarranties: number;
  inProgressWarranties: number;
}

export const Dashboard = () => {
  // Use authentication to ensure the user is logged in - must be at the top level
  useAuthenticated();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalInstallers: 0,
    totalWarranties: 0,
    pendingWarranties: 0,
    approvedWarranties: 0,
    rejectedWarranties: 0,
    inProgressWarranties: 0
  });
  const [loading, setLoading] = useState(true);
  const dataProvider = useDataProvider();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch installers
        const installersResponse = await dataProvider.getList('installers', {
          pagination: { page: 1, perPage: 1000 },
          sort: { field: 'id', order: 'ASC' },
          filter: {},
        });

        // Fetch warranties
        const warrantiesResponse = await dataProvider.getList('warranties', {
          pagination: { page: 1, perPage: 1000 },
          sort: { field: 'id', order: 'ASC' },
          filter: {},
        });

        const warranties = warrantiesResponse.data;          setStats({
          totalInstallers: installersResponse.total || 0,
          totalWarranties: warrantiesResponse.total || 0,
          pendingWarranties: warranties.filter((w: any) => w.status === 'PENDING').length,
          approvedWarranties: warranties.filter((w: any) => w.status === 'APPROVED').length,
          rejectedWarranties: warranties.filter((w: any) => w.status === 'REJECTED').length,
          inProgressWarranties: warranties.filter((w: any) => w.status === 'IN_PROGRESS').length
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [dataProvider]);
  
  if (loading) {
    return <Loading />;
  }

  return (
    <Box sx={{ padding: 2 }}>
      <Title title="Dashboard" />
      
      <Typography variant="h4" gutterBottom>
        Tadiran Warranty System Dashboard
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, my: 2 }}>
        <StatCard title="Total Installers" value={stats.totalInstallers} color="#1976d2" />
        <StatCard title="Total Warranties" value={stats.totalWarranties} color="#1976d2" />
        <StatCard title="Pending Warranties" value={stats.pendingWarranties} color="#ff9800" />
        <StatCard title="Approved Warranties" value={stats.approvedWarranties} color="#4caf50" />
        <StatCard title="Rejected Warranties" value={stats.rejectedWarranties} color="#f44336" />
        <StatCard title="In Progress" value={stats.inProgressWarranties} color="#9c27b0" />
      </Box>
      
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Typography color="textSecondary">
            Use the sidebar to navigate to Installers or Warranties to manage the system.
          </Typography>
        </CardContent>
      </Card>


    </Box>
  );
};

const StatCard = ({ title, value, color }: { title: string, value: number, color: string }) => (
  <Card sx={{ minWidth: 200, flex: '1 1 200px' }}>
    <CardContent>
      <Typography sx={{ fontSize: 14 }} color="textSecondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" component="div" sx={{ color }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

