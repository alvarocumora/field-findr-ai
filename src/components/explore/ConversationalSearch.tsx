import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Sparkles, Send, Loader2, MapPin, Maximize2, DollarSign, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  title: string;
  location: string;
  price: number;
  area_m2: number | null;
  type: string;
  explanation?: string;
}

interface ConversationalSearchProps {
  onClose?: () => void;
  className?: string;
}

const SUGGESTIONS = [
  "Terreno de 5000m² cerca de Pucón bajo 50 millones",
  "Parcela con bosque nativo en Los Lagos",
  "Sitio industrial en Valparaíso sobre 1 hectárea",
  "Terreno agrícola bajo 30 millones en Maule",
];

const ConversationalSearch = ({ onClose, className }: ConversationalSearchProps) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [aiExplanation, setAiExplanation] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-natural-search', {
        body: { query: q }
      });

      if (error) throw error;

      setResults(data?.results || []);
      setAiExplanation(data?.explanation || '');
    } catch (err) {
      console.error('AI search error:', err);
      setAiExplanation('No pude procesar tu búsqueda. Intenta con otros términos.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(price);

  return (
    <div className={className}>
      {/* Search Input */}
      <div className="relative">
        <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Describe el terreno que buscas con tus propias palabras..."
          className="pl-12 pr-24 h-14 text-base rounded-xl border-2 border-primary/20 focus:border-primary bg-background"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10">
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            onClick={() => handleSearch()}
            disabled={isSearching || !query.trim()}
            size="icon"
            className="h-10 w-10 rounded-lg"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Suggestions */}
      {!hasSearched && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex flex-wrap gap-2"
        >
          {SUGGESTIONS.map((s) => (
            <Badge
              key={s}
              variant="outline"
              className="cursor-pointer hover:bg-primary/10 transition-colors py-1.5 px-3 text-xs"
              onClick={() => { setQuery(s); handleSearch(s); }}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {s}
            </Badge>
          ))}
        </motion.div>
      )}

      {/* AI Explanation */}
      <AnimatePresence>
        {aiExplanation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20"
          >
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground">{aiExplanation}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 space-y-3 max-h-[400px] overflow-y-auto"
          >
            {results.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card
                  className="p-4 cursor-pointer hover:shadow-md transition-all hover:border-primary/30"
                  onClick={() => navigate(`/propiedad/${r.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm line-clamp-1">{r.title}</h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {r.location}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">{r.type}</Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-primary font-semibold">
                      <DollarSign className="h-3.5 w-3.5" />
                      {formatPrice(r.price)}
                    </span>
                    {r.area_m2 && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Maximize2 className="h-3.5 w-3.5" />
                        {r.area_m2.toLocaleString()} m²
                      </span>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {hasSearched && !isSearching && results.length === 0 && !aiExplanation && (
        <p className="mt-4 text-sm text-muted-foreground text-center">No se encontraron resultados.</p>
      )}
    </div>
  );
};

export default ConversationalSearch;
