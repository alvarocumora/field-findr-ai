import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useProjectReviews, useReviewStats, useCreateReview } from '@/hooks/useReviews';
import { useAuth } from '@/hooks/useAuth';
import { Star, MessageSquare, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const StarRating = ({ rating, onRate, interactive = false, size = 'md' }: {
  rating: number;
  onRate?: (r: number) => void;
  interactive?: boolean;
  size?: 'sm' | 'md';
}) => {
  const [hover, setHover] = useState(0);
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          className={cn("transition-colors", interactive && "cursor-pointer hover:scale-110")}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => onRate?.(star)}
        >
          <Star className={cn(
            sizeClass,
            (hover || rating) >= star
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/30"
          )} />
        </button>
      ))}
    </div>
  );
};

interface ProjectReviewsProps {
  projectId: string;
}

export const ProjectReviews = ({ projectId }: ProjectReviewsProps) => {
  const { user } = useAuth();
  const { average, count, distribution, reviews } = useReviewStats(projectId);
  const createReview = useCreateReview();
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [showForm, setShowForm] = useState(false);

  const hasReviewed = reviews.some(r => r.user_id === user?.id);

  const handleSubmit = () => {
    if (newRating === 0) return;
    createReview.mutate(
      { projectId, rating: newRating, comment: newComment },
      { onSuccess: () => { setShowForm(false); setNewRating(0); setNewComment(''); } }
    );
  };

  return (
    <Card className="glass border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Reseñas ({count})
          </CardTitle>
          {user && !hasReviewed && !showForm && (
            <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
              Escribir reseña
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        {count > 0 && (
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{average.toFixed(1)}</p>
              <StarRating rating={Math.round(average)} size="sm" />
              <p className="text-xs text-muted-foreground mt-1">{count} reseña{count !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex-1 space-y-1">
              {distribution.reverse().map(d => (
                <div key={d.star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-muted-foreground">{d.star}</span>
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  <Progress value={d.percentage} className="h-2 flex-1" />
                  <span className="w-6 text-right text-muted-foreground">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New review form */}
        {showForm && (
          <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Tu calificación:</span>
              <StarRating rating={newRating} onRate={setNewRating} interactive />
            </div>
            <Textarea
              placeholder="Comparte tu experiencia con este proyecto (opcional)..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleSubmit} disabled={newRating === 0 || createReview.isPending}>
                {createReview.isPending ? 'Enviando...' : 'Publicar'}
              </Button>
            </div>
          </div>
        )}

        {/* Reviews list */}
        {reviews.length === 0 && !showForm ? (
          <div className="text-center py-6 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sé el primero en dejar una reseña</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.slice(0, 5).map(review => (
              <div key={review.id} className="border-b border-border/50 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} size="sm" />
                    {review.verified_buyer && (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <ShieldCheck className="h-3 w-3" /> Comprador verificado
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: es })}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
