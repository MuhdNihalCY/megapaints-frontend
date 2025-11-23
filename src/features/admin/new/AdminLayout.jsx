import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { styled, useTheme } from '@mui/material/styles';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  Store as StoreIcon,
  Science as ScienceIcon,
  Build as BuildIcon,
  Extension as ExtensionIcon,
  ShoppingCart as ShoppingCartIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Settings as SettingsIcon,
  Layers as LayersIcon,
  LocalShipping as LocalShippingIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme as useAppTheme } from '../../../contexts/ThemeContext';

const drawerWidth = 260;
const drawerWidthCollapsed = 80;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: drawerWidthCollapsed,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: drawerWidth,
    }),
  }),
);

const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  width: `calc(100% - ${drawerWidthCollapsed}px)`,
  marginLeft: drawerWidthCollapsed - 10, // Extend left edge to overlap sidebar curve
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth - 10, // Extend left edge to overlap sidebar curve
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
  borderRadius: '0 0 12px 0', // Curve the bottom right corner
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2, 2),
  minHeight: 64,
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  cursor: 'pointer',
}));

const LogoImage = styled('img')({
  height: 40,
  width: 'auto',
});

const SidebarBottom = styled(Box)(({ theme }) => ({
  marginTop: 'auto',
  borderTop: `1px solid ${theme.palette.divider}`,
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  position: 'sticky',
  bottom: 0,
  backgroundColor: theme.palette.background.paper,
}));

// Updated menu items with icons and paths
const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
  { text: 'Categories', icon: <CategoryIcon />, path: '/admin/categories' },
  { text: 'Sub-Categories', icon: <LayersIcon />, path: '/admin/sub-categories' },
  { text: 'Products', icon: <InventoryIcon />, path: '/admin/products' },
  { text: 'Additives', icon: <ScienceIcon />, path: '/admin/additives' },
  { text: 'Binders', icon: <BuildIcon />, path: '/admin/binders' },
  { text: 'Auxiliaries', icon: <ExtensionIcon />, path: '/admin/auxiliaries' },
  { text: 'Accessories', icon: <ExtensionIcon />, path: '/admin/accessories' },
  { text: '3P Products', icon: <LocalShippingIcon />, path: '/admin/third-party-products' },
  { text: 'Branches', icon: <StoreIcon />, path: '/admin/branches' },
  { text: 'Users', icon: <PeopleIcon />, path: '/admin/users' },
  { text: 'Customers', icon: <PeopleIcon />, path: '/admin/customers' },
  { text: 'Orders', icon: <ShoppingCartIcon />, path: '/admin/orders' },
];

