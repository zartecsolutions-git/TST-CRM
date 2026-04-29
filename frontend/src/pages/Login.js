import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';

import { BACKEND_URL } from '../utils/backendUrl';
const API_URL = BACKEND_URL;

// Company Branding from Environment Variables
const COMPANY_NAME = process.env.REACT_APP_COMPANY_NAME || 'Sales & Service CRM';
const COMPANY_TAGLINE = process.env.REACT_APP_COMPANY_TAGLINE || 'Track activities, manage teams, and monitor performance';
const COMPANY_LOCATION = process.env.REACT_APP_COMPANY_LOCATION || '';
const COMPANY_LOGO_URL = process.env.REACT_APP_COMPANY_LOGO_URL || '';
const PRIMARY_COLOR = process.env.REACT_APP_PRIMARY_COLOR || '#1e40af';
const SECONDARY_COLOR = process.env.REACT_APP_SECONDARY_COLOR || '#16a34a';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDefaultCompany();
  }, []);

  const fetchDefaultCompany = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/companies/default/branding`);
      setCompanyInfo(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      // Employees go straight to Daily Tasks
      const dest = result.user?.role === 'employee' ? '/daily-tasks' : '/dashboard';
      navigate(dest);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-green-50 to-blue-50">
      <div className="w-full max-w-md p-6">
        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center mb-6">
              {(companyInfo?.logo_url || COMPANY_LOGO_URL) ? (
                <img 
                  src={companyInfo?.logo_url || COMPANY_LOGO_URL} 
                  alt={companyInfo?.name || COMPANY_NAME} 
                  className="h-32 w-auto max-w-[300px] object-contain"
                />
              ) : (
                <div 
                  className="p-4 rounded-2xl"
                  style={{
                    background: `linear-gradient(to right, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})`
                  }}
                >
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
            </div>
            <CardTitle 
              className="text-3xl font-bold bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(to right, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})`
              }}
            >
              {companyInfo?.name || COMPANY_NAME}
            </CardTitle>
            <CardDescription className="text-base">
              {(companyInfo?.country || COMPANY_LOCATION) && `${companyInfo?.country || COMPANY_LOCATION} • `}
              {COMPANY_TAGLINE}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm" data-testid="login-error">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                  data-testid="email-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                  data-testid="password-input"
                />
              </div>
              
              <Button
                type="submit"
                className="w-full h-11 hover:opacity-90"
                style={{
                  background: `linear-gradient(to right, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})`
                }}
                disabled={loading}
                data-testid="login-submit-button"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
                Register
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
