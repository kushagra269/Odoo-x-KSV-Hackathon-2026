export function Stepper({ steps, currentStep }) {
  return (
    <div className="stepper">
      {steps.map((step, index) => {
        const position = index + 1;
        const state =
          position < currentStep ? "done" : position === currentStep ? "active" : "upcoming";

        return (
          <div className="stepper__item" key={step.label}>
            <div className={`stepper__bubble stepper__bubble--${state}`}>{position}</div>
            <div className={`stepper__label stepper__label--${state}`}>{step.label}</div>
          </div>
        );
      })}
    </div>
  );
}
