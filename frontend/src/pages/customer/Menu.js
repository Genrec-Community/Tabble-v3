import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import moment from 'moment-timezone';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Snackbar,
  Alert,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  IconButton,
  Divider,
  Badge,
  List,
  ListItem,
  ListItemText,
  AppBar,
  Toolbar,
  CircularProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PaymentIcon from '@mui/icons-material/Payment';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FeedbackDialog from '../../components/FeedbackDialog';
import { customerService } from '../../services/api';
import OrderHistoryDialog from './components/OrderHistoryDialog';
import CartDialog from './components/CartDialog';

// Import components
import HeroBanner from './components/HeroBanner';
import SpecialOffers from './components/SpecialOffers';
import TodaySpecials from './components/TodaySpecials';
import MenuCategories from './components/MenuCategories';

import MenuItemsGrid from './components/MenuItemsGrid';

const CustomerMenu = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const tableNumber = queryParams.get('table_number');
  const uniqueId = queryParams.get('unique_id');
  const userId = queryParams.get('user_id');

  // Redirect if table number, unique ID, or user ID is missing
  useEffect(() => {
    if (!tableNumber || !uniqueId || !userId) {
      navigate('/customer');
    }
  }, [tableNumber, uniqueId, userId, navigate]);

  // State
  const [categories, setCategories] = useState(['All']);
  const [currentCategory, setCurrentCategory] = useState('All');
  const [dishes, setDishes] = useState([]);
  const [filteredDishes, setFilteredDishes] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [unpaidOrders, setUnpaidOrders] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [remarks, setRemarks] = useState('');

  const [cartDialogOpen, setCartDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [orderHistoryOpen, setOrderHistoryOpen] = useState(false);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [lastPaidOrderId, setLastPaidOrderId] = useState(null);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState({
    discount_percentage: 0,
    message: ''
  });
  const [selectionOfferDiscount, setSelectionOfferDiscount] = useState({
    discount_amount: 0,
    message: ''
  });
  const [databaseName, setDatabaseName] = useState('');
  const [hasEverPlacedOrder, setHasEverPlacedOrder] = useState(false);
  const [hasPlacedOrderInSession, setHasPlacedOrderInSession] = useState(false);
  const [isPollingActive, setIsPollingActive] = useState(false);

  // Category color mapping
  const categoryColors = {
    'Appetizer': theme.palette.primary.main,
    'Main Course': theme.palette.secondary.main,
    'Dessert': theme.palette.error.main,
    'Beverage': theme.palette.success.main,
  };

  // State for offers and specials
  const [offers, setOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [specials, setSpecials] = useState([]);
  const [loadingSpecials, setLoadingSpecials] = useState(true);

  // Fetch current order and loyalty discount
  const fetchCurrentOrder = async () => {
    try {
      if (userId) {
        // Get all orders
        const orders = await customerService.getPersonOrders(userId);

        // Check if user has ever placed any order for this table
        const tableOrders = orders.filter(order =>
          order.table_number === parseInt(tableNumber)
        );

        if (tableOrders.length > 0) {
          setHasEverPlacedOrder(true);
        }

        // Note: hasEverPlacedOrder is used for other logic, but back button visibility
        // is controlled by hasPlacedOrderInSession which starts as false each session

        // Find all unpaid orders for the current table (exclude cancelled orders)
        const tableUnpaidOrders = orders.filter(order =>
          order.status !== 'paid' &&
          order.status !== 'cancelled' &&
          order.table_number === parseInt(tableNumber)
        );

        // Set the most recent unpaid order as the current order (for backward compatibility)
        const activeOrder = tableUnpaidOrders.length > 0 ? tableUnpaidOrders[0] : null;

        if (activeOrder) {
          setCurrentOrder(activeOrder);
        }

        // Set all unpaid orders
        setUnpaidOrders(tableUnpaidOrders);

        // Get loyalty discount from backend API
        try {
          const person = await customerService.getPerson(userId);

          if (person && person.visit_count > 0) {
            try {
              const discountData = await customerService.getLoyaltyDiscount(person.visit_count);
              setLoyaltyDiscount(discountData);
            } catch (apiError) {
              console.error('Error fetching loyalty discount from API:', apiError);
              setLoyaltyDiscount({
                discount_percentage: 0,
                message: 'No loyalty discount available'
              });
            }
          } else {
            setLoyaltyDiscount({
              discount_percentage: 0,
              message: 'No loyalty discount available'
            });
          }
        } catch (error) {
          console.error('Error fetching person data:', error);
          setLoyaltyDiscount({
            discount_percentage: 0,
            message: 'No loyalty discount available'
          });
        }
      }
    } catch (error) {
      // Error handling for current order
    }
  };

  // Load database name
  useEffect(() => {
    const fetchDatabaseName = async () => {
      try {
        // Try to get from localStorage first
        const storedDatabaseName = localStorage.getItem('selectedDatabase');
        if (storedDatabaseName) {
          setDatabaseName(storedDatabaseName);
        } else {
          // Fallback to API call
          const dbData = await customerService.getCurrentDatabase();
          setDatabaseName(dbData.database_name || '');
        }
      } catch (error) {
        console.error('Error fetching database name:', error);
        // Use fallback name if error occurs
        setDatabaseName('');
      }
    };

    fetchDatabaseName();
  }, []);

  // Load dishes, categories, and offers
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get categories
        const categoriesData = await customerService.getCategories();
        setCategories(['All', ...categoriesData]);
        setLoadingCategories(false);

        // Get menu items
        const dishesData = await customerService.getMenu();

        // Get offer items
        const offersData = await customerService.getOffers();
        setOffers(offersData);
        setLoadingOffers(false);

        // Get special items
        const specialsData = await customerService.getSpecials();
        setSpecials(specialsData);
        setLoadingSpecials(false);

        // Add mock ratings and random prep times for visual enhancement
        const enhancedDishes = dishesData.map(dish => ({
          ...dish,
          rating: (Math.random() * 2 + 3).toFixed(1), // Random rating between 3 and 5
          prepTime: Math.floor(Math.random() * 15) + 5, // Random prep time between 5-20 mins
          isPopular: Math.random() > 0.7, // 30% chance of being popular
          isNew: Math.random() > 0.8, // 20% chance of being new
          isFeatured: dish.is_offer === 1 ? true : Math.random() > 0.85, // Offers are featured, plus 15% chance for others
        }));

        setDishes(enhancedDishes);
        setFilteredDishes(enhancedDishes);
        setLoading(false);
      } catch (error) {
        
        setSnackbar({
          open: true,
          message: 'Error loading menu data',
          severity: 'error'
        });
        setLoading(false);
        setLoadingCategories(false);
        setLoadingOffers(false);
        setLoadingSpecials(false);
      }
    };

    fetchData();
  }, []);

  // Fetch current order and user orders when userId changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (userId) {
      fetchCurrentOrder();
      fetchUserOrders(); // Load user orders to check for completed orders
    }
  }, [userId]);

  // Set up real-time polling for order status updates
  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    fetchCurrentOrder();
    fetchUserOrders();

    // Set up polling every 10 seconds for real-time updates
    const orderPollingInterval = setInterval(async () => {
      setIsPollingActive(true);
      try {
        await fetchCurrentOrder();
        await fetchUserOrders();
      } catch (error) {
        console.error('Error during polling:', error);
      } finally {
        setIsPollingActive(false);
      }
    }, 10000); // 10 seconds

    return () => {
      clearInterval(orderPollingInterval);
    };
  }, [userId]);

  // Mark table as occupied when component loads
  useEffect(() => {
    const markTableAsOccupied = async () => {
      if (tableNumber) {
        try {
          await customerService.setTableOccupiedByNumber(parseInt(tableNumber));
          
        } catch (error) {
          
        }
      }
    };

    markTableAsOccupied();
  }, [tableNumber]);

  // Filter dishes by category
  const handleCategoryChange = (_, newValue) => {
    setCurrentCategory(newValue);
    if (newValue === 'All') {
      setFilteredDishes(dishes);
    } else {
      setFilteredDishes(dishes.filter(dish => dish.category === newValue));
    }
  };

  // Open add to cart dialog
  const handleOpenDialog = (dish) => {
    setSelectedDish(dish);
    setQuantity(1);
    setRemarks('');
    setOpenDialog(true);
  };

  // Close add to cart dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Add item to cart
  const handleAddToCart = () => {
    // Calculate the actual price (with discount if applicable)
    const actualPrice = selectedDish.is_offer === 1 ?
      parseFloat(calculateDiscountedPrice(selectedDish.price, selectedDish.discount)) :
      selectedDish.price;

    const newItem = {
      dish_id: selectedDish.id,
      dish_name: selectedDish.name,
      price: actualPrice,
      original_price: selectedDish.price,
      discount: selectedDish.discount,
      is_offer: selectedDish.is_offer,
      quantity: quantity,
      remarks: remarks,
      image: selectedDish.image_path,
      added_at: new Date().toISOString(), // Add timestamp to track order
      position: cart.length + 1 // Add position to maintain order
    };

    setCart([...cart, newItem]);
    setOpenDialog(false);

    setSnackbar({
      open: true,
      message: `${selectedDish.name} added to cart`,
      severity: 'success'
    });
  };

  // Remove item from cart
  const handleRemoveFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);

    // Update positions after removal
    const updatedCart = newCart.map((item, idx) => ({
      ...item,
      position: idx + 1
    }));

    setCart(updatedCart);
  };

  // Reorder items in cart
  const handleReorderCart = (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === cart.length - 1)
    ) {
      return; // Can't move first item up or last item down
    }

    const newCart = [...cart];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap items
    [newCart[index], newCart[newIndex]] = [newCart[newIndex], newCart[index]];

    // Update positions
    const updatedCart = newCart.map((item, idx) => ({
      ...item,
      position: idx + 1
    }));

    setCart(updatedCart);
  };

  // Calculate total amount
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  // Calculate discounted price
  const calculateDiscountedPrice = (price, discount) => {
    return (price - (price * discount / 100)).toFixed(2);
  };

  // Place order
  const handlePlaceOrder = async () => {
    try {
      // Get username and password from URL parameters if available
      const urlParams = new URLSearchParams(window.location.search);
      const username = urlParams.get('username');
      const password = urlParams.get('password');

      // Sort cart items by position to maintain the order they were added
      const sortedCart = [...cart].sort((a, b) => a.position - b.position);

      const orderData = {
        table_number: parseInt(tableNumber),
        unique_id: uniqueId,
        // Include username and password if available
        ...(username && { username }),
        ...(password && { password }),
        items: sortedCart.map(item => ({
          dish_id: item.dish_id,
          quantity: item.quantity,
          remarks: item.remarks
        }))
      };

      // Pass the person_id as a query parameter
      const response = await customerService.createOrder(orderData, userId);
      setCurrentOrder(response);

      // Mark that user has placed an order (hide back to home button)
      setHasEverPlacedOrder(true);
      setHasPlacedOrderInSession(true);

      // Show order confirmation
      setSnackbar({
        open: true,
        message: `Order placed successfully! Order #${response.id}`,
        severity: 'success'
      });

      setCart([]);

      // Immediate refresh for real-time updates
      await fetchCurrentOrder();
      await fetchUserOrders();
    } catch (error) {
      
      setSnackbar({
        open: true,
        message: 'Error placing order',
        severity: 'error'
      });
    }
  };

  // Request payment
  const handleRequestPayment = async () => {
    

    // Refresh orders before showing payment dialog
    try {
      if (userId) {
        // Refresh orders
        const orders = await customerService.getPersonOrders(userId);
        

        // Find all completed unpaid orders for the current table (exclude cancelled orders)
        const tableUnpaidOrders = orders.filter(order =>
          order.status === 'completed' &&
          order.table_number === parseInt(tableNumber)
        );
        

        // Update unpaid orders state
        setUnpaidOrders(tableUnpaidOrders);

        // If no completed unpaid orders, show a message and return
        if (tableUnpaidOrders.length === 0) {
          setSnackbar({
            open: true,
            message: 'No completed orders found for payment. Orders must be completed by the chef before payment.',
            severity: 'warning'
          });
          return;
        }

        // Refresh loyalty discount from backend API
        try {
          const person = await customerService.getPerson(userId);

          if (person && person.visit_count > 0) {
            try {
              // Get loyalty discount from backend API (uses session-aware database)
              const discountData = await customerService.getLoyaltyDiscount(person.visit_count);
              setLoyaltyDiscount(discountData);
            } catch (apiError) {
              console.error('Error fetching loyalty discount from API:', apiError);
              // Fallback to no discount if API fails
              setLoyaltyDiscount({
                discount_percentage: 0,
                message: 'No loyalty discount available',
                visit_count: person.visit_count
              });
            }
          } else {
            // No person or no visits
            setLoyaltyDiscount({
              discount_percentage: 0,
              message: 'No loyalty discount available'
            });
          }
        } catch (error) {
          console.error('Error fetching person data:', error);
          setLoyaltyDiscount({
            discount_percentage: 0,
            message: 'No loyalty discount available'
          });
        }

        // Get selection offer discount based on total of all unpaid orders
        try {
          // Calculate total across all unpaid orders
          const totalOrderAmount = tableUnpaidOrders.reduce((total, order) => {
            return total + (order.items ? order.items.reduce((sum, item) => sum + (item.dish?.price || 0) * item.quantity, 0) : 0);
          }, 0);

          

          // Get selection offer discount from backend API
          try {
            const offerData = await customerService.getSelectionOfferDiscount(totalOrderAmount);
            
            setSelectionOfferDiscount(offerData);
          } catch (apiError) {
            

            // Fallback to local calculation if API fails
            let offerData = { discount_amount: 0, message: 'No special offer available' };

            // If total amount is over ₹100, apply a ₹15 discount
            if (totalOrderAmount >= 100) {
              offerData = {
                discount_amount: 15,
                message: 'Special Offer: ₹15 off on orders above ₹100'
              };
            }
            // If total amount is over ₹50, apply a ₹5 discount
            else if (totalOrderAmount >= 50) {
              offerData = {
                discount_amount: 5,
                message: 'Special Offer: ₹5 off on orders above ₹50'
              };
            }

            
            setSelectionOfferDiscount(offerData);
          }
        } catch (error) {
          
        }

        // Open payment dialog
        setPaymentDialogOpen(true);
      }
    } catch (error) {
      
      setSnackbar({
        open: true,
        message: 'Error loading payment details. Please try again.',
        severity: 'error'
      });
    }
  };

  // Close payment dialog
  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
  };

  // Complete payment
  const handleCompletePayment = async () => {
    try {
      // Store the first order ID for feedback before marking as paid
      const firstOrderId = unpaidOrders.length > 0 ? unpaidOrders[0].id : null;

      // Mark all unpaid orders as paid sequentially to avoid transaction conflicts
      let successCount = 0;
      let errorCount = 0;

      for (const order of unpaidOrders) {
        try {
          await customerService.requestPayment(order.id);
          successCount++;
        } catch (error) {
          console.error(`Error processing payment for order ${order.id}:`, error);
          errorCount++;
        }
      }

      // Store the last paid order ID for feedback
      setLastPaidOrderId(firstOrderId);

      setPaymentDialogOpen(false);

      // Show appropriate message based on results
      if (errorCount === 0) {
        setSnackbar({
          open: true,
          message: 'Payment completed successfully! The bill will arrive at your table soon.',
          severity: 'success'
        });
      } else if (successCount > 0) {
        setSnackbar({
          open: true,
          message: `${successCount} orders paid successfully. ${errorCount} orders failed. Please try again for failed orders.`,
          severity: 'warning'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Error processing payment. Please try again.',
          severity: 'error'
        });
        return; // Don't proceed with other actions if all payments failed
      }

      // Refresh order history after payment
      if (userId) {
        try {
          const orders = await customerService.getPersonOrders(userId);
          setUserOrders(orders);

          // Clear unpaid orders
          setUnpaidOrders([]);
          setCurrentOrder(null);
        } catch (error) {
          console.error('Error refreshing orders:', error);
        }
      }

      // Show feedback dialog after successful payment (only if at least one payment succeeded)
      if (successCount > 0) {
        setTimeout(() => {
          setFeedbackDialogOpen(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Error in handleCompletePayment:', error);
      setSnackbar({
        open: true,
        message: 'Error processing payment. Please try again.',
        severity: 'error'
      });
    }
  };

  // Increment quantity
  const incrementQuantity = () => {
    setQuantity(prevQuantity => prevQuantity + 1);
  };

  // Decrement quantity
  const decrementQuantity = () => {
    setQuantity(prevQuantity => prevQuantity > 1 ? prevQuantity - 1 : 1);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Open cart dialog
  const handleOpenCartDialog = () => {
    setCartDialogOpen(true);
  };

  // Close cart dialog
  const handleCloseCartDialog = () => {
    setCartDialogOpen(false);
  };

  // Fetch user orders
  const fetchUserOrders = async () => {
    if (!userId) {
      setSnackbar({
        open: true,
        message: 'User ID not found. Please log in again.',
        severity: 'error'
      });
      return;
    }

    setLoadingOrders(true);

    try {
      const orders = await customerService.getPersonOrders(userId);
      setUserOrders(orders);
    } catch (error) {
      
      setSnackbar({
        open: true,
        message: 'Error loading order history',
        severity: 'error'
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  // Open order history dialog
  const handleOpenOrderHistory = async () => {
    setOrderHistoryOpen(true);
    await fetchUserOrders();
  };

  // Close order history dialog
  const handleCloseOrderHistory = () => {
    setOrderHistoryOpen(false);
  };

  // Format date in Indian Standard Time
  const formatDate = (dateString) => {
    return moment(dateString).tz('Asia/Kolkata').format('MMM D, YYYY h:mm A');
  };

  // Get order status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'info';
      case 'completed':
        return 'success';
      case 'payment_requested':
        return 'info';
      case 'paid':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get order status label
  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Waiting';
      case 'accepted':
        return 'Preparing';
      case 'completed':
        return 'Ready';
      case 'payment_requested':
        return 'Payment Requested';
      case 'paid':
        return 'Paid';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  // Handle back to home navigation
  const handleBackToHome = () => {
    // Navigate to home page
    window.location.href = '/';
  };

  return (
    <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2 }, position: 'relative' }}>
      {/* Back to Home Button - Only show if user hasn't placed any order in current session */}
      {!hasPlacedOrderInSession && (
        <Box
          sx={{
            position: 'fixed',
            top: 20,
            left: 20,
            zIndex: 1000,
          }}
        >
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToHome}
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              border: '2px solid rgba(255, 165, 0, 0.5)',
              borderRadius: '25px',
              px: 3,
              py: 1,
              fontWeight: 'bold',
              fontSize: '0.9rem',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 165, 0, 0.1)',
                borderColor: '#FFA500',
                color: 'white',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 40px rgba(255, 165, 0, 0.2)',
              },
              '&:active': {
                transform: 'translateY(0px)',
              }
            }}
          >
            <HomeIcon sx={{ mr: 0.5, fontSize: '1.1rem', color: 'white' }} />
            Home
          </Button>
        </Box>
      )}

      {/* Hero Banner */}
      <HeroBanner tableNumber={tableNumber} uniqueId={uniqueId} databaseName={databaseName} />

      {/* Special Offers Section */}
      <SpecialOffers
        offers={offers}
        loading={loadingOffers}
        handleOpenDialog={handleOpenDialog}
        calculateDiscountedPrice={calculateDiscountedPrice}
      />

      {/* Today's Special Section */}
      <TodaySpecials
        specials={specials}
        loading={loadingSpecials}
        handleOpenDialog={handleOpenDialog}
      />

      <Grid container spacing={4}>
        {/* Menu */}
        <Grid item xs={12}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              mb: 6,
              borderRadius: '6px',
              backgroundColor: '#121212',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 165, 0, 0.2)',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '4px',
                backgroundColor: '#FFA500',
              }
            }}
          >
            <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: '#FFFFFF',
                mb: 3,
                '&:after': {
                  content: '""',
                  display: 'block',
                  height: '2px',
                  flexGrow: 1,
                  backgroundColor: 'rgba(255, 165, 0, 0.3)',
                  ml: 2
                }
              }}
            >
              Our <Box component="span" sx={{ color: '#FFA500', ml: 1 }}>Menu</Box>
            </Typography>

            {/* Category Tabs */}
            <MenuCategories
              categories={categories}
              currentCategory={currentCategory}
              handleCategoryChange={handleCategoryChange}
              loading={loadingCategories}
            />

            {/* Regular Menu Items */}
            <MenuItemsGrid
              filteredDishes={filteredDishes}
              currentCategory={currentCategory}
              loading={loading}
              handleOpenDialog={handleOpenDialog}
              categoryColors={categoryColors}
              theme={theme}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Add to Cart Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '6px',
            backgroundColor: '#121212',
            color: 'white',
            border: '1px solid rgba(255, 165, 0, 0.3)',
            boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '4px',
              backgroundColor: '#FFA500',
            }
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, borderBottom: '1px solid rgba(255, 165, 0, 0.2)' }}>
          <Typography variant="h6" fontWeight="bold" color="white">{selectedDish?.name}</Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255, 165, 0, 0.2)' }}>
          {selectedDish && (
            <>
              <Box
                sx={{
                  height: 200,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  mb: 3,
                  position: 'relative'
                }}
              >
                <img
                  src={selectedDish.image_path ? `${process.env.REACT_APP_API_BASE_URL}${selectedDish.image_path}` : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'}
                  alt={selectedDish.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 50%)',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    p: 2,
                    color: 'white'
                  }}
                >
                  {selectedDish.is_offer === 1 ? (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                        ₹{selectedDish.price.toFixed(2)}
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="error.main">
                        ₹{calculateDiscountedPrice(selectedDish.price, selectedDish.discount)}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="h6" fontWeight="bold">₹{selectedDish.price.toFixed(2)}</Typography>
                  )}
                </Box>
              </Box>

              <Typography variant="subtitle1" gutterBottom fontWeight="bold" color="white">
                Description
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }} paragraph>
                {selectedDish.description || 'A delicious dish prepared with quality ingredients.'}
              </Typography>

              <Divider sx={{ my: 2, backgroundColor: 'rgba(255, 165, 0, 0.2)' }} />

              <Typography variant="subtitle1" gutterBottom fontWeight="bold" color="white">
                Quantity
              </Typography>
              <Box
                display="flex"
                alignItems="center"
                sx={{
                  border: '1px solid',
                  borderColor: 'rgba(255, 165, 0, 0.3)',
                  borderRadius: '4px',
                  width: 'fit-content',
                  px: 1,
                  backgroundColor: 'rgba(0, 0, 0, 0.3)'
                }}
              >
                <IconButton
                  size="small"
                  onClick={decrementQuantity}
                  sx={{
                    color: quantity === 1 ? 'rgba(255,255,255,0.3)' : '#FFA500',
                    '&:hover': {
                      backgroundColor: quantity === 1 ? 'transparent' : 'rgba(255,165,0,0.1)'
                    }
                  }}
                  disabled={quantity === 1}
                >
                  <RemoveIcon />
                </IconButton>
                <TextField
                  variant="standard"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val > 0) {
                      setQuantity(val);
                    }
                  }}
                  InputProps={{
                    disableUnderline: true,
                    inputProps: {
                      style: { textAlign: 'center', width: '30px', fontWeight: 'bold', color: 'white' }
                    }
                  }}
                />
                <IconButton size="small" onClick={incrementQuantity} sx={{ color: '#FFA500' }}>
                  <AddIcon />
                </IconButton>
              </Box>

              <Box mt={3}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold" color="white">
                  Special Instructions (Optional)
                </Typography>
                <TextField
                  multiline
                  rows={3}
                  fullWidth
                  variant="outlined"
                  placeholder="E.g., No onions, extra spicy, etc."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '4px',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      borderColor: 'rgba(255, 165, 0, 0.3)',
                      color: 'white',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 165, 0, 0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#FFA500',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 165, 0, 0.3)',
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: 'white',
                    },
                    '& .MuiFormLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                    '& .MuiFormLabel-root.Mui-focused': {
                      color: '#FFA500',
                    },
                  }}
                  InputProps={{
                    style: { color: 'white' }
                  }}
                />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 3, backgroundColor: '#121212', borderTop: '1px solid rgba(255, 165, 0, 0.2)' }}>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{
              borderColor: 'rgba(255, 165, 0, 0.5)',
              color: '#FFA500',
              borderRadius: '4px',
              '&:hover': {
                borderColor: '#FFA500',
                backgroundColor: 'rgba(255, 165, 0, 0.08)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddToCart}
            sx={{
              px: 3,
              borderRadius: '4px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              backgroundColor: '#FFA500',
              '&:hover': {
                backgroundColor: '#E69500',
              }
            }}
          >
            Add to Cart {quantity > 1 && `(${quantity})`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Confirmation Dialog */}

      {/* Snackbar for notifications */}
      {/* Cart Dialog with CartDialog component */}
      <CartDialog
        open={cartDialogOpen}
        onClose={handleCloseCartDialog}
        cart={cart}
        handleRemoveFromCart={handleRemoveFromCart}
        calculateTotal={calculateTotal}
        handlePlaceOrder={handlePlaceOrder}
        currentOrder={currentOrder}
        handleReorderCart={handleReorderCart}
        specials={specials}
        handleOpenDialog={handleOpenDialog}
        calculateDiscountedPrice={calculateDiscountedPrice}
      />

      {/* Order History Dialog */}
      <OrderHistoryDialog
        open={orderHistoryOpen}
        onClose={handleCloseOrderHistory}
        userOrders={userOrders}
        loadingOrders={loadingOrders}
        formatDate={formatDate}
        getStatusLabel={getStatusLabel}
        getStatusColor={getStatusColor}
        refreshOrders={fetchUserOrders}
      />

      {/* Bottom App Bar with View Cart Button */}
      <AppBar
        position="fixed"
        color="default"
        sx={{
          top: 'auto',
          bottom: 0,
          boxShadow: '0 -4px 10px rgba(0, 0, 0, 0.3)',
          backgroundColor: '#000000',
          borderTop: '1px solid rgba(255, 165, 0, 0.2)'
        }}
      >
        <Toolbar>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<HistoryIcon />}
            onClick={handleOpenOrderHistory}
            sx={{
              borderRadius: '4px',
              mr: 2,
              borderColor: 'rgba(255, 165, 0, 0.5)',
              borderWidth: '2px',
              color: '#FFA500',
              '&:hover': {
                borderColor: '#FFA500',
                backgroundColor: 'rgba(255, 165, 0, 0.1)'
              }
            }}
          >
            View Orders
          </Button>
          {/* Real-time update indicator */}
          {isPollingActive && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mr: 2,
                px: 1,
                py: 0.5,
                borderRadius: '12px',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                border: '1px solid rgba(76, 175, 80, 0.3)'
              }}
            >
              <CircularProgress size={12} sx={{ color: '#4CAF50', mr: 0.5 }} />
              <Typography variant="caption" sx={{ color: '#4CAF50', fontSize: '0.7rem' }}>
                Updating...
              </Typography>
            </Box>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            color="primary"
            startIcon={
              <Badge
                badgeContent={cart.length}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    minWidth: '18px',
                    height: '18px',
                    backgroundColor: '#000000',
                    color: '#FFA500',
                    border: '1px solid #FFA500'
                  }
                }}
              >
                <ShoppingCartIcon />
              </Badge>
            }
            onClick={handleOpenCartDialog}
            sx={{
              py: 1.2,
              px: 3,
              borderRadius: '4px',
              fontWeight: 'bold',
              backgroundColor: '#FFA500',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
              '&:hover': {
                backgroundColor: '#E69500',
                boxShadow: '0 6px 15px rgba(0, 0, 0, 0.4)',
              },
            }}
          >
            View Cart {cart.length > 0 && `(${cart.length})`}
          </Button>
          {/* Show payment button only if there are completed orders */}
          {userOrders && userOrders.some(order =>
            order.status === 'completed' &&
            order.table_number === parseInt(tableNumber)
          ) && (
            <Button
              variant="contained"
              startIcon={<PaymentIcon />}
              onClick={handleRequestPayment}
              sx={{
                ml: 2,
                py: 1.2,
                px: 3,
                borderRadius: '4px',
                fontWeight: 'bold',
                backgroundColor: '#4DAA57',
                color: '#FFFFFF',
                border: '2px solid #4DAA57',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
                  opacity: 0.5
                },
                '&:hover': {
                  backgroundColor: '#3D8A47',
                  boxShadow: '0 6px 15px rgba(0, 0, 0, 0.4)',
                },
              }}
            >
              Payment
            </Button>
          )}
          <Box sx={{ flexGrow: 1 }} />
        </Toolbar>
      </AppBar>

      {/* Add padding at the bottom to account for the bottom bar */}
      <Box sx={{ height: 80 }} />

      {/* Payment Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={handleClosePaymentDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            backgroundColor: '#121212',
            color: 'white',
            border: '1px solid rgba(255, 165, 0, 0.3)',
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 165, 0, 0.2)' }}>
          <Box display="flex" alignItems="center">
            <PaymentIcon sx={{ mr: 2, color: '#FFA500' }} />
            <Typography variant="h5" component="h2" fontWeight="bold" color="white">
              Payment Details
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255, 165, 0, 0.2)' }}>
          {unpaidOrders.length > 0 ? (
            <Box>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 165, 0, 0.2)',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  color: 'white'
                }}
              >
                <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ color: '#FFA500' }}>
                  Bill Summary
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} gutterBottom>
                    Table #{unpaidOrders[0].table_number}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {unpaidOrders.length} Completed {unpaidOrders.length === 1 ? 'Order' : 'Orders'} Ready for Payment
                  </Typography>
                </Box>

                {/* Display each unpaid order */}
                {unpaidOrders.map((order, orderIndex) => (
                  <Box key={order.id} sx={{ mb: orderIndex < unpaidOrders.length - 1 ? 3 : 0 }}>
                    <Divider sx={{ my: 2, backgroundColor: 'rgba(255, 165, 0, 0.2)' }} />
                    <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="white">
                      Order #{order.id}
                    </Typography>
                    <List disablePadding>
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item) => (
                          <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
                            <ListItemText
                              primary={
                                <Box display="flex" justifyContent="space-between">
                                  <Typography variant="body2" color="white">
                                    {item.dish?.name || "Unknown Dish"} x{item.quantity}
                                  </Typography>
                                  <Typography variant="body2" fontWeight="medium" color="#FFA500">
                                    ₹{((item.dish?.price || 0) * item.quantity).toFixed(2)}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))
                      ) : (
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.5)" sx={{ fontStyle: 'italic' }}>
                          No items in this order
                        </Typography>
                      )}
                    </List>

                    {/* Order Subtotal */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 1, mb: 1 }}>
                      <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                        Order Subtotal:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold" color="#FFA500">
                        ₹{(order.items ? order.items.reduce((sum, item) => sum + (item.dish?.price || 0) * item.quantity, 0) : 0).toFixed(2)}
                      </Typography>
                    </Box>

                  </Box>
                ))}

                <Divider sx={{ my: 2, backgroundColor: 'rgba(255, 165, 0, 0.2)' }} />

                <Box sx={{ mt: 2, backgroundColor: 'rgba(0, 0, 0, 0.3)', p: 2, borderRadius: '8px', border: '1px dashed rgba(255, 165, 0, 0.3)' }}>
                  <Typography variant="subtitle2" color="#FFA500" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Applied Discounts:
                  </Typography>

                  {loyaltyDiscount.discount_percentage > 0 ? (
                    <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <CheckCircleIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
                      {loyaltyDiscount.message}
                    </Typography>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic', mb: 0.5 }}>
                      No loyalty discount applied
                    </Typography>
                  )}

                  {selectionOfferDiscount.discount_amount > 0 ? (
                    <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
                      {selectionOfferDiscount.message}
                    </Typography>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic' }}>
                      No special offer discount applied
                    </Typography>
                  )}
                </Box>

                {/* Total Calculation */}
                {(() => {
                  // Calculate subtotal across all unpaid orders
                  const subtotal = unpaidOrders.reduce((total, order) => {
                    return total + (order.items ? order.items.reduce((sum, item) => sum + (item.dish?.price || 0) * item.quantity, 0) : 0);
                  }, 0);

                  // Calculate loyalty discount
                  const loyaltyDiscountAmount = loyaltyDiscount.discount_percentage > 0
                    ? subtotal * (loyaltyDiscount.discount_percentage / 100)
                    : 0;

                  // Calculate final total
                  const finalTotal = (subtotal - loyaltyDiscountAmount - selectionOfferDiscount.discount_amount);

                  return (
                    <Box sx={{ mt: 2, p: 2, backgroundColor: '#4DAA57', borderRadius: '8px' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="subtitle1" color="#000000">Subtotal</Typography>
                        <Typography variant="subtitle1" color="#000000">
                          ₹{subtotal.toFixed(2)}
                        </Typography>
                      </Box>
                      {loyaltyDiscount.discount_percentage > 0 && (
                        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="body2" color="#000000">
                            Loyalty Discount ({loyaltyDiscount.discount_percentage}%)
                          </Typography>
                          <Typography variant="body2" color="#000000">
                            -₹{loyaltyDiscountAmount.toFixed(2)}
                          </Typography>
                        </Box>
                      )}
                      {selectionOfferDiscount.discount_amount > 0 && (
                        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="body2" color="#000000">
                            Special Offer Discount
                          </Typography>
                          <Typography variant="body2" color="#000000">
                            -₹{selectionOfferDiscount.discount_amount.toFixed(2)}
                          </Typography>
                        </Box>
                      )}
                      <Divider sx={{ my: 1, backgroundColor: 'rgba(0, 0, 0, 0.2)' }} />
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" fontWeight="bold" color="#000000">TOTAL</Typography>
                        <Typography variant="h5" fontWeight="bold" color="#000000">
                          ₹{finalTotal.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })()}
              </Paper>

              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} paragraph>
                  Please proceed to the counter to complete your payment or click the button below to mark as paid.
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="white" gutterBottom>
                No completed orders found for payment
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Orders must be completed by the chef before they can be paid. Please wait for your orders to be ready.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255, 165, 0, 0.2)' }}>
          <Button
            onClick={handleClosePaymentDialog}
            variant="outlined"
            sx={{
              borderColor: 'rgba(255, 165, 0, 0.5)',
              color: 'white',
              '&:hover': {
                borderColor: 'rgba(255, 165, 0, 0.8)',
                backgroundColor: 'rgba(255, 165, 0, 0.1)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCompletePayment}
            disabled={unpaidOrders.length === 0}
            sx={{
              py: 1.5,
              px: 4,
              fontWeight: 'bold',
              backgroundColor: '#FFA500',
              color: '#000000',
              borderRadius: 0,
              '&:hover': {
                backgroundColor: '#E69500',
              },
              '&.Mui-disabled': {
                backgroundColor: 'rgba(255, 165, 0, 0.3)',
                color: 'rgba(0, 0, 0, 0.5)'
              }
            }}
          >
            Complete Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <FeedbackDialog
        open={feedbackDialogOpen}
        onClose={() => setFeedbackDialogOpen(false)}
        orderId={lastPaidOrderId}
        personId={userId ? parseInt(userId) : null}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            width: '100%',
            borderRadius: '50px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CustomerMenu;


