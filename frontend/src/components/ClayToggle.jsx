export default function ClayToggle({ id, checked, onChange, label }) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 cursor-pointer select-none group w-full">
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`w-11 h-6 rounded-full transition-all duration-300 ${
          checked
            ? 'bg-gradient-to-r from-primary-400 to-primary-500 shadow-clay-sm'
            : 'bg-[#e0d4c4] shadow-clay-inset'
        }`}>
          <div className={`w-[18px] h-[18px] rounded-full bg-[#f5ebe0] shadow-clay-sm transition-all duration-300 absolute top-[3px] ${
            checked ? 'left-[23px]' : 'left-[3px]'
          }`} />
        </div>
      </div>
      <span className="text-sm font-medium text-dark-600 group-hover:text-dark-800 transition-colors">
        {label}
      </span>
    </label>
  )
}
