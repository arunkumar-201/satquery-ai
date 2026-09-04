import { useState } from 'react'

export default function TypingIndicator() {
  const [dots] = useState([0, 1, 2])

  return (
    <div className="flex items-center gap-1.5 p-3 bg-space-800/70 rounded-2xl rounded-tl-sm w-fit">
      <span className="text-xs text-space-500 mr-1">AI is analyzing</span>
      {dots.map((dot) => (
        <span
          key={dot}
          className="h-2 w-2 bg-accent-cyan rounded-full animate-bounce"
          style={{ animationDelay: `${dot * 150}ms` }}
        />
      ))}
    </div>
  )
}