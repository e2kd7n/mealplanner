import React from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  CalendarMonth as CalendarIcon,
  ShoppingCart as ShoppingCartIcon,
  Kitchen as KitchenIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Browse Recipes',
      description: 'Explore and discover new recipes',
      icon: <RestaurantIcon sx={{ fontSize: 40 }} />,
      color: '#2E7D32',
      path: '/recipes',
    },
    {
      title: 'Plan Meals',
      description: 'Create your weekly meal plan',
      icon: <CalendarIcon sx={{ fontSize: 40 }} />,
      color: '#1976D2',
      path: '/meal-planner',
    },
    {
      title: 'Grocery List',
      description: 'Manage your shopping list',
      icon: <ShoppingCartIcon sx={{ fontSize: 40 }} />,
      color: '#FF6F00',
      path: '/grocery-list',
    },
    {
      title: 'Pantry',
      description: 'Track your pantry inventory',
      icon: <KitchenIcon sx={{ fontSize: 40 }} />,
      color: '#7B1FA2',
      path: '/pantry',
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to Meal Planner
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Plan your meals, manage your grocery list, and track your pantry inventory all in one place.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {quickActions.map((action) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={action.title}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mb: 2,
                    color: action.color,
                  }}
                >
                  {action.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => navigate(action.path)}
                  sx={{ bgcolor: action.color }}
                >
                  Go
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your recent meal plans and grocery lists will appear here.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Dashboard;

// Made with Bob
