import logoPiagamMark from '../assets/logo-piagam2.png'

// Page backdrop: soft neutral gradient, a faint grid, and the Piagam mark as a watermark.
// Kept quiet on purpose so tables and forms stay the focus.
function BackgroundMain({ position = 'fixed', zIndex = -1 }) {
  return (
    <div aria-hidden="true" style={{ ...styles.root, position, zIndex }}>
      <div style={styles.glow} />
      <div style={styles.grid} />
      <img src={logoPiagamMark} alt="" style={styles.mark} />
    </div>
  )
}

const styles = {
  root: {
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    // same blues as the header gradient (#151f2e > #1c2a3d > #2d5a8a), washed out
    background: 'linear-gradient(150deg, #dbe5f3 0%, #e6edf7 40%, #eff3f9 75%, #f6f8fc 100%)',
  },
  // deeper header-blue glow from the top-left, ties the page to the header
  glow: {
    position: 'absolute',
    top: '-30%',
    left: '-10%',
    width: '90%',
    height: '100%',
    background: 'radial-gradient(closest-side, rgba(28, 82, 153, 0.12) 0%, rgba(18, 59, 112, 0) 100%)',
  },
  // fine dot grid, fading out toward the bottom-right
  grid: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'radial-gradient(rgba(18, 59, 112, 0.12) 1px, transparent 1px)',
    backgroundSize: '22px 22px',
    WebkitMaskImage: 'linear-gradient(135deg, #000 0%, transparent 65%)',
    maskImage: 'linear-gradient(135deg, #000 0%, transparent 65%)',
  },
  mark: {
    position: 'absolute',
    right: '-4%',
    bottom: '-14%',
    width: 'min(620px, 52vw)',
    height: 'auto',
    opacity: 0.34,
    userSelect: 'none',
  },
}

export default BackgroundMain
