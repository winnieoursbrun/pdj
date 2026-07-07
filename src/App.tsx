import { useState } from 'react'
import { useFavorites } from './hooks/useFavorites'
import { useInstallPrompt } from './hooks/useInstallPrompt'
import { MapTab } from './tabs/MapTab'
import { ProgramTab } from './tabs/ProgramTab'
import { TimelineTab } from './tabs/TimelineTab'

type Tab = 'map' | 'program' | 'timeline'

const TABS: { key: Tab; label: string }[] = [
  { key: 'map', label: 'Carte' },
  { key: 'program', label: 'Programme' },
  { key: 'timeline', label: 'Ma timeline' },
]

function TabIcon({ tab }: { tab: Tab }) {
  switch (tab) {
    case 'map':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Zm0 2.2 6 2v11.6l-6-2V6.2Z"
            fillRule="evenodd"
          />
        </svg>
      )
    case 'program':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 2v3M17 2v3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <rect x="3.5" y="4.5" width="17" height="17" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M3.5 9.5h17" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="8.5" cy="14" r="1.4" />
          <circle cx="12" cy="14" r="1.4" />
          <circle cx="15.5" cy="14" r="1.4" />
        </svg>
      )
    case 'timeline':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.5c-5.5 0-9.5 4-9.8 8.7 0 .3.3.55.6.4 1-.5 2.4-.8 3.4-.1.4.3.9.3 1.3 0 1.2-.9 2.6-.9 3.8 0 .4.3.9.3 1.3 0 1.2-.9 2.6-.9 3.8 0 .4.3.9.3 1.3 0 1-.7 2.4-.4 3.4.1.3.15.6-.1.6-.4C21.5 6.5 17.5 2.5 12 2.5Z" />
          <path d="M12 12v6.5a1.6 1.6 0 0 1-3.2 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
  }
}

export default function App() {
  const [tab, setTab] = useState<Tab>('program')
  const [iosHelpOpen, setIosHelpOpen] = useState(false)
  const { favorites, toggle } = useFavorites()
  const install = useInstallPrompt()
  const showInstall = install.canPrompt || install.needsIosHelp

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-text">
          <h1 className="wordmark">
            Les pluies <span className="wordmark-accent">de juillet</span>
          </h1>
          <p className="app-sub">17 – 19 juillet 2026 · Champrepus</p>
        </div>
        {showInstall && (
          <button
            type="button"
            className="install-btn"
            onClick={() => {
              if (install.canPrompt) {
                void install.promptInstall()
              } else {
                setIosHelpOpen(true)
              }
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 3v10m0 0 4-4m-4 4-4-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4.5 16v3.5h15V16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Installer
          </button>
        )}
      </header>

      {iosHelpOpen && (
        <div
          className="ios-sheet-backdrop"
          onClick={() => setIosHelpOpen(false)}
        >
          <div
            className="ios-sheet"
            role="dialog"
            aria-label="Installer l'application"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Installer l'app</h2>
            <ol>
              <li>
                Touche le bouton <strong>Partager</strong> de Safari
                <svg viewBox="0 0 24 24" aria-hidden="true" className="ios-share">
                  <path
                    d="M12 3v11m0-11-3.5 3.5M12 3l3.5 3.5M5.5 10H5a1.5 1.5 0 0 0-1.5 1.5v8A1.5 1.5 0 0 0 5 21h14a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 19 10h-.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </li>
              <li>
                Choisis <strong>« Sur l'écran d'accueil »</strong>
              </li>
            </ol>
            <button
              type="button"
              className="ios-sheet-close"
              onClick={() => setIosHelpOpen(false)}
            >
              Compris
            </button>
          </div>
        </div>
      )}

      <main className="app-main">
        {tab === 'map' && <MapTab />}
        {tab === 'program' && (
          <ProgramTab favorites={favorites} onToggleFavorite={toggle} />
        )}
        {tab === 'timeline' && (
          <TimelineTab favorites={favorites} onToggleFavorite={toggle} />
        )}
      </main>

      <nav className="tabbar" aria-label="Navigation principale">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`tabbar-btn${tab === t.key ? ' is-active' : ''}`}
            aria-current={tab === t.key ? 'page' : undefined}
            onClick={() => setTab(t.key)}
          >
            <TabIcon tab={t.key} />
            <span>{t.label}</span>
            {t.key === 'timeline' && favorites.size > 0 && (
              <span className="tabbar-badge">{favorites.size}</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
