export type Day = 'ven' | 'sam' | 'dim'

export type Category =
  | 'concert'
  | 'bal'
  | 'spectacle'
  | 'conference'
  | 'atelier'
  | 'imaginarium'
  | 'balade'
  | 'radio'
  | 'famille'

export type VenueGroup = 'programmation' | 'accueil' | 'bienetre' | 'vente'

export interface FestEvent {
  id: string
  title: string
  artist: string | null
  day: Day
  start: string
  end: string | null
  venue: string
  category: Category
  subtype: string | null
  description: string | null
}

export interface Venue {
  num: number
  name: string
  group: VenueGroup
}
