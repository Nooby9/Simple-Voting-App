import React, { useState, useEffect } from "react";
import "../style/appLayout.css";
import { Outlet, Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

export default function AppLayout() {
  const { user, isLoading, logout } = useAuth0();
  const [isMenuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMenuVisible(true);
      } else {
        setMenuVisible(false); 
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); 

    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  const toggleMenu = () => {
    setMenuVisible(!isMenuVisible);
  };

  return (
    <div className="app">
      <div className="title">
        <h1>Simple Voting App</h1>
      </div>
      <button className="menu-button" onClick={toggleMenu}>Menu</button>
        <div className={`header ${isMenuVisible ? 'isMenuVisible' : ''}`}>
          {isMenuVisible && (
            <nav className="menu">
              <ul className="menu-list">
                <li><Link to="/app/vote">Vote</Link></li>
                <li><Link to="/app/my-votes">My Votes</Link></li>
                <li><Link to="/app/create-candidate">Create Candidate</Link></li>
                <li><Link to="/app">Profile</Link></li>
                <li><Link to="/app/debugger">Auth Debugger</Link></li>
                <li>
                  <button
                    className="exit-button"
                    onClick={() => logout({ returnTo: window.location.origin })}
                  >
                    Log Out
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      
      <div className="content">
        <Outlet />
      </div>
    </div>
  );
}
