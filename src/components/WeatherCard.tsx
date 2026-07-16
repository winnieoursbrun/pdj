import { DAYS, DAY_LONG } from '../lib/schedule'
import { describeWeatherCode, isFestivalOver } from '../lib/weather'
import { useWeather } from '../hooks/useWeather'

export function WeatherCard() {
  const { status, days } = useWeather()

  if (isFestivalOver()) {
    return null
  }

  return (
    <section className="group-panel weather-card" aria-label="Météo du festival">
      <h2 className="group-title">Météo</h2>

      {status === 'loading' && <p className="group-hint">Chargement de la météo…</p>}

      {status === 'error' && <p className="group-hint">Météo indisponible pour le moment.</p>}

      {days.length > 0 && (
        <ul className="weather-days">
          {DAYS.map((d) => {
            const day = days.find((w) => w.date === `2026-07-${d.date}`)
            if (!day) {
              return null
            }
            const { icon, label } = describeWeatherCode(day.weatherCode)
            return (
              <li key={d.key} className="weather-day">
                <span className="weather-day-label">{DAY_LONG[d.key]}</span>
                <span className="weather-icon" role="img" aria-label={label}>
                  {icon}
                </span>
                <span className="weather-temps">
                  {Math.round(day.tempMin)}° – {Math.round(day.tempMax)}°
                </span>
                <span className="weather-rain">💧 {Math.round(day.precipitationProbability)}%</span>
              </li>
            )
          })}
        </ul>
      )}

      {status === 'stale' && days.length > 0 && (
        <p className="weather-stale-note">Dernières données disponibles (mise à jour indisponible)</p>
      )}
    </section>
  )
}
