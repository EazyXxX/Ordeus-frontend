import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { forceX, forceY } from 'd3-force'
import ForceGraph2D, { type ForceGraphMethods, type LinkObject, type NodeObject } from 'react-force-graph-2d'
import { Maximize } from 'lucide-react'
import { Link } from 'react-router'

import { t } from '@/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { COLOR_HEX } from '@/lib/colors'
import { cn } from '@/lib/utils'
import * as api from './api'
import { colorsByName, emojisByName, LIBRARY_KEY, type Note } from './api'
import { LabelMark } from './LabelMark'
import {
  buildGraph,
  nodeColor,
  nodeEmoji,
  nodeId,
  rememberPositions,
  type GraphGrouping,
  type GraphLink,
  type GraphNode,
} from './graph-data'
import { NoteDialog } from './NoteDialog'
import { useNoteActions } from './useNoteActions'

type Node = NodeObject<GraphNode>
type Edge = LinkObject<GraphNode, GraphLink>

const LABEL_ZOOM = 1.1
const LABEL_SIZE = 11
const BASE_RADIUS = 8
const DIMMED_ALPHA = 0.12
const FIT_PADDING = 80
const GLOW_SCALE = 5
const GLOW_SPRITE_SIZE = 128
const BREATH_SPEED = 1.4
const BREATH_DEPTH = 0.12
const PARTICLE_SPEED = 0.004
const FIT_DURATION_MS = 400
// Stops a graph of just a few notes from filling the whole screen.
const MAX_ZOOM = 3
const CHARGE_STRENGTH = -420
const LINK_DISTANCE = 80
// Pulls unlinked notes toward the middle, so they do not drift off and shrink the view.
const GRAVITY = 0.06

const LINK_CURVATURE = 0.12
const LABEL_LENGTH = 32

// Whole titles would run over each other, especially on a narrow screen.
const shortLabel = (title: string) => (title.length > LABEL_LENGTH ? `${title.slice(0, LABEL_LENGTH).trimEnd()}…` : title)

const GROUPINGS: { value: GraphGrouping; label: string }[] = [
  { value: 'folder', label: t('diary.folders') },
  { value: 'tag', label: t('diary.tags') },
]

type Palette = {
  label: string
  halo: string
  surface: string
  rim: string
  link: string
  linkActive: string
  linkDimmed: string
  particle: string
  glowAlpha: number
  blend: GlobalCompositeOperation
}

const PALETTE: Record<'light' | 'dark', Palette> = {
  light: {
    label: '#262626',
    halo: 'rgba(255, 255, 255, 0.9)',
    surface: '#ffffff',
    rim: 'rgba(0, 0, 0, 0.25)',
    link: 'rgba(0, 0, 0, 0.22)',
    linkActive: 'rgba(0, 0, 0, 0.7)',
    linkDimmed: 'rgba(0, 0, 0, 0.05)',
    particle: 'rgba(0, 0, 0, 0.55)',
    glowAlpha: 0.5,
    blend: 'source-over',
  },
  dark: {
    label: '#f5f5f5',
    halo: 'rgba(10, 10, 10, 0.85)',
    surface: '#171717',
    rim: 'rgba(255, 255, 255, 0.55)',
    link: 'rgba(255, 255, 255, 0.3)',
    linkActive: 'rgba(255, 255, 255, 0.95)',
    linkDimmed: 'rgba(255, 255, 255, 0.05)',
    particle: 'rgba(255, 255, 255, 0.85)',
    glowAlpha: 0.9,
    blend: 'lighter',
  },
}

// Glass panels that float over the graph.
const PANEL = 'pointer-events-auto rounded-xl border bg-background/70 shadow-sm backdrop-blur-md'

const radiusOf = (node: Node) => BASE_RADIUS + Math.sqrt(node.degree) * 2

const glowSprites = new Map<string, HTMLCanvasElement>()

