import React, { useCallback } from 'react'
import { actions as draftActions } from '../../../../../../reducers/drafts'
import { useDispatch } from '../../../../../../helpers/react'
import { roundToNDecimals } from '../../../../../../helpers/number'

const { setBarProperty } = draftActions

const Bar = props => {
  const { startTime, events, projectIdx, id } = props
  const dispatch = useDispatch()

  const onStartTimeChange = useCallback(e => {
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
  }, [])

  const onEventChange = useCallback(e => {
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
  }, [])

  return (
    <div className="Bar">
      startTime: <input type="number" min="0" value={startTime} onChange={onStartTimeChange} />
      <br />
      <textarea value={JSON.stringify(events, null, 2)} onChange={onEventChange} />
    </div>
  )
}

export default Bar
