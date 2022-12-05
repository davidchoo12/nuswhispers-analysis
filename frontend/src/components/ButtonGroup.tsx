import { useState } from 'react'

interface ButtonGroupProps<T> {
  options: {
    name: string
    value: T
  }[]
  onChange: (value: T) => any
}

export default function ButtonGroup<T>({ options, onChange }: ButtonGroupProps<T & (string | number)>) {
  const [value, setValue] = useState(options?.[0]?.value)

  return (
    <div className="my-5 text-center">
      {options &&
        options.map((option) => (
          <button
            key={option?.value}
            value={option?.value}
            onClick={() => {
              setValue(option?.value)
              onChange(option?.value)
            }}
            className={`border-2 border-emerald-600 transition py-1.5 px-4 mr-3 my-1 rounded-lg font-semibold ${
              value === option?.value
                ? 'bg-emerald-600 text-primary-bright'
                : 'bg-none hover:bg-emerald-200 hover:dark:bg-emerald-800'
            }`}
          >
            {option?.name}
          </button>
        ))}
    </div>
  )
}
