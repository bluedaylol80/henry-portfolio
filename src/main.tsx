import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import '@fontsource-variable/space-grotesk/index.css'
// §19.1 start-gate hand lettering — subset-only to keep the bundle lean:
// Permanent Marker latin (EN caps, ~29KB); Nanum Pen Script 400 ships as
// unicode-range splits so the browser fetches ONLY the ~15–30KB range files
// covering the short KO subline — never the 587KB monolith.
import '@fontsource/permanent-marker/latin-400.css'
import '@fontsource/nanum-pen-script/400.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
