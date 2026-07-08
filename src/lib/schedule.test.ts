import { describe, expect, it } from 'vitest'
import { eventStartDate } from './schedule'
import type { FestEvent } from '../types'

function makeEvent(overrides: Partial<FestEvent>): FestEvent {
  return {
    id: 'test-event',
    title: 'Test',
    artist: null,
    day: 'sam',
    start: '21:00',
    end: '22:00',
    venue: 'Scène test',
    category: 'concert',
    subtype: null,
    description: null,
    ...overrides,
  }
}

describe('eventStartDate', () => {
  it('retourne la date calendaire du jour de grille pour un créneau normal', () => {
    const event = makeEvent({ day: 'sam', start: '21:00' })
    const result = eventStartDate(event)

    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(6) // juillet = index 6
    expect(result.getDate()).toBe(18)
    expect(result.getHours()).toBe(21)
    expect(result.getMinutes()).toBe(0)
  })

  it('bascule sur le jour calendaire suivant pour un créneau après minuit', () => {
    const event = makeEvent({ day: 'ven', start: '00:40' })
    const result = eventStartDate(event)

    expect(result.getDate()).toBe(18) // nuit de vendredi 17 -> samedi 18
    expect(result.getHours()).toBe(0)
    expect(result.getMinutes()).toBe(40)
  })
})
