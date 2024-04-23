import {useState} from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import { useAuthToken } from "../AuthTokenContext";
import '../style/authDebugger.css';

export default function AuthDebugger() {
  const { user } = useAuth0();
  const { accessToken } = useAuthToken();
  const [showToken, setShowToken] = useState(false);

  const handleCopyToken = () => {
    navigator.clipboard.writeText(accessToken)
      .then(() => alert('Access Token copied to clipboard!'))
      .catch(err => alert('Failed to copy text: ', err));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setShowToken(!showToken)}>
          {showToken ? 'Hide' : 'Show'} Auth Token
        </button>
        <button onClick={handleCopyToken} style={{ marginLeft: '10px' }}>
          Copy Auth Token
        </button>
        {showToken && (
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f4f4f8', padding: '10px', borderRadius: '5px', marginTop: '10px' }}>
            {JSON.stringify(accessToken, null, 2)}
          </pre>
        )}
      </div>
      <div className="user-info">
        <div><strong>Name:</strong> {user.name}</div>
        <div><strong>Nickname:</strong> {user.nickname}</div>
        <div><strong>Email:</strong> {user.email}</div>
        <div><strong>Auth0 ID:</strong> {user.sub}</div>
        <div><strong>Email Verified:</strong> {user.email_verified?.toString()}</div>
        <div><strong>Updated At:</strong> {user.updated_at}</div>
      </div>
    </div>
  );
}
