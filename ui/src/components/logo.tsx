import { type ComponentProps } from "solid-js"

export const Mark = (props: { class?: string }) => {
  return (
    <svg
      data-component="logo-mark"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Spider Legs Shadow */}
      <g stroke="var(--icon-weak-base)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" transform="translate(0, 2)">
        <path d="M26 22 L16 10 L12 18" />
        <path d="M38 22 L48 10 L52 18" />
        <path d="M24 28 L10 24 L6 34" />
        <path d="M40 28 L54 24 L58 34" />
        <path d="M24 34 L12 40 L8 50" />
        <path d="M40 34 L52 40 L56 50" />
        <path d="M26 40 L18 52 L22 60" />
        <path d="M38 40 L46 52 L42 60" />
      </g>
      {/* Spider Legs */}
      <g stroke="var(--icon-strong-base)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M26 22 L16 10 L12 18" />
        <path d="M38 22 L48 10 L52 18" />
        <path d="M24 28 L10 24 L6 34" />
        <path d="M40 28 L54 24 L58 34" />
        <path d="M24 34 L12 40 L8 50" />
        <path d="M40 34 L52 40 L56 50" />
        <path d="M26 40 L18 52 L22 60" />
        <path d="M38 40 L46 52 L42 60" />
      </g>
      {/* Shadow Body */}
      <path
        d="M29 20 L32 16 L35 20 L33 24 L31 24 Z"
        fill="var(--icon-weak-base)"
      />
      <path
        d="M27 25 L32 22 L37 25 L39 32 L32 34 L25 32 Z"
        fill="var(--icon-weak-base)"
      />
      <path
        d="M25 35 L32 33 L39 35 L42 45 C42 52 36 57 32 60 C28 57 22 52 22 45 Z"
        fill="var(--icon-weak-base)"
      />
      {/* Main Body */}
      <path
        d="M29 18 L32 14 L35 18 L33 22 L31 22 Z"
        fill="var(--icon-strong-base)"
      />
      <path
        d="M27 23 L32 20 L37 23 L39 30 L32 32 L25 30 Z"
        fill="var(--icon-strong-base)"
      />
      <path
        d="M25 33 L32 31 L39 33 L42 43 C42 50 36 55 32 58 C28 55 22 50 22 43 Z"
        fill="var(--icon-strong-base)"
      />
      {/* M4 Badge in Abdomen */}
      <g fill="var(--background-base, #18181b)">
        <path d="M26.5 38 H28.5 L30 41 L31.5 38 H33.5 V45 H32 V41.5 L30.5 44 H29.5 L28 41.5 V45 H26.5 Z" />
        <path d="M34.5 38 H36 V42 H37.5 V43.2 H36 V45 H34.5 V43.2 H33 V42.2 L34.5 38 Z M34.5 42 V40.2 L33.8 42 Z" />
      </g>
    </svg>
  )
}

export const Splash = (props: Pick<ComponentProps<"svg">, "ref" | "class">) => {
  return (
    <svg
      ref={props.ref}
      data-component="logo-splash"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Spider Legs Shadow */}
      <g stroke="var(--icon-weak-base)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" transform="translate(0, 2)">
        <path d="M26 22 L16 10 L12 18" />
        <path d="M38 22 L48 10 L52 18" />
        <path d="M24 28 L10 24 L6 34" />
        <path d="M40 28 L54 24 L58 34" />
        <path d="M24 34 L12 40 L8 50" />
        <path d="M40 34 L52 40 L56 50" />
        <path d="M26 40 L18 52 L22 60" />
        <path d="M38 40 L46 52 L42 60" />
      </g>
      {/* Spider Legs */}
      <g stroke="var(--icon-strong-base)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M26 22 L16 10 L12 18" />
        <path d="M38 22 L48 10 L52 18" />
        <path d="M24 28 L10 24 L6 34" />
        <path d="M40 28 L54 24 L58 34" />
        <path d="M24 34 L12 40 L8 50" />
        <path d="M40 34 L52 40 L56 50" />
        <path d="M26 40 L18 52 L22 60" />
        <path d="M38 40 L46 52 L42 60" />
      </g>
      {/* Shadow Body */}
      <path
        d="M29 20 L32 16 L35 20 L33 24 L31 24 Z"
        fill="var(--icon-weak-base)"
      />
      <path
        d="M27 25 L32 22 L37 25 L39 32 L32 34 L25 32 Z"
        fill="var(--icon-weak-base)"
      />
      <path
        d="M25 35 L32 33 L39 35 L42 45 C42 52 36 57 32 60 C28 57 22 52 22 45 Z"
        fill="var(--icon-weak-base)"
      />
      {/* Main Body */}
      <path
        d="M29 18 L32 14 L35 18 L33 22 L31 22 Z"
        fill="var(--icon-strong-base)"
      />
      <path
        d="M27 23 L32 20 L37 23 L39 30 L32 32 L25 30 Z"
        fill="var(--icon-strong-base)"
      />
      <path
        d="M25 33 L32 31 L39 33 L42 43 C42 50 36 55 32 58 C28 55 22 50 22 43 Z"
        fill="var(--icon-strong-base)"
      />
      {/* M4 Badge in Abdomen */}
      <g fill="var(--background-base, #18181b)">
        <path d="M26.5 38 H28.5 L30 41 L31.5 38 H33.5 V45 H32 V41.5 L30.5 44 H29.5 L28 41.5 V45 H26.5 Z" />
        <path d="M34.5 38 H36 V42 H37.5 V43.2 H36 V45 H34.5 V43.2 H33 V42.2 L34.5 38 Z M34.5 42 V40.2 L33.8 42 Z" />
      </g>
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
