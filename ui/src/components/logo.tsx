import { type ComponentProps } from "solid-js"

export const Mark = (props: { class?: string }) => {
  return (
    <svg
      data-component="logo-mark"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path data-slot="logo-logo-mark-shadow" d="M12 16H4V8H12V16Z" fill="var(--icon-weak-base)" />
      <path data-slot="logo-logo-mark-o" d="M12 4H4V16H12V4ZM16 20H0V0H16V20Z" fill="var(--icon-strong-base)" />
    </svg>
  )
}

export const Splash = (props: Pick<ComponentProps<"svg">, "ref" | "class">) => {
  return (
    <svg
      ref={props.ref}
      data-component="logo-splash"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 80 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M60 80H20V40H60V80Z" fill="var(--icon-base)" />
      <path d="M60 20H20V80H60V20ZM80 100H0V0H80V100Z" fill="var(--icon-strong-base)" />
    </svg>
  )
}

export const Logo = (props: { class?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 222 42"
      fill="none"
      classList={{ [props.class ?? ""]: !!props.class }}
    >
      <g>
        {/* M shadow */}
        <path d="M0 18H6V36H0ZM18 18H24V36H18ZM0 18L6 6L12 12L18 6L24 18H0ZM0 42H24V36H0Z" fill="var(--icon-weak-base)" />
        {/* M body */}
        <path d="M0 12H6V30H0ZM18 12H24V30H18ZM0 12L6 0L12 6L18 0L24 12H0ZM0 36H24V30H0Z" fill="var(--icon-base)" />

        {/* 4 shadow */}
        <path d="M36 12H42V24H36ZM30 24H48V30H30ZM42 12H48V42H42Z" fill="var(--icon-weak-base)" />
        {/* 4 body */}
        <path d="M36 6H42V18H36ZM30 18H48V24H30ZM42 6H48V36H42Z" fill="var(--icon-base)" />

        {/* s shadow */}
        <path d="M54 12H78V18H54ZM54 18H60V24H54ZM54 24H78V30H54ZM72 30H78V36H72ZM54 36H78V42H54Z" fill="var(--icon-weak-base)" />
        {/* s body */}
        <path d="M54 6H78V12H54ZM54 12H60V18H54ZM54 18H78V24H54ZM72 24H78V30H72ZM54 30H78V36H54Z" fill="var(--icon-strong-base)" />

        {/* p shadow */}
        <path d="M84 12H90V42H84ZM84 12H108V18H84ZM102 12H108V24H102ZM84 24H108V30H84Z" fill="var(--icon-weak-base)" />
        {/* p body */}
        <path d="M84 6H90V36H84ZM84 6H108V12H84ZM102 6H108V18H102ZM84 18H108V24H84Z" fill="var(--icon-strong-base)" />

        {/* i shadow */}
        <path d="M114 18H120V42H114ZM114 12H120V18H114Z" fill="var(--icon-weak-base)" />
        {/* i body */}
        <path d="M114 12H120V36H114ZM114 6H120V12H114Z" fill="var(--icon-strong-base)" />

        {/* d shadow */}
        <path d="M150 12H156V42H150ZM132 12H156V18H132ZM132 12H138V24H132ZM132 24H156V30H132Z" fill="var(--icon-weak-base)" />
        {/* d body */}
        <path d="M150 6H156V36H150ZM132 6H156V12H132ZM132 6H138V18H132ZM132 18H156V24H132Z" fill="var(--icon-strong-base)" />

        {/* e shadow */}
        <path d="M162 12H186V18H162ZM162 12H168V42H162ZM162 24H186V30H162ZM180 30H186V36H180ZM162 36H186V42H162Z" fill="var(--icon-weak-base)" />
        {/* e body */}
        <path d="M162 6H186V12H162ZM162 6H168V36H162ZM162 18H186V24H162ZM180 24H186V36H180ZM162 30H186V36H162Z" fill="var(--icon-strong-base)" />

        {/* r shadow */}
        <path d="M192 12H198V42H192ZM192 12H216V18H192ZM210 12H216V24H210Z" fill="var(--icon-weak-base)" />
        {/* r body */}
        <path d="M192 6H198V36H192ZM192 6H216V12H192ZM210 6H216V18H210Z" fill="var(--icon-strong-base)" />
      </g>
    </svg>
  )
}
