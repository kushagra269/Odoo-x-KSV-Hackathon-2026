export function Field({
  label,
  error,
  textarea = false,
  as: Component,
  className = "",
  hint,
  ...props
}) {
  const Control = Component || (textarea ? "textarea" : "input");

  return (
    <label className="field">
      {label ? <span className="field__label">{label}</span> : null}
      <Control className={`field__control ${className}`.trim()} {...props} />
      {hint ? <span className="field__hint">{hint}</span> : null}
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  );
}