// A radial gradient per node per frame is slow, so each color is painted once.
function glowSprite(color: string) {
  const saved = glowSprites.get(color)
  if (saved) return saved

  const sprite = document.createElement('canvas')
  sprite.width = sprite.height = GLOW_SPRITE_SIZE
  const middle = GLOW_SPRITE_SIZE / 2
  const context = sprite.getContext('2d')!
  const gradient = context.createRadialGradient(middle, middle, 0, middle, middle, middle)
  gradient.addColorStop(0, `${color}aa`)
  gradient.addColorStop(0.35, `${color}44`)
  gradient.addColorStop(1, `${color}00`)
  context.fillStyle = gradient
  context.fillRect(0, 0, GLOW_SPRITE_SIZE, GLOW_SPRITE_SIZE)
  glowSprites.set(color, sprite)
  return sprite
}

// Labels fade in with zoom, and well-connected notes get theirs first.
const labelFade = (scale: number, degree: number) => Math.min(1, Math.max(0, (scale + degree * 0.12 - LABEL_ZOOM) / 0.4))

let paletteCache = { theme: '', palette: PALETTE.light }

// Read while drawing, so switching the theme repaints without restarting the layout.
// Nodes and labels sit on the page's own background, which colored themes tint.
function currentPalette() {
  const root = document.documentElement
  if (root.className !== paletteCache.theme) {
    const base = root.classList.contains('dark') ? PALETTE.dark : PALETTE.light
    const background = getComputedStyle(root).getPropertyValue('--background').trim()
    paletteCache = {
      theme: root.className,
      palette: background ? { ...base, surface: background, halo: background } : base,
    }
  }
  return paletteCache.palette
}

// The graph draws on a canvas, which needs its size in pixels.
function useElementSize() {
  const [size, setSize] = useState({ width: 0, height: 0 })
  const observer = useRef<ResizeObserver | null>(null)

  const ref = useCallback((element: HTMLDivElement | null) => {
    observer.current?.disconnect()
    if (!element) return
    observer.current = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.current.observe(element)
  }, [])

  return { ref, size }
}

