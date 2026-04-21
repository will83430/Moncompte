import { h } from 'preact';
import { useSignal } from '../hooks/useSignal';
import { currentRoute, navigate } from '../../store';

const TABS = [
  { id: 'dash',    icon: '🏠', label: 'Accueil'     },
  { id: 'add',     icon: '＋', label: 'Ajouter'     },
  { id: 'stats',   icon: '📊', label: 'Stats'       },
  { id: 'recs',    icon: '🔄', label: 'Récurrents'  },
  { id: 'analyse', icon: '💡', label: 'Analyse'     },
] as const;

export function BottomNav() {
  const route = useSignal(currentRoute);

  return (
    <nav class="bottom-nav">
      {TABS.map(tab => (
        <button
          key={tab.id}
          class={`nav-item ${route === tab.id ? 'active' : ''}`}
          onClick={() => navigate(tab.id)}
        >
          <span class="nav-icon">{tab.icon}</span>
          <span class="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
