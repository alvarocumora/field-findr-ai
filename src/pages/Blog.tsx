import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

const Blog = () => {
  return (
    <Layout>
      <div className="container py-16 px-4 max-w-3xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Blog</h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Próximamente publicaremos artículos sobre inversión en terrenos, tendencias del mercado y guías para compradores.
          </p>
        </div>

        <Card className="border-border/40 bg-card/50">
          <CardContent className="p-8 space-y-4">
            <Bell className="h-8 w-8 text-primary mx-auto" />
            <h3 className="font-semibold text-foreground">¿Quieres ser el primero en leer?</h3>
            <p className="text-sm text-muted-foreground">
              Regístrate y te avisaremos cuando publiquemos el primer artículo.
            </p>
            <Button asChild>
              <Link to="/auth">Crear cuenta gratis</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Blog;
