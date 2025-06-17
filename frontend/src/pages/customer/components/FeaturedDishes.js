import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Rating,
  Fade
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import TimerIcon from '@mui/icons-material/Timer';
import { AddButton, SpecialBadge } from './MenuStyled';
import AddIcon from '@mui/icons-material/Add';

const FeaturedDishes = ({ dishes, currentCategory, handleOpenDialog, theme }) => {
  if (currentCategory !== 'All') return null;

  const featuredDishes = dishes.filter(dish => dish.isFeatured).slice(0, 3);
  
  if (featuredDishes.length === 0) return null;

  return (
    <Box mb={6}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 3,
          '&:after': {
            content: '""',
            display: 'block',
            height: '1px',
            flexGrow: 1,
            backgroundColor: 'rgba(0,0,0,0.06)',
            ml: 2
          }
        }}
      >
        <Typography variant="h6" color="primary" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
          <FavoriteIcon sx={{ mr: 1, color: theme.palette.error.main }} />
          Chef's Recommendations
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {featuredDishes.map((dish) => (
          <Grid item xs={12} key={`featured-${dish.id}`}>
            <Fade in={true} timeout={500}>
              <Card
                sx={{
                  display: 'flex',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
                  }
                }}
                onClick={() => handleOpenDialog(dish)}
              >
                <Box sx={{ width: '35%', position: 'relative' }}>
                  <CardMedia
                    component="img"
                    sx={{ height: '100%', objectFit: 'cover' }}
                    image={dish.image_path ? `${process.env.REACT_APP_API_BASE_URL}${dish.image_path}` : 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'}
                    alt={dish.name}
                  />
                  <SpecialBadge>
                    <LocalOfferIcon /> Featured
                  </SpecialBadge>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '65%' }}>
                  <CardContent sx={{ flex: '1 0 auto', p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {dish.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {dish.description || 'A delectable dish crafted with the finest ingredients.'}
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight="bold" color="primary.dark">
                        ₹{dish.price.toFixed(2)}
                      </Typography>
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box display="flex" alignItems="center">
                          <Rating value={parseFloat(dish.rating)} readOnly precision={0.5} size="small" />
                          <Typography variant="body2" sx={{ ml: 0.5 }}>
                            {dish.rating}
                          </Typography>
                        </Box>
                        <Chip
                          icon={<TimerIcon fontSize="small" />}
                          label={`${dish.prepTime} min`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <AddButton
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog(dish);
                        }}
                      >
                        Add
                      </AddButton>
                    </Box>
                  </CardContent>
                </Box>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default FeaturedDishes;
