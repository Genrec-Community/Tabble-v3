import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  TextField,
  InputAdornment,
  Fab,
  Badge
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PendingIcon from '@mui/icons-material/Pending';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PaidIcon from '@mui/icons-material/Paid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TodayIcon from '@mui/icons-material/Today';
import PersonIcon from '@mui/icons-material/Person';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import { adminService } from '../../services/api';
import AdminPageHeader from '../../components/AdminPageHeader';

const AdminDashboard = () => {
  // State
  const [stats, setStats] = useState({
    total_orders: 0,
    pending_orders: 0,
    completed_orders: 0,
    paid_orders: 0,
    total_orders_today: 0,
    pending_orders_today: 0,
    completed_orders_today: 0,
    paid_orders_today: 0
  });
  const [completedOrders, setCompletedOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingCompletedOrders, setLoadingCompletedOrders] = useState(true);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [refreshing, setRefreshing] = useState(false);

  // Fetch stats and orders
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get statistics
        const statsData = await adminService.getOrderStats();
        setStats(statsData);
        setLoading(false);

        // Get completed orders for billing
        await fetchCompletedOrders();
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load dashboard data',
          severity: 'error'
        });
        setLoading(false);
        setLoadingCompletedOrders(false);
      }
    };

    fetchData();

    // Refresh data every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [statusFilter]);



  // Fetch completed orders for billing
  const fetchCompletedOrders = async () => {
    setLoadingCompletedOrders(true);
    try {
      const completedOrdersData = await adminService.getCompletedOrdersForBilling();
      setCompletedOrders(completedOrdersData);
      setLoadingCompletedOrders(false);
    } catch (error) {
      console.error('Error fetching completed orders:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load completed orders',
        severity: 'error'
      });
      setLoadingCompletedOrders(false);
    }
  };

  // Handle status filter change
  const handleStatusFilterChange = (event) => {
    const newStatus = event.target.value;
    setStatusFilter(newStatus);
  };

  // Handle search query change
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Manual refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const statsData = await adminService.getOrderStats();
      setStats(statsData);
      await fetchCompletedOrders();
      setSnackbar({
        open: true,
        message: 'Data refreshed successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to refresh data',
        severity: 'error'
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Filter completed orders based on search query and status
  const filteredCompletedOrders = completedOrders.filter(order => {
    // Filter by status
    if (statusFilter && order.status !== statusFilter) return false;

    // Filter by search query
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.id.toString().includes(query) ||
      order.table_number.toString().includes(query) ||
      (order.person_name && order.person_name.toLowerCase().includes(query)) ||
      order.status.toLowerCase().includes(query)
    );
  });

  // View order details
  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setOrderDetailsOpen(true);
  };

  // Close order details dialog
  const handleCloseOrderDetails = () => {
    setOrderDetailsOpen(false);
  };

  // Mark order as paid
  const handleMarkAsPaid = async (orderId) => {
    try {
      await adminService.markOrderAsPaid(orderId);

      // Close dialog
      setOrderDetailsOpen(false);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Order marked as paid!',
        severity: 'success'
      });

      // Refresh data
      const statsData = await adminService.getOrderStats();
      setStats(statsData);
      await fetchCompletedOrders();
    } catch (error) {
      console.error('Error marking order as paid:', error);
      setSnackbar({
        open: true,
        message: 'Failed to mark order as paid',
        severity: 'error'
      });
    }
  };

  // Format date in Indian Standard Time
  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    };
    return new Date(dateString).toLocaleString('en-IN', options);
  };

  // Get status chip
  const getStatusChip = (status) => {
    let color, icon, label;

    switch (status) {
      case 'pending':
        color = 'warning';
        icon = <PendingIcon fontSize="small" />;
        label = 'Pending';
        break;
      case 'completed':
        color = 'success';
        icon = <CheckCircleIcon fontSize="small" />;
        label = 'Completed';
        break;
      case 'payment_requested':
        color = 'info';
        icon = <ReceiptIcon fontSize="small" />;
        label = 'Payment Requested';
        break;
      case 'paid':
        color = 'secondary';
        icon = <PaidIcon fontSize="small" />;
        label = 'Paid';
        break;
      default:
        color = 'default';
        icon = null;
        label = status;
    }

    return (
      <Chip
        icon={icon}
        label={label}
        color={color}
        size="small"
        sx={{ '& .MuiChip-icon': { fontSize: '1rem' } }}
      />
    );
  };

  // Calculate order total
  const calculateOrderTotal = (order) => {
    if (!order || !order.items) return 0;
    return order.items.reduce((total, item) => {
      return total + (item.dish.price * item.quantity);
    }, 0).toFixed(2);
  };

  // Generate bill PDF
  const handleGenerateBill = async (orderId) => {
    try {
      // Show loading message
      setSnackbar({
        open: true,
        message: 'Generating bill...',
        severity: 'info'
      });

      // Call API to generate bill
      const pdfBlob = await adminService.generateBill(orderId);

      // Create a URL for the blob
      const url = window.URL.createObjectURL(pdfBlob);

      // Create a link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `bill_order_${orderId}.pdf`;

      // Append to body, click and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL
      window.URL.revokeObjectURL(url);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Bill generated successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error generating bill:', error);
      setSnackbar({
        open: true,
        message: 'Error generating bill',
        severity: 'error'
      });
    }
  };

  return (
    <Container maxWidth="xl">
      {/* Header Section */}
      <AdminPageHeader
        title="Dashboard"
        subtitle="Monitor and manage your restaurant operations"
        actions={
          <Tooltip title="Refresh Data">
            <Fab
              size="medium"
              color="primary"
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{
                boxShadow: 2,
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
            >
              {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
            </Fab>
          </Tooltip>
        }
      />



      {/* Today's Statistics */}
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant="h5" component="h2" gutterBottom fontWeight="medium" sx={{ mb: 3 }}>
            <TodayIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Today's Statistics
          </Typography>
          <Grid container spacing={3} mb={5}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  height: '100%',
                  borderTop: '4px solid',
                  borderColor: 'primary.main',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent sx={{ pb: 2 }}>
                  <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                    <Box sx={{
                      color: 'primary.main',
                      mb: 2,
                      p: 2,
                      borderRadius: '50%',
                      backgroundColor: 'primary.light',
                      opacity: 0.1
                    }}>
                      <ReceiptIcon sx={{ fontSize: 48 }} />
                    </Box>
                    <Typography variant="h3" component="div" fontWeight="bold" color="primary.dark">
                      {stats.total_orders_today}
                    </Typography>
                    <Typography variant="h6" component="div" color="text.secondary" gutterBottom>
                      Total Orders Today
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      <TrendingUpIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                      <Typography variant="body2" color="success.main">
                        +{((stats.total_orders_today / Math.max(stats.total_orders, 1)) * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  height: '100%',
                  borderTop: '4px solid',
                  borderColor: 'warning.main',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent sx={{ pb: 2 }}>
                  <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                    <Box sx={{
                      color: 'warning.main',
                      mb: 2,
                      p: 2,
                      borderRadius: '50%',
                      backgroundColor: 'warning.light',
                      opacity: 0.1,
                      position: 'relative'
                    }}>
                      <PendingIcon sx={{ fontSize: 48 }} />
                      {stats.pending_orders_today > 0 && (
                        <Badge
                          badgeContent={stats.pending_orders_today}
                          color="error"
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="h3" component="div" fontWeight="bold" color="warning.dark">
                      {stats.pending_orders_today}
                    </Typography>
                    <Typography variant="h6" component="div" color="text.secondary" gutterBottom>
                      Pending Today
                    </Typography>
                    {stats.pending_orders_today > 0 && (
                      <Box display="flex" alignItems="center" mt={1}>
                        <AccessTimeIcon fontSize="small" color="warning" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="warning.main">
                          Needs Attention
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  height: '100%',
                  borderTop: '4px solid',
                  borderColor: 'success.main',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                  },
                }}
              >
                <CardContent>
                  <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                    <Box sx={{ color: 'success.main', mb: 2 }}>
                      <CheckCircleIcon sx={{ fontSize: 48 }} />
                    </Box>
                    <Typography variant="h3" component="div" fontWeight="bold" color="success.dark">
                      {stats.completed_orders_today}
                    </Typography>
                    <Typography variant="h6" component="div" color="text.secondary">
                      Completed Today
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  height: '100%',
                  borderTop: '4px solid',
                  borderColor: 'secondary.main',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                  },
                }}
              >
                <CardContent>
                  <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                    <Box sx={{ color: 'secondary.main', mb: 2 }}>
                      <PaidIcon sx={{ fontSize: 48 }} />
                    </Box>
                    <Typography variant="h3" component="div" fontWeight="bold" color="secondary.dark">
                      {stats.paid_orders_today}
                    </Typography>
                    <Typography variant="h6" component="div" color="text.secondary">
                      Paid Today
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

        </>
      )}

      {/* Completed Orders for Billing */}
      <Paper elevation={3} sx={{ p: 3, borderRadius: 3, backgroundColor: 'background.paper' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h2" fontWeight="bold">
            <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Completed Orders for Billing
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Badge badgeContent={filteredCompletedOrders.length} color="success">
              <PaidIcon />
            </Badge>
          </Box>
        </Box>



        {/* Search and Filter for Completed Orders */}
        <Box mb={3} display="flex" gap={2} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Search completed orders..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300 }}
          />
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Payment Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label="Payment Status"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="completed">Ready for Payment</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loadingCompletedOrders ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : filteredCompletedOrders.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <ReceiptIcon />
              No completed orders found for billing.
            </Box>
          </Alert>
        ) : (
          <TableContainer sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'success.light' }}>
                  <TableCell sx={{ fontWeight: 'bold', color: 'success.contrastText' }}>Order ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'success.contrastText' }}>Table</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'success.contrastText' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'success.contrastText' }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.contrastText' }}>Total Amount</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'success.contrastText' }}>Completed Time</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: 'success.contrastText' }}>Billing Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCompletedOrders.map((order, index) => (
                  <TableRow
                    key={order.id}
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                      backgroundColor: index % 2 === 0 ? 'background.default' : 'background.paper',
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="primary.main">
                        #{order.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`Table ${order.table_number}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <PersonIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2">
                          {order.person_name || 'Guest'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{getStatusChip(order.status)}</TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" fontWeight="bold" color="success.main">
                        ₹{calculateOrderTotal(order)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(order.updated_at || order.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" justifyContent="center" gap={1}>
                        <Tooltip title="Generate Bill">
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<ReceiptIcon />}
                            onClick={() => handleGenerateBill(order.id)}
                            color="success"
                            sx={{
                              borderRadius: 2,
                              minWidth: 100,
                              fontWeight: 'bold'
                            }}
                          >
                            Bill
                          </Button>
                        </Tooltip>
                        <Tooltip title="View Details">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewOrderDetails(order)}
                            sx={{ borderRadius: 2 }}
                          >
                            View
                          </Button>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Order Details Dialog */}
      <Dialog
        open={orderDetailsOpen}
        onClose={handleCloseOrderDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            Order Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedOrder && (
            <>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Order ID
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    #{selectedOrder.id}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Table
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedOrder.table_number}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Customer
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedOrder.person_name || 'Guest'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="body1">
                    {getStatusChip(selectedOrder.status)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Order Time
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedOrder.created_at)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary.main">
                    ₹{calculateOrderTotal(selectedOrder)}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>
                Order Items
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="center">Quantity</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.dish.name}</TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right">₹{item.dish.price.toFixed(2)}</TableCell>
                        <TableCell align="right">₹{(item.dish.price * item.quantity).toFixed(2)}</TableCell>
                        <TableCell>{item.remarks || '-'}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                        Total Amount:
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        ₹{calculateOrderTotal(selectedOrder)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOrderDetails}>Close</Button>
          {selectedOrder && (selectedOrder.status === 'completed' || selectedOrder.status === 'paid') && (
            <Button
              variant="outlined"
              color="success"
              startIcon={<FileDownloadIcon />}
              onClick={() => handleGenerateBill(selectedOrder.id)}
            >
              Generate Bill
            </Button>
          )}
          {selectedOrder && selectedOrder.status === 'payment_requested' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<PaidIcon />}
              onClick={() => handleMarkAsPaid(selectedOrder.id)}
            >
              Mark as Paid
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminDashboard;
