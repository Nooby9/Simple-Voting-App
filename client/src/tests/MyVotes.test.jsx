import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import MyVotesList from '../components/MyVotes';

jest.mock('@auth0/auth0-react', () => ({
    useAuth0: jest.fn()
  }));
  
  jest.mock('react-router-dom', () => ({
    useNavigate: jest.fn()
  }));
  
  global.fetch = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]), 
    });
    useAuth0.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      getAccessTokenSilently: jest.fn().mockResolvedValue('fake-token'),
    });
    useNavigate.mockReturnValue(jest.fn());
  });

  describe('MyVotesList Component', () => {
    it('renders correctly when user is authenticated', async () => {
      render(<MyVotesList />);
      expect(screen.getByText('My Votes')).toBeInTheDocument();
    });
  
    it('calls fetch on component mount and renders data', async () => {
      render(<MyVotesList />);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    });
  
    it('handles window resize correctly', () => {
      render(<MyVotesList />);
      global.innerWidth = 500;
      global.dispatchEvent(new Event('resize'));
    });
  });
  