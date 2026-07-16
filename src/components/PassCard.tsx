import { useRef, useState } from 'react'
import { usePass } from '../hooks/usePass'

export function PassCard() {
  const { pass, importFile, clear } = usePass()
  const inputRef = useRef<HTMLInputElement>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [error, setError] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) {
      return
    }
    try {
      setError(false)
      await importFile(file)
    } catch {
      setError(true)
    }
  }

  return (
    <section className="group-panel pass-card" aria-label="Mon pass festival">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="pass-input"
        onChange={(e) => void handleChange(e)}
      />
      {pass ? (
        <>
          <h2 className="group-title">Mon pass</h2>
          <button
            type="button"
            className="pass-preview"
            onClick={() => setFullscreen(true)}
          >
            <img src={pass} alt="Ton pass festival importé, appuie pour l'afficher en plein écran" />
          </button>
          <div className="group-actions">
            <button type="button" className="group-btn" onClick={() => inputRef.current?.click()}>
              Remplacer
            </button>
            <button
              type="button"
              className="group-btn group-btn-ghost"
              onClick={() => {
                if (window.confirm('Supprimer le pass importé ?')) {
                  clear()
                }
              }}
            >
              Supprimer
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 className="group-title">Mon pass</h2>
          <p className="group-hint">
            Importe une photo ou une capture d'écran de ton billet (avec son QR code ou
            son code-barre) : il reste stocké uniquement sur ton téléphone, même sans
            réseau, pour l'entrée du festival.
          </p>
          <div className="group-actions">
            <button type="button" className="group-btn" onClick={() => inputRef.current?.click()}>
              Importer mon pass
            </button>
          </div>
        </>
      )}
      {error && <p className="pass-error">Impossible d'importer cette image, réessaie.</p>}
      {fullscreen && pass && (
        <div
          className="pass-backdrop"
          role="button"
          tabIndex={0}
          aria-label="Fermer l'affichage plein écran"
          onClick={() => setFullscreen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setFullscreen(false)
            }
          }}
        >
          <img src={pass} alt="Ton pass festival" className="pass-fullscreen" />
        </div>
      )}
    </section>
  )
}
