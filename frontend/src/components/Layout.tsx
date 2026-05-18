/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Avatar,
  Menu,
  MenuItem,
  Link,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Restaurant as RestaurantIcon,
  CalendarMonth as CalendarIcon,
  ShoppingCart as ShoppingCartIcon,
  Kitchen as KitchenIcon,
  AccountCircle as AccountCircleIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import { fetchExpiringItems, fetchLowStockItems } from '../store/slices/pantrySlice';
import { fetchGroceryLists } from '../store/slices/groceryListsSlice';
import BackendStatusBanner from './BackendStatusBanner';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import MobileBottomNav from './MobileBottomNav';
import FeedbackButton from './FeedbackButton';

const drawerWidth = 240;

// Inline SVG logomark — fork + leaf, 24×24, uses currentColor
const KitchenLogomark = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    style={{ marginRight: 8, color: 'inherit', flexShrink: 0 }}
  >
    {/* Fork */}
    <line x1="7" y1="3" x2="7" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="5" y1="3" x2="5" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="9" y1="3" x2="9" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="7" y1="10" x2="7" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    {/* Leaf */}
    <path
      d="M13 12 C13 7 18 5 20 5 C20 8 18 12 13 12Z"
      fill="currentColor"
      opacity="0.85"
    />
    <line x1="13" y1="12" x2="13" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Recipes', icon: <RestaurantIcon />, path: '/recipes' },
  { text: 'Meal Planner', icon: <CalendarIcon />, path: '/meal-planner' },
  { text: 'Grocery List', icon: <ShoppingCartIcon />, path: '/grocery-list' },
  { text: 'Pantry', icon: <KitchenIcon />, path: '/pantry' },
  { text: 'Admin', icon: <AdminIcon />, path: '/admin', adminOnly: true },
];

const Layout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { expiringItems, lowStockItems } = useAppSelector((state) => state.pantry);
  const { groceryLists } = useAppSelector((state) => state.groceryLists);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useKeyboardShortcuts();

  // Fetch badge data on mount
  useEffect(() => {
    dispatch(fetchExpiringItems());
    dispatch(fetchLowStockItems());
    dispatch(fetchGroceryLists({ status: 'shopping' }));
  }, [dispatch]);

  // ── Badge state ──────────────────────────────────────────────────────────
  const hasPantryAlert = expiringItems.length > 0 || lowStockItems.length > 0;

  const activeGroceryList = groceryLists.find((gl) => gl.status === 'shopping') ?? null;
  const groceryUnchecked = activeGroceryList?.items.filter((i) => !i.isChecked).length ?? 0;

  // ── Family identity ──────────────────────────────────────────────────────
  const familyName = user?.name ?? 'Family';
  const drawerTitle = `${familyName} Kitchen`;

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleMenuClick = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    await dispatch(logout());
    handleProfileMenuClose();
    navigate('/login');
  };

  const getPantryAriaLabel = () => {
    if (!hasPantryAlert) return 'Pantry';
    const parts = [];
    if (expiringItems.length > 0) parts.push(`${expiringItems.length} items expiring soon`);
    if (lowStockItems.length > 0) parts.push(`${lowStockItems.length} items low stock`);
    return `Pantry — ${parts.join(', ')}`;
  };

  const getGroceryAriaLabel = () => {
    if (!groceryUnchecked) return 'Grocery List';
    return `Grocery List — ${groceryUnchecked} items remaining`;
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'primary.main' }}>
          <KitchenLogomark />
          <Typography variant="h6" noWrap component="div" color="primary">
            {drawerTitle}
          </Typography>
        </Box>
      </Toolbar>
      <List>
        {menuItems.map((item) => {
          if (item.adminOnly && user?.role !== 'admin' && user?.role !== 'superadmin') {
            return null;
          }

          const isGrocery = item.path === '/grocery-list';
          const isPantry = item.path === '/pantry';

          const iconWithBadge = isGrocery ? (
            <Badge badgeContent={groceryUnchecked || null} color="secondary" max={99}>
              {item.icon}
            </Badge>
          ) : isPantry ? (
            <Badge variant="dot" color="error" invisible={!hasPantryAlert}>
              {item.icon}
            </Badge>
          ) : (
            item.icon
          );

          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleMenuClick(item.path)}
                aria-label={
                  isGrocery ? getGroceryAriaLabel()
                  : isPantry ? getPantryAriaLabel()
                  : item.text
                }
              >
                <ListItemIcon>{iconWithBadge}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <BackendStatusBanner />

      {/* Skip Navigation Links */}
      <Link
        href="#main-content"
        sx={{
          position: 'absolute',
          left: '-9999px',
          zIndex: 9999,
          padding: '1rem',
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          textDecoration: 'none',
          '&:focus': { left: '0', top: '0' },
        }}
      >
        Skip to main content
      </Link>
      <Link
        href="#navigation"
        sx={{
          position: 'absolute',
          left: '-9999px',
          zIndex: 9999,
          padding: '1rem',
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          textDecoration: 'none',
          '&:focus': { left: '0', top: '3rem' },
        }}
      >
        Skip to navigation
      </Link>

      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label={mobileOpen ? 'close navigation menu' : 'open navigation menu'}
            aria-expanded={mobileOpen}
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' }, minWidth: 44, minHeight: 44 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find((item) => item.path === location.pathname)?.text || drawerTitle}
          </Typography>
          <Tooltip title="Profile & Family Settings">
            <IconButton
              size="large"
              edge="end"
              aria-label="Profile & Family Settings"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/profile'); }}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        id="navigation"
        tabIndex={-1}
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, zIndex: 1200 },
            '& .MuiBackdrop-root': { zIndex: 1199 },
          }}
          aria-label="Mobile navigation menu"
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        id="main-content"
        tabIndex={-1}
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          pb: { xs: 10, md: 3 },
        }}
      >
        <Outlet />
      </Box>

      <MobileBottomNav />
      <FeedbackButton />
    </Box>
  );
};

export default Layout;

// Made with Bob
