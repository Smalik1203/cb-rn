-- Prevent Fee Payment Overpayment Trigger
-- This trigger ensures that payment amounts cannot exceed the remaining balance
-- Validates component-specific limits when a component is selected
-- Run this in your Supabase SQL editor

-- First, create a function that validates payment amounts
CREATE OR REPLACE FUNCTION prevent_fee_overpayment()
RETURNS TRIGGER AS $$
DECLARE
  v_component_due NUMERIC(12, 2) := 0;
  v_component_paid NUMERIC(12, 2) := 0;
  v_component_remaining NUMERIC(12, 2) := 0;
  v_total_due NUMERIC(12, 2) := 0;
  v_total_paid NUMERIC(12, 2) := 0;
  v_total_remaining NUMERIC(12, 2) := 0;
  v_payment_amount NUMERIC(12, 2);
  v_plan_id UUID;
  v_component_id UUID;
  v_max_amount NUMERIC(12, 2);
BEGIN
  -- Get the payment amount (for INSERT) or the new amount (for UPDATE)
  IF TG_OP = 'INSERT' THEN
    v_payment_amount := NEW.amount_inr;
    v_plan_id := NEW.plan_id;
    v_component_id := NEW.component_type_id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_payment_amount := NEW.amount_inr;
    v_plan_id := NEW.plan_id;
    v_component_id := NEW.component_type_id;
  ELSE
    RETURN NEW; -- For DELETE, no validation needed
  END IF;

  -- Skip validation if there's no plan_id (student has no fee plan set)
  IF v_plan_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate total due from fee plan items
  SELECT COALESCE(SUM(COALESCE(amount_inr, 0) * COALESCE(quantity, 1)), 0)
  INTO v_total_due
  FROM fee_student_plan_items
  WHERE plan_id = v_plan_id;

  -- If total due is 0 or NULL, skip validation (no fee plan items)
  IF v_total_due = 0 OR v_total_due IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate component-specific due if component is selected
  IF v_component_id IS NOT NULL THEN
    SELECT COALESCE(SUM(COALESCE(amount_inr, 0) * COALESCE(quantity, 1)), 0)
    INTO v_component_due
    FROM fee_student_plan_items
    WHERE plan_id = v_plan_id
      AND component_type_id = v_component_id;
  END IF;

  -- Calculate total already paid (excluding current payment for UPDATE)
  SELECT COALESCE(SUM(COALESCE(amount_inr, 0)), 0)
  INTO v_total_paid
  FROM fee_payments
  WHERE student_id = NEW.student_id
    AND school_code = NEW.school_code
    AND (TG_OP = 'INSERT' OR id != NEW.id); -- Exclude current payment for UPDATE

  -- Calculate component-specific paid if component is selected
  IF v_component_id IS NOT NULL AND v_component_due > 0 THEN
    SELECT COALESCE(SUM(COALESCE(amount_inr, 0)), 0)
    INTO v_component_paid
    FROM fee_payments
    WHERE student_id = NEW.student_id
      AND school_code = NEW.school_code
      AND component_type_id = v_component_id
      AND (TG_OP = 'INSERT' OR id != NEW.id); -- Exclude current payment for UPDATE
  END IF;

  -- Calculate remaining balances
  v_component_remaining := v_component_due - v_component_paid;
  v_total_remaining := v_total_due - v_total_paid;

  -- Use component-specific limit if component is selected and has a due amount
  -- Otherwise use total remaining balance
  IF v_component_id IS NOT NULL AND v_component_due > 0 THEN
    v_max_amount := v_component_remaining;
  ELSE
    v_max_amount := v_total_remaining;
  END IF;

  -- Validate that the payment amount doesn't exceed the appropriate limit
  IF v_max_amount > 0 AND v_payment_amount > v_max_amount THEN
    IF v_component_id IS NOT NULL AND v_component_due > 0 THEN
      RAISE EXCEPTION 
        'Payment amount (₹%) exceeds remaining balance for selected component (₹%). Component fee: ₹%, Component paid: ₹%, Component remaining: ₹%',
        v_payment_amount,
        v_component_remaining,
        v_component_due,
        v_component_paid,
        v_component_remaining
      USING ERRCODE = '23514'; -- Check violation
    ELSE
      RAISE EXCEPTION 
        'Payment amount (₹%) exceeds remaining balance (₹%). Total fee: ₹%, Already paid: ₹%, Remaining: ₹%',
        v_payment_amount,
        v_total_remaining,
        v_total_due,
        v_total_paid,
        v_total_remaining
      USING ERRCODE = '23514'; -- Check violation
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger that runs BEFORE INSERT or UPDATE
DROP TRIGGER IF EXISTS check_fee_payment_amount ON fee_payments;
CREATE TRIGGER check_fee_payment_amount
  BEFORE INSERT OR UPDATE OF amount_inr, plan_id, student_id, school_code, component_type_id
  ON fee_payments
  FOR EACH ROW
  EXECUTE FUNCTION prevent_fee_overpayment();

-- Optional: Add a comment explaining the trigger
COMMENT ON TRIGGER check_fee_payment_amount ON fee_payments IS 
  'Prevents payment amounts from exceeding the remaining balance calculated from fee plan items';

