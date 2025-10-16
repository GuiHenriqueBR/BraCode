import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search, Calendar, Shield, Star } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 to-secondary/10 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              Encontre o profissional ideal para seu serviço
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Conectamos você aos melhores profissionais da sua região com segurança e praticidade
            </p>
            
            <div className="flex gap-4 justify-center">
              <Link href="/search">
                <Button size="lg" className="gap-2">
                  <Search className="w-5 h-5" />
                  Buscar Profissionais
                </Button>
              </Link>
              <Link href="/register?type=professional">
                <Button size="lg" variant="outline">
                  Sou Profissional
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Como funciona
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Busque</h3>
              <p className="text-muted-foreground">
                Encontre profissionais qualificados na sua região
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Agende</h3>
              <p className="text-muted-foreground">
                Escolha data e horário disponível em tempo real
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pague Seguro</h3>
              <p className="text-muted-foreground">
                Pagamento protegido e garantido pela plataforma
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para começar?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Cadastre-se agora e encontre o profissional perfeito para você
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary">
              Criar Conta Grátis
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
