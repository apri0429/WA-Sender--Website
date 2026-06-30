import '../../styles/templateStyle/TemplateComponents.css'

function CardBox({
  as: Component = 'article',
  eyebrow,
  title,
  icon,
  value,
  detail,
  state,
  stateVariant,
  actionLabel,
  onAction,
  actionProps,
  disabled = false,
  accentColor,
  children,
  className,
  ...props
}) {
  const hasValue = value !== undefined && value !== null
  const actionButtonProps = actionProps ?? {}
  const {
    className: actionClassNameProp,
    disabled: actionDisabled,
    onClick: actionOnClick,
    type: actionType,
    ...restActionProps
  } = actionButtonProps

  const cardClassName = [
    'dashboard-card',
    disabled ? 'dashboard-card--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const stateClassName = [
    'dashboard-card__state',
    stateVariant ? `dashboard-card__state--${stateVariant}` : '',
    disabled ? 'dashboard-card__state--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const actionClassName = ['dashboard-card__action', actionClassNameProp]
    .filter(Boolean)
    .join(' ')

  return (
    <Component className={cardClassName} {...props}>
      {eyebrow || title || state ? (
        <div className="dashboard-card__meta">
          <div>
            {eyebrow ? <p className="dashboard-card__label">{eyebrow}</p> : null}
            {title ? <h2 className="dashboard-card__title">{title}</h2> : null}
          </div>

          <div className="dashboard-card__meta-right">
            {state ? <span className={stateClassName}>{state}</span> : null}
          </div>
        </div>
      ) : null}

      {hasValue ? <strong className="dashboard-card__value">{value}</strong> : null}
      {detail ? <p className="dashboard-card__detail">{detail}</p> : null}

      {icon ? <div className="dashboard-card__icon">{icon}</div> : null}
      {children}

      {accentColor && (
        <div className="dashboard-card__accent" style={{ background: accentColor }} />
      )}

      {actionLabel ? (
        <button
          type={actionType ?? 'button'}
          className={actionClassName}
          disabled={actionDisabled ?? disabled}
          onClick={actionOnClick ?? onAction}
          {...restActionProps}
        >
          {actionLabel}
        </button>
      ) : null}
    </Component>
  )
}

export default CardBox
