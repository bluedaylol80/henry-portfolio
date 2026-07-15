import { domAnimation } from 'framer-motion'

/**
 * Framer-motion feature pack, isolated so the animation runtime code-splits out
 * of the critical bundle (LazyMotion async features — F2 budget). App.tsx kicks
 * the import off at module scope, so the download runs in parallel with first
 * paint instead of blocking it.
 */
export default domAnimation
