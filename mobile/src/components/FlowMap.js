import React from 'react'
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg'
import { computeFlowLayout } from '@portal/design-tokens/flowGeometry'
import { fonts } from '../theme'

/**
 * Mapa de flujo del mes — firma visual de Flujo, versión nativa.
 * Mismos tokens y geometría que la versión web.
 */
export default function FlowMap({ income, streams, formatValue, width = 340 }) {
  const fmt = formatValue || ((v) => String(v))
  const height = Math.round(width * (340 / 800))
  const layout = computeFlowLayout({ income, streams, width, height })
  const { source, targetX, nodes } = layout

  if (!nodes.length) {
    return (
      <Svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ aspectRatio: width / height }}>
        <Path
          d={`M ${width * 0.08} ${height / 2} C ${width * 0.35} ${height / 2}, ${width * 0.4} ${height * 0.3}, ${width * 0.6} ${height * 0.3}`}
          stroke="#CFC7B2" strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray="1 7"
        />
        <Path
          d={`M ${width * 0.08} ${height / 2} C ${width * 0.35} ${height / 2}, ${width * 0.4} ${height * 0.7}, ${width * 0.6} ${height * 0.7}`}
          stroke="#CFC7B2" strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray="1 7"
        />
        <Circle cx={width * 0.66} cy={height * 0.3} r={5} fill="#E9E4D7" />
        <Circle cx={width * 0.66} cy={height * 0.7} r={5} fill="#E9E4D7" />
      </Svg>
    )
  }

  return (
    <Svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ aspectRatio: width / height }}>
      {nodes.map((node, i) => (
        <Path
          key={`flow-${node.label}-${i}`}
          d={node.path}
          stroke={node.color}
          strokeWidth={node.thickness}
          strokeLinecap="round"
          fill="none"
          opacity={0.85}
        />
      ))}

      {/* Nodo origen: el ingreso */}
      <Circle cx={source.x} cy={source.y} r={22} fill="#FFFFFF" stroke="#1B8A8F" strokeWidth={3} />
      <Circle cx={source.x} cy={source.y} r={8} fill="#1B8A8F" />
      <SvgText
        x={source.x} y={source.y - 32} textAnchor="middle"
        fontFamily={fonts.monoSemiBold} fontSize={10} letterSpacing={2} fill="#6E8884"
      >INGRESO</SvgText>

      {/* Estaciones destino */}
      {nodes.map((node, i) => (
        <React.Fragment key={`station-${node.label}-${i}`}>
          <Circle cx={targetX + 5} cy={node.endY} r={Math.max(4, node.thickness / 2)} fill={node.color} />
          <SvgText
            x={targetX + 18} y={node.endY - 3}
            fontFamily={fonts.bodyBold} fontSize={12} fill="#123332"
          >{node.label}</SvgText>
          <SvgText
            x={targetX + 18} y={node.endY + 11}
            fontFamily={fonts.monoMedium} fontSize={11} fill="#6E8884"
          >{fmt(node.value)} · {(node.ratio * 100).toFixed(0)}%</SvgText>
        </React.Fragment>
      ))}
    </Svg>
  )
}
