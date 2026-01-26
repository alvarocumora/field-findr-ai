import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Heart, Search, MapPin, TrendingUp, Share2, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Favorites = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const favorites = [
    {
      id: 1,
      title: "Lote 45 - Valle Verde",
      location: "Los Ángeles, Bío Bío",
      area: "5.2 há",
      price: 32500000,
      priceChange: "+5%",
      status: "Disponible",
      image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400",
      savedDate: "2024-11-20",
      notes: "Excelente ubicación cerca de ruta principal",
      views: 234,
      lastViewed: "Hace 2 días"
    },
    {
      id: 2,
      title: "Lote 18 - Los Aromos",
      location: "Nacimiento, Bío Bío",
      area: "3.8 há",
      price: 28000000,
      priceChange: "0%",
      status: "Disponible",
      image: "https://images.unsplash.com/photo-1464817739973-0128fe77aaa1?w=400",
      savedDate: "2024-11-18",
      notes: "Buena topografía, ideal para viñedo",
      views: 189,
      lastViewed: "Hace 5 días"
    },
    {
      id: 3,
      title: "Lote 32 - Pinar del Sol",
      location: "Tucapel, Bío Bío",
      area: "7.5 há",
      price: 45000000,
      priceChange: "-2%",
      status: "Disponible",
      image: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=400",
      savedDate: "2024-11-15",
      notes: "Amplio terreno con bosque nativo",
      views: 312,
      lastViewed: "Ayer"
    },
  ];

  const filteredFavorites = favorites.filter(fav =>
    fav.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fav.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRemoveFavorite = (id: number, title: string) => {
    toast({
      title: "Removido de favoritos",
      description: `${title} ha sido eliminado de tus favoritos`,
    });
  };

  const handleShare = (title: string) => {
    toast({
      title: "Enlace copiado",
      description: `Enlace de ${title} copiado al portapapeles`,
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mis Favoritos</h1>
          <p className="text-muted-foreground">Parcelas guardadas para comparar o revisar después</p>
        </div>
        <Badge variant="secondary" className="text-lg">
          <Heart className="mr-2 h-4 w-4 fill-current" />
          {favorites.length} parcelas
        </Badge>
      </div>

      {/* Búsqueda */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en favoritos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            Comparar Seleccionados
          </Button>
        </div>
      </Card>

      {/* Lista de Favoritos */}
      {filteredFavorites.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredFavorites.map((property) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48">
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-4 right-4" variant="secondary">
                  {property.status}
                </Badge>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-4 left-4"
                  onClick={() => handleRemoveFavorite(property.id, property.title)}
                >
                  <Heart className="h-4 w-4 fill-current" />
                </Button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-1 text-foreground">{property.title}</h3>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <MapPin className="h-4 w-4 mr-1" />
                    {property.location}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-primary">
                      ${(property.price / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-sm text-muted-foreground">{property.area}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={property.priceChange.startsWith("+") ? "destructive" : "default"}>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {property.priceChange}
                    </Badge>
                  </div>
                </div>

                {property.notes && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">Mis notas:</span> {property.notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {property.views}
                    </span>
                    <span>Última visita: {property.lastViewed}</span>
                  </div>
                  <span>Guardado: {new Date(property.savedDate).toLocaleDateString()}</span>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button className="flex-1" variant="default">
                    Ver Detalles
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleShare(property.title)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleRemoveFavorite(property.id, property.title)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Heart className="h-20 w-20 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              {searchTerm ? "No se encontraron resultados" : "No tienes favoritos guardados"}
            </h3>
            <p className="text-muted-foreground max-w-md mb-6">
              {searchTerm
                ? "Intenta con otros términos de búsqueda"
                : "Comienza a explorar parcelas y guarda tus favoritas para revisarlas después"}
            </p>
            {!searchTerm && (
              <Button>
                Explorar Parcelas
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Favorites;
