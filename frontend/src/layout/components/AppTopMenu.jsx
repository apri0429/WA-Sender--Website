import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from '@untitledui/icons'

function isItemActive(item, currentPath) {
  if (item.href === currentPath) {
    return true
  }

  return item.children?.some((child) => isItemActive(child, currentPath)) ?? false
}

function TopMenu({ items = [], activePath, mobileOpen = false, onAction, onNavigate }) {
  const [openKey, setOpenKey] = useState(null)
  const navRef = useRef(null)

  useEffect(() => {
    if (!openKey) {
      return undefined
    }

    const handlePointerDown = (event) => {
      if (!navRef.current?.contains(event.target)) {
        setOpenKey(null)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpenKey(null)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [openKey])

  useEffect(() => {
    setOpenKey(null)
  }, [activePath])

  const handleLeaf = (item) => {
    setOpenKey(null)
    onNavigate?.()

    if (item.action) {
      onAction?.(item.action, item)
    }
  }

  return (
    <nav
      ref={navRef}
      className={`ns-menubar${mobileOpen ? ' ns-menubar--open' : ''}`}
      aria-label="Main navigation"
    >
      {items.map((item) => {
        const Icon = item.icon
        const key = item.href ?? item.label
        const hasChildren = item.children?.length > 0
        const active = isItemActive(item, activePath)
        const expanded = openKey === key
        const className = `ns-menu__trigger${active ? ' active' : ''}${expanded ? ' open' : ''}`
        const content = (
          <>
            {item.step ? (
              <span className="ns-step" aria-hidden="true">{item.step}</span>
            ) : Icon ? <Icon size={16} aria-hidden="true" /> : null}
            <span>{item.label}</span>
            {hasChildren ? (
              <ChevronDown size={14} aria-hidden="true" className="ns-menu__chevron" />
            ) : null}
          </>
        )

        return (
          <div
            key={key}
            className={`ns-menu${expanded ? ' ns-menu--open' : ''}`}
            onMouseEnter={hasChildren ? () => setOpenKey(key) : undefined}
            onMouseLeave={hasChildren ? () => setOpenKey(null) : undefined}
          >
            {hasChildren ? (
              <button
                type="button"
                className={className}
                aria-haspopup="menu"
                aria-expanded={expanded}
                onClick={() => setOpenKey(expanded ? null : key)}
              >
                {content}
              </button>
            ) : item.href ? (
              <Link
                to={item.href}
                className={className}
                aria-current={active ? 'page' : undefined}
                onClick={() => handleLeaf(item)}
              >
                {content}
              </Link>
            ) : (
              <button type="button" className={className} onClick={() => handleLeaf(item)}>
                {content}
              </button>
            )}

            {hasChildren ? (
              <div className="ns-menu__dropdown" role="menu">
                {item.children.map((child) => {
                  const ChildIcon = child.icon
                  const childActive = child.href === activePath

                  return (
                    <Link
                      key={child.href ?? child.label}
                      to={child.href}
                      role="menuitem"
                      className={`ns-menu__option${childActive ? ' active' : ''}`}
                      aria-current={childActive ? 'page' : undefined}
                      onClick={() => handleLeaf(child)}
                    >
                      {ChildIcon ? <ChildIcon size={16} aria-hidden="true" /> : null}
                      <span>{child.label}</span>
                    </Link>
                  )
                })}
              </div>
            ) : null}
          </div>
        )
      })}
    </nav>
  )
}

export default TopMenu
