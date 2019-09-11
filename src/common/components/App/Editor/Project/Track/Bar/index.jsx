import React from 'react'
import { actions as draftActions } from '../../../../../../reducers/drafts'
import { useDispatch } from '../../../../../../helpers/react'
import { roundToNDecimals } from '../../../../../../helpers/number'

const { setBarStartTime, setBarEvents } = draftActions

const Bar = props => {
  const { startTime, events, projectIdx, barIdx } = props
  const dispatch = useDispatch()
  return (
    <div className={'Bar'}>
      startTime:{' '}
      <input
        type="number"
        min="0"
        value={startTime}
        onChange={e => {
          if (!isNaN(parseFloat(e.target.value))) {
            dispatch(
              setBarStartTime({
                projectIdx,
                barIdx,
                startTime: roundToNDecimals(3, parseFloat(e.target.value))
              })
            )
          }
        }}
      />
      <br />
      <textarea
        value={JSON.stringify(events, null, 2)}
        onChange={e => {
          try {
            dispatch(
              setBarEvents({
                projectIdx,
                barIdx,
                events: JSON.parse(e.target.value)
              })
            )
          } catch (error) {}
        }}
      />
    </div>
  )
}

export default Bar
