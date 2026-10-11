import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, isAdmin, isDonor, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to={isAdmin ? '/dashboard' : '/pledges'} className="navbar-brand">
          <span className="brand-icon">₹</span>
          <span className="brand-text">PledgeTrack</span>
        </Link>

        <nav className="navbar-links">
          {isAdmin && (
            <Link
              to="/dashboard"
              className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
            >
              Dashboard
            </Link>
          )}

          {isDonor && (
            <>
              <Link
                to="/pledges"
                className={`nav-link ${location.pathname === '/pledges' ? 'active' : ''}`}
              >
                My Pledges
              </Link>
              <Link
                to="/pledges/new"
                className={`nav-link ${location.pathname === '/pledges/new' ? 'active' : ''}`}
              >
                + New Pledge
              </Link>
            </>
          )}
        </nav>

        <div className="navbar-user">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className={`role-badge ${user.role}`}>{user.role}</span>
          </div>
          <button onClick={handleLogout} className="btn-logout" title="Log out of account">
            Log out
          </button>
        </div>
      </div>
    </header>
  );
};