export function DiaryGraph() {
  const graph = useRef<ForceGraphMethods<GraphNode, GraphLink> | undefined>(undefined)
  const fitted = useRef(false)
  const { ref: container, size } = useElementSize()

  const [grouping, setGrouping] = useState<GraphGrouping>('folder')
  const [group, setGroup] = useState<string | null>(null)
  const [linkedOnly, setLinkedOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [opened, setOpened] = useState<Note | null>(null)
  const { saveFailed, saveNote, removeNote } = useNoteActions()

  const notes = useQuery({ queryKey: [...LIBRARY_KEY, 'notes', 'all'], queryFn: () => api.fetchNotes({}) })
  const folders = useQuery({ queryKey: [...LIBRARY_KEY, 'folders'], queryFn: api.fetchFolders })

  const tags = useQuery({ queryKey: [...LIBRARY_KEY, 'tags'], queryFn: api.fetchTags })

  const allNotes = useMemo(() => notes.data ?? [], [notes.data])
  const data = useMemo(() => buildGraph(allNotes, { grouping, group, linkedOnly }), [allNotes, grouping, group, linkedOnly])
  const colorSource = useMemo(
    () => ({
      grouping,
      folderColors: colorsByName(folders.data),
      tagColors: colorsByName(tags.data),
      folderEmojis: emojisByName(folders.data),
      tagEmojis: emojisByName(tags.data),
    }),
    [grouping, folders.data, tags.data],
  )
  const legend = (grouping === 'folder' ? folders.data : tags.data) ?? []

  const neighbors = useMemo(() => {
    const result = new Map<string, Set<string>>()
    for (const { source, target } of data.links) {
      const [a, b] = [nodeId(source), nodeId(target)]
      result.set(a, (result.get(a) ?? new Set()).add(b))
      result.set(b, (result.get(b) ?? new Set()).add(a))
    }
    return result
  }, [data])

  const hasSize = size.width > 0
  useEffect(() => {
    graph.current?.d3Force('charge')?.strength?.(CHARGE_STRENGTH)
    graph.current?.d3Force('link')?.distance?.(LINK_DISTANCE)
    graph.current?.d3Force('x', forceX(0).strength(GRAVITY))
    graph.current?.d3Force('y', forceY(0).strength(GRAVITY))
  }, [hasSize])

  const query = search.trim().toLowerCase()
  const still = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])

  function isHighlighted(id: string, title: string) {
    if (hoveredId) return id === hoveredId || Boolean(neighbors.get(hoveredId)?.has(id))
    return query === '' || title.toLowerCase().includes(query)
  }

  function drawNode(node: Node, context: CanvasRenderingContext2D, scale: number) {
    const { x = 0, y = 0 } = node
    const palette = currentPalette()
    const radius = radiusOf(node)
    const highlighted = isHighlighted(String(node.id), node.title)
    const hovered = node.id === hoveredId
    const color = COLOR_HEX[nodeColor(node, colorSource)]
    const emoji = nodeEmoji(node, colorSource)
    const alpha = highlighted ? 1 : DIMMED_ALPHA

    // Each node breathes at its own pace, so the graph feels alive at rest.
    const phase = (node.index ?? 0) * 1.7
    const breath = still ? 1 : 1 + Math.sin(performance.now() / 1000 * BREATH_SPEED + phase) * BREATH_DEPTH
    const glow = radius * GLOW_SCALE * breath * (hovered ? 1.5 : 1)

    context.globalAlpha = alpha * palette.glowAlpha
    context.globalCompositeOperation = palette.blend
    context.drawImage(glowSprite(color), x - glow / 2, y - glow / 2, glow, glow)
    context.globalCompositeOperation = 'source-over'

    context.globalAlpha = alpha
    context.beginPath()
    context.arc(x, y, radius, 0, 2 * Math.PI)
    context.fillStyle = emoji ? palette.surface : color
    context.fill()
    context.lineWidth = (hovered ? 2 : 1) / scale
    context.strokeStyle = emoji || hovered ? color : palette.rim
    context.stroke()

    if (emoji) {
      context.font = `${radius * 1.2}px sans-serif`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillStyle = palette.label
      context.fillText(emoji, x, y + radius * 0.06)
    }

    const emphasized = hoveredId !== null || query !== ''
    const label = emphasized && highlighted ? 1 : labelFade(scale, node.degree) * 0.8
    if (label > 0) {
      const fontSize = LABEL_SIZE / scale
      const text = shortLabel(node.title)
      const top = y + radius + 4 / scale
      context.globalAlpha = alpha * label
      context.font = `${hovered ? 600 : 500} ${fontSize}px "Geist Variable", sans-serif`
      context.textAlign = 'center'
      context.textBaseline = 'top'
      // A halo in the background color keeps a label readable over links.
      context.lineJoin = 'round'
      context.lineWidth = 4 / scale
      context.strokeStyle = palette.halo
      context.strokeText(text, x, top)
      context.fillStyle = palette.label
      context.fillText(text, x, top)
    }
    context.globalAlpha = 1
  }

  function paintHitArea(node: Node, color: string, context: CanvasRenderingContext2D) {
    context.fillStyle = color
    context.beginPath()
    context.arc(node.x ?? 0, node.y ?? 0, radiusOf(node) + 2, 0, 2 * Math.PI)
    context.fill()
  }

  function linkActive(link: Edge) {
    return hoveredId !== null && (nodeId(link.source as GraphNode) === hoveredId || nodeId(link.target as GraphNode) === hoveredId)
  }

  function linkColor(link: Edge) {
    const palette = currentPalette()
    if (hoveredId === null) return palette.link
    return linkActive(link) ? palette.linkActive : palette.linkDimmed
  }

  function finishLayout() {
    rememberPositions(data.nodes)
    if (fitted.current) return
    fitted.current = true
    graph.current?.zoomToFit(FIT_DURATION_MS, FIT_PADDING)
  }

  if (notes.isPending) {
    return <p className="p-6 text-sm text-muted-foreground">{t('graph.building')}</p>
  }
  if (notes.isError) {
    return (
      <div className="flex flex-col items-start gap-3 p-6">
        <p className="text-sm text-muted-foreground">{t('graph.loadFailed')}</p>
        <Button variant="outline" size="sm" onClick={() => notes.refetch()}>
          {t('common.retry')}
        </Button>
      </div>
    )
  }
  if (allNotes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">{t('graph.empty')}</p>
        <Button asChild variant="outline">
          <Link to="/diary/zen">{t('common.openZen')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {saveFailed && (
        <p role="alert" className="border-b px-4 py-2 text-sm text-destructive">
          {t('common.saveFailed')}
        </p>
      )}

      <div className="relative min-h-0 flex-1 overflow-hidden bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-size-[24px_24px]">
        <div
          ref={container}
          role="img"
          aria-label={t('graph.label')}
          className="absolute inset-0"
          onMouseLeave={() => setHoveredId(null)}
        >
          {hasSize && (
            <ForceGraph2D<GraphNode, GraphLink>
              ref={graph}
              width={size.width}
              height={size.height}
              graphData={data}
              backgroundColor="rgba(0, 0, 0, 0)"
              autoPauseRedraw={false}
              maxZoom={MAX_ZOOM}
              nodeRelSize={BASE_RADIUS}
              nodeLabel=""
              nodeCanvasObject={drawNode}
              nodePointerAreaPaint={paintHitArea}
              linkColor={linkColor}
              linkWidth={(link) => (linkActive(link) ? 1.8 : 1)}
              linkCurvature={LINK_CURVATURE}
              linkDirectionalParticles={still ? 0 : 1}
              linkDirectionalParticleWidth={(link) => (linkActive(link) ? 3 : 1.8)}
              linkDirectionalParticleSpeed={PARTICLE_SPEED}
              linkDirectionalParticleColor={() => currentPalette().particle}
              warmupTicks={100}
              cooldownTicks={100}
              onEngineStop={finishLayout}
              onNodeHover={(node) => setHoveredId(node ? String(node.id) : null)}
              onNodeClick={(node) => setOpened(allNotes.find((note) => note.id === node.id) ?? null)}
            />
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-center gap-2">
          <div className={cn(PANEL, 'w-full sm:w-60')}>
            <Input
              type="search"
              aria-label={t('graph.findNote')}
              placeholder={t('graph.find')}
              className="border-0 bg-transparent dark:bg-transparent"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <button
            type="button"
            aria-pressed={linkedOnly}
            onClick={() => setLinkedOnly(!linkedOnly)}
            className={cn(
              PANEL,
              'px-3 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring',
              linkedOnly ? 'font-medium' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t('graph.linkedOnly')}
          </button>
          <div className={cn(PANEL, 'ml-auto flex items-center gap-2 py-0.5 pr-0.5 pl-3 text-xs text-muted-foreground')}>
            <span className="tabular-nums">
              {data.nodes.length} · {data.links.length}
            </span>
            <span className="sr-only">{t('graph.counts')}</span>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={t('graph.fit')}
              onClick={() => graph.current?.zoomToFit(FIT_DURATION_MS, FIT_PADDING)}
            >
              <Maximize />
            </Button>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-center">
          <div className={cn(PANEL, 'flex max-w-full items-center gap-1 overflow-x-auto p-1 [scrollbar-width:none]')}>
            <div role="group" aria-label={t('graph.colorBy')} className="mr-1 flex shrink-0 gap-1 border-r pr-2">
              {GROUPINGS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={grouping === value}
                  onClick={() => {
                    setGrouping(value)
                    setGroup(null)
                  }}
                  className={cn(
                    'rounded-md px-2 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    grouping === value ? 'bg-muted font-medium' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {legend.map(({ id, name, ...mark }) => (
              <button
                key={id}
                type="button"
                aria-pressed={group === name}
                onClick={() => setGroup(group === name ? null : name)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
                  group === name && 'bg-muted font-medium',
                )}
              >
                <LabelMark mark={mark} />
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {opened && (
        <NoteDialog
          key={opened.id}
          note={opened}
          folders={folders.data ?? []}
          allNotes={allNotes}
          onClose={() => setOpened(null)}
          onSave={(input) => saveNote(opened, input)}
          onDelete={() => {
            removeNote(opened)
            setOpened(null)
          }}
        />
      )}
    </div>
  )
}
