import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { settingsApi } from '../api';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [brand, setBrand] = useState({
    name: 'SalesCRM Pro', currency: '₹', primaryColor: '#4F46E5'
  });
  const [toastMsg, setToastMsg] = useState(null);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem('crm_token')) return;
    settingsApi.getBrand().then(r => setBrand(r.data)).catch(() => {});
  }, []);

  const toast = useCallback((msg, dur = 3000) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), dur);
  }, []);

  const openModal = useCallback((content) => setModal(content), []);
  const closeModal = useCallback(() => setModal(null), []);

  return (
    <AppContext.Provider value={{ brand, setBrand, toast, modal, openModal, closeModal }}>
      {children}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: '#0F172A', color: '#fff', padding: '10px 18px',
          borderRadius: 10, fontSize: 13, zIndex: 9999, boxShadow: '0 8px 30px rgba(0,0,0,.3)'
        }}>{toastMsg}</div>
      )}
      {modal && (
        <div className="mo open" onClick={(e) => e.target.classList.contains('mo') && closeModal()}>
          <div className="mb">{modal}</div>
        </div>
      )}
    </AppContext.Provider>
  );
}
