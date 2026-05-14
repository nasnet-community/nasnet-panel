import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function useApplyDialog(applying: boolean, applied: boolean) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const goToOverview = useCallback(() => {
    if (id) navigate(`/router/${id}`);
  }, [id, navigate]);

  useEffect(() => {
    if (applying) setDialogOpen(true);
  }, [applying]);

  useEffect(() => {
    if (applied) setDialogOpen(true);
  }, [applied]);

  const openDialog = () => setDialogOpen(true);
  const closeDialog = () => {
    if (!applying) setDialogOpen(false);
  };

  return { dialogOpen, openDialog, closeDialog, goToOverview };
}
