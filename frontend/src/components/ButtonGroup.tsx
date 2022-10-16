import { useState } from 'react'

interface ButtonGroupProps<T> {
  options: {
    name: string,
    value: T,
  }[],
  onChange: (value: T) => any,
}

export default function ButtonGroup<T>({ options, onChange }: ButtonGroupProps<T & (string|number)>) {
  const [value, setValue] = useState(options?.[0]?.value)
  return (
    <div>
      {options && options.map(option => (
        <button
          key={option?.value}
          value={option?.value}
          onClick={() => {setValue(option?.value); onChange(option?.value);}}
          className={`border-2 transition py-1.5 px-6 m-0.5 rounded-full font-semibold ${value === option?.value ? 'bg-blue-600 border-blue-600 text-white' : 'bg-none border-blue-200 hover:bg-blue-100'}`}
        >
          {option?.name}
        </button>
      ))}
    </div>
  )
}