import { ConditionalLogic, ConditionalRule } from './ConditionalLogicBuilder';

/**
 * Evalúa una regla condicional individual
 */
export const evaluateRule = (
  rule: ConditionalRule,
  formValues: Record<string, any>
): boolean => {
  const fieldValue = formValues[rule.fieldKey];

  switch (rule.operator) {
    case 'equals':
      return fieldValue == rule.value; // Loose equality para manejar strings vs numbers

    case 'notEquals':
      return fieldValue != rule.value;

    case 'contains':
      if (typeof fieldValue === 'string') {
        return fieldValue.toLowerCase().includes(String(rule.value).toLowerCase());
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(rule.value);
      }
      return false;

    case 'greaterThan':
      const numValue = Number(fieldValue);
      const numRuleValue = Number(rule.value);
      return !isNaN(numValue) && !isNaN(numRuleValue) && numValue > numRuleValue;

    case 'lessThan':
      const numVal = Number(fieldValue);
      const numRuleVal = Number(rule.value);
      return !isNaN(numVal) && !isNaN(numRuleVal) && numVal < numRuleVal;

    case 'isEmpty':
      return (
        fieldValue === null ||
        fieldValue === undefined ||
        fieldValue === '' ||
        (Array.isArray(fieldValue) && fieldValue.length === 0)
      );

    case 'isNotEmpty':
      return !(
        fieldValue === null ||
        fieldValue === undefined ||
        fieldValue === '' ||
        (Array.isArray(fieldValue) && fieldValue.length === 0)
      );

    default:
      console.warn(`Unknown operator: ${rule.operator}`);
      return false;
  }
};

/**
 * Evalúa toda la lógica condicional (todas las reglas con AND/OR)
 */
export const evaluateConditionalLogic = (
  logic: ConditionalLogic | null,
  formValues: Record<string, any>
): boolean => {
  if (!logic || !logic.enabled || logic.rules.length === 0) {
    return true; // Si no hay lógica, el campo se muestra por defecto
  }

  const results = logic.rules.map((rule) => evaluateRule(rule, formValues));

  if (logic.logicType === 'AND') {
    return results.every((result) => result);
  } else {
    // OR
    return results.some((result) => result);
  }
};

/**
 * Determina el estado de un campo basado en su lógica condicional
 */
export interface FieldState {
  visible: boolean;
  required: boolean;
  disabled: boolean;
}

export const getFieldState = (
  logic: ConditionalLogic | null,
  formValues: Record<string, any>,
  defaultState: FieldState = { visible: true, required: false, disabled: false }
): FieldState => {
  if (!logic || !logic.enabled || logic.rules.length === 0) {
    return defaultState;
  }

  const conditionMet = evaluateConditionalLogic(logic, formValues);

  // Determinar qué acciones aplicar si la condición se cumple
  const actions = new Set(logic.rules.map((r) => r.action));

  const state: FieldState = { ...defaultState };

  if (conditionMet) {
    if (actions.has('show')) {
      state.visible = true;
    }
    if (actions.has('hide')) {
      state.visible = false;
    }
    if (actions.has('require')) {
      state.required = true;
    }
    if (actions.has('disable')) {
      state.disabled = true;
    }
  }

  return state;
};
