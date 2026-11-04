import type { Color } from '@/lib/colors'
import type { Note } from './api'

export type GraphNode = {
  id: string
  title: string
  folder: string
  tags: string[]
  degree: number
  x?: number
  y?: number
}

export type GraphLink = {
  // The graph library replaces these ids with node objects once it starts.
  source: string | GraphNode
  target: string | GraphNode
}

export type GraphData = {
  nodes: GraphNode[]
  links: GraphLink[]
}

const NEUTRAL_COLOR: Color = 'gray'

// Survives re-renders and tab switches, so an edit does not reshuffle the graph.
const positions = new Map<string, { x: number; y: number }>()

export function rememberPositions(nodes: GraphNode[]) {
  for (const { id, x, y } of nodes) {
    if (x !== undefined && y !== undefined) positions.set(id, { x, y })
  }
}

export type GraphGrouping = 'folder' | 'tag'

type GraphOptions = {
  grouping: GraphGrouping
  group: string | null
  linkedOnly: boolean
}

export type ColorSource = {
  grouping: GraphGrouping
  folderColors: Map<string, Color>
  tagColors: Map<string, Color>
}

// Read while drawing, so repainting a folder does not restart the layout.
export function nodeColor(node: GraphNode, { grouping, folderColors, tagColors }: ColorSource) {
  if (grouping === 'folder') return folderColors.get(node.folder) ?? NEUTRAL_COLOR
  // A note can have several tags, so it takes the first one that was painted.
  const painted = node.tags.map((tag) => tagColors.get(tag)).find((color) => color && color !== NEUTRAL_COLOR)
  return painted ?? NEUTRAL_COLOR
}

function belongsToGroup(note: Note, grouping: GraphGrouping, group: string) {
  return grouping === 'folder' ? note.folder === group : note.tags.includes(group)
}

export function buildGraph(notes: Note[], { grouping, group, linkedOnly }: GraphOptions): GraphData {
  const included = group === null ? notes : notes.filter((note) => belongsToGroup(note, grouping, group))
  const ids = new Set(included.map((note) => note.id))

  // Each link is listed on both of its notes, so a pair is kept only once.
  const pairs = new Map<string, GraphLink>()
  for (const note of included) {
    for (const link of note.links) {
      if (!ids.has(link.id)) continue
      const [source, target] = [note.id, link.id].sort()
      pairs.set(`${source}:${target}`, { source, target })
    }
  }

  const degree = new Map<string, number>()
  for (const { source, target } of pairs.values()) {
    for (const id of [source, target] as string[]) degree.set(id, (degree.get(id) ?? 0) + 1)
  }

  const nodes = included
    .filter((note) => !linkedOnly || degree.has(note.id))
    .map((note) => ({
      id: note.id,
      title: note.title,
      folder: note.folder,
      tags: note.tags,
      degree: degree.get(note.id) ?? 0,
      ...positions.get(note.id),
    }))

  return { nodes, links: [...pairs.values()] }
}

export function nodeId(end: string | GraphNode) {
  return typeof end === 'string' ? end : end.id
}
