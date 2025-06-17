import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Typography,
  Grid,
  Card,
  Button,
  Box,
  Container,
  Paper,
  Stack,
  Divider,
  Fade,
  styled,
  Chip
} from '@mui/material';
import TableSetup from '../components/TableSetup';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining';
import StarIcon from '@mui/icons-material/Star';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RoomServiceIcon from '@mui/icons-material/RoomService';
import SpaIcon from '@mui/icons-material/Spa';
import TabletIcon from '@mui/icons-material/Tablet';
import CloudIcon from '@mui/icons-material/Cloud';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import WifiIcon from '@mui/icons-material/Wifi';
import DevicesIcon from '@mui/icons-material/Devices';
import QrCodeIcon from '@mui/icons-material/QrCode';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { adminService } from '../services/api';

// Styled components for luxury design
const LuxuryCard = styled(Card)(({ theme }) => ({
  height: '100%',
  padding: theme.spacing(3),
  backgroundColor: '#121212',
  color: '#FFFFFF',
  borderRadius: '6px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
  position: 'relative',
  overflow: 'hidden',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 15px 40px rgba(0, 0, 0, 0.3)',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '4px',
    background: theme.palette.primary.main,
  }
}));

const FeatureItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(3),
  '& .MuiSvgIcon-root': {
    color: theme.palette.primary.main,
    marginRight: theme.spacing(2),
    marginTop: '2px'
  }
}));

const TechCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  backgroundColor: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,165,0,0.2)',
  borderRadius: '8px',
  transition: 'all 0.3s ease',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 15px 30px rgba(0, 0, 0, 0.3)',
    borderColor: 'rgba(255,165,0,0.4)',
  }
}));

const StatCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: 'rgba(0,0,0,0.7)',
  borderRadius: '8px',
  border: '1px solid rgba(255,165,0,0.2)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  height: '100%',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
    borderColor: 'rgba(255,165,0,0.4)',
  }
}));

