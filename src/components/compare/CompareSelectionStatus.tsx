import { useCompare } from '@/hooks/useCompare';
import { Button } from '@/components/ui/button';

export function CompareSelectionStatus() {
  const { compareList, selectionCount, isRefreshing, refreshError, refreshSelection, removeUnavailable } = useCompare();
  if (refreshError) return <div role="alert" className="text-sm text-destructive">No pudimos actualizar tu selección. <Button size="sm" variant="outline" onClick={() => void refreshSelection()}>Reintentar selección</Button></div>;
  if (isRefreshing) return <p role="status" className="text-sm text-muted-foreground">Actualizando precios y publicaciones…</p>;
  if (selectionCount > compareList.length) return <div role="status" className="text-sm text-muted-foreground">Algunas publicaciones ya no están disponibles para consulta. <Button size="sm" variant="outline" onClick={removeUnavailable}>Quitar no disponibles</Button></div>;
  return null;
}
