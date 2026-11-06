import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { forceX, forceY } from 'd3-force'
import ForceGraph2D, { type ForceGraphMethods, type LinkObject, type NodeObject } from 'react-force-graph-2d'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { COLOR_HEX } from '@/lib/colors'
import { cn } from '@/lib/utils'
import * as api from './api'
import { colorsByName, LIBRARY_KEY, type Note } from './api'
import { LabelMark } from './LabelMark'
import {
  buildGraph,
  nodeColor,
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

const LABEL_ZOOM = 1
const LABEL_SIZE = 12
const BASE_RADIUS = 4
const DIMMED_ALPHA = 0.15
const FIT_PADDING = 48
const FIT_DURATION_MS = 400
// Stops a graph of just a few notes from filling the whole screen.
const MAX_ZOOM = 3
const CHARGE_STRENGTH = -220
const LINK_DISTANCE = 50
// Pulls unlinked notes toward the middle, so they do not drift off and shrink the view.
const GRAVITY = 0.06

const LABEL_LENGTH = 32

// Whole titles would run over each other, especially on a narrow screen.
const shortLabel = (title: string) => (title.length > LABEL_LENGTH ? `${title.slice(0, LABEL_LENGTH).trimEnd()}…` : title)

const GROUPINGS: { value: GraphGrouping; label: string }[] = [
  { value: 'folder', label: 'Папки' },
  { value: 'tag', label: 'Теги' },
]

const PALETTE = {
  light: { label: '#262626', link: 'rgba(0, 0, 0, 0.18)', linkActive: 'rgba(0, 0, 0, 0.6)' },
  dark: { label: '#e5e5e5', link: 'rgba(255, 255, 255, 0.18)', linkActive: 'rgba(255, 255, 255, 0.7)' },
}

const radiusOf = (node: Node) => BASE_RADIUS + Math.sqrt(node.degree) * 2

function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

const isDarkTheme = () => document.documentElement.classList.contains('dark')

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
  const dark = useSyncExternalStore(subscribeToTheme, isDarkTheme)

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
    () => ({ grouping, folderColors: colorsByName(folders.data), tagColors: colorsByName(tags.data) }),
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
  const palette = dark ? PALETTE.dark : PALETTE.light

  function isHighlighted(id: string, title: string) {
    if (hoveredId) return id === hoveredId || Boolean(neighbors.get(hoveredId)?.has(id))
    return query === '' || title.toLowerCase().includes(query)
  }

  function drawNode(node: Node, context: CanvasRenderingContext2D, scale: number) {
    const { x = 0, y = 0 } = node
    const radius = radiusOf(node)
    const highlighted = isHighlighted(String(node.id), node.title)

    context.globalAlpha = highlighted ? 1 : DIMMED_ALPHA
    context.beginPath()
    context.arc(x, y, radius, 0, 2 * Math.PI)
    context.fillStyle = COLOR_HEX[nodeColor(node, colorSource)]
    context.fill()

    const emphasized = hoveredId !== null || query !== ''
    if (scale >= LABEL_ZOOM || (emphasized && highlighted)) {
      const fontSize = LABEL_SIZE / scale
      context.font = `${fontSize}px sans-serif`
      context.textAlign = 'center'
      context.textBaseline = 'top'
      context.fillStyle = palette.label
      context.fillText(shortLabel(node.title), x, y + radius + 2 / scale)
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

  function finishLayout() {
    rememberPositions(data.nodes)
    if (fitted.current) return
    fitted.current = true
    graph.current?.zoomToFit(FIT_DURATION_MS, FIT_PADDING)
  }

  if (notes.isPending) {
    return <p className="p-6 text-sm text-muted-foreground">Строим граф…</p>
  }
  if (notes.isError) {
    return (
      <div className="flex flex-col items-start gap-3 p-6">
        <p className="text-sm text-muted-foreground">Не удалось загрузить заметки.</p>
        <Button variant="outline" size="sm" onClick={() => notes.refetch()}>
          Повторить
        </Button>
      </div>
    )
  }
  if (allNotes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">Заметок пока нет, поэтому показывать нечего.</p>
        <Button asChild variant="outline">
          <Link to="/diary/zen">Открыть дзен-режим</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-4 py-2">
        <Input
          type="search"
          aria-label="Найти заметку на графе"
          placeholder="Найти на графе"
          className="h-8 w-full sm:w-56"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <input type="checkbox" checked={linkedOnly} onChange={(event) => setLinkedOnly(event.target.checked)} />
          Только со связями
        </label>
        <p className="ml-auto text-xs text-muted-foreground">
          Заметок: {data.nodes.length} · связей: {data.links.length}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b px-4 py-1.5">
        <div role="group" aria-label="Чем раскрашивать граф" className="mr-2 flex shrink-0 gap-1 border-r pr-2">
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
                'rounded-md px-2 py-0.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
              'flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-xs outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
              group === name && 'bg-muted font-medium',
            )}
          >
            <LabelMark mark={mark} />
            {name}
          </button>
        ))}
      </div>

      {saveFailed && (
        <p role="alert" className="border-b px-4 py-2 text-sm text-destructive">
          Не удалось сохранить изменения.
        </p>
      )}

      <div
        ref={container}
        role="img"
        aria-label="Граф заметок и связей между ними"
        className="min-h-0 flex-1 overflow-hidden"
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
            linkColor={(link) => (linkActive(link) ? palette.linkActive : palette.link)}
            linkWidth={(link) => (linkActive(link) ? 2 : 1)}
            warmupTicks={100}
            cooldownTicks={100}
            onEngineStop={finishLayout}
            onNodeHover={(node) => setHoveredId(node ? String(node.id) : null)}
            onNodeClick={(node) => setOpened(allNotes.find((note) => note.id === node.id) ?? null)}
          />
        )}
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