const Home = () => {
  const [showTableSetup, setShowTableSetup] = useState(false);
  const [isVerifyingDatabase, setIsVerifyingDatabase] = useState(false);

  // Verify database connection on component mount
  const verifyDatabaseConnection = async () => {
    const selectedDatabase = localStorage.getItem('customerSelectedDatabase');
    const databasePassword = localStorage.getItem('customerDatabasePassword');

    if (selectedDatabase && databasePassword) {
      try {
        setIsVerifyingDatabase(true);

        // Set the credentials for API calls
        localStorage.setItem('selectedDatabase', selectedDatabase);
        localStorage.setItem('databasePassword', databasePassword);

        // Try to get current database to verify connection
        await adminService.getCurrentDatabase();
        console.log('Customer: Database connection verified');
      } catch (error) {
        console.error('Customer: Database verification failed:', error);
        // Clear invalid database credentials
        localStorage.removeItem('customerSelectedDatabase');
        localStorage.removeItem('customerDatabasePassword');
        localStorage.removeItem('selectedDatabase');
        localStorage.removeItem('databasePassword');
        localStorage.removeItem('tabbleDatabaseSelected');
        setShowTableSetup(true);
      } finally {
        setIsVerifyingDatabase(false);
      }
    }
  };

  // Check if table number and database are set when component mounts
  useEffect(() => {
    const tableNumber = localStorage.getItem('tableNumber');
    const selectedDatabase = localStorage.getItem('customerSelectedDatabase');
    const databasePassword = localStorage.getItem('customerDatabasePassword');

    // Show setup if any of the required items are missing
    if (!tableNumber || !selectedDatabase || !databasePassword) {
      setShowTableSetup(true);
    } else {
      // Verify database connection
      verifyDatabaseConnection();
    }
  }, []);

  // Handle table setup completion
  const handleTableSetupComplete = (setupData) => {
    setShowTableSetup(false);
    // setupData contains { tableNumber, databaseName, password }
    console.log('Setup completed with:', setupData);
    // You can add any additional logic here if needed
  };

  // Hero section background with dark overlay for restaurant feel
  const heroBg = `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80')`;

  // Technology section background
  const techBg = `linear-gradient(rgba(0,0,0,0.9), rgba(0,0,0,0.85)), url('https://images.unsplash.com/photo-1552566626-52f8b828add9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80')`;

  // Technologies used in the app
  const technologies = [
    {
      icon: <TabletIcon sx={{ fontSize: 50, color: '#FFA500', mb: 2 }} />,
      title: 'Tablet Interface',
      description: 'Intuitive tablet-based menu browsing and ordering at the table'
    },
    {
      icon: <RestaurantIcon sx={{ fontSize: 50, color: '#FFA500', mb: 2 }} />,
      title: 'Chef Dashboard',
      description: 'Real-time order queue with prioritization and status updates'
    },
    {
      icon: <AdminPanelSettingsIcon sx={{ fontSize: 50, color: '#FFA500', mb: 2 }} />,
      title: 'Admin ERP',
      description: 'Complete billing system with menu control and staff management'
    },
    {
      icon: <CloudIcon sx={{ fontSize: 50, color: '#FFA500', mb: 2 }} />,
      title: 'Real-time Sync',
      description: 'Instant communication between customers, kitchen and billing'
    },
    {
      icon: <TouchAppIcon sx={{ fontSize: 50, color: '#FFA500', mb: 2 }} />,
      title: 'Direct Ordering',
      description: 'No captain needed - customers order directly from the tablet'
    },
    {
      icon: <StarIcon sx={{ fontSize: 50, color: '#FFA500', mb: 2 }} />,
      title: 'Loyalty Program',
      description: 'Built-in loyalty tracking to increase customer retention'
    }
  ];

  // App statistics
  const statistics = [
    {
      value: '$15k-60k',
      label: 'Monthly Savings',
      icon: <SpeedIcon sx={{ fontSize: 40, color: '#FFA500', mb: 1 }} />
    },
    {
      value: '100%',
      label: 'Order Accuracy',
      icon: <SecurityIcon sx={{ fontSize: 40, color: '#FFA500', mb: 1 }} />
    },
    {
      value: '40%',
      label: 'Faster Service',
      icon: <WifiIcon sx={{ fontSize: 40, color: '#FFA500', mb: 1 }} />
    },
    {
      value: '0',
      label: 'Captains Needed',
      icon: <PeopleIcon sx={{ fontSize: 40, color: '#FFA500', mb: 1 }} />
    }
  ];

  const portalCards = [
    {
      title: 'Customer Tablet Interface',
      description: 'Tablet-based menu browsing and ordering system that eliminates the need for a captain',
      icon: <TabletIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />,
      link: '/customer',
      features: [
        'Direct ordering system',
        'Dish customization options',
        'Loyalty points display',
        'Call waiter or request bill'
      ]
    },
    {
      title: 'Chef Dashboard',
      description: 'Real-time kitchen management system that streamlines food preparation and service',
      icon: <RestaurantIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />,
      link: '/chef',
      features: [
        'Real-time order queue',
        'Order prioritization',
        'Status updates',
        'One-click dish-ready notifications'
      ]
    },
    {
      title: 'Admin ERP + Billing',
      description: 'Comprehensive management system for restaurant operations, billing and analytics',
      icon: <AdminPanelSettingsIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />,
      link: '/admin',
      features: [
        'Live order tracking by table',
        'Dynamic menu control',
        'GST invoice generation',
        'Staff access management'
      ]
    },
    {
      title: 'Advanced Analytics',
      description: 'Detailed analytics and reporting system for comprehensive hotel performance insights',
      icon: <AnalyticsIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />,
      link: '/analysis',
      features: [
        'Customer spending patterns',
        'Top-selling dish analysis',
        'Chef performance metrics',
        'Table utilization statistics'
      ]
    }
  ];

  const features = [
    {
      icon: <RoomServiceIcon sx={{ fontSize: 28 }} />,
      title: 'Luxury Dining Experience',
      description: 'Elevate your hotel dining with an elegant digital experience that matches your brand\'s sophistication'
    },
    {
      icon: <MenuBookIcon sx={{ fontSize: 28 }} />,
      title: 'Exquisite Menu Presentation',
      description: 'Showcase your culinary masterpieces with stunning visuals and detailed descriptions'
    },
    {
      icon: <DeliveryDiningIcon sx={{ fontSize: 28 }} />,
      title: 'Seamless Order Management',
      description: 'Streamline operations with instant order processing and kitchen communication'
    },
    {
      icon: <LocalDiningIcon sx={{ fontSize: 28 }} />,
      title: 'Smart Table Management',
      description: 'Optimize seating arrangements and enhance guest experience with intelligent table allocation'
    },
    {
      icon: <SpaIcon sx={{ fontSize: 28 }} />,
      title: 'Personalized Guest Experience',
      description: 'Remember guest preferences and dietary requirements for a truly personalized service'
    }
  ];

  return (
    <>
      {/* Table Setup Dialog */}
      <TableSetup
        open={showTableSetup}
        onClose={handleTableSetupComplete}
      />

      {/* Hero Section */}
      <Box
        sx={{
          py: { xs: 10, md: 16 },
          px: 2,
          mb: 10,
          background: heroBg,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 165, 0, 0.5) 50%, transparent 100%)'
          }
        }}
      >
        <Container maxWidth="xl">
          <Fade in={true} timeout={1000}>
            <Grid container spacing={6} alignItems="center">
              <Grid item xs={12} md={7}>
                <Box sx={{ position: 'relative' }}>
                  <Typography
                    variant="overline"
                    sx={{
                      color: 'primary.main',
                      letterSpacing: '3px',
                      fontSize: '1rem',
                      mb: 2,
                      display: 'block'
                    }}
                  >
                    RESTAURANT AUTOMATION SYSTEM
                  </Typography>
                  <Typography
                    variant="h1"
                    component="h1"
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                      color: 'white',
                      lineHeight: 1.1,
                      mb: 3,
                      position: 'relative',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: '-15px',
                        left: '0',
                        width: '80px',
                        height: '4px',
                        backgroundColor: 'primary.main'
                      }
                    }}
                  >
                    Elevate Your Dining Experience
                  </Typography>
                  <Typography
                    variant="h5"
                    color="text.secondary"
                    paragraph
                    sx={{ mb: 5, maxWidth: '600px', fontWeight: 300, lineHeight: 1.6 }}
                  >
                    Tabble brings sophisticated digital ordering and kitchen management to premium hotels and fine dining establishments
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      component={RouterLink}
                      to="/customer"
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        py: 1.5,
                        px: 4,
                        fontSize: '1rem',
                        fontWeight: 500,
                        letterSpacing: '0.5px'
                      }}
                    >
                      Experience Now
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="large"
                      component={RouterLink}
                      to="/admin"
                      sx={{
                        py: 1.5,
                        px: 4,
                        fontSize: '1rem',
                        fontWeight: 500,
                        letterSpacing: '0.5px',
                        borderWidth: '2px'
                      }}
                    >
                      Admin Portal
                    </Button>
                  </Stack>
                </Box>
              </Grid>
              <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
                <Box
                  sx={{
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      right: -20,
                      top: -20,
                      border: '2px solid rgba(255, 165, 0, 0.3)',
                      borderRadius: '6px',
                      zIndex: 0
                    }
                  }}
                >
                  <Paper
                    elevation={6}
                    sx={{
                      borderRadius: '6px',
                      overflow: 'hidden',
                      width: '100%',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80"
                      alt="Luxury dining experience"
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                  </Paper>
                </Box>
              </Grid>
            </Grid>
          </Fade>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="xl">
        <Box sx={{ mb: 12 }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h2"
              component="h2"
              align="center"
              gutterBottom
              fontWeight="bold"
              sx={{
                position: 'relative',
                display: 'inline-block',
                color: 'white',
                mb: 4
              }}
            >
              Luxury Hotel <Box component="span" sx={{ color: 'primary.main' }}>Features</Box>
            </Typography>
            <Box
              sx={{
                width: '60px',
                height: '3px',
                backgroundColor: 'primary.main',
                mx: 'auto',
                mb: 4
              }}
            />
            <Typography
              variant="subtitle1"
              align="center"
              color="text.secondary"
              paragraph
              sx={{ maxWidth: '800px', mx: 'auto', mb: 2, fontSize: '1.1rem', lineHeight: 1.6 }}
            >
              Our platform offers sophisticated dining management capabilities designed specifically for luxury hotels and fine dining establishments
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Fade in={true} timeout={(index + 1) * 400}>
                  <LuxuryCard>
                    <Box sx={{ mb: 3 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h5" component="h3" gutterBottom fontWeight="600" sx={{ color: 'white', mb: 2 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 3 }}>
                      {feature.description}
                    </Typography>
                    <Button
                      variant="text"
                      color="primary"
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        p: 0,
                        '&:hover': {
                          backgroundColor: 'transparent',
                          transform: 'translateX(5px)'
                        },
                        transition: 'transform 0.3s ease'
                      }}
                    >
                      Learn more
                    </Button>
                  </LuxuryCard>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>

      {/* Technology Showcase Section */}
      <Box sx={{
        py: 10,
        background: techBg,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        borderTop: '1px solid rgba(255, 165, 0, 0.1)',
        borderBottom: '1px solid rgba(255, 165, 0, 0.1)',
        mb: 12,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backdropFilter: 'blur(5px)',
          zIndex: 0
        }
      }}>
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h2"
              component="h2"
              align="center"
              gutterBottom
              fontWeight="bold"
              sx={{ color: 'white', mb: 2 }}
            >
              Advanced <Box component="span" sx={{ color: 'primary.main' }}>Technology</Box>
            </Typography>
            <Typography
              variant="subtitle1"
              align="center"
              color="text.secondary"
              paragraph
              sx={{ maxWidth: '700px', mx: 'auto', mb: 2 }}
            >
              Powered by cutting-edge technology to deliver a seamless and sophisticated hotel management experience
            </Typography>
            <Box
              sx={{
                width: '60px',
                height: '3px',
                backgroundColor: 'primary.main',
                mx: 'auto',
                mb: 6
              }}
            />
          </Box>

          <Grid container spacing={3}>
            {technologies.map((tech, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Fade in={true} timeout={(index + 1) * 300}>
                  <TechCard>
                    {tech.icon}
                    <Typography variant="h5" component="h3" gutterBottom fontWeight="bold" sx={{ color: 'white', mb: 1 }}>
                      {tech.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      {tech.description}
                    </Typography>
                  </TechCard>
                </Fade>
              </Grid>
            ))}
          </Grid>

          {/* Statistics Row */}
          <Box sx={{ mt: 8 }}>
            <Grid container spacing={3}>
              {statistics.map((stat, index) => (
                <Grid item xs={6} md={3} key={index}>
                  <Fade in={true} timeout={(index + 1) * 400}>
                    <StatCard>
                      {stat.icon}
                      <Typography variant="h3" component="p" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 1 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'white' }}>
                        {stat.label}
                      </Typography>
                    </StatCard>
                  </Fade>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
      </Box>

      {/* Portal Cards Section */}
      <Box sx={{
        py: 10,
        background: 'linear-gradient(to bottom, #000000, #121212)',
        borderTop: '1px solid rgba(255, 165, 0, 0.1)',
        borderBottom: '1px solid rgba(255, 165, 0, 0.1)',
        mb: 12
      }}>
        <Container maxWidth="xl">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h2"
              component="h2"
              align="center"
              gutterBottom
              fontWeight="bold"
              sx={{ color: 'white', mb: 2 }}
            >
              Integrated <Box component="span" sx={{ color: 'primary.main' }}>Portals</Box>
            </Typography>
            <Typography
              variant="subtitle1"
              align="center"
              color="text.secondary"
              paragraph
              sx={{ maxWidth: '700px', mx: 'auto', mb: 2 }}
            >
              Seamlessly connected interfaces for every aspect of your hotel dining experience
            </Typography>
            <Box
              sx={{
                width: '60px',
                height: '3px',
                backgroundColor: 'primary.main',
                mx: 'auto',
                mb: 6
              }}
            />
          </Box>

          <Grid container spacing={5}>
            {portalCards.map((card, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Fade in={true} timeout={(index + 1) * 500}>
                  <Box>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      {React.cloneElement(card.icon, { sx: { fontSize: 70, color: 'primary.main', mb: 3 } })}
                      <Typography variant="h4" component="h3" gutterBottom fontWeight="bold" sx={{ color: 'white' }}>
                        {card.title}
                      </Typography>
                    </Box>
                    <Typography variant="body1" paragraph sx={{ color: 'rgba(255,255,255,0.8)', textAlign: 'center', mb: 4 }}>
                      {card.description}
                    </Typography>
                    <Box sx={{ mb: 4 }}>
                      {card.features.map((feature, i) => (
                        <FeatureItem key={i}>
                          <ArrowForwardIcon fontSize="small" />
                          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                            {feature}
                          </Typography>
                        </FeatureItem>
                      ))}
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        component={RouterLink}
                        to={card.link}
                        endIcon={<ArrowForwardIcon />}
                        sx={{
                          borderWidth: '2px',
                          px: 3,
                          py: 1,
                          borderRadius: '4px',
                          '&:hover': {
                            borderWidth: '2px',
                            backgroundColor: 'rgba(255, 165, 0, 0.1)'
                          }
                        }}
                      >
                        Enter Portal
                      </Button>
                    </Box>
                  </Box>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Portals/Cards Section */}


      {/* App Showcase Section */}
      <Container maxWidth="xl" sx={{ mb: 12 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h2"
            component="h2"
            align="center"
            gutterBottom
            fontWeight="bold"
            sx={{ color: 'white', mb: 2 }}
          >
            Elegant <Box component="span" sx={{ color: 'primary.main' }}>Interface</Box>
          </Typography>
          <Typography
            variant="subtitle1"
            align="center"
            color="text.secondary"
            paragraph
            sx={{ maxWidth: '700px', mx: 'auto', mb: 2 }}
          >
            Experience our sophisticated and intuitive interface designed specifically for luxury hotels
          </Typography>
          <Box
            sx={{
              width: '60px',
              height: '3px',
              backgroundColor: 'primary.main',
              mx: 'auto',
              mb: 6
            }}
          />
        </Box>

        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ color: 'white', mb: 3 }}>
              Seamless Experience Across All Devices
            </Typography>
            <Typography variant="body1" paragraph sx={{ color: 'rgba(255,255,255,0.8)', mb: 4 }}>
              Our responsive design ensures a perfect experience whether your staff and guests are using smartphones, tablets, or desktop computers.
            </Typography>

            <Box sx={{ mb: 4 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Chip
                      icon={<QrCodeIcon />}
                      label="QR Code Integration"
                      sx={{
                        backgroundColor: 'rgba(255,165,0,0.1)',
                        color: '#FFA500',
                        border: '1px solid rgba(255,165,0,0.3)'
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Chip
                      icon={<TouchAppIcon />}
                      label="Touch Optimized"
                      sx={{
                        backgroundColor: 'rgba(255,165,0,0.1)',
                        color: '#FFA500',
                        border: '1px solid rgba(255,165,0,0.3)'
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Chip
                      icon={<DevicesIcon />}
                      label="Cross-Platform"
                      sx={{
                        backgroundColor: 'rgba(255,165,0,0.1)',
                        color: '#FFA500',
                        border: '1px solid rgba(255,165,0,0.3)'
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Chip
                      icon={<SpeedIcon />}
                      label="Fast Performance"
                      sx={{
                        backgroundColor: 'rgba(255,165,0,0.1)',
                        color: '#FFA500',
                        border: '1px solid rgba(255,165,0,0.3)'
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Button
              variant="contained"
              color="primary"
              size="large"
              component={RouterLink}
              to="/customer"
              endIcon={<ArrowForwardIcon />}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1rem',
                fontWeight: 500
              }}
            >
              Try Demo
            </Button>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'relative' }}>
              <Box
                sx={{
                  position: 'absolute',
                  width: '80%',
                  height: '80%',
                  border: '2px solid rgba(255,165,0,0.3)',
                  borderRadius: '20px',
                  top: -20,
                  right: -20,
                  zIndex: 0
                }}
              />
              <Box
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,165,0,0.2)',
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80"
                  alt="Tabble app interface"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -30,
                  left: -30,
                  width: '180px',
                  height: '350px',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,165,0,0.2)',
                  zIndex: 2
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1601972599720-36938d4ecd31?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=387&q=80"
                  alt="Tabble mobile app"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Testimonial/Social Proof Section */}
      <Container maxWidth="xl" sx={{ mb: 12 }}>
        <Paper elevation={3} sx={{
          borderRadius: '6px',
          p: 0,
          backgroundColor: '#121212',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 165, 0, 0.1)'
        }}>
          <Grid container>
            <Grid item xs={12} md={5} sx={{
              position: 'relative',
              display: { xs: 'none', md: 'block' },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '1px',
                height: '100%',
                background: 'rgba(255, 165, 0, 0.2)'
              }
            }}>
              <Box
                sx={{
                  height: '100%',
                  backgroundImage: 'url("https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.3))'
                  }
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1,
                    textAlign: 'center',
                    width: '80%'
                  }}
                >
                  <Typography variant="h4" component="p" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                    Trusted by Luxury Hotels Worldwide
                  </Typography>
                  <Box
                    sx={{
                      width: '40px',
                      height: '3px',
                      backgroundColor: 'primary.main',
                      mx: 'auto',
                      mb: 2
                    }}
                  />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={7}>
              <Box sx={{ p: { xs: 4, md: 6 } }}>
                <Box
                  sx={{
                    position: 'absolute',
                    right: 30,
                    top: 30,
                    fontSize: '120px',
                    opacity: 0.1,
                    color: 'primary.main',
                    lineHeight: 0.8
                  }}
                >
                  "
                </Box>

                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', mb: 3 }}>
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} sx={{ color: 'primary.main', fontSize: 24 }} />
                    ))}
                  </Box>
                  <Typography variant="h5" gutterBottom sx={{ fontStyle: 'italic', mb: 4, color: 'white', lineHeight: 1.6 }}>
                    "Tabble has completely transformed our hotel\'s dining experience. The elegant interface impresses our guests, while the powerful backend ensures flawless service. It perfectly complements our commitment to luxury and excellence."
                  </Typography>
                  <Divider sx={{ my: 4, backgroundColor: 'rgba(255, 165, 0, 0.2)' }} />
                  <Grid container spacing={2} alignItems="center">
                    <Grid item>
                      <Box
                        component="img"
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100&q=80"
                        alt="Hotel Director"
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: '50%',
                          border: '2px solid',
                          borderColor: 'primary.main'
                        }}
                      />
                    </Grid>
                    <Grid item xs>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                        Jonathan Reynolds
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'primary.main' }}>
                        Food & Beverage Director, The Grand Luxury Hotel
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>

      {/* Integration Partners Section */}

      {/* Call to Action */}
      <Container maxWidth="xl" sx={{ mb: 10 }}>
        <Box
          sx={{
            p: { xs: 6, md: 8 },
            borderRadius: '6px',
            background: 'linear-gradient(to right, rgba(0,0,0,0.9), rgba(0,0,0,0.7)), url("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            textAlign: 'center',
            color: 'white',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 165, 0, 0.2)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '4px',
              background: 'linear-gradient(to right, transparent, #FFA500, transparent)'
            }
          }}
        >
          <Typography variant="h2" component="h2" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
            Elevate Your <Box component="span" sx={{ color: 'primary.main' }}>Hotel&apos;s</Box> Dining Experience
          </Typography>
          <Typography variant="h6" paragraph sx={{ maxWidth: '800px', mx: 'auto', mb: 5, opacity: 0.9, fontWeight: 300 }}>
            Join the world\'s finest hotels in providing an exceptional digital dining experience that matches your brand\'s commitment to luxury and excellence
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              size="large"
              component={RouterLink}
              to="/customer"
              endIcon={<ArrowForwardIcon />}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1rem',
                fontWeight: 500
              }}
            >
              Experience Demo
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              component={RouterLink}
              to="/admin"
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1rem',
                fontWeight: 500,
                borderWidth: '2px',
                '&:hover': {
                  borderWidth: '2px',
                  backgroundColor: 'rgba(255, 165, 0, 0.1)'
                }
              }}
            >
              Admin Portal
            </Button>
          </Stack>
        </Box>
      </Container>
    </>
  );
};

export default Home;