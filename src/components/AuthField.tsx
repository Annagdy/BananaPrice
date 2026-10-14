import type { InputHTMLAttributes, ReactNode } from 'react'

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string
  label: string
  /** Ícone à esquerda do input */
  icon: ReactNode
  /** Elemento à direita do label (ex.: "Esqueceu a senha?") */
  labelRight?: ReactNode
  /** Elemento dentro do input, à direita (ex.: botão do olho) */
  inputRight?: ReactNode
  /** Conteúdo logo abaixo do input (ex.: barra de força da senha) */
  below?: ReactNode
  error?: string
}

export default function AuthField({
  id,
  label,
  icon,
  labelRight,
  inputRight,
  below,
  error,
  ...inputProps
}: AuthFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs tracking-[.36px] text-bp-muted">
          {label}
        </label>
        {labelRight}
      </div>

      <div className="relative">
        <span className="absolute left-[17px] top-1/2 grid -translate-y-1/2 text-bp-muted/60">
          {icon}
        </span>
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-erro` : undefined}
          {...inputProps}
          className={`w-full rounded-full border bg-bp-input px-11 py-[9px] text-sm text-bp-text outline-none placeholder:text-bp-muted/40 focus:border-bp-primary ${
            error ? 'border-[#e5484d]' : 'border-transparent'
          }`}
        />
        {inputRight}
      </div>

      {below}
      {error && (
        <span id={`${id}-erro`} role="alert" className="pl-3 text-[11px] text-[#ff8a8e]">
          {error}
        </span>
      )}
    </div>
  )
}
