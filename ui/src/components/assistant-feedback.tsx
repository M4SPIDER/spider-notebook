import { createSignal, Show } from "solid-js"
import { useI18n } from "../context/i18n"
import { Tooltip } from "./tooltip"

const GITHUB_ISSUE_URL = "https://github.com/M4SPIDER/spider-notebook/issues/new?template=bug_report.yml"

function HeartIcon(props: { filled?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={props.filled ? "currentColor" : "none"} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function ThumbsUpIcon(props: { filled?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={props.filled ? "currentColor" : "none"} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  )
}

function ThumbsDownIcon(props: { filled?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={props.filled ? "currentColor" : "none"} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  )
}

function FlagIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  )
}

function loadFeedback(messageID: string): { liked: boolean; loved: boolean } {
  try {
    const raw = localStorage.getItem(`opencode.feedback.${messageID}`)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { liked: false, loved: false }
}

function saveFeedback(messageID: string, data: { liked: boolean; loved: boolean }) {
  localStorage.setItem(`opencode.feedback.${messageID}`, JSON.stringify(data))
}

function buildDislikeUrl(messageID: string, feedback: string): string {
  const title = encodeURIComponent("AI Content Issue")
  const body = encodeURIComponent(
    `**Message ID:** ${messageID}\n\n**Feedback:**\n${feedback}\n\n---\n*This report was submitted via the M4 Spider Notebook feedback button.*`
  )
  return `${GITHUB_ISSUE_URL}&title=${title}&body=${body}`
}

export function AssistantFeedbackBar(props: {
  messageID: string
  onRegenerate?: () => void
  textContent?: string
}) {
  const i18n = useI18n()
  const [feedback, setFeedback] = createSignal(loadFeedback(props.messageID))
  const [showDislikeForm, setShowDislikeForm] = createSignal(false)
  const [dislikeText, setDislikeText] = createSignal("")

  const toggleLove = () => {
    const next = { ...feedback(), loved: !feedback().loved }
    if (next.loved) next.liked = false
    setFeedback(next)
    saveFeedback(props.messageID, next)
  }

  const toggleLike = () => {
    const next = { ...feedback(), liked: !feedback().liked }
    if (next.liked) next.loved = false
    setFeedback(next)
    saveFeedback(props.messageID, next)
  }

  const handleDislikeClick = () => {
    if (showDislikeForm()) {
      setShowDislikeForm(false)
      setDislikeText("")
      return
    }
    setShowDislikeForm(true)
  }

  const handleDislikeSubmit = () => {
    const text = dislikeText().trim()
    if (!text) return
    const url = buildDislikeUrl(props.messageID, text)
    window.open(url, "_blank", "noopener,noreferrer")
    setShowDislikeForm(false)
    setDislikeText("")
  }

  const handleDislikeCancel = () => {
    setShowDislikeForm(false)
    setDislikeText("")
  }

  const handleCopy = async () => {
    if (props.textContent) {
      await navigator.clipboard?.writeText(props.textContent)
    }
  }

  return (
    <div data-slot="assistant-feedback-bar">
      <div data-slot="assistant-feedback-buttons">
        <Show when={props.onRegenerate}>
          <Tooltip value={i18n.t("ui.message.regenerate")} placement="top" gutter={4}>
            <button
              data-slot="assistant-feedback-btn"
              onClick={props.onRegenerate}
              aria-label={i18n.t("ui.message.regenerate")}
            >
              <RefreshIcon />
            </button>
          </Tooltip>
        </Show>

        <Tooltip
          value={feedback().loved ? i18n.t("ui.message.loved") : i18n.t("ui.message.love")}
          placement="top"
          gutter={4}
        >
          <button
            data-slot="assistant-feedback-btn"
            data-active={feedback().loved ? "" : undefined}
            onClick={toggleLove}
            aria-label={i18n.t("ui.message.love")}
          >
            <HeartIcon filled={feedback().loved} />
          </button>
        </Tooltip>

        <Tooltip
          value={feedback().liked ? i18n.t("ui.message.liked") : i18n.t("ui.message.like")}
          placement="top"
          gutter={4}
        >
          <button
            data-slot="assistant-feedback-btn"
            data-active={feedback().liked ? "" : undefined}
            onClick={toggleLike}
            aria-label={i18n.t("ui.message.like")}
          >
            <ThumbsUpIcon filled={feedback().liked} />
          </button>
        </Tooltip>

        <Tooltip value={i18n.t("ui.message.dislike")} placement="top" gutter={4}>
          <button
            data-slot="assistant-feedback-btn"
            data-active={showDislikeForm() ? "" : undefined}
            onClick={handleDislikeClick}
            aria-label={i18n.t("ui.message.dislike")}
          >
            <ThumbsDownIcon filled={showDislikeForm()} />
          </button>
        </Tooltip>

        <Tooltip value={i18n.t("ui.message.copy")} placement="top" gutter={4}>
          <button
            data-slot="assistant-feedback-btn"
            onClick={handleCopy}
            aria-label={i18n.t("ui.message.copy")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        </Tooltip>

        <Tooltip value={i18n.t("ui.message.report")} placement="top" gutter={4}>
          <button
            data-slot="assistant-feedback-btn"
            onClick={() => window.open(GITHUB_ISSUE_URL, "_blank", "noopener,noreferrer")}
            aria-label={i18n.t("ui.message.report")}
          >
            <FlagIcon />
          </button>
        </Tooltip>
      </div>

      <Show when={showDislikeForm()}>
        <div data-slot="assistant-feedback-form">
          <div data-slot="assistant-feedback-form-title">{i18n.t("ui.message.dislikeTitle")}</div>
          <textarea
            data-slot="assistant-feedback-textarea"
            placeholder={i18n.t("ui.message.dislikePlaceholder")}
            value={dislikeText()}
            onInput={(e) => setDislikeText(e.currentTarget.value)}
            rows={3}
          />
          <div data-slot="assistant-feedback-form-actions">
            <button
              data-slot="assistant-feedback-cancel"
              onClick={handleDislikeCancel}
            >
              {i18n.t("ui.message.dislikeCancel")}
            </button>
            <button
              data-slot="assistant-feedback-submit"
              onClick={handleDislikeSubmit}
              disabled={!dislikeText().trim()}
            >
              {i18n.t("ui.message.dislikeSubmit")}
            </button>
          </div>
        </div>
      </Show>
    </div>
  )
}
