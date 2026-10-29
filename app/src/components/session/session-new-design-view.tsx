import type { JSX } from "solid-js"
import { NEW_SESSION_CONTENT_WIDTH } from "@/pages/session/new-session-layout"

export function NewSessionDesignView(props: { children: JSX.Element }) {
  return (
    <div data-component="session-new-design" class="relative size-full overflow-hidden bg-[var(--background-base)] text-[var(--text-base)]">
      <div class="absolute inset-x-0 top-[31%] flex justify-center px-6">
        <div class={`${NEW_SESSION_CONTENT_WIDTH} flex flex-col items-center`}>
          <h1 class="text-center text-[28px] font-medium leading-tight text-[var(--text-base)]">What should we build in m4spider?</h1>
          <div class="mt-11 w-full">{props.children}</div>
        </div>
      </div>
    </div>
  )
}
