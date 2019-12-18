import React, { useCallback } from 'react'
import { compose, prop, reduce, evolve, append, findIndex, propEq, remove, pluck, multiply, map } from 'ramda'
import { actions as draftActions } from '../../../../../../reducers/drafts'
import { useDispatch } from '../../../../../../helpers/react'
import { roundToNDecimals, maxAll } from '../../../../../../helpers/number'

const { setBarProperty } = draftActions

// input: [{ time: 0, event: 'note on, pitch: 6500, velocity: 0.5 }, { time: 1, event: 'note off', pitch: 6500 }, ...]
// output: [{ from: 0, pitch: 6500, to: 1}, ...]
// NOTE: "note on" events need to be before "note off" events.
const getNotesFromEvents = bars => {
  return compose(
    prop('pairs'),
    reduce(
      (acc, curr) => {
        if (curr.event === 'note on') {
          return evolve({
            opened: append(curr)
          })(acc)
        }

        if (curr.event === 'note off') {
          const idx = findIndex(propEq('pitch', curr.pitch), acc.opened)
          if (idx !== -1) {
            const noteOnEvent = acc.opened[idx]
            return evolve(
              {
                opened: remove(idx, 1),
                pairs: append({
                  from: noteOnEvent.time,
                  to: curr.time,
                  pitch: noteOnEvent.pitch
                })
              },
              acc
            )
          }
        }

        return acc
      },
      { opened: [], pairs: [] }
    )
  )(bars)
}

const Bar = props => {
  const { startTime, events, projectIdx, id } = props

  const dispatch = useDispatch()

  const onStartTimeChange = useCallback(
    e => {
      if (!isNaN(parseFloat(e.target.value))) {
        dispatch(
          setBarProperty({
            projectIdx,
            barId: id,
            property: 'startTime',
            value: roundToNDecimals(3, parseFloat(e.target.value))
          })
        )
      }
    },
    [projectIdx, id]
  )

  const onEventChange = useCallback(
    e => {
      try {
        dispatch(
          setBarProperty({
            projectIdx,
            barId: id,
            property: 'events',
            value: JSON.parse(e.target.value)
          })
        )
      } catch (error) {}
    },
    [projectIdx, id]
  )

  const scale = 50
  const notes = map(
    evolve({
      from: multiply(scale),
      to: multiply(scale)
    }),
    getNotesFromEvents(events)
  )
  const barWidth = maxAll(pluck('to', notes))

  return (
    <div className="Bar">
      startTime: <input type="number" min="0" value={startTime} onChange={onStartTimeChange} />
      <br />
      <textarea value={JSON.stringify(events, null, 2)} onChange={onEventChange} />
      <svg width={barWidth} heigth={50} style={{ position: 'absolute', left: startTime * scale }}>
        <rect width={barWidth} height={50} style={{ fill: 'lightblue' }} />
        {notes.map(({ from, to, pitch }, idx) => {
          return (
            <rect key={idx} x={from} y={pitch / (8000 / 50)} width={to - from} height={5} style={{ fill: 'yellow' }} />
          )
        })}
      </svg>
    </div>
  )
}

export default Bar
