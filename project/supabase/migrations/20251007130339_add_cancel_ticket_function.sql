/*
  # Add ticket cancellation function
  
  1. New Functions
    - `devolver_ingresso_lote` - Returns a cancelled ticket back to the batch inventory
      - Decrements quantidade_vendida by 1 when a ticket is cancelled
      - Ensures inventory is properly updated for resale
  
  2. Purpose
    - Allows users to cancel their tickets
    - Returns the ticket to available inventory
    - Maintains accurate batch inventory counts
*/

CREATE OR REPLACE FUNCTION devolver_ingresso_lote(p_lote_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE lotes
  SET quantidade_vendida = quantidade_vendida - 1
  WHERE id = p_lote_id
    AND quantidade_vendida > 0;
END;
$$;
