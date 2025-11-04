import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Category as CategoryIcon,
  Inventory as ProductIcon,
  People as UserIcon,
  Store as BranchIcon,
  ShoppingCart as OrderIcon,
  People as PeopleIcon,
} from '@mui/icons-material';

const Dashboard = () => {
  const [stats, setStats] = useState({
    categories: 12,
    products: 124,
    users: 42,
    branches: 8,
    orders: 1240,
    customers: 892
  });

  const statCards = [
    { title: 'Categories', value: stats.categories, icon: <CategoryIcon />, color: '#667eea' },
    { title: 'Products', value: stats.products, icon: <ProductIcon />, color: '#764ba2' },
    { title: 'Users', value: stats.users, icon: <UserIcon />, color: '#f093fb' },
    { title: 'Branches', value: stats.branches, icon: <BranchIcon />, color: '#74f9ff' },
    { title: 'Orders', value: stats.orders, icon: <OrderIcon />, color: '#ff6b6b' },
    { title: 'Customers', value: stats.customers, icon: <UserIcon />, color: '#4ecdc4' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            color: '#667eea', 
            fontWeight: 700, 
            mb: 1,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Dashboard Overview
        </Typography>
        <Typography variant="body1" sx={{ color: '#667eea', opacity: 0.8 }}>
          Welcome to your MegaPaints Admin Dashboard
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${stat.color}20 0%, ${stat.color}10 100%)`,
                border: `1px solid ${stat.color}20`,
                borderRadius: 2,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: `0 10px 20px ${stat.color}20`,
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      backgroundColor: `${stat.color}20`,
                      color: stat.color,
                      width: 56,
                      height: 56,
                      mr: 2
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: stat.color }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: stat.color, opacity: 0.8 }}>
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 6 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            color: '#667eea', 
            fontWeight: 600, 
            mb: 3,
            pb: 1,
            borderBottom: '1px solid rgba(102, 126, 234, 0.2)'
          }}
        >
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                textAlign: 'center',
                p: 3,
                background: 'linear-gradient(135deg, #667eea20 0%, #764ba210 100%)',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #667eea30 0%, #764ba220 100%)',
                  transform: 'translateY(-3px)'
                }
              }}
              onClick={() => window.location.hash = '/admin/categories'}
            >
              <CategoryIcon sx={{ fontSize: 40, color: '#667eea', mb: 1 }} />
              <Typography variant="h6" sx={{ color: '#667eea', fontWeight: 600 }}>
                Manage Categories
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                textAlign: 'center',
                p: 3,
                background: 'linear-gradient(135deg, #764ba220 0%, #667eea10 100%)',
                border: '1px solid rgba(118, 75, 162, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba230 0%, #667eea20 100%)',
                  transform: 'translateY(-3px)'
                }
              }}
              onClick={() => window.location.hash = '/admin/products'}
            >
              <ProductIcon sx={{ fontSize: 40, color: '#764ba2', mb: 1 }} />
              <Typography variant="h6" sx={{ color: '#764ba2', fontWeight: 600 }}>
                Manage Products
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                textAlign: 'center',
                p: 3,
                background: 'linear-gradient(135deg, #f093fb20 0%, #f5576c10 100%)',
                border: '1px solid rgba(240, 147, 251, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #f093fb30 0%, #f5576c20 100%)',
                  transform: 'translateY(-3px)'
                }
              }}
              onClick={() => window.location.hash = '/admin/users'}
            >
              <UserIcon sx={{ fontSize: 40, color: '#f093fb', mb: 1 }} />
              <Typography variant="h6" sx={{ color: '#f093fb', fontWeight: 600 }}>
                Manage Users
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                textAlign: 'center',
                p: 3,
                background: 'linear-gradient(135deg, #4ecdc420 0%, #88d3ce10 100%)',
                border: '1px solid rgba(78, 205, 196, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4ecdc430 0%, #88d3ce20 100%)',
                  transform: 'translateY(-3px)'
                }
              }}
              onClick={() => window.location.hash = '/admin/customers'}
            >
              <UserIcon sx={{ fontSize: 40, color: '#4ecdc4', mb: 1 }} />
              <Typography variant="h6" sx={{ color: '#4ecdc4', fontWeight: 600 }}>
                Manage Customers
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;