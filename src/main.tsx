import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
// v20 type system (LOCKED §3.2): Fraunces (EN display — opsz optical sizing +
// italic pull-quotes), Geist (EN body/UI), IBM Plex Mono (labels + tabular proof
// numbers). KO display is a first-class Pretendard 900 system via the
// :lang(ko) .u-display rule in index.css — not a weak serif fallback.
import '@fontsource-variable/fraunces/standard.css'
import '@fontsource-variable/fraunces/standard-italic.css'
import '@fontsource-variable/geist/wght.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import '@fontsource/ibm-plex-mono/latin-600.css'
// Legacy faces (space-grotesk / permanent-marker / nanum-pen) are removed with
// the room-start gate in the v20-c shell pass; kept here only until then.
import '@fontsource-variable/space-grotesk/index.css'
import '@fontsource/permanent-marker/latin-400.css'
import '@fontsource/nanum-pen-script/400.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
