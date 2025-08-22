import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartSheet } from '@/components/cart/cart-sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Clock, 
  Phone, 
  Star, 
  Users, 
  Award, 
  Heart,
  ChefHat,
  Utensils,
  Coffee,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const teamMembers = [
  {
    name: 'Chef Alexandru',
    role: 'Head Chef',
    image: 'https://images.pexels.com/photos/4253302/pexels-photo-4253302.jpeg',
    description: 'Experiență de 15 ani în bucătăria internațională',
  },
  {
    name: 'Maria Georgescu',
    role: 'Sous Chef',
    image: 'https://images.pexels.com/photos/5585849/pexels-photo-5585849.jpeg',
    description: 'Specializată în pasta și desert-uri italiene',
  },
  {
    name: 'Andrei Popescu',
    role: 'Manager Restaurant',
    image: 'https://images.pexels.com/photos/5640032/pexels-photo-5640032.jpeg',
    description: 'Pasionat de experiența clientului și serviciu premium',
  },
];

const features = [
  {
    icon: MapPin,
    title: 'Locație Premium',
    description: 'Rooftop exclusiv în centrul Năvodari cu vedere panoramică spectaculoasă'
  },
  {
    icon: ChefHat,
    title: 'Bucătari Profesioniști',
    description: 'Echipă de bucătari cu experiență în bucătăria internațională'
  },
  {
    icon: Utensils,
    title: 'Ingrediente Premium',
    description: 'Folosim doar ingrediente proaspete și de cea mai bună calitate'
  },
  {
    icon: Coffee,
    title: 'Atmosferă Unică',
    description: 'Ambianță relaxantă cu design modern și muzică ambient'
  },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <CartSheet />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg"
              alt="Sky Caffe Interior"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>

          <div className="relative z-10 text-center text-white px-4 max-w-4xl">
            <Badge className="bg-white/20 text-white border-white/30 mb-4">
              Despre noi
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Povestea <span className="text-[hsl(var(--accent))]">Sky Caffe</span>
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 max-w-2xl mx-auto">
              Bistro premium cu experiență culinară unică în centrul Năvodari
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                  Bistro la <span className="text-[hsl(var(--primary))]">înălțime</span>
                </h2>
                <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                  <p>
                    Sky Caffe a luat naștere din pasiunea pentru gastronomia de calitate și 
                    dorința de a crea o experiență culinară memorabilă în inima Năvodari.
                  </p>
                  <p>
                    Situat pe rooftop-ul din centrul orașului, restaurantul nostru oferă 
                    nu doar mâncare delicioasă, ci și o priveliște spectaculoasă care 
                    transformă fiecare masă într-o experiență specială.
                  </p>
                  <p>
                    Echipa noastră de bucătari profesioniști pregătește zilnic preparate 
                    cu ingrediente proaspete, combinând tehnicile tradiționale cu 
                    inovația modernă pentru a vă oferi savori autentice și rafinate.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <Button asChild size="lg">
                    <Link href="/meniu">
                      Explorează meniul
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="tel:0751123456">
                      Rezervă o masă
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <Card className="overflow-hidden">
                      <div className="aspect-square relative">
                        <Image
                          src="https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg"
                          alt="Sky Caffe Food"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </Card>
                    <Card className="overflow-hidden">
                      <div className="aspect-[4/3] relative">
                        <Image
                          src="https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg"
                          alt="Sky Caffe Terrace"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </Card>
                  </div>
                  <div className="space-y-4 pt-8">
                    <Card className="overflow-hidden">
                      <div className="aspect-[4/3] relative">
                        <Image
                          src="https://images.pexels.com/photos/1307698/pexels-photo-1307698.jpeg"
                          alt="Sky Caffe Kitchen"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </Card>
                    <Card className="overflow-hidden">
                      <div className="aspect-square relative">
                        <Image
                          src="https://images.pexels.com/photos/1126728/pexels-photo-1126728.jpeg"
                          alt="Sky Caffe Atmosphere"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Ce ne face <span className="text-[hsl(var(--primary))]">speciali</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Descoperă avantajele care fac din Sky Caffe destinația perfectă pentru experiențe culinare memorabile
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                
                return (
                  <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center">
                        <Icon className="w-8 h-8 text-[hsl(var(--primary))]" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Echipa <span className="text-[hsl(var(--primary))]">Sky Caffe</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Profesioniști pasionați care creează experiențe culinare memorabile zi de zi
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{member.name}</h3>
                    <p className="text-[hsl(var(--primary))] font-medium mb-3">{member.role}</p>
                    <p className="text-muted-foreground text-sm">
                      {member.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="flex items-center justify-center mb-2">
                  <Users className="w-8 h-8 mr-2" />
                  <span className="text-3xl font-bold">2500+</span>
                </div>
                <p className="opacity-90">Clienți mulțumiți</p>
              </div>
              
              <div>
                <div className="flex items-center justify-center mb-2">
                  <Star className="w-8 h-8 mr-2 fill-current" />
                  <span className="text-3xl font-bold">4.9</span>
                </div>
                <p className="opacity-90">Rating mediu</p>
              </div>
              
              <div>
                <div className="flex items-center justify-center mb-2">
                  <Award className="w-8 h-8 mr-2" />
                  <span className="text-3xl font-bold">3</span>
                </div>
                <p className="opacity-90">Ani de experiență</p>
              </div>
              
              <div>
                <div className="flex items-center justify-center mb-2">
                  <Heart className="w-8 h-8 mr-2 fill-current" />
                  <span className="text-3xl font-bold">50+</span>
                </div>
                <p className="opacity-90">Preparate speciale</p>
              </div>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                  Locația <span className="text-[hsl(var(--primary))]">noastră</span>
                </h2>
                
                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <MapPin className="w-6 h-6 text-[hsl(var(--primary))] mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-lg mb-1">Adresa</h3>
                          <p className="text-muted-foreground">
                            Rooftop, etaj 4<br />
                            Centrul Năvodari, România
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <Clock className="w-6 h-6 text-[hsl(var(--primary))] mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-lg mb-1">Program</h3>
                          <p className="text-muted-foreground">
                            Luni – Duminică: 10:00 – 22:30<br />
                            Bucătărie deschisă până la 22:00
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <Phone className="w-6 h-6 text-[hsl(var(--primary))] mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-lg mb-1">Contact</h3>
                          <p className="text-muted-foreground">
                            Telefon: <a href="tel:0751123456" className="text-[hsl(var(--primary))] hover:underline">0751 123 456</a><br />
                            Email: contact@skycaffe.ro
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="relative h-96 lg:h-[500px] rounded-lg overflow-hidden">
                <Image
                  src="https://images.pexels.com/photos/2067396/pexels-photo-2067396.jpeg"
                  alt="Sky Caffe Location"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}