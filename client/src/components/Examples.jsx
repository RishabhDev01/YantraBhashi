import React from 'react'

export default function Examples({ onPick }) {
  return (
    <div className="examples">
      <button className="example-btn" onClick={()=>onPick('undecl')}>Undeclared use</button>
      <button className="example-btn" onClick={()=>onPick('badloop')}>Bad loop step</button>
      <button className="example-btn" onClick={()=>onPick('nobr')}>Brackets in strings</button>
    </div>
  )
}