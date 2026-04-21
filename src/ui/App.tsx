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
import { BottomNav }     from './components/BottomNav';

export function App() {
  const locked = useSignal(isLocked);
  const data   = useSignal(appData);
  const route  = useSignal(currentRoute);

  if (locked || !data) return <PinPage />;

  return (
    <div class="app-shell">
      <main class="page-content">
        {route === 'dash'    && <DashPage />}
        {route === 'add'     && <AddPage />}
        {route === 'stats'   && <StatsPage />}
        {route === 'recs'    && <RecsPage />}
        {route === 'analyse' && <AnalysePage />}
        {route === 'sync'    && <SyncPage />}
      </main>
      <BottomNav />
    </div>
  );
}
