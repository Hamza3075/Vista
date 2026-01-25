
import React, { useState, useEffect } from 'react';
import { StoreProvider } from './store/StoreContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { ProductionView } from './components/ProductionView';
import { IngredientsView } from './components/IngredientsView';
import { PackagingView } from './components/PackagingView';
import { SalesView } from './components/SalesView';
import { MarketingView } from './components/MarketingView';
import { SettingsView } from './components/SettingsView';
import { DashboardView } from './components/DashboardView';

// Nav Icons
const IconDashboard = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2