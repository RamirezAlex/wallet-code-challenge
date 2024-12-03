// src/components/Auth/Signup.js
import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Alert, AlertTitle, CircularProgress } from '@mui/material';
import { useWalletAuth } from '../../hooks/useWalletAuth';
import { useAuth } from '../../AuthContext';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const Signup = ({ selectedRole, onClose }) => {
  const { connectWallet, isConnecting, error: walletError } = useWalletAuth();
  const { signup } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });
  const [error, setError] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const { token, userId, role } = await connectWallet(true, {
        ...formData,
        role: selectedRole
      });

      // Store token and signup
      Cookies.set('token', token, { expires: 7, secure: true });
      signup(role);

      setSuccess(true);
      setTimeout(() => {
        if (role === 'buyer') {
          navigate('/auction-platform');
        } else if (role === 'seller') {
          navigate('/seller-platform');
        }
      }, 1500);
    } catch (err) {
      setError(err.message);
      setAlertOpen(true);
    }
  };

  return (
    <Box sx={{padding:5, textAlign:'center'}}>
      <Typography variant='h2' color='black'>Sign Up</Typography>
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          id="name"
          label="Username"
          name="username"
          autoComplete="name"
          autoFocus
          value={formData.username}
          onChange={handleChange}
        />
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
        />
        
        <Button 
          type="submit" 
          size="large" 
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
            'Sign Up with Wallet'
          )}
        </Button>

        {success && (
          <Alert severity="success" onClose={() => setSuccess(false)}>
            <AlertTitle>Success</AlertTitle>
            Signup successful! Redirecting...
          </Alert>
        )}

        {(error || walletError) && (
          <Alert 
            severity="error" 
            onClose={() => setAlertOpen(false)} 
            open={alertOpen}
          >
            <AlertTitle>Error</AlertTitle>
            {error || walletError}
          </Alert>
        )}
      </form>
    </Box>
  );
};

export default Signup;
