import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import '@testing-library/jest-dom';
import Profile from "../components/Profile";
import { useAuth0 } from "@auth0/auth0-react";

jest.mock('@auth0/auth0-react', () => ({
  useAuth0: jest.fn()
}));
global.fetch = jest.fn();


function resolveFetch(user, votes, candidates, ok = true) {
  fetch.mockResolvedValueOnce({
    ok: ok,
    json: () => Promise.resolve(user)
  });
  fetch.mockResolvedValueOnce({
    ok: ok,
    json: () => Promise.resolve(votes)
  });
  fetch.mockResolvedValueOnce({
    ok: ok,
    json: () => Promise.resolve(candidates)
  });
}
describe('Profile Component', () => {
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    picture: 'http://example.com/picture.jpg'
  };
  const votes = { totalVotes: 5 };
  const candidates = [{ id: 1, name: 'Candidate A', votesCount: 10 }];

  beforeEach(() => {
    useAuth0.mockReturnValue({
      user,
      isAuthenticated: true,
      isLoading: false,
      getAccessTokenSilently: jest.fn().mockResolvedValue('fake-token'),
    });
    jest.clearAllMocks();
  });

  beforeEach(() => {
    window.alert = jest.fn();
  });
  
  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockImplementation((url, options) => {
      if (url.endsWith('/update-user') && options.method === 'PUT') {
        return Promise.resolve({
          ok: true,  
          json: () => Promise.resolve({ message: 'Name updated successfully!' })
        });
      }
      return Promise.reject(new Error('path not mocked'));
    });
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders user information and fetched data correctly', async () => {
    resolveFetch(user, votes, candidates);
    render(<Profile />);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    expect(screen.getByText((content, element) => content.includes('John Doe'))).toBeInTheDocument();
    expect(screen.getByText('Total Number of Votes Currently: 5')).toBeInTheDocument();
    expect(screen.getByText('Candidate A - Votes: 10')).toBeInTheDocument();
  });

  it('displays error messages if fetch fails', async () => {
    resolveFetch({}, {}, {}, false);
    render(<Profile />);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
  });

  test('allows user to edit and save new name', async () => {
    render(<Profile />);
  
    await waitFor(() => screen.getByText(/Edit Name/));
  
    fireEvent.click(screen.getByText('Edit Name'));

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Jane Doe' } });
  
    fireEvent.click(screen.getByText('Save'));
  
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/update-user'), expect.objectContaining({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: expect.any(String)
        },
        body: JSON.stringify({ name: 'Jane Doe' })
      }));
    });
  });

});

