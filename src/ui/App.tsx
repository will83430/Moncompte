import { h } from 'preact';
import { useSignal } from './hooks/useSignal';
import { currentRoute, appData, isLocked } from '../store';
import { PinPage }       from './pages/PinPage';
import { DashPage }      from './pages/DashPage';
import { AddPage }       from './pages/AddPage';
import { StatsPage }     from './pages/StatsPage';
import { AnalysePage }   from './pages/AnalysePage';
import { RecsPage }      from './pages/RecsPage';
import { SyncPage }      from './pages/SyncPage';
import { SettingsPage }  from './pages/SettingsPage';
import { BottomNav }     from './components/BottomNav';
import { AppHeader }     from './components/AppHeader';

export function App() {
  const locked = useSignal(isLocked);
  const data   = useSignal(appData);
  const route  = useSignal(currentRoute);

  if (locked || !data) return <PinPage />;

  return (
    <div class="app-shell">
      <AppHeader />
      <main class="page-content">
        {route === 'dash'    && <DashPage />}
        {route === 'add'     && <AddPage />}
        {route === 'stats'   && <StatsPage />}
        {route === 'recs'    && <RecsPage />}
        {route === 'analyse' && <AnalysePage />}
        {route === 'sync'     && <SyncPage />}
        {route === 'settings' && <SettingsPage />}
      </main>
      <BottomNav />
      {/* Modal édition transaction (injecté par txModal.ts) */}
      <div class="modal-overlay" id="tx-modal" onClick={(e) => { if ((e.target as Element).id === 'tx-modal') (window as any).closeTxModal(); }}>
        <div class="modal-box" id="tx-modal-inner"></div>
      </div>
    </div>
  );
}
