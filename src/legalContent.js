export const LEGAL_ACCEPTANCE_KEY = 'spider_legal_notice_accepted_v1';
export const LEGAL_ACCEPTANCE_DATE_KEY = 'spider_legal_notice_accepted_at_v1';
export const LEGAL_PAGE_PATH = '/terms-and-licenses';

export const LEGAL_SECTIONS = {
  privacy: [
    'Your chats can be stored locally in this browser when history saving is enabled.',
    'Generation requests, prompts, images, and video jobs may be sent to connected AI services so the app can produce results.',
    'Login uses Firebase Authentication, which is provided by Google.',
    'The app may store local settings, pinned chats, and account snapshots in browser storage to improve continuity.',
  ],
  terms: [
    'You must not use the app for unlawful, abusive, spam, infringing, or harmful activity.',
    'Heavy features such as image, edit, video, and Pro mode may require sign-in and can be rate-limited or restricted.',
    'Generated outputs can be imperfect, inaccurate, or inconsistent and should be reviewed before relying on them.',
    'Third-party models and cloud providers remain subject to their own usage policies and service terms.',
  ],
  licenses: [
    { name: 'Mistral / Ministral models', detail: 'Mistral documents current open community releases in this family under Apache 2.0. Always verify the exact checkpoint or model card used in production.' },
    { name: 'OpenAI open-weight models (gpt-oss)', detail: 'OpenAI states the gpt-oss release is under Apache 2.0.' },
    { name: 'LTX-Video', detail: 'LTX code is published under Apache 2.0, while model weights are distributed under Lightricks model terms / OpenRAIL-style conditions depending on the exact release.' },
    { name: 'FLUX image models', detail: 'FLUX licensing depends on the exact model. FLUX.1 schnell is Apache 2.0, while some other FLUX releases use Black Forest Labs commercial or non-commercial terms.' },
    { name: 'React', detail: 'React is MIT licensed.' },
    { name: 'Firebase and cloud services', detail: 'Firebase and other hosted services are governed by provider service terms, not by a normal open-source software license.' },
    { name: 'Spider SLM and M4 Spider custom components', detail: 'Your in-house Spider components are proprietary unless you choose to publish them under a separate license.' },
  ],
};
