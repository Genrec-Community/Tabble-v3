import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Box,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { adminService } from '../services/api';

const DatabaseSelector = ({ open, onSuccess, title = "Select Database" }) => {
  const [databases, setDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchingDatabases, setFetchingDatabases] = useState(true);

  // Fetch available databases when component mounts
  useEffect(() => {
    if (open) {
      fetchDatabases();
    }
  }, [open]);

  const fetchDatabases = async () => {
    try {
      setFetchingDatabases(true);
      const response = await adminService.getDatabases();
      setDatabases(response.databases || []);
    } catch (error) {
      console.error('Error fetching databases:', error);
      setError('Failed to load available databases');
    } finally {
      setFetchingDatabases(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedDatabase) {
      setError('Please select a database');
      return;
    }

    if (!password) {
      setError('Please enter the database password');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await adminService.switchDatabase(selectedDatabase, password);

      if (response.success) {
        // Store database credentials in localStorage with page-specific keys
        localStorage.setItem('selectedDatabase', selectedDatabase);
        localStorage.setItem('databasePassword', password);
        localStorage.setItem('tabbleDatabaseSelected', 'true');

        // Call success callback
        onSuccess(selectedDatabase);
      } else {
        setError(response.message || 'Failed to connect to database');
      }
    } catch (error) {
      console.error('Database connection error:', error);
      if (error.response?.status === 401) {
        setError('Invalid password for the selected database');
      } else {
        setError('Failed to connect to database. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleConnect();
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 3,
          border: '2px solid rgba(255, 165, 0, 0.3)', // Orange border around dialog
          backgroundColor: '#121212', // Consistent dark background
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Typography variant="h5" component="div" fontWeight="bold">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Please select your hotel database and enter the password
        </Typography>
      </DialogTitle>

      <DialogContent sx={{
        pt: 2,
        border: '1px solid rgba(255, 165, 0, 0.15)',
        borderRadius: 1,
        m: 2,
        backgroundColor: 'rgba(255, 165, 0, 0.02)'
      }}>
        {fetchingDatabases ? (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  borderRadius: 1
                }}
              >
                {error}
              </Alert>
            )}

            <FormControl
              fullWidth
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  border: '2px solid rgba(255, 165, 0, 0.4)',
                  borderRadius: 1,
                  backgroundColor: 'rgba(18, 18, 18, 0.8)',
                  color: '#FFFFFF',
                  '&:hover': {
                    borderColor: 'rgba(255, 165, 0, 0.6)',
                    backgroundColor: 'rgba(18, 18, 18, 0.9)',
                  },
                  '&.Mui-focused': {
                    borderColor: '#FFA500',
                    boxShadow: '0 0 0 2px rgba(255, 165, 0, 0.2)',
                    backgroundColor: 'rgba(18, 18, 18, 1)',
                  },
                  '& .MuiSelect-select': {
                    color: '#FFFFFF !important',
                    padding: '14px',
                  },
                  '& .MuiSelect-icon': {
                    color: '#FFA500',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: '#FFA500',
                  },
                },
              }}
            >
              <InputLabel>Select Database</InputLabel>
              <Select
                value={selectedDatabase}
                label="Select Database"
                onChange={(e) => setSelectedDatabase(e.target.value)}
                disabled={loading}
                sx={{
                  color: '#FFFFFF',
                  '& .MuiSelect-select': {
                    color: '#FFFFFF !important',
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      border: '2px solid rgba(255, 165, 0, 0.4)',
                      borderRadius: 1,
                      maxHeight: 200,
                      backgroundColor: '#121212',
                      '& .MuiMenuItem-root': {
                        color: '#FFFFFF',
                        borderBottom: '1px solid rgba(255, 165, 0, 0.2)',
                        padding: '12px 16px',
                        '&:last-child': {
                          borderBottom: 'none',
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(255, 165, 0, 0.1)',
                          borderLeft: '3px solid rgba(255, 165, 0, 0.5)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(255, 165, 0, 0.15)',
                          borderLeft: '4px solid #FFA500',
                          color: '#FFFFFF',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 165, 0, 0.2)',
                          },
                        },
                      },
                    },
                  },
                }}
              >
                {databases.map((db) => (
                  <MenuItem key={db.database_name} value={db.database_name}>
                    {db.database_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Database Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  border: '2px solid rgba(255, 165, 0, 0.4)',
                  borderRadius: 1,
                  backgroundColor: 'rgba(18, 18, 18, 0.8)',
                  color: '#FFFFFF',
                  '&:hover': {
                    borderColor: 'rgba(255, 165, 0, 0.6)',
                    backgroundColor: 'rgba(18, 18, 18, 0.9)',
                  },
                  '&.Mui-focused': {
                    borderColor: '#FFA500',
                    boxShadow: '0 0 0 2px rgba(255, 165, 0, 0.2)',
                    backgroundColor: 'rgba(18, 18, 18, 1)',
                  },
                  '& input': {
                    color: '#FFFFFF',
                    padding: '14px',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: '#FFA500',
                  },
                },
              }}
              autoComplete="off"
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{
        px: 3,
        pb: 3,
        borderTop: '1px solid rgba(255, 165, 0, 0.2)',
        backgroundColor: 'rgba(255, 165, 0, 0.02)',
      }}>
        <Button
          onClick={handleConnect}
          variant="contained"
          fullWidth
          disabled={loading || fetchingDatabases || !selectedDatabase || !password}
          sx={{
            py: 1.5,
            border: '1px solid rgba(255, 165, 0, 0.3)',
            borderRadius: 1,
            background: 'linear-gradient(45deg, #FFA500 30%, #FFB733 90%)',
            boxShadow: '0 4px 12px rgba(255, 165, 0, 0.3)',
            '&:hover': {
              background: 'linear-gradient(45deg, #E69500 30%, #FFA500 90%)',
              boxShadow: '0 6px 16px rgba(255, 165, 0, 0.4)',
            },
            '&:disabled': {
              background: 'rgba(255, 165, 0, 0.3)',
              color: 'rgba(255, 255, 255, 0.5)',
              border: '1px solid rgba(255, 165, 0, 0.2)',
            },
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
              Connecting...
            </>
          ) : (
            'Connect to Database'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DatabaseSelector;
