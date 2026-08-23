import { computeFlowLayout } from '../../../packages/design-tokens/flowGeometry'

/**
 * Mapa de flujo del mes — la firma visual de Flujo.
 * El ingreso entra como un río que se bifurca en corrientes
 * (grosor = monto) hacia sus destinos.
 */
export default function FlowMap({ income, streams, formatValue }) {
  const fmt = formatValue || ((v) => v)
  const layout = computeFlowLayout({ income, streams })
  const { width, height, source, targetX, nodes } = layout

  if (!nodes.length) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <svg width="72" height="40" viewBox="0 0 72 40" fill="none" aria-hidden="true">
          <path d="M2 20 C 24 20, 30 8, 46 8 M2 20 C 24 20, 30 32, 46 32"
            stroke="#CFC7B2" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 7" />
          <circle cx="60" cy="8" r="5" fill="#E9E4D7" />
          <circle cx="60" cy="32" r="5" fill="#E9E4D7" />
        </svg>
        <p className="mt-3 text-sm text-ink-muted">
          Registra ingresos y egresos para ver el flujo de tu mes.
        </p>
      </div>
    )
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none" role="img"
      aria-label={`Mapa de flujo: ingreso distribuido en ${nodes.length} corrientes`}>
      {/* Corrientes */}
      {nodes.map((node, i) => (
        <path
          key={`${node.label}-${i}`}
          d={node.path}
          fill="none"
          stroke={node.color}
          strokeWidth={node.thickness}
          strokeLinecap="round"
          pathLength="1"
          className="animate-flow-draw"
          style={{ animationDelay: `${i * 90}ms`, opacity: 0.85 }}
        />
      ))}

      {/* Nodo origen: el ingreso */}
      <circle cx={source.x} cy={source.y} r="26" fill="#FFFFFF" stroke="#1B8A8F" strokeWidth="3" />
      <circle cx={source.x} cy={source.y} r="10" fill="#1B8A8F" />
      <text x={source.x} y={source.y - 38} textAnchor="middle"
        fontFamily="'Spline Sans Mono', monospace" fontSize="11" fontWeight="600"
        letterSpacing="2" fill="#6E8884">INGRESO</text>

      {/* Estaciones destino */}
      {nodes.map((node, i) => (
        <g key={`station-${node.label}-${i}`}>
          <circle cx={targetX + 6} cy={node.endY} r={Math.max(5, node.thickness / 2)} fill={node.color} />
          <text x={targetX + 22} y={node.endY - 4}
            fontFamily="'Instrument Sans', sans-serif" fontSize="14" fontWeight="600" fill="#123332">
            {node.label}
          </text>
          <text x={targetX + 22} y={node.endY + 13}
            fontFamily="'Spline Sans Mono', monospace" fontSize="12.5" fontWeight="500" fill="#6E8884">
            {fmt(node.value)} · {(node.ratio * 100).toFixed(0)}%
          </text>
        </g>
      ))}
    </svg>
  )
}
