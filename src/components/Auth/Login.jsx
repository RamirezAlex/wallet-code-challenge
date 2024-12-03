// Login.js
import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Alert, AlertTitle, CircularProgress } from '@mui/material';
import { useWalletAuth } from '../../hooks/useWalletAuth';
import { useAuth } from '../../AuthContext';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const Login = ({ selectedRole }) => {
  const { connectWallet, isConnecting, error: walletError } = useWalletAuth();
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleWalletLogin = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      setAlertOpen(true);
      return;
    }
    
    try {
      const { token, userId, role } = await connectWallet(false, { 
        email,
        role: selectedRole
      });
      
      // Store token and login
      Cookies.set('token', token, { expires: 7, secure: true });
      login(token, userId, role);

      // Navigate based on role
      if (role === 'buyer') {
        navigate('/auction-platform');
      } else if (role === 'seller') {
        navigate('/seller-platform');
      }
    } catch (err) {
      console.error('Wallet login failed:', err);
      setError(err.message || 'Failed to connect wallet');
      setAlertOpen(true);
    }
  };

  const handleAlertClose = () => {
    setAlertOpen(false);
  };

  return (
    <Box sx={{padding:5, textAlign:'center'}}>
      <Typography variant='h2' color='black'>Login</Typography>
      <form onSubmit={handleWalletLogin} style={{ width: '100%' }}>
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={handleChange}
        />
        
        <Button 
          type="submit"
          size='large' 
          variant="contained" 
          sx={{ mt: 3, mb: 2 }}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <CircularProgress size={24} color="inherit" style={{ marginRight: '10px' }} />
              Connecting Wallet...
            </>
          ) : (
            'Login with Wallet'
          )}
        </Button>

        {(error || walletError) && (
          <Alert 
            severity="error" 
            onClose={handleAlertClose} 
            open={alertOpen}
          >
            <AlertTitle>Error</AlertTitle>
            {error || walletError}
          </Alert>
        )}

        <Alert severity="info" sx={{ mt: 2 }}>
          Please make sure you are connected to the Sepolia Test Network
        </Alert>
      </form>
    </Box>
  );
};

export default Login;