export default function AdminLayout() {
  const theme = useTheme();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useAppTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/admin/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogoClick = () => {
    setOpen(true);
    navigate('/admin/dashboard');
  };

  const isMenuItemActive = (path) => {
    return location.pathname === path;
  };

  // Get current page title and icon based on active route
  const getCurrentPageInfo = () => {
    const activeItem = menuItems.find(item => isMenuItemActive(item.path));
    return activeItem || { text: 'Admin Dashboard', icon: <DashboardIcon /> };
  };

  const currentPageInfo = getCurrentPageInfo();

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBarStyled position="fixed" open={open}>
        <Toolbar sx={{ minHeight: 64 }}>
          <ListItemIcon sx={{ 
            minWidth: 'auto', 
            mr: 1.5, 
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {currentPageInfo.icon}
          </ListItemIcon>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 600,
              color: theme.palette.text.primary,
              fontSize: '1.1rem',
            }}
          >
            {currentPageInfo.text}
          </Typography>
          
          <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <IconButton 
              color="inherit" 
              onClick={toggleTheme}
              sx={{ 
                borderRadius: 2,
                mr: 1.5,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                }
              }}
            >
              {isDark ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Profile">
            <IconButton
              onClick={handleMenuOpen}
              size="small"
            >
              <Avatar 
                sx={{ 
                  width: 36,
                  height: 36,
                  background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
                {user?.username?.[0]?.toUpperCase() || 'A'}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                mt: 0.5,
                minWidth: 160,
                borderRadius: 1,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                py: 0.25,
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem 
              onClick={() => { 
                handleMenuClose(); 
                handleNavigation('/admin/profile'); 
              }}
              sx={{ 
                py: 0.75,
                px: 1.25,
                borderRadius: 0.75,
                mx: 0.25,
                my: 0.1,
                fontSize: '0.85rem',
              }}
            >
              <SettingsIcon sx={{ mr: 1, fontSize: 16 }} />
              Profile Settings
            </MenuItem>
            
            <Divider sx={{ my: 0.25 }} />
            
            <MenuItem 
              onClick={handleLogout}
              sx={{ 
                py: 0.75,
                px: 1.25,
                borderRadius: 0.75,
                mx: 0.25,
                my: 0.1,
                fontSize: '0.85rem',
                color: theme.palette.error.main,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(244, 67, 54, 0.08)'
                    : 'rgba(244, 67, 54, 0.04)',
                }
              }}
            >
              <LogoutIcon sx={{ mr: 1, fontSize: 16 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBarStyled>

      <Drawer
        sx={{
          width: open ? drawerWidth : drawerWidthCollapsed,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : drawerWidthCollapsed,
            boxSizing: 'border-box',
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
            borderRadius: open ? '0 12px 12px 0' : '0 8px 8px 0',
          },
        }}
        variant="permanent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <LogoContainer onClick={handleLogoClick}>
            <LogoImage 
              src="/public/images/logo.svg" 
              alt="Logo" 
              style={{ 
                height: open ? 40 : 48,
                width: open ? 'auto' : 48,
                objectFit: 'contain'
              }} 
            />
          </LogoContainer>
          {open && (
            <IconButton 
              onClick={handleDrawerToggle}
              sx={{ 
                ml: 2,
                borderRadius: 1.5,
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
          )}
        </DrawerHeader>

        <Divider />

        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: 'calc(100% - 64px)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
          <List sx={{ px: open ? 1.5 : 1, pt: 2, flex: 1 }}>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <Tooltip title={!open ? item.text : ''} placement="right">
                  <ListItemButton
                    onClick={() => handleNavigation(item.path)}
                    selected={isMenuItemActive(item.path)}
                    sx={{
                      borderRadius: 2,
                      minHeight: 48,
                      justifyContent: open ? 'initial' : 'center',
                      px: open ? 2.5 : 2,
                      '&.Mui-selected': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(33, 150, 243, 0.16)' 
                          : 'rgba(33, 150, 243, 0.08)',
                        color: '#2196f3',
                        '& .MuiListItemIcon-root': {
                          color: '#2196f3',
                        },
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(33, 150, 243, 0.24)'
                            : 'rgba(33, 150, 243, 0.12)',
                        },
                      },
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <ListItemIcon 
                      sx={{ 
                        minWidth: 0,
                        mr: open ? 2.5 : 'auto',
                        justifyContent: 'center',
                        fontSize: 22,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {open && (
                      <ListItemText 
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            ))}
          </List>

          <SidebarBottom sx={{ px: open ? 1.5 : 1 }}>
            {/* Logout Button */}
            <ListItem disablePadding>
              <Tooltip title={!open ? 'Logout' : ''} placement="right">
                <ListItemButton
                  onClick={handleLogout}
                  sx={{
                    borderRadius: 2,
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: open ? 2.5 : 2,
                    color: theme.palette.error.main,
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(244, 67, 54, 0.08)'
                        : 'rgba(244, 67, 54, 0.04)',
                    },
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      minWidth: 0,
                      mr: open ? 2.5 : 'auto',
                      justifyContent: 'center',
                      color: 'inherit',
                      fontSize: 22,
                    }}
                  >
                    <LogoutIcon />
                  </ListItemIcon>
                  {open && (
                    <ListItemText 
                      primary="Logout"
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          </SidebarBottom>
        </Box>
      </Drawer>

      <Main open={open}>
        <DrawerHeader />
        <Outlet />
      </Main>
    </Box>
  );
}