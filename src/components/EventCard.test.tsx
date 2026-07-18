import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { EventCard } from './EventCard'
import type { FestEvent } from '../types'

function makeEvent(overrides: Partial<FestEvent> = {}): FestEvent {
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

function renderCard(overrides: Partial<FestEvent> = {}, isFavorite = false) {
  const event = makeEvent(overrides)
  const onToggleFavorite = vi.fn()
  render(
    <EventCard event={event} isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} />,
  )
  return { event, onToggleFavorite }
}

describe('EventCard — pills', () => {
  it('affiche l’horaire au format « 21h00 – 22h00 »', () => {
    renderCard()
    expect(screen.getByText('21h00 – 22h00')).toHaveClass('pill-time')
  })

  it('affiche le subtype en pill quand il existe', () => {
    renderCard({ subtype: 'chanson française' })
    expect(screen.getByText('chanson française')).toHaveClass('pill-cat')
  })

  it('retombe sur le label de catégorie sans subtype', () => {
    renderCard({ category: 'concert', subtype: null })
    expect(screen.getByText('Concerts')).toHaveClass('pill-cat')
  })
})

describe('EventCard — détails dépliables', () => {
  it('ne propose pas « En savoir plus » sans description', () => {
    renderCard({ description: null })
    expect(screen.queryByRole('button', { name: 'En savoir plus' })).not.toBeInTheDocument()
  })

  it('déplie puis replie la description', () => {
    renderCard({ description: 'Un concert sous la pluie.' })
    const button = screen.getByRole('button', { name: 'En savoir plus' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Un concert sous la pluie.')).not.toBeInTheDocument()

    fireEvent.click(button)
    expect(button).toHaveTextContent('Réduire')
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Un concert sous la pluie.')).toBeInTheDocument()

    fireEvent.click(button)
    expect(button).toHaveTextContent('En savoir plus')
    expect(screen.queryByText('Un concert sous la pluie.')).not.toBeInTheDocument()
  })

  it('affiche les recommandations une fois déplié', () => {
    renderCard({
      description: 'desc',
      recommendations: ['La Femme', 'Feu! Chatterton'],
    })
    fireEvent.click(screen.getByRole('button', { name: 'En savoir plus' }))
    expect(screen.getByText('Tu aimeras si tu aimes')).toBeInTheDocument()
    expect(screen.getByText('La Femme')).toHaveClass('card-recs-tag')
    expect(screen.getByText('Feu! Chatterton')).toHaveClass('card-recs-tag')
  })

  it('affiche les bios des intervenant·es une fois déplié', () => {
    renderCard({ description: 'desc', speakers: ['Camille, sociologue.'] })
    fireEvent.click(screen.getByRole('button', { name: 'En savoir plus' }))
    expect(screen.getByText('Intervenant·es')).toBeInTheDocument()
    expect(screen.getByText('Camille, sociologue.')).toHaveClass('card-speaker-bio')
  })

  it('n’affiche ni recommandations ni intervenant·es quand absents', () => {
    renderCard({ description: 'desc' })
    fireEvent.click(screen.getByRole('button', { name: 'En savoir plus' }))
    expect(screen.queryByText('Tu aimeras si tu aimes')).not.toBeInTheDocument()
    expect(screen.queryByText('Intervenant·es')).not.toBeInTheDocument()
  })
})

describe('EventCard — favori et copains', () => {
  it('remonte le toggle avec l’id de l’événement', () => {
    const { event, onToggleFavorite } = renderCard({ title: 'MIOSSEC' })
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter « MIOSSEC » à ma timeline' }))
    expect(onToggleFavorite).toHaveBeenCalledWith(event.id)
  })

  it('reflète l’état favori sur le parapluie', () => {
    renderCard({ title: 'MIOSSEC' }, true)
    const umbrella = screen.getByRole('button', {
      name: 'Retirer « MIOSSEC » de ma timeline',
    })
    expect(umbrella).toHaveAttribute('aria-pressed', 'true')
    expect(umbrella).toHaveClass('is-open')
  })

  it('affiche les chips des copains quand ils sont fournis', () => {
    const event = makeEvent()
    render(
      <EventCard
        event={event}
        isFavorite={false}
        onToggleFavorite={vi.fn()}
        friends={['Léa', 'Max']}
      />,
    )
    expect(screen.getByText('Léa')).toHaveClass('friend-chip')
    expect(screen.getByText('Max')).toHaveClass('friend-chip')
  })

  it('n’affiche pas la rangée copains sans amis', () => {
    const { container } = render(
      <EventCard event={makeEvent()} isFavorite={false} onToggleFavorite={vi.fn()} friends={[]} />,
    )
    expect(container.querySelector('.card-group-row')).not.toBeInTheDocument()
  })
})
