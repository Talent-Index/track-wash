import { Link } from 'react-router-dom';
import { 
  Car, 
  Shield, 
  Clock, 
  Star, 
  Gift, 
  Smartphone, 
  MapPin, 
  ChevronRight,
  Wallet,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/appStore';

const features = [
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: 'Book in Seconds',
    description: 'Choose doorstep or station, pick your package, and pay — all from your phone.',
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: 'Track in Real-time',
    description: 'Watch your detailer en route, in progress, and get notified when done.',
  },
  {
    icon: <Gift className="w-6 h-6" />,
    title: 'Earn Free Washes',
    description: 'Every 10th wash is on us. Your loyalty, our thank you.',
  },
];

const paymentOptions = [
  { icon: <Wallet className="w-5 h-5" />, label: 'Core Wallet', sublabel: 'Pay with USDC' },
  { icon: <Phone className="w-5 h-5" />, label: 'M-Pesa', sublabel: 'Instant STK Push' },
];

const areas = ['Westlands', 'Kilimani', 'CBD', 'Lavington', 'South B/C', 'Karen'];

const trustStrip = [
  { icon: <Clock className="w-4 h-4" />, text: 'Instant payments' },
  { icon: <Shield className="w-4 h-4" />, text: 'Verified detailers' },
  { icon: <Car className="w-4 h-4" />, text: 'Service history per car' },
  { icon: <Gift className="w-4 h-4" />, text: 'Loyalty rewards' },
];

export default function Landing() {
  const { isAuthenticated } = useAppStore();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative gradient-hero overflow-hidden">
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] bg-cover bg-center opacity-5" />
        <div className="container section-padding py-20 lg:py-32 relative">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <MapPin className="w-4 h-4" />
              <span>Now in Nairobi</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Car care,{' '}
              <span className="text-transparent bg-clip-text gradient-primary">on-demand</span>
              <br />
              — Nairobi.
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
              Book doorstep detailing or find trusted stations. Pay with M-Pesa or crypto. 
              Earn a free wash every 10.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={isAuthenticated ? '/booking/new' : '/auth'}>
                <Button className="btn-primary text-base px-8 py-4 h-auto min-w-[180px]">
                  Book a wash
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" className="text-base px-8 py-4 h-auto min-w-[180px] border-2">
                  Become a detailer
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Trust Strip */}
        <div className="bg-card/80 backdrop-blur-sm border-y border-border">
          <div className="container section-padding py-4">
            <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10">
              {trustStrip.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-primary">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-background">
        <div className="container section-padding">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">How TrackWash Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Get your car sparkling clean in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {features.map((feature, i) => (
              <div 
                key={i} 
                className="card-interactive p-6 text-center"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 text-primary-foreground shadow-glow">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Options */}
      <section className="py-20 bg-secondary/30">
        <div className="container section-padding">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Pay Your Way</h2>
              <p className="text-muted-foreground">Flexible payment options for modern Nairobi</p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              {paymentOptions.map((option, i) => (
                <div key={i} className="card-elevated p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    {option.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{option.label}</h3>
                    <p className="text-sm text-muted-foreground">{option.sublabel}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Areas */}
      <section className="py-20 bg-background">
        <div className="container section-padding">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Serving Nairobi</h2>
            <p className="text-muted-foreground">Find detailers and stations across the city</p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3 max-w-2xl mx-auto">
            {areas.map((area) => (
              <Link
                key={area}
                to={`/explore?area=${area}`}
                className="px-5 py-2.5 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground font-medium text-sm transition-all duration-200 hover:scale-105"
              >
                {area}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-secondary/30">
        <div className="container section-padding">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-warning fill-warning" />
              ))}
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">
              "Finally, car care that respects my time!"
            </h3>
            <p className="text-muted-foreground mb-2">— Jane W., Kilimani</p>
            <p className="text-sm text-muted-foreground">
              Join 2,000+ happy customers in Nairobi
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gradient-primary">
        <div className="container section-padding text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready for a spotless ride?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Book your first wash today and experience premium car care
          </p>
          <Link to={isAuthenticated ? '/booking/new' : '/auth'}>
            <Button className="bg-card text-primary hover:bg-card/90 text-base px-8 py-4 h-auto font-semibold shadow-lg">
              Get Started
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container section-padding">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Car className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl text-foreground">TrackWash</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/explore" className="hover:text-foreground transition-colors">Explore</Link>
              <Link to="/auth" className="hover:text-foreground transition-colors">For Detailers</Link>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} TrackWash. Nairobi, Kenya.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
