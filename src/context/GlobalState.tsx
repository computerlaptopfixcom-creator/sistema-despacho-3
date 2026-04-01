import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Client, Visit, Service, Payment, Appointment, User } from '../types';

// ── Current User (persisted in localStorage) ──────────────────────────
type CurrentUser = {
  id: string;
  nombre: string;
  email?: string;
  rol: 'admin' | 'contador';
};

const loadCurrentUser = (): CurrentUser | null => {
  try {
    const raw = localStorage.getItem('despacho3_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ── Database Types ─────────────────────────────────────────────────────
type Database = {
  clients: Client[];
  visits: Visit[];
  services: Service[];
  payments: Payment[];
  appointments: Appointment[];
  users: User[];
};

const emptyDB: Database = {
  clients: [],
  visits: [],
  services: [],
  payments: [],
  appointments: [],
  users: [],
};

type GlobalStateContextType = {
  db: Database;
  loading: boolean;
  currentUser: CurrentUser | null;
  logout: () => void;
  addClient: (client: Client) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addVisit: (visit: Visit) => void;
  updateVisit: (id: string, updates: Partial<Visit>) => void;
  addService: (service: Service) => void;
  updateService: (id: string, updates: Partial<Service>) => void;
  deleteService: (id: string) => void;
  addPayment: (payment: Payment) => void;
  addAppointment: (appt: Appointment) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
};

const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined);

const api = async (endpoint: string, options?: RequestInit) => {
  const res = await fetch(`/api/${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [db, setDb] = useState<Database>(emptyDB);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(loadCurrentUser);

  // Listen for login events from outside the context
  useEffect(() => {
    const handleStorageChange = () => {
      setCurrentUser(loadCurrentUser());
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('despacho_login', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('despacho_login', handleStorageChange);
    };
  }, []);

  // Load all data from API on mount
  useEffect(() => {
    Promise.all([
      api('clients'),
      api('visits'),
      api('services'),
      api('payments'),
      api('appointments'),
      api('users'),
    ])
      .then(([clients, visits, services, payments, appointments, users]) => {
        setDb({ clients, visits, services, payments, appointments, users });
      })
      .catch(err => {
        console.error('Failed to load data:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('despacho3_token');
    localStorage.removeItem('despacho3_user');
    setCurrentUser(null);
    window.location.reload();
  }, []);

  // --- CLIENTS ---
  const addClient = useCallback((client: Client) => {
    api('clients', { method: 'POST', body: JSON.stringify(client) })
      .then(saved => setDb(prev => ({ ...prev, clients: [...prev.clients, saved] })))
      .catch(console.error);
  }, []);

  const updateClient = useCallback((id: string, updates: Partial<Client>) => {
    api(`clients/${id}`, { method: 'PUT', body: JSON.stringify(updates) })
      .then(() => setDb(prev => ({
        ...prev,
        clients: prev.clients.map(c => (c.id === id ? { ...c, ...updates } : c)),
      })))
      .catch(console.error);
  }, []);

  const deleteClient = useCallback((id: string) => {
    api(`clients/${id}`, { method: 'DELETE' })
      .then(() => setDb(prev => ({
        ...prev,
        clients: prev.clients.filter(c => c.id !== id),
        visits: prev.visits.filter(v => v.clienteId !== id),
        payments: prev.payments.filter(p => p.clienteId !== id),
      })))
      .catch(console.error);
  }, []);

  // --- VISITS ---
  const addVisit = useCallback((visit: Visit) => {
    api('visits', { method: 'POST', body: JSON.stringify(visit) })
      .then(saved => setDb(prev => ({ ...prev, visits: [...prev.visits, saved] })))
      .catch(console.error);
  }, []);

  const updateVisit = useCallback((id: string, updates: Partial<Visit>) => {
    api(`visits/${id}`, { method: 'PUT', body: JSON.stringify(updates) })
      .then(() => setDb(prev => ({
        ...prev,
        visits: prev.visits.map(v => (v.id === id ? { ...v, ...updates } : v)),
      })))
      .catch(console.error);
  }, []);

  // --- SERVICES ---
  const addService = useCallback((service: Service) => {
    api('services', { method: 'POST', body: JSON.stringify(service) })
      .then(saved => setDb(prev => ({ ...prev, services: [...prev.services, saved] })))
      .catch(console.error);
  }, []);

  const updateService = useCallback((id: string, updates: Partial<Service>) => {
    api(`services/${id}`, { method: 'PUT', body: JSON.stringify(updates) })
      .then(() => setDb(prev => ({
        ...prev,
        services: prev.services.map(s => (s.id === id ? { ...s, ...updates } : s)),
      })))
      .catch(console.error);
  }, []);

  const deleteService = useCallback((id: string) => {
    api(`services/${id}`, { method: 'DELETE' })
      .then(() => setDb(prev => ({
        ...prev,
        services: prev.services.filter(s => s.id !== id),
      })))
      .catch(console.error);
  }, []);

  // --- PAYMENTS ---
  const addPayment = useCallback((payment: Payment) => {
    api('payments', { method: 'POST', body: JSON.stringify(payment) })
      .then(saved => setDb(prev => ({ ...prev, payments: [...prev.payments, saved] })))
      .catch(console.error);
  }, []);

  // --- APPOINTMENTS ---
  const addAppointment = useCallback((appt: Appointment) => {
    api('appointments', { method: 'POST', body: JSON.stringify(appt) })
      .then(saved => setDb(prev => ({ ...prev, appointments: [...prev.appointments, saved] })))
      .catch(console.error);
  }, []);

  const updateAppointment = useCallback((id: string, updates: Partial<Appointment>) => {
    api(`appointments/${id}`, { method: 'PUT', body: JSON.stringify(updates) })
      .then(() => setDb(prev => ({
        ...prev,
        appointments: prev.appointments.map(a => (a.id === id ? { ...a, ...updates } : a)),
      })))
      .catch(console.error);
  }, []);

  const deleteAppointment = useCallback((id: string) => {
    api(`appointments/${id}`, { method: 'DELETE' })
      .then(() => setDb(prev => ({
        ...prev,
        appointments: prev.appointments.filter(a => a.id !== id),
      })))
      .catch(console.error);
  }, []);

  // --- USERS ---
  const addUser = useCallback((user: User) => {
    api('users', { method: 'POST', body: JSON.stringify(user) })
      .then(saved => setDb(prev => ({ ...prev, users: [...prev.users, saved] })))
      .catch(console.error);
  }, []);

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    api(`users/${id}`, { method: 'PUT', body: JSON.stringify(updates) })
      .then(() => setDb(prev => ({
        ...prev,
        users: prev.users.map(u => (u.id === id ? { ...u, ...updates } : u)),
      })))
      .catch(console.error);
  }, []);

  const deleteUser = useCallback((id: string) => {
    api(`users/${id}`, { method: 'DELETE' })
      .then(() => setDb(prev => ({
        ...prev,
        users: prev.users.filter(u => u.id !== id),
      })))
      .catch(console.error);
  }, []);

  return (
    <GlobalStateContext.Provider
      value={{
        db, loading, currentUser, logout,
        addClient, updateClient, deleteClient,
        addVisit, updateVisit,
        addService, updateService, deleteService,
        addPayment,
        addAppointment, updateAppointment, deleteAppointment,
        addUser, updateUser, deleteUser,
      }}
    >
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (!context) throw new Error('useGlobalState must be used within GlobalProvider');
  return context;
};
